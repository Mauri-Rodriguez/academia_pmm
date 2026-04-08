// ============================================================================
// Archivo: src/controllers/diagnosticoController.js
// Propósito: Manejar la lógica de negocio del examen diagnóstico inicial.
// Requerimiento asociado: RF-02 (Diagnóstico), RF-03 (Ruta Adaptativa) y RF-07 (Gamificación)
// Arquitectura: Integración de Microservicio IA (Flask) y Persistencia en MySQL
// ============================================================================

const PreguntaDiagnostico = require('../models/PreguntaDiagnostico');
const Diagnostico = require('../models/Diagnostico');

exports.obtenerPreguntas = async (req, res) => {
    try {
        const preguntas = await PreguntaDiagnostico.findAll({
            limit: 13,
            attributes: { exclude: ['respuesta_correcta'] } 
        });

        if (!preguntas || preguntas.length === 0) {
            return res.status(404).json({ mensaje: 'No hay preguntas disponibles para el diagnóstico.' });
        }

        res.status(200).json({
            mensaje: 'Preguntas cargadas exitosamente',
            total: preguntas.length,
            data: preguntas
        });
    } catch (error) {
        console.error('Error al obtener preguntas del diagnóstico:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al cargar el examen.' });
    }
};

exports.evaluarDiagnostico = async (req, res) => {
    // Usamos la instancia de sequelize para transacciones y consultas crudas de herencia
    const sequelize = Diagnostico.sequelize; 
    const t = await sequelize.transaction();

    try {
        const id_usuario = req.usuario?.id_usuario || req.user?.id_usuario; 
        const { respuestas } = req.body;

        if (!respuestas || !Array.isArray(respuestas)) {
            return res.status(400).json({ mensaje: 'Formato de respuestas inválido.' });
        }

        // 1. Calificación de Respuestas y Generación de Detalles
        const preguntasDB = await PreguntaDiagnostico.findAll({ raw: true });
        let respuestasCorrectas = 0;
        const totalPreguntas = preguntasDB.length;
        const detalleRespuestas = []; // Arreglo para la revisión en el frontend

        respuestas.forEach(resEstudiante => {
            const preguntaReal = preguntasDB.find(p => p.id_pregunta === resEstudiante.id_pregunta);
            
            if (preguntaReal) {
                const esCorrecta = preguntaReal.respuesta_correcta.trim().toLowerCase() === resEstudiante.respuesta.trim().toLowerCase();
                
                if (esCorrecta) {
                    respuestasCorrectas++;
                }

                // Estructuramos los datos para el pergamino de errores
                detalleRespuestas.push({
                    id_pregunta: preguntaReal.id_pregunta,
                    pregunta: preguntaReal.pregunta,
                    opciones: [
                        { clave: 'opcion_a', texto: preguntaReal.opcion_a },
                        { clave: 'opcion_b', texto: preguntaReal.opcion_b },
                        { clave: 'opcion_c', texto: preguntaReal.opcion_c },
                        { clave: 'opcion_d', texto: preguntaReal.opcion_d }
                    ],
                    respuesta_correcta: preguntaReal.respuesta_correcta, 
                    respuesta_usuario: resEstudiante.respuesta,
                    es_correcta: esCorrecta
                });
            }
        });

        // 2. ORQUESTACIÓN DE MICROSERVICIOS: Llamada a la IA en Flask
        let nivelAsignado = '';
        const mapaNiveles = {
            0: 'Genin (Iniciado)',
            1: 'Chunin (Guerrero)',
            2: 'Jonin (Maestro)'
        };

        try {
            const flaskResponse = await fetch('http://127.0.0.1:5000/api/ia/recomendar-ruta', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ puntaje: respuestasCorrectas })
            });

            if (!flaskResponse.ok) throw new Error('Flask respondió con error');

            const dataIA = await flaskResponse.json();
            nivelAsignado = mapaNiveles[dataIA.nivel_id];

        } catch (errorIA) {
            console.warn("⚠️ IA Flask no responde. Activando algoritmo de respaldo ninja (Fallback)...");
            if (respuestasCorrectas <= 4) nivelAsignado = 'Genin (Iniciado)';
            else if (respuestasCorrectas <= 9) nivelAsignado = 'Chunin (Guerrero)';
            else nivelAsignado = 'Jonin (Maestro)';
        }

        // 3. Guardamos el resultado del Diagnóstico
        await Diagnostico.create({
            id_usuario: id_usuario,
            puntaje_obtenido: respuestasCorrectas, 
            nivel_asignado: nivelAsignado,
            fecha_realizacion: new Date() 
        }, { transaction: t });
        await sequelize.query(
            'UPDATE usuarios SET rango = ?, rango_actual = ? WHERE id_usuario = ?',
            { replacements: [nivelAsignado, nivelAsignado, id_usuario], transaction: t }
        );

        // 🚩 4. LÓGICA DE HERENCIA: Insignias y Progreso Dinámico (RF-07)
        let idsModulosLegacy = [];

        // Definición de jerarquía según los IDs de tu base de datos
        const modulosGenin = [1, 2, 10, 11];
        const modulosChunin = [3, 4, 12, 14, 15, 16, 17, 18, 19];

        if (nivelAsignado.includes('Chunin')) {
            idsModulosLegacy = [...modulosGenin];
        } else if (nivelAsignado.includes('Jonin')) {
            idsModulosLegacy = [...modulosGenin, ...modulosChunin];
        }

        if (idsModulosLegacy.length > 0) {
            // Otorgamos insignias automáticamente
            const queryInsignias = `
                INSERT IGNORE INTO usuarios_insignias (id_usuario, id_insignia, fecha_otorgada)
                VALUES ${idsModulosLegacy.map(id => `(${id_usuario}, ${id}, NOW())`).join(', ')}`;
            
            // Seteamos progreso al 100% para los módulos saltados
            const queryProgreso = `
                INSERT INTO progreso_estudiante (id_usuario, id_modulo, porcentaje_avance, intentos_realizados, ultima_actualizacion)
                VALUES ${idsModulosLegacy.map(id => `(${id_usuario}, ${id}, 100, 1, NOW())`).join(', ')}
                ON DUPLICATE KEY UPDATE porcentaje_avance = 100, ultima_actualizacion = NOW()`;

            await sequelize.query(queryInsignias, { transaction: t });
            await sequelize.query(queryProgreso, { transaction: t });
        }

        await t.commit();

        res.status(200).json({
            mensaje: '¡Diagnóstico evaluado y rango ninja actualizado!',
            resultados: {
                correctas: respuestasCorrectas,
                total: totalPreguntas,
                rango_asignado: nivelAsignado,
                insignias_heredadas: idsModulosLegacy.length
            },
            detalle: detalleRespuestas // <-- Enviamos el detalle al frontend aquí
        });

    } catch (error) {
        if (t) await t.rollback();
        console.error('Error al evaluar el diagnóstico:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al procesar las respuestas.' });
    }
};
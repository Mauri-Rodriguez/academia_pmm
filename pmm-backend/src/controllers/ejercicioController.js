// ============================================================================
// Archivo: src/controllers/ejercicioController.js
// Propósito: Gestionar la entrega de ejercicios y la evaluación de respuestas.
// Requerimientos: RF-04, RF-08 y RF-07 (Gamificación)
// ============================================================================

const Ejercicio = require('../models/Ejercicio');
const ProgresoEstudiante = require('../models/ProgresoEstudiante');
const ResultadoModulo = require('../models/ResultadoModulo');
const Insignia = require('../models/Insignia');
const UsuarioInsignia = require('../models/UsuarioInsignia');

/**
 * Obtiene la lista de ejercicios de un módulo específico, excluyendo la respuesta correcta.
 * @param {import('express').Request} req - Petición Express (params: id_modulo).
 * @param {import('express').Response} res - Respuesta Express.
 * @returns {Promise<void>} JSON con la lista de ejercicios.
 */
exports.obtenerEjerciciosPorModulo = async (req, res) => {
    try {
        const { id_modulo } = req.params;

        const ejercicios = await Ejercicio.findAll({
            where: { id_modulo: id_modulo },
            attributes: { exclude: ['respuesta_correcta'] }, // 🛡️ Evita trampas en el Frontend
            order: [['id_ejercicio', 'ASC']] // 🛡️ MEJORA: Garantiza la secuencia de aprendizaje
        });

        if (!ejercicios || ejercicios.length === 0) {
            return res.status(404).json({ mensaje: 'Aún no hay pergaminos de entrenamiento para este módulo.' });
        }

        res.status(200).json({
            mensaje: 'Ejercicios cargados con éxito.',
            total: ejercicios.length,
            data: ejercicios
        });

    } catch (error) {
        console.error('Error al obtener los ejercicios:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al consultar la biblioteca.' });
    }
};

/**
 * Evalúa la respuesta de un estudiante a un ejercicio, actualiza su progreso y devuelve feedback.
 * @param {import('express').Request} req - Petición Express (body: id_ejercicio, respuesta_estudiante).
 * @param {import('express').Response} res - Respuesta Express.
 * @returns {Promise<void>} JSON con el resultado de la evaluación y estadísticas.
 */
exports.evaluarEjercicio = async (req, res) => {
    try {
        // 🛡️ MEJORA DEFENSIVA: Soporta req.usuario o req.user dependiendo de tu middleware
        const id_usuario = req.usuario?.id_usuario || req.user?.id_usuario; 
        const { id_ejercicio, respuesta_estudiante } = req.body;

        if (!id_usuario) return res.status(401).json({ mensaje: 'Sello de identidad no encontrado.' });
        if (!id_ejercicio || !respuesta_estudiante) {
            return res.status(400).json({ mensaje: 'Faltan datos obligatorios para la evaluación.' });
        }

        const ejercicioDb = await Ejercicio.findByPk(id_ejercicio);
        if (!ejercicioDb) {
            return res.status(404).json({ mensaje: 'El jutsu especificado no existe.' });
        }

        const id_modulo = ejercicioDb.id_modulo;
        // Limpiamos espacios extra y pasamos a minúsculas por si el estudiante escribe " 5 " en vez de "5"
        const esCorrecta = (ejercicioDb.respuesta_correcta.toString().trim().toLowerCase() === respuesta_estudiante.toString().trim().toLowerCase());

        // Registro automático de progreso
        let [progreso, creado] = await ProgresoEstudiante.findOrCreate({
            where: { id_usuario: id_usuario, id_modulo: id_modulo },
            defaults: {
                porcentaje_avance: 0,
                intentos_realizados: 0,
                ultima_actualizacion: new Date()
            }
        });

        progreso.intentos_realizados += 1;
        progreso.ultima_actualizacion = new Date();

        // Calculamos el avance solo si acierta y no ha llegado al 100%
        if (esCorrecta && progreso.porcentaje_avance < 100) {
            const totalEjercicios = await Ejercicio.count({ where: { id_modulo: id_modulo } });
            const valorPorEjercicio = 100 / totalEjercicios;
            
            progreso.porcentaje_avance += valorPorEjercicio;

            // Redondeo de seguridad para evitar flotantes extraños (ej. 99.9999%)
            if (progreso.porcentaje_avance >= 99) {
                progreso.porcentaje_avance = 100;
            }
        }

        await progreso.save();

        const mensajeFeedback = esCorrecta 
            ? '¡Excelente! Respuesta correcta. Dominas este concepto.' 
            : 'Respuesta incorrecta. Revisa tus sellos e inténtalo de nuevo.';

        res.status(200).json({
            es_correcta: esCorrecta,
            mensaje: mensajeFeedback,
            respuesta_correcta: esCorrecta ? ejercicioDb.respuesta_correcta : null, 
            estadisticas_modulo: {
                intentos_totales: progreso.intentos_realizados,
                progreso_actual: Math.round(progreso.porcentaje_avance) + '%'
            }
        });

    } catch (error) {
        console.error('Error al evaluar el ejercicio:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al procesar la respuesta.' });
    }
};

/**
 * Finaliza un módulo para un estudiante, registrando el puntaje final y otorgando una insignia si corresponde.
 * @param {import('express').Request} req - Petición Express (body: id_modulo).
 * @param {import('express').Response} res - Respuesta Express.
 * @returns {Promise<void>} JSON con el resultado de la finalización y la insignia desbloqueada.
 */
exports.finalizarModulo = async (req, res) => {
    try {
        const id_usuario = req.usuario?.id_usuario || req.user?.id_usuario; 
        const { id_modulo } = req.body;

        if (!id_modulo) {
            return res.status(400).json({ mensaje: 'Falta el id_modulo.' });
        }

        // Consultamos el progreso actual
        const progreso = await ProgresoEstudiante.findOne({
            where: { id_usuario: id_usuario, id_modulo: id_modulo }
        });

        if (!progreso) {
            return res.status(404).json({ mensaje: 'No hay progreso registrado para esta misión.' });
        }

        // Guardamos el resultado final
        await ResultadoModulo.create({
            id_usuario: id_usuario,
            id_modulo: id_modulo,
            puntaje_final: progreso.porcentaje_avance,
            fecha_finalizacion: new Date()
        });

        let insigniaOtorgada = null;

        // Gamificación: Si pasa del 60%, le damos la medalla
        if (progreso.porcentaje_avance >= 60) {
            
            const insigniaExistente = await UsuarioInsignia.findOne({
                where: { id_usuario: id_usuario, id_insignia: id_modulo }
            });

            if (!insigniaExistente) {
                await UsuarioInsignia.create({
                    id_usuario: id_usuario,
                    id_insignia: id_modulo, 
                    fecha_otorgada: new Date()
                });

                insigniaOtorgada = await Insignia.findByPk(id_modulo);
            }
        }

        res.status(200).json({
            mensaje: '¡Misión finalizada con éxito!',
            puntaje_final: Math.round(progreso.porcentaje_avance) + '%',
            insignia_desbloqueada: insigniaOtorgada ? {
                nombre: insigniaOtorgada.nombre_insignia,
                descripcion: insigniaOtorgada.descripcion,
                imagen: insigniaOtorgada.imagen
            } : 'No se alcanzó el puntaje mínimo (60%) o ya posees esta insignia.'
        });

    } catch (error) {
        console.error('Error al finalizar el módulo:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al finalizar el módulo.' });
    }
};
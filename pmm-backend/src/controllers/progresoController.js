/**
 * ============================================================================
 * Archivo: src/controllers/progresoController.js
 * Propósito: Gestión lógica del avance estudiantil e insignias instantáneas.
 * ============================================================================
 */

const sequelize = require('../config/database'); 
const ProgresoEstudiante = require('../models/ProgresoEstudiante');
const ResultadoModulo = require('../models/ResultadoModulo');
const Modulo = require('../models/Modulo');
const Diagnostico = require('../models/Diagnostico');

const MAPA_NIVELES = {
    'Genin (Iniciado)': { 
        siguienteNivel: 'Chunin (Intermedio)', 
        insigniaRangoId: 101, 
        mensaje: '¡Has dominado los conceptos básicos! Asciendes al nivel Chunin.' 
    },
    'Chunin (Intermedio)': { 
        siguienteNivel: 'Jonin (Avanzado)', 
        insigniaRangoId: 102, 
        mensaje: '¡Impresionante! Tus habilidades matemáticas han alcanzado el nivel Jonin.' 
    },
    'Jonin (Avanzado)': { 
        siguienteNivel: 'Maestro Kage', 
        insigniaRangoId: 103, 
        mensaje: '¡Eres un maestro absoluto! Has completado el entrenamiento.' 
    },
    // 🚩 AGREGAMOS EL NIVEL FINAL PARA EVITAR EL RESET
    'Maestro Kage': {
        siguienteNivel: null, // Ya no hay más allá
        insigniaRangoId: 103, // Una insignia legendaria extra
        mensaje: '¡Leyenda Viva! Has alcanzado la cima del conocimiento.'
    }
};

/**
 * Actualiza el progreso parcial.
 */
exports.actualizarProgreso = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id_modulo, porcentaje } = req.body;
        const id_usuario = req.user.id_usuario || req.user.id;

        let progreso = await ProgresoEstudiante.findOne({
            where: { id_usuario, id_modulo },
            transaction: t
        });

        if (progreso) {
            if (porcentaje > progreso.porcentaje_avance) progreso.porcentaje_avance = porcentaje;
            progreso.intentos_realizados += 1;
            progreso.ultima_actualizacion = new Date();
            await progreso.save({ transaction: t });
        } else {
            progreso = await ProgresoEstudiante.create({
                id_usuario, id_modulo, porcentaje_avance: porcentaje,
                intentos_realizados: 1, ultima_actualizacion: new Date()
            }, { transaction: t });
        }

        await t.commit();
        res.json({ success: true, data: progreso });
    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ error: "Falla en actualización" });
    }
};

/**
 * FINALIZAR MÓDULO + DESBLOQUEO DE INSIGNIA + EVALUAR ASCENSO.
 */
exports.finalizarModuloYEvaluarAscenso = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id_modulo, puntaje_final } = req.body;
        const id_usuario = req.user.id_usuario || req.user.id;

        // 1. Registrar resultado del examen final
        await ResultadoModulo.create({
            id_usuario,
            id_modulo,
            puntaje_final,
            fecha_finalizacion: new Date()
        }, { transaction: t });

        // 2. Obtener info del módulo
        const moduloActual = await Modulo.findByPk(id_modulo, { transaction: t });
        if (!moduloActual) {
            await t.rollback();
            return res.status(404).json({ error: "Módulo no identificado" });
        }

        // 🚩 NUEVO: RECOMPENSA INMEDIATA (Insignia del Módulo)
        // Se asume que existe una insignia con el mismo ID del módulo o vinculada
        await sequelize.query(
            'INSERT IGNORE INTO Usuarios_Insignias (id_usuario, id_insignia, fecha_otorgada) VALUES (?, ?, NOW())',
            { replacements: [id_usuario, id_modulo], transaction: t }
        );

        const nivelActual = moduloActual.nivel;

        // 3. Auditoría para Ascenso de Rango
        const modulosDelNivel = await Modulo.findAll({ 
            where: { nivel: nivelActual },
            attributes: ['id_modulo'],
            transaction: t 
        });
        
        const idsModulosNivel = modulosDelNivel.map(m => m.id_modulo);
        const totalRequeridos = idsModulosNivel.length;

        const completadosCount = await ResultadoModulo.count({
            distinct: true,
            col: 'id_modulo',
            where: { id_usuario, id_modulo: idsModulosNivel },
            transaction: t
        });

        let huboAscenso = false;
        let datosAscenso = null;

        // 4. Lógica de Subida de Rango
// 4. Lógica de Subida de Rango
        const configSiguiente = MAPA_NIVELES[nivelActual];

        // 🛡️ SEGURIDAD: Si ya no hay niveles superiores (es Maestro Kage), salimos del proceso de ascenso
        if (!configSiguiente || !configSiguiente.siguienteNivel) {
            await t.commit();
            return res.status(200).json({
                success: true,
                mensaje: '¡Ya eres una Leyenda Viva! No hay más rangos que alcanzar.',
                ascenso: false
            });
        }

        // Si hay un nivel siguiente y completó los módulos... procedemos al ascenso
        if (configSiguiente && completadosCount >= totalRequeridos) {
            huboAscenso = true;

            // Update Nivel en Diagnóstico
            await Diagnostico.update(
                { nivel_asignado: configSiguiente.siguienteNivel },
                { where: { id_usuario }, transaction: t }
            );

            // Insertar Insignia de Rango
            await sequelize.query(
                'INSERT IGNORE INTO Usuarios_Insignias (id_usuario, id_insignia, fecha_otorgada) VALUES (?, ?, NOW())',
                { replacements: [id_usuario, configSiguiente.insigniaRangoId], transaction: t }
            );

            datosAscenso = {
                nuevoNivel: configSiguiente.siguienteNivel,
                mensaje: configSiguiente.mensaje,
                insigniaId: configSiguiente.insigniaRangoId
            };
        }

        await t.commit();
        
        console.log(`--- ✅ PROCESO COMPLETADO: Usuario ${id_usuario} ---`);
        console.log(`> Insignia Módulo ${id_modulo}: OTORGADA`);
        if(huboAscenso) console.log(`> ASCENSO A ${datosAscenso.nuevoNivel}: EXITOSO`);

        res.status(200).json({
            success: true,
            mensaje: huboAscenso ? '¡Ascenso de Rango!' : '¡Misión cumplida e insignia obtenida!',
            ascenso: huboAscenso,
            detallesAscenso: datosAscenso
        });

    } catch (error) {
        if (t) await t.rollback();
        console.error("🚨 Error Crítico:", error.stack);
        res.status(500).json({ error: "Falla en el registro de méritos ninja" });
    }
};

/**
 * Recupera el estado de un módulo específico para un usuario.
 */
exports.obtenerEstadoModulo = async (req, res) => {
    try {
        const { id_modulo } = req.params;
        const id_usuario = req.user.id_usuario || req.user.id;
        
        const registro = await ProgresoEstudiante.findOne({ 
            where: { id_usuario, id_modulo } 
        });

        res.json(registro || { porcentaje_avance: 0 });
    } catch (error) {
        console.error("❌ Error en obtenerEstadoModulo:", error);
        res.status(500).json({ error: "Error al consultar estado" });
    }
};
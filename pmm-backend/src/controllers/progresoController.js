/**
 * ============================================================================
 * Archivo: src/controllers/progresoController.js
 * Propósito: Gestión lógica del avance estudiantil y logros (Gamificación).
 * Requerimientos: RF-08, RF-07, HDU-07.
 * ============================================================================
 */

const ProgresoEstudiante = require('../models/ProgresoEstudiante');
const sequelize = require('../config/database'); // Para transacciones y consultas crudas

/**
 * Actualiza el progreso de un módulo e intenta otorgar insignias si se completa.
 * Sigue el flujo de la Figura 4 de la monografía.
 */
exports.actualizarProgreso = async (req, res) => {
    // Iniciamos una transacción para asegurar la integridad entre progreso e insignias
    const t = await sequelize.transaction();

    try {
        const { id_modulo, porcentaje } = req.body;
        const id_usuario = req.user.id_usuario || req.user.id; // Obtenido del token JWT

        if (id_modulo === undefined || porcentaje === undefined) {
            return res.status(400).json({ error: "Datos incompletos para actualizar progreso" });
        }

        // 1. Buscar si existe un registro previo para este módulo y usuario [cite: 556]
        let progreso = await ProgresoEstudiante.findOne({
            where: { id_usuario, id_modulo },
            transaction: t
        });

        if (progreso) {
            // Regla de negocio: El porcentaje solo sube, nunca baja (resiliencia)
            if (porcentaje > progreso.porcentaje_avance) {
                progreso.porcentaje_avance = porcentaje;
            }
            progreso.intentos_realizados += 1; // Incremento automático según RF-08 
            progreso.ultima_actualizacion = new Date();
            await progreso.save({ transaction: t });
        } else {
            // Si es la primera vez que entra al módulo, creamos el registro
            progreso = await ProgresoEstudiante.create({
                id_usuario,
                id_modulo,
                porcentaje_avance: porcentaje,
                intentos_realizados: 1,
                ultima_actualizacion: new Date()
            }, { transaction: t });
        }

        // 2. Lógica de Gamificación (RF-07): Otorgar insignia al llegar al 100% [cite: 438, 536]
        let insigniaNueva = false;
        if (porcentaje >= 100) {
            // Asumimos que id_insignia corresponde al id_modulo para simplificar la asignación
            const id_insignia = id_modulo;

            // Verificamos si ya posee este logro en la tabla pivote Usuarios_Insignias [cite: 556]
            const [yaExiste] = await sequelize.query(
                'SELECT id_usuario FROM Usuarios_Insignias WHERE id_usuario = ? AND id_insignia = ?',
                { replacements: [id_usuario, id_insignia], type: sequelize.QueryTypes.SELECT, transaction: t }
            );

            if (!yaExiste) {
                await sequelize.query(
                    'INSERT INTO Usuarios_Insignias (id_usuario, id_insignia, fecha_otorgada) VALUES (?, ?, NOW())',
                    { replacements: [id_usuario, id_insignia], transaction: t }
                );
                insigniaNueva = true;
            }
        }

        // Confirmamos la operación atómica
        await t.commit();

        res.json({
            success: true,
            message: "Sincronización de chakra exitosa",
            data: {
                nuevoPorcentaje: progreso.porcentaje_avance,
                intentos: progreso.intentos_realizados,
                logroDesbloqueado: insigniaNueva
            }
        });

    } catch (error) {
        // En caso de error, revertimos cualquier cambio en la base de datos
        if (t) await t.rollback();
        console.error("❌ Error en actualizarProgreso:", error);
        res.status(500).json({ error: "Falla en la persistencia del progreso" });
    }
};

/**
 * Obtiene el estado actual de un módulo para retomar la sesión (HDU-07).
 */
exports.obtenerEstadoModulo = async (req, res) => {
    try {
        const { id_modulo } = req.params;
        const id_usuario = req.user.id_usuario || req.user.id;

        const registro = await ProgresoEstudiante.findOne({
            where: { id_usuario, id_modulo }
        });

        res.json(registro || { porcentaje_avance: 0, intentos_realizados: 0 });
    } catch (error) {
        res.status(500).json({ error: "Error al consultar estado del módulo" });
    }
};
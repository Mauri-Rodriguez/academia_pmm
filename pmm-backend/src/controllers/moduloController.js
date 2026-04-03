const Ejercicio = require('../models/Ejercicio');
const ProgresoEstudiante = require('../models/ProgresoEstudiante');
const Diagnostico = require('../models/Diagnostico');
const sequelize = require('../config/database'); // 🚩 ¡ESTA ERA LA PIEZA FALTANTE!

// Obtener ejercicios de un módulo específico
exports.obtenerEjerciciosModulo = async (req, res) => {
    try {
        const { id_modulo } = req.params;
        const ejercicios = await Ejercicio.findAll({ where: { id_modulo } });
        res.status(200).json(ejercicios);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al cargar ejercicios.' });
    }
};

// Actualizar el porcentaje de avance
exports.actualizarProgreso = async (req, res) => {
    try {
        const { id_modulo, porcentaje } = req.body;
        // 🛡️ Doble validación para asegurar que el ID siempre llegue del token
        const id_usuario = req.user?.id_usuario || req.user?.id;

        if (!id_usuario) {
            return res.status(401).json({ mensaje: "Usuario no identificado" });
        }

        // 1. Sincronizamos el progreso del módulo (Upsert)
        await ProgresoEstudiante.upsert({
            id_usuario,
            id_modulo,
            porcentaje_avance: Math.round(porcentaje), // Evitamos decimales molestos
            ultima_actualizacion: new Date()
        });

        // 🚩 CÁLCULO DEL CHAKRA PARA EL DASHBOARD
        // Buscamos todos los registros para promediar el avance total
        const resultados = await ProgresoEstudiante.findAll({
            where: { id_usuario },
            attributes: [
                [sequelize.fn('AVG', sequelize.col('porcentaje_avance')), 'promedio']
            ],
            raw: true
        });

        const nuevoChakraTotal = Math.round(resultados[0]?.promedio || 0);

        // 2. Sincronizamos con la tabla Diagnostico
        // Esto es lo que el Dashboard lee al recargar la página
        await Diagnostico.update(
            { puntaje_promedio: nuevoChakraTotal }, 
            { where: { id_usuario } }
        );

        console.log(`📊 Chakra Sincronizado: ${nuevoChakraTotal}% para Usuario ${id_usuario}`);

        res.json({ 
            success: true,
            mensaje: 'Progreso sincronizado y Chakra total actualizado.',
            chakraTotal: nuevoChakraTotal 
        });

    } catch (error) {
        console.error('❌ Error Crítico en sincronización:', error);
        res.status(500).json({ mensaje: 'Fallo en la sincronización del pergamino de progreso.' });
    }
};
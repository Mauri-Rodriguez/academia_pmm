const Ejercicio = require('../models/Ejercicio');
const ProgresoEstudiante = require('../models/ProgresoEstudiante');
const Diagnostico = require('../models/Diagnostico');
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
        const id_usuario = req.user.id_usuario || req.user.id;

        // 1. Sincronizamos el progreso del módulo (Upsert)
        await ProgresoEstudiante.upsert({
            id_usuario,
            id_modulo,
            porcentaje_avance: porcentaje,
            ultima_actualizacion: new Date()
        });

        // 🚩 CLAVE DE PERSISTENCIA: 
        // Calculamos el promedio actual para que el Dashboard no se resetee
        const resultados = await ProgresoEstudiante.findAll({
            where: { id_usuario },
            attributes: [
                [sequelize.fn('AVG', sequelize.col('porcentaje_avance')), 'promedio']
            ],
            raw: true
        });

        const nuevoChakraTotal = Math.round(resultados[0].promedio || 0);

        // 2. Actualizamos el puntaje en Diagnostico para que el Dashboard lo vea
        // Esto evita que al recargar aparezca 0%
        await Diagnostico.update(
            { puntaje_promedio: nuevoChakraTotal }, 
            { where: { id_usuario } }
        );

        res.json({ 
            mensaje: 'Progreso sincronizado y Chakra total actualizado.',
            chakraTotal: nuevoChakraTotal 
        });

    } catch (error) {
        console.error('❌ Error al sincronizar avance:', error);
        res.status(500).json({ mensaje: 'Fallo en la sincronización del pergamino de progreso.' });
    }
};
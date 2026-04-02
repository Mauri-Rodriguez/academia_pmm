const Ejercicio = require('../models/Ejercicio');
const ProgresoEstudiante = require('../models/ProgresoEstudiante');

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
        const id_usuario = req.user.id_usuario;

        // 🚩 UPSERT: Si existe id_usuario + id_modulo, ACTUALIZA. Si no, CREA.
        // Esto garantiza que solo haya una fila por ninja y módulo.
        await ProgresoEstudiante.upsert({
            id_usuario,
            id_modulo,
            porcentaje_avance: porcentaje,
            ultima_actualizacion: new Date()
        });

        res.json({ mensaje: 'Progreso sincronizado correctamente.' });
    } catch (error) {
        console.error('❌ Error al sincronizar avance:', error);
        res.status(500).json({ mensaje: 'Fallo en la sincronización del pergamino de progreso.' });
    }
};
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

        const [progreso] = await ProgresoEstudiante.findOrCreate({
            where: { id_usuario, id_modulo }
        });

        await progreso.update({
            porcentaje_avance: porcentaje,
            ultima_actualizacion: new Date()
        });

        res.json({ mensaje: 'Progreso guardado.' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al guardar el avance.' });
    }
};
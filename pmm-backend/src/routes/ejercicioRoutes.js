const express = require('express');
const router = express.Router();
const ejercicioController = require('../controllers/ejercicioController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

// Ruta GET para obtener los ejercicios de un módulo (Protegida)
// Usamos :id_modulo como un parámetro dinámico en la URL
router.get('/modulo/:id_modulo', verificarToken, verificarRol(['estudiante']), ejercicioController.obtenerEjerciciosPorModulo);

// Ruta POST para enviar la respuesta de un ejercicio (Protegida)
router.post('/evaluar', verificarToken, verificarRol(['estudiante']), ejercicioController.evaluarEjercicio);
// Ruta POST para finalizar el módulo y calcular insignias
router.post('/finalizar', verificarToken, verificarRol(['estudiante']), ejercicioController.finalizarModulo);

module.exports = router;
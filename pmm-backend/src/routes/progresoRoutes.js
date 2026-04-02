const express = require('express');
const router = express.Router();
const progresoController = require('../controllers/progresoController');

// 🚩 EL PARCHE MAESTRO: Extraemos la función específica con llaves { }
const { verificarToken } = require('../middlewares/authMiddleware');

// 1. Actualizar progreso parcial (mientras hace el módulo)
router.post('/actualizar', verificarToken, progresoController.actualizarProgreso);

// 2. Obtener estado de un módulo
router.get('/estado/:id_modulo', verificarToken, progresoController.obtenerEstadoModulo);

// 3. Finalizar el módulo y revisar si sube de nivel
router.post('/finalizar', verificarToken, progresoController.finalizarModuloYEvaluarAscenso);

module.exports = router;
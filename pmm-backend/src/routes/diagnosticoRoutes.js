// ============================================================================
// Archivo: src/routes/diagnosticoRoutes.js
// Propósito: Definir los endpoints de la API para el módulo de diagnóstico.
// ============================================================================

const express = require('express');
const router = express.Router();
const diagnosticoController = require('../controllers/diagnosticoController');
// Importamos nuestros "guardias de seguridad"
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware'); 

// Ruta: GET /api/diagnostico/preguntas
// Protegida: Solo usuarios con token válido y con rol 'estudiante' pueden pedir el examen
router.get('/preguntas', verificarToken, verificarRol(['estudiante']), diagnosticoController.obtenerPreguntas);

// Ruta: POST /api/diagnostico/evaluar
router.post('/evaluar', verificarToken, verificarRol(['estudiante']), diagnosticoController.evaluarDiagnostico);

module.exports = router;
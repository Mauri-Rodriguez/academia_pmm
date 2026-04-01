const express = require('express');
const router = express.Router();
const docenteController = require('../controllers/docenteController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

// Ruta GET para obtener el listado y progreso de estudiantes
// Protegida: Solo los profesores pueden ver esto
router.get('/resumen-estudiantes', verificarToken, verificarRol(['docente']), docenteController.obtenerResumenEstudiantes);


// Ruta GET para descargar el reporte en Excel (Protegida para docentes)
router.get('/descargar-excel', verificarToken, verificarRol(['docente']), docenteController.descargarReporteExcel);




module.exports = router;
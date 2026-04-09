const express = require('express');
const router = express.Router();
const estudianteController = require('../controllers/estudianteController');
const upload = require('../middlewares/subidaMiddleware');
const { verificarToken } = require('../middlewares/authMiddleware');

// 🔍 DEBUG: Verificación de carga
console.log('--- 🏯 Sistema de Aldea Digital: Rutas Sincronizadas ---');

// --- 📖 RUTAS DE CONSULTA (GET) ---
router.get('/preguntas-diagnostico', estudianteController.obtenerPreguntasDiagnostico);
router.get('/dashboard', verificarToken, estudianteController.obtenerDashboard);
router.get('/ranking', verificarToken, estudianteController.obtenerRanking);
router.get('/biblioteca', verificarToken, estudianteController.obtenerBiblioteca);
router.get('/modulo/:id_modulo/ejercicios', verificarToken, estudianteController.obtenerEjerciciosModulo);
router.get('/errores-recientes', verificarToken, estudianteController.obtenerErroresRecientes);
router.get('/sugerencia-ia', verificarToken, estudianteController.obtenerSugerenciaIA);

// 👤 Perfil y Notificaciones
router.get('/perfil/datos', verificarToken, estudianteController.obtenerPerfil);
router.get('/notificaciones', verificarToken, estudianteController.obtenerNotificaciones);
router.put('/notificaciones/:id/leer', verificarToken, estudianteController.marcarNotificacionLeida);

// 💬 Foro
router.get('/foro/temas', verificarToken, estudianteController.obtenerTemasForo);
router.get('/foro/comentarios/:id_post', verificarToken, estudianteController.obtenerComentarios);

// La ruta blindada definitiva:
router.post('/tutor-ia', verificarToken, estudianteController.consultarOraculo);
// 🚩 CORREGIDO: Apuntando a la función real del controlador
router.post('/diagnostico', verificarToken, estudianteController.guardarDiagnostico);
router.post('/actualizar-progreso', verificarToken, estudianteController.actualizarProgreso);
router.post('/registrar-fallo', verificarToken, estudianteController.registrarFallo);
router.post('/finalizar', verificarToken, estudianteController.finalizarModulo);
// 🚩 GESTIÓN DE AVATAR
router.post('/perfil/avatar', verificarToken, (req, res, next) => {
    upload.single('avatar')(req, res, function (err) {
        if (err) return res.status(400).json({ error: "Error de Multer: " + err.message });
        next();
    });
}, estudianteController.actualizarAvatar);

// 🚩 GESTIÓN DE FORO
router.post('/foro/crear', verificarToken, (req, res, next) => {
    upload.single('imagen')(req, res, function (err) {
        if (err) return res.status(400).json({ error: "Error al procesar imagen: " + err.message });
        next();
    });
}, estudianteController.crearMisionForo);

router.post('/foro/comentar', verificarToken, estudianteController.comentarMision);
router.put('/foro/comentario/:id_comentario', verificarToken, estudianteController.editarComentario);
router.delete('/foro/comentario/:id_comentario', verificarToken, estudianteController.eliminarComentario);
router.delete('/foro/post/:id_post', verificarToken, estudianteController.eliminarMision);

// Marcar notificaciones como leídas
router.put('/notificaciones/:id/leida', verificarToken, estudianteController.marcarNotificacionLeida);

module.exports = router;
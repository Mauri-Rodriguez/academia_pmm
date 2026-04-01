// 1. IMPORTACIONES PRIMERO
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
const { literal } = require('sequelize');
const db = require('../config/database');

// 2. IMPORTACIÓN DE MODELOS
const Diagnostico = require('../models/Diagnostico');
const Modulo = require('../models/Modulo');
const PreguntaDiagnostico = require('../models/PreguntaDiagnostico');
const Ejercicio = require('../models/Ejercicio');
const ProgresoEstudiante = require('../models/ProgresoEstudiante');
const Usuario = require('../models/Usuario');
const HistorialError = require('../models/HistorialError');

// 3. CONFIGURACIÓN DE INSTANCIAS (Aquí es donde estaba el error)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // 🚩 Movido aquí abajo

const TOTAL_PREGUNTAS = 13;

// 4. FUNCIONES HELPER
// --- 1. GESTIÓN DE ERRORES E IA ---
const jwt = require('jsonwebtoken');

const extraerIdUsuario = (req) => {
    try {
        // 1. Obtener el encabezado
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            console.log("❌ No se encontró el encabezado Authorization");
            return null;
        }

        // 2. Separar 'Bearer [TOKEN]'
        const token = authHeader.split(' ')[1];
        if (!token) {
            console.log("❌ Token malformado");
            return null;
        }

        // 3. Verificar y decodificar
        // Asegúrate de que process.env.JWT_SECRET sea el mismo que usas al firmar
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Importante: Verifica si el ID viene como 'id', 'id_usuario' o 'id_persona'
        return decoded.id_usuario || decoded.id; 
    } catch (err) {
        console.log("❌ Error al verificar token:", err.message);
        return null;
    }
};
exports.registrarFallo = async (req, res) => {
    try {
        const { id_pregunta, respuesta_dada } = req.body;
        const id_usuario = extraerIdUsuario(req);

        const preguntaDB = await Ejercicio.findByPk(id_pregunta);
        if (!preguntaDB) return res.status(404).json({ error: "Pregunta no hallada" });

        // 🚩 BLINDAJE ANTI-UNDEFINED: Solo agrega "opcion_" si no lo tiene ya
        const formatColumna = (val) => {
            const str = String(val).toLowerCase().trim();
            return str.includes('opcion_') ? str : `opcion_${str}`;
        };

        const columnaDada = formatColumna(respuesta_dada);
        const columnaCorrecta = formatColumna(preguntaDB.respuesta_correcta);

        const textoRespuestaAlumno = preguntaDB[columnaDada]; 
        const textoRespuestaCorrecta = preguntaDB[columnaCorrecta];

        console.log("\n--- 🤖 PREPARANDO CHAKRA DE IA ---");
        console.log("El alumno marcó:", textoRespuestaAlumno);
        console.log("La correcta era:", textoRespuestaCorrecta);
        console.log("----------------------------------\n");

        const prompt = `
        Eres un tutor experto en matemáticas universitarias.
        - Ejercicio: "${preguntaDB.pregunta}"
        - Lo que marcó el estudiante (INCORRECTO): "${textoRespuestaAlumno}"
        - La respuesta que debía marcar (CORRECTO): "${textoRespuestaCorrecta}"

        Explica el error conceptual en MÁXIMO 2 oraciones.
        Termina con una "💡 Pista Ninja" motivadora.
        `;

        let explicacionIA = "Verifica los signos y las operaciones básicas.";
        
        try {
            console.log("⏳ Invocando al Oráculo (Gemini 2.5 Flash Vía HTTP Directa)...");
            
            // 🚩 BYPASS LIMPIO: Usamos el modelo exacto que tienes habilitado
            const nombreModelo = "gemini-2.5-flash";
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${nombreModelo}:generateContent?key=${process.env.GEMINI_API_KEY}`;
            
            // Petición directa y limpia con Axios
            const response = await axios.post(url, {
                contents: [{ parts: [{ text: prompt }] }]
            }, {
                headers: { 'Content-Type': 'application/json' }
            });
            
            explicacionIA = response.data.candidates[0].content.parts[0].text;
            console.log("✅ ¡Explicación generada con éxito por Gemini 2.5!");

        } catch (err) {
            // 🚩 Log del error real de Google para diagnóstico
            if (err.response && err.response.data) {
                console.error("🚨 ERROR REAL DE GOOGLE:", JSON.stringify(err.response.data, null, 2));
            } else {
                console.error("🚨 ERROR DE RED:", err.message);
            }
            explicacionIA = "Tu chakra se desvió un poco. Recuerda revisar los conceptos base de este pergamino.";
        }

        // 💾 Guardamos en la base de datos
        await HistorialError.create({
            id_usuario,
            id_pregunta,
            respuesta_dada: columnaDada, 
            explicacion_ia: explicacionIA,
            fecha_error: new Date()
        });

        return res.status(201).json({ explicacion_ia: explicacionIA });

    } catch (e) {
        console.error("🚨 ERROR GENERAL EN registrarFallo:", e);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
exports.obtenerErroresRecientes = async (req, res) => {
    try {
        const id_usuario = extraerIdUsuario(req);
        
        const errores = await db.query(
            `SELECT h.fecha_error, h.respuesta_dada AS respuesta_incorrecta, 
                    h.explicacion_ia, /* 🚩 ESTA LÍNEA ES LA QUE TRAE EL TEXTO DE GEMINI */
                    e.pregunta AS pregunta_texto, e.respuesta_correcta, 
                    m.nombre_modulo AS tema_modulo
             FROM historial_errores h
             JOIN ejercicios e ON h.id_pregunta = e.id_ejercicio
             JOIN modulos m ON e.id_modulo = m.id_modulo
             WHERE h.id_usuario = ?
             ORDER BY h.fecha_error DESC LIMIT 10`,
            { replacements: [id_usuario], type: db.QueryTypes.SELECT }
        );

        return res.json(errores);
    } catch (e) {
        console.error("Error al traer historial:", e);
        return res.status(500).json({ error: 'Error al consultar bitácora' });
    }
};
// --- 2. DIAGNÓSTICO Y RUTA ADAPTATIVA ---

exports.obtenerPreguntasDiagnostico = async (req, res) => {
    try {
        const preguntas = await PreguntaDiagnostico.findAll();
        return res.json(preguntas);
    } catch (e) { res.status(500).json({ mensaje: 'Error al cargar preguntas' }); }
};

exports.guardarDiagnostico = async (req, res) => {
    try {
        let { puntaje } = req.body;
        const id_usuario = extraerIdUsuario(req);
        const aciertosReales = puntaje > TOTAL_PREGUNTAS ? Math.round((puntaje / 100) * TOTAL_PREGUNTAS) : puntaje;
        
        // Conexión con motor de Python para clasificación de nivel
        const resIA = await axios.post('http://127.0.0.1:5000/api/ia/recomendar-ruta', { puntaje: aciertosReales });
        const mapa = { 0: 'Genin (Iniciado)', 1: 'Chunin (Guerrero)', 2: 'Jonin (Maestro)' };
        const rango = mapa[resIA.data.nivel_id] || 'Genin (Iniciado)';

        const nuevo = await Diagnostico.create({ id_usuario, puntaje_obtenido: aciertosReales, nivel_asignado: rango, fecha_realizacion: new Date() });
        return res.status(201).json(nuevo);
    } catch (e) { res.status(500).json({ mensaje: 'Error al guardar test' }); }
};

// --- 3. DASHBOARD Y PROGRESO ---

// --- 3. DASHBOARD Y PROGRESO (VERSION SENIOR DINÁMICA) ---

exports.obtenerDashboard = async (req, res) => {
    try {
        const id_usuario = extraerIdUsuario(req);
        if (!id_usuario) return res.status(401).json({ mensaje: "Sesión inválida." });

        // 1. Obtenemos el último diagnóstico para saber el nivel
        const diag = await Diagnostico.findOne({ 
            where: { id_usuario }, 
            order: [['fecha_realizacion', 'DESC']] 
        });
        
        if (!diag) return res.status(403).json({ mensaje: 'Falta diagnóstico.' });

        const nivelIA = diag.nivel_asignado;

        // 🚩 2. CONSULTAS EN PARALELO (Máxima eficiencia para tu tesis)
        const [modulos, todasInsignias, insigniasGanadas] = await Promise.all([
            // Consulta A: Módulos de la ruta actual
            Modulo.findAll({ where: { nivel: nivelIA } }),
            
            // Consulta B: El catálogo maestro de las 22 insignias (Para el Cofre)
            db.query(`SELECT id_insignia, nombre_insignia, descripcion, imagen FROM Insignias`, 
                { type: db.QueryTypes.SELECT }),
            
            // Consulta C: Las insignias que este ninja ya posee
            db.query(`SELECT id_insignia FROM Usuarios_Insignias WHERE id_usuario = ?`, 
                { replacements: [id_usuario], type: db.QueryTypes.SELECT })
        ]);

        // 3. Calculamos el progreso individual de cada módulo de la ruta
        const rutaConProgreso = await Promise.all(modulos.map(async (m) => {
            const p = await ProgresoEstudiante.findOne({ 
                where: { id_usuario, id_modulo: m.id_modulo } 
            });
            return { 
                ...m.get({ plain: true }), 
                porcentaje_avance: p ? Math.round(p.porcentaje_avance) : 0 
            };
        }));

        // 🚩 4. RESPUESTA DINÁMICA: Este objeto debe coincidir con tu DashboardEstudiante.jsx
        return res.json({
            estadisticas: {
                rango_actual: nivelIA,
                puntaje: diag.puntaje_obtenido,
                efectividad_global: Math.round((diag.puntaje_obtenido / TOTAL_PREGUNTAS) * 100),
                modulos_completados: rutaConProgreso.filter(m => m.porcentaje_avance === 100).length,
                total_misiones: rutaConProgreso.length
            },
            ruta_ia_asignada: rutaConProgreso,
            todas_insignias: todasInsignias,        // 👈 LISTA COMPLETA DE LA DB
            insignias_obtenidas: insigniasGanadas    // 👈 LOGROS REALES DEL USUARIO
        });

    } catch (e) { 
        console.error("❌ Error en el motor del Dashboard:", e);
        res.status(500).json({ mensaje: 'Error al invocar los pergaminos del dashboard' }); 
    }
};

exports.actualizarProgreso = async (req, res) => {
    try {
        const { id_modulo, porcentaje } = req.body;
        const id_usuario = extraerIdUsuario(req);
        const [progreso, created] = await ProgresoEstudiante.findOrCreate({
            where: { id_usuario, id_modulo },
            defaults: { porcentaje_avance: porcentaje, intentos_realizados: 1, ultima_actualizacion: new Date() }
        });

        if (!created) {
            await progreso.update({ 
                porcentaje_avance: porcentaje, 
                intentos_realizados: progreso.intentos_realizados + 1,
                ultima_actualizacion: new Date()
            });
        }
        return res.json({ mensaje: 'OK' });
    } catch (e) { res.status(500).json({ mensaje: 'Error progreso' }); }
};

// --- 4. CONTENIDO Y SOCIAL ---

exports.obtenerBiblioteca = async (req, res) => {
    try {
        const id_usuario = extraerIdUsuario(req);
        const diag = await Diagnostico.findOne({ where: { id_usuario }, order: [['fecha_realizacion', 'DESC']] });
        const nivelDetectado = diag ? diag.nivel_asignado : 'Genin (Iniciado)';

        let nivelesPermitidos = ['Genin (Iniciado)', 'Bajo'];
        if (nivelDetectado.includes('Chunin') || nivelDetectado.includes('Intermedio')) nivelesPermitidos.push('Chunin (Guerrero)', 'Intermedio');
        if (nivelDetectado.includes('Jonin') || nivelDetectado.includes('Alto')) nivelesPermitidos.push('Chunin (Guerrero)', 'Intermedio', 'Jonin (Maestro)', 'Alto');

        const pergaminos = await db.query(
            "SELECT * FROM biblioteca_pergaminos WHERE nivel_requerido IN (?) ORDER BY id_pergamino DESC",
            { replacements: [nivelesPermitidos], type: db.QueryTypes.SELECT }
        );
        return res.json(pergaminos);
    } catch (e) { res.status(500).json({ mensaje: 'Error en biblioteca' }); }
};

exports.obtenerEjerciciosModulo = async (req, res) => {
    try {
        const ejercicios = await Ejercicio.findAll({ where: { id_modulo: req.params.id_modulo } });
        return res.json(ejercicios);
    } catch (e) { res.status(500).json({ mensaje: 'Error en ejercicios' }); }
};

exports.obtenerRanking = async (req, res) => {
    try {
        const ranking = await Usuario.findAll({
            attributes: ['nombre_completo', 
                [literal(`(SELECT COUNT(*) FROM progreso_estudiante WHERE id_usuario = Usuario.id_usuario AND porcentaje_avance = 100)`), 'misiones_completas'],
                [literal(`(SELECT nivel_asignado FROM diagnostico WHERE id_usuario = Usuario.id_usuario ORDER BY fecha_realizacion DESC LIMIT 1)`), 'rango']
            ],
            where: { rol: 'estudiante' },
            order: [[literal('misiones_completas'), 'DESC']],
            limit: 10
        });
        return res.json(ranking);
    } catch (e) { res.status(500).json({ mensaje: 'Error en ranking' }); }
};


exports.crearMisionForo = async (req, res) => {
    try {
        // Log para ver qué llega realmente
        console.log("--- DEBUG FORO ---");
        console.log("Body:", req.body); 
        console.log("File:", req.file);

        // Si req.body es undefined, es que Multer no se ejecutó bien en la ruta
        if (!req.body || !req.body.titulo) {
            return res.status(400).json({ 
                error: "El servidor recibió un paquete vacío. Revisa el nombre de los campos." 
            });
        }

        const { titulo, contenido } = req.body;
        const id_usuario = extraerIdUsuario(req);
        
        // Si hay archivo, guardamos la ruta. Si no, null.
        const imagen_url = req.file ? `/uploads/${req.file.filename}` : null;

        await db.query(
            "INSERT INTO foro_posts (id_usuario, titulo, contenido, imagen_url) VALUES (?, ?, ?, ?)",
            { replacements: [id_usuario, titulo, contenido, imagen_url] }
        );

        res.json({ mensaje: "Misión publicada con éxito." });
    } catch (error) {
        console.error("Error crítico:", error);
        res.status(500).json({ error: "Falla interna en el servidor." });
    }
};

exports.obtenerTemasForo = async (req, res) => {
    try {
        // 🚩 ESPECIFICAMOS CADA CAMPO para evitar que se pierda el id_usuario en el JOIN
        const temas = await db.query(
            `SELECT 
                p.id_post, 
                p.id_usuario, 
                p.titulo, 
                p.contenido, 
                p.imagen_url, 
                p.fecha_creacion, 
                u.nombre_completo AS autor 
             FROM foro_posts p 
             JOIN usuarios u ON p.id_usuario = u.id_usuario 
             ORDER BY p.fecha_creacion DESC`,
            { type: db.QueryTypes.SELECT }
        );
        res.json(temas);
    } catch (error) {
        console.error("Error al obtener temas:", error);
        res.status(500).json({ error: "Error al leer el libro" });
    }
};

// Guardar una respuesta nueva
exports.comentarMision = async (req, res) => {
    try {
        const { id_post, comentario } = req.body;
        const id_usuario = extraerIdUsuario(req); // Usamos la función que ya arreglamos

        if (!id_usuario) return res.status(401).json({ error: "Sesión inválida" });

        await db.query(
            "INSERT INTO foro_comentarios (id_post, id_usuario, comentario) VALUES (?, ?, ?)",
            { replacements: [id_post, id_usuario, comentario] }
        );

        res.json({ mensaje: "Respuesta enviada al pergamino con éxito" });
    } catch (error) {
        console.error("Error al comentar:", error);
        res.status(500).json({ error: "No se pudo publicar la respuesta" });
    }
};

// Traer todas las respuestas de una misión
exports.obtenerComentarios = async (req, res) => {
    try {
        const { id_post } = req.params;
        // 🚩 ASEGURAMOS que c.id_usuario se envíe explícitamente
        const comentarios = await db.query(
            `SELECT 
                c.id_comentario, 
                c.id_post, 
                c.id_usuario, 
                c.comentario, 
                c.fecha_comentario, 
                u.nombre_completo AS autor 
             FROM foro_comentarios c
             JOIN usuarios u ON c.id_usuario = u.id_usuario
             WHERE c.id_post = ?
             ORDER BY c.fecha_comentario ASC`,
            { replacements: [id_post], type: db.QueryTypes.SELECT }
        );
        res.json(comentarios);
    } catch (error) {
        console.error("Error al obtener comentarios:", error);
        res.status(500).json({ error: "Error al leer respuestas" });
    }
};
// --- EDITAR COMENTARIO ---
exports.editarComentario = async (req, res) => {
    try {
        const { id_comentario } = req.params;
        const { nuevoContenido } = req.body;
        const id_usuario = extraerIdUsuario(req);

        // Solo el autor puede editar su propio pergamino
        const result = await db.query(
            "UPDATE foro_comentarios SET comentario = ? WHERE id_comentario = ? AND id_usuario = ?",
            { replacements: [nuevoContenido, id_comentario, id_usuario] }
        );

        res.json({ mensaje: "Pergamino reescrito con éxito" });
    } catch (error) {
        res.status(500).json({ error: "Falla al editar el rastro" });
    }
};

// --- ELIMINAR COMENTARIO ---
exports.eliminarComentario = async (req, res) => {
    try {
        const { id_comentario } = req.params;
        const id_usuario = extraerIdUsuario(req);

        await db.query(
            "DELETE FROM foro_comentarios WHERE id_comentario = ? AND id_usuario = ?",
            { replacements: [id_comentario, id_usuario] }
        );

        res.json({ mensaje: "Comentario desvanecido" });
    } catch (error) {
        res.status(500).json({ error: "No se pudo eliminar el comentario" });
    }
};

exports.eliminarMision = async (req, res) => {
    try {
        const { id_post } = req.params;
        const id_usuario = extraerIdUsuario(req);

        // Primero borramos comentarios asociados (Integridad referencial manual)
        await db.query("DELETE FROM foro_comentarios WHERE id_post = ?", { replacements: [id_post] });
        
        // Luego borramos el post solo si el usuario es el dueño
        const result = await db.query(
            "DELETE FROM foro_posts WHERE id_post = ? AND id_usuario = ?",
            { replacements: [id_post, id_usuario] }
        );

        res.json({ mensaje: "Misión eliminada del pergamino" });
    } catch (error) {
        console.error("Error al eliminar post:", error);
        res.status(500).json({ error: "No se pudo eliminar la misión" });
    }
};

exports.editarComentario = async (req, res) => {
    try {
        const { id_comentario } = req.params;
        const { nuevoContenido } = req.body;
        const id_usuario = extraerIdUsuario(req);

        await db.query(
            "UPDATE foro_comentarios SET comentario = ? WHERE id_comentario = ? AND id_usuario = ?",
            { replacements: [nuevoContenido, id_comentario, id_usuario] }
        );

        res.json({ mensaje: "Pergamino reescrito con éxito" });
    } catch (error) {
        res.status(500).json({ error: "Falla al editar" });
    }
};


// --- ELIMINAR COMENTARIO ---
exports.eliminarComentario = async (req, res) => {
    try {
        const { id_comentario } = req.params;
        const id_usuario = extraerIdUsuario(req);

        await db.query(
            "DELETE FROM foro_comentarios WHERE id_comentario = ? AND id_usuario = ?",
            { replacements: [id_comentario, id_usuario] }
        );

        res.json({ mensaje: "Comentario desvanecido" });
    } catch (error) {
        res.status(500).json({ error: "No se pudo eliminar" });
    }
};

// 1. Obtener datos reales del perfil
// 🚩 1. Obtener datos detallados del perfil
exports.obtenerPerfil = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario || req.user.id;
        
        // 🚩 CONSULTA SIMPLE: Solo lo básico de la identidad
        const [rows] = await db.query(
            'SELECT nombre_completo, correo, foto_perfil FROM usuarios WHERE id_usuario = ?',
            { replacements: [id_usuario], type: db.QueryTypes.SELECT }
        );

        if (!rows) return res.status(404).json({ mensaje: "Ninja no encontrado" });
        
        res.json(rows);
    } catch (error) {
        console.error("❌ Error en obtenerPerfil:", error);
        res.status(500).send("Error interno");
    }
};
// 🚩 2. Obtener Notificaciones reales del usuario
exports.obtenerNotificaciones = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario || req.user.id;
        const [rows] = await db.query(
            'SELECT * FROM notificaciones WHERE id_usuario = ? ORDER BY fecha_creacion DESC LIMIT 15', 
            [id_usuario]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).send("Error al obtener alertas");
    }
};
// 🚩 3. Marcar notificación como leída (LA QUE CAUSÓ EL ERROR)
exports.marcarNotificacionLeida = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE notificaciones SET leida = 1 WHERE id_notificacion = ?', [id]);
        res.json({ mensaje: "Notificación actualizada" });
    } catch (error) {
        res.status(500).send("Error al actualizar");
    }
};

// 🚩 4. Actualizar Avatar
// 🚩 REEMPLAZA ESTA FUNCIÓN EN TU CONTROLADOR
exports.actualizarAvatar = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario || req.user.id;
        
        if (!req.file) return res.status(400).json({ error: "No se recibió imagen" });
        
        const urlImagen = `/uploads/${req.file.filename}`;
        
        // 🚩 CORRECCIÓN CRÍTICA: Usar 'replacements' para Sequelize
        await db.query(
            'UPDATE usuarios SET foto_perfil = ? WHERE id_usuario = ?', 
            {
                replacements: [urlImagen, id_usuario],
                type: db.QueryTypes.UPDATE
            }
        );
        
        res.json({ mensaje: "¡Sello actualizado!", url: urlImagen });
    } catch (error) {
        console.error("❌ Error en actualizarAvatar:", error);
        res.status(500).send("Error interno al guardar avatar");
    }
};

// 🚩 NUEVA FUNCIÓN: Motor de Sugerencias con Inteligencia Artificial (Gemini)

exports.obtenerSugerenciaIA = async (req, res) => {
    try {
        const userPayload = req.user || req.usuario;
        const id_usuario = userPayload.id_usuario || userPayload.id;

        // 1. Consulta SQL (Ya validada y funcionando)
        const resultados = await db.query(
            `SELECT 
                m.nombre_modulo AS tema, 
                e.pregunta AS pregunta_texto, 
                f.respuesta_dada AS respuesta_incorrecta
             FROM historial_errores f 
             JOIN ejercicios e ON f.id_pregunta = e.id_ejercicio
             JOIN modulos m ON e.id_modulo = m.id_modulo
             WHERE f.id_usuario = ? 
             ORDER BY f.id_error DESC LIMIT 1`,
            { replacements: [id_usuario], type: db.QueryTypes.SELECT }
        );

        if (!resultados || resultados.length === 0) {
            return res.json({
                tema: "Entrenamiento General",
                mensaje: "Tu chakra matemático está en equilibrio. No he detectado fallas en tus pergaminos recientes.",
                nivel_alerta: "optimo",
                accion: "Continuar Ruta"
            });
        }

        const errorActual = resultados[0];
        const promptNinja = `
            Actúa como el Maestro Sabio de la Aldea Digital. 
            Analiza este error matemático de un estudiante:
            - Tema: ${errorActual.tema}
            - Pregunta fallida: "${errorActual.pregunta_texto}"
            - Respuesta del alumno: "${errorActual.respuesta_incorrecta}"
            Instrucciones: Mensaje motivador de 2 líneas, consejo técnico breve, tono ninja, SIN formato especial.
        `;

        // 🚩 2. ESTRATEGIA DE FALLBACK (BLINDAJE TOTAL)
        let text = "";
        try {
            // Intento 1: El modelo más potente (2.5)
            const model25 = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const result = await model25.generateContent(promptNinja);
            text = (await result.response).text().trim();
        } catch (err25) {
            console.warn("⚠️ Gemini 2.5 saturado, activando núcleo de respaldo 1.5...");
            try {
                // Intento 2: El modelo estable (1.5)
                const model15 = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const result15 = await model15.generateContent(promptNinja);
                text = (await result15.response).text().trim();
            } catch (err15) {
                // Si todo falla, respuesta predefinida inteligente
                text = `He analizado tu error en ${errorActual.tema}. El camino del ninja exige revisar las bases de este concepto antes de volver a intentar el sello.`;
            }
        }

        res.json({
            tema: errorActual.tema,
            mensaje: text,
            nivel_alerta: "critico",
            accion: "Reforzar este tema"
        });

    } catch (error) {
        console.error("❌ Error Crítico:", error);
        res.json({ 
            tema: "Análisis en pausa",
            mensaje: "El Oráculo está meditando. Sigue practicando mientras restauramos la conexión de chakra.",
            nivel_alerta: "medio",
            accion: "Continuar"
        });
    }
};

exports.obtenerLogrosEstudiante = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario || req.user.id;

        // Consultamos las insignias obtenidas cruzando con la tabla maestra de insignias
        const insignias = await db.query(
            `SELECT i.id_insignia, i.nombre_insignia, i.descripcion, i.imagen, ui.fecha_otorgada
             FROM Usuarios_Insignias ui
             JOIN Insignias i ON ui.id_insignia = i.id_insignia
             WHERE ui.id_usuario = ?`,
            { replacements: [id_usuario], type: db.QueryTypes.SELECT }
        );

        res.json(insignias);
    } catch (error) {
        console.error("❌ Error al obtener insignias:", error);
        res.status(500).json({ error: "No se pudieron cargar los pergaminos de honor." });
    }
};
// 1. IMPORTACIONES
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
const { literal, Op } = require('sequelize');
const db = require('../config/database');

// 2. MODELOS
const Diagnostico = require('../models/Diagnostico');
const Modulo = require('../models/Modulo');
const PreguntaDiagnostico = require('../models/PreguntaDiagnostico');
const Ejercicio = require('../models/Ejercicio');
const ProgresoEstudiante = require('../models/ProgresoEstudiante');
const Usuario = require('../models/Usuario');
const HistorialError = require('../models/HistorialError');

const TOTAL_PREGUNTAS = 13;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 3. HELPERS
const jwt = require('jsonwebtoken');

const extraerIdUsuario = (req) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return null;
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded.id_usuario || decoded.id;
    } catch (err) { return null; }
};



// --- ⚡ GESTIÓN DE ERRORES CON GEMINI 2.50 FLASH-LITE ---

exports.registrarFallo = async (req, res) => {
    try {
        const { id_pregunta, respuesta_dada } = req.body;
        const id_usuario = extraerIdUsuario(req);

        // 1. Obtener la pregunta de la base de datos
        const preguntaDB = await Ejercicio.findByPk(id_pregunta);
        if (!preguntaDB) return res.status(404).json({ error: "Sello no hallado" });

        // 2. Formatear columnas para obtener el texto real
        const formatColumna = (val) => {
            const str = String(val).toLowerCase().trim();
            return str.includes('opcion_') ? str : `opcion_${str}`;
        };
        const columnaDada = formatColumna(respuesta_dada);

        // -------------------------------------------------------------
        // 🚩 SISTEMA DE CACHÉ ESTRICTO (Ahorro Masivo de Tokens)
        // -------------------------------------------------------------
        // Buscamos si ALGUIEN ya falló esta pregunta con esta misma opción
        const cache = await HistorialError.findOne({
            where: {
                id_pregunta: id_pregunta,
                respuesta_dada: columnaDada,
                explicacion_ia: {
                    [Op.and]: [
                        { [Op.not]: null }, // Que no esté vacía
                        { [Op.notLike]: '%El oráculo está meditando%' } // Que no sea un error reciclado
                    ]
                }
            },
            order: [['fecha_error', 'DESC']] // Traemos la mejor y más reciente
        });

        let explicacionIA = "";

        if (cache && cache.explicacion_ia) {
            // Reciclamos la explicación sin tocar la API de Google
            explicacionIA = cache.explicacion_ia;
            console.log(`♻️ [CACHÉ NINJA] Token ahorrado. Explicación reciclada para la pregunta ${id_pregunta}.`);
        } else {
            // No existe en caché, invocamos a la IA
            const textoRespuestaAlumno = preguntaDB[columnaDada];
            const textoRespuestaCorrecta = preguntaDB[formatColumna(preguntaDB.respuesta_correcta)];

            const prompt = `Actúa como un maestro sabio y con gran experiencia en matemáticas. 
            El estudiante falló en: "${preguntaDB.pregunta}". 
            Eligió: "${textoRespuestaAlumno}". 
            La respuesta correcta era: "${textoRespuestaCorrecta}". 
            Explica el error en máximo 3 oraciones breves y termina con un "🥷🏾Pista Ninja:" motivadora. 
            IMPORTANTE: No uses signos de peso ($), ni formato LaTeX. Escribe las fórmulas como texto normal (ejemplo: f(x) = 0).
            No des la respuesta correcta nunca, guía su lógica fomentando el pensamiento crítico.`;

            try {
                // 🚩 Usamos 2.5-flash-lite para evitar límites de cuota rápidos
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
                const result = await model.generateContent(prompt);
                explicacionIA = result.response.text();
                console.log(`⚡ [GEMINI API] Nueva explicación generada para la pregunta ${id_pregunta}.`);
            } catch (err) {
                console.error("❌ Error en Gemini:", err.message);
                explicacionIA = "El oráculo está meditando en las montañas. Analiza el sello por tu cuenta.";
            }
        }
        // -------------------------------------------------------------

        // 3. Guardar SIEMPRE en el historial para no perder las analíticas del profesor
        await HistorialError.create({
            id_usuario,
            id_pregunta,
            respuesta_dada: columnaDada,
            explicacion_ia: explicacionIA,
            fecha_error: new Date()
        });

        return res.status(201).json({ explicacion_ia: explicacionIA });
    } catch (e) {
        console.error("Error crítico en registrarFallo:", e);
        res.status(500).json({ error: "Error interno del Dojo" });
    }
};

exports.obtenerErroresRecientes = async (req, res) => {
    try {
        const id_usuario = extraerIdUsuario(req);

        // 1. Traemos todo: la pregunta, el historial, las 4 opciones y la respuesta correcta
        const errores = await db.query(
            `SELECT 
                h.fecha_error, h.respuesta_dada, h.explicacion_ia, 
                e.pregunta AS pregunta_texto, m.nombre_modulo AS tema_modulo,
                e.opcion_a, e.opcion_b, e.opcion_c, e.opcion_d, e.respuesta_correcta
             FROM historial_errores h 
             JOIN ejercicios e ON h.id_pregunta = e.id_ejercicio 
             JOIN modulos m ON e.id_modulo = m.id_modulo
             WHERE h.id_usuario = ? 
             ORDER BY h.fecha_error DESC LIMIT 10`,
            { replacements: [id_usuario], type: db.QueryTypes.SELECT }
        );

        // 2. Mapeamos y traducimos las columnas crudas al texto real
        const erroresFormateados = errores.map(err => {
            // Aseguramos el formato correcto (ej: "opcion_d")
            const colDada = String(err.respuesta_dada).toLowerCase().includes('opcion_')
                ? err.respuesta_dada.toLowerCase()
                : `opcion_${err.respuesta_dada.toLowerCase()}`;

            const colCorrecta = String(err.respuesta_correcta).toLowerCase().includes('opcion_')
                ? err.respuesta_correcta.toLowerCase()
                : `opcion_${err.respuesta_correcta.toLowerCase()}`;

            return {
                fecha_error: err.fecha_error,
                tema_modulo: err.tema_modulo,
                pregunta_texto: err.pregunta_texto,
                explicacion_ia: err.explicacion_ia,
                // Aquí ocurre la magia: buscamos en el objeto el valor de la columna
                respuesta_incorrecta: err[colDada] || err.respuesta_dada,
                respuesta_correcta: err[colCorrecta] || err.respuesta_correcta
            };
        });

        res.json(erroresFormateados);
    } catch (e) {
        console.error("Error al formatear bitácora:", e);
        res.status(500).json({ error: 'Error bitácora' });
    }
};

// --- 🎯 DIAGNÓSTICO Y RANGO ---

exports.obtenerPreguntasDiagnostico = async (req, res) => {
    try {
        const preguntas = await PreguntaDiagnostico.findAll();
        res.json(preguntas);
    } catch (e) { res.status(500).json({ mensaje: 'Error' }); }
};

// 🚩 FUNCIÓN: FINALIZAR MÓDULO, OTORGAR INSIGNIA Y EVALUAR ASCENSO
// 🚩 FUNCIÓN: FINALIZAR MÓDULO Y EVALUAR ASCENSO (BLINDADA)
// 🚩 FUNCIÓN: FINALIZAR MÓDULO Y EVALUAR ASCENSO (Sincronización Total de Columnas)
// 🚩 FUNCIÓN: FINALIZAR MÓDULO Y EVALUAR ASCENSO (Sincronización y Lógica por Tiers)
exports.finalizarModulo = async (req, res) => {
    const t = await db.transaction();
    try {
        const { id_modulo } = req.body;
        const id_usuario = extraerIdUsuario(req);

        // 1. FORZAR EL 100% EN PROGRESO (Añadido intentos_realizados para prevenir errores de constraint)
        await db.query(`
            INSERT INTO progreso_estudiante (id_usuario, id_modulo, porcentaje_avance, intentos_realizados, ultima_actualizacion)
            VALUES (?, ?, 100, 1, NOW())
            ON DUPLICATE KEY UPDATE porcentaje_avance = 100, ultima_actualizacion = NOW()
        `, { replacements: [id_usuario, id_modulo], transaction: t });

        // 2. OTORGAR INSIGNIA DE LA MISIÓN
        await db.query(
            'INSERT IGNORE INTO usuarios_insignias (id_usuario, id_insignia, fecha_otorgada) VALUES (?, ?, NOW())',
            { replacements: [id_usuario, id_modulo], transaction: t }
        );

        // 3. CONSULTAR ESTADO ACTUAL (Damos prioridad a rango_actual si existe)
        const usuario = await Usuario.findByPk(id_usuario, { transaction: t });
        const rangoActual = usuario?.rango_actual || usuario?.rango || 'Genin (Iniciado)';

        // 🚩 4. CONTEO DE MÓDULOS AGRUPADOS POR TIER (La clave para no estancarse)
        let nivelesAEvaluar = [];
        if (rangoActual.includes('Genin')) {
            nivelesAEvaluar = ['Genin (Iniciado)', 'Bajo'];
        } else if (rangoActual.includes('Chunin')) {
            // Para ser Jonin, evaluamos que haya cumplido todo lo básico y lo intermedio
            nivelesAEvaluar = ['Genin (Iniciado)', 'Bajo', 'Chunin (Guerrero)', 'Chunin (Intermedio)', 'Intermedio'];
        } else if (rangoActual.includes('Jonin')) {
            nivelesAEvaluar = ['Genin (Iniciado)', 'Bajo', 'Chunin (Guerrero)', 'Chunin (Intermedio)', 'Intermedio', 'Jonin (Maestro)', 'Jonin (Avanzado)', 'Alto'];
        }

        const modulosDelNivel = await Modulo.findAll({
            where: { nivel: { [Op.in]: nivelesAEvaluar } },
            attributes: ['id_modulo'],
            transaction: t
        });

        const idsModulosNivel = modulosDelNivel.map(m => m.id_modulo);
        const totalMisionesNivel = idsModulosNivel.length;

        const completadosDelNivel = await ProgresoEstudiante.count({
            distinct: true,
            col: 'id_modulo',
            where: {
                id_usuario,
                porcentaje_avance: 100,
                id_modulo: { [Op.in]: idsModulosNivel }
            },
            transaction: t
        });

        console.log(`[SISTEMA ASCENSO] Usuario: ${id_usuario} | Rango: ${rangoActual} | Progreso: ${completadosDelNivel}/${totalMisionesNivel}`);

        let ascendio = false;
        let nuevoRango = rangoActual;
        let mensajeAscenso = "";

        // 🚩 5. LÓGICA DE ASCENSO BLINDADA (Usando .includes para mayor tolerancia)
        if (totalMisionesNivel > 0 && completadosDelNivel === totalMisionesNivel) {
            if (rangoActual.includes('Genin')) {
                nuevoRango = 'Chunin (Guerrero)';
                mensajeAscenso = "¡Felicidades! La aldea te reconoce ahora como Chunin.";
                ascendio = true;
            } else if (rangoActual.includes('Chunin')) {
                nuevoRango = 'Jonin (Maestro)';
                mensajeAscenso = "¡Increíble! Has alcanzado el rango de Maestro Jonin.";
                ascendio = true;
            } else if (rangoActual.includes('Jonin')) {
                nuevoRango = 'Kage (Leyenda)'; // O el nombre supremo que prefieras
                mensajeAscenso = "¡Has dominado todas las artes matemáticas de la academia! Ahora eres una Leyenda viva.";
                ascendio = true;
            }

            if (ascendio) {
                // BLINDAJE TOTAL: Actualizamos todas las columnas
                await db.query(`
                    UPDATE usuarios 
                    SET rango = ?, rango_actual = ? 
                    WHERE id_usuario = ?
                `, { replacements: [nuevoRango, nuevoRango, id_usuario], transaction: t });

                await db.query(`
                    UPDATE diagnostico 
                    SET nivel_asignado = ? 
                    WHERE id_usuario = ? 
                    ORDER BY fecha_realizacion DESC LIMIT 1
                `, { replacements: [nuevoRango, id_usuario], transaction: t });

                const idMedalla = nuevoRango.includes('Chunin') ? 101 : 102;
                await db.query('INSERT IGNORE INTO usuarios_insignias (id_usuario, id_insignia, fecha_otorgada) VALUES (?, ?, NOW())',
                    { replacements: [id_usuario, idMedalla], transaction: t });
            }
        }

        await t.commit();

        res.json({
            success: true,
            ascendio: ascendio,
            detallesAscenso: ascendio ? { nuevoNivel: nuevoRango, mensaje: mensajeAscenso } : null
        });

    } catch (e) {
        if (t) await t.rollback();
        console.error("❌ Error en finalización:", e);
        res.status(500).json({ error: "Falla en el proceso de sellado" });
    }
};
// 🚩 FUNCIÓN UNIFICADA: GUARDAR DIAGNÓSTICO + SINCRONIZACIÓN DE INSIGNIAS
exports.guardarDiagnostico = async (req, res) => {
    const t = await db.transaction();
    try {
        const { puntaje } = req.body;
        const id_usuario = extraerIdUsuario(req);

        if (!id_usuario) return res.status(401).json({ error: "Sesión expirada" });

        // 1. Clasificación por IA
        // 1. Clasificación por IA (Sincronizado con Railway)
        const iaBaseUrl = process.env.IA_SERVICE_URL || 'http://127.0.0.1:5000';

        const resIA = await axios.post(`${iaBaseUrl}/api/ia/recomendar-ruta`, { puntaje });
        const mapa = { 0: 'Genin (Iniciado)', 1: 'Chunin (Guerrero)', 2: 'Jonin (Maestro)' };
        const rango = mapa[resIA.data.nivel_id] || 'Genin (Iniciado)';

        // 2. Actualizar rango oficial
        await db.query('UPDATE usuarios SET rango = ?, rango_actual = ? WHERE id_usuario = ?',
            { replacements: [rango, rango, id_usuario], transaction: t });

        // 🚩 3. LÓGICA DE MEDALLAS DE RANGO Y CONVALIDACIÓN
        let nivelesAConvalidar = [];
        let medallasDeRango = [];

        if (rango.includes('Chunin')) {
            nivelesAConvalidar = ['Genin (Iniciado)', 'Bajo'];
            medallasDeRango = [101]; // Medalla Chunin
        }
        else if (rango.includes('Jonin')) {
            nivelesAConvalidar = ['Genin (Iniciado)', 'Bajo', 'Chunin (Guerrero)', 'Chunin (Intermedio)', 'Intermedio'];
            medallasDeRango = [101, 102]; // Medalla Chunin y Medalla Jonin
        } else if (rango.includes('Kage')) {
            nivelesAConvalidar = [
                'Genin (Iniciado)', 'Bajo',
                'Chunin (Guerrero)', 'Chunin (Intermedio)', 'Intermedio',
                'Jonin (Maestro)', 'Jonin (Avanzado)', 'Alto'
            ];
            medallasDeRango = [101, 102, 103]; // Todas las medallas de rango
        }
        // A. Convalidar Módulos y sus insignias
        if (nivelesAConvalidar.length > 0) {
            const modulosConvalidados = await db.query(
                'SELECT id_modulo FROM modulos WHERE nivel IN (?)',
                { replacements: [nivelesAConvalidar], type: db.QueryTypes.SELECT, transaction: t }
            );

            if (modulosConvalidados.length > 0) {
                const ids = modulosConvalidados.map(m => m.id_modulo);

                // Marcar progreso 100%
                const valoresProgreso = ids.map(id => `(${id_usuario}, ${id}, 100, 1, NOW())`).join(', ');
                await db.query(`
                    INSERT INTO progreso_estudiante (id_usuario, id_modulo, porcentaje_avance, intentos_realizados, ultima_actualizacion)
                    VALUES ${valoresProgreso} ON DUPLICATE KEY UPDATE porcentaje_avance = 100
                `, { transaction: t });

                // Entregar insignias de los módulos saltados
                const valoresInsigniasMod = ids.map(id => `(${id_usuario}, ${id}, NOW())`).join(', ');
                await db.query(`
                    INSERT IGNORE INTO usuarios_insignias (id_usuario, id_insignia, fecha_otorgada)
                    VALUES ${valoresInsigniasMod}
                `, { transaction: t });
            }
        }

        // B. ENTREGAR MEDALLAS DE RANGO (Chunin/Jonin)
        if (medallasDeRango.length > 0) {
            const valoresMedallas = medallasDeRango.map(idMedalla => `(${id_usuario}, ${idMedalla}, NOW())`).join(', ');
            await db.query(`
                INSERT IGNORE INTO usuarios_insignias    (id_usuario, id_insignia, fecha_otorgada)
                VALUES ${valoresMedallas}
            `, { transaction: t });
        }

        // 4. Registro histórico del diagnóstico
        const nuevo = await Diagnostico.create({
            id_usuario, puntaje_obtenido: puntaje, nivel_asignado: rango, fecha_realizacion: new Date()
        }, { transaction: t });

        await t.commit();
        res.status(201).json(nuevo);

    } catch (e) {
        if (t) await t.rollback();
        console.error("❌ Error en Convalidación de Rango:", e.message);
        res.status(500).json({ error: "Error en el sello de diagnóstico" });
    }
};
// --- 🏯 DASHBOARD Y PROGRESO (ORDENAMIENTO PEDAGÓGICO) ---

exports.obtenerDashboard = async (req, res) => {
    try {
        const id_usuario = extraerIdUsuario(req);
        if (!id_usuario) return res.status(401).json({ mensaje: "No autorizado" });

        // 🚩 1. CONSULTA BLINDADA CONTRA ZONAS HORARIAS
        // Usamos DATE_FORMAT en SQL para que MySQL nos dé la fecha estricta como texto (YYYY-MM-DD)
        const [usuarioDB] = await db.query(
            `SELECT 
                rango, 
                rango_actual, 
                DATE_FORMAT(ultima_conexion, '%Y-%m-%d') as fecha_ultima_str, 
                racha_dias 
             FROM usuarios 
             WHERE id_usuario = ?`,
            { replacements: [id_usuario], type: db.QueryTypes.SELECT }
        );

        if (!usuarioDB) return res.status(404).json({ mensaje: 'Ninja no hallado' });

        const nivelIA = usuarioDB.rango || usuarioDB.rango_actual || 'Genin (Iniciado)';

        // 🚩 2. MOTOR DE RACHAS (Anti-Bucle y Anti-React Strict Mode)
        // Sacamos la fecha actual estricta de Colombia
        const hoyStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

        let rachaActual = usuarioDB.racha_dias || 0;
        let necesitaActualizar = false;

        if (!usuarioDB.fecha_ultima_str) {
            rachaActual = 1;
            necesitaActualizar = true;
        } else {
            const ultimaStr = usuarioDB.fecha_ultima_str; // Ej: '2026-04-02'

            // Solo entramos a la matemática si REALMENTE cambió el día
            if (hoyStr !== ultimaStr) {
                // Forzamos ambas fechas a UTC 00:00 para que la resta de días sea exacta
                const utcHoy = new Date(`${hoyStr}T00:00:00Z`);
                const utcUltima = new Date(`${ultimaStr}T00:00:00Z`);

                const diferenciaDias = Math.round((utcHoy - utcUltima) / (1000 * 60 * 60 * 24));

                if (diferenciaDias === 1) {
                    rachaActual += 1;
                } else if (diferenciaDias > 1) {
                    rachaActual = 1; // Perdió la racha, vuelve a empezar
                }

                necesitaActualizar = true;
            }
        }

        if (necesitaActualizar) {
            // Generamos la hora exacta de Colombia y la enviamos como String a MySQL
            // Así evitamos que Sequelize la guarde con UTC erróneo
            const fechaActual = new Date();
            const offsetBogota = -5 * 60 * 60 * 1000; // -5 horas en milisegundos
            const localBogota = new Date(fechaActual.getTime() + offsetBogota);
            const sqlDateTime = localBogota.toISOString().slice(0, 19).replace('T', ' '); // "2026-04-02 11:52:00"

            await db.query(
                'UPDATE usuarios SET racha_dias = ?, ultima_conexion = ? WHERE id_usuario = ?',
                { replacements: [rachaActual, sqlDateTime, id_usuario] }
            );
        }

        // 🚩 3. CARGA PARALELA DE DATOS (Rendimiento Ninja)
        const [diag, modulos, todasInsignias, insigniasGanadas] = await Promise.all([
            db.query('SELECT puntaje_obtenido FROM diagnostico WHERE id_usuario = ? ORDER BY fecha_realizacion DESC LIMIT 1', { replacements: [id_usuario], type: db.QueryTypes.SELECT }),
            Modulo.findAll({
                where: {
                    nivel: {
                        // const { Op } = require('sequelize');
                        [Op.in]: nivelIA.includes('Jonin')
                            ? ['Genin (Iniciado)', 'Bajo', 'Chunin (Guerrero)', 'Chunin (Intermedio)', 'Intermedio', 'Jonin (Maestro)', 'Jonin (Avanzado)', 'Alto']
                            : nivelIA.includes('Chunin')
                                ? ['Genin (Iniciado)', 'Bajo', 'Chunin (Guerrero)', 'Chunin (Intermedio)', 'Intermedio']
                                : ['Genin (Iniciado)', 'Bajo']
                    }
                },
                raw: true,
                order: [[db.literal("FIELD(nivel, 'Genin (Iniciado)', 'Bajo', 'Chunin (Guerrero)', 'Chunin (Intermedio)', 'Intermedio', 'Jonin (Maestro)', 'Jonin (Avanzado)', 'Alto')")], ['id_modulo', 'ASC']]
            }),
            db.query(`SELECT * FROM insignias`, { type: db.QueryTypes.SELECT }),
            db.query(`SELECT id_insignia FROM usuarios_insignias WHERE id_usuario = ?`, { replacements: [id_usuario], type: db.QueryTypes.SELECT })
        ]);

        const puntajeInicial = diag[0] ? diag[0].puntaje_obtenido : 0;

        // 🚩 4. PROCESAR PROGRESO POR MÓDULO
        const rutaConProgreso = await Promise.all(modulos.map(async (m) => {
            const p = await ProgresoEstudiante.findOne({
                where: { id_usuario, id_modulo: m.id_modulo },
                order: [['porcentaje_avance', 'DESC']],
                raw: true
            });
            return { ...m, porcentaje_avance: p ? Math.round(p.porcentaje_avance) : 0 };
        }));

        // 🚩 5. RESPUESTA FINAL CONSOLIDADA
        res.json({
            estadisticas: {
                rango_actual: nivelIA,
                puntaje: puntajeInicial,
                modulos_completados: rutaConProgreso.filter(m => parseInt(m.porcentaje_avance) === 100).length,
                total_misiones: rutaConProgreso.length,
                racha_dias: rachaActual
            },
            ruta_ia_asignada: rutaConProgreso,
            todas_insignias: todasInsignias,
            insignias_obtenidas: insigniasGanadas
        });

    } catch (e) {
        console.error("Dashboard Error:", e);
        res.status(500).json({ mensaje: 'Error motor dashboard' });
    }
};
// 🚩 CORRECCIÓN 3: Actualizar progreso con protección de "Piso de Cristal"
// No permite que un porcentaje menor pise uno mayor (evita que el 90% pise al 100%).
exports.actualizarProgreso = async (req, res) => {
    try {
        const { id_modulo, porcentaje } = req.body;
        const id_usuario = extraerIdUsuario(req);

        // Usamos SQL nativo para asegurar que el porcentaje solo suba, nunca baje
        await db.query(`
            INSERT INTO progreso_estudiante (id_usuario, id_modulo, porcentaje_avance, intentos_realizados, ultima_actualizacion)
            VALUES (?, ?, ?, 1, NOW())
            ON DUPLICATE KEY UPDATE 
                porcentaje_avance = IF(? > porcentaje_avance, ?, porcentaje_avance),
                intentos_realizados = intentos_realizados + 1,
                ultima_actualizacion = NOW()
        `, { replacements: [id_usuario, id_modulo, porcentaje, porcentaje, porcentaje] });

        res.json({ mensaje: 'Chakra sincronizado' });
    } catch (e) {
        console.error("Error progreso:", e);
        res.status(500).json({ mensaje: 'Error progreso' });
    }
};

// --- 📜 CONTENIDO Y SOCIAL ---

exports.obtenerBiblioteca = async (req, res) => {
    try {
        const id_usuario = extraerIdUsuario(req);
        const diag = await Diagnostico.findOne({ where: { id_usuario }, order: [['fecha_realizacion', 'DESC']] });
        const nivel = diag ? diag.nivel_asignado : 'Genin (Iniciado)';
        let permitidos = ['Genin (Iniciado)', 'Bajo'];
        if (nivel.includes('Chunin')) permitidos.push('Chunin (Guerrero)', 'Intermedio');
        if (nivel.includes('Jonin')) permitidos.push('Chunin (Guerrero)', 'Intermedio', 'Jonin (Maestro)', 'Alto');
        const pergaminos = await db.query("SELECT * FROM biblioteca_pergaminos WHERE nivel_requerido IN (?) ORDER BY id_pergamino DESC", { replacements: [permitidos], type: db.QueryTypes.SELECT });
        res.json(pergaminos);
    } catch (e) { res.status(500).json({ mensaje: 'Error biblioteca' }); }
};

exports.obtenerEjerciciosModulo = async (req, res) => {
    try {
        const ejercicios = await Ejercicio.findAll({ where: { id_modulo: req.params.id_modulo } });
        res.json(ejercicios);
    } catch (e) { res.status(500).json({ mensaje: 'Error ejercicios' }); }
};

exports.obtenerRanking = async (req, res) => {
    try {
        const ranking = await Usuario.findAll({
            attributes: ['nombre_completo', [literal(`(SELECT COUNT(*) FROM progreso_estudiante WHERE id_usuario = Usuario.id_usuario AND porcentaje_avance = 100)`), 'misiones_completas'], [literal(`(SELECT nivel_asignado FROM diagnostico WHERE id_usuario = Usuario.id_usuario ORDER BY fecha_realizacion DESC LIMIT 1)`), 'rango']],
            where: { rol: 'estudiante' }, order: [[literal('misiones_completas'), 'DESC']], limit: 10
        });
        res.json(ranking);
    } catch (e) { res.status(500).json({ mensaje: 'Error ranking' }); }
};

// --- 💬 FORO Y PERFIL ---

exports.crearMisionForo = async (req, res) => {
    try {
        const { titulo, contenido } = req.body;
        const id_usuario = extraerIdUsuario(req);
        const url = req.file ? `/uploads/${req.file.filename}` : null;
        await db.query("INSERT INTO foro_posts (id_usuario, titulo, contenido, imagen_url) VALUES (?, ?, ?, ?)", { replacements: [id_usuario, titulo, contenido, url] });
        res.json({ mensaje: "Publicado" });
    } catch (error) { res.status(500).json({ error: "Falla foro" }); }
};

exports.obtenerTemasForo = async (req, res) => {
    try {
        const temas = await db.query(`SELECT p.*, u.nombre_completo AS autor FROM foro_posts p JOIN usuarios u ON p.id_usuario = u.id_usuario ORDER BY p.fecha_creacion DESC`, { type: db.QueryTypes.SELECT });
        res.json(temas);
    } catch (error) { res.status(500).json({ error: "Error temas" }); }
};

exports.comentarMision = async (req, res) => {
    try {
        const { id_post, comentario } = req.body;
        const id_usuario = extraerIdUsuario(req);
        await db.query("INSERT INTO foro_comentarios (id_post, id_usuario, comentario) VALUES (?, ?, ?)", { replacements: [id_post, id_usuario, comentario] });
        res.json({ mensaje: "Comentado" });
    } catch (error) { res.status(500).json({ error: "Error comentario" }); }
};

exports.obtenerComentarios = async (req, res) => {
    try {
        const comentarios = await db.query(`SELECT c.*, u.nombre_completo AS autor FROM foro_comentarios c JOIN usuarios u ON c.id_usuario = u.id_usuario WHERE c.id_post = ? ORDER BY c.fecha_comentario ASC`, { replacements: [req.params.id_post], type: db.QueryTypes.SELECT });
        res.json(comentarios);
    } catch (error) { res.status(500).json({ error: "Error respuestas" }); }
};

exports.editarComentario = async (req, res) => {
    try {
        await db.query("UPDATE foro_comentarios SET comentario = ? WHERE id_comentario = ? AND id_usuario = ?", { replacements: [req.body.nuevoContenido, req.params.id_comentario, extraerIdUsuario(req)] });
        res.json({ mensaje: "Editado" });
    } catch (error) { res.status(500).json({ error: "Falla edit" }); }
};

exports.eliminarComentario = async (req, res) => {
    try {
        await db.query("DELETE FROM foro_comentarios WHERE id_comentario = ? AND id_usuario = ?", { replacements: [req.params.id_comentario, extraerIdUsuario(req)] });
        res.json({ mensaje: "Borrado" });
    } catch (error) { res.status(500).json({ error: "Falla delete" }); }
};

exports.eliminarMision = async (req, res) => {
    try {
        const id_usuario = extraerIdUsuario(req);
        await db.query("DELETE FROM foro_comentarios WHERE id_post = ?", { replacements: [req.params.id_post] });
        await db.query("DELETE FROM foro_posts WHERE id_post = ? AND id_usuario = ?", { replacements: [req.params.id_post, id_usuario] });
        res.json({ mensaje: "Misión eliminada" });
    } catch (error) { res.status(500).json({ error: "No eliminada" }); }
};

exports.obtenerPerfil = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT nombre_completo, correo, foto_perfil FROM usuarios WHERE id_usuario = ?', { replacements: [extraerIdUsuario(req)], type: db.QueryTypes.SELECT });
        res.json(rows || {});
    } catch (error) { res.status(500).send("Error perfil"); }
};

exports.obtenerNotificaciones = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM notificaciones WHERE id_usuario = ? ORDER BY fecha_creacion DESC LIMIT 15', { replacements: [extraerIdUsuario(req)], type: db.QueryTypes.SELECT });
        res.json(rows || []);
    } catch (error) { res.status(500).send("Error notif"); }
};

exports.marcarNotificacionLeida = async (req, res) => {
    try {
        await db.query('UPDATE notificaciones SET leida = 1 WHERE id_notificacion = ?', { replacements: [req.params.id] });
        res.json({ mensaje: "OK" });
    } catch (error) { res.status(500).send("Error update"); }
};

exports.actualizarAvatar = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No imagen" });
        const url = `/uploads/${req.file.filename}`;
        await db.query('UPDATE usuarios SET foto_perfil = ? WHERE id_usuario = ?', { replacements: [url, extraerIdUsuario(req)], type: db.QueryTypes.UPDATE });
        res.json({ mensaje: "Sello actualizado", url });
    } catch (error) { res.status(500).send("Error avatar"); }
};

exports.obtenerSugerenciaIA = async (req, res) => {
    try {
        const id_usuario = extraerIdUsuario(req);
        const resultados = await db.query(`SELECT m.nombre_modulo AS tema, e.pregunta AS pregunta_texto, f.respuesta_dada FROM historial_errores f JOIN ejercicios e ON f.id_pregunta = e.id_ejercicio JOIN modulos m ON e.id_modulo = m.id_modulo WHERE f.id_usuario = ? ORDER BY f.id_error DESC LIMIT 1`, { replacements: [id_usuario], type: db.QueryTypes.SELECT });
        if (!resultados.length) return res.json({ tema: "General", mensaje: "Chakra estable.", nivel_alerta: "optimo", accion: "Sigue" });
        const text = "Sigue practicando, el dominio del chakra matemático requiere paciencia.";
        res.json({ tema: resultados[0].tema, mensaje: text, nivel_alerta: "critico", accion: "Reforzar" });
    } catch (error) { res.json({ tema: "Meditando", mensaje: "IA Offline", nivel_alerta: "medio", accion: "Sigue" }); }
};

exports.obtenerLogrosEstudiante = async (req, res) => {
    try {
        const insignias = await db.query(`SELECT i.*, ui.fecha_otorgada FROM usuarios_insignias ui JOIN insignias i ON ui.id_insignia = i.id_insignia WHERE ui.id_usuario = ?`, { replacements: [extraerIdUsuario(req)], type: db.QueryTypes.SELECT });
        res.json(insignias);
    } catch (error) { res.status(500).json({ error: "Falla insignias" }); }
};


exports.obtenerAnaliticaErrores = async (req, res) => {
    try {
        const id_usuario = extraerIdUsuario(req);

        // Consultamos la cuenta de errores agrupada por el nombre del módulo
        const estadisticas = await db.query(`
            SELECT 
                m.nombre_modulo AS tema,
                COUNT(h.id_error) AS total_fallos,
                MAX(h.fecha_error) AS ultimo_fallo
            FROM historial_errores h
            JOIN ejercicios e ON h.id_pregunta = e.id_ejercicio
            JOIN modulos m ON e.id_modulo = m.id_modulo
            WHERE h.id_usuario = ?
            GROUP BY m.id_modulo
            ORDER BY total_fallos DESC
        `, { replacements: [id_usuario], type: db.QueryTypes.SELECT });

        // Determinamos cuál es el "punto débil" (el tema con más de 3 errores, por ejemplo)
        const puntoDebil = estadisticas.length > 0 && estadisticas[0].total_fallos >= 3
            ? estadisticas[0]
            : null;

        res.json({
            grafico: estadisticas, // Para el Chart de Barras/Radar
            sugerencia: puntoDebil ? {
                mensaje: `Maestro Ninja nota debilidad en: ${puntoDebil.tema}`,
                id_modulo_sugerido: puntoDebil.id_modulo,
                nivel_alerta: 'critico'
            } : null
        });
    } catch (e) {
        res.status(500).json({ error: "Error al calcular analítica" });
    }
};

// --- 🤖 TUTOR IA INTERACTIVO (EL ORÁCULO) ---

exports.consultarOraculo = async (req, res) => {
    try {
        const { id_pregunta, mensaje_estudiante } = req.body;

        // 1. Buscamos el contexto del ejercicio en la base de datos
        const preguntaDB = await Ejercicio.findByPk(id_pregunta);
        if (!preguntaDB) return res.status(404).json({ error: "Pergamino no encontrado" });

        // 2. Construimos el Prompt (Ingeniería de Prompts)
        const prompt = `
        Eres un maestro de matemáticas. Tu tarea es guiar a tu estudiante academicamente.
        El estudiante está intentando resolver el siguiente problema: "${preguntaDB.pregunta}".
        
        El estudiante te pregunta lo siguiente: "${mensaje_estudiante}"

        REGLAS ESTRICTAS QUE DEBES CUMPLIR:
        1. NUNCA des la respuesta final ni la solución directa del ejercicio.
        2. Actúa como un guía: dale pistas, explícale el concepto matemático (como límites, derivadas, despejes, etc.) o hazle una pregunta que lo haga pensar.
        3. Mantén tu respuesta breve (máximo 2 o 3 párrafos cortos) y usa lenguaje academico.
        4. Usa un tono motivador de maestro ninja.
        5. NO USES FORMATO LaTeX ni signos de peso ($) para las matemáticas. Escribe las fórmulas de manera simple y en texto plano (ej: f(x) = x^2).
        `;

        // 3. Invocamos a Gemini 2.5 Flash-lite
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        const result = await model.generateContent(prompt);
        const respuestaOraculo = result.response.text();

        return res.json({ respuesta: respuestaOraculo });

    } catch (e) {
        console.error("❌ Error en el Oráculo IA:", e);
        if (e.message.includes('429')) {
            return res.status(429).json({
                respuesta: "Mi chakra está agotado en este momento, joven ninja. Intenta canalizar tu energía y pregúntame de nuevo en unos segundos."
            });
        }
        res.status(500).json({ respuesta: "El enlace telepático con el Oráculo se ha roto. Sigue tu instinto ninja." });
    }
};
// Obtener todos los temas de conversación
exports.obtenerTemas = async (req, res) => {
    try {
        const temas = await db.query(`
            SELECT p.*, u.nombre_completo AS autor, u.foto_perfil AS autor_foto
            FROM foro_posts p 
            JOIN usuarios u ON p.id_usuario = u.id_usuario 
            ORDER BY p.fecha_creacion DESC`, 
            { type: db.QueryTypes.SELECT }
        );
        res.json(temas);
    } catch (e) { res.status(500).json({ error: "Error en el dojo" }); }
};

exports.obtenerComentarios = async (req, res) => {
    const { id_post } = req.params;
    try {
        const comentarios = await db.query(`
            SELECT c.*, u.nombre_completo AS autor, u.foto_perfil AS autor_foto 
            FROM foro_comentarios c 
            JOIN usuarios u ON c.id_usuario = u.id_usuario 
            WHERE c.id_post = ? 
            ORDER BY c.fecha_creacion ASC`, 
            { 
                replacements: [id_post],
                type: db.QueryTypes.SELECT 
            }
        );
        res.json(comentarios);
    } catch (e) { res.status(500).json({ error: "Error al leer comentarios" }); }
};

// Crear una respuesta en un post
exports.comentarPost = async (req, res) => {
    const { id_post, comentario } = req.body;
    const id_usuario = extraerIdUsuario(req); // Tu función de JWT
    try {
        await db.query(
            "INSERT INTO foro_comentarios (id_post, id_usuario, comentario) VALUES (?, ?, ?)",
            { replacements: [id_post, id_usuario, comentario] }
        );
        res.json({ mensaje: "Comentario ninja enviado" });
    } catch (e) { res.status(500).json({ error: "Falla en el envío" }); }
};
// =================================================================
// 🛡️ CONTROLADOR DE AUTENTICACIÓN (VERSIÓN OPTIMIZADA PARA PRODUCCIÓN)
// Cero dependencias externas de correo para evitar bloqueos de red.
// =================================================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const db = require('../config/database');
const Usuario = require('../models/Usuario');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// -----------------------------------------------------------------
// 1. Registro Manual (Rápido, Seguro y Sin Fricción)
// -----------------------------------------------------------------
exports.registrar = async (req, res) => {
    try {
        const { nombre_completo, correo, password, rol } = req.body;

        // 1. Validación estricta de formato usando Regex nativo
        const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regexCorreo.test(correo)) {
            return res.status(400).json({ error: "El formato del pergamino (correo) no es válido." });
        }

        // 2. Verificar si el ninja ya existe en la aldea
        const existe = await Usuario.findOne({ where: { correo } });
        if (existe) {
            return res.status(400).json({ error: "Este correo ya está registrado en la academia." });
        }

        // 3. Crear el usuario (Se asume que el Modelo tiene verificado: true por defecto)
        const nuevoUsuario = await Usuario.create({
            nombre_completo,
            correo,
            password: await bcrypt.hash(password, 10),
            rol: rol || 'estudiante',
            verificado: true, // Forzamos activación inmediata
            estado: 'Activo'  // Forzamos estado activo
        });

        console.log(`✅ Nuevo ninja registrado y activado automáticamente: ${correo}`);

        // 4. Respuesta inmediata para que el Frontend redirija al Login
        return res.status(201).json({
            success: true,
            mensaje: "¡Registro exitoso! Bienvenido a la academia.",
            id_usuario: nuevoUsuario.id_usuario
        });

    } catch (error) {
        console.error("❌ Error crítico en registro:", error);
        res.status(500).json({ error: "Hubo un problema al forjar tu sello ninja." });
    }
};

// -----------------------------------------------------------------
// 2. Lógica de Login (Libre de bloqueos de verificación)
// -----------------------------------------------------------------
exports.login = async (req, res) => {
    try {
        const { correo, password } = req.body;
        
        // 1. Buscamos al usuario
        const usuario = await Usuario.findOne({ where: { correo } });
        if (!usuario) return res.status(404).json({ mensaje: 'Credenciales inválidas.' });

        // Nota: Se eliminó la restricción de "usuario.verificado" para permitir acceso libre.

        // 2. Verificamos la contraseña
        const esPasswordValido = await bcrypt.compare(password, usuario.password || usuario.hash_password);
        if (!esPasswordValido) return res.status(401).json({ mensaje: 'Credenciales inválidas.' });

        // 3. EL BUSCADOR DE HUELLAS: Verificamos si este ID ya pasó por el diagnóstico
        const [hasDiag] = await db.query(
            'SELECT id_diagnostico FROM diagnostico WHERE id_usuario = ? LIMIT 1',
            { replacements: [usuario.id_usuario], type: db.QueryTypes.SELECT }
        );

        const requiereDiagnostico = hasDiag ? false : true;

        // 4. Actualizamos métricas
        usuario.ultima_conexion = new Date();
        await usuario.save();

        // 5. Generamos Token
        const token = jwt.sign({ id_usuario: usuario.id_usuario, rol: usuario.rol }, process.env.JWT_SECRET, { expiresIn: '8h' });

        res.status(200).json({
            mensaje: 'Inicio de sesión exitoso.',
            token,
            requiereDiagnostico: requiereDiagnostico,
            usuario: {
                id_usuario: usuario.id_usuario,
                nombre_completo: usuario.nombre_completo,
                correo: usuario.correo,
                rol: usuario.rol,
                rango: usuario.rango || usuario.rango_actual
            }
        });
    } catch (error) {
        console.error("❌ Error en Login:", error);
        res.status(500).json({ mensaje: 'Error interno de la aldea.' });
    }
};

// -----------------------------------------------------------------
// 3. Lógica Google OAuth (Acceso directo)
// -----------------------------------------------------------------
exports.googleLogin = async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const { email, name } = ticket.getPayload();

        const dominioUsuario = email.split('@')[1].toLowerCase();
        const dominiosPermitidosStr = process.env.DOMINIOS_DOCENTES || '';
        const dominiosDocente = dominiosPermitidosStr.split(',');
        let rolAsignado = dominiosDocente.includes(dominioUsuario) ? 'docente' : 'estudiante';

        let usuario = await Usuario.findOne({ where: { correo: email } });
        let esNuevo = false;

        if (!usuario) {
            usuario = await Usuario.create({
                nombre_completo: name,
                correo: email,
                rol: rolAsignado,
                hash_password: 'LOGIN_GOOGLE_OAUTH',
                verificado: true,
                estado: 'Activo',
                fecha_registro: new Date(),
                ultima_conexion: new Date()
            });
            esNuevo = true;
        } else {
            usuario.ultima_conexion = new Date();
            await usuario.save();
        }

        let requiereDiagnostico = true;

        if (!esNuevo) {
            const [hasDiag] = await db.query(
                'SELECT id_diagnostico FROM diagnostico WHERE id_usuario = ? LIMIT 1',
                { replacements: [usuario.id_usuario], type: db.QueryTypes.SELECT }
            );

            if (usuario.rango || usuario.rango_actual || hasDiag) {
                requiereDiagnostico = false;
            }
        }

        const payloadJWT = { id_usuario: usuario.id_usuario, rol: usuario.rol };
        const tokenPMM = jwt.sign(payloadJWT, process.env.JWT_SECRET, { expiresIn: '8h' });

        res.status(200).json({
            mensaje: 'Sello de Google validado exitosamente.',
            token: tokenPMM,
            requiereDiagnostico: requiereDiagnostico,
            usuario: {
                id_usuario: usuario.id_usuario,
                nombre_completo: usuario.nombre_completo,
                correo: usuario.correo,
                rol: usuario.rol,
                rango: usuario.rango
            }
        });

    } catch (error) {
        console.error("❌ Error validando Google Token:", error);
        res.status(401).json({ mensaje: "El sello de Google no es válido." });
    }
};

// -----------------------------------------------------------------
// 4. Solicitar Recuperación de Contraseña (Bypass SMTP)
// -----------------------------------------------------------------
exports.forgotPassword = async (req, res) => {
    try {
        const { correo } = req.body;
        const usuario = await Usuario.findOne({ where: { correo } });

        if (!usuario) {
            return res.status(200).json({
                mensaje: 'Si el correo existe en nuestra aldea, hemos emitido una orden de recuperación.'
            });
        }

        const tokenRecuperacion = jwt.sign(
            { id_usuario: usuario.id_usuario },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        const urlRecuperacion = `${process.env.FRONTEND_URL}/reset-password/${tokenRecuperacion}`;

        // 🚩 BYPASS PARA TESIS: Como no hay servidor SMTP habilitado, mostramos el link en la consola.
        console.log(`\n======================================================`);
        console.log(`🔐 SOLICITUD DE RECUPERACIÓN DE CONTRASEÑA`);
        console.log(`Ninja: ${usuario.nombre_completo} (${correo})`);
        console.log(`Haz clic en el siguiente enlace para restablecerla:`);
        console.log(`${urlRecuperacion}`);
        console.log(`======================================================\n`);

        res.status(200).json({
            mensaje: 'Proceso de recuperación iniciado. (Revisa la consola del servidor en Railway)'
        });

    } catch (error) {
        console.error('❌ Error en forgotPassword:', error);
        res.status(500).json({ mensaje: 'Error interno al procesar la solicitud.' });
    }
};

// -----------------------------------------------------------------
// 5. Restablecer Contraseña (Reset Password)
// -----------------------------------------------------------------
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { nuevaPassword } = req.body;

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const usuario = await Usuario.findByPk(decoded.id_usuario);
        if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado.' });

        const salt = await bcrypt.genSalt(10);
        const hash_password = await bcrypt.hash(nuevaPassword, salt);

        usuario.hash_password = hash_password;
        // Si tu modelo usa 'password' en vez de 'hash_password', descomenta la línea de abajo y comenta la de arriba:
        // usuario.password = hash_password; 

        await usuario.save();

        res.status(200).json({ mensaje: '¡Tu sello ha sido restaurado con éxito! Ya puedes iniciar sesión.' });

    } catch (error) {
        console.error("❌ Error validando token de recuperación:", error.message);
        res.status(401).json({ mensaje: 'El enlace de recuperación es inválido o ha expirado.' });
    }
};

// -----------------------------------------------------------------
// 6. Endpoint de Compatibilidad (Evita que el Frontend explote si aún busca esta ruta)
// -----------------------------------------------------------------
exports.verificarCorreo = async (req, res) => {
    // Si el Frontend aún tiene un botón de "Verificar", le decimos que todo está bien.
    res.status(200).json({ 
        mensaje: "¡Tu chakra ya está desbloqueado! Sistema de verificación simplificado.",
        yaEstabaActivo: true 
    });
};
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const axios = require('axios'); // Ya lo tienes instalado
const Usuario = require('../models/Usuario');
const { OAuth2Client } = require('google-auth-library');
const db = require('../config/database');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// 🛡️ CONFIGURACIÓN DEL TRANSPORTADOR DE CORREOS
const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// 🚩 EL NUEVO ESCUDO: Validación de Buzón con ZeroBounce
const validarBuzonReal = async (correo) => {
    try {
        const apiKey = process.env.ZEROBOUNCE_API_KEY?.trim();
        
        // 🛡️ REGLA ESTRICTA (Fail-Closed): Si no hay llave, bloqueamos el registro.
        if (!apiKey) {
            console.error("🚨 CRÍTICO: No se encontró ZEROBOUNCE_API_KEY en el .env. Servidor vulnerable.");
            return false; 
        }

        // URL de la API v2 de ZeroBounce
        const url = `https://api.zerobounce.net/v2/validate?api_key=${apiKey}&email=${correo}`;
        
        console.log(`🔍 Consultando a ZeroBounce el correo: ${correo}...`);
        const respuesta = await axios.get(url);
        
        const estado = respuesta.data.status;
        console.log(`📡 Respuesta de ZeroBounce: [${estado}]`);

        // ZeroBounce responde con: "valid", "invalid", "catch-all", "unknown", "spamtrap", etc.
        // Solo bloqueamos de forma absoluta si la API asegura que es "invalid" (no existe).
        if (estado === "invalid") {
            return false; 
        }
        
        return true; 
    } catch (error) {
        console.error("🚨 Error de conexión con ZeroBounce:", error.response?.data || error.message);
        // Si la API falla por red o llave incorrecta, bloqueamos el registro para proteger la DB
        return false; 
    }
};

// -----------------------------------------------------------------
// 1. Registro Manual (Con Verificación de Buzón y Envío de Correo)
// -----------------------------------------------------------------
exports.register = async (req, res) => {
    try {
        const { nombre_completo, correo, password, rol } = req.body;

        // 🛡️ 1. VERIFICACIÓN DE BUZÓN EN TIEMPO REAL (Falla Rápido)
        const buzonEsReal = await validarBuzonReal(correo);
        if (!buzonEsReal) {
            return res.status(400).json({ 
                mensaje: 'Este buzón de correo no existe o no puede recibir mensajes. Usa un correo real.' 
            });
        }

        // 🛡️ 2. Verificación de duplicados
        const usuarioExistente = await Usuario.findOne({ where: { correo } });
        if (usuarioExistente) {
            return res.status(400).json({ mensaje: 'El correo ya está registrado.' });
        }

        // 🔐 3. Encriptación
        const salt = await bcrypt.genSalt(10);
        const hash_password = await bcrypt.hash(password, salt);

        // 💾 4. Guardar en Base de Datos (Inactivo por defecto)
        const nuevoUsuario = await Usuario.create({
            nombre_completo,
            correo,
            hash_password,
            rol: rol || 'estudiante',
            verificado: false, // 👈 Nace inactivo
            fecha_registro: new Date() 
        });

        // 🎟️ 5. Generar Token de Verificación (1 hora)
        const tokenVerificacion = jwt.sign(
            { id_usuario: nuevoUsuario.id_usuario },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // ✉️ 6. Enviar el correo de activación
        const urlConfirmacion = `${process.env.FRONTEND_URL}/verificar-correo/${tokenVerificacion}`;

        await transporter.sendMail({
            from: `"Academia PMM" <${process.env.SMTP_USER}>`,
            to: correo,
            subject: "⚔️ Confirma tu Sello Ninja en PMM Interactivo",
            html: `
                <div style="font-family: sans-serif; text-align: center; padding: 20px;">
                    <h2>¡Bienvenido a la Aldea, ${nombre_completo}!</h2>
                    <p>Para activar tu chakra y entrar al sistema, debes confirmar que este correo es real.</p>
                    <a href="${urlConfirmacion}" style="background: #C5A059; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px;">
                        Verificar mi Correo
                    </a>
                    <p style="font-size: 12px; color: #666; margin-top: 20px;">Este enlace expirará en 1 hora.</p>
                </div>
            `
        });

        res.status(201).json({
            mensaje: 'Registro exitoso. Revisa tu bandeja de entrada para activar tu cuenta.'
        });

    } catch (error) {
        console.error('Error en el registro:', error);
        res.status(500).json({ mensaje: 'Error interno al forjar el registro.' });
    }
};

// -----------------------------------------------------------------
// 2. Nuevo Endpoint: Confirmar Correo
// -----------------------------------------------------------------
exports.verificarCorreo = async (req, res) => {
    try {
        const { token } = req.params;

        // Desencriptar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Buscar usuario y activarlo
        const usuario = await Usuario.findByPk(decoded.id_usuario);
        if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado." });
        if (usuario.verificado) return res.status(400).json({ mensaje: "Este sello ya fue activado previamente." });

        usuario.verificado = true;
        await usuario.save();

        res.status(200).json({ mensaje: "¡Tu correo ha sido verificado! Ya puedes iniciar sesión." });
    } catch (error) {
        res.status(401).json({ mensaje: "El enlace es inválido o ha expirado." });
    }
};

// -----------------------------------------------------------------
// 3. Lógica de Login (Bloqueo si no está verificado)
// -----------------------------------------------------------------
exports.login = async (req, res) => {
    try {
        const { correo, password } = req.body;

        const usuario = await Usuario.findOne({ where: { correo } });
        if (!usuario) return res.status(404).json({ mensaje: 'Credenciales inválidas.' });

        // 🛡️ EL CANDADO MAESTRO
        if (usuario.verificado === false || usuario.verificado === 0) {
            return res.status(403).json({
                mensaje: 'Tu cuenta no está activa. Por favor, revisa tu correo electrónico y haz clic en el enlace de verificación.'
            });
        }

        const esPasswordValido = await bcrypt.compare(password, usuario.hash_password);
        if (!esPasswordValido) return res.status(401).json({ mensaje: 'Credenciales inválidas.' });

        const payload = { id_usuario: usuario.id_usuario, rol: usuario.rol };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

        res.status(200).json({
            mensaje: 'Inicio de sesión exitoso.',
            token,
           usuario: { 
        id_usuario: usuario.id_usuario, 
        nombre_completo: usuario.nombre_completo, 
        correo: usuario.correo, 
        rol: usuario.rol,
        rango: usuario.rango // 👈 ESTA LÍNEA ES VITAL
    }
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};

// -----------------------------------------------------------------
// 4. Lógica Google OAuth (Nace verificado automáticamente)
// -----------------------------------------------------------------
exports.googleLogin = async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const { email, name } = ticket.getPayload();

        // Buscamos si el ninja ya existe
        let usuario = await Usuario.findOne({ where: { correo: email } });
        let esNuevo = false;

        if (!usuario) {
            usuario = await Usuario.create({
                nombre_completo: name,
                correo: email,
                rol: 'estudiante',
                hash_password: 'LOGIN_GOOGLE_OAUTH',
                verificado: true, 
                fecha_registro: new Date() 
            });
            esNuevo = true; // Si lo acabamos de crear, definitivamente es nuevo
        }

        // 🚩 BLINDAJE: Evaluación de Diagnóstico
        let requiereDiagnostico = true;

        if (!esNuevo) {
            // Si el usuario ya existía, verificamos si completó su diagnóstico
            const [hasDiag] = await db.query(
                'SELECT id_diagnostico FROM diagnostico WHERE id_usuario = ? LIMIT 1', 
                { replacements: [usuario.id_usuario], type: db.QueryTypes.SELECT }
            );

            // Si tiene rango asignado O tiene un registro en la tabla diagnostico, lo dejamos pasar
            if (usuario.rango || usuario.rango_actual || hasDiag) {
                requiereDiagnostico = false;
            }
        }

        const payloadJWT = { id_usuario: usuario.id_usuario, rol: usuario.rol };
        const tokenPMM = jwt.sign(payloadJWT, process.env.JWT_SECRET, { expiresIn: '8h' });

        res.status(200).json({
            mensaje: 'Sello de Google validado exitosamente.',
            token: tokenPMM,
            requiereDiagnostico: requiereDiagnostico, // 🚩 Bandera vital para Login.jsx
            usuario: { 
                id_usuario: usuario.id_usuario, 
                nombre_completo: usuario.nombre_completo, 
                correo: usuario.correo, 
                rol: usuario.rol,
                rango: usuario.rango // Enviamos el rango por si el frontend lo necesita
            }
        });

    } catch (error) {
        console.error("Error validando Google Token:", error); 
        res.status(401).json({ mensaje: "El sello de Google no es válido." });
    }
};

// -----------------------------------------------------------------
// 5. Solicitar Recuperación de Contraseña (Forgot Password)
// -----------------------------------------------------------------
exports.forgotPassword = async (req, res) => {
    try {
        const { correo } = req.body;

        // 1. Buscamos al ninja en la base de datos
        const usuario = await Usuario.findOne({ where: { correo } });
        
        // 🛡️ REGLA DE SEGURIDAD: Respondemos "Éxito" incluso si no existe. 
        // Esto evita que los hackers usen este formulario para adivinar qué correos existen en tu sistema.
        if (!usuario) {
            return res.status(200).json({ 
                mensaje: 'Si el correo existe en nuestra aldea, hemos enviado un pergamino de recuperación.' 
            });
        }

        // 2. Generamos un Token de Vida Corta (15 minutos)
        const tokenRecuperacion = jwt.sign(
            { id_usuario: usuario.id_usuario },
            process.env.JWT_SECRET,
            { expiresIn: '15m' } // 👈 Alta seguridad: expira rápido
        );

        // 3. Preparamos el enlace hacia tu Frontend de React
        const urlRecuperacion = `${process.env.FRONTEND_URL}/reset-password/${tokenRecuperacion}`;

        // 4. Enviamos el correo
        await transporter.sendMail({
            from: `"Seguridad PMM" <${process.env.SMTP_USER}>`,
            to: correo,
            subject: "🗝️ Recupera tu acceso a PMM Interactivo",
            html: `
                <div style="font-family: sans-serif; text-align: center; padding: 20px;">
                    <h2>Recuperación de Sello (Contraseña)</h2>
                    <p>Hola ${usuario.nombre_completo}, hemos recibido una petición para restaurar tu acceso.</p>
                    <a href="${urlRecuperacion}" style="background: #8B0000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px;">
                        Restablecer Contraseña
                    </a>
                    <p style="font-size: 12px; color: #666; margin-top: 20px;">
                        ⚠️ Este enlace es de un solo uso y se autodestruirá en 15 minutos.<br>
                        Si no fuiste tú, ignora este mensaje.
                    </p>
                </div>
            `
        });

        res.status(200).json({ 
            mensaje: 'Si el correo existe en nuestra aldea, hemos enviado un pergamino de recuperación.' 
        });

    } catch (error) {
        console.error('Error en forgotPassword:', error);
        res.status(500).json({ mensaje: 'Error interno al procesar la solicitud.' });
    }
};

// -----------------------------------------------------------------
// 6. Restablecer Contraseña (Reset Password)
// -----------------------------------------------------------------
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { nuevaPassword } = req.body;

        // 1. Verificamos que el token no haya explotado (caducado) ni sea falso
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 2. Buscamos al usuario
        const usuario = await Usuario.findByPk(decoded.id_usuario);
        if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado.' });

        // 3. Encriptamos la nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hash_password = await bcrypt.hash(nuevaPassword, salt);

        // 4. Guardamos en la base de datos
        usuario.hash_password = hash_password;
        await usuario.save();

        res.status(200).json({ mensaje: '¡Tu sello ha sido restaurado con éxito! Ya puedes iniciar sesión.' });

    } catch (error) {
        // Si jwt.verify falla (porque expiró o lo alteraron), cae aquí
        console.error("Error validando token de recuperación:", error.message);
        res.status(401).json({ mensaje: 'El enlace de recuperación es inválido o ha expirado.' });
    }
};
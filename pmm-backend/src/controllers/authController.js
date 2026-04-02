const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const axios = require('axios');
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
// 1. Registro Manual (Con Filtro Institucional y ZeroBounce)
// -----------------------------------------------------------------
exports.register = async (req, res) => {
    try {
        const { nombre_completo, correo, password } = req.body;

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

        // 🚩 3. LÓGICA DE ASIGNACIÓN DE ROLES POR DOMINIO INSTITUCIONAL
        const dominioUsuario = correo.split('@')[1].toLowerCase();
        const dominiosPermitidosStr = process.env.DOMINIOS_DOCENTES || '';
        const dominiosDocente = dominiosPermitidosStr.split(',');

        let rolAsignado = 'estudiante'; // Por defecto, todos son estudiantes

        if (dominiosDocente.includes(dominioUsuario)) {
            rolAsignado = 'docente'; // ¡Sensei detectado mediante correo UNIAJC!
        }

        // 🔐 4. Encriptación
        const salt = await bcrypt.genSalt(10);
        const hash_password = await bcrypt.hash(password, salt);

        // 💾 5. Guardar en Base de Datos (Inactivo por defecto)
        const nuevoUsuario = await Usuario.create({
            nombre_completo,
            correo,
            hash_password,
            rol: rolAsignado, // 👈 Aplicamos la decisión del motor inteligente
            verificado: false,
            estado: 'Inactivo', // 👈 Sincronizamos con el Dashboard del docente
            fecha_registro: new Date()
        });

        // 🎟️ 6. Generar Token de Verificación (1 hora)
        const tokenVerificacion = jwt.sign(
            { id_usuario: nuevoUsuario.id_usuario },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // ✉️ 7. Enviar el correo de activación notificando el ROL
        const urlConfirmacion = `${process.env.FRONTEND_URL}/verificar-correo/${tokenVerificacion}`;

        await transporter.sendMail({
            from: `"Academia PMM" <${process.env.SMTP_USER}>`,
            to: correo,
            subject: "⚔️ Confirma tu Sello Ninja en PMM Interactivo",
            html: `
                <div style="font-family: sans-serif; text-align: center; padding: 20px;">
                    <h2>¡Bienvenido a la Aldea, ${nombre_completo}!</h2>
                    <p>El sistema te ha reconocido bajo el rango de <b>${rolAsignado.toUpperCase()}</b>.</p>
                    <p>Para activar tu chakra y entrar al sistema, debes confirmar que este correo es real.</p>
                    <a href="${urlConfirmacion}" style="background: #C5A059; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px;">
                        Verificar mi Correo
                    </a>
                    <p style="font-size: 12px; color: #666; margin-top: 20px;">Este enlace expirará en 1 hora.</p>
                </div>
            `
        });

        res.status(201).json({
            mensaje: 'Registro exitoso. Revisa tu bandeja de entrada para activar tu cuenta.',
            rol: rolAsignado
        });

    } catch (error) {
        console.error('Error en el registro:', error);
        res.status(500).json({ mensaje: 'Error interno al forjar el registro.' });
    }
};

// -----------------------------------------------------------------
// 2. Nuevo Endpoint: Confirmar Correo (Versión Antigolpes 🛡️)
// -----------------------------------------------------------------
exports.verificarCorreo = async (req, res) => {
    try {
        const { token } = req.params;

        // 1. Desencriptar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 2. BLINDAJE DE PAYLOAD
        const idDelNinja = decoded.id_usuario || decoded.id;

        if (!idDelNinja) {
            return res.status(400).json({ mensaje: "El pergamino no contiene la identidad del ninja." });
        }

        // 3. Buscar usuario
        const usuario = await Usuario.findByPk(idDelNinja);
        if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado." });

        // 🚩 4. EL CAMBIO CLAVE: 
        // Si ya está verificado, no disparamos un error (status 400). 
        // Respondemos con éxito (status 200) para que el Frontend no se asuste.
        if (usuario.verificado || usuario.verificado === 1) {
            console.log("♻️  Petición duplicada detectada, pero el usuario ya estaba activo.");
            return res.status(200).json({ 
                mensaje: "¡Sello activo! Redirigiendo a la academia...",
                yaEstabaActivo: true 
            });
        }

        // 5. Activación Real (Solo ocurre la primera vez)
        usuario.verificado = true;
        usuario.estado = 'Activo';
        await usuario.save();

        res.status(200).json({ mensaje: "¡Tu correo ha sido verificado! Tu chakra ha sido desbloqueado." });

    } catch (error) {
        console.error("❌ Error real en verificarCorreo:", error.name, error.message);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ mensaje: "El enlace de 1 hora ha caducado. Solicita uno nuevo." });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ mensaje: "El código de verificación está corrupto o mal copiado." });
        }
        res.status(500).json({ mensaje: "Error interno al romper el sello." });
    }
};

// -----------------------------------------------------------------
// 3. Lógica de Login (Sincronizada con Diagnóstico)
// -----------------------------------------------------------------
exports.login = async (req, res) => {
    try {
        const { correo, password } = req.body;
        const usuario = await Usuario.findOne({ where: { correo } });

        if (!usuario) return res.status(404).json({ mensaje: 'Credenciales inválidas.' });
        if (!usuario.verificado) return res.status(403).json({ mensaje: 'Cuenta no activa. Revisa tu correo.' });

        const esPasswordValido = await bcrypt.compare(password, usuario.hash_password);
        if (!esPasswordValido) return res.status(401).json({ mensaje: 'Credenciales inválidas.' });

        // 🚩 EL BUSCADOR DE HUELLAS: Verificamos si este ID ya pasó por el diagnóstico
        const [hasDiag] = await db.query(
            'SELECT id_diagnostico FROM diagnostico WHERE id_usuario = ? LIMIT 1',
            { replacements: [usuario.id_usuario], type: db.QueryTypes.SELECT }
        );

        // Si encontramos un registro, ya no requiere diagnóstico
        const requiereDiagnostico = hasDiag ? false : true;

        usuario.ultima_conexion = new Date();
        await usuario.save();

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
                // Si 'rango' está vacío, usa 'rango_actual'
                // Esto asegura que el Frontend reciba "Jonin (Maestro)" sí o sí.
                rango: usuario.rango || usuario.rango_actual
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

        // 🚩 LÓGICA DE ROLES POR DOMINIO (También aplica para Google Login)
        const dominioUsuario = email.split('@')[1].toLowerCase();
        const dominiosPermitidosStr = process.env.DOMINIOS_DOCENTES || '';
        const dominiosDocente = dominiosPermitidosStr.split(',');
        let rolAsignado = dominiosDocente.includes(dominioUsuario) ? 'docente' : 'estudiante';

        // Buscamos si el ninja ya existe
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
            // Actualizamos su última conexión si ya existía
            usuario.ultima_conexion = new Date();
            await usuario.save();
        }

        // 🚩 BLINDAJE: Evaluación de Diagnóstico
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
        if (!usuario) {
            return res.status(200).json({
                mensaje: 'Si el correo existe en nuestra aldea, hemos enviado un pergamino de recuperación.'
            });
        }

        // 2. Generamos un Token de Vida Corta (15 minutos)
        const tokenRecuperacion = jwt.sign(
            { id_usuario: usuario.id_usuario },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
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
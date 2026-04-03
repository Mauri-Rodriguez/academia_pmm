const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');
const axios = require('axios');
const Usuario = require('../models/Usuario');
const { OAuth2Client } = require('google-auth-library');
const db = require('../config/database');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const resend = new Resend(process.env.RESEND_API_KEY);


// ESCUDO: Validación de Buzón con Hunter.io
const validarBuzonReal = async (correo) => {
    try {
        const apiKey = process.env.HUNTER_API_KEY?.trim();

        // Si no hay llave configurada, dejamos pasar (Fail-Open)
        if (!apiKey) {
            console.warn("⚠️ ADVERTENCIA: HUNTER_API_KEY no encontrada. Omitiendo validación.");
            return true;
        }

        const url = `https://api.hunter.io/v2/email-verifier?email=${correo}&api_key=${apiKey}`;
        console.log(`🔍 Consultando a Hunter.io el correo: ${correo}...`);

        const respuesta = await axios.get(url);

        // Hunter.io guarda el estado dentro de data.data.status
        const estado = respuesta.data?.data?.status;
        console.log(`📡 Respuesta de Hunter.io: [${estado}]`);

        // Estados posibles en Hunter: 'valid', 'invalid', 'accept_all', 'webmail', 'disposable', 'unknown'
        // 🛡️ Solo bloqueamos si la API jura que NO existe
        if (estado === "invalid") {
            return false;
        }

        // Si es válido o cualquier otro estado dudoso, lo dejamos pasar
        return true;

    } catch (error) {
        // Capturamos cualquier error de red o límite de API
        console.error("🚨 Error de infraestructura al contactar Hunter.io:", error.response?.data?.errors[0]?.details || error.message);

        // 🛡️ LA MAGIA DEL FAIL-OPEN:
        console.log(`[Bypass Ninja] 🥷 Permitido por Fail-Open. No se pudo verificar ${correo}.`);
        return true;
    }
};
// -----------------------------------------------------------------
// 1. Registro Manual (Con Filtro Institucional y Hunter.io)
// -----------------------------------------------------------------
exports.register = async (req, res) => {
    try {
        const { nombre_completo, correo, password } = req.body;

        const buzonEsReal = await validarBuzonReal(correo);
        if (!buzonEsReal) {
            return res.status(400).json({ mensaje: 'Este buzón de correo no existe. Usa uno real.' });
        }

        const usuarioExistente = await Usuario.findOne({ where: { correo } });
        if (usuarioExistente) {
            return res.status(400).json({ mensaje: 'El correo ya está registrado.' });
        }

        const dominioUsuario = correo.split('@')[1].toLowerCase();
        const dominiosPermitidosStr = process.env.DOMINIOS_DOCENTES || '';
        const dominiosDocente = dominiosPermitidosStr.split(',');
        let rolAsignado = dominiosDocente.includes(dominioUsuario) ? 'docente' : 'estudiante';

        const salt = await bcrypt.genSalt(10);
        const hash_password = await bcrypt.hash(password, salt);

        const nuevoUsuario = await Usuario.create({
            nombre_completo,
            correo,
            hash_password,
            rol: rolAsignado,
            verificado: true,
            estado: 'activo',
            fecha_registro: new Date()
        });

        const tokenVerificacion = jwt.sign(
            { id_usuario: nuevoUsuario.id_usuario },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        const urlConfirmacion = `${process.env.FRONTEND_URL}/verificar-correo/${tokenVerificacion}`;

        // ✉️ ENVÍO CON RESEND (Adiós ENETUNREACH)
        try {
            await resend.emails.send({
                from: 'Academia PMM <onboarding@resend.dev>', // 👈 Importante: Usar este mientras verificas tu dominio
                to: correo,
                subject: "⚔️ Confirma tu Sello Ninja en PMM Interactivo",
                html: `
                    <div style="font-family: sans-serif; text-align: center; padding: 20px; border-top: 5px solid #C5A059;">
                        <h2>¡Bienvenido a la Aldea, ${nombre_completo}!</h2>
                        <p>Has sido reconocido como: <b>${rolAsignado.toUpperCase()}</b>.</p>
                        <p>Haz clic abajo para activar tu cuenta y comenzar el entrenamiento:</p>
                        <a href="${urlConfirmacion}" style="background: #C5A059; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px; font-weight: bold;">
                            VERIFICAR MI CORREO
                        </a>
                    </div>
                `
            });
            console.log(`📧 Correo enviado vía Resend a ${correo}`);
        } catch (mailError) {
            console.error("⚠️ Fallo en Resend:", mailError.message);
        }

        return res.status(201).json({
            mensaje: 'Registro exitoso. Revisa tu correo para activar tu cuenta.',
            rol: rolAsignado
        });

    } catch (error) {
        console.error('Error crítico en el registro:', error);
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
        const usuario = await Usuario.findOne({ where: { correo } });

        if (!usuario) {
            return res.status(200).json({ mensaje: 'Si el correo existe, recibirás instrucciones.' });
        }

        const tokenRecuperacion = jwt.sign(
            { id_usuario: usuario.id_usuario },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        const urlRecuperacion = `${process.env.FRONTEND_URL}/reset-password/${tokenRecuperacion}`;

        // 🗝️ ENVÍO CON RESEND
        await resend.emails.send({
            from: 'Seguridad PMM <onboarding@resend.dev>',
            to: correo,
            subject: "🗝️ Recupera tu acceso a PMM Interactivo",
            html: `
                <div style="font-family: sans-serif; text-align: center; padding: 20px;">
                    <h2>Recuperación de Sello</h2>
                    <p>Hola ${usuario.nombre_completo}, usa este enlace para cambiar tu contraseña:</p>
                    <a href="${urlRecuperacion}" style="background: #8B0000; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px;">
                        Restablecer Contraseña
                    </a>
                    <p style="font-size: 11px; color: #666; margin-top: 20px;">Expira en 15 minutos.</p>
                </div>
            `
        });

        res.status(200).json({ mensaje: 'Correo de recuperación enviado.' });

    } catch (error) {
        console.error('Error en forgotPassword:', error);
        res.status(500).json({ mensaje: 'Error interno.' });
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
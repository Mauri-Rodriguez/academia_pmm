const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');
const Usuario = require('../models/Usuario');
const { OAuth2Client } = require('google-auth-library');
const db = require('../config/database');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// 🛡️ INFRAESTRUCTURA DE CORREO (Fallback Seguro)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
if (!resend) console.warn("⚠️ [CONFIG] RESEND_API_KEY no detectada. Modo simulacro activo.");

// -----------------------------------------------------------------
// 1. Registro Manual (Arquitectura Startup)
// -----------------------------------------------------------------
exports.register = async (req, res) => {
    try {
        const { nombre_completo, correo, password } = req.body;

        // 🛡️ Validación de Formato (Evita crashes)
        if (!correo || !correo.includes('@')) {
            return res.status(400).json({ mensaje: 'Formato de correo inválido.' });
        }

        const usuarioExistente = await Usuario.findOne({ where: { correo } });
        if (usuarioExistente) {
            return res.status(400).json({ mensaje: 'El correo ya está registrado en la aldea.' });
        }

        // 🚩 Asignación de Roles por Dominio
        const dominioUsuario = correo.split('@')[1].toLowerCase();
        const dominiosDocente = process.env.DOMINIOS_DOCENTES ? process.env.DOMINIOS_DOCENTES.split(',') : [];
        let rolAsignado = dominiosDocente.includes(dominioUsuario) ? 'docente' : 'estudiante';

        // 🔐 Encriptación de contraseña
        const salt = await bcrypt.genSalt(10);
        const hash_password = await bcrypt.hash(password, salt);

        // 💾 Crear Usuario (Nace Inactivo)
        const nuevoUsuario = await Usuario.create({
            nombre_completo,
            correo,
            hash_password,
            rol: rolAsignado,
            verificado: false,
            estado: 'Inactivo',
            fecha_registro: new Date()
        });

        // 🔐 Generar Token Criptográfico (Con ID inmutable)
        const tokenVerificacion = jwt.sign(
            { id_usuario: nuevoUsuario.id_usuario },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 🛡️ Persistencia del token de verificación
        nuevoUsuario.verification_token = tokenVerificacion;
        nuevoUsuario.verification_token_expiry = Date.now() + 86400000; // 24h
        await nuevoUsuario.save();

        const urlConfirmacion = `${process.env.FRONTEND_URL}/verificar-correo/${tokenVerificacion}`;

        // ✉️ Envío de Correo vía Resend
        if (resend) {
            try {
                // TODO: Cambiar 'onboarding@resend.dev' por dominio real en producción
                await resend.emails.send({
                    from: 'Academia PMM <onboarding@resend.dev>',
                    to: correo,
                    subject: "⚔️ Activa tu Sello Ninja en PMM Interactivo",
                    html: `
                        <div style="font-family: sans-serif; text-align: center; padding: 20px; border-top: 5px solid #C5A059;">
                            <h2>¡Bienvenido a la Aldea, ${nombre_completo}!</h2>
                            <p>Has sido reconocido como: <b>${rolAsignado.toUpperCase()}</b>.</p>
                            <p>Para activar tu cuenta y comenzar el entrenamiento, haz clic en el siguiente enlace:</p>
                            <a href="${urlConfirmacion}" style="background: #C5A059; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px; font-weight: bold;">
                                ACTIVAR MI CUENTA
                            </a>
                            <p style="font-size: 11px; color: #666; margin-top: 20px;">Este enlace expira en 24 horas.</p>
                        </div>
                    `
                });
            } catch (err) { console.error("📧 Fallo envío Resend:", err.message); }
        }

        // 🛡️ Cero exposición en producción, visible en desarrollo
        if (process.env.NODE_ENV !== "production") {
            console.log(`[DEV LOG] Link de verificación para ${correo}: ${urlConfirmacion}`);
        }

        return res.status(201).json({
            mensaje: 'Registro exitoso. Revisa tu correo para activar tu cuenta.',
            rol: rolAsignado
        });

    } catch (error) {
        console.error('🚨 Error en registro:', error);
        res.status(500).json({ mensaje: 'Error interno al forjar el registro.' });
    }
};

// -----------------------------------------------------------------
// 2. Verificar Correo (Triple-Check Validado)
// -----------------------------------------------------------------
exports.verificarCorreo = async (req, res) => {
    try {
        const { token } = req.params;

        // 1. Validar existencia en DB
        const usuario = await Usuario.findOne({ where: { verification_token: token } });
        if (!usuario) return res.status(401).json({ mensaje: 'Token de verificación inválido o ya utilizado.' });

        // 2. Validar expiración temporal
        if (Date.now() > usuario.verification_token_expiry) {
            return res.status(401).json({ mensaje: 'El enlace de activación ha caducado. Solicita uno nuevo.' });
        }

        // 3. Validar integridad JWT
        jwt.verify(token, process.env.JWT_SECRET);

        // 4. Activación Real e Invalidación de Token
        usuario.verificado = true;
        usuario.estado = 'Activo';
        usuario.verification_token = null; 
        usuario.verification_token_expiry = null;
        await usuario.save();

        res.status(200).json({ mensaje: '¡Tu cuenta ha sido activada exitosamente! Ya puedes iniciar sesión.' });

    } catch (error) {
        res.status(401).json({ mensaje: 'Token corrupto o expirado.' });
    }
};

// -----------------------------------------------------------------
// 3. Inicio de Sesión (Login Clásico)
// -----------------------------------------------------------------
exports.login = async (req, res) => {
    try {
        const { correo, password } = req.body;
        const usuario = await Usuario.findOne({ where: { correo } });

        if (!usuario) return res.status(404).json({ mensaje: 'Credenciales inválidas.' });
        
        // 🛡️ Validación de Cuenta Activa
        if (!usuario.verificado) return res.status(403).json({ mensaje: 'Cuenta no activa. Por favor, verifica tu correo.' });

        const esPasswordValido = await bcrypt.compare(password, usuario.hash_password);
        if (!esPasswordValido) return res.status(401).json({ mensaje: 'Credenciales inválidas.' });

        // 🚩 Buscador de Huellas: Diagnóstico inicial
        const [hasDiag] = await db.query(
            'SELECT id_diagnostico FROM diagnostico WHERE id_usuario = ? LIMIT 1',
            { replacements: [usuario.id_usuario], type: db.QueryTypes.SELECT }
        );

        const requiereDiagnostico = hasDiag ? false : true;

        // Actualizar última conexión
        usuario.ultima_conexion = new Date();
        await usuario.save();

        const token = jwt.sign(
            { id_usuario: usuario.id_usuario, rol: usuario.rol }, 
            process.env.JWT_SECRET, 
            { expiresIn: '8h' }
        );

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
        console.error('Error en Login:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};

// -----------------------------------------------------------------
// 4. Lógica Google OAuth (Auto-verificado)
// -----------------------------------------------------------------
exports.googleLogin = async (req, res) => {
    try {
        const { token } = req.body;
        
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const { email, name } = ticket.getPayload();

        // 🚩 Lógica de roles por dominio
        const dominioUsuario = email.split('@')[1].toLowerCase();
        const dominiosDocente = process.env.DOMINIOS_DOCENTES ? process.env.DOMINIOS_DOCENTES.split(',') : [];
        let rolAsignado = dominiosDocente.includes(dominioUsuario) ? 'docente' : 'estudiante';

        let usuario = await Usuario.findOne({ where: { correo: email } });
        let esNuevo = false;

        if (!usuario) {
            // Usuario de Google nace activo y verificado automáticamente
            usuario = await Usuario.create({
                nombre_completo: name,
                correo: email,
                rol: rolAsignado,
                hash_password: 'LOGIN_GOOGLE_OAUTH', // Dummy password
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

        // 🚩 Evaluación de Diagnóstico
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
        res.status(401).json({ mensaje: "El sello de Google no es válido o expiró." });
    }
};

// -----------------------------------------------------------------
// 5. Recuperación de Contraseña (OWASP Anti-Enumeración)
// -----------------------------------------------------------------
exports.forgotPassword = async (req, res) => {
    try {
        const { correo } = req.body;
        const usuario = await Usuario.findOne({ where: { correo } });

        // 🛡️ Anti-enumeración: Siempre responde lo mismo exista o no
        if (!usuario) {
            return res.status(200).json({ mensaje: 'Si el correo es válido, recibirás instrucciones pronto.' });
        }

        const tokenRecuperacion = jwt.sign(
            { id_usuario: usuario.id_usuario }, 
            process.env.JWT_SECRET, 
            { expiresIn: '15m' }
        );

        // 🛡️ Persistencia de Reset Token
        usuario.reset_token = tokenRecuperacion;
        usuario.reset_token_expiry = Date.now() + 900000; // 15 min
        await usuario.save();

        const urlRecuperacion = `${process.env.FRONTEND_URL}/reset-password/${tokenRecuperacion}`;
        
        // 🛡️ Logs limpios en producción
        if (process.env.NODE_ENV !== "production") {
            console.log(`🗝️ [DEV LOG] Token de recuperación para ${correo}: ${urlRecuperacion}`);
        }

        if (resend) {
            await resend.emails.send({
                from: 'Seguridad PMM <onboarding@resend.dev>',
                to: correo,
                subject: "🗝️ Recuperación de acceso a PMM Interactivo",
                html: `
                    <div style="font-family: sans-serif; text-align: center; padding: 20px;">
                        <h2>Restablecer Sello Ninja</h2>
                        <p>Hola ${usuario.nombre_completo}, hemos recibido una solicitud para cambiar tu contraseña.</p>
                        <a href="${urlRecuperacion}" style="background: #8B0000; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px;">
                            Restablecer Contraseña
                        </a>
                        <p style="font-size: 11px; color: #666; margin-top: 20px;">Este enlace es válido solo por 15 minutos.</p>
                    </div>
                `
            });
        }

        res.status(200).json({ mensaje: 'Si el correo es válido, recibirás instrucciones pronto.' });

    } catch (error) {
        console.error('Error en forgotPassword:', error);
        res.status(500).json({ mensaje: 'Error interno al procesar recuperación.' });
    }
};

// -----------------------------------------------------------------
// 6. Restablecer Contraseña (Triple Validación OWASP)
// -----------------------------------------------------------------
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { nuevaPassword } = req.body;

        // 1. Validar unicidad y existencia en DB
        const usuario = await Usuario.findOne({ where: { reset_token: token } });
        if (!usuario) return res.status(401).json({ mensaje: 'Token inválido, ya utilizado o no autorizado.' });

        // 2. Validar expiración de tiempo real
        if (Date.now() > usuario.reset_token_expiry) {
            return res.status(401).json({ mensaje: 'El tiempo del token ha expirado. Solicita uno nuevo.' });
        }

        // 3. Validar firma criptográfica
        jwt.verify(token, process.env.JWT_SECRET);

        // 🔐 Encriptar nueva clave
        const salt = await bcrypt.genSalt(10);
        usuario.hash_password = await bcrypt.hash(nuevaPassword, salt);
        
        // 🛡️ Invalidar tokens (Single Use)
        usuario.reset_token = null;
        usuario.reset_token_expiry = null;
        await usuario.save();

        res.status(200).json({ mensaje: '¡Contraseña actualizada! Sello restaurado exitosamente.' });

    } catch (error) {
        res.status(401).json({ mensaje: 'El enlace de recuperación es inválido o corrupto.' });
    }
};
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const { OAuth2Client } = require('google-auth-library');

// Inicializamos el cliente de Google con tu llave de entorno
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// -----------------------------------------------------------------
// 1. Lógica de Registro Tradicional
// -----------------------------------------------------------------
exports.register = async (req, res) => {
    try {
        const { nombre_completo, correo, password, rol } = req.body;

        // Verificar si el usuario ya existe
        const usuarioExistente = await Usuario.findOne({ where: { correo } });
        if (usuarioExistente) {
            return res.status(400).json({ mensaje: 'El correo ya está registrado.' });
        }

        // Encriptar la contraseña (hash)
        const salt = await bcrypt.genSalt(10);
        const hash_password = await bcrypt.hash(password, salt);

        // Crear el nuevo usuario
        const nuevoUsuario = await Usuario.create({
            nombre_completo,
            correo,
            hash_password,
            fecha_registro: new Date(),
            rol: rol || 'estudiante' // Por defecto será estudiante si no se envía
        });

        res.status(201).json({ mensaje: 'Usuario registrado exitosamente.', id_usuario: nuevoUsuario.id_usuario });
    } catch (error) {
        console.error('Error en el registro:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};

// -----------------------------------------------------------------
// 2. Lógica de Inicio de Sesión Tradicional (Login)
// -----------------------------------------------------------------
exports.login = async (req, res) => {
    try {
        const { correo, password } = req.body;

        // Buscar al usuario por correo
        const usuario = await Usuario.findOne({ where: { correo } });
        if (!usuario) {
            return res.status(404).json({ mensaje: 'Credenciales inválidas.' });
        }

        // Comparar contraseñas
        const esPasswordValido = await bcrypt.compare(password, usuario.hash_password);
        if (!esPasswordValido) {
            return res.status(401).json({ mensaje: 'Credenciales inválidas.' });
        }

        // Generar el JSON Web Token (JWT)
        const payload = {
            id_usuario: usuario.id_usuario,
            rol: usuario.rol
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

        // Enviar respuesta exitosa al frontend
        res.status(200).json({
            mensaje: 'Inicio de sesión exitoso.',
            token,
            usuario: {
                id_usuario: usuario.id_usuario,
                nombre_completo: usuario.nombre_completo,
                correo: usuario.correo,
                rol: usuario.rol
            }
        });
    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};

// -----------------------------------------------------------------
// 3. NUEVO: Lógica de Inicio de Sesión con Google OAuth
// -----------------------------------------------------------------
exports.googleLogin = async (req, res) => {
    const { token } = req.body; 

    try {
        // Verificar el token con los servidores de Google
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name } = payload; 
        const hd = payload.hd || ''; // Hosted Domain (vacío si es @gmail normal)

        // 🛡️ FILTRO INSTITUCIONAL (Descomenta y cambia el dominio para usarlo)
        /*
        const dominioPermitido = "tuuniversidad.edu.co";
        if (hd !== dominioPermitido) {
            return res.status(403).json({ 
                mensaje: `Acceso denegado. Solo se permiten correos de @${dominioPermitido}` 
            });
        }
        */

        // Buscar si el usuario ya existe en la DB
        let usuario = await Usuario.findOne({ where: { correo: email } });

        // Si es la primera vez que entra con Google, lo registramos automáticamente
        if (!usuario) {
            usuario = await Usuario.create({
                nombre_completo: name,
                correo: email,
                rol: 'estudiante', 
                hash_password: 'LOGIN_GOOGLE_OAUTH', // Se usa un placeholder para evitar nulos
                fecha_registro: new Date()
            });
        }

        // Generar el JSON Web Token (JWT) igual que en el login tradicional
        const payloadJWT = {
            id_usuario: usuario.id_usuario,
            rol: usuario.rol
        };

        const tokenPMM = jwt.sign(payloadJWT, process.env.JWT_SECRET, { expiresIn: '8h' });

        // Enviar respuesta exitosa al frontend
        res.status(200).json({
            mensaje: 'Sello de Google validado exitosamente.',
            token: tokenPMM,
            usuario: {
                id_usuario: usuario.id_usuario,
                nombre_completo: usuario.nombre_completo,
                correo: usuario.correo,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error("Error validando Google Token:", error);
        res.status(401).json({ mensaje: "El sello de Google no es válido o ha expirado." });
    }
};
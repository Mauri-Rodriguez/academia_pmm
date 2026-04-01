// ============================================================================
// Archivo: src/middlewares/authMiddleware.js
// Propósito: Verificación de JWT y Roles.
// ============================================================================

const jwt = require('jsonwebtoken');

exports.verificarToken = (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ 
            error: 'Acceso denegado', 
            mensaje: 'No se proporcionó un token. Por favor, inicie sesión.' 
        });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            error: 'Formato inválido', 
            mensaje: 'El formato del token debe ser "Bearer <token>".' 
        });
    }

    try {
        const payloadDecodificado = jwt.verify(token, process.env.JWT_SECRET);
        
        // ESTANDARIZACIÓN: Usamos 'user' para que el controlador lo encuentre
        req.user = payloadDecodificado; 
        
        next();
    } catch (error) {
        console.error('Error de verificación de token:', error.message);
        return res.status(403).json({ 
            error: 'Token inválido', 
            mensaje: 'Su sesión ha caducado. Vuelva a iniciar sesión.' 
        });
    }
};

exports.verificarRol = (rolesPermitidos) => {
    return (req, res, next) => {
        // Validación usando el objeto 'user' inyectado arriba
        if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
            return res.status(403).json({ 
                error: 'Permisos insuficientes', 
                mensaje: `Esta acción requiere rol de: ${rolesPermitidos.join(', ')}.` 
            });
        }
        next();
    };
};
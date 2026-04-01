const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Guardamos todo en la misma carpeta para no complicar las rutas estáticas
        cb(null, 'public/uploads/'); 
    },
    filename: (req, file, cb) => {
        // Usamos un prefijo genérico: ninja_media_1712345678.jpg
        cb(null, `ninja_media_${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, 
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) return cb(null, true);
        cb(new Error("Solo se permiten imágenes (jpeg, jpg, png, webp)"));
    }
});

module.exports = upload;
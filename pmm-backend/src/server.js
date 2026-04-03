// Archivo: src/server.js
const express = require('express');
const cors = require('cors');
const diagnosticoRoutes = require('./routes/diagnosticoRoutes');
require('dotenv').config();

const sequelize = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const estudianteRoutes = require('./routes/estudianteRoutes');
const ejercicioRoutes = require('./routes/ejercicioRoutes');
const docenteRoutes = require('./routes/docenteRoutes');
const progresoRoutes = require('./routes/progresoRoutes');

const app = express();

// === MIDDLEWARES ===
app.use(cors({
    origin: [
        'http://localhost:5173', // Permite pruebas locales
        process.env.FRONTEND_URL, // Toma la URL que pusiste en las variables de Railway
        'https://AQUI_TU_URL_DE_NETLIFY.netlify.app' // 👈 REEMPLAZA ESTO por tu link real de Netlify
    ],
    credentials: true, // Vital para que funcionen los tokens y cookies de login
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('public/uploads'));

// === RUTAS ===
app.get('/', (req, res) => {
    res.json({ mensaje: 'Bienvenido a la API de PMM INTERACTIVO 🚀' });
});

app.use('/api/auth', authRoutes);
app.use('/api/diagnostico', diagnosticoRoutes);
app.use('/api/estudiante', estudianteRoutes);
app.use('/api/docente', docenteRoutes);
app.use('/api/ejercicios', ejercicioRoutes);
app.use('/api/progreso', progresoRoutes);

// === ARRANQUE DEL SERVIDOR (Solo si no estamos en modo de prueba) ===
const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'test') {
    const startServer = async () => {
        try {
            // alter: false para no modificar tablas existentes en producción accidentalmente
            await sequelize.sync({ alter: false }); 
            app.listen(PORT, () => {
                console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
            });
        } catch (error) {
            console.error('Error al iniciar el servidor:', error);
        }
    };
    startServer();
}

// === EXPORTACIÓN VITAL PARA JEST ===
module.exports = app;
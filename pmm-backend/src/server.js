// Archivo: src/server.js
const express = require('express');
const cors = require('cors');
const diagnosticoRoutes = require('./routes/diagnosticoRoutes');
require('dotenv').config();
const path = require('path');
const sequelize = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const estudianteRoutes = require('./routes/estudianteRoutes');
const ejercicioRoutes = require('./routes/ejercicioRoutes');
const docenteRoutes = require('./routes/docenteRoutes');
const progresoRoutes = require('./routes/progresoRoutes');

const app = express();

// === MIDDLEWARES ===
// === MIDDLEWARES ===
app.use(cors({
    origin: [
        'http://localhost:5173', 
        process.env.FRONTEND_URL, 
        'https://lucky-croquembouche-2c8b48.netlify.app' 
    ],
    credentials: true, 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] // Permite todos los métodos HTTP necesarios para tu API
}));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

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
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
// === ARRANQUE DEL SERVIDOR (Solo si no estamos en modo de prueba) ===
// === ARRANQUE DEL SERVIDOR ===
const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'test') {
    const startServer = async () => {
        try {
            await sequelize.sync({ alter: false }); 
            // 🚩 AQUÍ ESTÁ EL CAMBIO VITAL: Agregar '0.0.0.0'
            app.listen(PORT, '0.0.0.0', () => {
                console.log(`🚀 Servidor enlazado a 0.0.0.0 y corriendo en el puerto ${PORT}`);
            });
        } catch (error) {
            console.error('Error al iniciar el servidor:', error);
        }
    };
    startServer();
}
// === EXPORTACIÓN VITAL PARA JEST ===
module.exports = app;
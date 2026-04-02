// Archivo: src/server.js
const express = require('express');
const cors = require('cors');
const diagnosticoRoutes = require('./routes/diagnosticoRoutes');
require('dotenv').config();

const sequelize = require('./config/database');
const authRoutes = require('./routes/authRoutes'); // IMPORTAMOS LAS RUTAS
const estudianteRoutes = require('./routes/estudianteRoutes');
const ejercicioRoutes = require('./routes/ejercicioRoutes');
const docenteRoutes = require('./routes/docenteRoutes');
const progresoRoutes = require('./routes/progresoRoutes'); // 👈 Agrega esta línea

const app = express();

app.use(cors()); 
app.use(express.json()); 
// En tu server.js
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Esto ayuda a procesar formularios
app.use('/api/ejercicios', ejercicioRoutes);
// === RUTAS ===
app.get('/', (req, res) => {
    res.json({ mensaje: 'Bienvenido a la API de PMM INTERACTIVO 🚀' });
});

app.use('/api/auth', authRoutes); // CONECTAMOS EL MÓDULO DE AUTENTICACIÓN
app.use('/api/diagnostico', diagnosticoRoutes); // CONECTAMOS EL MÓDULO DE DIAGNÓSTICO
app.use('/api/estudiante', estudianteRoutes); // CONECTAMOS EL MÓDULO DE ESTUDIANTE
app.use('/api/docente', docenteRoutes);
app.use('/uploads', express.static('public/uploads'));
app.use('/api/progreso', progresoRoutes); // 👈 Activa la ruta en la API



const PORT = process.env.PORT || 3001;

const startServer = async () => {
    try {
        await sequelize.sync({ alter: false }); 
        
        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Error al iniciar el servidor:', error);
    }
};

startServer();
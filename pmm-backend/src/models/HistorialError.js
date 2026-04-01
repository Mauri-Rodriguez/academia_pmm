// models/HistorialError.js (o el nombre que tenga en tu proyecto)
const { DataTypes } = require('sequelize');
const db = require('../config/database'); // Tu conexión a la DB

const HistorialError = db.define('HistorialError', {
    id_error: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_pregunta: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    respuesta_dada: {
        type: DataTypes.STRING(15),
        allowNull: false
    },
    // 🚩 ¡AQUÍ ESTÁ LA CLAVE! Esta columna debe estar definida para que Sequelize la deje pasar
    explicacion_ia: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    fecha_error: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'historial_errores',
    timestamps: false 
});

module.exports = HistorialError;
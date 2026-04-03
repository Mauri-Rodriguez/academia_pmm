// ============================================================================
// Archivo: src/models/Diagnostico.js
// Propósito: Representación de la tabla 'Diagnostico' en MySQL.
//            Almacena el resultado histórico del examen inicial del estudiante.
// ============================================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Diagnostico = sequelize.define('Diagnostico', {
    id_diagnostico: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    puntaje_obtenido: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    nivel_asignado: {
        type: DataTypes.STRING, // Almacenará 'Bajo', 'Intermedio' o 'Alto'
        allowNull: false
    },
    fecha_realizacion: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: 'diagnostico',
    timestamps: false
});

module.exports = Diagnostico;
// ============================================================================
// Archivo: src/models/Ejercicio.js
// Propósito: Representación de la tabla 'Ejercicios' en MySQL.
// Requerimiento: RF-04 (Ejercicios interactivos)
// ============================================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ejercicio = sequelize.define('Ejercicio', {
    id_ejercicio: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    id_modulo: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    pregunta: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    opcion_a: { type: DataTypes.STRING, allowNull: false },
    opcion_b: { type: DataTypes.STRING, allowNull: false },
    opcion_c: { type: DataTypes.STRING, allowNull: false },
    opcion_d: { type: DataTypes.STRING, allowNull: false },
    respuesta_correcta: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'ejercicios',
    timestamps: false
});

module.exports = Ejercicio;
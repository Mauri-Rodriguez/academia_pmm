// ============================================================================
// Archivo: src/models/ProgresoEstudiante.js
// Propósito: Representación de la tabla 'Progreso_Estudiante' en MySQL.
// Requerimiento: RF-08 (Registro automático de resultados e intentos)
// ============================================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProgresoEstudiante = sequelize.define('ProgresoEstudiante', {
    id_progreso: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_modulo: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    porcentaje_avance: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    intentos_realizados: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    ultima_actualizacion: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: 'Progreso_Estudiante',
    timestamps: false
});

module.exports = ProgresoEstudiante;
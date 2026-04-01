// ============================================================================
// Archivo: src/models/Modulo.js
// Propósito: Representación de la tabla 'Modulos' en MySQL.
//            Contiene los temas que la IA asignará en la ruta de aprendizaje.
// ============================================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Modulo = sequelize.define('Modulo', {
    id_modulo: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nombre_modulo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    nivel: {
        type: DataTypes.STRING, // Genin, Chunin o Jonin
        allowNull: false
    }
}, {
    tableName: 'Modulos',
    timestamps: false
});

module.exports = Modulo;
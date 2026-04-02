// ============================================================================
// Archivo: src/models/Modulo.js
// Propósito: Representación de la tabla 'Modulos' en MySQL.
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
        allowLength: { args: [3, 100], msg: "El nombre debe ser descriptivo." },
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    nivel: {
        type: DataTypes.STRING, 
        allowNull: false,
        // 🚩 TIP SENIOR: Aseguramos que solo entren los rangos de la Aldea
        validate: {
            isIn: {
                args: [['Genin (Iniciado)', 'Chunin (Guerrero)', 'Jonin (Maestro)', 'Bajo', 'Intermedio', 'Alto']],
                msg: "El nivel debe ser un rango válido de la Aldea Digital."
            }
        }
    }
}, {
    tableName: 'Modulos',
    timestamps: false
});

module.exports = Modulo;
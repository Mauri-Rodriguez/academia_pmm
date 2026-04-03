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
        validate: {
            isIn: {
                // 🚩 ACTUALIZACIÓN: Agregamos 'Maestro Kage' a la lista permitida
                args: [[
                    'Genin (Iniciado)', 
                    'Chunin (Guerrero)', 
                    'Jonin (Maestro)', 
                    'Bajo', 
                    'Intermedio', 
                    'Alto',
                    'Maestro Kage' // 👈 ¡Imprescindible!
                ]],
                msg: "El nivel debe ser un rango válido de la Aldea Digital."
            }
        }
    }
}, {
    tableName: 'modulos',
    timestamps: false
});

module.exports = Modulo;
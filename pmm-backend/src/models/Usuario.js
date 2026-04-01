// Archivo: src/models/Usuario.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Usuario = sequelize.define('Usuario', {
    id_usuario: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nombre_completo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    correo: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    hash_password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fecha_registro: {
        type: DataTypes.DATEONLY, // Equivalente a DATE en MySQL
        allowNull: false
    },
    rol: {
        type: DataTypes.ENUM('estudiante', 'docente', 'administrador'),
        allowNull: false
    }
}, {
    tableName: 'Usuarios',
    timestamps: false // Desactivamos los campos automáticos createdAt/updatedAt
});

module.exports = Usuario;
// Archivo: src/models/UsuarioInsignia.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UsuarioInsignia = sequelize.define('UsuarioInsignia', {
    id_usuario: { type: DataTypes.INTEGER, primaryKey: true },
    id_insignia: { type: DataTypes.INTEGER, primaryKey: true },
    fecha_otorgada: { type: DataTypes.DATE, allowNull: false }
}, { tableName: 'Usuarios_Insignias', timestamps: false });

module.exports = UsuarioInsignia;
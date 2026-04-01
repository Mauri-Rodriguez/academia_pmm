// Archivo: src/models/Insignia.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Insignia = sequelize.define('Insignia', {
    id_insignia: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nombre_insignia: { type: DataTypes.STRING, allowNull: false },
    descripcion: { type: DataTypes.TEXT },
    imagen: { type: DataTypes.STRING }
}, { tableName: 'Insignias', timestamps: false });

module.exports = Insignia;
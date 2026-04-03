// Archivo: src/models/ResultadoModulo.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ResultadoModulo = sequelize.define('ResultadoModulo', {
    id_resultado: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    id_usuario: { type: DataTypes.INTEGER, allowNull: false },
    id_modulo: { type: DataTypes.INTEGER, allowNull: false },
    puntaje_final: { type: DataTypes.FLOAT, allowNull: false },
    fecha_finalizacion: { type: DataTypes.DATE, allowNull: false }
}, { tableName: 'resultados_modulos', timestamps: false });

module.exports = ResultadoModulo;
// ============================================================================
// Archivo: src/models/PreguntaDiagnostico.js
// Propósito: Representación en Sequelize de la tabla 'preguntas_diagnostico'.
//            Permite interactuar con el banco de preguntas del examen inicial.
// Requerimiento asociado: RF-02 (Diagnóstico inicial de 12 preguntas)
// Autor(es): Equipo de Desarrollo PMM Interactivo
// ============================================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PreguntaDiagnostico = sequelize.define('PreguntaDiagnostico', {
    // Definición de la llave primaria
    id_pregunta: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    // El enunciado de la pregunta matemática
    pregunta: {
        type: DataTypes.TEXT,
        allowNull: false 
    },
    // Las 4 opciones de respuesta múltiple
    opcion_a: {
        type: DataTypes.STRING,
        allowNull: false
    },
    opcion_b: {
        type: DataTypes.STRING,
        allowNull: false
    },
    opcion_c: {
        type: DataTypes.STRING,
        allowNull: false
    },
    opcion_d: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // Almacenamos el identificador de la respuesta correcta (ej. 'opcion_b')
    // para evaluar automáticamente en el backend.
    respuesta_correcta: {
        type: DataTypes.STRING,
        allowNull: false 
    }
}, {
    // Especificamos el nombre exacto de la tabla en MySQL para evitar pluralizaciones automáticas
    tableName: 'preguntas_diagnostico', 
    // Desactivamos los timestamps (createdAt, updatedAt) ya que es un banco de datos estático
    timestamps: false 
});

module.exports = PreguntaDiagnostico;
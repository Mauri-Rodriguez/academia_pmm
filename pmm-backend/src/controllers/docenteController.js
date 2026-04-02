// ============================================================================
// Archivo: src/controllers/docenteController.js
// Propósito: Generar reportes y métricas para el Panel del Profesor.
// ============================================================================

const Usuario = require('../models/Usuario');
const Diagnostico = require('../models/Diagnostico');
const ProgresoEstudiante = require('../models/ProgresoEstudiante');
const ExcelJS = require('exceljs');
const Modulo = require('../models/Modulo');
const db = require('../config/database');
const { QueryTypes } = require('sequelize'); // 
/**
 * Función 1: Obtener un resumen del rendimiento de todos los estudiantes (JSON).
 */
exports.obtenerResumenEstudiantes = async (req, res) => {
    try {
        // Buscamos a todos los usuarios que tengan el rol de 'estudiante'
        const estudiantes = await Usuario.findAll({
            where: { rol: 'estudiante' },
            attributes: ['id_usuario', 'nombre_completo', 'correo', 'rol']
        });

        if (!estudiantes || estudiantes.length === 0) {
            return res.status(404).json({ mensaje: 'No hay estudiantes registrados en la plataforma.' });
        }

        // Por cada estudiante, buscamos su rango y su progreso
        const reporteCompleto = await Promise.all(estudiantes.map(async (estudiante) => {
            const diagnostico = await Diagnostico.findOne({
                where: { id_usuario: estudiante.id_usuario },
                order: [['fecha_realizacion', 'DESC']]
            });

            const progresos = await ProgresoEstudiante.findAll({
                where: { id_usuario: estudiante.id_usuario }
            });

            let promedioAvance = 0;
            if (progresos.length > 0) {
                const sumaAvance = progresos.reduce((sum, p) => sum + p.porcentaje_avance, 0);
                promedioAvance = sumaAvance / progresos.length;
            }

            return {
                id_estudiante: estudiante.id_usuario,
                nombre: estudiante.nombre_completo,
                correo: estudiante.correo,
                rango_ia_asignado: diagnostico ? diagnostico.nivel_asignado : 'Sin evaluación',
                puntaje_diagnostico: diagnostico ? diagnostico.puntaje_obtenido : 0,
                modulos_en_curso: progresos.length,
                avance_promedio: Math.round(promedioAvance) + '%'
            };
        }));

        res.status(200).json({
            mensaje: 'Reporte general de estudiantes generado con éxito',
            total_estudiantes: estudiantes.length,
            reporte: reporteCompleto
        });

    } catch (error) {
        console.error('Error al generar el reporte del docente:', error);
        res.status(500).json({ mensaje: 'Error interno al generar el reporte de la clase.' });
    }
};

/**
 * Función 2: Exportar el rendimiento de la clase a un archivo Excel descargable.
 */
exports.descargarReporteExcel = async (req, res) => {
    try {
        // 1. Obtenemos los datos (misma lógica que el JSON)
        const estudiantes = await Usuario.findAll({
            where: { rol: 'estudiante' },
            attributes: ['id_usuario', 'nombre_completo', 'correo']
        });

        const reporteCompleto = await Promise.all(estudiantes.map(async (estudiante) => {
            const diagnostico = await Diagnostico.findOne({
                where: { id_usuario: estudiante.id_usuario },
                order: [['fecha_realizacion', 'DESC']]
            });
            const progresos = await ProgresoEstudiante.findAll({
                where: { id_usuario: estudiante.id_usuario }
            });

            let promedioAvance = 0;
            if (progresos.length > 0) {
                const sumaAvance = progresos.reduce((sum, p) => sum + p.porcentaje_avance, 0);
                promedioAvance = sumaAvance / progresos.length;
            }

            return {
                id: estudiante.id_usuario,
                nombre: estudiante.nombre_completo, // Agregado para el Excel
                correo: estudiante.correo,
                rango: diagnostico ? diagnostico.nivel_asignado : 'Sin evaluar',
                puntaje: diagnostico ? diagnostico.puntaje_obtenido : 0,
                avance: Math.round(promedioAvance) + '%'
            };
        }));

        // 2. CREACIÓN DEL ARCHIVO EXCEL
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'PMM INTERACTIVO';
        const worksheet = workbook.addWorksheet('Reporte de Estudiantes');

        // 3. Diseñamos las columnas de la tabla (Añadimos la columna Nombre)
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Nombre Completo', key: 'nombre', width: 30 },
            { header: 'Correo del Estudiante', key: 'correo', width: 35 },
            { header: 'Rango Asignado (IA)', key: 'rango', width: 25 },
            { header: 'Nota Diagnóstico', key: 'puntaje', width: 20 },
            { header: 'Avance General', key: 'avance', width: 20 }
        ];

        // Estilo de la cabecera
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0070C0' }
        };

        // 4. Llenamos el Excel con los datos
        reporteCompleto.forEach(estudiante => {
            worksheet.addRow(estudiante);
        });

        // Bordes para todas las celdas
        worksheet.eachRow({ includeEmpty: false }, function (row, rowNumber) {
            row.eachCell({ includeEmpty: false }, function (cell, colNumber) {
                cell.border = {
                    top: { style: 'thin' }, left: { style: 'thin' },
                    bottom: { style: 'thin' }, right: { style: 'thin' }
                };
            });
        });

        // 5. PREPARAMOS LA DESCARGA
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=' + 'Reporte_Clase_PMM.xlsx');

        await workbook.xlsx.write(res);
        res.status(200).end();

    } catch (error) {
        console.error('Error al generar el Excel:', error);
        res.status(500).json({ mensaje: 'Error interno al generar el archivo Excel.' });
    }
};



exports.obtenerReporteIndividual = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Identidad
        const [estudiante] = await db.query(
            "SELECT nombre_completo, correo FROM usuarios WHERE id_usuario = :id",
            { replacements: { id }, type: QueryTypes.SELECT }
        );

        if (!estudiante) return res.status(404).json({ mensaje: 'Ninja no encontrado.' });

        // 2. Score de Admisión
        const [diagnostico] = await db.query(
            "SELECT nivel_asignado, puntaje_obtenido FROM diagnostico WHERE id_usuario = :id ORDER BY fecha_realizacion DESC LIMIT 1",
            { replacements: { id }, type: QueryTypes.SELECT }
        );

        // 3. Progreso en la Malla
        const progresos = await db.query(`
            SELECT m.nombre_modulo, p.porcentaje_avance AS porcentaje
            FROM progreso_estudiante p
            JOIN modulos m ON p.id_modulo = m.id_modulo
            WHERE p.id_usuario = :id
        `, { replacements: { id }, type: QueryTypes.SELECT });

        // 4. 🚩 ANÁLISIS DE FALLOS POR FRECUENCIA (Agrupado por módulo)
        const fallosAgrupados = await db.query(`
            SELECT 
                m.nombre_modulo AS tema, 
                COUNT(h.id_error) AS cantidad_fallos
            FROM historial_errores h
            JOIN ejercicios e ON h.id_pregunta = e.id_ejercicio
            JOIN modulos m ON e.id_modulo = m.id_modulo
            WHERE h.id_usuario = :id
            GROUP BY m.id_modulo
            ORDER BY cantidad_fallos DESC
            LIMIT 5
        `, { replacements: { id }, type: QueryTypes.SELECT });

        let suma = progresos.reduce((s, p) => s + Number(p.porcentaje), 0);
        let promedio = progresos.length > 0 ? Math.round(suma / progresos.length) : 0;

        res.json({
            nombre: estudiante.nombre_completo,
            correo: estudiante.correo,
            rango: diagnostico ? diagnostico.nivel_asignado : 'Sin rango',
            puntaje_diagnostico: diagnostico ? diagnostico.puntaje_obtenido : 0,
            avance_promedio: promedio + '%',
            progresos_detallados: progresos, 
            fallos_comunes: fallosAgrupados // Enviamos el conteo, no la lista infinita
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, BarChart3, Target, AlertCircle, Loader2, FileText } from 'lucide-react';
import api from '../api/api';
import html2pdf from 'html2pdf.js';

const ReporteDetalladoEstudiante = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [estudiante, setEstudiante] = useState(null);
    const [loading, setLoading] = useState(true);
    const reportRef = useRef();

    useEffect(() => {
        const cargarDetalles = async () => {
            try {
                const res = await api.get(`/docente/reporte-individual/${id}`);
                setEstudiante(res.data);
            } catch (error) {
                console.error("❌ Error al recuperar el expediente:", error);
            } finally {
                setLoading(false);
            }
        };
        cargarDetalles();
    }, [id]);

    const descargarPDF = async () => {
        const element = reportRef.current;
        const opt = {
            margin: [0.3, 0.3],
            filename: `Expediente_PMM_${estudiante?.nombre || 'Ninja'}.pdf`,
            image: { type: 'jpeg', quality: 1 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                backgroundColor: '#05070A',
                letterRendering: true,
                scrollY: 0,
                onclone: (clonedDoc) => {
                    const el = clonedDoc.getElementById('reporte-contenido');
                    if (el) {
                        el.style.backgroundColor = '#05070A';
                        el.style.color = '#cbd5e1';
                        el.style.padding = '20px';
                    }
                }
            },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        try {
            await html2pdf().set(opt).from(element).save();
        } catch (error) {
            console.error("Error en la descarga:", error);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#05070A] flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-shinobi-gold/20 border-t-shinobi-gold rounded-full animate-spin mb-4 shadow-[0_0_20px_rgba(212,175,55,0.2)]"></div>
            <p className="text-shinobi-gold font-scholar tracking-widest text-xs uppercase">Sincronizando Archivos Ninja...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#05070A] text-slate-300 font-modern p-6 md:p-10 selection:bg-shinobi-gold/30">
            {/* CABECERA DE ACCIONES */}
            <div className="flex justify-between items-center mb-10 max-w-7xl mx-auto">
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-500 hover:text-shinobi-gold transition-all uppercase text-[10px] font-black tracking-[0.2em]"
                >
                    <ChevronLeft size={18} /> Volver al Censo
                </button>

                <button 
                    onClick={descargarPDF}
                    className="flex items-center gap-2 bg-shinobi-gold/10 hover:bg-shinobi-gold border border-shinobi-gold/30 text-shinobi-gold hover:text-black px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(212,175,55,0.1)] active:scale-95"
                >
                    <FileText size={16} /> Exportar Analítica PDF
                </button>
            </div>

            {/* CONTENEDOR DE REPORTE */}
            <div ref={reportRef} id="reporte-contenido" className="max-w-7xl mx-auto rounded-3xl">
                <header className="mb-12 border-b border-white/5 pb-10">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-px w-12 bg-shinobi-gold"></div>
                        <span className="text-shinobi-gold font-scholar text-[10px] tracking-[0.5em] uppercase opacity-60">Análisis de Rendimiento Académico</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-scholar text-white tracking-tighter uppercase leading-tight">
                        Expediente: <span className="text-shinobi-gold">{estudiante?.nombre}</span>
                    </h1>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    {/* PANEL DE IDENTIDAD */}
                    <div className="space-y-6">
                        <div className="bg-[#0E121C]/80 border border-white/5 p-10 rounded-[3rem] text-center shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-shinobi-gold/40 to-transparent"></div>
                            <div className="w-28 h-28 rounded-2xl bg-shinobi-dark border-2 border-shinobi-gold/20 flex items-center justify-center mx-auto mb-6 shadow-inner transition-transform duration-500 group-hover:scale-105">
                                <span className="text-5xl font-scholar text-shinobi-gold">{estudiante?.nombre?.charAt(0)}</span>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-1 uppercase tracking-tight">{estudiante?.nombre}</h3>
                            <p className="text-[11px] text-slate-500 font-mono mb-8 tracking-widest">{estudiante?.correo}</p>
                            <div className="inline-block px-8 py-2.5 rounded-xl border border-shinobi-gold/30 bg-shinobi-gold/5 text-shinobi-gold text-[10px] font-black tracking-[0.4em] uppercase">
                                Rango: {estudiante?.rango}
                            </div>
                        </div>

                        <div className="bg-[#0E121C]/80 border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden">
                            <Target className="absolute -right-4 -top-4 text-shinobi-gold/5" size={100} />
                            <div className="flex items-center gap-4 mb-4">
                                <Target className="text-shinobi-gold" size={20} />
                                <h4 className="font-scholar text-[10px] uppercase tracking-widest text-white/50">Score de Admisión</h4>
                            </div>
                            <div className="text-5xl font-scholar text-white mb-2">{estudiante?.puntaje_diagnostico} <span className="text-xl text-slate-700">/ 13</span></div>
                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest italic">Punto de partida detectado</p>
                        </div>
                    </div>

                    {/* PANEL DE DOMINIO Y ANÁLISIS DE FALLOS */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-[#0E121C]/80 border border-white/5 p-10 rounded-[3rem] shadow-2xl">
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-4">
                                    <BarChart3 className="text-emerald-500" size={24} />
                                    <h4 className="font-scholar text-xs uppercase tracking-widest text-white">Dominio Conceptual por Módulo</h4>
                                </div>
                                <div className="text-right">
                                    <span className="text-3xl font-scholar text-emerald-500 block">{estudiante?.avance_promedio}</span>
                                    <span className="text-[9px] text-slate-600 uppercase font-black tracking-widest">Avance Global</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                {estudiante?.progresos_detallados?.map((mod, idx) => (
                                    <div key={idx} className="group">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-3">
                                            <span className="text-slate-500 group-hover:text-white transition-colors">{mod.nombre_modulo}</span>
                                            <span className="text-shinobi-gold">{mod.porcentaje}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden p-[2px] border border-white/5">
                                            <div 
                                                className="h-full bg-gradient-to-r from-shinobi-gold to-shinobi-gold-light rounded-full transition-all duration-1000" 
                                                style={{ width: `${mod.porcentaje}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ZONAS DE RIESGO (REEMPLAZA LA BITÁCORA INFINITA) */}
                        <div className="bg-[#0E121C]/80 border border-rose-500/20 p-10 rounded-[3rem] shadow-2xl shadow-rose-500/5">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="bg-rose-500/20 p-3 rounded-2xl">
                                    <AlertCircle className="text-rose-500" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-scholar text-white uppercase tracking-widest text-sm">Zonas de Riesgo Académico</h3>
                                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Temas con mayor índice de error detectado</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {estudiante?.fallos_comunes?.length > 0 ? (
                                    estudiante.fallos_comunes.map((fallo, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-5 bg-rose-500/5 rounded-2xl border border-rose-500/10 hover:border-rose-500/40 transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
                                                <span className="text-xs font-bold text-slate-200 uppercase tracking-tight">{fallo.tema}</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-rose-500 font-scholar text-xl font-black">{fallo.cantidad_fallos || fallo.intentos}</span>
                                                <span className="text-[8px] text-rose-400/50 uppercase font-black">Intentos Fallidos</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10">
                                        <p className="text-[10px] text-slate-600 uppercase font-scholar tracking-widest italic">No se han registrado alertas críticas para este ninja</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReporteDetalladoEstudiante;
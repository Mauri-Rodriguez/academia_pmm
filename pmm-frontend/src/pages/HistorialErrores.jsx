import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/api';

const HistorialErrores = () => {
    const [errores, setErrores] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const cargarErrores = async () => {
            try {
                const res = await api.get('/estudiante/errores-recientes');
                setErrores(res.data);
            } catch (err) {
                console.error("Error al cargar la bitácora de fallos:", err);
            } finally {
                setLoading(false);
            }
        };
        cargarErrores();
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-[#05070A] flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mb-6 shadow-[0_0_30px_rgba(244,63,94,0.3)]"></div>
            <div className="text-rose-500 font-scholar animate-pulse tracking-[0.5em] text-[10px] uppercase">
                Invocando Pergaminos de Falla...
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#05070A] text-slate-300 relative selection:bg-rose-500/30 pb-20">
            
            {/* 🚩 NAVBAR ESTILO ALDEA DIGITAL */}
            <nav className="sticky top-0 z-50 bg-[#0E121C]/90 backdrop-blur-md border-b border-white/5 px-6 py-4 shadow-2xl mb-8 md:mb-12">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/estudiante/dashboard')}
                            className="p-2.5 rounded-full bg-white/5 hover:bg-rose-600 hover:text-white text-slate-400 transition-all border border-white/10 group"
                            title="Regresar a la Aldea"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <h1 className="text-sm md:text-xl font-scholar text-white tracking-widest uppercase">
                            Aldea <span className="text-shinobi-gold">Digital</span>
                        </h1>
                    </div>
                    
                    <div className="bg-rose-500/10 border border-rose-500/20 px-4 py-1.5 rounded-full flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                        <span className="text-rose-500 font-black text-[9px] uppercase tracking-widest">
                            Bitácora Crítica
                        </span>
                    </div>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-6 md:px-12">
                <header className="mb-16 relative">
                    <div className="absolute top-0 left-1/4 w-1/2 h-full bg-rose-500/5 blur-[80px] -z-10 rounded-full"></div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-px w-12 bg-gradient-to-r from-rose-500 to-transparent"></div>
                        <span className="text-rose-500 font-scholar text-[10px] tracking-[0.5em] uppercase">
                            Análisis Forense
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-scholar text-white tracking-tighter uppercase mb-4">
                        El Camino de la <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-rose-600 drop-shadow-[0_0_15px_rgba(244,63,94,0.3)]">Corrección</span>
                    </h1>
                    <p className="text-slate-500 text-xs md:text-sm italic font-modern tracking-wide">
                        "Un shinobi no oculta sus cicatrices; las estudia para no volver a sangrar."
                    </p>
                </header>

                <div className="space-y-10">
                    {errores.length > 0 ? (
                        errores.map((error, index) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1, duration: 0.5 }}
                                key={index} 
                                className="bg-[#0E121C] border border-white/5 p-6 md:p-10 rounded-[2.5rem] relative overflow-hidden group hover:border-rose-500/30 transition-all duration-500 shadow-2xl"
                            >
                                {/* Decoración lateral reactiva */}
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-rose-500 to-rose-900 opacity-20 group-hover:opacity-100 transition-opacity"></div>
                                
                                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8 border-b border-white/5 pb-6">
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                            <span className="text-sm">🎯</span> Falla Detectada
                                        </span>
                                        <span className="text-sm text-white font-scholar uppercase tracking-wide">
                                            {error.tema_modulo}
                                        </span>
                                    </div>
                                    <span className="text-[9px] text-slate-400 font-bold bg-black/50 border border-white/10 px-4 py-2 rounded-full uppercase tracking-widest self-start">
                                        {new Date(error.fecha_error).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </span>
                                </div>

                                <h3 className="text-xl md:text-2xl text-white font-modern leading-relaxed mb-8 italic">
                                    "{error.pregunta_texto}"
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                                    <div className="p-6 bg-rose-500/5 border border-rose-500/10 rounded-3xl group-hover:bg-rose-500/10 transition-colors relative overflow-hidden">
                                        <div className="absolute -right-4 -top-4 text-6xl opacity-5">❌</div>
                                        <p className="text-[9px] text-rose-500 uppercase font-black mb-3 tracking-[0.2em]">Tu Elección (Ilusión)</p>
                                        <p className="text-sm text-rose-200/70 line-through decoration-rose-500/50 font-modern break-words leading-relaxed">
                                            {error.respuesta_incorrecta}
                                        </p>
                                    </div>
                                    
                                    <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl group-hover:bg-emerald-500/10 transition-colors relative overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.05)]">
                                        <div className="absolute -right-4 -top-4 text-6xl opacity-5">✅</div>
                                        <p className="text-[9px] text-emerald-500 uppercase font-black mb-3 tracking-[0.2em]">Sello Correcto (Verdad)</p>
                                        <p className="text-sm text-emerald-400 font-bold font-modern break-words leading-relaxed">
                                            {error.respuesta_correcta}
                                        </p>
                                    </div>
                                </div>

                                {/* 🚩 RETROALIMENTACIÓN DE GEMINI */}
                                <div className="relative mt-8">
                                    {/* Conector visual */}
                                    <div className="absolute -top-10 left-8 w-px h-10 bg-gradient-to-b from-transparent to-shinobi-gold/30"></div>
                                    
                                    <div className="bg-gradient-to-br from-[#121620] to-[#0E121C] p-6 md:p-8 rounded-3xl border border-shinobi-gold/20 shadow-[inset_0_0_20px_rgba(197,160,89,0.05)] relative">
                                        <div className="absolute -top-4 left-6 bg-[#05070A] px-5 py-1.5 border border-shinobi-gold/30 rounded-full flex items-center gap-2 shadow-lg shadow-shinobi-gold/10">
                                            <span className="text-shinobi-gold text-sm animate-pulse">👁️‍🗨️</span>
                                            <span className="text-[9px] text-shinobi-gold font-scholar uppercase tracking-[0.2em]">
                                                Oráculo IA
                                            </span>
                                        </div>
                                        <div className="mt-4">
                                            <p className="text-sm md:text-base text-slate-300 leading-loose font-modern text-justify whitespace-pre-line">
                                                {error.explicacion_ia || "El pergamino está siendo decodificado por los sabios de la aldea..."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-32 bg-emerald-500/5 border border-dashed border-emerald-500/20 rounded-[3rem] shadow-[inset_0_0_50px_rgba(16,185,129,0.02)]"
                        >
                            <span className="text-6xl mb-6 block animate-bounce">⛩️</span>
                            <p className="font-scholar text-emerald-500 uppercase tracking-[0.4em] text-lg mb-2">Registro Inmaculado</p>
                            <p className="text-slate-500 text-xs uppercase tracking-widest">No hay fallos en tu técnica. Sigue entrenando.</p>
                        </motion.div>
                    )}
                </div>
                
                {errores.length > 0 && (
                    <div className="mt-16 text-center">
                        <button 
                            onClick={() => navigate('/estudiante/dashboard')}
                            className="bg-transparent border border-white/10 hover:border-shinobi-gold hover:text-shinobi-gold text-slate-500 px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.3em] transition-all"
                        >
                            Completar Revisión y Volver
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistorialErrores;
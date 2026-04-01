import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const LibroDeBingo = () => {
    const [ranking, setRanking] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRanking = async () => {
            try {
                const res = await api.get('/estudiante/ranking');
                setRanking(res.data);
            } catch (err) {
                console.error("Error al cargar el ranking:", err);
            }
        };
        fetchRanking();
    }, []);

    // Helper para definir los estilos del Podio
    const getEstilosPodio = (index) => {
        if (index === 0) return "bg-yellow-500/10 border-yellow-500/50 text-yellow-500 shadow-[0_0_20px_rgba(212,175,55,0.2)]";
        if (index === 1) return "bg-slate-300/10 border-slate-300/50 text-slate-300 shadow-[0_0_20px_rgba(203,213,225,0.1)]";
        if (index === 2) return "bg-orange-700/10 border-orange-700/50 text-orange-600 shadow-[0_0_20px_rgba(194,65,12,0.1)]";
        return "bg-slate-900/40 border-white/5 text-slate-400";
    };

    return (
        <div className="min-h-screen bg-[#05070A] p-6 md:p-12 relative overflow-hidden">
            {/* Decoración de fondo */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 bg-shinobi-gold/5 blur-[120px] rounded-full -z-10"></div>
            
            <div className="max-w-5xl mx-auto">
                
                {/* BOTÓN VOLVER */}
                <button 
                    onClick={() => navigate('/estudiante/dashboard')}
                    className="mb-10 flex items-center gap-3 text-shinobi-gold/60 hover:text-shinobi-gold transition-all font-scholar text-[10px] uppercase tracking-[0.4em] group"
                >
                    <span className="text-xl group-hover:-translate-x-2 transition-transform">←</span>
                    Volver al Dojo
                </button>

                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                    <div>
                        <h1 className="text-5xl font-scholar text-white mb-2 tracking-tighter uppercase leading-none">
                            📕 Libro de <span className="text-shinobi-gold">Bingo</span>
                        </h1>
                        <p className="text-slate-500 font-modern text-[10px] uppercase tracking-[0.6em]">Registro de los Ninjas más buscados</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm">
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Status del Servidor</p>
                        <p className="text-xs text-green-500 font-bold font-mono">● PERGAMINO ACTUALIZADO</p>
                    </div>
                </div>
                
                <div className="space-y-4">
                    {/* ENCABEZADO DE TABLA (Manual para mejor estilo) */}
                    <div className="grid grid-cols-12 px-8 py-3 text-[10px] font-scholar text-slate-600 uppercase tracking-[0.3em]">
                        <div className="col-span-2">Rango</div>
                        <div className="col-span-5">Identidad</div>
                        <div className="col-span-3">Grado</div>
                        <div className="col-span-2 text-right">Misiones</div>
                    </div>

                    {ranking.length > 0 ? (
                        ranking.map((ninja, index) => (
                            <div 
                                key={index} 
                                className={`grid grid-cols-12 items-center px-8 py-6 rounded-2xl border transition-all duration-500 hover:scale-[1.01] group 
                                ${getEstilosPodio(index)}`}
                            >
                                {/* POSICIÓN / MEDALLA */}
                                <div className="col-span-2 font-scholar text-2xl italic">
                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                                </div>

                                {/* NOMBRE */}
                                <div className="col-span-5">
                                    <p className="font-scholar text-lg text-white group-hover:text-shinobi-gold transition-colors">
                                        {ninja.nombre_completo}
                                    </p>
                                    {index <= 2 && (
                                        <span className="text-[9px] font-black tracking-widest text-shinobi-gold/50">AMENAZA NIVEL S</span>
                                    )}
                                </div>

                                {/* RANGO */}
                                <div className="col-span-3 uppercase text-[10px] tracking-widest font-bold opacity-70">
                                    {ninja.rango || 'Sin Rango'}
                                </div>

                                {/* MISIONES */}
                                <div className="col-span-2 text-right">
                                    <div className="inline-block">
                                        <p className="text-2xl font-scholar leading-none">{ninja.misiones_completas || 0}</p>
                                        <p className="text-[8px] text-slate-500 uppercase tracking-tighter">Completadas</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-slate-900/20 border border-dashed border-white/10 p-20 text-center rounded-3xl">
                            <p className="font-scholar text-slate-600 uppercase tracking-widest animate-pulse">
                                El Libro de Bingo está vacío... aún no hay leyendas.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LibroDeBingo;
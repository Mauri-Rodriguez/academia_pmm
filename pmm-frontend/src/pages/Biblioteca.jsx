import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const Biblioteca = () => {
    const [pergaminos, setPergaminos] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const cargarBiblioteca = async () => {
            try {
                // 🚩 Esta ruta ahora filtra por jerarquía en el Backend
                const res = await api.get('/estudiante/biblioteca');
                setPergaminos(res.data);
            } catch (err) {
                console.error("Error cargando biblioteca:", err);
            } finally {
                setLoading(false);
            }
        };
        cargarBiblioteca();
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-[#05070A] flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-shinobi-gold/20 border-t-shinobi-gold rounded-full animate-spin mb-4"></div>
            <div className="text-shinobi-gold font-scholar animate-pulse tracking-[0.5em] text-[10px]">Consultando Archivos Prohibidos...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#05070A] p-6 md:p-12 text-slate-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(212,175,55,0.05),transparent)] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                
                <button 
                    onClick={() => navigate('/estudiante/dashboard')}
                    className="mb-10 flex items-center gap-3 text-shinobi-gold/60 hover:text-shinobi-gold transition-all font-scholar text-[10px] uppercase tracking-[0.4em] group"
                >
                    <span className="text-xl group-hover:-translate-x-2 transition-transform">←</span>
                    Volver al Dojo
                </button>

                <header className="mb-16">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-[1px] w-12 bg-shinobi-gold/50"></div>
                        <span className="text-shinobi-gold font-scholar text-xs tracking-[0.4em] uppercase opacity-70">Repositorio de Sabiduría</span>
                    </div>
                    <h1 className="text-5xl font-scholar text-white tracking-tighter uppercase leading-none">
                        📜 Biblioteca de <span className="text-shinobi-gold">Pergaminos</span>
                    </h1>
                    <p className="text-slate-500 font-modern italic text-sm mt-4 max-w-2xl">
                        "El conocimiento es la técnica definitiva. Estudia los manuscritos para perfeccionar tu chakra matemático antes de la batalla."
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {pergaminos.length > 0 ? (
                        pergaminos.map((p) => {
                            // 🚩 Sincronizado con nombres de tu BD: tipo_recurso y url_recurso
                            const esVideo = p.tipo_recurso?.toLowerCase() === 'video' || p.url_recurso?.includes('youtube');

                            return (
                                <div 
                                    key={p.id_pergamino} 
                                    className="group relative bg-[#0E121C]/60 border border-white/5 p-8 rounded-[2rem] hover:bg-[#121826] hover:-translate-y-2 transition-all duration-500 shadow-2xl overflow-hidden flex flex-col justify-between h-[450px]"
                                >
                                    <div className={`absolute -top-24 -right-24 w-48 h-48 blur-[80px] opacity-0 group-hover:opacity-10 transition-opacity ${esVideo ? 'bg-rose-500' : 'bg-shinobi-gold'}`}></div>

                                    <div>
                                        <div className="flex justify-between items-start mb-6">
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${esVideo ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-shinobi-gold/10 text-shinobi-gold border-shinobi-gold/20'}`}>
                                                {esVideo ? '📺 Video Tutorial' : (p.categoria || '📜 Pergamino')}
                                            </span>
                                            <div className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter bg-black/40 px-2 py-1 rounded border border-white/5">
                                                {p.nivel_requerido}
                                            </div>
                                        </div>

                                        <h3 className="text-2xl font-scholar text-white mb-4 group-hover:text-shinobi-gold transition-colors leading-tight line-clamp-2">
                                            {p.titulo}
                                        </h3>
                                        <p className="text-xs text-slate-400 mb-8 leading-relaxed line-clamp-4 italic opacity-70 group-hover:opacity-100 transition-opacity">
                                            "{p.descripcion}"
                                        </p>
                                    </div>

                                    <button 
                                        onClick={() => window.open(p.url_recurso, '_blank')}
                                        className={`w-full py-4 rounded-xl font-scholar text-[10px] tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 border shadow-lg
                                            ${esVideo 
                                                ? 'bg-rose-600/10 border-rose-600/30 text-rose-500 hover:bg-rose-600 hover:text-white' 
                                                : 'bg-shinobi-gold/10 border-shinobi-gold/30 text-shinobi-gold hover:bg-shinobi-gold hover:text-black'}`}
                                    >
                                        {esVideo ? (
                                            <><span>▶</span> REPRODUCIR ENTRENAMIENTO</>
                                        ) : (
                                            <><span>📜</span> DESENROLLAR MANUSCRITO</>
                                        )}
                                    </button>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full bg-[#0E121C]/40 border-2 border-dashed border-white/5 p-20 text-center rounded-[3rem]">
                            <span className="text-4xl mb-4 block opacity-20">📂</span>
                            <p className="text-slate-500 font-scholar uppercase text-sm tracking-widest">No hay pergaminos disponibles para tu rango actual.</p>
                            <p className="text-[10px] text-slate-700 mt-2 uppercase tracking-widest italic">Sigue entrenando para desbloquear archivos prohibidos.</p>
                        </div>
                    )}
                </div>

                <footer className="mt-32 mb-10 text-center opacity-40 hover:opacity-100 transition-opacity duration-700">
                    <div className="max-w-3xl mx-auto bg-white/5 border border-white/5 p-8 rounded-3xl backdrop-blur-sm">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-loose">
                            ⚠️ <span className="text-shinobi-gold font-bold">Protocolo de Curaduría:</span> Los pergaminos vinculados son propiedad de maestros externos 
                            (<span className="text-slate-300">Khan Academy, YouTube, WolframAlpha</span>). 
                            La <span className="text-shinobi-gold">Academia PMM</span> facilita el acceso al conocimiento y no reclama derechos sobre el material externo.
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default Biblioteca;
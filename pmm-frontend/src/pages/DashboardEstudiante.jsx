import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const DashboardEstudiante = () => {
    const navigate = useNavigate();
    const [datos, setDatos] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingIA, setLoadingIA] = useState(true); 
    const [errores, setErrores] = useState([]); 
    const [sugerenciaIA, setSugerenciaIA] = useState(null); 
    const [isExpanded, setIsExpanded] = useState(false); 

    const nombreUsuario = localStorage.getItem('user_name') || 'Ninja';
    const [fotoPerfil, setFotoPerfil] = useState(localStorage.getItem('user_avatar') || null);

    // 🚩 ELIMINADA LA LISTA QUEMADA. Ahora es 100% Dinámico.

    useEffect(() => {
        const cargarDatosDashboard = async () => {
            try {
                const [resDash, resErrores] = await Promise.all([
                    api.get('/estudiante/dashboard'),
                    api.get('/estudiante/errores-recientes')
                ]);

                setDatos(resDash.data);
                setErrores(resErrores.data);
                setLoading(false); 
                obtenerPrediccionIA();

            } catch (err) {
                if (err.response?.status === 403) navigate('/estudiante/diagnostico');
                else navigate('/'); 
                setLoading(false);
            }
        };

        const obtenerPrediccionIA = async () => {
            try {
                const resIA = await api.get('/estudiante/sugerencia-ia');
                setSugerenciaIA(resIA.data);
            } catch (err) {
                console.error("Error silencioso en IA");
            } finally {
                setLoadingIA(false); 
            }
        };

        cargarDatosDashboard();
    }, [navigate]);

    const getEstiloRango = (rango) => {
        const r = rango?.toLowerCase() || '';
        if (r.includes('genin')) return { color: 'text-rose-500', shadow: 'shadow-rose-500/20', border: 'border-rose-500/30', bg: 'bg-rose-500/10', bar: 'bg-rose-600' };
        if (r.includes('chunin')) return { color: 'text-amber-500', shadow: 'shadow-amber-500/20', border: 'border-amber-500/30', bg: 'bg-amber-500/10', bar: 'bg-amber-600' };
        if (r.includes('jonin')) return { color: 'text-emerald-500', shadow: 'shadow-emerald-500/20', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', bar: 'bg-emerald-600' };
        return { color: 'text-shinobi-gold', shadow: 'shadow-shinobi-gold/20', border: 'border-shinobi-gold/30', bg: 'bg-shinobi-gold/10', bar: 'bg-shinobi-gold' };
    };

    if (loading) return (
        <div className="min-h-screen bg-[#05070A] flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-shinobi-gold/20 border-t-shinobi-gold rounded-full animate-spin mb-4"></div>
            <div className="text-shinobi-gold font-scholar animate-pulse tracking-[0.5em] text-[10px]">Sincronizando Pergaminos...</div>
        </div>
    );

    const config = getEstiloRango(datos?.estadisticas?.rango_actual);
    const puntajeIA = datos?.estadisticas?.puntaje || 0;
    const misionesCompletas = datos?.estadisticas?.modulos_completados || 0;
    const totalMisiones = datos?.estadisticas?.total_misiones || 1;
    const efectividadInicial = Math.round((puntajeIA / 13) * 100);
    const efectividadActual = Math.round((misionesCompletas / totalMisiones) * 100);

    const rutaUnica = datos?.ruta_ia_asignada?.filter((modulo, index, self) =>
        index === self.findIndex((m) => m.id_modulo === modulo.id_modulo)
    ) || [];

    return (
        <div className="min-h-screen bg-[#05070A] flex text-slate-300 font-modern overflow-hidden selection:bg-shinobi-gold/30">
            
            <aside 
                onMouseEnter={() => setIsExpanded(true)}
                onMouseLeave={() => setIsExpanded(false)}
                className={`transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] bg-[#080C14] border-r border-white/5 flex flex-col p-6 hidden md:flex z-50 
                ${isExpanded ? 'w-72 shadow-[20px_0_50px_rgba(0,0,0,0.5)]' : 'w-24'}`}
            >
                <div className="mb-12 text-center relative">
                    <div className={`absolute -inset-2 rounded-full blur-xl opacity-20 ${config.bar}`}></div>
                    <div 
                        onClick={() => navigate('/estudiante/perfil')}
                        className={`transition-all duration-500 rounded-2xl mx-auto mb-4 border-2 flex items-center justify-center cursor-pointer relative bg-slate-900 overflow-hidden 
                        ${config.border} ${isExpanded ? 'w-16 h-16 rotate-[360deg]' : 'w-12 h-12'}`}
                    >
                        {fotoPerfil ? (
                            <img src={fotoPerfil} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className={`font-scholar transition-all font-bold ${isExpanded ? 'text-2xl' : 'text-lg'} ${config.color}`}>
                                {nombreUsuario.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>
                    <p className={`text-[10px] uppercase tracking-[0.4em] font-black transition-all duration-500 
                        ${isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'} ${config.color}`}>
                        {datos?.estadisticas?.rango_actual}
                    </p>
                </div>

                <nav className="flex-1 space-y-4">
                    {[
                        { label: 'PANEL CENTRAL', path: '/estudiante/dashboard', icon: '⛩️' },
                        { label: 'PERFIL NINJA', path: '/estudiante/perfil', icon: '👤' },
                        { label: 'BIBLIOTECA', path: '/estudiante/biblioteca', icon: '📜' },
                        { label: 'LIBRO BINGO', path: '/estudiante/ranking', icon: '🏆' },
                        { label: 'FORO COMUNIDAD', path: '/estudiante/foro', icon: '👥' },
                    ].map((item) => (
                        <button 
                            key={item.label}
                            onClick={() => navigate(item.path)}
                            className="group w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all duration-300"
                        >
                            <span className="text-xl group-hover:scale-125 transition-transform">{item.icon}</span>
                            <span className={`font-scholar text-[10px] tracking-widest transition-all duration-500 whitespace-nowrap
                                ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                                {item.label}
                            </span>
                        </button>
                    ))}
                </nav>

                <button onClick={() => {localStorage.clear(); navigate('/')}} className="mt-auto flex items-center gap-4 p-3 text-rose-500/50 hover:text-rose-500 transition-all uppercase font-scholar text-[10px] tracking-widest">
                    <span className="text-lg">🚪</span>
                    <span className={`${isExpanded ? 'opacity-100' : 'opacity-0'} transition-opacity`}>ABANDONAR</span>
                </button>
            </aside>

            <main className="flex-1 p-8 md:p-16 overflow-y-auto relative">
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-shinobi-gold/5 blur-[120px] rounded-full -z-10"></div>
                
                <header className="mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
                    <div className="flex items-center gap-4 mb-2">
                        <div className={`h-[2px] w-12 ${config.bar}`}></div>
                        <span className="text-shinobi-gold font-scholar text-xs tracking-[0.4em] uppercase opacity-50">Operational Status</span>
                    </div>
                    <h1 className="text-5xl font-scholar text-white tracking-tighter">
                        PROGRESO DE <span className={`${config.color}`}>{nombreUsuario}</span>
                    </h1>
                </header>

                <div className="mb-10">
                    {loadingIA ? (
                        <div className="bg-[#0E121C] border border-white/5 p-8 rounded-[2.5rem] animate-pulse flex items-center gap-6">
                            <div className="w-16 h-16 bg-white/5 rounded-full"></div>
                            <div className="flex-1 space-y-3">
                                <div className="h-2 w-32 bg-white/5 rounded"></div>
                                <div className="h-4 w-full bg-white/5 rounded"></div>
                            </div>
                        </div>
                    ) : sugerenciaIA && sugerenciaIA.tema && (
                        <div className="bg-gradient-to-r from-[#0E121C] to-[#121620] border border-shinobi-gold/30 p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl group animate-in fade-in zoom-in duration-700">
                            <div className="absolute -right-10 -top-10 text-[150px] opacity-5 grayscale group-hover:grayscale-0 transition-all duration-700">👁️‍🗨️</div>
                            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                                <div className="w-16 h-16 rounded-full bg-shinobi-gold/10 border border-shinobi-gold/50 flex items-center justify-center flex-shrink-0 shadow-[inset_0_0_20px_rgba(197,160,89,0.5)]">
                                    <span className="text-2xl animate-pulse">🤖</span>
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h4 className="text-shinobi-gold font-scholar text-xs uppercase tracking-[0.3em] mb-2">Sugerencia del Oráculo IA</h4>
                                    <h3 className="text-xl text-white font-bold mb-2">Análisis sobre: <span className="text-shinobi-gold italic">{sugerenciaIA.tema}</span></h3>
                                    <p className="text-sm text-slate-400 leading-relaxed font-modern italic">
                                        "{sugerenciaIA.mensaje}"
                                    </p>
                                </div>
                                <button 
                                    onClick={() => navigate(sugerenciaIA.nivel_alerta === 'critico' ? '/estudiante/historial-errores' : '/estudiante/biblioteca')}
                                    className="bg-shinobi-gold text-black hover:bg-white px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap shadow-lg shadow-shinobi-gold/20"
                                >
                                    {sugerenciaIA.accion}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* 🏅 SECCIÓN 2: COFRE DE INSIGNIAS (100% DINÁMICO) */}
<div className="mb-10 bg-[#0E121C]/60 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-md shadow-2xl relative overflow-hidden">
    <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
            <h3 className="font-scholar text-sm text-white uppercase tracking-[0.3em]">Cofre de Insignias</h3>
            <p className="text-[9px] text-slate-500 uppercase mt-1 tracking-widest font-bold">Tu legado en la Aldea Digital</p>
        </div>
        <div className="bg-shinobi-gold/10 px-4 py-2 rounded-full border border-shinobi-gold/20">
            <span className="text-shinobi-gold font-bold text-[10px] tracking-widest">
                {/* 🚩 Contador dinámico real basado en los datos del servidor */}
                {datos?.insignias_obtenidas?.length || 0} / {datos?.todas_insignias?.length || 0} RECOLECTADAS
            </span>
        </div>
    </div>

    <div className="grid grid-cols-4 md:grid-cols-7 gap-6 relative z-10">
        {/* 🚩 Mapeo dinámico completo: Si agregas insignias en MySQL, aparecerán aquí solas */}
        {datos?.todas_insignias?.map((insignia) => {
            // Verificamos si el ID de esta insignia existe en el array de ganadas del usuario
            const ganada = datos?.insignias_obtenidas?.some(i => i.id_insignia === insignia.id_insignia);
            
            return (
                <div key={insignia.id_insignia} className="group relative flex flex-col items-center">
                    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full border-2 flex items-center justify-center transition-all duration-700 
                        ${ganada 
                            ? 'border-shinobi-gold bg-shinobi-gold/10 shadow-[0_0_25px_rgba(197,160,89,0.2)] scale-110' 
                            : 'border-white/5 bg-slate-900/50 opacity-20 grayscale'}`}>
                        
                        {/* 🚩 Visualización: Puedes usar emojis o la ruta dinámica insignia.imagen si tienes los archivos */}
                        <span className="text-2xl group-hover:scale-125 transition-transform duration-500">
                            {ganada ? '🏅' : '🔒'}
                        </span>
                    </div>

                    {/* Tooltip con datos reales de la DB */}
                    <div className="mt-3 opacity-0 group-hover:opacity-100 transition-all duration-300 text-center absolute -bottom-10 bg-slate-900/95 p-3 rounded-xl border border-white/10 shadow-2xl z-50 pointer-events-none min-w-[120px]">
                        <p className="text-[8px] font-black uppercase text-shinobi-gold leading-tight">
                            {insignia.nombre_insignia}
                        </p>
                        <p className="text-[6px] text-slate-400 uppercase mt-1 leading-none">
                            {insignia.descripcion}
                        </p>
                    </div>

                    {/* Efecto visual de chakra para insignias activas */}
                    {ganada && (
                        <div className="absolute inset-0 bg-shinobi-gold/5 blur-2xl rounded-full -z-10 animate-pulse"></div>
                    )}
                </div>
            );
        })}
    </div>
</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-[#0E121C]/80 border border-white/5 p-8 rounded-3xl relative overflow-hidden group hover:border-white/10 transition-all shadow-2xl">
                        <div className={`absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity ${config.bar}`}></div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Efectividad de Chakra</p>
                        <p className={`text-3xl font-scholar mb-1 ${config.color}`}>{efectividadInicial}%</p>
                        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">Puntería en Diagnóstico</p>
                    </div>

                    <div className="bg-[#0E121C]/80 border border-white/5 p-8 rounded-3xl relative overflow-hidden group hover:border-white/10 transition-all shadow-2xl">
                        <div className={`absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity ${config.bar}`}></div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Grado Actual</p>
                        <p className="text-3xl font-scholar mb-1 text-white uppercase">{datos?.estadisticas?.rango_actual}</p>
                        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">Rango de Combate</p>
                    </div>

                    <div className="bg-[#0E121C]/80 border border-white/5 p-8 rounded-3xl relative overflow-hidden group hover:border-white/10 transition-all shadow-2xl">
                        <div className={`absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity ${config.bar}`}></div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Misiones</p>
                        <p className="text-3xl font-scholar mb-1 text-shinobi-gold">
                            {misionesCompletas} 
                            <span className="text-slate-700 text-xl ml-2">/ {datos?.estadisticas?.total_misiones}</span>
                        </p>
                        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">Objetivos Logrados</p>
                    </div>
                </div>

                {errores.length > 0 && (
                    <div className="mb-10 bg-rose-500/5 border border-rose-500/20 p-6 rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-4 backdrop-blur-sm animate-in fade-in slide-in-from-right-4 duration-700">
                        <div className="flex items-center gap-4 text-center md:text-left">
                            <span className="text-3xl">⚠️</span>
                            <div>
                                <h4 className="text-rose-500 font-scholar text-xs uppercase tracking-[0.2em]">Fallas en el Chakra Detectadas</h4>
                                <p className="text-[11px] text-slate-400 uppercase mt-1">Tu bitácora registra {errores.length} puntos críticos por analizar.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => navigate('/estudiante/historial-errores')}
                            className="bg-rose-600/20 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-500/30 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                        >
                            Ver El Camino de la Corrección
                        </button>
                    </div>
                )}

                <div className="mb-16 bg-[#0E121C]/40 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-8 px-4">
                        <div>
                            <h3 className="font-scholar text-sm text-white uppercase tracking-[0.3em]">Análisis de Evolución</h3>
                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Crecimiento vs diagnóstico base</p>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-bold text-shinobi-gold uppercase tracking-widest bg-shinobi-gold/10 px-3 py-1 rounded-full border border-shinobi-gold/20">
                                Rendimiento: {efectividadActual >= efectividadInicial ? 'En Ascenso ↑' : 'Estable →'}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-end gap-12 h-48 px-4">
                        <div className="flex-1 group relative">
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] px-2 py-1 rounded">
                                Inicial: {efectividadInicial}%
                            </div>
                            <div className="w-full bg-slate-900/50 rounded-t-xl overflow-hidden border border-white/5 h-40 flex items-end">
                                <div 
                                    className="w-full bg-slate-600/40 transition-all duration-[2s] ease-out shadow-[0_0_15px_rgba(71,85,105,0.2)]"
                                    style={{ height: `${efectividadInicial}%` }}
                                ></div>
                            </div>
                            <p className="mt-4 text-center text-[9px] font-scholar text-slate-500 tracking-widest uppercase">Diagnóstico</p>
                        </div>

                        <div className="flex-1 group relative">
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-shinobi-gold text-black font-bold text-[10px] px-2 py-1 rounded">
                                Actual: {efectividadActual}%
                            </div>
                            <div className="w-full bg-slate-900/50 rounded-t-xl overflow-hidden border border-white/5 h-40 flex items-end">
                                <div 
                                    className={`w-full ${config.bar} transition-all duration-[2s] delay-300 ease-out ${config.shadow} shadow-[0_0_25px]`}
                                    style={{ height: `${efectividadActual}%` }}
                                >
                                    <div className="w-full h-full bg-gradient-to-t from-black/20 to-white/20"></div>
                                </div>
                            </div>
                            <p className="mt-4 text-center text-[9px] font-scholar text-white tracking-widest uppercase">Progreso Real</p>
                        </div>

                        <div className="w-full md:w-48 pb-10">
                            <p className="text-[10px] text-slate-500 uppercase leading-relaxed font-bold tracking-tighter">
                                Has incrementado tu dominio de chakra en un <span className={config.color}>{Math.max(0, efectividadActual - efectividadInicial)}%</span> desde tu entrada al dojo.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-8">
                    <h3 className="font-scholar text-sm text-white/80 uppercase tracking-[0.3em]">Ruta de Maestría</h3>
                    <div className="h-px flex-1 mx-8 bg-gradient-to-r from-white/10 to-transparent"></div>
                </div>
                
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-20">
                    {rutaUnica.map((modulo, index) => {
                        const misionBloqueada = index > 0 && (rutaUnica[index - 1].porcentaje_avance < 100);
                        return (
                            <div 
                                key={modulo.id_modulo} 
                                onClick={() => !misionBloqueada && navigate(`/estudiante/modulo/${modulo.id_modulo}`)}
                                className={`group relative p-8 rounded-[2.5rem] transition-all duration-500 shadow-xl overflow-hidden border
                                    ${misionBloqueada 
                                        ? 'bg-slate-950/40 border-white/5 cursor-not-allowed opacity-60 grayscale' 
                                        : 'bg-[#0E121C]/60 border-white/5 cursor-pointer hover:bg-[#121826] hover:-translate-y-2'}`}
                            >
                                {misionBloqueada && (
                                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[1px]">
                                        <span className="text-3xl mb-2">🔒</span>
                                        <p className="text-[10px] font-scholar text-rose-500 tracking-[0.2em] uppercase font-bold">Misión Restringida</p>
                                    </div>
                                )}
                                <div className={`absolute -top-24 -right-24 w-48 h-48 blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity ${config.bg}`}></div>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="space-y-1">
                                        <span className="text-[9px] text-slate-500 font-black tracking-widest uppercase">Misión {index + 1}</span>
                                        <h4 className="text-2xl font-scholar text-white group-hover:text-shinobi-gold transition-colors tracking-tight">{modulo.nombre_modulo}</h4>
                                    </div>
                                    <div className={`w-12 h-12 rounded-full border border-white/10 flex items-center justify-center font-scholar text-xs transition-all duration-500
                                        ${modulo.porcentaje_avance === 100 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-slate-600'}`}>
                                        {modulo.porcentaje_avance === 100 ? '✓' : index + 1}
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 mb-10 leading-relaxed line-clamp-2 italic">{modulo.descripcion || "Iniciando protocolos de entrenamiento avanzado..."}</p>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Sincronización</span>
                                        <span className={`text-xs font-scholar font-bold ${config.color}`}>{modulo.porcentaje_avance || 0}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-black/40 rounded-full p-[2px] border border-white/5">
                                        <div className={`h-full rounded-full transition-all duration-[1.5s] ease-out relative ${config.bar} ${config.shadow} shadow-[0_0_20px]`} style={{ width: `${modulo.porcentaje_avance || 0}%` }}></div>
                                    </div>
                                </div>
                                {!misionBloqueada && (
                                    <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                                        <span className={`text-[9px] font-scholar tracking-[0.3em] uppercase ${config.color}`}>Entrar al Dojo</span>
                                        <span className="text-xl animate-pulse">⚡</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
};

export default DashboardEstudiante;
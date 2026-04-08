import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/api';

const DashboardEstudiante = () => {
    const navigate = useNavigate();
    const [datos, setDatos] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingIA, setLoadingIA] = useState(true);
    const [errores, setErrores] = useState([]);
    const [sugerenciaIA, setSugerenciaIA] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);

    const [nombreUsuario, setNombreUsuario] = useState(localStorage.getItem('user_name') || 'Usuario');
    const [fotoPerfil, setFotoPerfil] = useState(localStorage.getItem('user_avatar') || null);

    // 🚩 CARGA DE DATOS CENTRALIZADA
    const cargarDatosDashboard = useCallback(async () => {
        try {
            const [resDash, resErrores] = await Promise.all([
                api.get('/api/estudiante/dashboard'),
                api.get('/api/estudiante/errores-recientes'),
                api.get('/api/estudiante/perfil')
            ]);

            setDatos(resDash.data);
            setErrores(resErrores.data);

            if (resPerfil.data?.nombre_completo) {
                // Extraemos solo el primer nombre para que se vea más estético (opcional)
                const primerNombre = resPerfil.data.nombre_completo.split(' ')[0];
                setNombreUsuario(primerNombre);
                localStorage.setItem('user_name', primerNombre); // Respaldamos en el navegador
            }
            if (resPerfil.data?.foto_perfil) {
                setFotoPerfil(resPerfil.data.foto_perfil);
                localStorage.setItem('user_avatar', resPerfil.data.foto_perfil);
            }

            if (resDash.data?.estadisticas?.rango_actual) {
                localStorage.setItem('user_rank', resDash.data.estadisticas.rango_actual);
            }

            setLoading(false);
            obtenerPrediccionIA();
        } catch (err) {
            console.error("Error al cargar dashboard:", err);

            // 🚩 SI EL SERVIDOR DICE 403, AL DIAGNÓSTICO SIN EXCUSAS
            if (err.response?.status === 403) {
                navigate('/estudiante/diagnostico');
            } else {
                navigate('/'); // Otro error, vuelve al login
            }
            setLoading(false);
        }
    }, [navigate]);

    const obtenerPrediccionIA = async () => {
        try {
            const resIA = await api.get('/api/estudiante/sugerencia-ia');
            setSugerenciaIA(resIA.data);
        } catch (err) {
            console.error("Error silencioso en IA");
        } finally {
            setLoadingIA(false);
        }
    };

    useEffect(() => {
        cargarDatosDashboard();
    }, [cargarDatosDashboard]);

    // 🚩 HELPER DE ESTILOS POR NIVEL
    const getEstiloNivel = (nivelStr) => {
        const n = nivelStr?.toLowerCase() || '';
        if (n.includes('genin') || n.includes('bajo')) {
            return { color: 'text-rose-500', shadow: 'shadow-rose-500/20', border: 'border-rose-500/30', bg: 'bg-rose-500/10', bar: 'bg-rose-600', label: 'GENIN' };
        }
        if (n.includes('chunin') || n.includes('intermedio') || n.includes('guerrero')) {
            return { color: 'text-amber-500', shadow: 'shadow-amber-500/20', border: 'border-amber-500/30', bg: 'bg-amber-500/10', bar: 'bg-amber-600', label: 'CHUNIN' };
        }
        if (n.includes('jonin') || n.includes('alto') || n.includes('maestro')) {
            return { color: 'text-emerald-500', shadow: 'shadow-emerald-500/20', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', bar: 'bg-emerald-600', label: 'JONIN' };
        }
        return { color: 'text-shinobi-gold', shadow: 'shadow-shinobi-gold/20', border: 'border-shinobi-gold/30', bg: 'bg-shinobi-gold/10', bar: 'bg-shinobi-gold', label: 'MAESTRO' };
    };

    if (loading) return (
        <div className="min-h-screen bg-[#05070A] flex flex-col items-center justify-center p-4 text-center">
            <div className="w-16 h-16 border-4 border-shinobi-gold/20 border-t-shinobi-gold rounded-full animate-spin mb-4 shadow-[0_0_30px_rgba(197,160,89,0.2)]"></div>
            <div className="text-shinobi-gold font-scholar animate-pulse tracking-[0.5em] text-[10px] uppercase">Sincronizando Pergaminos...</div>
        </div>
    );

    const configGlobal = getEstiloNivel(datos?.estadisticas?.rango_actual);
    const puntajeIA = datos?.estadisticas?.puntaje || 0;
    const misionesCompletas = datos?.estadisticas?.modulos_completados || 0;
    const totalMisiones = datos?.estadisticas?.total_misiones || 1;

    // Cálculos de gráfica
    const efectividadInicial = Math.round((puntajeIA / 13) * 100);
    const efectividadActual = Math.round((misionesCompletas / totalMisiones) * 100);
    const heightInicial = Math.max(efectividadInicial, 2); // Mínimo visual
    const heightActual = Math.max(efectividadActual, 2);   // Mínimo visual

    const rutaUnica = datos?.ruta_ia_asignada?.filter((modulo, index, self) =>
        index === self.findIndex((m) => m.id_modulo === modulo.id_modulo)
    ) || [];

    const navItems = [
        { label: 'PANEL CENTRAL', path: '/estudiante/dashboard', icon: '⛩️' },
        { label: 'PERFIL', path: '/estudiante/perfil', icon: '👤' },
        { label: 'BIBLIOTECA', path: '/estudiante/biblioteca', icon: '📜' },
        { label: 'RANKING', path: '/estudiante/ranking', icon: '🏆' },
        { label: 'FORO', path: '/estudiante/foro', icon: '👥' },
    ];

    return (
        <div className="min-h-screen bg-[#05070A] flex text-slate-300 font-modern overflow-hidden selection:bg-shinobi-gold/30">

            {/* 🚩 ASIDE / SIDEBAR (DESKTOP) */}
            <aside
                onMouseEnter={() => setIsExpanded(true)}
                onMouseLeave={() => setIsExpanded(false)}
                className={`transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] bg-[#080C14] border-r border-white/5 flex flex-col p-6 hidden md:flex z-50 
                ${isExpanded ? 'w-72 shadow-[20px_0_50px_rgba(0,0,0,0.5)]' : 'w-24'}`}
            >
                {/* 🚩 BOTÓN ABANDONAR (AHORA EN LA PARTE SUPERIOR) */}
                <button
                    onClick={() => { localStorage.clear(); navigate('/') }}
                    className="mb-8 group flex items-center gap-4 p-3 text-rose-500/60 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all uppercase font-scholar text-[10px] tracking-widest w-full"
                >
                    <span className="text-xl group-hover:scale-110 transition-transform">🚪</span>
                    <span className={`${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'} transition-all duration-500 whitespace-nowrap`}>
                        ABANDONAR
                    </span>
                </button>

                {/* Perfil del Ninja */}
                <div className="mb-12 text-center relative">
                    <div className={`absolute -inset-2 rounded-full blur-xl opacity-20 ${configGlobal.bar}`}></div>
                    <div
                        onClick={() => navigate('/estudiante/perfil')}
                        className={`transition-all duration-500 rounded-2xl mx-auto mb-4 border-2 flex items-center justify-center cursor-pointer relative bg-slate-900 overflow-hidden 
                        ${configGlobal.border} ${isExpanded ? 'w-16 h-16 rotate-[360deg]' : 'w-12 h-12'}`}
                    >
                        {fotoPerfil ? (
                            <img src={fotoPerfil} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className={`font-scholar transition-all font-bold ${isExpanded ? 'text-2xl' : 'text-lg'} ${configGlobal.color}`}>
                                {nombreUsuario.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>
                    <p className={`text-[10px] uppercase tracking-[0.4em] font-black transition-all duration-500 
                        ${isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'} ${configGlobal.color}`}>
                        {datos?.estadisticas?.rango_actual}
                    </p>
                </div>

                {/* Menú de Navegación */}
                <nav className="flex-1 space-y-4">
                    {navItems.map((item) => (
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
            </aside>

            {/* 🚩 NAVEGACIÓN MÓVIL (BOTTOM BAR) */}
            <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#080C14]/95 backdrop-blur-lg border-t border-white/5 flex justify-around p-3 z-50 pb-safe">
                {navItems.map((item) => (
                    <button
                        key={item.label}
                        onClick={() => navigate(item.path)}
                        className="flex flex-col items-center p-2 text-slate-500 hover:text-shinobi-gold transition-colors"
                    >
                        <span className="text-xl mb-1">{item.icon}</span>
                        <span className="text-[8px] font-scholar tracking-widest uppercase">{item.label}</span>
                    </button>
                ))}
            </nav>

            {/* 🚩 CONTENIDO PRINCIPAL */}
            <main className="flex-1 p-5 md:p-10 lg:p-16 overflow-y-auto relative pb-28 md:pb-16">
                <div className="absolute top-0 right-0 w-full md:w-1/2 h-1/2 bg-shinobi-gold/5 blur-[80px] md:blur-[120px] rounded-full -z-10"></div>

                {/* 🚩 HEADER CON BOTÓN DE SALIDA PARA MÓVILES INYECTADO */}
                <header className="mb-8 md:mb-12 animate-in fade-in slide-in-from-top-4 duration-1000 relative">

                    {/* Botón de escape táctico (Solo Móviles) */}
                    <button
                        onClick={() => { localStorage.clear(); navigate('/'); }}
                        className="md:hidden absolute top-0 right-0 text-rose-500/60 hover:text-rose-500 flex flex-col items-center transition-all active:scale-95 bg-rose-500/5 p-2 rounded-xl border border-rose-500/10 z-10"
                    >
                        <span className="text-xl leading-none">🚪</span>
                        <span className="text-[7px] font-scholar uppercase tracking-widest mt-1 font-bold">Salir</span>
                    </button>

                    <div className="flex items-center gap-3 md:gap-4 mb-2 pr-16 md:pr-0">
                        <div className={`h-[2px] w-8 md:w-12 ${configGlobal.bar}`}></div>
                        <span className="text-shinobi-gold font-scholar text-[10px] md:text-xs tracking-[0.2em] md:tracking-[0.4em] uppercase opacity-50">Estado Operativo: {datos?.estadisticas?.rango_actual}</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-scholar text-white tracking-tighter uppercase leading-tight pr-16 md:pr-0">
                        PROGRESO DE <span className={`${configGlobal.color} block md:inline mt-1 md:mt-0`}>{nombreUsuario}</span>
                    </h1>
                </header>

                {/* 🚩 SECCIÓN 1: SUGERENCIA IA */}
                <div className="mb-8 md:mb-10">
                    {loadingIA ? (
                        <div className="bg-[#0E121C] border border-white/5 p-6 md:p-8 rounded-[2rem] animate-pulse flex flex-col md:flex-row items-center gap-6">
                            <div className="w-16 h-16 bg-white/5 rounded-full"></div>
                            <div className="flex-1 w-full space-y-3">
                                <div className="h-2 w-1/2 bg-white/5 rounded"></div>
                                <div className="h-4 w-full bg-white/5 rounded"></div>
                            </div>
                        </div>
                    ) : sugerenciaIA && sugerenciaIA.tema && (
                        <div className={`bg-gradient-to-r from-[#0E121C] to-[#121620] border p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] relative overflow-hidden shadow-2xl group transition-all duration-500
                            ${sugerenciaIA.nivel_alerta === 'critico' ? 'border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.1)]' : 'border-shinobi-gold/30'}`}>
                            <div className="flex flex-col lg:flex-row items-center gap-6 md:gap-8 relative z-10">
                                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full border flex items-center justify-center flex-shrink-0
                                    ${sugerenciaIA.nivel_alerta === 'critico' ? 'bg-rose-500/10 border-rose-500/50' : 'bg-shinobi-gold/10 border-shinobi-gold/50'}`}>
                                    <span className={`text-xl md:text-2xl ${sugerenciaIA.nivel_alerta === 'critico' ? 'animate-bounce' : 'animate-pulse'}`}>
                                        {sugerenciaIA.nivel_alerta === 'critico' ? '🎯' : '🤖'}
                                    </span>
                                </div>
                                <div className="flex-1 text-center lg:text-left w-full">
                                    <h4 className={`font-scholar text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] mb-2 ${sugerenciaIA.nivel_alerta === 'critico' ? 'text-rose-500' : 'text-shinobi-gold'}`}>
                                        {sugerenciaIA.nivel_alerta === 'critico' ? 'Análisis de Debilidad Crítica' : 'Sugerencia del Oráculo IA'}
                                    </h4>
                                    <h3 className="text-lg md:text-xl text-white font-bold mb-2">Análisis sobre: <span className="italic">{sugerenciaIA.tema}</span></h3>
                                    <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-modern italic">
                                        "{sugerenciaIA.mensaje}"
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate(sugerenciaIA.nivel_alerta === 'critico' ? '/estudiante/historial-errores' : '/estudiante/biblioteca')}
                                    className={`w-full lg:w-auto px-6 md:px-8 py-3 md:py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap shadow-lg
                                        ${sugerenciaIA.nivel_alerta === 'critico' ? 'bg-rose-600 text-white shadow-rose-600/20 hover:bg-rose-500' : 'bg-shinobi-gold text-black hover:bg-white shadow-shinobi-gold/20'}`}
                                >
                                    {sugerenciaIA.accion}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* 🚩 SECCIÓN 2: COFRE DE INSIGNIAS DINÁMICO */}
                <div className="mb-8 md:mb-10 bg-[#0E121C]/60 border border-white/5 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] backdrop-blur-md shadow-2xl relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-center sm:justify-between mb-6 md:mb-8 relative z-10 gap-4 text-center sm:text-left">
                        <div>
                            <h3 className="font-scholar text-xs md:text-sm text-white uppercase tracking-[0.2em] md:tracking-[0.3em]">Cofre de Insignias</h3>
                            <p className="text-[8px] md:text-[9px] text-slate-500 uppercase mt-1 tracking-widest font-bold">Tu legado en la Aldea Digital</p>
                        </div>
                        <div className="bg-shinobi-gold/10 px-4 py-2 rounded-full border border-shinobi-gold/20">
                            <span className="text-shinobi-gold font-bold text-[9px] md:text-[10px] tracking-widest">
                                {datos?.insignias_obtenidas?.length || 0} / {datos?.todas_insignias?.length || 0} RECOLECTADAS
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-4 md:gap-6 relative z-10">
                        {datos?.todas_insignias?.map((insignia) => {
                            const ganada = datos?.insignias_obtenidas?.some(i => i.id_insignia === insignia.id_insignia);
                            return (
                                <div key={insignia.id_insignia} className="group relative flex flex-col items-center">
                                    <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full border-2 flex items-center justify-center transition-all duration-700 
                                        ${ganada
                                            ? 'border-shinobi-gold bg-shinobi-gold/10 shadow-[0_0_25px_rgba(197,160,89,0.2)] scale-110'
                                            : 'border-white/5 bg-slate-900/50 opacity-20 grayscale'}`}>
                                        <span className="text-xl md:text-2xl group-hover:scale-125 transition-transform duration-500">
                                            {ganada ? '🏅' : '🔒'}
                                        </span>
                                    </div>
                                    <div className="mt-3 opacity-0 group-hover:opacity-100 transition-all duration-300 text-center absolute -bottom-8 md:-bottom-10 bg-slate-900/95 p-2 md:p-3 rounded-xl border border-white/10 shadow-2xl z-50 pointer-events-none w-24 md:min-w-[120px]">
                                        <p className="text-[7px] md:text-[8px] font-black uppercase text-shinobi-gold leading-tight">{insignia.nombre_insignia}</p>
                                        <p className="text-[5px] md:text-[6px] text-slate-400 uppercase mt-1 leading-none">{insignia.descripcion}</p>
                                    </div>
                                    {ganada && <div className="absolute inset-0 bg-shinobi-gold/5 blur-2xl rounded-full -z-10 animate-pulse"></div>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 🚩 SECCIÓN 3: ESTADÍSTICAS RÁPIDAS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-10">

                    {/* 🚩 Tarjeta Especial: Fuego Ninja (Racha) */}
                    <div className="bg-[#0E121C]/80 border border-rose-500/30 p-6 md:p-8 rounded-[2rem] md:rounded-3xl relative overflow-hidden group hover:border-rose-500 transition-all shadow-[0_0_20px_rgba(244,63,94,0.05)] hover:shadow-[0_0_30px_rgba(244,63,94,0.15)]">
                        <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute -right-4 -top-4 text-6xl opacity-10 blur-sm group-hover:scale-110 transition-transform">🔥</div>
                        <p className="text-[9px] md:text-[10px] text-slate-400 uppercase tracking-widest mb-1 relative z-10">Entrenamiento Constante</p>
                        <div className="flex items-center gap-3 relative z-10">
                            <span className="text-3xl md:text-4xl drop-shadow-lg animate-pulse">🔥</span>
                            <p className="text-2xl md:text-3xl font-scholar text-rose-500 font-bold">
                                {datos?.estadisticas?.racha_dias || 0} <span className="text-lg text-rose-500/70 uppercase">Días</span>
                            </p>
                        </div>
                        <p className="text-[8px] md:text-[9px] text-rose-400 font-bold uppercase tracking-tighter mt-1 relative z-10">Fuego Ninja (Racha Activa)</p>
                    </div>

                    <div className="bg-[#0E121C]/80 border border-white/5 p-6 md:p-8 rounded-[2rem] md:rounded-3xl relative overflow-hidden group hover:border-white/10 transition-all shadow-xl">
                        <div className={`absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity ${configGlobal.bar}`}></div>
                        <p className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-widest mb-2">Efectividad Chakra</p>
                        <p className={`text-2xl md:text-3xl font-scholar mb-1 ${configGlobal.color}`}>{efectividadInicial}%</p>
                        <p className="text-[8px] md:text-[9px] text-slate-600 font-bold uppercase tracking-tighter">Puntería en Diagnóstico</p>
                    </div>

                    <div className="bg-[#0E121C]/80 border border-white/5 p-6 md:p-8 rounded-[2rem] md:rounded-3xl relative overflow-hidden group hover:border-white/10 transition-all shadow-xl">
                        <div className={`absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity ${configGlobal.bar}`}></div>
                        <p className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-widest mb-2">Grado Actual</p>
                        <p className="text-xl md:text-3xl font-scholar mb-1 text-white uppercase truncate">{datos?.estadisticas?.rango_actual}</p>
                        <p className="text-[8px] md:text-[9px] text-slate-600 font-bold uppercase tracking-tighter">Rango de Combate</p>
                    </div>

                    <div className="bg-[#0E121C]/80 border border-white/5 p-6 md:p-8 rounded-[2rem] md:rounded-3xl relative overflow-hidden group hover:border-white/10 transition-all shadow-xl">
                        <div className={`absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity ${configGlobal.bar}`}></div>
                        <p className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-widest mb-2">Misiones Totales</p>
                        <p className="text-2xl md:text-3xl font-scholar mb-1 text-shinobi-gold">
                            {misionesCompletas}
                            <span className="text-slate-700 text-lg md:text-xl ml-2">/ {datos?.estadisticas?.total_misiones}</span>
                        </p>
                        <p className="text-[8px] md:text-[9px] text-slate-600 font-bold uppercase tracking-tighter">Historial de Maestría</p>
                    </div>
                </div>

                {/* 🚩 SECCIÓN 4: ANÁLISIS DE EVOLUCIÓN */}
                <div className="mb-10 md:mb-16 bg-[#0E121C]/40 border border-white/5 p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] backdrop-blur-sm shadow-2xl">

                    {/* Header de la Gráfica */}
                    <div className="flex flex-col sm:flex-row items-center sm:justify-between mb-8 md:mb-12 gap-4 text-center sm:text-left">
                        <div>
                            <h3 className="font-scholar text-sm md:text-base text-white uppercase tracking-[0.2em] md:tracking-[0.3em]">Análisis de Evolución</h3>
                            <p className="text-[8px] md:text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-1">Crecimiento vs Base</p>
                        </div>
                        <div className="text-right">
                            <span className="text-[9px] md:text-[10px] font-bold text-shinobi-gold uppercase tracking-widest bg-shinobi-gold/10 px-4 py-2 rounded-full border border-shinobi-gold/20 shadow-lg shadow-shinobi-gold/10">
                                Rendimiento: {efectividadActual >= efectividadInicial ? 'En Ascenso ↑' : 'Estable →'}
                            </span>
                        </div>
                    </div>

                    {/* Contenedor Flex para Gráfica y Resumen */}
                    <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center lg:items-end">

                        {/* 🚩 ÁREA DEL GRÁFICO */}
                        <div className="flex-1 w-full relative h-64 md:h-72 flex items-end justify-center gap-12 md:gap-24 border-b border-white/10 pb-0">

                            {/* Guías de fondo absolutas (0 a 100) */}
                            <div className="absolute inset-0 z-0">
                                {[100, 75, 50, 25, 0].map(val => (
                                    <div key={val} className="absolute w-full border-t border-white/5" style={{ bottom: `${val}%` }}>
                                        <span className="absolute -right-2 md:-right-8 text-[8px] md:text-[10px] font-scholar text-slate-600 translate-y-[-50%]">{val}%</span>
                                    </div>
                                ))}
                            </div>

                            {/* Barra 1: Diagnóstico */}
                            <div className="relative z-10 w-20 md:w-32 h-full flex flex-col justify-end items-center group">
                                {/* Tooltip Flotante */}
                                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[9px] md:text-[11px] px-3 py-1 rounded font-modern z-30 pointer-events-none whitespace-nowrap shadow-xl">
                                    Inicial: {efectividadInicial}%
                                </div>
                                <div className="w-full h-full bg-slate-900/50 rounded-t-xl border border-white/5 border-b-0 relative flex items-end justify-center">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${heightInicial}%` }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className="w-full bg-slate-600/40 relative rounded-t-xl shadow-[0_0_15px_rgba(71,85,105,0.1)] group-hover:bg-slate-600/60 transition-colors"
                                    >
                                        <span className="absolute -top-6 left-0 w-full text-center text-[10px] md:text-[12px] font-bold text-slate-400">{efectividadInicial}%</span>
                                    </motion.div>
                                </div>
                                <p className="absolute -bottom-8 w-full text-center text-[8px] md:text-[10px] font-scholar text-slate-500 tracking-widest uppercase">Diagnóstico</p>
                            </div>

                            {/* Barra 2: Real */}
                            <div className="relative z-10 w-20 md:w-32 h-full flex flex-col justify-end items-center group">
                                {/* Tooltip Flotante */}
                                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-shinobi-gold text-black text-[9px] md:text-[11px] font-bold px-3 py-1 rounded font-modern z-30 pointer-events-none whitespace-nowrap shadow-xl">
                                    Actual: {efectividadActual}%
                                </div>
                                <div className="w-full h-full bg-slate-900/50 rounded-t-xl border border-white/5 border-b-0 relative flex items-end justify-center shadow-inner overflow-hidden">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${heightActual}%` }}
                                        transition={{ type: "spring", stiffness: 50, damping: 12, delay: 0.3 }}
                                        className={`w-full ${configGlobal.bar} relative rounded-t-xl shadow-[0_0_20px] ${configGlobal.shadow}`}
                                    >
                                        {/* Brillo de Chakra Pulsante */}
                                        <motion.div
                                            animate={{ opacity: [0.3, 0.8, 0.3] }}
                                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                            className="absolute top-0 left-0 w-full h-3 bg-white/60 blur-[3px] z-20 rounded-t-xl"
                                        ></motion.div>

                                        <div className="w-full h-full bg-gradient-to-t from-black/20 to-transparent rounded-t-xl"></div>
                                        <span className="absolute -top-6 left-0 w-full text-center text-[10px] md:text-[12px] font-black text-white drop-shadow-md z-30">{efectividadActual}%</span>
                                    </motion.div>
                                </div>
                                <p className="absolute -bottom-8 w-full text-center text-[8px] md:text-[10px] font-scholar text-white tracking-widest uppercase font-bold">Real</p>
                            </div>
                        </div>

                        {/* Resumen Lateral Adaptativo */}
                        <div className="w-full lg:w-64 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-white/5 pt-12 lg:pt-0 lg:pl-8 text-center lg:text-left">
                            <p className="text-[11px] md:text-[13px] text-slate-400 uppercase leading-relaxed font-modern font-medium tracking-wide italic">
                                Tras analizar <span className="text-white font-bold">{misionesCompletas}</span> pergaminos, has incrementado tu dominio de chakra un <span className={`${configGlobal.color} font-black text-lg md:text-xl block md:inline mt-2 md:mt-0`}>{Math.max(0, efectividadActual - efectividadInicial)}%</span>.
                            </p>
                            <div className={`mt-4 h-[2px] w-16 rounded-full ${configGlobal.bar} mx-auto lg:mx-0`}></div>
                        </div>

                    </div>
                </div>

                {/* 🚩 SECCIÓN 5: BITÁCORA DE ERRORES */}
                {errores.length > 0 && (
                    <div className="mb-8 md:mb-10 bg-rose-500/5 border border-rose-500/20 p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-4 backdrop-blur-sm">
                        <div className="flex items-center gap-4 text-center md:text-left">
                            <span className="text-2xl md:text-3xl">⚠️</span>
                            <div>
                                <h4 className="text-rose-500 font-scholar text-[10px] md:text-xs uppercase tracking-[0.2em]">Fallas Detectadas</h4>
                                <p className="text-[9px] md:text-[11px] text-slate-400 uppercase mt-1">Bitácora registra {errores.length} puntos críticos.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/estudiante/historial-errores')}
                            className="w-full md:w-auto bg-rose-600/20 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-500/30 px-6 py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-rose-500/20"
                        >
                            Camino de Corrección
                        </button>
                    </div>
                )}

                {/* 🚩 SECCIÓN 6: RUTA DE MAESTRÍA ACUMULATIVA */}
                <div className="flex items-center justify-between mb-6 md:mb-8">
                    <h3 className="font-scholar text-xs md:text-sm text-white/80 uppercase tracking-[0.2em] md:tracking-[0.3em]">Malla Curricular</h3>
                    <div className="h-px flex-1 mx-4 md:mx-8 bg-gradient-to-r from-white/10 to-transparent"></div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
                    {rutaUnica.map((modulo, index) => {
                        const estiloModulo = getEstiloNivel(modulo.nivel);
                        const misionBloqueada = index > 0 && (rutaUnica[index - 1].porcentaje_avance < 100);

                        return (
                            <div
                                key={modulo.id_modulo}
                                onClick={() => !misionBloqueada && navigate(`/estudiante/modulo/${modulo.id_modulo}`)}
                                className={`group relative p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] transition-all duration-500 shadow-xl overflow-hidden border
                                    ${misionBloqueada
                                        ? 'bg-slate-950/40 border-white/5 cursor-not-allowed opacity-60 grayscale'
                                        : 'bg-[#0E121C]/60 border-white/5 cursor-pointer hover:bg-[#121826] hover:-translate-y-1 md:hover:-translate-y-2'}`}
                            >
                                {misionBloqueada && (
                                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[1px]">
                                        <span className="text-2xl md:text-3xl mb-2">🔒</span>
                                        <p className="text-[8px] md:text-[10px] font-scholar text-rose-500 tracking-[0.2em] uppercase font-bold">Nivel Restringido</p>
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-4 md:mb-6">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[8px] md:text-[9px] text-slate-500 font-black tracking-widest uppercase">Misión {index + 1}</span>
                                            <span className={`text-[6px] md:text-[7px] px-2 py-0.5 rounded-full border font-bold ${estiloModulo.border} ${estiloModulo.color} bg-black/20`}>
                                                {estiloModulo.label}
                                            </span>
                                        </div>
                                        <h4 className="text-lg md:text-2xl font-scholar text-white group-hover:text-shinobi-gold transition-colors tracking-tight">{modulo.nombre_modulo}</h4>
                                    </div>
                                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/10 flex items-center justify-center font-scholar text-[10px] md:text-xs transition-all duration-500 flex-shrink-0 ml-2
                                        ${modulo.porcentaje_avance === 100 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-slate-600'}`}>
                                        {modulo.porcentaje_avance === 100 ? '✓' : index + 1}
                                    </div>
                                </div>

                                <p className="text-[10px] md:text-xs text-slate-400 mb-6 md:mb-10 leading-relaxed line-clamp-2 italic">
                                    {modulo.descripcion || "Protocolos de entrenamiento ninja activados para este pergamino..."}
                                </p>

                                <div className="space-y-2 md:space-y-3">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[8px] md:text-[9px] font-bold text-slate-600 uppercase tracking-widest">Sincronización</span>
                                        <span className={`text-[10px] md:text-xs font-scholar font-bold ${estiloModulo.color}`}>{modulo.porcentaje_avance || 0}%</span>
                                    </div>
                                    <div className="h-1.5 md:h-2 w-full bg-black/40 rounded-full p-[1px] md:p-[2px] border border-white/5">
                                        <div
                                            className={`h-full rounded-full transition-all duration-[1.5s] ease-out relative ${estiloModulo.bar} ${estiloModulo.shadow} shadow-[0_0_15px] md:shadow-[0_0_20px]`}
                                            style={{ width: `${modulo.porcentaje_avance || 0}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {!misionBloqueada && (
                                    <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-white/5 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                                        <span className={`text-[8px] md:text-[9px] font-scholar tracking-[0.2em] md:tracking-[0.3em] uppercase ${estiloModulo.color}`}>Entrar al Dojo</span>
                                        <span className="text-lg md:text-xl animate-pulse">⚡</span>
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
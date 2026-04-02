import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Activity, ChevronRight, LogOut, Loader2, FileDown, RefreshCw } from 'lucide-react';
import api from '../api/api';

const DashboardDocente = () => {
    const navigate = useNavigate();
    const [estudiantes, setEstudiantes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [descargando, setDescargando] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [filtroNivel, setFiltroNivel] = useState('');

    const nombreUsuario = localStorage.getItem('user_name') || 'Docente';

    // 🚩 CARGA DE DATOS CENTRALIZADA
    const traerDatos = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get('/docente/resumen-estudiantes');
            // Mapeamos el campo 'reporte' que viene de tu controlador docenteController.js
            setEstudiantes(res.data.reporte || []);
        } catch (error) {
            console.error("❌ Error en la red de monitoreo:", error);
            if (error.response?.status === 403) navigate('/');
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        traerDatos();
    }, [traerDatos]);

    // 🚩 EXPORTACIÓN DE EXCEL BLINDADA
    const descargarExcel = async () => {
        try {
            setDescargando(true);
            const response = await api.get('/docente/descargar-excel', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Reporte_PMM_${new Date().toLocaleDateString()}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("❌ Error en extracción de datos:", error);
        } finally {
            setDescargando(false);
        }
    };

    const navItems = [
        { label: 'PANEL MAESTRO', path: '/docente/dashboard', icon: '⛩️' },
    ];

    const estudiantesFiltrados = estudiantes.filter(est => {
        const nombre = est.nombre?.toLowerCase() || '';
        const rango = est.rango_ia_asignado?.toLowerCase() || '';
        const coincideBusqueda = nombre.includes(busqueda.toLowerCase());
        const coincideNivel = filtroNivel === '' || rango.includes(filtroNivel.toLowerCase());
        return coincideBusqueda && coincideNivel;
    });

    if (loading) return (
        <div className="min-h-screen bg-[#05070A] flex flex-col items-center justify-center p-4 text-center">
            <div className="w-16 h-16 border-4 border-shinobi-gold/20 border-t-shinobi-gold rounded-full animate-spin mb-4 shadow-[0_0_30px_rgba(197,160,89,0.2)]"></div>
            <div className="text-shinobi-gold font-scholar animate-pulse tracking-[0.5em] text-[10px] uppercase">Sincronizando Censo Ninja...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#05070A] flex text-slate-300 font-modern overflow-hidden selection:bg-shinobi-gold/30">
            
            {/* 🚩 SIDEBAR PERSISTENTE */}
            <aside 
                onMouseEnter={() => setIsExpanded(true)}
                onMouseLeave={() => setIsExpanded(false)}
                className={`transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] bg-[#080C14] border-r border-white/5 flex flex-col p-6 hidden md:flex z-50 
                ${isExpanded ? 'w-72 shadow-[20px_0_50px_rgba(0,0,0,0.5)]' : 'w-24'}`}
            >
                <div className="mb-12 text-center relative">
                    <div className="absolute -inset-2 rounded-full blur-xl opacity-20 bg-shinobi-gold"></div>
                    <div className={`transition-all duration-500 rounded-2xl mx-auto mb-4 border-2 flex items-center justify-center relative bg-slate-900 overflow-hidden border-shinobi-gold/30 ${isExpanded ? 'w-16 h-16 rotate-[360deg]' : 'w-12 h-12'}`}>
                        <span className="font-scholar text-shinobi-gold font-bold text-xl uppercase">{nombreUsuario.charAt(0)}</span>
                    </div>
                    <p className={`text-[10px] uppercase tracking-[0.4em] font-black transition-all duration-500 text-shinobi-gold ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                        SENSEI
                    </p>
                </div>

                <nav className="flex-1 space-y-4">
                    {navItems.map((item) => (
                        <button key={item.label} onClick={() => navigate(item.path)} className="group w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all duration-300">
                            <span className="text-xl group-hover:scale-125 transition-transform">{item.icon}</span>
                            <span className={`font-scholar text-[10px] tracking-widest transition-all duration-500 whitespace-nowrap ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
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

            {/* 🚩 CONTENIDO PRINCIPAL */}
            <main className="flex-1 p-5 md:p-10 lg:px-16 lg:py-10 overflow-y-auto relative pb-28 md:pb-16">
                <div className="absolute top-0 right-0 w-full md:w-1/2 h-1/2 bg-shinobi-gold/5 blur-[120px] rounded-full -z-10"></div>
                
                <header className="mb-10 animate-in fade-in slide-in-from-top-4 duration-1000">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-[2px] w-12 bg-shinobi-gold"></div>
                        <span className="text-shinobi-gold font-scholar text-xs tracking-[0.4em] uppercase opacity-50">Monitoreo Académico Avanzado</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-scholar text-white tracking-tighter uppercase leading-tight">
                        OJO DEL <span className="text-shinobi-gold">MAESTRO</span>
                    </h1>
                </header>

                {/* KPI SECTION */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <div className="bg-[#0E121C]/80 border border-white/5 p-8 rounded-[2rem] relative overflow-hidden group">
                        <Users className="absolute -right-2 -top-2 text-shinobi-gold/10 group-hover:scale-110 transition-transform" size={80} />
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">Total Estudiantes</p>
                        <p className="text-4xl font-scholar text-white">{estudiantes.length}</p>
                    </div>

                    <div className="bg-[#0E121C]/80 border border-white/5 p-8 rounded-[2rem] relative overflow-hidden group">
                        <Activity className="absolute -right-2 -top-2 text-emerald-500/10 group-hover:scale-110 transition-transform" size={80} />
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">Rendimiento Aldea</p>
                        <p className="text-4xl font-scholar text-emerald-500">82%</p>
                    </div>

                    <button onClick={traerDatos} className="bg-white/5 border border-white/10 rounded-[2rem] flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-all group">
                        <RefreshCw className={`text-shinobi-gold ${loading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-700`} size={30} />
                        <span className="text-[9px] font-scholar tracking-[0.2em] uppercase">Sincronizar</span>
                    </button>

                    <button onClick={descargarExcel} disabled={descargando} className="bg-emerald-600/10 border border-emerald-500/20 rounded-[2rem] flex flex-col items-center justify-center gap-2 hover:bg-emerald-600/20 transition-all group disabled:opacity-50">
                        {descargando ? <Loader2 className="animate-spin text-emerald-500" size={30} /> : <FileDown className="text-emerald-400 group-hover:-translate-y-1 transition-transform" size={30} />}
                        <span className="text-[9px] font-scholar tracking-[0.2em] uppercase text-emerald-500">Bajar Reporte</span>
                    </button>
                </div>

                {/* FILTROS HUD */}
                <div className="flex flex-col md:flex-row gap-4 mb-8 bg-[#0E121C]/40 p-2 rounded-[2rem] border border-white/5 backdrop-blur-sm shadow-xl">
                    <div className="relative flex-1">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                        <input 
                            type="text" 
                            placeholder="FILTRAR NINJA POR NOMBRE..."
                            className="w-full bg-transparent border-none rounded-full py-4 pl-14 pr-6 text-xs uppercase tracking-widest text-white placeholder:text-slate-700 focus:ring-0"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>
                    <select 
                        className="bg-[#05070A] border border-white/10 rounded-full px-8 py-2 text-[10px] font-black uppercase tracking-widest text-shinobi-gold focus:border-shinobi-gold transition-all mr-2"
                        value={filtroNivel}
                        onChange={(e) => setFiltroNivel(e.target.value)}
                    >
                        <option value="">TODOS LOS RANGOS</option>
                        <option value="GENIN">GENIN</option>
                        <option value="CHUNIN">CHUNIN</option>
                        <option value="JONIN">JONIN</option>
                    </select>
                </div>

                {/* 🚩 TABLA TÁCTICA DE ESTUDIANTES */}
                <div className="bg-[#0E121C]/60 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-md shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white/5 text-[11px] uppercase tracking-[0.3em] text-shinobi-gold font-bold">
                                <tr>
                                    <th className="p-8">Identidad del Ninja</th>
                                    <th className="p-8">Jerarquía (IA)</th>
                                    <th className="p-8 text-center">Avance Maestro</th>
                                    <th className="p-8 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {estudiantesFiltrados.map((est) => (
                                    <tr key={est.id_estudiante} className="hover:bg-white/[0.04] transition-all group">
                                        <td className="p-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-shinobi-dark border border-white/10 flex items-center justify-center font-scholar text-shinobi-gold text-lg shadow-inner group-hover:border-shinobi-gold/50 transition-all">
                                                    {est.nombre?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-base font-bold text-white group-hover:text-shinobi-gold transition-colors">{est.nombre}</p>
                                                    <p className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">{est.correo}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <span className={`text-[10px] font-black px-4 py-1.5 rounded-lg border tracking-widest uppercase ${
                                                est.rango_ia_asignado?.includes('Jonin') ? 'border-purple-500/30 text-purple-400 bg-purple-500/5' :
                                                est.rango_ia_asignado?.includes('Chunin') ? 'border-blue-500/30 text-blue-400 bg-blue-500/5' :
                                                'border-emerald-500/30 text-emerald-400 bg-emerald-500/5'
                                            }`}>
                                                {est.rango_ia_asignado}
                                            </span>
                                        </td>
                                        <td className="p-8">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="text-[11px] font-black text-white">{est.avance_promedio}</span>
                                                <div className="w-32 h-1.5 bg-black/40 rounded-full overflow-hidden p-[1px] border border-white/5 shadow-inner">
                                                    <div 
                                                        className="h-full bg-shinobi-gold shadow-[0_0_10px_rgba(212,175,55,0.4)] transition-all duration-1000 ease-out" 
                                                        style={{ width: est.avance_promedio }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-8 text-right">
                                            <button 
                                                onClick={() => navigate(`/docente/reporte-estudiante/${est.id_estudiante}`)}
                                                className="inline-flex items-center gap-2 bg-white/5 hover:bg-shinobi-gold hover:text-black transition-all text-[10px] font-black uppercase tracking-widest py-3 px-8 rounded-full border border-white/10 shadow-lg active:scale-95 cursor-pointer"
                                            >
                                                Expediente <ChevronRight size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {estudiantesFiltrados.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="p-20 text-center text-slate-600 font-scholar uppercase tracking-[0.5em] text-xs">
                                            Ningún ninja coincide con el registro
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DashboardDocente;
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Activity, ChevronRight, Loader2, FileDown, RefreshCw, ShieldCheck, Zap } from 'lucide-react';
import api from '../api/api';

const DashboardDocente = () => {
    const navigate = useNavigate();
    const [estudiantes, setEstudiantes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [descargando, setDescargando] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [filtroNivel, setFiltroNivel] = useState('');

const usuarioGuardado = JSON.parse(localStorage.getItem('usuario') || '{}');
const nombreUsuario = usuarioGuardado.nombre_completo || 'Docente';

    const traerDatos = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/docente/resumen-estudiantes');
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

    const descargarExcel = async () => {
        try {
            setDescargando(true);
            const response = await api.get('/api/docente/descargar-excel', { responseType: 'blob' });
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

    const evaluarConexion = (fechaISO, estado) => {
        if (estado === 'Inactivo') {
            return { texto: 'Inactivo', estilo: 'border-rose-500/30 text-rose-400 bg-rose-500/5', dot: 'bg-rose-500' };
        }
        if (!fechaISO) {
            return { texto: 'Sin Registro', estilo: 'border-slate-500/30 text-slate-400 bg-slate-500/5', dot: 'bg-slate-500' };
        }
        try {
            const hoyStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
            const fechaValida = fechaISO.includes('T') ? fechaISO : fechaISO.replace(' ', 'T') + 'Z';
            const ultimaConexion = new Date(fechaValida);
            const ultimaStr = ultimaConexion.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

            if (hoyStr === ultimaStr) {
                return { texto: 'En Línea', estilo: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5', dot: 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]' };
            }
            const utcHoy = new Date(`${hoyStr}T00:00:00Z`);
            const utcUltima = new Date(`${ultimaStr}T00:00:00Z`);
            const diferenciaDias = Math.round((utcHoy - utcUltima) / (1000 * 60 * 60 * 24));

            if (diferenciaDias <= 0) {
                 return { texto: 'En Línea', estilo: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5', dot: 'bg-emerald-500 animate-pulse' };
            } else if (diferenciaDias > 0 && diferenciaDias <= 3) {
                return { texto: `Hace ${diferenciaDias}d`, estilo: 'border-amber-500/30 text-amber-400 bg-amber-500/5', dot: 'bg-amber-500' };
            } else {
                return { texto: `Inactivo ${diferenciaDias}d`, estilo: 'border-rose-500/30 text-rose-400 bg-rose-500/5', dot: 'bg-rose-500' };
            }
        } catch (e) {
            return { texto: 'Error Fecha', estilo: 'border-slate-500/30 text-slate-400 bg-slate-500/5', dot: 'bg-slate-500' };
        }
    };

    // --- CÁLCULOS DINÁMICOS BLINDADOS ---
    
    // 1. Filtrado de la tabla
    const estudiantesFiltrados = estudiantes.filter(est => {
        const nombre = est.nombre?.toLowerCase() || '';
        const rango = est.rango_ia_asignado?.toLowerCase() || '';
        const coincideBusqueda = nombre.includes(busqueda.toLowerCase());
        const coincideNivel = filtroNivel === '' || rango.includes(filtroNivel.toLowerCase());
        return coincideBusqueda && coincideNivel;
    });

    // 2. Alerta de Deserción: Cuenta cuántos están 'Inactivos' usando la función de evaluación
    const alertasDesercion = estudiantes.filter(est => {
        const conexion = evaluarConexion(est.ultima_conexion, est.estado);
        return conexion.texto.includes('Inactivo');
    }).length;

    // 3. Efectividad Promedio: Extrae el % numérico y saca el promedio general
    const calcularEfectividadPromedio = () => {
        if (!estudiantes || estudiantes.length === 0) return "0.0%";
        
        const sumaAvance = estudiantes.reduce((acumulador, est) => {
            // Convierte valores como "85%" o 85 a float de forma segura
            const avanceStr = (est.avance_promedio || '0').toString().replace('%', '');
            const avanceNum = parseFloat(avanceStr) || 0;
            return acumulador + avanceNum;
        }, 0);
        
        const promedio = sumaAvance / estudiantes.length;
        return `${promedio.toFixed(1)}%`;
    };

    const efectividadPromedio = calcularEfectividadPromedio();


    if (loading) return (
        <div className="min-h-screen bg-[#020408] flex flex-col items-center justify-center p-4">
            <div className="relative">
                <div className="w-20 h-20 border-2 border-shinobi-gold/10 border-t-shinobi-gold rounded-full animate-spin"></div>
                <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-shinobi-gold animate-pulse" size={32} />
            </div>
            <div className="mt-6 text-shinobi-gold font-scholar tracking-[0.6em] text-[10px] uppercase">Encriptando Datos del Censo...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#05070A] flex text-slate-300 font-modern selection:bg-shinobi-gold/30">
            
            {/* Sidebar con diseño serio */}
            <aside 
                onMouseEnter={() => setIsExpanded(true)}
                onMouseLeave={() => setIsExpanded(false)}
                className={`transition-all duration-500 ease-in-out bg-[#080C14] border-r border-white/5 flex flex-col p-6 hidden lg:flex z-50 
                ${isExpanded ? 'w-72 shadow-[10px_0_40px_rgba(0,0,0,0.7)]' : 'w-24'}`}
            >
                <div className="mb-12 flex flex-col items-center">
                    <div className={`transition-all duration-500 rounded-lg mb-4 border flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 border-shinobi-gold/20 ${isExpanded ? 'w-16 h-16' : 'w-12 h-12'}`}>
                        <span className="font-scholar text-shinobi-gold font-bold text-2xl">{nombreUsuario.charAt(0)}</span>
                    </div>
                    {isExpanded && (
                        <div className="text-center animate-in fade-in duration-500">
                            <h3 className="text-white font-bold text-xs uppercase tracking-widest">{nombreUsuario}</h3>
                            <p className="text-[9px] font-black text-shinobi-gold mt-1 tracking-[0.3em]">ADMINISTRADOR ESTRATÉGICO</p>
                        </div>
                    )}
                </div>

                <nav className="flex-1 space-y-6">
                    <button onClick={() => navigate('/docente/dashboard')} className="flex items-center gap-4 w-full p-3 rounded-lg bg-white/5 text-shinobi-gold border border-white/5">
                        <Activity size={20} />
                        {isExpanded && <span className="text-[10px] font-scholar tracking-widest">MONITOREO GLOBAL</span>}
                    </button>
                </nav>

                <button onClick={() => {localStorage.clear(); navigate('/')}} className="mt-auto flex items-center gap-4 p-3 text-rose-500/70 hover:text-rose-400 transition-colors uppercase font-scholar text-[10px] tracking-widest">
                    <span>🚪</span>
                    {isExpanded && <span>DESCONECTAR</span>}
                </button>
            </aside>

            <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto relative">
                {/* Fondo de alta gama */}
                <div className="absolute top-0 right-0 w-full md:w-2/3 h-full bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.03),transparent)] -z-10"></div>
                
                <header className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-[1px] w-8 bg-shinobi-gold/40"></div>
                        <span className="text-shinobi-gold/60 font-scholar text-[10px] tracking-[0.5em] uppercase">Intelligence Division</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-3xl md:text-5xl font-scholar text-white tracking-tight uppercase">
                                CONTROL DE <span className="text-shinobi-gold">ACTIVOS</span>
                            </h1>
                            <p className="mt-2 text-slate-500 text-xs uppercase tracking-widest font-mono">
                                Terminal de supervisión: <span className="text-slate-300">Sensei {nombreUsuario}</span>
                            </p>
                        </div>
                        
                        <div className="flex gap-3">
                            <button onClick={traerDatos} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group">
                                <RefreshCw size={18} className={`${loading ? 'animate-spin' : ''} text-shinobi-gold`} />
                            </button>
                            <button 
                                onClick={descargarExcel} 
                                disabled={descargando} 
                                className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-xl hover:bg-emerald-500/20 transition-all text-emerald-500 text-[10px] font-black tracking-widest uppercase disabled:opacity-50"
                            >
                                {descargando ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
                                <span>Exportar Data</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Estadísticas Compactas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                    <div className="bg-[#0E121C] border border-white/5 p-6 rounded-2xl flex items-center justify-between">
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Censo Total</p>
                            <p className="text-3xl font-scholar text-white">{estudiantes.length}</p>
                        </div>
                        <Users className="text-shinobi-gold/20" size={40} />
                    </div>
                    <div className="bg-[#0E121C] border border-white/5 p-6 rounded-2xl flex items-center justify-between">
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Efectividad Promedio</p>
                            <p className="text-3xl font-scholar text-emerald-500">{efectividadPromedio}</p>
                        </div>
                        <Activity className="text-emerald-500/20" size={40} />
                    </div>
                    <div className="bg-[#0E121C] border border-white/5 p-6 rounded-2xl flex items-center justify-between">
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Alerta de Deserción</p>
                            <p className="text-3xl font-scholar text-rose-500">{alertasDesercion}</p>
                        </div>
                        <Zap className="text-rose-500/20" size={40} />
                    </div>
                </div>

                {/* Filtros de Precisión */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-shinobi-gold transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder="BUSCAR EXPEDIENTE POR NOMBRE..."
                            className="w-full bg-[#0E121C] border border-white/5 rounded-xl py-3 pl-12 pr-6 text-[11px] uppercase tracking-widest text-white outline-none focus:border-shinobi-gold/50 transition-all"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>
                    <select 
                        className="bg-[#0E121C] border border-white/5 rounded-xl px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-shinobi-gold outline-none focus:border-shinobi-gold/50 cursor-pointer"
                        value={filtroNivel}
                        onChange={(e) => setFiltroNivel(e.target.value)}
                    >
                        <option value="">FILTRAR POR RANGO</option>
                        <option value="GENIN">GENIN</option>
                        <option value="CHUNIN">CHUNIN</option>
                        <option value="JONIN">JONIN</option>
                        <option value="KAGE">KAGE (LEYENDA)</option>
                    </select>
                </div>

                {/* Tabla de Alto Impacto */}
                <div className="bg-[#0E121C]/80 border border-white/5 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold border-b border-white/5">
                                <tr>
                                    <th className="p-6">Estudiante</th>
                                    <th className="p-6">Rango Jerárquico</th>
                                    <th className="p-6 text-center">Progreso Académico</th>
                                    <th className="p-6 text-center">Estado Actividad</th>
                                    <th className="p-6 text-right">Gestión</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {estudiantesFiltrados.map((est) => {
                                    const conexion = evaluarConexion(est.ultima_conexion, est.estado);
                                    
                                    return (
                                        <tr key={est.id_estudiante} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center font-scholar text-shinobi-gold text-sm">
                                                        {est.nombre?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{est.nombre}</p>
                                                        <p className="text-[10px] text-slate-500 font-mono lowercase">{est.correo}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <span className={`text-[9px] font-black px-3 py-1 rounded-md border tracking-widest uppercase ${
                                                    est.rango_ia_asignado?.includes('Kage') ? 'border-orange-500/40 text-orange-400 bg-orange-500/10 shadow-[0_0_10px_rgba(249,115,22,0.1)]' :
                                                    est.rango_ia_asignado?.includes('Jonin') ? 'border-purple-500/30 text-purple-400 bg-purple-500/5' :
                                                    est.rango_ia_asignado?.includes('Chunin') ? 'border-blue-500/30 text-blue-400 bg-blue-500/5' :
                                                    'border-emerald-500/30 text-emerald-400 bg-emerald-500/5'
                                                }`}>
                                                    {est.rango_ia_asignado || 'Pendiente'}
                                                </span>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <span className="text-[10px] font-bold text-slate-300">{est.avance_promedio || '0%'}</span>
                                                    <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-shinobi-gold transition-all duration-1000" 
                                                            style={{ width: typeof est.avance_promedio === 'number' ? `${est.avance_promedio}%` : (est.avance_promedio || '0%') }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex justify-center">
                                                    <span className={`flex items-center gap-2 text-[9px] font-bold px-3 py-1 rounded-full border tracking-widest uppercase ${conexion.estilo}`}>
                                                        <span className={`w-1 h-1 rounded-full ${conexion.dot}`}></span>
                                                        {conexion.texto}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-6 text-right">
                                                <button 
                                                    onClick={() => navigate(`/docente/reporte-estudiante/${est.id_estudiante}`)}
                                                    className="bg-white/5 hover:bg-shinobi-gold hover:text-black transition-all text-[9px] font-black uppercase tracking-widest py-2 px-5 rounded-lg border border-white/5 active:scale-95"
                                                >
                                                    Expediente
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {estudiantesFiltrados.length === 0 && (
                        <div className="p-16 text-center">
                            <p className="text-slate-600 font-scholar uppercase tracking-[0.4em] text-[10px]">Sin registros en la base de datos central</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default DashboardDocente;
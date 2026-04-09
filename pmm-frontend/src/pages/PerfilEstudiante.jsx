import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api, { BACKEND_URL } from '../api/api';

const PerfilEstudiante = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [datos, setDatos] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fotoPerfil, setFotoPerfil] = useState(null);
    const [subiendoFoto, setSubiendoFoto] = useState(false);

    const generarColorAvatar = (nombre = "Ninja") => {
        const colores = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
        let hash = 0;
        for (let i = 0; i < nombre.length; i++) hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
        return colores[Math.abs(hash) % colores.length];
    };

    const obtenerUrlImagen = (ruta) => {
        if (!ruta) return null;
        if (ruta.startsWith('http')) return ruta;
        return `${BACKEND_URL}${ruta.startsWith('/') ? '' : '/'}${ruta}`;
    };

    useEffect(() => {
        const inicializarPerfil = async () => {
            try {
                const [resUser, resDash] = await Promise.all([
                    api.get('/api/estudiante/perfil/datos').catch(() => ({ data: {} })),
                    api.get('/api/estudiante/dashboard').catch(() => ({ data: {} }))
                ]);

                const dashStats = resDash.data?.estadisticas || {};
                const puntajeIA = dashStats.puntaje || 0;
                const efectividadReal = Math.round((puntajeIA / 13) * 100) || 0;
                const misionesCompletas = dashStats.modulos_completados || 0;

                setDatos({
                    nombre_completo: resUser.data?.nombre_completo || localStorage.getItem('user_name'),
                    correo: resUser.data?.correo || localStorage.getItem('user_email'),
                    rango_actual: dashStats.rango_actual || 'Genin (Iniciado)',
                    puntaje_total: puntajeIA,
                    ejercicios_completados: misionesCompletas,
                    efectividad: efectividadReal,
                    racha_dias: dashStats.racha_dias || 0
                });

                if (resUser.data?.foto_perfil) {
                    setFotoPerfil(resUser.data.foto_perfil);
                    localStorage.setItem('user_avatar', resUser.data.foto_perfil);
                } else if (localStorage.getItem('user_avatar')) {
                    setFotoPerfil(localStorage.getItem('user_avatar'));
                }

            } catch (err) {
                console.error("Error crítico de red al inicializar perfil:", err);
            } finally {
                setLoading(false);
            }
        };
        inicializarPerfil();
    }, []);

    const handleSubirFoto = async (e) => {
        const archivo = e.target.files[0];
        if (!archivo) return;

        const formData = new FormData();
        formData.append('avatar', archivo);
        setSubiendoFoto(true);

        try {
            const res = await api.post('/api/estudiante/perfil/avatar', formData);
            setFotoPerfil(res.data.url);
            localStorage.setItem('user_avatar', res.data.url);
        } catch (err) {
            console.error(err);
            alert("Error al actualizar la imagen en el servidor.");
        } finally {
            setSubiendoFoto(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#05070A] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-shinobi-gold border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    const nombre = datos?.nombre_completo || 'Estudiante';
    const email = datos?.correo || 'correo@academia.edu';

    // 🚩 LÓGICA DE HITOS GAMIFICADOS
    const hitos = [
        { 
            id: 1, titulo: 'Primera Sangre', 
            desc: 'Completaste tu primer módulo.', 
            icono: '🎯', logrado: datos.ejercicios_completados > 0 
        },
        { 
            id: 2, titulo: 'Precisión Letal', 
            desc: 'Alcanzaste 80% o más de efectividad.', 
            icono: '⚡', logrado: datos.efectividad >= 80 
        },
        { 
            id: 3, titulo: 'Voluntad de Fuego', 
            desc: 'Mantuvo una racha de más de 3 días.', 
            icono: '🔥', logrado: datos.racha_dias >= 3 
        },
        { 
            id: 4, titulo: 'Ascenso de Rango', 
            desc: 'Superaste el nivel básico.', 
            icono: '🏅', logrado: !datos.rango_actual.includes('Genin') 
        }
    ];

    return (
        <div className="min-h-screen bg-[#05070A] p-4 md:p-10 flex flex-col items-center">

            <button
                onClick={() => navigate('/estudiante/dashboard')}
                className="self-start mb-6 text-slate-500 hover:text-shinobi-gold transition-all text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2"
            >
                ← Volver al Panel
            </button>

            <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* COLUMNA IZQUIERDA: PERFIL Y STATS */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#0E121C] border border-white/5 p-8 rounded-[2rem] shadow-2xl text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-shinobi-gold"></div>
                        
                        <div className="relative group mx-auto w-32 h-32 mb-6">
                            <div
                                className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center border-4 border-shinobi-gold shadow-xl overflow-hidden relative cursor-pointer"
                                onClick={() => fileInputRef.current.click()}
                                style={{ backgroundColor: !fotoPerfil ? generarColorAvatar(nombre) : 'transparent' }}
                            >
                                {fotoPerfil ? (
                                    <img src={obtenerUrlImagen(fotoPerfil)} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-6xl text-white font-scholar">{nombre.charAt(0).toUpperCase()}</span>
                                )}

                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[10px] text-white font-bold uppercase tracking-widest text-center px-2">Cambiar Sello</span>
                                </div>
                            </div>
                            {subiendoFoto && <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center"><div className="w-5 h-5 border-2 border-shinobi-gold border-t-transparent rounded-full animate-spin"></div></div>}
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleSubirFoto} />
                        </div>

                        <h3 className="text-2xl font-scholar text-white leading-tight uppercase">{nombre}</h3>
                        <p className="text-[10px] text-slate-500 uppercase font-bold mt-1 tracking-widest">{email}</p>

                        <div className="mt-6 px-4 py-2 bg-shinobi-gold/10 border border-shinobi-gold/30 text-shinobi-gold text-[10px] font-black uppercase tracking-[0.2em] rounded-full inline-block">
                            Rango: {datos.rango_actual}
                        </div>
                    </div>

                    <div className="bg-[#0E121C] border border-white/5 p-6 rounded-[2rem]">
                        <h4 className="text-[10px] text-slate-500 uppercase font-black mb-4 tracking-widest">Nivel de Dominio</h4>
                        <div className="flex justify-between items-center text-white mb-2">
                            <span className="text-xs font-bold text-slate-400">Efectividad</span>
                            <span className="text-shinobi-gold font-bold text-lg">{datos.efectividad}%</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${datos.efectividad}%` }} className="h-full bg-shinobi-gold" />
                        </div>
                        <div className="mt-6 flex justify-between border-t border-white/5 pt-4">
                            <div className="text-center w-1/2 border-r border-white/5">
                                <p className="text-2xl text-white font-scholar">{datos.puntaje_total}</p>
                                <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">XP TOTAL</p>
                            </div>
                            <div className="text-center w-1/2">
                                <p className="text-2xl text-white font-scholar">{datos.ejercicios_completados}</p>
                                <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">MISIONES</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 🚩 COLUMNA DERECHA: RÉCORDS E HITOS (GAMIFICACIÓN) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#0E121C] border border-white/5 p-8 rounded-[2rem] shadow-xl">
                        <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                            <div>
                                <h4 className="text-sm font-scholar text-white uppercase tracking-[0.2em]">Récords Académicos</h4>
                                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-1">Hitos de Sabiduría</p>
                            </div>
                            <span className="text-2xl animate-pulse">🏆</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {hitos.map(hito => (
                                <div 
                                    key={hito.id} 
                                    className={`p-5 rounded-2xl border transition-all duration-500 flex items-center gap-4
                                        ${hito.logrado 
                                            ? 'bg-shinobi-gold/10 border-shinobi-gold/30 hover:bg-shinobi-gold/20 hover:border-shinobi-gold/50 shadow-[0_0_15px_rgba(197,160,89,0.1)]' 
                                            : 'bg-slate-900/50 border-white/5 opacity-60 grayscale'}`}
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-inner
                                        ${hito.logrado ? 'bg-shinobi-gold/20 border border-shinobi-gold/50' : 'bg-black border border-white/10'}`}>
                                        {hito.logrado ? hito.icono : '🔒'}
                                    </div>
                                    <div>
                                        <h5 className={`text-xs font-black uppercase tracking-wider mb-1 ${hito.logrado ? 'text-shinobi-gold' : 'text-slate-400'}`}>
                                            {hito.titulo}
                                        </h5>
                                        <p className="text-[10px] text-slate-400 leading-tight">
                                            {hito.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PerfilEstudiante;
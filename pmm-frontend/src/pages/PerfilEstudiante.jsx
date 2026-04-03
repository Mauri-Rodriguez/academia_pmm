import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/api';

const PerfilEstudiante = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // ESTADOS DINÁMICOS
    const [datos, setDatos] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notificaciones, setNotificaciones] = useState([]);
    const [fotoPerfil, setFotoPerfil] = useState(null);
    const [subiendoFoto, setSubiendoFoto] = useState(false);

    // 🎨 FUNCIÓN DE COLOR PARA AVATAR
    const generarColorAvatar = (nombre = "Ninja") => {
        const colores = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
        let hash = 0;
        for (let i = 0; i < nombre.length; i++) hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
        return colores[Math.abs(hash) % colores.length];
    };

    useEffect(() => {
        const inicializarPerfil = async () => {
            try {
                const [resUser, resDash, resNotif] = await Promise.all([
                    api.get('/api/estudiante/perfil/datos').catch(() => ({ data: {} })),
                    api.get('/api/estudiante/dashboard').catch(() => ({ data: {} })),
                    api.get('/api/estudiante/notificaciones').catch(() => ({ data: [] }))
                ]);

                // 🚩 EXTRAEMOS LOS DATOS EXACTAMENTE COMO EN EL DASHBOARD
                const dashStats = resDash.data?.estadisticas || {};
                const puntajeIA = dashStats.puntaje || 0;

                // 🚩 USAMOS TU FÓRMULA ORIGINAL: (puntaje / 13) * 100
                const efectividadReal = Math.round((puntajeIA / 13) * 100) || 0;
                const misionesCompletas = dashStats.modulos_completados || 0;

                setDatos({
                    nombre_completo: resUser.data?.nombre_completo || localStorage.getItem('user_name'),
                    correo: resUser.data?.correo || localStorage.getItem('user_email'),
                    rango_actual: dashStats.rango_actual || 'Genin (Iniciado)',
                    puntaje_total: puntajeIA,
                    ejercicios_completados: misionesCompletas,
                    efectividad: efectividadReal // 👈 Ahora sí coincidirá
                });

                if (resUser.data?.foto_perfil) {
                    const urlCompleta = `${import.meta.env.VITE_API_URL}${resUser.data.foto_perfil}`;
                    setFotoPerfil(urlCompleta);
                    localStorage.setItem('user_avatar', urlCompleta);
                } else if (localStorage.getItem('user_avatar')) {
                    setFotoPerfil(localStorage.getItem('user_avatar'));
                }

                setNotificaciones(Array.isArray(resNotif.data) ? resNotif.data : []);

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
            const res = await api.post('/estudiante/perfil/avatar', formData);
            const nuevaUrl = `${import.meta.env.VITE_API_URL}${res.data.url}`;

            setFotoPerfil(nuevaUrl);
            localStorage.setItem('user_avatar', nuevaUrl);
            alert("¡Sello de identidad actualizado!");
        } catch (err) {
            console.error(err);
            alert("Error al actualizar la imagen en el servidor.");
        } finally {
            setSubiendoFoto(false);
        }
    };

    const marcarLeida = async (id) => {
        try {
            await api.put(`/estudiante/notificaciones/${id}/leida`);
            setNotificaciones(notificaciones.map(n => n.id_notificacion === id ? { ...n, leida: 1 } : n));
        } catch (err) { console.error("Error al marcar como leída:", err); }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#05070A] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-shinobi-gold border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    const nombre = datos?.nombre_completo || 'Ninja';
    const email = datos?.correo || 'correo@academia.edu';

    return (
        <div className="min-h-screen bg-[#05070A] p-4 md:p-10 flex flex-col items-center">

            <button
                onClick={() => navigate('/estudiante/dashboard')}
                className="self-start mb-6 text-slate-500 hover:text-shinobi-gold transition-all text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2"
            >
                ← Volver al Dojo
            </button>

            <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* COLUMNA IZQUIERDA: PERFIL DINÁMICO */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#f4f1e1] p-8 rounded-sm shadow-2xl border-t-8 border-shinobi-gold text-center relative overflow-hidden">
                        <div className="relative group mx-auto w-32 h-32 mb-6">
                            <div
                                className="w-full h-full bg-shinobi-dark rounded-2xl flex items-center justify-center border-4 border-shinobi-gold shadow-xl overflow-hidden relative cursor-pointer"
                                onClick={() => fileInputRef.current.click()}
                                style={{ backgroundColor: !fotoPerfil ? generarColorAvatar(nombre) : 'transparent' }}
                            >
                                {fotoPerfil ? (
                                    <img src={fotoPerfil} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-6xl text-white font-scholar">{nombre.charAt(0)}</span>
                                )}

                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[10px] text-white font-bold uppercase tracking-widest text-center px-2">Cambiar Sello</span>
                                </div>
                            </div>
                            {subiendoFoto && <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center"><div className="w-5 h-5 border-2 border-shinobi-gold border-t-transparent rounded-full animate-spin"></div></div>}
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleSubirFoto} />
                        </div>

                        <h3 className="text-2xl font-scholar text-shinobi-dark leading-tight">{nombre}</h3>
                        <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">{email}</p>

                        <div className="mt-4 px-3 py-1 bg-shinobi-dark text-shinobi-gold text-[9px] font-black uppercase rounded-full inline-block">
                            Rango: {datos.rango_actual}
                        </div>
                    </div>

                    <div className="bg-[#0E121C] border border-white/5 p-6 rounded-2xl">
                        <h4 className="text-[10px] text-slate-500 uppercase font-black mb-4 tracking-widest">Progreso de Chakra</h4>
                        <div className="flex justify-between items-center text-white mb-2">
                            <span className="text-xs">Efectividad</span>
                            <span className="text-shinobi-gold font-bold">{datos.efectividad}%</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${datos.efectividad}%` }} className="h-full bg-shinobi-gold" />
                        </div>
                        <div className="mt-4 flex justify-between">
                            <div className="text-center">
                                <p className="text-xl text-white font-scholar">{datos.puntaje_total}</p>
                                <p className="text-[8px] text-slate-500 uppercase font-bold">XP TOTAL</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xl text-white font-scholar">{datos.ejercicios_completados}</p>
                                <p className="text-[8px] text-slate-500 uppercase font-bold">MISIONES</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLUMNA DERECHA: NOTIFICACIONES Y SEGURIDAD */}
                <div className="lg:col-span-2 space-y-6">

                    <div className="bg-[#0E121C] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                        <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                            <h4 className="text-xs font-scholar text-white uppercase tracking-widest">Buzón de Alertas</h4>
                            <span className="bg-shinobi-gold text-black text-[9px] px-2 py-0.5 rounded-full font-bold">
                                {notificaciones.filter(n => !n.leida).length} NUEVAS
                            </span>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                            {notificaciones.length > 0 ? notificaciones.map((n) => (
                                <div
                                    key={n.id_notificacion}
                                    onClick={() => marcarLeida(n.id_notificacion)}
                                    className={`p-4 border-b border-white/5 flex items-start gap-4 hover:bg-white/5 transition-colors cursor-pointer ${!n.leida ? 'border-l-4 border-l-shinobi-gold bg-shinobi-gold/5' : ''}`}
                                >
                                    <div className={`w-2 h-2 mt-1.5 rounded-full ${!n.leida ? 'bg-shinobi-gold animate-pulse' : 'bg-slate-700'}`}></div>
                                    <div className="flex-1">
                                        <p className={`text-sm ${!n.leida ? 'text-white font-bold' : 'text-slate-400'}`}>{n.mensaje}</p>
                                        <span className="text-[10px] text-slate-600 uppercase font-mono">{new Date(n.fecha_creacion).toLocaleString()}</span>
                                    </div>
                                    {!n.leida && <span className="text-[8px] text-shinobi-gold font-bold uppercase">Nueva</span>}
                                </div>
                            )) : (
                                <p className="p-10 text-center text-slate-600 italic text-sm">No hay mensajes en tu pergamino.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-[#0E121C] border border-white/5 p-8 rounded-2xl space-y-6">
                        <h4 className="text-xs font-scholar text-white uppercase tracking-widest">Ajustes de Seguridad</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <input type="password" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-shinobi-gold outline-none" placeholder="Nueva Contraseña" />
                            <input type="password" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-shinobi-gold outline-none" placeholder="Confirmar Sello" />
                        </div>
                        <button className="w-full bg-shinobi-gold text-black py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-lg">
                            Actualizar Registro Ninja
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default PerfilEstudiante;
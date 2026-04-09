import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';

const CampanaNotificaciones = () => {
    const navigate = useNavigate();
    const [notificaciones, setNotificaciones] = useState([]);
    const [abierto, setAbierto] = useState(false);
    const menuRef = useRef(null);

    // 1. Cargar las notificaciones al inicio
    const cargarNotificaciones = async () => {
        try {
            const res = await api.get('/api/estudiante/notificaciones');
            // 🛡️ ESCUDO: Si por alguna razón el backend no manda un array, forzamos uno vacío []
            setNotificaciones(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Error al cargar mensajes del cuervo:", error);
            setNotificaciones([]); // Previene el error fatal
        }
    };

    useEffect(() => {
        cargarNotificaciones();
        // Opcional: Recargar cada 1 minuto (60000 ms) para notificaciones en vivo
        const intervalo = setInterval(cargarNotificaciones, 60000);
        return () => clearInterval(intervalo);
    }, []);

    // 2. Cerrar el menú si se hace clic afuera
    useEffect(() => {
        const handleClickFuera = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setAbierto(false);
            }
        };
        document.addEventListener('mousedown', handleClickFuera);
        return () => document.removeEventListener('mousedown', handleClickFuera);
    }, []);

    // 3. Marcar una notificación como leída
    const marcarComoLeida = async (id, ruta_redireccion = null) => {
        try {
            await api.put(`/api/estudiante/notificaciones/${id}/leer`);
            // Actualizar el estado local para que desaparezca el punto rojo
            setNotificaciones(notificaciones.map(n =>
                n.id_notificacion === id ? { ...n, leida: 1 } : n
            ));

            // Si la notificación requiere ir a algún lado (ej. el foro)
            if (ruta_redireccion) {
                setAbierto(false);
                navigate(ruta_redireccion);
            }
        } catch (error) {
            console.error("Error al marcar como leída", error);
        }
    };

    const noLeidas = notificaciones.filter(n => n.leida === 0 || n.leida === false).length;

    return (
        <div className="relative z-50" ref={menuRef}>
            {/* 🚩 BOTÓN DE LA CAMPANA */}
            <button
                onClick={() => setAbierto(!abierto)}
                className="relative p-2 rounded-full hover:bg-white/5 transition-all text-slate-400 hover:text-shinobi-gold focus:outline-none"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>

                {/* Globo rojo de notificaciones */}
                {noLeidas > 0 && (
                    <motion.span
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute top-1 right-1 w-4 h-4 bg-rose-500 border-2 border-[#05070A] rounded-full text-[8px] font-bold text-white flex items-center justify-center shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                    >
                        {noLeidas > 9 ? '9+' : noLeidas}
                    </motion.span>
                )}
            </button>

            {/* 🚩 MENÚ DESPLEGABLE */}
            <AnimatePresence>
                {abierto && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-3 w-80 bg-[#0E121C]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
                    >
                        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                            <h3 className="text-white font-scholar tracking-widest uppercase text-xs">Mensajes de la Aldea</h3>
                            {noLeidas > 0 && (
                                <span className="text-[9px] text-shinobi-gold font-bold bg-shinobi-gold/10 px-2 py-1 rounded-full uppercase tracking-wider">
                                    {noLeidas} Nuevas
                                </span>
                            )}
                        </div>

                        <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-shinobi-gold/30 scrollbar-track-transparent">
                            {notificaciones.length === 0 ? (
                                <div className="p-8 text-center flex flex-col items-center">
                                    <span className="text-3xl mb-2 opacity-50">📭</span>
                                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Sin novedades</p>
                                </div>
                            ) : (
                                notificaciones.map((notif) => (
                                    <div
                                        key={notif.id_notificacion}
                                        onClick={() => marcarComoLeida(notif.id_notificacion, notif.ruta)} 
                                        className={`p-4 border-b border-white/5 cursor-pointer transition-colors flex gap-4 items-start
            ${notif.leida ? 'opacity-60 hover:bg-white/5' : 'bg-shinobi-gold/5 hover:bg-shinobi-gold/10'}`}
                                    >
                                        <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${notif.leida ? 'bg-transparent' : 'bg-shinobi-gold shadow-[0_0_8px_rgba(197,160,89,0.8)]'}`}></div>
                                        <div>
                                            <p className={`text-sm leading-tight ${notif.leida ? 'text-slate-400' : 'text-white font-bold'}`}>
                                                {notif.mensaje}
                                            </p>
                                            <p className="text-[9px] text-slate-500 mt-2 uppercase font-medium tracking-wider">
                                                {new Date(notif.fecha_creacion).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CampanaNotificaciones;
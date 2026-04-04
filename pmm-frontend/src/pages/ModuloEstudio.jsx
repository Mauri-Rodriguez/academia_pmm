import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti'; 
import api from '../api/api';
import AchievementToast from './AchievementToast';
import AscensoModal from './AscensoModal';
import TutorOraculo from '../components/TutorOraculo';

const ModuloEstudio = () => {
    const { id_modulo } = useParams();
    const navigate = useNavigate();

    // --- ESTADOS ---
    const [ejercicios, setEjercicios] = useState([]);
    const [indice, setIndice] = useState(0);
    const [completado, setCompletado] = useState(false);
    const [cargando, setCargando] = useState(true);
    const [bloqueado, setBloqueado] = useState(false);
    const [modoRepaso, setModoRepaso] = useState(false);
    const [modalIA, setModalIA] = useState({ visible: false, explicacion: '' });
    const [logroActivo, setLogroActivo] = useState(null); 
    const [mostrarAscenso, setMostrarAscenso] = useState(false);
    const [datosAscenso, setDatosAscenso] = useState(null);
    const [insigniaNueva, setInsigniaNueva] = useState(null);

    // 🚩 JUTSU DE CELEBRACIÓN: EXPLOSIÓN DORADA
    const dispararConfetiVictoria = () => {
        const duration = 4 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 200 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);

            const particleCount = 50 * (timeLeft / duration);
            // Lado izquierdo (Dorado/Blanco)
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: ['#C5A059', '#FFFFFF'] });
            // Lado derecho (Dorado/Esmeralda)
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: ['#C5A059', '#10B981'] });
        }, 250);
    };

    // --- 1. CARGA INICIAL Y PERSISTENCIA ---
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const resEjercicios = await api.get(`api/estudiante/modulo/${id_modulo}/ejercicios`);
                setEjercicios(resEjercicios.data);

                const resProgreso = await api.get(`/api/estudiante/dashboard`);
                const moduloActual = resProgreso.data.ruta_ia_asignada?.find(m => m.id_modulo === parseInt(id_modulo));

                if (moduloActual && moduloActual.porcentaje_avance === 100) {
                    setCompletado(true);
                } else if (moduloActual && moduloActual.porcentaje_avance > 0) {
                    const indiceGuardado = Math.floor((moduloActual.porcentaje_avance / 100) * resEjercicios.data.length);
                    setIndice(indiceGuardado);
                }
            } catch (err) {
                console.error("Error al recuperar persistencia:", err);
            } finally {
                setCargando(false);
            }
        };
        cargarDatos();
    }, [id_modulo]);

    // --- 2. HELPERS ---
    const dispararLogro = (titulo, descripcion) => {
        setLogroActivo({ titulo, descripcion });
        setTimeout(() => setLogroActivo(null), 5000); 
    };

    const iniciarRepaso = () => {
        setIndice(0);
        setCompletado(false);
        setModoRepaso(true); 
    };

    const manejarFlujoFinal = (data) => {
        if (data.ascendio) {
            setDatosAscenso(data.detallesAscenso);
            dispararConfetiVictoria();
            setMostrarAscenso(true);
        } else {
            setCompletado(true);
        }
    };

    const procesarFinalizacionOficial = async () => {
        try {
            const res = await api.post('/api/estudiante/finalizar', { 
                id_modulo, 
                puntaje_final: ejercicios.length 
            });

            // 🚩 DETECTOR DE INSIGNIAS: Si el backend envía una insignia nueva
            if (res.data.insignia) {
                setInsigniaNueva(res.data.insignia);
                dispararConfetiVictoria(); 
                // Pausa dramática para que el usuario admire su logro
                setTimeout(() => {
                    setInsigniaNueva(null);
                    manejarFlujoFinal(res.data);
                }, 4500);
            } else {
                manejarFlujoFinal(res.data);
            }
        } catch (err) {
            console.error("Error al procesar méritos finales:", err);
            setCompletado(true);
        }
    };

    // --- 3. LÓGICA DE RESPUESTA ---
    const responder = async (itemSeleccionado) => {
        if (bloqueado) return;
        const ejActual = ejercicios[indice];
        
        const letraUsuario = itemSeleccionado.letra.toLowerCase().trim();
        const letraCorrectaDB = String(ejActual.respuesta_correcta).toLowerCase().replace('opcion_', '').trim();

        setBloqueado(true);

        if (letraUsuario === letraCorrectaDB) {
            const nuevoIndice = indice + 1;
            const esFinDeModulo = nuevoIndice === ejercicios.length;
            
            if (!modoRepaso && !esFinDeModulo) {
                const nuevoPorcentaje = Math.round((nuevoIndice / ejercicios.length) * 100);
                try {
                    await api.post('/api/estudiante/actualizar-progreso', { id_modulo, porcentaje: nuevoPorcentaje });
                } catch (err) {
                    console.error("Error guardando progreso:", err);
                }
            }

            if (esFinDeModulo) {
                dispararLogro(modoRepaso ? "SABIDURÍA REAFIRMADA" : "PERGAMINO DOMINADO", "Misión completada con éxito");
                setTimeout(() => procesarFinalizacionOficial(), 1500);
            } else {
                if (nuevoIndice === 5 && !modoRepaso) {
                    dispararLogro("RACHA NINJA", "¡5 respuestas correctas seguidas!");
                }
                setIndice(nuevoIndice);
            }
            setBloqueado(false);
        } else {
            try {
                const res = await api.post('/api/estudiante/registrar-fallo', {
                    id_pregunta: ejActual.id_ejercicio,
                    respuesta_dada: itemSeleccionado.campo 
                });
                setModalIA({ visible: true, explicacion: res.data.explicacion_ia || "Analiza el sello, ninja." });
            } catch (err) {
                setModalIA({ visible: true, explicacion: "El oráculo está meditando. Revisa tu lógica." });
            } finally {
                setBloqueado(false);
            }
        }
    };

    if (cargando) return (
        <div className="min-h-screen bg-[#05070A] flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-shinobi-gold/20 border-t-shinobi-gold rounded-full animate-spin mb-6"></div>
            <div className="text-shinobi-gold font-scholar animate-pulse tracking-[0.5em] text-[10px] uppercase">Descifrando Pergamino...</div>
        </div>
    );

    if (completado) return (
        <div className="min-h-screen bg-[#05070A] flex flex-col items-center justify-center text-center p-6">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-[#0E121C] border border-emerald-500/20 p-12 rounded-[3rem] shadow-2xl">
                <span className="text-6xl mb-8 block animate-bounce">🏆</span>
                <h1 className="text-4xl font-scholar text-emerald-500 tracking-tighter uppercase mb-4">Misión Cumplida</h1>
                <p className="text-slate-400 text-sm font-modern italic mb-10 leading-relaxed">
                    Has dominado los sellos de este pergamino. ¿Regresarás a la aldea o seguirás meditando?
                </p>
                <div className="space-y-4">
                    <button onClick={() => { navigate('/estudiante/dashboard'); window.location.reload(); }} className="w-full bg-emerald-600 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all active:scale-95">
                        Volver a la Aldea
                    </button>
                    <button onClick={iniciarRepaso} className="w-full bg-white/5 text-slate-300 border border-white/10 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:bg-white/10">
                        📜 Meditar de nuevo
                    </button>
                </div>
            </motion.div>
        </div>
    );

    const ejActual = ejercicios[indice];
    const progresoPorcentaje = Math.round((indice / ejercicios.length) * 100);

    return (
        <div className="min-h-screen bg-[#05070A] text-slate-200 relative overflow-hidden pb-20 selection:bg-shinobi-gold/30">
            
            {/* 🚩 OVERLAY ÉPICO: INSIGNIA OBTENIDA (RENDERIZANDO EMOJI) */}
            <AnimatePresence>
                {insigniaNueva && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-2xl">
                        <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} className="text-center">
                            <div className="relative inline-block mb-10">
                                {/* Aura de poder detrás del emoji */}
                                <div className="absolute -inset-10 bg-shinobi-gold/20 blur-3xl rounded-full animate-pulse"></div>
                                {/* El Emoji en lugar de la imagen */}
                                <span className="text-[120px] md:text-[180px] relative z-10 drop-shadow-[0_0_50px_rgba(197,160,89,0.6)] block leading-none">
                                    {insigniaNueva.url_imagen || '🏅'}
                                </span>
                            </div>
                            <h2 className="text-4xl md:text-6xl font-scholar text-white tracking-tighter uppercase mb-2">¡Sello de Honor!</h2>
                            <p className="text-shinobi-gold font-black tracking-[0.5em] text-sm md:text-xl uppercase">{insigniaNueva.nombre}</p>
                            <p className="text-slate-500 font-mono text-[10px] mt-4 uppercase tracking-widest">
                                Insignia añadida a tu cofre de méritos
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODAL DE ASCENSO NINJA */}
            {mostrarAscenso && (
                <AscensoModal datos={datosAscenso} onClose={() => { setMostrarAscenso(false); window.location.href = '/estudiante/dashboard'; }} />
            )}

            <nav className="sticky top-0 z-50 bg-[#0E121C]/90 backdrop-blur-md border-b border-white/5 px-6 py-4 shadow-2xl mb-8 md:mb-16">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/estudiante/dashboard')} className="p-2.5 rounded-full bg-white/5 hover:bg-shinobi-gold hover:text-black text-slate-400 border border-white/10 transition-all group">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <h1 className="text-sm md:text-xl font-scholar text-white tracking-widest uppercase">Aldea <span className="text-shinobi-gold">Digital</span></h1>
                    </div>
                </div>
            </nav>

            <AnimatePresence>
                {logroActivo && <AchievementToast titulo={logroActivo.titulo} descripcion={logroActivo.descripcion} />}
            </AnimatePresence>

            <div className="max-w-3xl mx-auto px-6">
                <div className="mb-10 text-center">
                    <div className="flex justify-between items-end mb-4">
                        <div className="text-left">
                            <h2 className="text-xs font-scholar text-slate-500 tracking-[0.4em] uppercase">Misión en Curso</h2>
                            <p className="text-[10px] text-slate-600 uppercase tracking-widest">{indice + 1} / {ejercicios.length} Sellos</p>
                        </div>
                        <span className="text-shinobi-gold font-scholar text-4xl font-bold">{progresoPorcentaje}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${progresoPorcentaje}%` }} className="h-full bg-shinobi-gold shadow-[0_0_20px_rgba(197,160,89,0.4)]" />
                    </div>
                </div>

                <motion.div key={indice} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0E121C] border border-white/5 p-8 md:p-14 rounded-[3rem] shadow-2xl relative">
                    <div className="mb-14">
                        <h3 className="text-2xl md:text-4xl text-white font-modern italic leading-snug text-center">"{ejActual?.pregunta}"</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {['A', 'B', 'C', 'D'].map((letra) => {
                            const campo = `opcion_${letra.toLowerCase()}`;
                            return (
                                <button key={letra} onClick={() => responder({ letra, campo })} disabled={bloqueado} className="group w-full flex items-center p-6 bg-[#121620] border border-white/5 rounded-2xl hover:border-shinobi-gold/40 hover:bg-shinobi-gold/5 transition-all active:scale-[0.98]">
                                    <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center mr-6 group-hover:bg-shinobi-gold transition-all">
                                        <span className="text-shinobi-gold font-scholar font-bold text-xl group-hover:text-black">{letra}</span>
                                    </div>
                                    <span className="text-slate-300 text-sm md:text-lg group-hover:text-white transition-colors text-left flex-1">{ejActual?.[campo]}</span>
                                </button>
                            );
                        })}
                    </div>
                </motion.div>
            </div>

            <AnimatePresence>
                {modalIA.visible && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[#0E121C] border border-rose-500/30 p-10 rounded-[3rem] max-w-lg w-full text-center">
                            <span className="text-rose-500 text-4xl block mb-6 animate-pulse">👁️‍🗨️</span>
                            <p className="text-slate-300 italic mb-10 leading-relaxed font-modern">"{modalIA.explicacion}"</p>
                            <button onClick={() => setModalIA({ visible: false, explicacion: '' })} className="w-full bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-500/30 p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">Asimilar y Continuar</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <TutorOraculo idPreguntaActual={ejActual?.id_ejercicio} />
        </div>
    );
};

export default ModuloEstudio;
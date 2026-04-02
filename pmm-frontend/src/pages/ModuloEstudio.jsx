import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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

    // --- 1. CARGA INICIAL Y PERSISTENCIA ---
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const resEjercicios = await api.get(`/estudiante/modulo/${id_modulo}/ejercicios`);
                setEjercicios(resEjercicios.data);

                const resProgreso = await api.get(`/estudiante/dashboard`);
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

    // --- 2. HELPERS (DECLARADOS ARRIBA PARA EVITAR REFERENCE_ERROR) ---
    const dispararLogro = (titulo, descripcion) => {
        setLogroActivo({ titulo, descripcion });
        setTimeout(() => setLogroActivo(null), 5000); 
    };

    const iniciarRepaso = () => {
        setIndice(0);
        setCompletado(false);
        setModoRepaso(true); 
    };

    const procesarFinalizacionOficial = async () => {
        try {
            // Sincronización con el backend: Evalúa insignias y rangos
            const res = await api.post('/estudiante/finalizar', { 
                id_modulo, 
                puntaje_final: ejercicios.length 
            });

            // Usamos 'ascendio' para coincidir con la respuesta del controlador blindado
            if (res.data.ascendio) {
                setDatosAscenso(res.data.detallesAscenso);
                setMostrarAscenso(true);
            } else {
                setCompletado(true);
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
            
            // 🚩 BLINDAJE: Solo actualizar progreso si NO es el final.
            // El final (100%) es responsabilidad de 'procesarFinalizacionOficial'.
            if (!modoRepaso && !esFinDeModulo) {
                const nuevoPorcentaje = Math.round((nuevoIndice / ejercicios.length) * 100);
                try {
                    await api.post('/estudiante/actualizar-progreso', { id_modulo, porcentaje: nuevoPorcentaje });
                } catch (err) {
                    console.error("Error guardando progreso:", err);
                }
            }

            if (esFinDeModulo) {
                dispararLogro(modoRepaso ? "SABIDURÍA REAFIRMADA" : "PERGAMINO DOMINADO", "Misión completada con éxito");
                
                if (!modoRepaso) {
                    setTimeout(() => procesarFinalizacionOficial(), 1500);
                } else {
                    setTimeout(() => setCompletado(true), 1500);
                }
            } else {
                if (nuevoIndice === 5 && !modoRepaso) {
                    dispararLogro("RACHA NINJA", "¡5 respuestas correctas seguidas!");
                }
                setIndice(nuevoIndice);
            }
            setBloqueado(false);
        } else {
            try {
                const res = await api.post('/estudiante/registrar-fallo', {
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

    // --- 4. RENDERIZADO DE CARGA ---
    if (cargando) return (
        <div className="min-h-screen bg-[#05070A] flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-shinobi-gold/20 border-t-shinobi-gold rounded-full animate-spin mb-6"></div>
            <div className="text-shinobi-gold font-scholar animate-pulse tracking-[0.5em] text-[10px] uppercase">Descifrando Pergamino...</div>
        </div>
    );

    // --- 5. RENDERIZADO DE FIN DE MÓDULO ---
    if (completado) return (
        <div className="min-h-screen bg-[#05070A] flex flex-col items-center justify-center text-center p-6">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-[#0E121C] border border-emerald-500/20 p-12 rounded-[3rem] shadow-2xl">
                <span className="text-6xl mb-8 block animate-bounce">🏆</span>
                <h1 className="text-4xl font-scholar text-emerald-500 tracking-tighter uppercase mb-4">Misión Cumplida</h1>
                <p className="text-slate-400 text-sm font-modern italic mb-10 leading-relaxed">
                    Has dominado los sellos de este pergamino. ¿Deseas volver a la aldea o meditar nuevamente?
                </p>
                <div className="space-y-4">
                    <button 
                        onClick={() => {
                            navigate('/estudiante/dashboard');
                            window.location.reload(); // Forzamos refresco para ver el 100%
                        }}
                        className="w-full bg-emerald-600 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg shadow-emerald-500/10"
                    >
                        Volver a la Aldea
                    </button>
                    <button 
                        onClick={iniciarRepaso}
                        className="w-full bg-white/5 text-slate-300 border border-white/10 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:bg-white/10 hover:text-shinobi-gold"
                    >
                        📜 Meditar de nuevo (Repasar)
                    </button>
                </div>
            </motion.div>
        </div>
    );

    if (ejercicios.length === 0) return (
        <div className="min-h-screen bg-[#05070A] flex items-center justify-center text-slate-500 font-scholar text-sm tracking-widest uppercase">
            No se encontraron sellos en este pergamino.
        </div>
    );

    const ejActual = ejercicios[indice];
    const progresoPorcentaje = Math.round((indice / ejercicios.length) * 100);

    return (
        <div className="min-h-screen bg-[#05070A] text-slate-200 relative overflow-hidden pb-20 selection:bg-shinobi-gold/30">
            
            {/* MODAL DE ASCENSO NINJA */}
            {mostrarAscenso && (
                <AscensoModal 
                    datos={datosAscenso} 
                    onClose={() => {
                        setMostrarAscenso(false);
                        navigate('/estudiante/dashboard');
                        window.location.href = '/estudiante/dashboard'; // Sincronización total tras ascenso
                    }} 
                />
            )}

            <nav className="sticky top-0 z-50 bg-[#0E121C]/90 backdrop-blur-md border-b border-white/5 px-6 py-4 shadow-2xl mb-8 md:mb-16">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/estudiante/dashboard')} className="p-2.5 rounded-full bg-white/5 hover:bg-shinobi-gold hover:text-black text-slate-400 transition-all border border-white/10 group">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <h1 className="text-sm md:text-xl font-scholar text-white tracking-widest uppercase">Aldea <span className="text-shinobi-gold">Digital</span></h1>
                    </div>
                    <div className="bg-shinobi-gold/10 border border-shinobi-gold/20 px-4 py-1.5 rounded-full flex items-center gap-2">
                        <span className="text-shinobi-gold font-black text-[9px] uppercase tracking-[0.2em]">Misión Activa</span>
                        <div className="w-2 h-2 rounded-full bg-shinobi-gold animate-pulse"></div>
                    </div>
                </div>
            </nav>

            <AnimatePresence>
                {logroActivo && <AchievementToast titulo={logroActivo.titulo} descripcion={logroActivo.descripcion} />}
            </AnimatePresence>

            <div className="max-w-3xl mx-auto px-6">
                <div className="mb-10">
                    <div className="flex justify-between items-end mb-4">
                        <div className="space-y-1">
                            <h2 className="text-sm font-scholar text-slate-400 tracking-[0.4em] uppercase">Entrenamiento Dojo</h2>
                            <p className="text-[10px] text-slate-600 uppercase tracking-widest">Sello {indice + 1} de {ejercicios.length}</p>
                        </div>
                        <span className="text-shinobi-gold font-scholar text-3xl font-bold">{progresoPorcentaje}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${progresoPorcentaje}%` }} className="h-full bg-shinobi-gold shadow-[0_0_15px_rgba(197,160,89,0.5)]" />
                    </div>
                </div>

                <motion.div key={indice} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }} className="bg-[#0E121C] border border-white/5 p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-shinobi-gold to-transparent opacity-50"></div>
                    
                    {/* ENCABEZADO DE LA PREGUNTA */}
                    <div className="mb-12">
                        <h3 className="text-2xl md:text-3xl text-white font-modern italic leading-relaxed text-center mb-6">"{ejActual.pregunta}"</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {[
                            { letra: 'A', campo: 'opcion_a' },
                            { letra: 'B', campo: 'opcion_b' },
                            { letra: 'C', campo: 'opcion_c' },
                            { letra: 'D', campo: 'opcion_d' }
                        ].map((item) => (
                            <button key={item.letra} onClick={() => responder(item)} disabled={bloqueado} className="group w-full flex items-center p-5 bg-[#121620] border border-white/5 rounded-2xl hover:border-shinobi-gold/50 hover:bg-shinobi-gold/5 transition-all disabled:opacity-50">
                                <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center mr-6 group-hover:bg-shinobi-gold transition-colors">
                                    <span className="text-shinobi-gold font-scholar font-bold text-lg group-hover:text-black">{item.letra}</span>
                                </div>
                                <span className="text-slate-300 font-modern text-sm md:text-base group-hover:text-white transition-colors text-left flex-1">{ejActual[item.campo]}</span>
                            </button>
                        ))}
                    </div>
                </motion.div>
            </div>

            <AnimatePresence>
                {modalIA.visible && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0" onClick={() => setModalIA({ visible: false, explicacion: '' })}/>
                        <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} className="bg-gradient-to-br from-[#121620] to-[#0E121C] border border-rose-500/30 p-8 md:p-12 rounded-[3rem] max-w-lg w-full relative z-10">
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#05070A] border border-rose-500/50 px-6 py-2 rounded-full flex items-center gap-3">
                                <span className="text-rose-500 animate-pulse text-xl">👁️‍🗨️</span>
                                <span className="text-[10px] text-rose-500 font-scholar uppercase tracking-[0.3em]">Visión del Oráculo</span>
                            </div>
                            <p className="text-slate-300 italic mb-10 mt-4 leading-relaxed font-modern text-justify text-sm md:text-base">"{modalIA.explicacion}"</p>
                            <button onClick={() => setModalIA({ visible: false, explicacion: '' })} className="w-full bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-500/30 p-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all">Asimilar Conocimiento</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 🚩 BOTÓN FLOTANTE DEL TUTOR IA (ORÁCULO) */}
            <TutorOraculo idPreguntaActual={ejActual?.id_ejercicio} />
            
        </div>
    );
};

export default ModuloEstudio;
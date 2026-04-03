import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/api';

const TutorOraculo = ({ idPreguntaActual }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const [historial, setHistorial] = useState([
        { rol: 'ia', texto: 'Saludos, joven ninja. ¿En qué parte de este sello matemático necesitas mi guía?' }
    ]);
    const [cargando, setLoading] = useState(false);
    const chatRef = useRef(null);

    // Auto-scroll al último mensaje
    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [historial, cargando]);

    const enviarMensaje = async (e) => {
        e.preventDefault();
        if (!mensaje.trim() || cargando) return;

        const textoUsuario = mensaje;
        setMensaje('');
        setHistorial(prev => [...prev, { rol: 'usuario', texto: textoUsuario }]);
        setLoading(true);

        try {
            const res = await api.post('/api/estudiante/tutor-ia', {
                id_pregunta: idPreguntaActual,
                mensaje_estudiante: textoUsuario
            });
            setHistorial(prev => [...prev, { rol: 'ia', texto: res.data.respuesta }]);
        } catch (error) {
            setHistorial(prev => [...prev, { 
                rol: 'ia', 
                texto: error.response?.data?.respuesta || 'Una interferencia bloqueó mi mensaje. Intenta de nuevo.' 
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 font-modern">
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="absolute bottom-20 right-0 w-80 md:w-96 bg-[#0B0F19] border border-shinobi-gold/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
                        style={{ height: '28rem' }}
                    >
                        {/* Header del Chat */}
                        <div className="bg-gradient-to-r from-slate-900 to-[#0B0F19] border-b border-shinobi-gold/20 p-4 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-shinobi-gold/10 border border-shinobi-gold/50 flex items-center justify-center text-lg animate-pulse">
                                    🤖
                                </div>
                                <div>
                                    <h3 className="font-scholar text-shinobi-gold text-xs uppercase tracking-widest">Oráculo IA</h3>
                                    <p className="text-[9px] text-emerald-400 font-bold tracking-widest uppercase">Conexión Activa</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                ✖
                            </button>
                        </div>

                        {/* Área de Mensajes */}
                        <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-shinobi-gold/20 scrollbar-track-transparent">
                            {historial.map((msg, i) => (
                                <div key={i} className={`flex ${msg.rol === 'usuario' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                                        msg.rol === 'usuario' 
                                            ? 'bg-shinobi-gold text-black rounded-tr-sm font-medium' 
                                            : 'bg-slate-800/80 border border-white/5 text-slate-300 rounded-tl-sm'
                                    }`}>
                                        {msg.texto}
                                    </div>
                                </div>
                            ))}
                            {cargando && (
                                <div className="flex justify-start">
                                    <div className="bg-slate-800/80 border border-white/5 p-3 rounded-2xl rounded-tl-sm flex gap-2">
                                        <span className="w-2 h-2 bg-shinobi-gold rounded-full animate-bounce"></span>
                                        <span className="w-2 h-2 bg-shinobi-gold rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                        <span className="w-2 h-2 bg-shinobi-gold rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input de Mensaje */}
                        <form onSubmit={enviarMensaje} className="p-3 border-t border-white/5 bg-slate-900/50">
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={mensaje}
                                    onChange={(e) => setMensaje(e.target.value)}
                                    placeholder="Pregunta tu duda al maestro..."
                                    className="w-full bg-[#05070A] border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-shinobi-gold/50 transition-colors placeholder:text-slate-600"
                                    disabled={cargando}
                                />
                                <button 
                                    type="submit" 
                                    disabled={cargando || !mensaje.trim()}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-shinobi-gold text-black rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    ➤
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Botón Flotante */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full shadow-[0_0_20px_rgba(197,160,89,0.3)] flex items-center justify-center text-2xl border-2 transition-colors ${
                    isOpen ? 'bg-slate-900 border-shinobi-gold text-shinobi-gold' : 'bg-shinobi-gold border-shinobi-gold text-black hover:bg-white hover:border-white'
                }`}
            >
                {isOpen ? '💬' : '🤖'}
            </motion.button>
        </div>
    );
};

export default TutorOraculo;
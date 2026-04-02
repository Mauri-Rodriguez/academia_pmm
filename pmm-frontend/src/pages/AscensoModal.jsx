import React from 'react';
import { motion } from 'framer-motion';

const AscensoModal = ({ datos, onClose }) => {
    // Si por algún error no llegan datos, no rompemos el render
    if (!datos) return null;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            {/* Capa de fondo con partículas de "Chakra" */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-shinobi-gold/5 blur-[120px] rounded-full animate-pulse"></div>
            </div>

            <motion.div 
                initial={{ scale: 0.8, opacity: 0, rotateY: 90 }}
                animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative bg-[#0A0A0A] border-2 border-shinobi-gold/30 p-8 md:p-16 rounded-[4rem] max-w-xl w-full text-center shadow-[0_0_150px_rgba(197,160,89,0.15)] overflow-hidden"
            >
                {/* Sello decorativo de fondo */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20rem] text-white/[0.02] font-black pointer-events-none select-none">
                    {datos.nuevoNivel.charAt(0)}
                </div>

                {/* Encabezado del HUD */}
                <div className="mb-10">
                    <motion.div 
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-center justify-center gap-3 mb-4"
                    >
                        <div className="h-px w-12 bg-shinobi-gold/40"></div>
                        <span className="font-scholar text-shinobi-gold text-[10px] tracking-[0.5em] uppercase">Pergamino de Rango Actualizado</span>
                        <div className="h-px w-12 bg-shinobi-gold/40"></div>
                    </motion.div>

                    {/* Icono de Rango Dinámico */}
                    <motion.div 
                        animate={{ 
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0]
                        }}
                        transition={{ repeat: Infinity, duration: 4 }}
                        className="text-8xl mb-6 drop-shadow-[0_0_30px_rgba(197,160,89,0.5)]"
                    >
                        {datos.nuevoNivel.includes('Chunin') ? '🏮' : 
                         datos.nuevoNivel.includes('Jonin') ? '⚔️' : '🔥'}
                    </motion.div>
                </div>

                {/* Título de Ascenso */}
                <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tighter uppercase leading-none">
                    NIVEL <br/> 
                    <span className="text-shinobi-gold italic underline decoration-white/10 underline-offset-8">
                        {datos.nuevoNivel}
                    </span>
                </h1>

                <p className="text-slate-400 font-modern italic text-base md:text-lg mb-12 leading-relaxed px-4">
                    "{datos.mensaje}"
                </p>

                {/* Botón de Aceptación */}
                <motion.button 
                    whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(197,160,89,0.4)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="group relative w-full bg-shinobi-gold text-black font-black py-5 rounded-3xl tracking-[0.4em] uppercase text-xs transition-all overflow-hidden"
                >
                    <span className="relative z-10">Aceptar mi Destino</span>
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                </motion.button>

                {/* Metadata del HUD */}
                <div className="mt-8 flex justify-between items-center text-[8px] text-slate-700 font-scholar tracking-widest uppercase">
                    <span>SISTEMA_PMM_V2.6</span>
                    <div className="flex gap-2">
                        <div className="w-1 h-1 bg-shinobi-gold rounded-full animate-ping"></div>
                        <span>CONEXIÓN_ESTABLE</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AscensoModal;
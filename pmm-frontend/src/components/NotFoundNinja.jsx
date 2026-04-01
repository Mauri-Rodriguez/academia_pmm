import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFoundNinja = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#05070A] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden selection:bg-shinobi-gold/30">
            {/* Ambientación visual de "ilusión/bosque" */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none"></div>

            <motion.div 
                initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.8 }}
                className="relative z-10"
            >
                <span className="text-8xl md:text-9xl mb-6 block drop-shadow-[0_0_30px_rgba(16,185,129,0.2)] animate-pulse">🌲</span>
                
                <h1 className="text-6xl md:text-8xl font-scholar text-white tracking-tighter uppercase mb-4">
                    Error <span className="text-emerald-500">404</span>
                </h1>
                
                <h2 className="text-xl md:text-2xl font-modern text-shinobi-gold italic mb-8">
                    "Te has perdido en el bosque de las ilusiones..."
                </h2>
                
                <p className="text-slate-400 text-sm md:text-base max-w-md mx-auto mb-12 leading-relaxed">
                    El pergamino que buscas no existe en nuestros registros o ha sido ocultado por un jutsu de alto nivel.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button 
                        onClick={() => navigate(-1)} // Retrocede a la página anterior
                        className="bg-transparent border border-white/10 hover:border-shinobi-gold hover:text-shinobi-gold text-slate-500 px-8 py-3 rounded-full text-xs font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(197,160,89,0)] hover:shadow-[0_0_20px_rgba(197,160,89,0.15)]"
                    >
                        Deshacer Jutsu (Atrás)
                    </button>
                    
                    <button 
                        onClick={() => navigate('/estudiante/dashboard')}
                        className="bg-emerald-600/10 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white text-emerald-500 px-8 py-3 rounded-full text-xs font-black uppercase tracking-[0.2em] transition-all"
                    >
                        Volver a la Aldea
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default NotFoundNinja;
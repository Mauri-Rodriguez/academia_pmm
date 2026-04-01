import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

const AchievementToast = ({ titulo, descripcion }) => {
  
  useEffect(() => {
    // 🚩 EFECTO DE CELEBRACIÓN: Dispara confeti dorado al aparecer
    const dispararConfeti = () => {
      const scalar = 2;
      const triangle = confetti.shapeFromPath({ path: 'M0 10 L5 0 L10 10z' });

      confetti({
        shapes: [triangle],
        particleCount: 40,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#D4AF37', '#F59E0B', '#FFFFFF'], // Colores Ninja/Oro
        scalar
      });
    };

    dispararConfeti();
  }, []);

  return (
    <motion.div
      // Animación tipo Xbox: entra desde abajo, rebota y se queda centrado
      initial={{ y: 100, x: '-50%', opacity: 0 }}
      animate={{ y: -40, x: '-50%', opacity: 1 }}
      exit={{ y: 100, x: '-50%', opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="fixed bottom-0 left-1/2 z-[9999] flex items-center bg-[#0E121C]/95 backdrop-blur-md border-2 border-[#D4AF37]/40 px-6 py-4 rounded-full shadow-[0_0_50px_rgba(212,175,55,0.2)] min-w-[340px] cursor-default select-none"
    >
      {/* Icono del Logro con resplandor */}
      <div className="relative mr-5">
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#F59E0B] flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.5)] border border-white/20">
          <span className="text-2xl filter drop-shadow-md">🏆</span>
        </div>
        {/* Pulso animado de fondo */}
        <div className="absolute inset-0 bg-[#D4AF37] rounded-full animate-ping opacity-20"></div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[#D4AF37] font-black text-[9px] uppercase tracking-[0.4em]">
            Logro Desbloqueado
          </span>
          <div className="h-1 w-1 rounded-full bg-rose-500 animate-pulse"></div>
        </div>
        <h4 className="text-white font-bold text-base tracking-tight">
          {titulo}
        </h4>
        <p className="text-slate-400 text-[11px] font-medium leading-tight opacity-90">
          {descripcion}
        </p>
      </div>

      {/* Decoración Ninja: Shuriken pequeño al final */}
      <div className="ml-auto pl-4 opacity-20 text-white text-xs">
        ✵
      </div>
    </motion.div>
  );
};

export default AchievementToast;
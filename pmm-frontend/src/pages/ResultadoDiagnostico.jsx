import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ResultadoDiagnostico = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const { rango, aciertos } = location.state || { 
        rango: 'Genin (Iniciado)', 
        aciertos: 0 
    };

    const esJonin = rango.includes('Jonin');
    const esChunin = rango.includes('Chunin');

    return (
        <div className="min-h-screen bg-[#05070A] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className={`absolute w-[500px] h-[500px] blur-[120px] opacity-20 rounded-full 
                ${esJonin ? 'bg-purple-600' : esChunin ? 'bg-blue-600' : 'bg-shinobi-gold'}`}>
            </div>

            <div className="max-w-2xl w-full text-center z-10 animate-in fade-in zoom-in duration-1000">
                <span className="text-shinobi-gold font-scholar tracking-[0.5em] uppercase text-xs opacity-60 mb-4 block">
                    Análisis de Chakra Completado
                </span>
                
                <h1 className="text-6xl font-scholar text-white mb-2 tracking-tighter uppercase">
                    Tu Rango es <br />
                    <span className={esJonin ? 'text-purple-500' : esChunin ? 'text-blue-500' : 'text-shinobi-gold'}>
                        {rango}
                    </span>
                </h1>

                <div className="grid grid-cols-2 gap-4 mt-12 mb-12">
                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md">
                        <div className="text-3xl font-scholar text-white">{aciertos} / 13</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-2 font-bold">Aciertos Totales</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md">
                        <div className="text-3xl font-scholar text-white">{Math.round((aciertos/13)*100)}%</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-2 font-bold">Efectividad</div>
                    </div>
                </div>

                <p className="text-slate-400 italic text-sm mb-12 px-10 leading-relaxed">
                    {esJonin 
                        ? "Increíble. Tu dominio de las artes algebraicas es comparable al de un maestro. Los archivos prohibidos están a tu disposición." 
                        : esChunin 
                        ? "Has demostrado ser un guerrero competente. Tu lógica es sólida, pero aún queda camino para alcanzar la maestría."
                        : "Tu camino ninja apenas comienza. Entrena duro en la biblioteca para fortalecer tus fundamentos matemáticos."}
                </p>

                <button 
                    onClick={() => navigate('/estudiante/dashboard')}
                    className="group relative px-12 py-5 bg-shinobi-gold text-black font-black uppercase tracking-[0.3em] text-[11px] rounded-full hover:scale-105 transition-all shadow-[0_0_30px_rgba(212,175,55,0.3)]"
                >
                    Ingresar al Dojo
                    <span className="ml-4 group-hover:translate-x-2 inline-block transition-transform">→</span>
                </button>
            </div>
        </div>
    );
};

export default ResultadoDiagnostico;
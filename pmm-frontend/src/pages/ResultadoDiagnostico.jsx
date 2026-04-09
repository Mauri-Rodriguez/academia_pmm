import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ResultadoDiagnostico = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const [modoRevision, setModoRevision] = useState(false);
    
    const { rango, aciertos, detalle } = location.state || { 
        rango: 'Genin (Iniciado)', 
        aciertos: 0,
        detalle: [] 
    };

    const esJonin = rango.includes('Jonin');
    const esChunin = rango.includes('Chunin');

    const obtenerClaseOpcion = (opcion, pregunta) => {
        const esLaCorrecta = opcion.texto.trim().toLowerCase() === pregunta.respuesta_correcta.trim().toLowerCase() || opcion.clave === pregunta.respuesta_correcta;
        const fueSeleccionada = opcion.texto.trim().toLowerCase() === pregunta.respuesta_usuario.trim().toLowerCase() || opcion.clave === pregunta.respuesta_usuario;

        if (fueSeleccionada && esLaCorrecta) return "bg-green-500/20 border-green-500 text-green-300"; 
        if (fueSeleccionada && !esLaCorrecta) return "bg-red-500/20 border-red-500 text-red-300"; 
        return "bg-white/5 border-white/10 text-slate-400"; 
    };

    if (modoRevision) {
        return (
            <div className="min-h-screen bg-[#05070A] flex flex-col items-center py-10 px-6 relative">
                <div className="w-full max-w-4xl z-10 animate-in fade-in zoom-in duration-500">
                    <button 
                        onClick={() => setModoRevision(false)}
                        className="mb-6 text-shinobi-gold hover:text-white uppercase tracking-widest text-xs font-bold transition-colors flex items-center"
                    >
                        ← Volver a mi Rango
                    </button>
                    
                    <h2 className="text-3xl font-scholar text-white mb-8 tracking-tighter uppercase text-center">
                        Revisión del <span className="text-shinobi-gold">Examen</span>
                    </h2>

                    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-shinobi-gold scrollbar-track-white/5">
                        {detalle && detalle.length > 0 ? (
                            detalle.map((item, index) => (
                                <div key={item.id_pregunta} className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-white font-semibold text-lg">
                                            <span className="text-shinobi-gold mr-2">#{index + 1}</span> 
                                            {item.pregunta}
                                        </h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${item.es_correcta ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {item.es_correcta ? 'Correcto' : 'Incorrecto'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                        {item.opciones.map((opcion, idx) => (
                                            <div key={idx} className={`p-4 rounded-xl border ${obtenerClaseOpcion(opcion, item)} transition-all`}>
                                                <span className="font-bold mr-2 opacity-60 uppercase">{opcion.clave.replace('opcion_', '')})</span>
                                                {opcion.texto}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-slate-400">No hay detalles disponibles.</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#05070A] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className={`absolute w-[500px] h-[500px] blur-[120px] opacity-20 rounded-full 
                ${esJonin ? 'bg-purple-600' : esChunin ? 'bg-blue-600' : 'bg-shinobi-gold'}`}>
            </div>

            <div className="max-w-2xl w-full text-center z-10 animate-in fade-in zoom-in duration-1000">
                <span className="text-shinobi-gold font-scholar tracking-[0.5em] uppercase text-xs opacity-60 mb-4 block">
                    Análisis Completado
                </span>
                
                <h1 className="text-6xl font-scholar text-white mb-2 tracking-tighter uppercase">
                    Tu Nivel es <br />
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
                        ? "Increíble. Tu dominio de las artes algebraicas es comparable al de un maestro. Los archivos avanzados están a tu disposición." 
                        : esChunin 
                        ? "Has demostrado ser un estudiante competente. Tu lógica es sólida, pero aún queda camino para alcanzar la maestría."
                        : "Tu camino académico apenas comienza. Entrena duro en la biblioteca para fortalecer tus fundamentos matemáticos."}
                </p>

                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                    {detalle && detalle.length > 0 && (
                        <button 
                            onClick={() => setModoRevision(true)}
                            className="group relative px-8 py-4 bg-transparent border-2 border-shinobi-gold text-shinobi-gold font-black uppercase tracking-[0.2em] text-[11px] rounded-full hover:bg-shinobi-gold/10 transition-all"
                        >
                            Revisar Diagnóstico
                        </button>
                    )}

                    <button 
                        // 🚩 AQUÍ ENVIAMOS EL STATE PARA ACTIVAR EL ONBOARDING EN EL DASHBOARD
                        onClick={() => navigate('/estudiante/dashboard', { state: { nuevoIngreso: true } })}
                        className="group relative px-12 py-5 bg-shinobi-gold text-black font-black uppercase tracking-[0.3em] text-[11px] rounded-full hover:scale-105 transition-all shadow-[0_0_30px_rgba(212,175,55,0.3)]"
                    >
                        Ingresar al Panel
                        <span className="ml-4 group-hover:translate-x-2 inline-block transition-transform">→</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResultadoDiagnostico;
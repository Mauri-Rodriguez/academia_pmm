import React from 'react';

const SeccionInsignias = ({ insigniasObtenidas = [] }) => {
    // Definimos la lista maestra según tu monografía para mostrar incluso las no ganadas (bloqueadas)
    const listaMaestra = [
        { id: 1, nombre: 'Genio del Álgebra', img: 'medalla_algebra.png' },
        { id: 2, nombre: 'Cazador de Incógnitas', img: 'medalla_ecuaciones.png' },
        { id: 3, nombre: 'Maestro de la Recta', img: 'medalla_recta.png' },
        { id: 4, nombre: 'Señor de los Triángulos', img: 'medalla_trigonometria.png' },
        { id: 5, nombre: 'Dominador del Infinito', img: 'medalla_limites.png' },
        { id: 6, nombre: 'Rey de la Tasa de Cambio', img: 'medalla_derivadas.png' },
        { id: 7, nombre: 'Sabio del Área', img: 'medalla_integrales.png' }
    ];

    return (
        <div className="bg-[#0E121C]/60 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-md shadow-2xl mb-12">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="font-scholar text-sm text-white uppercase tracking-[0.3em]">Cofre de Insignias</h3>
                    <p className="text-[9px] text-slate-500 uppercase mt-1">Tu prestigio en la Aldea Digital</p>
                </div>
                <div className="bg-shinobi-gold/10 px-4 py-2 rounded-full border border-shinobi-gold/20">
                    <span className="text-shinobi-gold font-bold text-xs">
                        {insigniasObtenidas.length} / 7 RECOLECTADAS
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-4 md:grid-cols-7 gap-6">
                {listaMaestra.map((insignia) => {
                    const ganada = insigniasObtenidas.find(i => i.id_insignia === insignia.id);
                    
                    return (
                        <div key={insignia.id} className="group relative flex flex-col items-center">
                            {/* Círculo de la medalla */}
                            <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-700 
                                ${ganada 
                                    ? 'border-shinobi-gold bg-shinobi-gold/10 shadow-[0_0_25px_rgba(197,160,89,0.2)] scale-110' 
                                    : 'border-white/5 bg-slate-900/50 opacity-20 grayscale'}`}>
                                
                                <span className="text-2xl group-hover:scale-125 transition-transform duration-500">
                                    {ganada ? '🏅' : '🔒'}
                                </span>
                            </div>

                            {/* Nombre de la insignia (Tooltip) */}
                            <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center">
                                <p className={`text-[8px] font-black uppercase tracking-tighter ${ganada ? 'text-shinobi-gold' : 'text-slate-600'}`}>
                                    {insignia.nombre}
                                </p>
                            </div>
                            
                            {/* Efecto de luz para ganadas */}
                            {ganada && (
                                <div className="absolute inset-0 bg-shinobi-gold/5 blur-2xl rounded-full -z-10 animate-pulse"></div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SeccionInsignias;
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/api';

const VisualizadorModulo = () => {
    const { id_modulo } = useParams();
    const [lecciones, setLecciones] = useState([]);
    const [leccionActual, setLeccionActual] = useState(0);

    useEffect(() => {
        const cargarLecciones = async () => {
            const res = await api.get(`/estudiante/modulo/${id_modulo}`);
            setLecciones(res.data);
        };
        cargarLecciones();
    }, [id_modulo]);

    const marcarCompletada = async () => {
        await api.post('/api/estudiante/completar-leccion', {
            id_leccion: lecciones[leccionActual].id_leccion
        });
        if (leccionActual < lecciones.length - 1) {
            setLeccionActual(leccionActual + 1);
        } else {
            alert("¡Has terminado este módulo!");
        }
    };

    if (lecciones.length === 0) return <div className="p-10 text-white">Cargando pergaminos...</div>;

    const actual = lecciones[leccionActual];

    return (
        <div className="min-h-screen bg-shinobi-dark flex flex-col md:flex-row">
            {/* Lista de Lecciones lateral */}
            <aside className="w-full md:w-80 bg-slate-900 p-6 border-r border-white/10">
                <h2 className="text-shinobi-gold font-scholar mb-6 uppercase">Contenido del Módulo</h2>
                <div className="space-y-2">
                    {lecciones.map((lec, index) => (
                        <button 
                            key={lec.id_leccion}
                            onClick={() => setLeccionActual(index)}
                            className={`w-full text-left p-3 text-sm rounded ${leccionActual === index ? 'bg-shinobi-orange text-white' : 'hover:bg-white/5 text-slate-400'}`}
                        >
                            {index + 1}. {lec.titulo}
                        </button>
                    ))}
                </div>
            </aside>

            {/* Area de estudio */}
            <main className="flex-1 p-10">
                <h1 className="text-3xl font-scholar text-white mb-6">{actual.titulo}</h1>
                
                {/* Simulador de Video o Contenido */}
                <div className="aspect-video bg-black mb-8 border-2 border-shinobi-gold/30 flex items-center justify-center">
                    <p className="text-slate-500 italic">[ Aquí va el video de {actual.titulo} ]</p>
                </div>

                <div className="prose prose-invert max-w-none mb-10">
                    <p className="text-slate-300 leading-relaxed">{actual.contenido_texto}</p>
                </div>

                <button 
                    onClick={marcarCompletada}
                    className="bg-green-600 hover:bg-green-500 text-white font-scholar py-3 px-8 rounded transition-all uppercase tracking-widest"
                >
                    Marcar como completada y avanzar
                </button>
            </main>
        </div>
    );
};

export default VisualizadorModulo;
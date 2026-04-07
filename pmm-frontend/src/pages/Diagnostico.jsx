import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const Diagnostico = () => {
    const [preguntas, setPreguntas] = useState([]); 
    const [paso, setPaso] = useState(0);
    const [respuestas, setRespuestas] = useState({});
    const [loading, setLoading] = useState(true); 
    const [enviando, setEnviando] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const obtenerPreguntas = async () => {
            try {
                // Si la ruta en tu backend cambió, asegúrate de que esta coincida con tus routes
                const res = await api.get('/api/diagnostico/preguntas'); 
                // Asumiendo que el backend devuelve { data: [...] } según el controlador anterior
                setPreguntas(res.data.data || res.data); 
            } catch (err) {
                console.error("Error al invocar el banco de preguntas:", err);
                alert("No se pudieron cargar las preguntas.");
            } finally {
                setLoading(false);
            }
        };
        obtenerPreguntas();
    }, []);

    const manejarRespuesta = (valorOpcion) => {
        setRespuestas({ ...respuestas, [preguntas[paso].id_pregunta]: valorOpcion });
        if (paso < preguntas.length - 1) {
            setPaso(paso + 1);
        }
    };

    const finalizarPrueba = async () => {
        setEnviando(true);
        try {
            // 1. Transformamos el estado 'respuestas' (objeto) al formato array que espera el backend
            const formatoRespuestas = Object.keys(respuestas).map(id_pregunta => ({
                id_pregunta: parseInt(id_pregunta),
                respuesta: respuestas[id_pregunta]
            }));

            // 2. Enviamos el array al nuevo endpoint de evaluación
            const res = await api.post('/api/diagnostico/evaluar', {
                respuestas: formatoRespuestas 
            });

            // 3. Navegamos a la vista de resultados pasando TODA la información nueva
            navigate('/estudiante/resultado', { 
                state: { 
                    rango: res.data.resultados.rango_asignado, 
                    aciertos: res.data.resultados.correctas,
                    detalle: res.data.detalle // ¡Aquí pasamos el pergamino de errores!
                } 
            });

        } catch (err) {
            console.error("❌ Error al guardar:", err);
            alert("Error al sellar tus resultados. Revisa la conexión con la Aldea.");
        } finally {
            setEnviando(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-shinobi-dark flex items-center justify-center">
            <p className="text-shinobi-gold font-scholar animate-pulse text-xl">Invocando Pergaminos de Sabiduría...</p>
        </div>
    );

    if (preguntas.length === 0) return <p className="text-white">No hay preguntas disponibles.</p>;

    const pActual = preguntas[paso];
    const opcionesKeys = ['opcion_a', 'opcion_b', 'opcion_c', 'opcion_d'];

    return (
        <div className="min-h-screen bg-shinobi-dark flex flex-col items-center justify-center p-4">

            <div className="max-w-2xl w-full bg-[#f4f1e1] p-10 rounded-sm border-t-8 border-shinobi-orange shadow-2xl relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                    <span className="text-9xl font-scholar text-shinobi-dark">Σ</span>
                </div>

                {/* 🚩 EL ESCUDO NINJA: key={paso} obliga a React a recrear esta sección en cada pregunta */}
                <div key={paso}>
                    <div className="mb-8 flex justify-between items-end">
                        <div>
                            <p className="text-shinobi-orange font-scholar text-xs uppercase tracking-widest">Examen de Rango</p>
                            <h2 className="text-2xl font-scholar text-shinobi-dark uppercase">Matemáticas</h2>
                        </div>
                        <p className="font-modern text-slate-400 text-sm">Pergamino {paso + 1} de {preguntas.length}</p>
                    </div>

                    <div className="mb-10 min-h-[80px]">
                        <p className="text-lg text-shinobi-dark font-modern leading-relaxed italic">
                            "{pActual.pregunta}"
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {opcionesKeys.map((key, index) => (
                        <button
                            key={key}
                            onClick={() => manejarRespuesta(key)}
                            className={`text-left p-4 border-2 transition-all group ${
                                respuestas[pActual.id_pregunta] === key 
                                ? 'border-shinobi-orange bg-white shadow-md scale-[1.02]' 
                                : 'border-slate-200 hover:border-shinobi-orange/50 hover:bg-white/50'
                            }`}
                        >
                            <span className="font-scholar text-shinobi-orange mr-3">0{index + 1}.</span>
                            <span className="text-slate-700 font-medium">{pActual[key]}</span>
                        </button>
                    ))}
                </div>

                {paso === preguntas.length - 1 && respuestas[pActual.id_pregunta] && (
                    <button 
                        onClick={finalizarPrueba}
                        disabled={enviando}
                        className="w-full mt-8 bg-shinobi-dark text-shinobi-gold font-scholar py-4 tracking-widest hover:bg-shinobi-red hover:text-white transition-all shadow-lg uppercase active:scale-95"
                    >
                        {enviando ? 'Sellando Destino...' : 'Finalizar y Ver Rango'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default Diagnostico;
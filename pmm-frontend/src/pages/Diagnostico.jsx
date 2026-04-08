import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const Diagnostico = () => {
    const [preguntas, setPreguntas] = useState([]); 
    const [paso, setPaso] = useState(0);
    const [respuestas, setRespuestas] = useState({});
    const [loading, setLoading] = useState(true); 
    const [enviando, setEnviando] = useState(false);
    
    // 🚩 NUEVO ESTADO: Controla si el usuario ya leyó las instrucciones
    const [examenIniciado, setExamenIniciado] = useState(false);
    
    const navigate = useNavigate();

    useEffect(() => {
        const obtenerPreguntas = async () => {
            try {
                const res = await api.get('/api/diagnostico/preguntas'); 
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
            const formatoRespuestas = Object.keys(respuestas).map(id_pregunta => ({
                id_pregunta: parseInt(id_pregunta),
                respuesta: respuestas[id_pregunta]
            }));

            const res = await api.post('/api/diagnostico/evaluar', {
                respuestas: formatoRespuestas 
            });

            navigate('/estudiante/resultado', { 
                state: { 
                    rango: res.data.resultados.rango_asignado, 
                    aciertos: res.data.resultados.correctas,
                    detalle: res.data.detalle 
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

    // 🚩 VISTA 1: INSTRUCCIONES DEL EXAMEN (ANTES DE INICIAR)
    if (!examenIniciado) {
        return (
            <div className="min-h-screen bg-shinobi-dark flex flex-col items-center justify-center p-6">
                <div className="max-w-2xl w-full bg-[#f4f1e1] p-10 md:p-14 rounded-sm border-t-8 border-shinobi-orange shadow-2xl relative overflow-hidden text-center animate-in fade-in zoom-in duration-500">
                    
                    {/* Marca de agua decorativa */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
                        <span className="text-[200px] font-scholar text-shinobi-dark">⛩️</span>
                    </div>

                    <div className="relative z-10">
                        <p className="text-shinobi-orange font-scholar text-sm uppercase tracking-[0.3em] mb-4 font-bold">Protocolo de Evaluación</p>
                        <h1 className="text-3xl md:text-4xl font-scholar text-shinobi-dark uppercase mb-8 leading-tight">
                            Análisis de <span className="text-shinobi-orange">Habilidades Matemáticas</span>
                        </h1>

                        <div className="bg-white/50 border border-slate-200 p-6 md:p-8 rounded-xl text-left space-y-4 mb-10 shadow-inner">
                            <p className="text-slate-700 font-modern text-lg leading-relaxed">
                                Antes de iniciar, debes saber que a continuación se realizará un cuestionario midiendo tus habilidades actuales en matemáticas.
                            </p>
                            <p className="text-slate-700 font-modern text-lg leading-relaxed">
                                El objetivo de esta prueba es <strong>recomendarte qué ejercicios hacer</strong> y detectar si tienes falencias en algunos temas para así adaptar tu ruta de entrenamiento y ayudarte a mejorar.
                            </p>
                            <p className="text-slate-500 font-modern text-sm italic mt-4">
                                * Responde con honestidad. Si no conoces una respuesta, confía en tu intuición.
                            </p>
                        </div>

                        <button 
                            onClick={() => setExamenIniciado(true)}
                            className="group relative px-12 py-5 bg-shinobi-dark text-shinobi-gold font-black uppercase tracking-[0.3em] text-[12px] md:text-sm rounded-full hover:bg-shinobi-orange hover:text-white transition-all shadow-xl hover:scale-105 active:scale-95"
                        >
                            Aceptar el Desafío
                            <span className="ml-4 group-hover:translate-x-2 inline-block transition-transform">→</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 🚩 VISTA 2: EL EXAMEN 
    const pActual = preguntas[paso];
    const opcionesKeys = ['opcion_a', 'opcion_b', 'opcion_c', 'opcion_d'];

    return (
        <div className="min-h-screen bg-shinobi-dark flex flex-col items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-[#f4f1e1] p-10 rounded-sm border-t-8 border-shinobi-orange shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                    <span className="text-9xl font-scholar text-shinobi-dark">Σ</span>
                </div>

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
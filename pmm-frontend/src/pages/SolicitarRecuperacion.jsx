import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';

const SolicitarRecuperacion = () => {
    const [correo, setCorreo] = useState('');
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje({ texto: '', tipo: '' });

        if (!correo) {
            return setMensaje({ texto: 'Por favor, ingresa tu correo.', tipo: 'error' });
        }

        setLoading(true);
        try {
            // Llamamos a la ruta del backend que creamos en el paso anterior
            const res = await api.post('/api/auth/forgot-password', { correo });
            setMensaje({ texto: res.data.mensaje, tipo: 'success' });
            setCorreo(''); // Limpiamos el input
        } catch (err) {
            setMensaje({ 
                texto: err.response?.data?.mensaje || 'Error al solicitar el pergamino de recuperación.', 
                tipo: 'error' 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
            <div className="relative bg-[#f4f1e1]/95 backdrop-blur-md p-8 rounded-sm shadow-2xl w-full max-w-md border-y-4 border-shinobi-gold">
                
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center shadow-lg border-2 border-shinobi-gold z-10">
                    <span className="text-shinobi-gold font-bold text-xl">🗝️</span>
                </div>

                <div className="text-center mt-4 mb-6">
                    <h2 className="font-scholar text-2xl text-slate-900 tracking-widest uppercase">
                        Recuperar <span className="text-orange-600">Sello</span>
                    </h2>
                    <div className="h-px bg-shinobi-gold/30 w-3/4 mx-auto my-2"></div>
                    <p className="font-modern text-[11px] text-slate-500 uppercase tracking-widest mt-2">
                        Ingresa tu correo para recibir el pergamino de acceso.
                    </p>
                </div>

                {mensaje.texto && (
                    <div className={`p-3 mb-6 text-xs font-bold border-l-4 animate-pulse ${
                        mensaje.tipo === 'success' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-red-100 border-red-500 text-red-700'
                    }`}>
                        {mensaje.tipo === 'success' ? '✅ ' : '⚠️ '}
                        {mensaje.texto}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <input 
                            required 
                            type="email" 
                            value={correo} 
                            onChange={(e) => setCorreo(e.target.value)} 
                            className="w-full bg-transparent border-b-2 border-slate-300 p-2 focus:border-orange-500 outline-none text-slate-900 text-center" 
                            placeholder="ninja@estudiante.uniajc.edu.co" 
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={loading || mensaje.tipo === 'success'} 
                        className={`w-full bg-slate-900 text-shinobi-gold font-scholar py-3 tracking-widest hover:bg-orange-600 transition-all uppercase text-sm ${
                            (loading || mensaje.tipo === 'success') ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        {loading ? 'Enviando Cuervo...' : 'Enviar Enlace Mágico'}
                    </button>
                </form>

                <div className="text-center mt-6">
                    <Link to="/" className="text-slate-500 font-modern text-[10px] uppercase tracking-widest hover:text-orange-600 transition-colors">
                        ← Volver a la entrada de la aldea
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default SolicitarRecuperacion;
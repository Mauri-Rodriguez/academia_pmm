import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';

const ResetPassword = () => {
    const { token } = useParams(); // 🚩 Atrapamos el token de la URL
    const [password, setPassword] = useState('');
    const [confirmarPassword, setConfirmarPassword] = useState('');
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje({ texto: '', tipo: '' });

        // 🛡️ Validaciones de seguridad
        if (password.length < 6) {
            return setMensaje({ texto: 'La nueva clave debe tener al menos 6 caracteres.', tipo: 'error' });
        }
        if (password !== confirmarPassword) {
            return setMensaje({ texto: 'Las contraseñas no coinciden.', tipo: 'error' });
        }

        setLoading(true);
        try {
            // Enviamos la nueva contraseña al backend usando el token
            const res = await api.post(`/auth/reset-password/${token}`, { nuevaPassword: password });
            
            setMensaje({ texto: res.data.mensaje, tipo: 'success' });
            
            // Redirigir al login después de 3 segundos para que pueda entrar
            setTimeout(() => navigate('/'), 3000);
        } catch (err) {
            setMensaje({ 
                texto: err.response?.data?.mensaje || 'El enlace ha expirado o es inválido.', 
                tipo: 'error' 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
            <div className="relative bg-[#f4f1e1]/95 backdrop-blur-md p-8 rounded-sm shadow-2xl w-full max-w-md border-y-4 border-shinobi-gold">
                
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center shadow-lg border-2 border-shinobi-gold z-10">
                    <span className="text-white font-bold text-xl">⚔️</span>
                </div>

                <div className="text-center mt-4 mb-6">
                    <h2 className="font-scholar text-2xl text-slate-900 tracking-widest uppercase">
                        Nueva <span className="text-orange-600">Contraseña</span>
                    </h2>
                    <div className="h-px bg-shinobi-gold/30 w-3/4 mx-auto my-2"></div>
                    <p className="font-modern text-[11px] text-slate-500 uppercase tracking-widest mt-2">
                        Forja tu nuevo sello de acceso.
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

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input 
                        required 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        className="w-full bg-transparent border-b-2 border-slate-300 p-2 focus:border-orange-500 outline-none text-slate-900" 
                        placeholder="Nueva Contraseña" 
                    />
                    <input 
                        required 
                        type="password" 
                        value={confirmarPassword} 
                        onChange={(e) => setConfirmarPassword(e.target.value)} 
                        className="w-full bg-transparent border-b-2 border-slate-300 p-2 focus:border-orange-500 outline-none text-slate-900" 
                        placeholder="Confirmar Contraseña" 
                    />
                    
                    <button 
                        type="submit" 
                        disabled={loading || mensaje.tipo === 'success'} 
                        className={`w-full bg-slate-900 text-shinobi-gold font-scholar py-3 tracking-widest hover:bg-orange-600 transition-all uppercase text-sm ${
                            (loading || mensaje.tipo === 'success') ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        {loading ? 'Sellando...' : 'Restablecer Acceso'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
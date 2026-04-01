import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/api';

const Registro = () => {
    // 1. Mantenemos tu estructura base, agregando la confirmación
    const [formData, setFormData] = useState({
        nombre_completo: '',
        correo: '',
        password: '',
        confirmarPassword: '', 
        rol: 'estudiante'
    });
    
    // 2. Mantenemos tu excelente manejo de estado para las alertas
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje({ texto: '', tipo: '' });

        // 🛡️ Filtros de Seguridad Frontend
        if (formData.password.length < 6) {
            return setMensaje({ texto: 'La contraseña debe tener al menos 6 caracteres.', tipo: 'error' });
        }
        if (formData.password !== formData.confirmarPassword) {
            return setMensaje({ texto: 'Las contraseñas no coinciden. Revisa tu sello.', tipo: 'error' });
        }

        setLoading(true);

        try {
            const res = await api.post('/auth/register', {
                nombre_completo: formData.nombre_completo,
                correo: formData.correo,
                password: formData.password,
                rol: formData.rol 
            });

            setMensaje({ texto: '¡Registro exitoso! Preparando tu entrada al dojo...', tipo: 'success' });
            
            setTimeout(() => navigate('/'), 2000);
        } catch (err) {
            console.error("Error en registro:", err);
            setMensaje({ 
                texto: err.response?.data?.mensaje || 'Error al forjar tu registro en la aldea.', 
                tipo: 'error' 
            });
        } finally {
            setLoading(false);
        }
    };

    // Emblema visual para mantener la estética pareada con el Login
    const CodeMascotEmblem = () => (
        <div className="relative group w-full max-w-sm aspect-square flex items-center justify-center p-8 bg-white/5 border-shinobi-gold/20 border-2 rounded-full shadow-[0_0_20px_rgba(197,160,89,0.2)]">
            <div className="absolute inset-0 bg-shinobi-orange opacity-10 blur-3xl rounded-full scale-110"></div>
            <svg className="w-full h-full text-shinobi-gold fill-current z-10" viewBox="0 0 100 100">
                <path d="M 50 15 C 30 15, 15 30, 15 50 C 15 70, 30 85, 50 85 L 50 80 C 35 80, 20 65, 20 50 C 20 35, 35 20, 50 20 Z" />
                <text x="50" y="65" fontFamily="serif" fontSize="30" textAnchor="middle" fill="#C5A059" fontWeight="bold">Σ</text>
                <path d="M 55 25 L 75 15 L 65 25 M 70 20 L 80 25" stroke="currentColor" strokeWidth="2"/>
            </svg>
        </div>
    );

    return (
        <div className="min-h-screen bg-shinobi-dark flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
            <div className="flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-20 w-full max-w-7xl">
                
                {/* Lado del Emblema (Misma estructura que Login) */}
                <div className="md:w-1/2 hidden md:flex flex-col items-center justify-center p-4 text-center">
                    <CodeMascotEmblem />
                    <p className="mt-6 font-scholar text-[10px] text-shinobi-gold uppercase tracking-[0.3em] opacity-60">
                        Inscripción en la Academia
                    </p>
                </div>
                
                {/* Lado del Formulario */}
                <div className="md:w-1/2 w-full flex items-center justify-center">
                    <div className="relative bg-[#f4f1e1]/95 backdrop-blur-md p-8 rounded-sm shadow-2xl w-full max-w-md border-y-4 border-shinobi-gold">
                        
                        <div className="text-center mt-2 mb-6">
                            <h2 className="font-scholar text-2xl text-shinobi-dark tracking-widest uppercase">
                                Forjar Nuevo <span className="text-shinobi-orange">Sello</span>
                            </h2>
                            <div className="h-px bg-shinobi-gold/30 w-3/4 mx-auto my-2"></div>
                            <p className="font-modern text-[10px] text-slate-500 uppercase tracking-widest mt-2">
                                Únete a PMM Interactivo
                            </p>
                        </div>

                        {/* Sistema de Alertas Dinámico (Tu lógica original adaptada visualmente) */}
                        {mensaje.texto && (
                            <div className={`p-3 mb-6 text-xs font-bold border-l-4 animate-pulse ${
                                mensaje.tipo === 'success' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-red-100 border-shinobi-red text-shinobi-red'
                            }`}>
                                {mensaje.tipo === 'success' ? '✅ ' : '⚠️ '}
                                {mensaje.texto}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block font-scholar text-[11px] text-shinobi-dark mb-1 uppercase tracking-wider">Nombre Completo</label>
                                <input 
                                    name="nombre_completo" required type="text" 
                                    value={formData.nombre_completo} onChange={handleChange}
                                    className="w-full bg-transparent border-b-2 border-shinobi-dark/20 p-2 focus:border-shinobi-orange outline-none text-shinobi-dark font-modern transition-all"
                                    placeholder="Ej: Mauri Rodriguez"
                                />
                            </div>
                            <div>
                                <label className="block font-scholar text-[11px] text-shinobi-dark mb-1 uppercase tracking-wider">Correo Electrónico</label>
                                <input 
                                    name="correo" required type="email" 
                                    value={formData.correo} onChange={handleChange}
                                    className="w-full bg-transparent border-b-2 border-shinobi-dark/20 p-2 focus:border-shinobi-orange outline-none text-shinobi-dark font-modern transition-all"
                                    placeholder="ninja@academia.edu"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-scholar text-[11px] text-shinobi-dark mb-1 uppercase tracking-wider">Contraseña</label>
                                    <input 
                                        name="password" required type="password" 
                                        value={formData.password} onChange={handleChange}
                                        className="w-full bg-transparent border-b-2 border-shinobi-dark/20 p-2 focus:border-shinobi-orange outline-none text-shinobi-dark transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div>
                                    <label className="block font-scholar text-[11px] text-shinobi-dark mb-1 uppercase tracking-wider">Confirmar</label>
                                    <input 
                                        name="confirmarPassword" required type="password" 
                                        value={formData.confirmarPassword} onChange={handleChange}
                                        className="w-full bg-transparent border-b-2 border-shinobi-dark/20 p-2 focus:border-shinobi-orange outline-none text-shinobi-dark transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                            
                            <button 
                                type="submit" disabled={loading || mensaje.tipo === 'success'}
                                className={`w-full mt-6 bg-shinobi-dark text-shinobi-gold font-scholar py-3 tracking-widest hover:bg-shinobi-orange hover:text-white transition-all shadow-md active:scale-95 uppercase text-sm ${(loading || mensaje.tipo === 'success') ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Forjando...' : 'Confirmar Inscripción'}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-slate-500 font-modern text-[10px] uppercase tracking-widest">
                                ¿Ya eres parte de la academia? 
                                <Link to="/" className="ml-2 text-shinobi-dark font-bold hover:text-shinobi-orange transition-all">Volver al Login</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Registro;
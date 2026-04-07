import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/api';

const Registro = () => {
    const [formData, setFormData] = useState({
        nombre_completo: '',
        correo: '',
        password: '',
        confirmarPassword: '',
    });
    
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
    const [loading, setLoading] = useState(false);
    const [passwordMatch, setPasswordMatch] = useState(true);
    const [detectedRole, setDetectedRole] = useState('');
    const navigate = useNavigate();

    // 🛡️ CONFIGURACIÓN DE ACCESO
    const DOMINIOS_DOCENTES = ['profesores.uniajc.edu.co', 'admon.uniajc.edu.co'];
    const DOMINIOS_PERMITIDOS = [
        ...DOMINIOS_DOCENTES,
        'estudiante.uniajc.edu.co', 
        'gmail.com', 'outlook.com', 'hotmail.com'
    ];

    // ⚡ VALIDACIÓN REACTIVA (Efecto de Sello)
    useEffect(() => {
        // Validar si las contraseñas coinciden
        if (formData.confirmarPassword !== '') {
            setPasswordMatch(formData.password === formData.confirmarPassword);
        } else {
            setPasswordMatch(true);
        }

        // Detección automática de rango (Rol)
        const dominio = formData.correo.split('@')[1]?.toLowerCase();
        if (DOMINIOS_DOCENTES.includes(dominio)) {
            setDetectedRole('Docente/Administrativo');
        } else if (dominio && DOMINIOS_PERMITIDOS.includes(dominio)) {
            setDetectedRole('Estudiante');
        } else {
            setDetectedRole('');
        }
    }, [formData, DOMINIOS_DOCENTES, DOMINIOS_PERMITIDOS]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 🧪 MEDIDOR DE CHAKRA (Fuerza de Contraseña)
    const getPasswordStrength = () => {
        const pass = formData.password;
        if (pass.length === 0) return { label: '', color: 'bg-gray-700', width: '0%' };
        if (pass.length < 6) return { label: 'Chakra Insuficiente', color: 'bg-red-500', width: '33%' };
        if (pass.length < 10) return { label: 'Chakra Estable', color: 'bg-yellow-500', width: '66%' };
        return { label: 'Chakra de Maestro', color: 'bg-green-500', width: '100%' };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 🛡️ BARRERAS DE SEGURIDAD PRE-ENVÍO
        if (!passwordMatch) return setMensaje({ texto: 'Los sellos de contraseña no coinciden.', tipo: 'error' });
        if (formData.password.length < 6) return setMensaje({ texto: 'Tu chakra es débil. Mínimo 6 caracteres.', tipo: 'error' });

        const dominio = formData.correo.split('@')[1]?.toLowerCase();
        if (!DOMINIOS_PERMITIDOS.includes(dominio)) {
            return setMensaje({ texto: 'Este dominio no tiene acceso a la academia.', tipo: 'error' });
        }

        setLoading(true);
        try {
            await api.post('/api/auth/register', {
                nombre_completo: formData.nombre_completo,
                correo: formData.correo,
                password: formData.password
            });

            setMensaje({ texto: '¡Sello Forjado! Revisa tu correo de activación.', tipo: 'success' });
            setTimeout(() => navigate('/'), 4000);
        } catch (err) {
            setMensaje({ 
                texto: err.response?.data?.mensaje || 'Fallo en la forja del registro.', 
                tipo: 'error' 
            });
        } finally {
            setLoading(false);
        }
    };

    const strength = getPasswordStrength();

    return (
        <div className="min-h-screen bg-shinobi-dark flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
            <div className="flex flex-col md:flex-row items-center justify-center gap-12 w-full max-w-7xl">
                
                {/* LADO IZQUIERDO: EMBLEMA ANIMADO */}
                <div className="hidden md:flex flex-col items-center animate-pulse-slow">
                    <div className="w-64 h-64 border-4 border-shinobi-gold rounded-full flex items-center justify-center bg-white/5 shadow-[0_0_50px_rgba(212,175,55,0.2)]">
                        <span className="text-shinobi-gold text-8xl font-scholar">Σ</span>
                    </div>
                    <p className="mt-8 font-scholar text-shinobi-gold tracking-[0.6em] uppercase text-xs opacity-80">PMM Interactivo</p>
                </div>

                {/* FORMULARIO DE REGISTRO */}
                <div className="relative bg-[#f4f1e1]/95 backdrop-blur-sm p-8 rounded-sm shadow-2xl w-full max-w-md border-y-4 border-shinobi-gold">
                    <h2 className="font-scholar text-2xl text-center uppercase tracking-widest text-shinobi-dark mb-1">
                        Inscripción al <span className="text-orange-600">Dojo</span>
                    </h2>
                    <div className="h-px bg-shinobi-gold/30 w-full mb-6"></div>

                    {mensaje.texto && (
                        <div className={`p-3 mb-6 text-[11px] font-bold border-l-4 animate-bounce ${
                            mensaje.tipo === 'success' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-red-100 border-red-600 text-red-700'
                        }`}>
                            {mensaje.tipo === 'success' ? '✅ ' : '⚠️ '} {mensaje.texto}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* NOMBRE */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1 tracking-widest">Nombre Completo</label>
                            <input name="nombre_completo" required type="text" value={formData.nombre_completo} onChange={handleChange}
                                className="w-full bg-transparent border-b-2 border-gray-300 p-2 outline-none focus:border-shinobi-gold transition-all text-shinobi-dark font-modern" placeholder="Ej. Mauri Rodriguez" />
                        </div>

                        {/* CORREO CON DETECCIÓN DE RANGO */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-widest">Correo</label>
                                {detectedRole && <span className="text-[8px] bg-shinobi-dark text-shinobi-gold px-2 py-0.5 rounded-full font-bold uppercase animate-pulse">Rango: {detectedRole}</span>}
                            </div>
                            <input name="correo" required type="email" value={formData.correo} onChange={handleChange}
                                className="w-full bg-transparent border-b-2 border-gray-300 p-2 outline-none focus:border-shinobi-gold transition-all text-shinobi-dark font-modern" placeholder="usuario@uniajc.edu.co" />
                        </div>

                        {/* PASSWORD CON MEDIDOR */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1 tracking-widest">Contraseña</label>
                                <input name="password" required type="password" value={formData.password} onChange={handleChange}
                                    className="w-full bg-transparent border-b-2 border-gray-300 p-2 outline-none focus:border-shinobi-gold transition-all text-shinobi-dark" placeholder="••••••••" />
                                <div className="mt-2 h-1 w-full bg-gray-200 rounded-full">
                                    <div className={`h-full transition-all duration-700 ${strength.color}`} style={{ width: strength.width }}></div>
                                </div>
                                <p className="text-[8px] mt-1 text-right font-bold text-gray-400 uppercase">{strength.label}</p>
                            </div>

                            {/* CONFIRMACIÓN */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1 tracking-widest">Confirmar</label>
                                <input name="confirmarPassword" required type="password" value={formData.confirmarPassword} onChange={handleChange}
                                    className={`w-full bg-transparent border-b-2 p-2 outline-none transition-all ${passwordMatch ? 'border-gray-300 focus:border-shinobi-gold' : 'border-red-500 bg-red-50'}`} placeholder="••••••••" />
                                {!passwordMatch && <p className="text-[8px] text-red-600 font-bold mt-1 uppercase">Sello incorrecto</p>}
                            </div>
                        </div>

                        <button type="submit" disabled={loading || !passwordMatch}
                            className="w-full bg-shinobi-dark text-shinobi-gold py-4 font-scholar tracking-[0.3em] hover:bg-orange-600 hover:text-white transition-all duration-300 disabled:opacity-40 uppercase text-xs shadow-xl active:scale-95 border border-shinobi-gold/20">
                            {loading ? 'Validando Pergamino...' : 'Confirmar Inscripción'}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <Link to="/" className="text-[10px] text-gray-500 hover:text-shinobi-dark uppercase tracking-widest font-bold border-b border-transparent hover:border-shinobi-dark transition-all">
                            Ya poseo un sello de acceso
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Registro;
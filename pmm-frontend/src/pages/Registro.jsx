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

    const DOMINIOS_DOCENTES = ['profesores.uniajc.edu.co', 'admon.uniajc.edu.co'];
    const DOMINIOS_PERMITIDOS = [
        ...DOMINIOS_DOCENTES,
        'estudiante.uniajc.edu.co', 
        'gmail.com', 'outlook.com', 'hotmail.com'
    ];

    // 🛡️ EFECTO: Validación en tiempo real
    useEffect(() => {
        // Validar coincidencia de passwords
        if (formData.confirmarPassword !== '') {
            setPasswordMatch(formData.password === formData.confirmarPassword);
        }

        // Detectar rol por dominio
        const dominio = formData.correo.split('@')[1]?.toLowerCase();
        if (DOMINIOS_DOCENTES.includes(dominio)) {
            setDetectedRole('Docente/Administrativo');
        } else if (dominio) {
            setDetectedRole('Estudiante');
        } else {
            setDetectedRole('');
        }
    }, [formData, DOMINIOS_DOCENTES]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const getPasswordStrength = () => {
        if (formData.password.length === 0) return { label: '', color: 'bg-gray-300', width: '0%' };
        if (formData.password.length < 6) return { label: 'Chakra Débil', color: 'bg-red-500', width: '33%' };
        if (formData.password.length < 10) return { label: 'Chakra Estable', color: 'bg-yellow-500', width: '66%' };
        return { label: 'Chakra de Maestro', color: 'bg-green-500', width: '100%' };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!passwordMatch) return setMensaje({ texto: 'Las contraseñas no coinciden.', tipo: 'error' });
        if (formData.password.length < 6) return setMensaje({ texto: 'Contraseña muy corta.', tipo: 'error' });

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
            setMensaje({ texto: err.response?.data?.mensaje || 'Error en la forja.', tipo: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const strength = getPasswordStrength();

    return (
        <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
            <div className="flex flex-col md:flex-row items-center justify-center gap-12 w-full max-w-7xl">
                
                {/* LADO IZQUIERDO: EMBLEMA */}
                <div className="hidden md:flex flex-col items-center animate-pulse">
                    <div className="w-64 h-64 border-4 border-shinobi-gold rounded-full flex items-center justify-center bg-white/5 shadow-[0_0_50px_rgba(197,160,89,0.1)]">
                        <span className="text-shinobi-gold text-8xl font-bold">Σ</span>
                    </div>
                    <p className="mt-8 font-scholar text-shinobi-gold tracking-[0.5em] uppercase text-xs">PMM Interactivo</p>
                </div>

                {/* FORMULARIO */}
                <div className="relative bg-[#f4f1e1]/95 p-8 rounded-sm shadow-2xl w-full max-w-md border-y-4 border-shinobi-gold">
                    <h2 className="font-scholar text-2xl text-center uppercase tracking-widest mb-2">Inscripción al <span className="text-orange-600">Dojo</span></h2>
                    <p className="text-center text-[10px] text-gray-500 uppercase tracking-tighter mb-6">Valida tu identidad institucional</p>

                    {mensaje.texto && (
                        <div className={`p-3 mb-4 text-xs font-bold border-l-4 ${mensaje.tipo === 'success' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-red-100 border-red-600 text-red-700'}`}>
                            {mensaje.texto}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* NOMBRE */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">Nombre Real</label>
                            <input name="nombre_completo" required type="text" value={formData.nombre_completo} onChange={handleChange}
                                className="w-full bg-white/50 border-b-2 border-gray-300 p-2 outline-none focus:border-shinobi-gold transition-all" placeholder="Tu nombre" />
                        </div>

                        {/* CORREO Y DETECCIÓN DE ROL */}
                        <div>
                            <div className="flex justify-between items-end mb-1">
                                <label className="block text-[10px] font-bold uppercase text-gray-600">Correo</label>
                                {detectedRole && <span className="text-[9px] bg-shinobi-gold/20 text-orange-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">Rol: {detectedRole}</span>}
                            </div>
                            <input name="correo" required type="email" value={formData.correo} onChange={handleChange}
                                className="w-full bg-white/50 border-b-2 border-gray-300 p-2 outline-none focus:border-shinobi-gold transition-all" placeholder="ninja@uniajc.edu.co" />
                        </div>

                        {/* CONTRASEÑA Y FUERZA */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">Nueva Clave</label>
                            <input name="password" required type="password" value={formData.password} onChange={handleChange}
                                className="w-full bg-white/50 border-b-2 border-gray-300 p-2 outline-none focus:border-shinobi-gold transition-all" placeholder="••••••••" />
                            <div className="mt-2 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                                <div className={`h-full transition-all duration-500 ${strength.color}`} style={{ width: strength.width }}></div>
                            </div>
                            <p className="text-[9px] mt-1 text-right font-bold text-gray-500 uppercase">{strength.label}</p>
                        </div>

                        {/* CONFIRMACIÓN */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">Confirmar Clave</label>
                            <input name="confirmarPassword" required type="password" value={formData.confirmarPassword} onChange={handleChange}
                                className={`w-full bg-white/50 border-b-2 p-2 outline-none transition-all ${passwordMatch ? 'border-gray-300 focus:border-shinobi-gold' : 'border-red-500 bg-red-50'}`} placeholder="••••••••" />
                            {!passwordMatch && <p className="text-[9px] text-red-600 font-bold mt-1 uppercase">El sello no coincide</p>}
                        </div>

                        <button type="submit" disabled={loading || !passwordMatch}
                            className="w-full bg-gray-900 text-shinobi-gold py-3 font-scholar tracking-widest hover:bg-orange-600 hover:text-white transition-all disabled:opacity-50 uppercase text-xs shadow-xl">
                            {loading ? 'Sellando Pergamino...' : 'Unirse a la Academia'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link to="/" className="text-[10px] text-gray-500 hover:text-orange-600 uppercase tracking-widest font-bold transition-all">
                            Ya tengo un sello de acceso
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Registro;
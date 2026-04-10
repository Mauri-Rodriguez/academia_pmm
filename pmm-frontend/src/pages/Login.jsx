import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import api from '../api/api';

const Login = () => {
    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    // 🛡️ DOMINIOS PERMITIDOS 
    const DOMINIOS_PERMITIDOS = [
        'uniajc.edu.co',
        'estudiante.uniajc.edu.co',
        'profesores.uniajc.edu.co',
        'admon.uniajc.edu.co',
        'gmail.com',
        'outlook.com',
        'hotmail.com'
    ];

    // FUNCIÓN MAESTRA: Sincroniza la identidad en toda la aldea
    const guardarSesion = (token, usuario, requiereDiagnostico) => {
        // Limpieza previa para evitar conflictos de sesiones antiguas
        localStorage.clear();

        // Guardamos el token para las cabeceras de Axios   
        localStorage.setItem('token', token);

        // 👤 El objeto usuario completo para el ProtectedRoute
        localStorage.setItem('usuario', JSON.stringify(usuario));

        // 🚩 Redirección inteligente por Rol y Estado 
        if (usuario.rol === 'docente') {
            navigate('/docente/dashboard');
            return;
        }   

        // Extraer el primer nombre y guardarlo en 'user_name'
        if (usuario && (usuario.nombre || usuario.nombre_completo)) {
            const nombreCompleto = usuario.nombre || usuario.nombre_completo;
            const primerNombre = nombreCompleto.split(' ')[0]; // Toma solo el primer nombre
            localStorage.setItem('user_name', primerNombre);
        } else {
            localStorage.setItem('user_name', usuario.rol === 'docente' ? 'Sensei' : 'Estudiante');
        }
        // Redirección basada en el diagnóstico
        if (requiereDiagnostico === false) {
            console.log("🔥 Usuario veterano detectado. Dashboard directo.");
            navigate('/estudiante/dashboard');
        } else {
            console.log("🥷 Nuevo recluta. Iniciando examen de diagnóstico...");
            navigate('/estudiante/diagnostico');
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        try {
            // Le agregamos el /api al inicio de la ruta
            const res = await api.post('/api/auth/google-login', {
                token: credentialResponse.credential
            });
            // 🚩 Sincronizamos la sesión con el diagnóstico
            guardarSesion(res.data.token, res.data.usuario, res.data.requiereDiagnostico);
        } catch (err) {
            setError(err.response?.data?.mensaje || 'El sello de Google no es válido.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Limpiamos errores previos

        // FILTRO DE SEGURIDAD FRONTEND (Fail Fast)
        const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regexCorreo.test(correo)) {
            return setError('El formato del correo es inválido.');
        }

        const dominio = correo.split('@')[1]?.toLowerCase();
        if (!DOMINIOS_PERMITIDOS.includes(dominio)) {
            return setError(`Dominio no autorizado. Usa: ${DOMINIOS_PERMITIDOS.join(', ')}`);
        }

        setLoading(true);
        try {
            //  Le agregamos el /api al inicio de la ruta
            const res = await api.post('/api/auth/login', { correo, password });

            // 🚩 Sincronizamos la identidad
            guardarSesion(res.data.token, res.data.usuario, res.data.requiereDiagnostico);
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error en las credenciales del dojo.');
        } finally {
            setLoading(false);
        }
    };

    const CodeMascotEmblem = () => (
        <div className="relative group w-full max-w-sm aspect-square flex items-center justify-center p-8 bg-white/5 border-shinobi-gold/20 border-2 rounded-full shadow-[0_0_20px_rgba(197,160,89,0.2)]">
            <div className="absolute inset-0 bg-shinobi-orange opacity-10 blur-3xl rounded-full scale-110"></div>
            <svg className="w-full h-full text-shinobi-gold fill-current z-10" viewBox="0 0 100 100">
                <path d="M 50 15 C 30 15, 15 30, 15 50 C 15 70, 30 85, 50 85 L 50 80 C 35 80, 20 65, 20 50 C 20 35, 35 20, 50 20 Z" />
                <text x="50" y="65" fontFamily="serif" fontSize="30" textAnchor="middle" fill="#C5A059" fontWeight="bold">Σ</text>
                <path d="M 55 25 L 75 15 L 65 25 M 70 20 L 80 25" stroke="currentColor" strokeWidth="2" />
            </svg>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
            <div className="flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-20 w-full max-w-7xl">
                <div className="md:w-1/2 flex flex-col items-center justify-center p-4 text-center">
                    <CodeMascotEmblem />
                    <p className="mt-6 font-scholar text-[10px] text-shinobi-gold uppercase tracking-[0.3em] opacity-60">Sello del Saber Matemático</p>
                </div>

                <div className="md:w-1/2 w-full flex items-center justify-center">
                    <div className="relative bg-[#f4f1e1]/95 backdrop-blur-md p-8 rounded-sm shadow-2xl w-full max-w-md border-y-4 border-shinobi-gold">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-[#8B0000] rounded-full flex items-center justify-center shadow-lg border-2 border-shinobi-gold z-10">
                            <span className="text-shinobi-gold font-bold text-xl">葉</span>
                        </div>
                        <div className="text-center mt-4">
                            <h1 className="font-scholar text-3xl text-slate-900 tracking-widest uppercase">PMM <span className="text-orange-600">Interactivo</span></h1>
                            <p className="font-modern text-[10px] text-slate-500 uppercase tracking-widest mb-8">Sistema de Gestión Académica</p>
                        </div>

                        {error && <div className="bg-red-100 border-l-4 border-red-600 text-red-700 p-3 mb-6 text-xs font-bold animate-pulse">⚠️ {error}</div>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input required type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} className="w-full bg-transparent border-b-2 border-slate-300 p-2 focus:border-orange-500 outline-none text-slate-900" placeholder="ninja@academia.edu" />

                            <div>
                                <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent border-b-2 border-slate-300 p-2 focus:border-orange-500 outline-none text-slate-900" placeholder="••••••••" />

                                {/* 🛡️ NUEVO ENLACE DE RECUPERACIÓN */}
                                <div className="flex justify-end mt-2">
                                    <Link to="/recuperar-password" className="text-[10px] text-slate-500 hover:text-orange-600 font-modern uppercase tracking-widest transition-colors">
                                        ¿Olvidaste tu contraseña?
                                    </Link>
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="w-full mt-4 bg-slate-900 text-shinobi-gold font-scholar py-3 tracking-widest hover:bg-orange-600 transition-all uppercase text-sm">
                                {loading ? 'Validando Pergamino...' : 'Iniciar Sesión'}
                            </button>

                            <div className="flex items-center my-4">
                                <div className="flex-1 h-px bg-slate-300"></div>
                                <span className="px-3 text-[9px] uppercase text-slate-400 font-scholar">Sello Externo</span>
                                <div className="flex-1 h-px bg-slate-300"></div>
                            </div>

                            <div className="flex justify-center">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => setError('Fallo en la conexión')}
                                    use_fedcm_for_prompt={false}
                                    theme="filled_black"
                                />
                            </div>

                            <div className="text-center mt-6">
                                <p className="text-slate-500 font-modern text-[10px] uppercase tracking-widest">
                                    ¿Nuevo en la aldea? <Link to="/registro" className="ml-2 text-orange-600 font-scholar hover:underline">Inscribirse aquí</Link>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
// src/pages/VerificarCorreo.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/api';

const VerificarCorreo = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [estado, setEstado] = useState('validando'); // validando, exito, error
    
    // 🛡️ Guardia Ninja: Evita el doble render de React 18
    const peticionEnviada = useRef(false);

    useEffect(() => {
        const confirmar = async () => {
            // Si ya enviamos la petición, abortamos la segunda ejecución fantasma
            if (peticionEnviada.current) return;
            peticionEnviada.current = true;

            try {
                // Llama al endpoint del backend
                await api.get(`/api/auth/verificar/${token}`);
                setEstado('exito');
                setTimeout(() => navigate('/login'), 4000); // Lo manda al login
            } catch (error) {
                console.error("Error de verificación:", error.response?.data || error);
                setEstado('error');
            }
        };

        if (token) confirmar();
    }, [token, navigate]);

    return (
        <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center p-6 text-center">
            <div className="bg-[#f4f1e1]/95 p-10 rounded shadow-2xl max-w-md border-y-4 border-shinobi-gold">
                {estado === 'validando' && <h2 className="text-xl font-bold">Analizando tu chakra... ⏳</h2>}
                {estado === 'exito' && (
                    <div>
                        <h2 className="text-2xl font-bold text-green-600 mb-2">¡Sello Activado! ✅</h2>
                        <p className="text-sm text-gray-700">Tu cuenta ha sido verificada. Redirigiendo al dojo...</p>
                    </div>
                )}
                {estado === 'error' && (
                    <div>
                        <h2 className="text-2xl font-bold text-red-600 mb-2">Enlace Corrupto ❌</h2>
                        <p className="text-sm mb-4 text-gray-700">El enlace es inválido, ya fue utilizado o caducó.</p>
                        <Link to="/registro" className="text-orange-600 font-bold hover:underline">Solicitar nuevo registro</Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerificarCorreo;
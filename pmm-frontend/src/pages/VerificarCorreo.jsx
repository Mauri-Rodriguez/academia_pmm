// src/pages/VerificarCorreo.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/api';

const VerificarCorreo = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [estado, setEstado] = useState('validando'); // validando, exito, error

    useEffect(() => {
        const confirmar = async () => {
            try {
                // Llama al nuevo endpoint del backend
                await api.get(`/api/auth/verificar/${token}`);
                setEstado('exito');
                setTimeout(() => navigate('/'), 4000); // Lo manda al login en 4 seg
            } catch (error) {
                setEstado('error');
            }
        };
        confirmar();
    }, [token, navigate]);

    return (
        <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center p-6 text-center">
            <div className="bg-[#f4f1e1]/95 p-10 rounded shadow-2xl max-w-md border-y-4 border-shinobi-gold">
                {estado === 'validando' && <h2 className="text-xl font-bold">Analizando tu chakra... ⏳</h2>}
                {estado === 'exito' && (
                    <div>
                        <h2 className="text-2xl font-bold text-green-600 mb-2">¡Sello Activado! ✅</h2>
                        <p className="text-sm">Tu cuenta ha sido verificada. Redirigiendo al dojo...</p>
                    </div>
                )}
                {estado === 'error' && (
                    <div>
                        <h2 className="text-2xl font-bold text-red-600 mb-2">Enlace Corrupto ❌</h2>
                        <p className="text-sm mb-4">El enlace es inválido o ya caducó.</p>
                        <Link to="/registro" className="text-orange-600 font-bold hover:underline">Solicitar nuevo registro</Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerificarCorreo;
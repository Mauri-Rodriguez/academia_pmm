import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * Componente para proteger rutas según autenticación y roles de usuario.
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {string[]} props.allowedRoles - Arreglo con los roles permitidos (ej. ['estudiante']).
 * @returns {JSX.Element} Renderiza el Outlet si tiene acceso, o redirige a la ruta correcta.
 */
const ProtectedRoute = ({ allowedRoles }) => {
    // 1. Extraemos el token y el usuario del localStorage
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('usuario')); // Suponiendo que guardas el objeto usuario

    // 🛡️ Caso 1: No hay token (No ha iniciado sesión)
    if (!token) {
        return <Navigate to="/" replace />;
    }

    // 🛡️ Caso 2: El usuario no tiene el rol permitido (Ej: Estudiante intentando entrar a Docente)
    if (allowedRoles && !allowedRoles.includes(user?.rol)) {
        // Si es estudiante y se metió a ruta de docente, lo mandamos a su propio dashboard
        const redestino = user?.rol === 'docente' ? '/docente/dashboard' : '/estudiante/dashboard';
        return <Navigate to={redestino} replace />;
    }

    // ✅ Si todo está bien, mostramos la ruta solicitada (Outlet)
    return <Outlet />;
};

export default ProtectedRoute;
import axios from 'axios';

// 🛡️ MODO DINÁMICO: 
// Usa la variable de entorno en Producción (Netlify), y localhost en tu PC.
// Además, le agregamos el '/api' automáticamente a TODO.
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL 
        ? `${import.meta.env.VITE_API_URL}/api` 
        : 'http://localhost:3001/api' 
});

// 1️⃣ INTERCEPTOR DE PETICIÓN: Inyecta el token en cada llamada
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token'); 
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// 2️⃣ INTERCEPTOR DE RESPUESTA: El Escudo Global (Protección 401/403)
api.interceptors.response.use(
    (response) => {
        return response;
    }, 
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            if (window.location.pathname !== '/') {
                console.warn("⚠️ [Sistema de Seguridad] Chakra agotado. Expulsando usuario...");
                localStorage.clear();
                alert("Tu sesión ha caducado. Vuelve a identificarte en las puertas de la aldea.");
                window.location.href = '/'; 
            }
        }
        return Promise.reject(error);
    }
);

export default api;
import axios from 'axios';

// 1. Tomamos la URL (ya sea de Vercel/Railway o de tu Localhost)
const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// 2. Exportamos la URL para las fotos (Le quitamos el /api del final de forma segura)
export const BACKEND_URL = rawUrl.replace(/\/$/, '').replace(/\/api$/, '');

// 3. Creamos la instancia de Axios
const api = axios.create({
    baseURL: rawUrl.replace(/\/$/, '') 
});

// 4. INTERCEPTOR DE PETICIÓN: Inyecta el token en cada llamada
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token'); 
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// 5. INTERCEPTOR DE RESPUESTA: El Escudo Global (Protección 401/403)
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
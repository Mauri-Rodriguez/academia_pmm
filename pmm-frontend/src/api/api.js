import axios from 'axios';

const api = axios.create({
    // Vite: Si está en la nube usa VITE_API_URL, si estás programando en tu PC usa localhost
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
    withCredentials: true // Esto es el sello de seguridad para mantener la sesión del ninja activa
});

// Este "interceptor" pegará el Token automáticamente en cada petición ninja que hagamos
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
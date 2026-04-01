import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3001/api', // La dirección de tu backend Node.js
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
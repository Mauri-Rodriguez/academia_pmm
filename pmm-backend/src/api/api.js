import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3001' // Apuntando a tu servidor backend
});

// 1️⃣ INTERCEPTOR DE PETICIÓN: Inyecta el token en cada llamada
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token'); // Recuperamos el JWT
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
        // Si todo sale bien, dejamos pasar la información
        return response;
    }, 
    (error) => {
        // Si el backend nos lanza un 401 (No Autorizado) o 403 (Prohibido)
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            
            // Verificamos que no estemos ya en la pantalla de Login para evitar bucles
            if (window.location.pathname !== '/') {
                console.warn("⚠️ [Sistema de Seguridad] Chakra agotado. Expulsando usuario...");
                
                // 1. Quemamos los pergaminos de la sesión actual
                localStorage.clear();
                
                // 2. Le avisamos al Ninja
                alert("Tu sesión ha caducado. Vuelve a identificarte en las puertas de la aldea.");
                
                // 3. Redirección dura a la pantalla de inicio (Login)
                window.location.href = '/'; 
            }
        }
        
        // Siempre devolvemos el error para que el componente que hizo la llamada sepa que falló
        return Promise.reject(error);
    }
);

export default api;
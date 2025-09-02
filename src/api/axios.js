import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
});

api.interceptors.request.use((config) => {
    try{
        const raw = localStorage.getItem('auth');
        if(raw){
            const {token} = JSON.parse(raw);
            if(token) config.headers.Authorization = `Bearer ${token}`;
        }
    }catch {}
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        if(err?.response?.status === 401){
            try{ localStorage.removeItem('auth') } catch {}
            if(window.location.pathname !== '/') window.location.href = '/'
        }
        return Promise.reject(err);
    }
)

export default api;
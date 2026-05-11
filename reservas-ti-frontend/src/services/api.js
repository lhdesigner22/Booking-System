import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
});

// ─── Request: injeta token ────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response: trata erros globais ───────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Dispara evento customizado — o AuthProvider escuta e faz logout limpo
      window.dispatchEvent(new Event('auth:logout'));
    }

    if (status === 403) {
      window.dispatchEvent(new Event('auth:forbidden'));
    }

    return Promise.reject(error);
  }
);

export default api;
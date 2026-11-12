import axios from 'axios';

const apiBase = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')}/api`
  : '/api';

const api = axios.create({
  baseURL: apiBase,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('eduflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session expirations
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only treat as session expiration if not an explicit login attempt
    const isLoginEndpoint = error.config?.url?.includes('/auth/login');
    if (error.response && error.response.status === 401 && !isLoginEndpoint) {
      if (localStorage.getItem('eduflow_token')) {
        localStorage.removeItem('eduflow_token');
        localStorage.removeItem('eduflow_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;


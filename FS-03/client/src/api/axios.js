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

// Response interceptor to handle session expirations & unexpected HTML responses
api.interceptors.response.use(
  (response) => {
    // If an API endpoint returned HTML instead of JSON, reject it gracefully
    if (typeof response.data === 'string' && response.data.trim().startsWith('<!')) {
      return Promise.reject(new Error('Received HTML response from server instead of JSON API data.'));
    }
    return response;
  },
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


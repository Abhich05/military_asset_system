import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://military-asset-system-7gji.onrender.com';

export const apiClient = axios.create({ baseURL: API_BASE_URL });

// Attach JWT from localStorage on every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('mil_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, redirect to login
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('mil_token');
      localStorage.removeItem('mil_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

import axios from 'axios';

// In production: use VITE_API_URL env var (set on Render/Railway/Vercel)
// In development: Vite proxy forwards /api → localhost:5000
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  timeout: 30000
});

const absoluteBaseURL = typeof window !== 'undefined'
  ? new URL(baseURL, window.location.origin).toString()
  : baseURL;

export const mediaBaseURL = absoluteBaseURL.endsWith('/api')
  ? absoluteBaseURL.slice(0, -4)
  : absoluteBaseURL;

export function getMediaUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith('/uploads/')
    ? `/api${path}`
    : path;
  return new URL(normalizedPath, `${mediaBaseURL}/`).toString();
}

// Attach JWT token on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle auth errors globally
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

import axios from 'axios';
import { toast } from 'sonner';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT from localStorage as Bearer token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const candidateToken = localStorage.getItem('candidateToken');

    // For candidate-specific routes, prefer the candidate token
    if (
      candidateToken &&
      (config.url?.includes('/candidate-auth/') ||
        config.url?.includes('/candidate/') ||
        config.url?.includes('/applications/candidate/'))
    ) {
      config.headers.Authorization = `Bearer ${candidateToken}`;
    } else if (candidateToken && !token) {
      config.headers.Authorization = `Bearer ${candidateToken}`;
    } else if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: handle 401 and 429 globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect if we're on the admin login page (login attempt failure)
      const isAdminLogin = window.location.pathname.startsWith('/admin/login');
      if (!isAdminLogin) {
        localStorage.removeItem('token');
        localStorage.removeItem('candidateToken');
        window.location.href = '/login';
      }
    }

    if (error.response?.status === 429) {
      toast.error('Too many requests. Please wait a moment.');
    }

    return Promise.reject(error);
  },
);

export default apiClient;

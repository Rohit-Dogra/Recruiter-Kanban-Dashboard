import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    const candidateToken = localStorage.getItem('candidateToken');
    
    // For candidate routes, use candidateToken; for company routes, use token
    if (candidateToken && (
      config.url?.includes('/candidate-auth/') ||
      config.url?.includes('/candidate/') ||
      config.url?.includes('/applications/candidate/')
    )) {
      config.headers['Authorization'] = `Bearer ${candidateToken}`;
    } else if (candidateToken && !token) {
      // Fallback: if only candidateToken exists, use it
      config.headers['Authorization'] = `Bearer ${candidateToken}`;
    } else if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  response => response,
  error => {
    // Handle 401 Unauthorized responses
    if (error.response && error.response.status === 401) {
      // Don't redirect if we're on the admin login page (login attempt failure)
      const isAdminLogin = window.location.pathname.startsWith('/admin/login');
      if (!isAdminLogin) {
        localStorage.removeItem('token');
        // Redirect to login page
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

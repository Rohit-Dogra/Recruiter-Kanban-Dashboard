import api from './api';

// Types
export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  company: string;
  role: string;
  isGoogleUser?: boolean;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    company: string;
    role: string;
  };
  needsCompanyDetails?: boolean;
  profileCompleted?: boolean;
}

// Auth service methods
const authService = {
  // Register a new user
  signup: async (userData: SignupData) => {
    try {
      const response = await api.post<AuthResponse>('/auth/signup', userData);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Login a user
  login: async (loginData: LoginData) => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', loginData);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Logout a user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Get current user
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Forgot password
  forgotPassword: async (email: string) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Reset password
  resetPassword: async (token: string, password: string) => {
    try {
      const response = await api.post('/auth/reset-password', { token, password });
      return response.data;
    } catch (error) {
      throw error;
    }
  },


    // Change password (authenticated - requires current password)
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },

  
  // Get current user from API (refresh user data)
  fetchCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      const userData = response.data.user || response.data;
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      throw error;
    }
  },

  // Google authentication for companies
  googleAuth: async (credential: string, mode: 'login' | 'signup') => {
    try {
      const response = await api.post<AuthResponse>('/auth/google', { 
        credential, 
        mode,
        userType: 'company' 
      });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default authService;

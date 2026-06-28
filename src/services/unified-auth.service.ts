import api from './api';

export interface UnifiedLoginData {
  email: string;
  password: string;
}

export interface UnifiedAuthResponse {
  token: string;
  userType: 'company' | 'candidate' | 'admin';
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    company: string;
    role: string;
    invitedByUserId?: number;
    userType?: string;
  };
  candidate?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    location?: string;
  };
  needsCompanyDetails?: boolean;
  profileCompleted?: boolean;
  redirectTo: string;
}

export interface UnifiedSignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  accountType: 'company' | 'candidate';
  company?: string;
  role?: string;
  phone?: string;
  location?: string;
}

const unifiedAuthService = {
  signup: async (signupData: UnifiedSignupData) => {
    const response = await api.post<UnifiedAuthResponse>('/unified-auth/signup', signupData);

    if (response.data.token) {
      if (response.data.userType === 'company') {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      } else if (response.data.userType === 'candidate') {
        localStorage.setItem('candidateToken', response.data.token);
        localStorage.setItem('candidate', JSON.stringify(response.data.candidate));
        localStorage.setItem('profileCompleted', 'false');
      }
      window.dispatchEvent(new Event('auth-update'));
    }

    return response.data;
  },

  googleSignup: async (credential: string, accountType: 'company' | 'candidate') => {
    const response = await api.post<UnifiedAuthResponse>('/unified-auth/google-signup', { credential, accountType });

    if (response.data.token) {
      if (response.data.userType === 'company') {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      } else if (response.data.userType === 'candidate') {
        localStorage.setItem('candidateToken', response.data.token);
        localStorage.setItem('candidate', JSON.stringify(response.data.candidate));
        localStorage.setItem('profileCompleted', 'false');
      }
      window.dispatchEvent(new Event('auth-update'));
    }

    return response.data;
  },

  login: async (loginData: UnifiedLoginData) => {
    const response = await api.post<UnifiedAuthResponse>('/unified-auth/login', loginData);
    
    if (response.data.token) {
      if (response.data.userType === 'company' || response.data.userType === 'admin') {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      } else if (response.data.userType === 'candidate') {
        localStorage.setItem('candidateToken', response.data.token);
        localStorage.setItem('candidate', JSON.stringify(response.data.candidate));
        localStorage.setItem('profileCompleted', response.data.profileCompleted ? 'true' : 'false');
      }
      
      // Trigger auth context update
      window.dispatchEvent(new Event('auth-update'));
    }
    
    return response.data;
  },

  googleAuth: async (credential: string) => {
    const response = await api.post<UnifiedAuthResponse>('/unified-auth/google', { credential });
    
    if (response.data.token) {
      if (response.data.userType === 'company' || response.data.userType === 'admin') {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      } else if (response.data.userType === 'candidate') {
        localStorage.setItem('candidateToken', response.data.token);
        localStorage.setItem('candidate', JSON.stringify(response.data.candidate));
        localStorage.setItem('profileCompleted', response.data.profileCompleted ? 'true' : 'false');
      }
      
      // Trigger auth context update
      window.dispatchEvent(new Event('auth-update'));
    }
    
    return response.data;
  }
};

export default unifiedAuthService;
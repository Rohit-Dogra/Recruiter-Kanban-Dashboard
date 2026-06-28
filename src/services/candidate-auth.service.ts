import api from './api';

export interface CandidateSignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  location?: string;
}

export interface CandidateLoginData {
  email: string;
  password: string;
}

export interface CandidateAuthResponse {
  token: string;
  candidate: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    location?: string;
  };
  profileCompleted?: boolean;
}

const candidateAuthService = {
  signup: async (userData: CandidateSignupData) => {
    const response = await api.post<CandidateAuthResponse>('/candidate-auth/signup', userData);
    if (response.data.token) {
      localStorage.setItem('candidateToken', response.data.token);
      localStorage.setItem('candidate', JSON.stringify(response.data.candidate));
      localStorage.setItem('profileCompleted', 'false');
    }
    return response.data;
  },

  login: async (loginData: CandidateLoginData) => {
    const response = await api.post<CandidateAuthResponse>('/candidate-auth/login', loginData);
    if (response.data.token) {
      localStorage.setItem('candidateToken', response.data.token);
      localStorage.setItem('candidate', JSON.stringify(response.data.candidate));
      localStorage.setItem('profileCompleted', response.data.profileCompleted ? 'true' : 'false');
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('candidateToken');
    localStorage.removeItem('candidate');
    localStorage.removeItem('profileCompleted');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('candidateToken');
  },

  getCurrentCandidate: () => {
    const candidate = localStorage.getItem('candidate');
    return candidate ? JSON.parse(candidate) : null;
  },

  googleAuth: async (credential: string) => {
    const response = await api.post<CandidateAuthResponse>('/candidate-auth/google', { credential });
    if (response.data.token) {
      localStorage.setItem('candidateToken', response.data.token);
      localStorage.setItem('candidate', JSON.stringify(response.data.candidate));
      localStorage.setItem('profileCompleted', response.data.profileCompleted ? 'true' : 'false');
    }
    return response.data;
  },

  // Check if profile is completed
  checkProfileStatus: () => {
    const profileCompleted = localStorage.getItem('profileCompleted');
    return profileCompleted === 'true';
  },

  // Get candidate profile
  getProfile: async () => {
    const response = await api.get('/candidate-auth/profile');
    return response.data;
  },

  // Update candidate profile
  updateProfile: async (profileData: any) => {
    const response = await api.put('/candidate-auth/profile', profileData);
    return response.data;
  }
};

export default candidateAuthService;
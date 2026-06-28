import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService from '@/services/auth.service';
import candidateAuthService from '@/services/candidate-auth.service';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  role?: string;
  phone?: string;
  location?: string;
  invitedByUserId?: number | null;
  userType?: 'company' | 'candidate' | 'admin';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userType: 'company' | 'candidate' | 'admin' | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateAuthState: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<'company' | 'candidate' | 'admin' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = async () => {
    try {
      // Check for company authentication
      if (authService.isAuthenticated()) {
        const userData = authService.getCurrentUser();
        if (userData) {
          const resolvedType = userData.userType || 'company';
          setUser({ ...userData, userType: resolvedType });
          setUserType(resolvedType);
        } else {
          // Token exists but no user data, fetch from API
          const fetchedUser = await authService.fetchCurrentUser();
          const resolvedType = fetchedUser.userType || 'company';
          setUser({ ...fetchedUser, userType: resolvedType });
          setUserType(resolvedType);
        }
      }
      // Check for candidate authentication
      else if (candidateAuthService.isAuthenticated()) {
        const candidateData = candidateAuthService.getCurrentCandidate();
        if (candidateData) {
          setUser({ ...candidateData, userType: 'candidate' });
          setUserType('candidate');
        }
      }
    } catch (error) {
      // Token is invalid, clear it
      authService.logout();
      candidateAuthService.logout();
      setUser(null);
      setUserType(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateAuthState = () => {
    checkAuthStatus();
  };

  useEffect(() => {
    checkAuthStatus();
    
    // Listen for auth updates from unified login
    const handleAuthUpdate = () => {
      checkAuthStatus();
    };
    
    window.addEventListener('auth-update', handleAuthUpdate);
    
    return () => {
      window.removeEventListener('auth-update', handleAuthUpdate);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    const resolvedType = response.user?.userType || 'company';
    setUser({ ...response.user, userType: resolvedType });
    setUserType(resolvedType);
    
    // Check if company profile needs completion
    if (response.needsCompanyDetails) {
      throw new Error('PROFILE_INCOMPLETE');
    }
  };

  const logout = () => {
    authService.logout();
    candidateAuthService.logout();
    setUser(null);
    setUserType(null);
  };

  const refreshUser = async () => {
    try {
      if (userType === 'company') {
        const userData = await authService.fetchCurrentUser();
        setUser({ ...userData, userType: 'company' });
      } else if (userType === 'candidate') {
        // For candidates, we'll just refresh from localStorage
        const candidateData = candidateAuthService.getCurrentCandidate();
        if (candidateData) {
          setUser({ ...candidateData, userType: 'candidate' });
        }
      }
    } catch (error) {
      logout();
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    userType,
    login,
    logout,
    refreshUser,
    updateAuthState,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
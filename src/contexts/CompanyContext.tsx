import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import companyService, { Company } from '@/services/company.service';
import authService from '@/services/auth.service';

interface User {
  id?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
}

interface CompanyContextType {
  company: Company | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  refreshCompany: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};

interface CompanyProviderProps {
  children: ReactNode;
}

export const CompanyProvider = ({ children }: CompanyProviderProps) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get user data
      const userData = authService.getCurrentUser();
      setUser(userData);
      
      // Get company data
      const companyData = await companyService.getMyCompany();
      setCompany(companyData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch company data');
      setCompany(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const refreshCompany = async () => {
    await fetchCompanyData();
  };

  return (
    <CompanyContext.Provider value={{ company, user, loading, error, refreshCompany }}>
      {children}
    </CompanyContext.Provider>
  );
};
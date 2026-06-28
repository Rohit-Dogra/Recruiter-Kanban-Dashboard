import api from './api';

export interface CompanyData {
  name: string;
  description: string;
  website?: string;
  industry: string;
  size: string;
  location: string;
  founded?: string;
  mission?: string;
  values?: string;
  culture?: string;
  logoUrl?: string;
}

export interface Company extends CompanyData {
  id: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

const companyService = {
  // Upsert company details
  upsertCompany: async (companyData: FormData) => {
    try {
      const response = await api.post<Company>('/company', companyData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },


  // Get company details for current user (works for owner and invited users - same company)
  getCompany: async () => {
    try {
      const response = await api.get<{ success?: boolean; company?: Company }>('/company');
      const data = response.data as any;
      return data?.company ?? data;
    } catch (error) {
      throw error;
    }
  },

  getMyCompany: async function () {
    return this.getCompany();
  },

  updateCompany: async (data: Partial<CompanyData>) => {
    const fd = new FormData();
    if (data.name != null) fd.append('name', data.name);
    if (data.description != null) fd.append('description', data.description);
    if (data.website != null) fd.append('website', data.website);
    if (data.industry != null) fd.append('industry', data.industry);
    if (data.size != null) fd.append('size', data.size);
    fd.append('location', data.location ?? '');
    if (data.founded != null) fd.append('founded', data.founded);
    if (data.mission != null) fd.append('mission', data.mission);
    if (data.values != null) fd.append('values', data.values);
    if (data.culture != null) fd.append('culture', data.culture);
       
    try {
      const response = await api.post<Company>('/company', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get company by ID (public endpoint)
  getCompanyById: async (companyId: number) => {
    try {
      const response = await api.get<Company>(`/company/${companyId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Public: Get company by user ID (fallback for older shared links / jobs mapping)
  getCompanyByUserId: async (userId: number) => {
    try {
      const response = await api.get<Company>(`/company/user/${userId}`);
     return response.data;
    } catch (error) {
      // If no company exists for the user, return null so callers can handle onboarding
      if (error?.response?.status === 404) {
        return null as unknown as Company | null;
      }
      throw error;
    }
  },

  // Get all companies (public endpoint)
  getAllCompanies: async () => {
    try {
      const response = await api.get('/company/all/list');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default companyService;

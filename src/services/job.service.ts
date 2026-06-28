import api from './api';

// Types
export interface JobFormData {
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  department: string;
  experience: string;
  description: string;
  requirements: string;
  benefits: string;
  deadline: string;
  isRemote: boolean;
  skills: string[];
  status: string;
  urgency?: string;
  workType?: string;
  expiresIn?: string;
  applyFormConfig?: {
    phoneRequired: boolean;
    coverLetterRequired: boolean;
    customQuestions: Array<{id: string; question: string}>;
  };
}

export interface Job extends JobFormData {
  id: number;
  companyId: number;
  createdAt: string;
  updatedAt: string;
  userId: number;
  urgency?: string;
}

// Job service methods
const jobService = {
  // Get all jobs
  getAllJobs: async () => {
    try {
      const response = await api.get('/jobs');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get job by id
  getJobById: async (id: number) => {
    try {
      const response = await api.get(`/jobs/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create a new job
  createJob: async (jobData: JobFormData) => {
    try {
      const response = await api.post('/jobs', jobData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get jobs posted by current user
  getUserJobs: async () => {
    try {
      const response = await api.get('/jobs/user/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update job
  updateJob: async (id: number, jobData: Partial<JobFormData>) => {
    try {
      const response = await api.put(`/jobs/${id}`, jobData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete job
  deleteJob: async (id: number) => {
    try {
      const response = await api.delete(`/jobs/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
      },

  // Get jobs by company ID (public endpoint)
  getJobsByCompanyId: async (companyId: number) => {
    try {
      const response = await api.get(`/jobs/company/${companyId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default jobService;

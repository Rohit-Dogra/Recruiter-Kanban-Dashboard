import api from './api';

export interface ApplicationData {
  jobId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  resumeUrl?: string;
  coverLetter?: string;
  answers: Array<{
    question: string;
    answer: string;
  }>;
}

export interface Application {
  id: number;
  jobId: number;
  candidateId: number;
  companyId: number;
  resumeUrl?: string;
  coverLetter?: string;
  status: string;
  stage: string;
  appliedDate: string;
  createdAt: string;
  updatedAt: string;
   aiScore?: number;
  aiNotes?: string;
  atsStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  resumeMatch?: number;
  skillsMatch?: Record<string, boolean>;
  notes?: string;
  candidateProfile?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location?: string;
    experience?: string;
    skills?: string[];
    currentTitle?: string;
    currentCompany?: string;
    education?: string;
    avatarUrl?: string;
    resumeUrl?: string;
  };
  job?: {
    title: string;
    company: string;
  };
  answers?: Array<{
    question: string;
    answer: string;
  }>;
}

const applicationService = {
  // Submit job application
  submitApplication: async (applicationData: ApplicationData) => {
    try {
      const response = await api.post('/applications', applicationData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get applications for a specific job
  getJobApplications: async (jobId: number) => {
    try {
      const response = await api.get(`/applications/job/${jobId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get application by ID
  getApplicationById: async (id: number) => {
    try {
      const response = await api.get(`/applications/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update application status
  updateApplicationStatus: async (id: number, status: string, notes?: string) => {
    try {
      const response = await api.put(`/applications/${id}/status`, { status, notes });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get applications for current candidate
  getCandidateApplications: async () => {
    try {
      const response = await api.get('/applications/candidate/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Check if candidate has previous applications and get saved answers
  checkPreviousApplication: async (jobId: number, _candidateEmail: string) => {
    try {
      const response = await api.get(`/applications/candidate/check-previous/${jobId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get all applications for the current user
  getAllApplications: async () => {
    try {
      const response = await api.get('/applications');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Check if candidate has applied for a specific job
  checkIfApplied: async (jobId: number, _candidateEmail: string) => {
    try {
      const response = await api.get(`/applications/candidate/check/${jobId}`);
      return response.data;
    } catch (error) {
      // If error, assume not applied
      return { success: true, hasApplied: false };
    }
  },

  // Retry ATS analysis for a failed application
  retryAts: async (applicationId: number) => {
    try {
      const response = await api.post(`/applications/${applicationId}/retry-ats`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Bulk operations on multiple applications
  bulkAction: async (data: {
    applicationIds: number[];
    action: 'reject' | 'move-stage' | 'email';
    targetStage?: string;
    emailSubject?: string;
    emailBody?: string;
  }) => {
    try {
      const response = await api.post('/applications/bulk', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default applicationService;
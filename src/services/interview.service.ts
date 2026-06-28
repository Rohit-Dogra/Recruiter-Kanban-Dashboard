import api from './api';
import { Application } from './application.service';

// Types
export interface InterviewData {
  applicationId: number;
  scheduledDate: string;
  duration?: number;
  type: 'video' | 'in-person';
  location?: string;
  meetingUrl?: string;
  mapLink?: string;
  interviewerId?: number;
  notes?: string;
}

export interface Interview extends InterviewData {
  id: number;
  feedback?: string;
  rating?: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  createdAt: string;
  updatedAt: string;
  application?: Application;
  interviewer?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface FeedbackData {
  feedback?: string;
  rating?: number;
  status?: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
}

// Interview service methods
const interviewService = {
  // Get all interviews
  getAllInterviews: async (applicationId?: number, interviewerId?: number, startDate?: string, endDate?: string, status?: string) => {
    try {
      let queryParams = '';
      if (applicationId) queryParams += `applicationId=${applicationId}&`;
      if (interviewerId) queryParams += `interviewerId=${interviewerId}&`;
      if (startDate) queryParams += `startDate=${startDate}&`;
      if (endDate) queryParams += `endDate=${endDate}&`;
      if (status) queryParams += `status=${status}&`;
      
      const url = `/interviews${queryParams ? `?${queryParams.slice(0, -1)}` : ''}`;
      const response = await api.get<Interview[]>(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get interview by id
  getInterviewById: async (id: number) => {
    try {
      const response = await api.get<Interview>(`/interviews/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create a new interview
  createInterview: async (interviewData: InterviewData) => {
    try {
      const response = await api.post<Interview>('/interviews', interviewData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update interview feedback
  updateInterviewFeedback: async (id: number, feedbackData: FeedbackData) => {
    try {
      const response = await api.put<Interview>(`/interviews/${id}/feedback`, feedbackData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update interview
  updateInterview: async (id: number, interviewData: Partial<InterviewData>) => {
    try {
      const response = await api.put<Interview>(`/interviews/${id}`, interviewData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete interview
  deleteInterview: async (id: number) => {
    try {
      const response = await api.delete(`/interviews/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default interviewService;

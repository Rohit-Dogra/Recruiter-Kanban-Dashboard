import api from './api';

export interface Notification {
  id: number;
  userId: number;
  type: 'job' | 'candidate' | 'interview' | 'offer' | 'system' | 'alert';
  title: string;
  message: string;
  tag?: string;
  read: boolean;
  jobId?: number;
  candidateId?: number;
  applicationId?: number;
  createdAt: string;
  updatedAt: string;
  job?: {
    id: number;
    title: string;
  };
  candidate?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  application?: {
    id: number;
    status: string;
  };
}

export const notificationService = {
  getAll: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications');
    return response.data;
  },

  getCandidateNotifications: async (email: string): Promise<Notification[]> => {
    const response = await api.get(`/notifications/candidate/${email}`);
    return response.data;
  },

  markAsRead: async (id: number): Promise<Notification> => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markCandidateAsRead: async (id: number): Promise<Notification> => {
    const response = await api.patch(`/notifications/candidate/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notifications/mark-all-read');
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },

  clearAll: async (): Promise<void> => {
    await api.delete('/notifications');
  }
};

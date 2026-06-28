import api from './api';

export const screeningQuestionsService = {
  getForJob: async (jobId: number): Promise<string[]> => {
    const response = await api.get(`/screening-questions/job/${jobId}`);
    return response.data.questions ?? [];
  },

  saveForJob: async (jobId: number, questions: string[]): Promise<string[]> => {
    const response = await api.put(`/screening-questions/job/${jobId}`, { questions });
    return response.data.questions ?? [];
  },

  generateForJob: async (jobId: number): Promise<string[]> => {
    const response = await api.post(`/screening-questions/job/${jobId}/generate`);
    return response.data.questions ?? [];
  }
};

export default screeningQuestionsService;

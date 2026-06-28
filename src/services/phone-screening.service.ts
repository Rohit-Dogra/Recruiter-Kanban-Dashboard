import api from './api';

export interface PhoneScreening {
  id: number;
  candidate: string;
  initials: string;
  position: string;
  date: string;
  time: string;
  duration: string;
  status: string;
  rating?: number;
  summary?: string;
  bolnaExecutionId: string;
  recordingUrl?: string;
  transcript?: any;
  agentExtraction?: any;
}

export interface PhoneScreeningStats {
  totalScreenings: number;
  thisWeekScreenings: number;
  avgDuration: string;
  avgRating: string;
}

const phoneScreeningService = {
  getScreenings: async (): Promise<PhoneScreening[]> => {
    const response = await api.get<PhoneScreening[]>('/phone-screening');
    return response.data;
  },

  getStats: async (): Promise<PhoneScreeningStats> => {
    const response = await api.get<PhoneScreeningStats>('/phone-screening/stats');
    return response.data;
  },

  syncWithBolna: async (): Promise<void> => {
    await api.post('/phone-screening/sync');
  },

  getRecording: async (screeningId: number): Promise<any> => {
    const response = await api.get(`/phone-screening/${screeningId}/details`);
    return response.data;
  },

  getCallDetails: async (screeningId: number): Promise<any> => {
    const response = await api.get(`/phone-screening/${screeningId}/details`);
    return response.data;
  },

  fetchBolnaData: async (): Promise<any> => {
    const response = await api.post('/phone-screening/fetch-bolna-data');
    return response.data;
  }

};

export default phoneScreeningService;
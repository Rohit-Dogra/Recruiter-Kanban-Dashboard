import api from './api';

export interface AIVideoInterview {
  id: number;
  candidateEmail: string;
  candidateName: string;
  jobTitle: string;
  token: string;
  status: 'pending' | 'completed' | 'expired';
  expiresAt: string;
  sentAt: string;
  completedAt?: string;
  result?: AIVideoInterviewResult;
}

export interface AIVideoInterviewResult {
  id: number;
  interviewId: number;
  transcript: string;
  aiFeedback: string;
  technicalScore: number;
  communicationScore: number;
  overallScore: number;
  videoDuration: number;
}

export interface AIVideoInterviewStats {
  total: number;
  completed: number;
  pending: number;
  avgScore: number;
}

const sendInvite = async (data: {
  candidateEmail: string;
  candidateName: string;
  jobTitle: string;
}) => {
  const response = await api.post('/ai-video-interviews/send-invite', data);
  return response.data;
};

const getInterviews = async (): Promise<AIVideoInterview[]> => {
  const response = await api.get('/ai-video-interviews');
  return response.data.interviews;
};

const getStats = async (): Promise<AIVideoInterviewStats> => {
  const response = await api.get('/ai-video-interviews/stats');
  return response.data.stats;
};

const getInterviewByToken = async (token: string): Promise<AIVideoInterview> => {
  const response = await api.get(`/ai-video-interviews/token/${token}`);
  return response.data.interview;
};

const submitResponse = async (token: string, data: {
  questionNumber: number;
  question: string;
  responseText: string;
  skill: string;
}) => {
  const response = await api.post(`/ai-video-interviews/submit-response/${token}`, data);
  return response.data;
};

const submitInterview = async (token: string, data: {
  videoDuration: number;
}) => {
  const response = await api.post(`/ai-video-interviews/submit/${token}`, data);
  return response.data;
};

const getInterviewResult = async (id: number): Promise<AIVideoInterview> => {
  const response = await api.get(`/ai-video-interviews/${id}/result`);
  return response.data.interview;
};

const generateQuestions = async (data: {
  role: string;
  skills?: string;
  experienceLevel?: string;
  difficulty?: string;
  count?: number;
}) => {
  const response = await api.post('/ai-video-interviews/generate-questions', data);
  return response.data.questions;
};

const aiVideoInterviewService = {
  sendInvite,
  getInterviews,
  getStats,
  getInterviewByToken,
  submitResponse,
  submitInterview,
  getInterviewResult,
  generateQuestions
};

export default aiVideoInterviewService;

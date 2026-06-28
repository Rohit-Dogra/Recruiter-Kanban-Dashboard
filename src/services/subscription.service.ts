import api from './api';

export interface SubscriptionPlan {
  id: number;
  name: string;
  slug: string;
  phoneScreeningsLimit: number;
  technicalInterviewsLimit: number;
  priceMonthly: number;
  priceYearly: number | null;
  features: string[];
}

export interface SubscriptionStatus {
  hasTrial: boolean;
  trialUsed: boolean;
  source: 'trial' | 'subscription' | 'none';
  canUsePhoneScreening: boolean;
  canUseTechnicalInterview: boolean;
  phoneScreeningsRemaining: number;
  technicalInterviewsRemaining: number;
  trial: {
    phoneScreeningsUsed: number;
    phoneScreeningsLimit: number;
    technicalInterviewsUsed: number;
    technicalInterviewsLimit: number;
  } | null;
  subscription: {
    plan: string;
    planSlug: string;
    phoneScreeningsUsed: number;
    phoneScreeningsLimit: number;
    technicalInterviewsUsed: number;
    technicalInterviewsLimit: number;
    periodEnd: string;
  } | null;
}

const subscriptionService = {
  getPlans: async (): Promise<{ plans: SubscriptionPlan[] }> => {
    const res = await api.get('/subscription/plans');
    return res.data;
  },

  getStatus: async (): Promise<SubscriptionStatus> => {
    const res = await api.get('/subscription/status');
    return res.data;
  },

  startTrial: async (): Promise<{ trial: { phoneScreeningsRemaining: number; technicalInterviewsRemaining: number } }> => {
    const res = await api.post('/subscription/trial/start');
    return res.data;
  },

  activatePlan: async (planId: number): Promise<{ message: string; subscription: { plan: string; periodEnd: string } }> => {
    const res = await api.post(`/subscription/activate/${planId}`);
    return res.data;
  }
};

export default subscriptionService;

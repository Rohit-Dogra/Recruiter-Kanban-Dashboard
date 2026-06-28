import api from './api';

export interface DashboardStats {
  activeJobs: number;
  totalCandidates: number;
  interviewsThisWeek: number;
  hiringSuccessRate: number;
  // Trend fields (percentage change)
  activeJobsTrend?: number;
  totalCandidatesTrend?: number;
  interviewsTrend?: number;
  hiringRateTrend?: number;
}

export interface RecentActivity {
  type: string;
  message: string;
  time: string;
  avatar: string;
  score: number;
}

export interface TopJob {
  id: number;
  title: string;
  location: string;
  applications: number;
  qualified: number;
  urgency: 'low' | 'medium' | 'high';
}

export interface JobApplication {
  id: number;
  candidateName: string;
  email: string;
  phone: string;
  status: string;
  appliedDate: string;
  aiScore: number;
  atsStatus?: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface JobWithApplications {
  id: number;
  title: string;
  applications: JobApplication[];
}

export interface AnalyticsData {
  kpiData: {
    timeToHire: string;
    hireRate: string;
    activeCandidates: string;
    pipelineVelocity: string;
    totalCandidates?: string;
    totalApplications?: string;
  };
  monthlyData: Array<{
    month: string;
    applications: number;
    hires: number;
  }>;
  pipelineData: Array<{
    stage: string;
    systemStatus?: string;
    count: number;
    color?: string;
    icon?: string;
  }>;
  sourceData: Array<{
    name: string;
    value: number;
    color: string;
    count?: number;
  }>;
  funnelMetrics?: {
    applied: number;
    screened: number;
    interviewed: number;
    offered: number;
    hired: number;
  };
  funnelConversion?: {
    appliedToHired: string;
    screenedToHired: string;
    interviewToHired: string;
  };
  timeToHireReport?: Array<{
    id: number;
    candidateId: number;
    appliedDate: string;
    updatedAt: string;
    daysToHire: number;
    jobTitle: string;
  }>;
  totalCandidatesFromTable?: number;
}

export const dashboardService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  async getRecentActivity(): Promise<RecentActivity[]> {
    const response = await api.get('/dashboard/activity');
    return response.data;
  },

  async getTopPerformingJobs(): Promise<TopJob[]> {
    const response = await api.get('/dashboard/top-jobs');
    return response.data;
  },

  async getApplicationsByJob(): Promise<JobWithApplications[]> {
    const response = await api.get('/dashboard/applications');
    return response.data;
  },

  async getAnalyticsData(): Promise<AnalyticsData> {
    const response = await api.get('/dashboard/analytics');
    return response.data;
  }
};
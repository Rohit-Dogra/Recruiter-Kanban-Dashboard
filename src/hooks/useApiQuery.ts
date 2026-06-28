import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

// ─── Query Key Constants ────────────────────────────────────────────────────

export const queryKeys = {
  jobs: ['jobs'] as const,
  job: (id: number) => ['jobs', id] as const,
  candidates: ['candidates'] as const,
  candidate: (id: number) => ['candidates', id] as const,
  applications: ['applications'] as const,
  applicationsByJob: (jobId: number) => ['applications', 'job', jobId] as const,
  notifications: ['notifications'] as const,
  unreadNotificationCount: ['notifications', 'unread-count'] as const,
  analytics: ['analytics'] as const,
  publicStats: ['public', 'stats'] as const,
  publicCompanies: ['public', 'companies'] as const,
  publicRecentJobs: ['public', 'recent-jobs'] as const,
  dashboardStats: ['dashboard', 'stats'] as const,
};

// ─── Stale Time Presets ─────────────────────────────────────────────────────

const STALE_TIMES = {
  /** Frequently changing data: notifications, applications */
  frequent: 30_000,
  /** Moderately changing data: jobs, candidates */
  moderate: 60_000,
  /** Relatively static data: analytics, public stats */
  stable: 5 * 60_000,
};

// ─── Query Hooks ────────────────────────────────────────────────────────────

/** Fetch all jobs (for the current user's company) */
export const useJobs = (filters?: Record<string, unknown>) =>
  useQuery({
    queryKey: filters ? [...queryKeys.jobs, filters] : queryKeys.jobs,
    queryFn: () => apiClient.get('/jobs', { params: filters }).then((r) => r.data),
    staleTime: STALE_TIMES.moderate,
  });

/** Fetch a single job by ID */
export const useJob = (id: number) =>
  useQuery({
    queryKey: queryKeys.job(id),
    queryFn: () => apiClient.get(`/jobs/${id}`).then((r) => r.data),
    staleTime: STALE_TIMES.moderate,
    enabled: !!id,
  });

/** Fetch all candidates */
export const useCandidates = (filters?: Record<string, unknown>) =>
  useQuery({
    queryKey: filters ? [...queryKeys.candidates, filters] : queryKeys.candidates,
    queryFn: () => apiClient.get('/candidates', { params: filters }).then((r) => r.data),
    staleTime: STALE_TIMES.moderate,
  });

/** Fetch a single candidate by ID */
export const useCandidate = (id: number) =>
  useQuery({
    queryKey: queryKeys.candidate(id),
    queryFn: () => apiClient.get(`/candidates/${id}`).then((r) => r.data),
    staleTime: STALE_TIMES.moderate,
    enabled: !!id,
  });

/** Fetch all applications for the current user */
export const useApplications = () =>
  useQuery({
    queryKey: queryKeys.applications,
    queryFn: () => apiClient.get('/applications').then((r) => r.data),
    staleTime: STALE_TIMES.frequent,
  });

/** Fetch applications for a specific job */
export const useApplicationsByJob = (jobId: number) =>
  useQuery({
    queryKey: queryKeys.applicationsByJob(jobId),
    queryFn: () => apiClient.get(`/applications/job/${jobId}`).then((r) => r.data),
    staleTime: STALE_TIMES.frequent,
    enabled: !!jobId,
  });

/** Fetch all notifications */
export const useNotifications = () =>
  useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => apiClient.get('/notifications').then((r) => r.data),
    staleTime: STALE_TIMES.frequent,
  });

/** Fetch unread notification count */
export const useUnreadNotificationCount = () =>
  useQuery({
    queryKey: queryKeys.unreadNotificationCount,
    queryFn: () => apiClient.get('/notifications/unread-count').then((r) => r.data),
    staleTime: STALE_TIMES.frequent,
    refetchInterval: 30_000,
  });

/** Fetch analytics data */
export const useAnalytics = () =>
  useQuery({
    queryKey: queryKeys.analytics,
    queryFn: () => apiClient.get('/dashboard/analytics').then((r) => r.data),
    staleTime: STALE_TIMES.stable,
  });

/** Fetch public landing page stats (no auth required) */
export const usePublicStats = () =>
  useQuery({
    queryKey: queryKeys.publicStats,
    queryFn: () => apiClient.get('/public/stats').then((r) => r.data),
    staleTime: STALE_TIMES.stable,
  });

/** Fetch public companies for landing page (no auth required) */
export const usePublicCompanies = () =>
  useQuery({
    queryKey: queryKeys.publicCompanies,
    queryFn: () => apiClient.get('/public/companies').then((r) => r.data),
    staleTime: STALE_TIMES.stable,
  });

/** Fetch recently posted jobs for landing page (no auth required) */
export const usePublicRecentJobs = () =>
  useQuery({
    queryKey: queryKeys.publicRecentJobs,
    queryFn: () => apiClient.get('/public/recent-jobs').then((r) => r.data),
    staleTime: STALE_TIMES.stable,
  });

/** Fetch dashboard summary stats */
export const useDashboardStats = () =>
  useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: () => apiClient.get('/dashboard/stats').then((r) => r.data),
    staleTime: STALE_TIMES.moderate,
  });

// ─── Mutation Hooks ─────────────────────────────────────────────────────────

/** Create a new job */
export const useCreateJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiClient.post('/jobs', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs });
    },
  });
};

/** Update an existing job */
export const useUpdateJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      apiClient.put(`/jobs/${id}`, data).then((r) => r.data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs });
      queryClient.invalidateQueries({ queryKey: queryKeys.job(variables.id) });
    },
  });
};

/** Update application status (e.g., pipeline stage change) */
export const useUpdateApplicationStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: number; status: string; notes?: string }) =>
      apiClient.put(`/applications/${id}/status`, { status, notes }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applications });
    },
  });
};

/** Mark a notification as read */
export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiClient.patch(`/notifications/${id}/read`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadNotificationCount });
    },
  });
};

import api from './api';

interface PipelineStage {
  id: string;
  title: string;
  color: string;
  icon: string;
  actionType: 'none' | 'email' | 'call' | 'interview';
  systemStatus: string;
}

const pipelineService = {
  getCompanyPipeline: async (companyId: number): Promise<PipelineStage[]> => {
    try {
      const response = await api.get(`/pipeline/company/${companyId}`);
      return response.data.pipeline;
    } catch (error) {
      return getDefaultPipeline();
    }
  },

  updateCompanyPipeline: async (companyId: number, stages: any[]) => {
    const response = await api.put(`/pipeline/company/${companyId}`, { stages });
    return response.data;
  }
};

const getDefaultPipeline = (): PipelineStage[] => [
  { id: "new", title: "Applied", color: "bg-blue-500", icon: "FileText", actionType: "none", systemStatus: "new" },
  { id: "reviewed", title: "Phone Screening", color: "bg-yellow-500", icon: "Phone", actionType: "call", systemStatus: "reviewed" },
  { id: "shortlisted", title: "Technical Interview", color: "bg-purple-500", icon: "Video", actionType: "interview", systemStatus: "shortlisted" },
  { id: "interview", title: "Final Review", color: "bg-orange-500", icon: "Users", actionType: "email", systemStatus: "interview" },
  { id: "offered", title: "Offer Extended", color: "bg-green-500", icon: "Award", actionType: "email", systemStatus: "offered" },
  { id: "hired", title: "Hired", color: "bg-emerald-600", icon: "CheckCircle", actionType: "email", systemStatus: "hired" }
];

export default pipelineService;
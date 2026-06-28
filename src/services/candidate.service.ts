import api from './api';

// Types
export interface CandidateData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  currentTitle?: string;
  currentCompany?: string;
  experience?: number;
  education?: string;
  skills?: string[];
  profileUrl?: string;
  avatarUrl?: string;
  notes?: string;
  source?: string;
}

export interface CandidateProfileUpdate extends Partial<CandidateData> {
  resumeUrl?: string;
}

export interface AIAnalysis {
  strengths: string;
  weaknesses: string;
  recommendation: string;
  fitScore: number;
}

export interface Candidate extends CandidateData {
  id: number;
  createdAt: string;
  updatedAt: string;
  atsScore?: number;
  skillsMatchPercentage?: number;
  aiScore?: number;
  aiNotes?: string;
  atsStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  resumeMatch?: number;
  skillsMatch?: Record<string, boolean>;
  aiAnalysis?: AIAnalysis;
}

// Candidate service methods
const candidateService = {
  // Get all candidates
  getAllCandidates: async (search?: string, skills?: string[], experience?: number) => {
    try {
      let queryParams = '';
      if (search) queryParams += `search=${encodeURIComponent(search)}&`;
      if (experience) queryParams += `experience=${experience}&`;
      
      const url = `/candidates${queryParams ? `?${queryParams.slice(0, -1)}` : ''}`;
      const response = await api.get<Candidate[]>(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get candidate by id
  getCandidateById: async (id: number) => {
    try {
      const response = await api.get<Candidate>(`/candidates/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create a new candidate
  createCandidate: async (candidateData: CandidateData) => {
    try {
      const response = await api.post<Candidate>('/candidates', candidateData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update candidate
  updateCandidate: async (id: number, candidateData: Partial<CandidateData>) => {
    try {
      const response = await api.put<Candidate>(`/candidates/${id}`, candidateData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete candidate
  deleteCandidate: async (id: number) => {
    try {
      const response = await api.delete(`/candidates/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update candidate profile
  updateProfile: async (profileData: CandidateProfileUpdate) => {
    try {
      const response = await api.put('/candidate-auth/profile', profileData);
      // Update profileCompleted status after successful profile update
      localStorage.setItem('profileCompleted', 'true');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get candidate profile
  getProfile: async () => {
    try {
      const response = await api.get('/candidate-auth/profile');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update AI analysis for candidate
  updateAIAnalysis: async (id: number, atsScore: number, aiAnalysis: AIAnalysis) => {
    try {
      const response = await api.put(`/candidates/${id}/ai-analysis`, {
        atsScore,
        aiAnalysis
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Generate AI analysis for candidate
  generateAIAnalysis: (candidate: Candidate, jobRequirements: any) => {
    const skills = candidate.skills || [];
    const experience = candidate.experience || 0;
    const jobSkills = jobRequirements.skills || [];
    
    // Calculate skill matches
    const matchedSkills = skills.filter(skill => 
      jobSkills.some((jobSkill: string) => 
        jobSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );
    
    const missingSkills = jobSkills.filter((jobSkill: string) => 
      !skills.some(skill => 
        skill.toLowerCase().includes(jobSkill.toLowerCase())
      )
    );
    
    // Calculate ATS score
    const skillMatchPercentage = jobSkills.length > 0 ? (matchedSkills.length / jobSkills.length) * 100 : 0;
    const experienceScore = Math.min((experience / (jobRequirements.minExperience || 1)) * 100, 100);
    const atsScore = Math.round((skillMatchPercentage * 0.6) + (experienceScore * 0.4));
    
    // Generate detailed analysis
    const strengths = [
      matchedSkills.length > 0 ? `Strong technical skills in ${matchedSkills.slice(0, 3).join(', ')}` : null,
      experience >= (jobRequirements.minExperience || 0) ? `${experience} years of relevant experience` : null,
      candidate.currentTitle ? `Current role as ${candidate.currentTitle}` : null,
      candidate.education ? 'Strong educational background' : null
    ].filter(Boolean).join('. ');
    
    const weaknesses = [
      missingSkills.length > 0 ? `Missing key skills: ${missingSkills.slice(0, 3).join(', ')}` : null,
      experience < (jobRequirements.minExperience || 0) ? `Limited experience (${experience} years vs ${jobRequirements.minExperience} required)` : null
    ].filter(Boolean).join('. ') || 'No significant weaknesses identified';
    
    const recommendation = atsScore >= 80 
      ? 'Highly recommended candidate with strong alignment to job requirements'
      : atsScore >= 60
      ? 'Good candidate with some skill gaps that could be addressed through training'
      : 'Consider for future opportunities or roles with different requirements';
    
    const fitScore = Math.round(atsScore * 0.9); // Slightly lower than ATS score
    
    return {
      atsScore,
      aiAnalysis: {
        strengths,
        weaknesses,
        recommendation,
        fitScore
      }
    };
  }
};

export default candidateService;

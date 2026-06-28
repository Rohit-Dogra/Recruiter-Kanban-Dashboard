import api from './api';

interface AnalysisResult {
  atsScore: number;
  skillsMatchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
  experienceRelevance: string;
  recommendation: string;
}

interface UploadResponse {
  success: boolean;
  message: string;
  resumeUrl: string;
  fileName: string;
  analysis?: AnalysisResult;
}

const uploadService = {
  // Upload resume
  uploadResume: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await api.post('/upload/resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000 // 30 second timeout
      });

      return response.data;
    } catch (error: any) {
      // Handle network errors
      if (error.code === 'ECONNABORTED') {
        throw new Error('Upload timeout - please try again');
      }
      
      // Handle server errors
      if (error.response?.status === 500) {
        const message = error.response.data?.message || 'Server error during upload';
        throw new Error(message);
      }
      
      // Handle validation errors
      if (error.response?.status === 400) {
        const message = error.response.data?.message || 'Invalid file';
        throw new Error(message);
      }
      
      throw error;
    }
  },

  // Upload and analyze resume
  uploadAndAnalyzeResume: async (
    file: File,
    jobDescription: string,
    jobSkills?: string[]
  ) => {
    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('jobDescription', jobDescription);
      if (jobSkills) {
        formData.append('jobSkills', JSON.stringify(jobSkills));
      }

      const response = await api.post<UploadResponse>(
        '/upload/analyze-resume',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Download resume
  downloadResume: async (fileName: string) => {
    try {
      const response = await api.get(`/upload/resume/${fileName}`, {
        responseType: 'blob'
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default uploadService;

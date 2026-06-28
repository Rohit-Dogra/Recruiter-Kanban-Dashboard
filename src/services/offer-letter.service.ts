import api from './api';

interface OfferLetterData {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  jobId?: string;
  applicationId?: string;
  salary: string;
  joiningDate: string;
  template?: string;
  benefits?: string;
  workLocation?: string;
}

interface OfferLetterResponse {
  success: boolean;
  message: string;
  offerId: string;
  emailMessageId: string;
  pdfPath: string;
}

class OfferLetterService {
  async generateAndSendOfferLetter(data: OfferLetterData): Promise<OfferLetterResponse> {
    try {
      const response = await api.post('/offer-letters/generate-and-send', {
        candidateId: parseInt(data.candidateId),
        jobId: data.jobId ? parseInt(data.jobId) : undefined,
        applicationId: data.applicationId ? parseInt(data.applicationId) : undefined,
        salary: data.salary,
        joiningDate: data.joiningDate,
        template: data.template || 'modern',
        workLocation: data.workLocation || 'Remote',
        benefits: data.benefits || 'Health Insurance, Provident Fund, Paid Time Off, Professional Development'
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error generating and sending offer letter:', error);
      throw new Error(error.response?.data?.message || 'Failed to generate and send offer letter');
    }
  }

  async getOfferLetters(params?: {
    page?: number;
    limit?: number;
    status?: string;
    candidateId?: string;
    jobId?: string;
  }) {
    try {
      const response = await api.get('/offer-letters', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching offer letters:', error);
      throw error;
    }
  }

  async getOfferLetter(id: string) {
    try {
      const response = await api.get(`/offer-letters/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching offer letter:', error);
      throw error;
    }
  }

  async getTemplates() {
    try {
      const response = await api.get('/offer-letters/templates');
      return response.data;
    } catch (error) {
      console.error('Error fetching templates:', error);
      return [
        { id: 'modern', name: 'Modern Professional' },
        { id: 'classic', name: 'Classic Corporate' },
        { id: 'executive', name: 'Executive Premium' }
      ];
    }
  }

  async sendOfferLetter(id: string): Promise<{ success: boolean; message: string; messageId: string }> {
    try {
      const response = await api.post(`/offer-letters/${id}/send`);
      return response.data;
    } catch (error: any) {
      console.error('Error sending offer letter:', error);
      throw new Error(error.response?.data?.message || 'Failed to send offer letter');
    }
  }

  async updateOfferStatus(id: string, status: 'accepted' | 'rejected', notes?: string) {
    try {
      const response = await api.patch(`/offer-letters/${id}/status`, { status, notes });
      return response.data;
    } catch (error: any) {
      console.error('Error updating offer status:', error);
      throw new Error(error.response?.data?.message || 'Failed to update offer status');
    }
  }

  async getOfferLetterStats() {
    try {
      const response = await api.get('/offer-letters/analytics/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching offer letter stats:', error);
      // Return default stats if API fails
      return {
        total: 0,
        sent: 0,
        accepted: 0,
        rejected: 0,
        pending: 0,
        acceptanceRate: 0
      };
    }
  }
}

export default new OfferLetterService();
import api from './api';

interface OfferLetterData {
  candidateId?: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  jobTitle: string;
  jobId?: string;
  applicationId?: string | number;
  salary: string;
  joiningDate: string;
  template?: string;
  benefits?: string;
  workLocation?: string;
  customizations?: object;
  sendEmail?: boolean;
}

interface OfferLetterResponse {
  success: boolean;
  message: string;
  data: {
    offerId: string;
    trackingToken: string;
    pdfUrl: string;
    s3Url?: string;
    s3Key?: string;
    s3Uploaded: boolean;
    emailSent: boolean;
    emailMessageId?: string;
    status: string;
    expiresAt: string;
  };
}

interface OfferLetterListResponse {
  offerLetters: any[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface OfferLetterPDFResponse {
  success: boolean;
  data: {
    pdfUrl: string;
    fileName: string;
    action: 'view' | 'download';
    source: 's3' | 'legacy';
  };
}

class OfferLetterConsolidatedService {
  private baseUrl = '/offer-letters';

  // Generate offer letter with enhanced features
  async generateOfferLetter(data: OfferLetterData): Promise<OfferLetterResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/generate`, {
        candidateName: data.candidateName,
        candidateEmail: data.candidateEmail,
        candidatePhone: data.candidatePhone,
        jobTitle: data.jobTitle,
        salary: data.salary,
        joiningDate: data.joiningDate,
        template: data.template || 'modern',
        workLocation: data.workLocation || 'Remote',
        benefits: data.benefits || 'Health Insurance, Provident Fund, Paid Time Off, Professional Development',
        customizations: data.customizations || {},
        candidateId: data.candidateId ? parseInt(data.candidateId) : undefined,
        jobId: data.jobId ? parseInt(data.jobId) : undefined,
        applicationId: data.applicationId ? (typeof data.applicationId === 'string' ? parseInt(data.applicationId) : data.applicationId) : undefined,
        sendEmail: data.sendEmail || false
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error generating offer letter:', error);
      throw new Error(error.response?.data?.message || 'Failed to generate offer letter');
    }
  }

  // Get all offer letters with enhanced filtering
  async getOfferLetters(params?: {
    page?: number;
    limit?: number;
    status?: string;
    candidateId?: string;
    applicationId?: number;
    jobId?: string;
    template?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }): Promise<OfferLetterListResponse> {
    try {
      const response = await api.get(this.baseUrl, { params });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching offer letters:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch offer letters');
    }
  }

  // Get specific offer letter
  async getOfferLetter(id: string) {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching offer letter:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch offer letter');
    }
  }

  // Get offer letter PDF URL for viewing or downloading
  async getOfferLetterPDF(id: string, action: 'view' | 'download' = 'view'): Promise<OfferLetterPDFResponse> {
    try {
      const response = await api.get(`${this.baseUrl}/${id}/pdf`, {
        params: { action }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching offer letter PDF:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch offer letter PDF');
    }
  }

  // Send offer letter via email
  async sendOfferLetter(id: string, customMessage?: string): Promise<{ success: boolean; message: string; data: any }> {
    try {
      const response = await api.post(`${this.baseUrl}/${id}/send`, {
        customMessage
      });
      return response.data;
    } catch (error: any) {
      console.error('Error sending offer letter:', error);
      throw new Error(error.response?.data?.message || 'Failed to send offer letter');
    }
  }

  // Update offer letter status
  async updateOfferStatus(id: string, status: 'accepted' | 'rejected' | 'viewed', notes?: string) {
    try {
      const response = await api.patch(`${this.baseUrl}/${id}/status`, { status, notes });
      return response.data;
    } catch (error: any) {
      console.error('Error updating offer status:', error);
      throw new Error(error.response?.data?.message || 'Failed to update offer status');
    }
  }

  // Get available templates
  async getTemplates() {
    try {
      const response = await api.get(`${this.baseUrl}/templates`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      // Return default templates if API fails
      return [
        { id: 'modern', name: 'Modern Professional', description: 'Clean and contemporary design' },
        { id: 'classic', name: 'Classic Corporate', description: 'Traditional business format' },
        { id: 'executive', name: 'Executive Premium', description: 'Elegant design for senior roles' },
        { id: 'creative', name: 'Creative Design', description: 'Modern design for creative roles' },
        { id: 'minimal', name: 'Minimal Clean', description: 'Simple and clean layout' }
      ];
    }
  }

  // Get offer letter analytics
  async getOfferLetterStats() {
    try {
      const response = await api.get(`${this.baseUrl}/analytics/stats`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching offer letter stats:', error);
      // Return default stats if API fails
      return {
        success: true,
        data: {
          total: 0,
          draft: 0,
          generated: 0,
          sent: 0,
          viewed: 0,
          accepted: 0,
          rejected: 0,
          expired: 0,
          acceptanceRate: 0
        }
      };
    }
  }

  // View offer letter PDF in browser
  async viewOfferLetterPDF(id: string): Promise<string> {
    try {
      const pdfResponse = await this.getOfferLetterPDF(id, 'view');
      return pdfResponse.data.pdfUrl;
    } catch (error) {
      throw new Error('Failed to get PDF URL for viewing');
    }
  }

  // Download offer letter PDF
  async downloadOfferLetterPDF(id: string): Promise<{ url: string; fileName: string }> {
    try {
      const pdfResponse = await this.getOfferLetterPDF(id, 'download');
      return {
        url: pdfResponse.data.pdfUrl,
        fileName: pdfResponse.data.fileName
      };
    } catch (error) {
      throw new Error('Failed to get PDF URL for download');
    }
  }

  // Legacy compatibility methods
  async generateAndSendOfferLetter(data: OfferLetterData): Promise<OfferLetterResponse> {
    return this.generateOfferLetter({ ...data, sendEmail: true });
  }
}

export default new OfferLetterConsolidatedService();
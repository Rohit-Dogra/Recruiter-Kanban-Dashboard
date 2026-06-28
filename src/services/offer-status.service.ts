import api from './api';

interface OfferLetterStatus {
  hasOffer: boolean;
  offerId?: string;
  status?: string;
  pdfUrl?: string;
  sentAt?: string;
  expiresAt?: string;
  salary?: number;
  joiningDate?: string;
  workLocation?: string;
  message?: string;
}

interface PipelineOfferLetter {
  id: string;
  candidateId: string;
  status: string;
  pdfUrl: string;
  sentAt: string;
  expiresAt: string;
  salary: number;
  joiningDate: string;
  workLocation: string;
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  job: {
    id: string;
    title: string;
  };
}

class OfferStatusService {
  async getCandidateOfferStatus(candidateId: string): Promise<OfferLetterStatus> {
    try {
      const response = await api.get(`/offer-letters/status/candidate/${candidateId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching offer status:', error);
      return {
        hasOffer: false,
        message: error.response?.data?.message || 'Failed to fetch offer status'
      };
    }
  }

  async getPipelineOfferLetters(): Promise<{ success: boolean; offerLetters: PipelineOfferLetter[] }> {
    try {
      const response = await api.get('/offer-letters/status/pipeline');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching pipeline offer letters:', error);
      return {
        success: false,
        offerLetters: []
      };
    }
  }

  async downloadOfferLetter(pdfUrl: string, candidateName: string, jobTitle: string): Promise<void> {
    try {
      const response = await fetch(pdfUrl);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Offer_Letter_${candidateName}_${jobTitle}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading offer letter:', error);
      throw new Error('Failed to download offer letter');
    }
  }
}

export default new OfferStatusService();
import api from './api';

class CandidateOfferLetterService {
  private baseUrl = '/candidate/offer-letters';

  // Get all offer letters for the authenticated candidate
  async getMyOfferLetters() {
    try {
      const response = await api.get(`${this.baseUrl}/my-offers`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching offer letters:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch offer letters');
    }
  }

  // Get offer letter by applicationId
  async getOfferLetterByApplication(applicationId: number) {
    try {
      const response = await api.get(`${this.baseUrl}/my-offers/application/${applicationId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching offer letter:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch offer letter');
    }
  }

  // Get PDF URL for viewing
  async getOfferLetterPDF(offerId: number) {
    try {
      const response = await api.get(`${this.baseUrl}/my-offers/${offerId}/pdf`);
      return response.data.data.pdfUrl;
    } catch (error: any) {
      console.error('Error fetching PDF:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch PDF');
    }
  }

  // Accept offer letter
  async acceptOffer(offerId: number, notes?: string) {
    try {
      const response = await api.patch(`${this.baseUrl}/my-offers/${offerId}/status`, {
        status: 'accepted',
        notes
      });
      return response.data;
    } catch (error: any) {
      console.error('Error accepting offer:', error);
      throw new Error(error.response?.data?.message || 'Failed to accept offer');
    }
  }

  // Reject offer letter
  async rejectOffer(offerId: number, notes?: string) {
    try {
      const response = await api.patch(`${this.baseUrl}/my-offers/${offerId}/status`, {
        status: 'rejected',
        notes
      });
      return response.data;
    } catch (error: any) {
      console.error('Error rejecting offer:', error);
      throw new Error(error.response?.data?.message || 'Failed to reject offer');
    }
  }
}

export default new CandidateOfferLetterService();

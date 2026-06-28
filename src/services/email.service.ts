import api from './api';

export interface EmailData {
  to: string;
  subject: string;
  content: string;
  candidateName: string;
}

const emailService = {
  async sendEmail(emailData: EmailData) {
    try {
      const response = await api.post('/email/send', emailData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default emailService;
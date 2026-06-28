import api from './api';

export const makeCall = async (
  phone: string,
   agentId: string = import.meta.env.VITE_BOLNA_AGENT_ID,
  userData?: any,
  jobId?: string
) => {
  const response = await api.post('/calls/make-call', {
    agent_id: agentId,
    recipient_phone: phone,
    user_data: userData,
    jobId
  });

  return response.data;
};

export const scheduleCall = async (
  phone: string,
  scheduledAt: string,
agentId: string = import.meta.env.VITE_BOLNA_AGENT_ID ,
  userData?: any,
  jobId?: string
) => {
  const response = await api.post('/calls/schedule-call', {
    agent_id: agentId,
    recipient_phone: phone,
    scheduled_at: scheduledAt,
    user_data: userData,
    jobId
  });

  return response.data;
};

const callService = {
  makeCall,
  scheduleCall
};

export default callService;

import api from './api';

export type PaymentGateway = 'razorpay' | 'phonepe';
export type BillingCycle = 'monthly' | 'yearly';

export interface InitiatePaymentParams {
  planId: number;
  gateway?: PaymentGateway;
  billingCycle?: BillingCycle;
}

export interface RazorpayCheckoutOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill?: { name?: string; email?: string };
}

export interface InitiatePaymentResponse {
  success: boolean;
  gateway: PaymentGateway;
  transactionId: string;
  // Razorpay-specific
  orderId?: string;
  checkoutOptions?: RazorpayCheckoutOptions;
  // PhonePe-specific
  redirectUrl?: string;
}

export const initiatePayment = async (params: InitiatePaymentParams): Promise<InitiatePaymentResponse> => {
  const res = await api.post('/payment/initiate', {
    planId: params.planId,
    gateway: params.gateway || 'razorpay',
    billingCycle: params.billingCycle || 'monthly',
  });
  return res.data;
};

export interface RazorpayCallbackParams {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  transactionId: string;
}

export const verifyRazorpayPayment = async (params: RazorpayCallbackParams) => {
  const res = await api.post('/payment/callback/razorpay', params);
  return res.data;
};

export const activateAfterPayment = async (transactionId: string) => {
  const res = await api.post('/payment/activate-after-payment', { transactionId });
  return res.data;
};

export const getPaymentStatus = async (transactionId: string) => {
  const res = await api.get(`/payment/status/${transactionId}`);
  return res.data;
};

export interface BillingHistoryItem {
  id: string;
  date: string;
  amount: number;
  status: string;
  gateway: string;
  billingCycle: string;
  planName: string;
}

export const getBillingHistory = async (): Promise<{ history: BillingHistoryItem[] }> => {
  const res = await api.get('/payment/history');
  return res.data;
};

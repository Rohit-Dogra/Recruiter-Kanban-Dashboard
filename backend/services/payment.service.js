const crypto = require('crypto');
const Razorpay = require('razorpay');
const axios = require('axios');
const db = require('../models');
const logger = require('../utils/logger');

// ─── Razorpay Adapter ───────────────────────────────────────────────────────

class RazorpayAdapter {
  constructor() {
    this.instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  async createOrder(amount, currency, receipt) {
    const options = {
      amount: Math.round(amount * 100), // Razorpay expects paise
      currency: currency || 'INR',
      receipt,
    };
    const order = await this.instance.orders.create(options);
    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      // Razorpay uses a popup checkout — return key + order details
      checkoutOptions: {
        key: process.env.RAZORPAY_KEY_ID,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        name: 'HirerMind',
        description: `Subscription - ${receipt}`,
      },
    };
  }

  verifySignature({ orderId, paymentId, signature }) {
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');
    return expectedSignature === signature;
  }
}

// ─── PhonePe Adapter ────────────────────────────────────────────────────────

class PhonePeAdapter {
  constructor() {
    this.merchantId = process.env.PHONEPE_MERCHANT_ID;
    this.saltKey = process.env.PHONEPE_SALT_KEY;
    this.saltIndex = process.env.PHONEPE_SALT_INDEX || '1';
    this.baseUrl = process.env.PHONEPE_BASE_URL || 'https://api.phonepe.com/apis/hermes';
  }

  async createOrder(amount, transactionId, callbackUrl, redirectUrl, userId) {
    const payload = {
      merchantId: this.merchantId,
      merchantTransactionId: transactionId,
      merchantUserId: String(userId),
      amount: Math.round(amount * 100), // PhonePe expects paise
      redirectUrl,
      redirectMode: 'REDIRECT',
      callbackUrl,
      paymentInstrument: { type: 'PAY_PAGE' },
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const endpoint = '/pg/v1/pay';
    const stringToHash = base64Payload + endpoint + this.saltKey;
    const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
    const xVerify = `${sha256}###${this.saltIndex}`;

    const response = await axios.post(`${this.baseUrl}${endpoint}`, { request: base64Payload }, {
      headers: { 'Content-Type': 'application/json', 'X-VERIFY': xVerify },
    });

    const redirectInfo = response.data?.data?.instrumentResponse?.redirectInfo;
    return {
      orderId: transactionId,
      redirectUrl: redirectInfo?.url || null,
    };
  }

  verifySignature(callbackData) {
    // PhonePe sends base64-encoded response; verify SHA256 checksum
    const { response: responseBase64, 'x-verify': xVerifyHeader } = callbackData;
    if (!responseBase64 || !xVerifyHeader) return false;

    const stringToHash = responseBase64 + '/pg/v1/pay/status' + this.saltKey;
    const expectedChecksum = crypto.createHash('sha256').update(stringToHash).digest('hex') + '###' + this.saltIndex;
    return expectedChecksum === xVerifyHeader;
  }

  decodeResponse(responseBase64) {
    try {
      return JSON.parse(Buffer.from(responseBase64, 'base64').toString('utf-8'));
    } catch {
      return null;
    }
  }
}

// ─── Gateway Factory ────────────────────────────────────────────────────────

class PaymentGatewayFactory {
  static getGateway(gatewayName) {
    if (gatewayName === 'phonepe') return new PhonePeAdapter();
    return new RazorpayAdapter(); // default
  }
}

// ─── Subscription Activation Helper ─────────────────────────────────────────

async function activateSubscription(txn, billingCycle) {
  const now = new Date();
  const periodEnd = new Date(now);
  if (billingCycle === 'yearly') {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  let sub = await db.user_subscription.findOne({ where: { userId: txn.userId } });
  const subData = {
    planId: txn.planId,
    status: 'active',
    phoneScreeningsUsed: 0,
    technicalInterviewsUsed: 0,
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
  };

  if (sub) {
    await sub.update(subData);
  } else {
    await db.user_subscription.create({ userId: txn.userId, ...subData });
  }
}

module.exports = {
  RazorpayAdapter,
  PhonePeAdapter,
  PaymentGatewayFactory,
  activateSubscription,
};

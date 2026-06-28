const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../models');
const { authenticate } = require('../middleware/auth.middleware');
const { PaymentGatewayFactory, activateSubscription } = require('../services/payment.service');
const logger = require('../utils/logger');

const FRONTEND_URL = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';
const API_URL = process.env.API_URL || 'http://localhost:8080';
const PAYMENT_TIMEOUT_MS = 30000;

// ─── POST /initiate ─────────────────────────────────────────────────────────
router.post('/initiate', authenticate, async (req, res) => {
  try {
    const { planId, gateway = 'razorpay', billingCycle = 'monthly' } = req.body;
    const userId = req.user.id;

    if (!planId) return res.status(400).json({ message: 'Plan ID required' });
    if (!['razorpay', 'phonepe'].includes(gateway)) {
      return res.status(400).json({ message: 'Invalid gateway. Use razorpay or phonepe' });
    }
    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return res.status(400).json({ message: 'Invalid billing cycle. Use monthly or yearly' });
    }

    const plan = await db.subscription_plan.findByPk(planId);
    if (!plan || plan.slug === 'free') return res.status(400).json({ message: 'Invalid plan' });

    const amount = billingCycle === 'yearly'
      ? parseFloat(plan.priceYearly || plan.priceMonthly * 12)
      : parseFloat(plan.priceMonthly);

    const merchantTransactionId = `SUB_${userId}_${planId}_${Date.now()}`;

    // Create payment transaction with INITIATED status
    const txn = await db.payment_transaction.create({
      userId,
      planId,
      merchantTransactionId,
      amount,
      status: 'INITIATED',
      paymentType: 'subscription',
      gateway,
      billingCycle,
      metadata: { planName: plan.name, planSlug: plan.slug, billingCycle },
    });

    const gatewayAdapter = PaymentGatewayFactory.getGateway(gateway);

    let responseData;

    if (gateway === 'razorpay') {
      const orderResult = await gatewayAdapter.createOrder(amount, 'INR', merchantTransactionId);
      await txn.update({ gatewayOrderId: orderResult.orderId });

      responseData = {
        success: true,
        gateway: 'razorpay',
        transactionId: merchantTransactionId,
        orderId: orderResult.orderId,
        checkoutOptions: {
          ...orderResult.checkoutOptions,
          prefill: { name: req.user.firstName || '', email: req.user.email || '' },
        },
      };
    } else {
      // PhonePe redirect flow
      const callbackUrl = `${API_URL}/api/payment/callback/phonepe`;
      const redirectUrl = `${FRONTEND_URL}/dashboard/payment/response?transactionId=${merchantTransactionId}&gateway=phonepe`;

      const orderResult = await gatewayAdapter.createOrder(
        amount, merchantTransactionId, callbackUrl, redirectUrl, userId
      );
      await txn.update({ gatewayOrderId: orderResult.orderId });

      if (!orderResult.redirectUrl) {
        await txn.update({ status: 'FAILED' });
        return res.status(500).json({ message: 'PhonePe order creation failed' });
      }

      responseData = {
        success: true,
        gateway: 'phonepe',
        transactionId: merchantTransactionId,
        redirectUrl: orderResult.redirectUrl,
      };
    }

    // Set timeout to mark as TIMEOUT if not completed
    setTimeout(async () => {
      try {
        const freshTxn = await db.payment_transaction.findByPk(txn.id);
        if (freshTxn && freshTxn.status === 'INITIATED') {
          await freshTxn.update({ status: 'TIMEOUT' });
          logger.info(`Payment ${merchantTransactionId} timed out after ${PAYMENT_TIMEOUT_MS}ms`);
        }
      } catch (err) {
        logger.error('Payment timeout handler error:', err.message);
      }
    }, PAYMENT_TIMEOUT_MS);

    res.json(responseData);
  } catch (err) {
    logger.error('Payment initiate error:', err);
    res.status(500).json({ message: 'Payment initiation failed' });
  }
});

// ─── POST /callback/razorpay ────────────────────────────────────────────────
router.post('/callback/razorpay', authenticate, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, transactionId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !transactionId) {
      return res.status(400).json({ message: 'Missing required callback parameters' });
    }

    const txn = await db.payment_transaction.findOne({
      where: { merchantTransactionId: transactionId, gateway: 'razorpay' },
    });
    if (!txn) return res.status(404).json({ message: 'Transaction not found' });

    // Idempotency: if already completed, return success
    if (txn.status === 'COMPLETED') {
      return res.json({ success: true, message: 'Payment already processed' });
    }

    const gateway = PaymentGatewayFactory.getGateway('razorpay');
    const isValid = gateway.verifySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    await txn.update({
      status: 'COMPLETED',
      gatewayPaymentId: razorpay_payment_id,
      gatewaySignature: razorpay_signature,
      paymentId: razorpay_payment_id,
    });

    await activateSubscription(txn, txn.billingCycle || 'monthly');

    const plan = await db.subscription_plan.findByPk(txn.planId);
    res.json({
      success: true,
      message: 'Payment verified and subscription activated',
      plan: plan ? {
        name: plan.name,
        phoneScreeningsLimit: plan.phoneScreeningsLimit,
        technicalInterviewsLimit: plan.technicalInterviewsLimit,
      } : null,
    });
  } catch (err) {
    logger.error('Razorpay callback error:', err);
    res.status(500).json({ message: 'Payment verification failed' });
  }
});

// ─── POST /callback/phonepe ─────────────────────────────────────────────────
router.post('/callback/phonepe', async (req, res) => {
  try {
    const responseBase64 = req.body.response;
    const xVerifyHeader = req.headers['x-verify'] || req.body['x-verify'];

    if (!responseBase64) {
      return res.status(400).json({ message: 'Missing callback response' });
    }

    const gateway = PaymentGatewayFactory.getGateway('phonepe');
    const isValid = gateway.verifySignature({ response: responseBase64, 'x-verify': xVerifyHeader });

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid PhonePe checksum' });
    }

    const decoded = gateway.decodeResponse(responseBase64);
    if (!decoded) {
      return res.status(400).json({ message: 'Invalid callback payload' });
    }

    const merchantTransactionId = decoded.data?.merchantTransactionId;
    if (!merchantTransactionId) {
      return res.status(400).json({ message: 'Missing transaction ID in callback' });
    }

    const txn = await db.payment_transaction.findOne({
      where: { merchantTransactionId, gateway: 'phonepe' },
    });
    if (!txn) return res.status(404).json({ message: 'Transaction not found' });

    // Idempotency
    if (txn.status === 'COMPLETED') {
      return res.json({ success: true, message: 'Payment already processed' });
    }

    const isSuccess = decoded.code === 'PAYMENT_SUCCESS' || decoded.success === true;

    if (isSuccess) {
      await txn.update({
        status: 'COMPLETED',
        gatewayPaymentId: decoded.data?.transactionId || null,
        paymentId: decoded.data?.transactionId || null,
      });
      await activateSubscription(txn, txn.billingCycle || 'monthly');
    } else {
      await txn.update({ status: 'FAILED' });
    }

    res.json({ success: true });
  } catch (err) {
    logger.error('PhonePe callback error:', err);
    res.status(500).json({ message: 'PhonePe callback processing failed' });
  }
});

// ─── POST /webhook/razorpay ─────────────────────────────────────────────────
router.post('/webhook/razorpay', async (req, res) => {
  try {
    // Verify webhook signature from Razorpay
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    const receivedSignature = req.headers['x-razorpay-signature'];

    if (webhookSecret && receivedSignature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');
      if (expectedSignature !== receivedSignature) {
        return res.status(400).json({ message: 'Invalid webhook signature' });
      }
    }

    const event = req.body.event;
    const payment = req.body.payload?.payment?.entity;

    if (!payment) {
      return res.status(200).json({ success: true, message: 'No payment entity' });
    }

    const orderId = payment.order_id;
    if (!orderId) {
      return res.status(200).json({ success: true, message: 'No order ID' });
    }

    const txn = await db.payment_transaction.findOne({
      where: { gatewayOrderId: orderId, gateway: 'razorpay' },
    });
    if (!txn) {
      return res.status(200).json({ success: true, message: 'Transaction not found' });
    }

    // Idempotency: skip if already in terminal state
    if (txn.status === 'COMPLETED' || txn.status === 'FAILED') {
      return res.status(200).json({ success: true, message: 'Already processed' });
    }

    if (event === 'payment.captured') {
      await txn.update({
        status: 'COMPLETED',
        gatewayPaymentId: payment.id,
        paymentId: payment.id,
      });
      await activateSubscription(txn, txn.billingCycle || 'monthly');
    } else if (event === 'payment.failed') {
      await txn.update({ status: 'FAILED' });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    logger.error('Razorpay webhook error:', err);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

// ─── POST /webhook/phonepe ──────────────────────────────────────────────────
router.post('/webhook/phonepe', async (req, res) => {
  try {
    const responseBase64 = req.body.response;
    const xVerifyHeader = req.headers['x-verify'] || req.body['x-verify'];

    if (!responseBase64) {
      return res.status(200).json({ success: true, message: 'No response payload' });
    }

    const gateway = PaymentGatewayFactory.getGateway('phonepe');
    const isValid = gateway.verifySignature({ response: responseBase64, 'x-verify': xVerifyHeader });

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid webhook checksum' });
    }

    const decoded = gateway.decodeResponse(responseBase64);
    if (!decoded) {
      return res.status(200).json({ success: true, message: 'Invalid payload' });
    }

    const merchantTransactionId = decoded.data?.merchantTransactionId;
    if (!merchantTransactionId) {
      return res.status(200).json({ success: true, message: 'No transaction ID' });
    }

    const txn = await db.payment_transaction.findOne({
      where: { merchantTransactionId, gateway: 'phonepe' },
    });
    if (!txn) {
      return res.status(200).json({ success: true, message: 'Transaction not found' });
    }

    // Idempotency
    if (txn.status === 'COMPLETED' || txn.status === 'FAILED') {
      return res.status(200).json({ success: true, message: 'Already processed' });
    }

    const isSuccess = decoded.code === 'PAYMENT_SUCCESS' || decoded.success === true;

    if (isSuccess) {
      await txn.update({
        status: 'COMPLETED',
        gatewayPaymentId: decoded.data?.transactionId || null,
        paymentId: decoded.data?.transactionId || null,
      });
      await activateSubscription(txn, txn.billingCycle || 'monthly');
    } else {
      await txn.update({ status: 'FAILED' });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    logger.error('PhonePe webhook error:', err);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

// ─── POST /activate-after-payment (kept from original) ──────────────────────
router.post('/activate-after-payment', authenticate, async (req, res) => {
  try {
    const { transactionId } = req.body;
    const userId = req.user.id;
    if (!transactionId) return res.status(400).json({ message: 'Transaction ID required' });

    const txn = await db.payment_transaction.findOne({
      where: { merchantTransactionId: transactionId, userId },
      include: [{ model: db.subscription_plan, as: 'plan' }],
    });
    if (!txn) return res.status(404).json({ message: 'Payment not found' });

    if (txn.status === 'COMPLETED') {
      // Already completed — ensure subscription is active
      await activateSubscription(txn, txn.billingCycle || 'monthly');
    } else if (txn.status === 'INITIATED' || txn.status === 'TIMEOUT') {
      // For redirect flows (PhonePe), the callback may not have arrived yet
      // Mark as completed if user landed on success page
      await txn.update({ status: 'COMPLETED' });
      await activateSubscription(txn, txn.billingCycle || 'monthly');
    }

    const plan = txn.plan || await db.subscription_plan.findByPk(txn.planId);
    res.json({
      success: true,
      message: 'Subscription activated',
      plan: plan ? {
        name: plan.name,
        phoneScreeningsLimit: plan.phoneScreeningsLimit,
        technicalInterviewsLimit: plan.technicalInterviewsLimit,
      } : null,
    });
  } catch (err) {
    logger.error('Activate error:', err);
    res.status(500).json({ message: 'Activation failed' });
  }
});

// ─── GET /history ───────────────────────────────────────────────────────────
router.get('/history', authenticate, async (req, res) => {
  try {
    const userId = req.user.companyId ?? req.user.invitedByUserId ?? req.user.id;
    const transactions = await db.payment_transaction.findAll({
      where: { userId, status: ['COMPLETED', 'FAILED', 'TIMEOUT'] },
      order: [['createdAt', 'DESC']],
      limit: 50,
      include: [{ model: db.subscription_plan, as: 'plan', attributes: ['name', 'slug'] }],
    });

    const history = transactions.map((t) => ({
      id: t.merchantTransactionId,
      date: t.createdAt,
      amount: parseFloat(t.amount),
      status: t.status,
      gateway: t.gateway,
      billingCycle: t.billingCycle || 'monthly',
      planName: t.plan?.name || t.metadata?.planName || 'Unknown',
    }));

    res.json({ success: true, history });
  } catch (err) {
    logger.error('Payment history error:', err);
    res.status(500).json({ message: 'Failed to fetch payment history' });
  }
});

// ─── GET /status/:transactionId ─────────────────────────────────────────────
router.get('/status/:transactionId', authenticate, async (req, res) => {
  try {
    const txn = await db.payment_transaction.findOne({
      where: { merchantTransactionId: req.params.transactionId, userId: req.user.id },
    });
    if (!txn) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ success: true, status: txn.status, gateway: txn.gateway });
  } catch (err) {
    logger.error('Payment status error:', err);
    res.status(500).json({ message: 'Failed to get payment status' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticate } = require('../middleware/auth.middleware');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validation.middleware');

// Seed default plans if not exist
async function seedPlansIfNeeded() {
  try {
    const count = await db.subscription_plan.count();
    if (count === 0) {
      await db.subscription_plan.bulkCreate([
      { name: 'Free', slug: 'free', phoneScreeningsLimit: 0, technicalInterviewsLimit: 0, membersLimit: 1, priceMonthly: 0, priceYearly: 0, features: ['2 Phone Screenings (Trial)', '1 Technical Interview (Trial)'], sortOrder: 0 },
      { name: 'Silver', slug: 'silver', phoneScreeningsLimit: 10, technicalInterviewsLimit: 5, membersLimit: 3, priceMonthly: 999, priceYearly: 9990, features: ['10 Phone Screenings/month', '5 Technical Interviews/month', '3 Team Members', 'Basic Analytics', 'Email Support'], sortOrder: 1 },
      { name: 'Gold', slug: 'gold', phoneScreeningsLimit: 30, technicalInterviewsLimit: 15, membersLimit: 5, priceMonthly: 2499, priceYearly: 24990, features: ['30 Phone Screenings/month', '15 Technical Interviews/month', '5 Team Members', 'Advanced Analytics', 'Priority Support', 'AI Insights'], sortOrder: 2 },
      { name: 'Diamond', slug: 'diamond', phoneScreeningsLimit: 100, technicalInterviewsLimit: 50, membersLimit: 10, priceMonthly: 4999, priceYearly: 49990, features: ['100 Phone Screenings/month', '50 Technical Interviews/month', '10 Team Members', 'Full Analytics Dashboard', '24/7 Support', 'Custom Integrations', 'Dedicated Account Manager'], sortOrder: 3 }
    ]);
    }
  } catch (seedErr) {
    console.warn('Could not seed plans:', seedErr.message);
  }
}

// Get all subscription plans (public - for pricing page)
router.get('/plans', async (req, res) => {
  try {
    if (!db.subscription_plan) {
      return res.json({ plans: [] });
    }
    await seedPlansIfNeeded();
    const plans = await db.subscription_plan.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC']],
      attributes: ['id', 'name', 'slug', 'phoneScreeningsLimit', 'technicalInterviewsLimit', 'membersLimit', 'priceMonthly', 'priceYearly', 'features']
    });

    const formatted = (plans || []).map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      phoneScreeningsLimit: p.phoneScreeningsLimit,
      technicalInterviewsLimit: p.technicalInterviewsLimit,
      membersLimit: p.membersLimit || (p.slug === 'silver' ? 3 : p.slug === 'gold' ? 5 : p.slug === 'diamond' ? 10 : 1),
      priceMonthly: parseFloat(p.priceMonthly),
      priceYearly: p.priceYearly ? parseFloat(p.priceYearly) : null,
      features: p.features || []
    }));

    res.json({ plans: formatted });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ message: 'Error fetching subscription plans' });
  }
});

// Get current user's subscription/trial status (invited users see owner's subscription)
router.get('/status', authenticate, async (req, res) => {
  const userId = req.user.companyId ?? req.user.invitedByUserId ?? req.user.id;
  const safeDefaults = {
    hasTrial: false,
    trialUsed: false,
    source: 'none',
    canUsePhoneScreening: false,
    canUseTechnicalInterview: false,
    phoneScreeningsRemaining: 0,
    technicalInterviewsRemaining: 0,
    trial: null,
    subscription: null
  };

  try {
    let trial = null;
    let activeSubscription = null;

    if (db.user_trial && db.user_subscription) {
      [trial, activeSubscription] = await Promise.all([
        db.user_trial.findOne({ where: { userId } }),
        db.user_subscription.findOne({
          where: { userId, status: 'active' },
          include: [{ model: db.subscription_plan, as: 'plan' }]
        })
      ]);
    }

    let canUsePhoneScreening = false;
    let canUseTechnicalInterview = false;
    let phoneScreeningsRemaining = 0;
    let technicalInterviewsRemaining = 0;
    let source = 'none'; // 'trial' | 'subscription' | 'none'
    let hasTrial = false;
    let trialUsed = false;

    // Check trial first
    if (trial) {
      hasTrial = true;
      trialUsed = true;
      const phoneRemaining = Math.max(0, trial.phoneScreeningsLimit - trial.phoneScreeningsUsed);
      const techRemaining = Math.max(0, trial.technicalInterviewsLimit - trial.technicalInterviewsUsed);

      if (phoneRemaining > 0 || techRemaining > 0) {
        source = 'trial';
        canUsePhoneScreening = phoneRemaining > 0;
        canUseTechnicalInterview = techRemaining > 0;
        phoneScreeningsRemaining = phoneRemaining;
        technicalInterviewsRemaining = techRemaining;
      }
    }

    // Check subscription (overrides trial if has limits)
    if (activeSubscription && activeSubscription.plan) {
      const plan = activeSubscription.plan;
      const subPhoneRemaining = Math.max(0, plan.phoneScreeningsLimit - activeSubscription.phoneScreeningsUsed);
      const subTechRemaining = Math.max(0, plan.technicalInterviewsLimit - activeSubscription.technicalInterviewsUsed);

      if (plan.phoneScreeningsLimit > 0 || plan.technicalInterviewsLimit > 0) {
        source = 'subscription';
        canUsePhoneScreening = canUsePhoneScreening || subPhoneRemaining > 0;
        canUseTechnicalInterview = canUseTechnicalInterview || subTechRemaining > 0;
        phoneScreeningsRemaining = Math.max(phoneScreeningsRemaining, subPhoneRemaining);
        technicalInterviewsRemaining = Math.max(technicalInterviewsRemaining, subTechRemaining);
      }
    }

    res.json({
      hasTrial,
      trialUsed,
      source,
      canUsePhoneScreening,
      canUseTechnicalInterview,
      phoneScreeningsRemaining,
      technicalInterviewsRemaining,
      trial: trial ? {
        phoneScreeningsUsed: trial.phoneScreeningsUsed,
        phoneScreeningsLimit: trial.phoneScreeningsLimit,
        technicalInterviewsUsed: trial.technicalInterviewsUsed,
        technicalInterviewsLimit: trial.technicalInterviewsLimit
      } : null,
      subscription: activeSubscription ? {
        plan: activeSubscription.plan?.name,
        planSlug: activeSubscription.plan?.slug,
        phoneScreeningsUsed: activeSubscription.phoneScreeningsUsed,
        phoneScreeningsLimit: activeSubscription.plan?.phoneScreeningsLimit,
        technicalInterviewsUsed: activeSubscription.technicalInterviewsUsed,
        technicalInterviewsLimit: activeSubscription.plan?.technicalInterviewsLimit,
        periodEnd: activeSubscription.currentPeriodEnd
      } : null
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return res.json(safeDefaults);
  }
});

// Activate/Select a plan (creates subscription - for demo without payment)
router.post('/activate/:planId', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const planId = parseInt(req.params.planId);

    const plan = await db.subscription_plan.findByPk(planId);
    if (!plan || plan.slug === 'free') {
      return res.status(400).json({ message: 'Invalid plan' });
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    let sub = await db.user_subscription.findOne({ where: { userId } });
    if (sub) {
      await sub.update({
        planId,
        status: 'active',
        phoneScreeningsUsed: 0,
        technicalInterviewsUsed: 0,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd
      });
    } else {
      sub = await db.user_subscription.create({
        userId,
        planId,
        status: 'active',
        phoneScreeningsUsed: 0,
        technicalInterviewsUsed: 0,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd
      });
    }

    res.json({
      message: `${plan.name} plan activated successfully`,
      subscription: {
        plan: plan.name,
        periodEnd: periodEnd.toISOString()
      }
    });
  } catch (error) {
    console.error('Error activating plan:', error);
    res.status(500).json({ message: 'Error activating plan' });
  }
});

// Start free trial
router.post('/trial/start', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const existingTrial = await db.user_trial.findOne({ where: { userId } });
    if (existingTrial) {
      return res.status(400).json({
        message: 'You have already used your free trial',
        trial: {
          phoneScreeningsUsed: existingTrial.phoneScreeningsUsed,
          phoneScreeningsLimit: existingTrial.phoneScreeningsLimit,
          technicalInterviewsUsed: existingTrial.technicalInterviewsUsed,
          technicalInterviewsLimit: existingTrial.technicalInterviewsLimit
        }
      });
    }

    const trial = await db.user_trial.create({
      userId,
      phoneScreeningsUsed: 0,
      technicalInterviewsUsed: 0,
      phoneScreeningsLimit: 2,
      technicalInterviewsLimit: 1,
      startedAt: new Date()
    });

    res.json({
      message: 'Free trial started successfully',
      trial: {
        phoneScreeningsRemaining: 2,
        technicalInterviewsRemaining: 1
      }
    });
  } catch (error) {
    console.error('Error starting trial:', error);
    res.status(500).json({ message: 'Error starting free trial' });
  }
});

// Check if user can use a feature (internal - called before allowing action)
// Returns { allowed: boolean, source: 'trial'|'subscription', message?: string }
async function checkCanUse(userId, type) {
  const trial = await db.user_trial.findOne({ where: { userId } });
  const activeSub = await db.user_subscription.findOne({
    where: { userId, status: 'active' },
    include: [{ model: db.subscription_plan, as: 'plan' }]
  });

  if (type === 'phone_screening') {
    if (trial && trial.phoneScreeningsUsed < trial.phoneScreeningsLimit) {
      return { allowed: true, source: 'trial' };
    }
    if (activeSub?.plan && activeSub.phoneScreeningsUsed < activeSub.plan.phoneScreeningsLimit) {
      return { allowed: true, source: 'subscription' };
    }
  } else if (type === 'technical_interview') {
    if (trial && trial.technicalInterviewsUsed < trial.technicalInterviewsLimit) {
      return { allowed: true, source: 'trial' };
    }
    if (activeSub?.plan && activeSub.technicalInterviewsUsed < activeSub.plan.technicalInterviewsLimit) {
      return { allowed: true, source: 'subscription' };
    }
  }

  const hasTrial = !!trial;
  return {
    allowed: false,
    hasTrial,
    message: hasTrial
      ? 'Your free trial has been used. Please subscribe to continue.'
      : 'Please start your free trial or subscribe to use this feature.'
  };
}

// Record usage after successful action
async function recordUsage(userId, type, source) {
  if (type === 'phone_screening') {
    if (source === 'trial') {
      const trial = await db.user_trial.findOne({ where: { userId } });
      if (trial) {
        await trial.increment('phoneScreeningsUsed');
      }
    } else if (source === 'subscription') {
      const sub = await db.user_subscription.findOne({ where: { userId, status: 'active' } });
      if (sub) {
        await sub.increment('phoneScreeningsUsed');
      }
    }
  } else if (type === 'technical_interview') {
    if (source === 'trial') {
      const trial = await db.user_trial.findOne({ where: { userId } });
      if (trial) {
        await trial.increment('technicalInterviewsUsed');
      }
    } else if (source === 'subscription') {
      const sub = await db.user_subscription.findOne({ where: { userId, status: 'active' } });
      if (sub) {
        await sub.increment('technicalInterviewsUsed');
      }
    }
  }

}

module.exports = router;
module.exports.checkCanUse = checkCanUse;
module.exports.recordUsage = recordUsage;

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const db = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

// ─── GET /stats — enhanced system-wide statistics ───────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);

    const [
      totalUsers, activeJobs, totalApplications, revenueResult,
      newUsersThisMonth, newUsersPrevMonth,
      newJobsThisMonth, newJobsPrevMonth,
      newAppsThisMonth, newAppsPrevMonth,
      totalCompanies, totalCandidates, totalInterviews,
      activeSubscriptions
    ] = await Promise.all([
      db.user.count(),
      db.job.count({ where: { status: 'active' } }),
      db.application.count(),
      db.payment_transaction.findAll({
        where: { status: 'COMPLETED' },
        attributes: [[db.sequelize.fn('SUM', db.sequelize.col('amount')), 'total']],
        raw: true,
      }),
      db.user.count({ where: { createdAt: { [Op.gte]: thirtyDaysAgo } } }),
      db.user.count({ where: { createdAt: { [Op.between]: [sixtyDaysAgo, thirtyDaysAgo] } } }),
      db.job.count({ where: { createdAt: { [Op.gte]: thirtyDaysAgo } } }),
      db.job.count({ where: { createdAt: { [Op.between]: [sixtyDaysAgo, thirtyDaysAgo] } } }),
      db.application.count({ where: { createdAt: { [Op.gte]: thirtyDaysAgo } } }),
      db.application.count({ where: { createdAt: { [Op.between]: [sixtyDaysAgo, thirtyDaysAgo] } } }),
      db.Company ? db.Company.count().catch(() => 0) : Promise.resolve(0),
      db.user.count({ where: { userType: 'candidate' } }),
      db.interview ? db.interview.count().catch(() => 0) : Promise.resolve(0),
      db.user_subscription ? db.user_subscription.count({ where: { status: 'active' } }).catch(() => 0) : Promise.resolve(0),
    ]);

    const calcTrend = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    res.json({
      success: true,
      data: {
        totalUsers,
        activeJobs,
        totalApplications,
        revenue: parseFloat(revenueResult[0]?.total) || 0,
        totalCompanies,
        totalCandidates,
        totalInterviews,
        activeSubscriptions,
        trends: {
          users: calcTrend(newUsersThisMonth, newUsersPrevMonth),
          jobs: calcTrend(newJobsThisMonth, newJobsPrevMonth),
          applications: calcTrend(newAppsThisMonth, newAppsPrevMonth),
        },
      },
    });
  } catch (error) {
    logger.error('Admin stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// ─── GET /stats/chart — monthly registration & application data ─────────────
router.get('/stats/chart', async (req, res) => {
  try {
    const months = 6;
    const data = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const label = start.toLocaleString('default', { month: 'short', year: '2-digit' });

      const [users, jobs, applications] = await Promise.all([
        db.user.count({ where: { createdAt: { [Op.between]: [start, end] } } }),
        db.job.count({ where: { createdAt: { [Op.between]: [start, end] } } }),
        db.application.count({ where: { createdAt: { [Op.between]: [start, end] } } }),
      ]);

      data.push({ month: label, users, jobs, applications });
    }

    res.json({ success: true, data });
  } catch (error) {
    logger.error('Admin chart stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch chart data' });
  }
});


// ─── GET /users — paginated user list with search & filter ──────────────────
router.get('/users', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const userType = req.query.userType || '';

    const where = {};
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }
    if (userType && ['company', 'candidate', 'admin'].includes(userType)) {
      where.userType = userType;
    }

    const { count, rows } = await db.user.findAndCountAll({
      where,
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire'] },
      include: [
        {
          model: db.user_subscription,
          as: 'subscriptions',
          where: { status: 'active' },
          required: false,
          limit: 1,
          order: [['createdAt', 'DESC']],
          include: [{ model: db.subscription_plan, as: 'plan', attributes: ['name', 'slug'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      success: true,
      data: {
        users: rows,
        pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
      },
    });
  } catch (error) {
    logger.error('Admin users list error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// ─── GET /users/:id — single user detail ────────────────────────────────────
router.get('/users/:id', async (req, res) => {
  try {
    const user = await db.user.findByPk(parseInt(req.params.id), {
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire'] },
      include: [
        { model: db.user_subscription, as: 'subscriptions', required: false, include: [{ model: db.subscription_plan, as: 'plan' }] },
      ],
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    logger.error('Admin user detail error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
});

// ─── PUT /users/:id — update user ──────────────────────────────────────────
router.put('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { userType, firstName, lastName, email, role } = req.body;

    const user = await db.user.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const updates = {};
    if (userType !== undefined) updates.userType = userType;
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (email !== undefined) updates.email = email;
    if (role !== undefined) updates.role = role;

    await user.update(updates);
    logger.info(`Admin action: user ${req.user.id} updated user ${userId}`, { adminId: req.user.id, targetUserId: userId, changes: updates });

    res.json({ success: true, message: 'User updated successfully', data: { id: user.id, ...updates } });
  } catch (error) {
    logger.error('Admin update user error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

// ─── DELETE /users/:id — delete user ────────────────────────────────────────
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (userId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
    }

    const user = await db.user.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await user.destroy();
    logger.info(`Admin action: user ${req.user.id} deleted user ${userId}`);

    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    logger.error('Admin delete user error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
});

// ─── GET /jobs — all jobs with search, filter, pagination ───────────────────
router.get('/jobs', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';

    const where = {};
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { company: { [Op.like]: `%${search}%` } },
      ];
    }
    if (status && ['draft', 'active', 'paused', 'closed'].includes(status)) {
      where.status = status;
    }

    const { count, rows } = await db.job.findAndCountAll({
      where,
      include: [
        { model: db.user, as: 'companyUser', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      success: true,
      data: {
        jobs: rows,
        pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
      },
    });
  } catch (error) {
    logger.error('Admin jobs list error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch jobs' });
  }
});

// ─── GET /jobs/:id — single job detail ──────────────────────────────────────
router.get('/jobs/:id', async (req, res) => {
  try {
    const job = await db.job.findByPk(parseInt(req.params.id), {
      include: [
        { model: db.user, as: 'companyUser', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: db.application, as: 'applications', attributes: ['id'] },
      ],
    });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, data: job });
  } catch (error) {
    logger.error('Admin job detail error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch job' });
  }
});

// ─── PUT /jobs/:id — update job status ──────────────────────────────────────
router.put('/jobs/:id', async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);
    const { status, title } = req.body;

    const job = await db.job.findByPk(jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const updates = {};
    if (status !== undefined) updates.status = status;
    if (title !== undefined) updates.title = title;

    await job.update(updates);
    logger.info(`Admin action: user ${req.user.id} updated job ${jobId}`, { changes: updates });

    res.json({ success: true, message: 'Job updated', data: job });
  } catch (error) {
    logger.error('Admin update job error:', error);
    res.status(500).json({ success: false, message: 'Failed to update job' });
  }
});

// ─── DELETE /jobs/:id — delete job ──────────────────────────────────────────
router.delete('/jobs/:id', async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);
    const job = await db.job.findByPk(jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    await job.destroy();
    logger.info(`Admin action: user ${req.user.id} deleted job ${jobId}`);

    res.json({ success: true, message: 'Job deleted' });
  } catch (error) {
    logger.error('Admin delete job error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete job' });
  }
});


// ─── GET /applications — all applications ───────────────────────────────────
router.get('/applications', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const status = req.query.status || '';

    const where = {};
    if (status) where.status = status;

    const { count, rows } = await db.application.findAndCountAll({
      where,
      include: [
        { model: db.user, as: 'candidate', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: db.job, as: 'job', attributes: ['id', 'title', 'company'] },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      success: true,
      data: {
        applications: rows,
        pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
      },
    });
  } catch (error) {
    logger.error('Admin applications list error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch applications' });
  }
});

// ─── GET /applications/:id — single application detail ──────────────────────
router.get('/applications/:id', async (req, res) => {
  try {
    const app = await db.application.findByPk(parseInt(req.params.id), {
      include: [
        { model: db.user, as: 'candidate', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: db.job, as: 'job', attributes: ['id', 'title', 'company', 'type', 'location'] },
        { model: db.application_answer, as: 'answers' },
      ],
    });
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, data: app });
  } catch (error) {
    logger.error('Admin application detail error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch application' });
  }
});

// ─── DELETE /applications/:id ───────────────────────────────────────────────
router.delete('/applications/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const app = await db.application.findByPk(id);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

    await app.destroy();
    logger.info(`Admin action: user ${req.user.id} deleted application ${id}`);

    res.json({ success: true, message: 'Application deleted' });
  } catch (error) {
    logger.error('Admin delete application error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete application' });
  }
});

// ─── GET /companies — all company profiles ──────────────────────────────────
router.get('/companies', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { industry: { [Op.like]: `%${search}%` } },
      ];
    }

    const model = db.Company || db.company;
    if (!model) {
      return res.json({ success: true, data: { companies: [], pagination: { total: 0, page: 1, limit, totalPages: 0 } } });
    }

    const { count, rows } = await model.findAndCountAll({
      where,
      attributes: { exclude: ['logo'] },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      success: true,
      data: {
        companies: rows,
        pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
      },
    });
  } catch (error) {
    logger.error('Admin companies list error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch companies' });
  }
});

// ─── GET /companies/:id — single company detail ─────────────────────────────
router.get('/companies/:id', async (req, res) => {
  try {
    const model = db.Company || db.company;
    if (!model) return res.status(404).json({ success: false, message: 'Company model not found' });
    const company = await model.findByPk(parseInt(req.params.id), { attributes: { exclude: ['logo'] } });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, data: company });
  } catch (error) {
    logger.error('Admin company detail error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch company' });
  }
});

// ─── DELETE /companies/:id ──────────────────────────────────────────────────
router.delete('/companies/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const model = db.Company || db.company;
    if (!model) return res.status(404).json({ success: false, message: 'Company model not found' });

    const company = await model.findByPk(id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    await company.destroy();
    logger.info(`Admin action: user ${req.user.id} deleted company ${id}`);

    res.json({ success: true, message: 'Company deleted' });
  } catch (error) {
    logger.error('Admin delete company error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete company' });
  }
});

// ─── GET /payments — payment transaction history ────────────────────────────
router.get('/payments', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const status = req.query.status || '';

    const where = {};
    if (status) where.status = status;

    const { count, rows } = await db.payment_transaction.findAndCountAll({
      where,
      include: [
        { model: db.user, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: db.subscription_plan, as: 'plan', attributes: ['id', 'name', 'slug'] },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      success: true,
      data: {
        payments: rows,
        pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
      },
    });
  } catch (error) {
    logger.error('Admin payments list error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payments' });
  }
});

// ─── GET /plans — list subscription plans ───────────────────────────────────
router.get('/plans', async (req, res) => {
  try {
    const plans = await db.subscription_plan.findAll({ order: [['sortOrder', 'ASC']] });
    res.json({ success: true, data: plans });
  } catch (error) {
    logger.error('Admin plans list error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch plans' });
  }
});

// ─── PUT /plans/:id — update plan pricing/limits ────────────────────────────
router.put('/plans/:id', async (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    const { name, priceMonthly, priceYearly, phoneScreeningsLimit, technicalInterviewsLimit, membersLimit, features, isActive } = req.body;

    const plan = await db.subscription_plan.findByPk(planId);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (priceMonthly !== undefined) updates.priceMonthly = priceMonthly;
    if (priceYearly !== undefined) updates.priceYearly = priceYearly;
    if (phoneScreeningsLimit !== undefined) updates.phoneScreeningsLimit = phoneScreeningsLimit;
    if (technicalInterviewsLimit !== undefined) updates.technicalInterviewsLimit = technicalInterviewsLimit;
    if (membersLimit !== undefined) updates.membersLimit = membersLimit;
    if (features !== undefined) updates.features = features;
    if (isActive !== undefined) updates.isActive = isActive;

    await plan.update(updates);
    logger.info(`Admin action: user ${req.user.id} updated plan ${planId}`, { changes: updates });

    res.json({ success: true, message: 'Plan updated successfully', data: plan });
  } catch (error) {
    logger.error('Admin update plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to update plan' });
  }
});

// ─── POST /notifications/broadcast — send system notification to all ────────
router.post('/notifications/broadcast', async (req, res) => {
  try {
    const { title, message, type = 'system', userType: targetUserType } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    const where = {};
    if (targetUserType && ['company', 'candidate'].includes(targetUserType)) {
      where.userType = targetUserType;
    }

    const users = await db.user.findAll({ where, attributes: ['id'] });

    const notifications = users.map(u => ({
      userId: u.id,
      type,
      title,
      message,
      tag: 'admin-broadcast',
      read: false,
    }));

    if (notifications.length > 0) {
      await db.notification.bulkCreate(notifications);
    }

    logger.info(`Admin broadcast: ${notifications.length} notifications sent by user ${req.user.id}`);

    res.json({ success: true, message: `Sent to ${notifications.length} users` });
  } catch (error) {
    logger.error('Admin broadcast error:', error);
    res.status(500).json({ success: false, message: 'Failed to send broadcast' });
  }
});

// ─── GET /interviews — all interviews ───────────────────────────────────────
router.get('/interviews', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const status = req.query.status || '';

    const where = {};
    if (status && ['scheduled', 'completed', 'cancelled', 'no-show'].includes(status)) {
      where.status = status;
    }

    const { count, rows } = await db.interview.findAndCountAll({
      where,
      include: [
        {
          model: db.application,
          as: 'application',
          attributes: ['id', 'candidateId', 'jobId'],
          include: [
            { model: db.user, as: 'candidate', attributes: ['id', 'firstName', 'lastName', 'email'] },
            { model: db.job, as: 'job', attributes: ['id', 'title', 'company'] },
          ],
        },
      ],
      order: [['scheduledDate', 'DESC']],
      limit,
      offset,
    });

    res.json({
      success: true,
      data: {
        interviews: rows,
        pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
      },
    });
  } catch (error) {
    logger.error('Admin interviews list error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch interviews' });
  }
});

// ─── GET /activity — recent admin activity log ──────────────────────────────
router.get('/activity', async (req, res) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit) || 20);

    // Get recent user registrations, job postings, and applications as activity
    const [recentUsers, recentJobs, recentApps] = await Promise.all([
      db.user.findAll({
        attributes: ['id', 'firstName', 'lastName', 'email', 'userType', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: 10,
      }),
      db.job.findAll({
        attributes: ['id', 'title', 'company', 'status', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: 10,
      }),
      db.application.findAll({
        attributes: ['id', 'status', 'createdAt'],
        include: [
          { model: db.user, as: 'candidate', attributes: ['firstName', 'lastName'] },
          { model: db.job, as: 'job', attributes: ['title'] },
        ],
        order: [['createdAt', 'DESC']],
        limit: 10,
      }),
    ]);

    const activity = [
      ...recentUsers.map(u => ({
        type: 'user_registered',
        description: `${u.firstName} ${u.lastName || ''} registered as ${u.userType}`,
        timestamp: u.createdAt,
      })),
      ...recentJobs.map(j => ({
        type: 'job_posted',
        description: `"${j.title}" posted by ${j.company}`,
        timestamp: j.createdAt,
      })),
      ...recentApps.map(a => ({
        type: 'application_submitted',
        description: `${a.candidate?.firstName || 'Unknown'} ${a.candidate?.lastName || ''} applied for "${a.job?.title || 'Unknown'}"`,
        timestamp: a.createdAt,
      })),
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);

    res.json({ success: true, data: activity });
  } catch (error) {
    logger.error('Admin activity error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch activity' });
  }
});

// ─── GET /demo-bookings — list all demo bookings ────────────────────────────
router.get('/demo-bookings', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const status = req.query.status || '';

    const where = {};
    if (status && ['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      where.status = status;
    }

    const { count, rows } = await db.demo_booking.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      success: true,
      data: {
        bookings: rows,
        pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
      },
    });
  } catch (error) {
    logger.error('Admin demo bookings list error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch demo bookings' });
  }
});

// ─── PUT /demo-bookings/:id — update booking status/notes ──────────────────
router.put('/demo-bookings/:id', async (req, res) => {
  try {
    const booking = await db.demo_booking.findByPk(parseInt(req.params.id));
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const { status, notes } = req.body;
    const updates = {};
    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;

    await booking.update(updates);
    res.json({ success: true, message: 'Booking updated', data: booking });
  } catch (error) {
    logger.error('Admin update demo booking error:', error);
    res.status(500).json({ success: false, message: 'Failed to update booking' });
  }
});

// ─── DELETE /demo-bookings/:id ──────────────────────────────────────────────
router.delete('/demo-bookings/:id', async (req, res) => {
  try {
    const booking = await db.demo_booking.findByPk(parseInt(req.params.id));
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    await booking.destroy();
    res.json({ success: true, message: 'Booking deleted' });
  } catch (error) {
    logger.error('Admin delete demo booking error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete booking' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../models');
const { Op } = db.Sequelize;
const { authenticate } = require('../middleware/auth.middleware');
const logger = require('../utils/logger');

// Static page list for search
const STATIC_PAGES = [
  { name: 'Dashboard', path: '/dashboard', description: 'Main dashboard overview' },
  { name: 'Jobs', path: '/dashboard/jobs', description: 'Manage job postings' },
  { name: 'Candidates', path: '/dashboard/candidates', description: 'View and manage candidates' },
  { name: 'Applications', path: '/dashboard/applications', description: 'Review applications' },
  { name: 'Interviews', path: '/dashboard/interviews', description: 'Schedule and manage interviews' },
  { name: 'Analytics', path: '/dashboard/analytics', description: 'Recruitment analytics and reports' },
  { name: 'Pipeline', path: '/dashboard/pipeline', description: 'Kanban pipeline board' },
  { name: 'Settings', path: '/dashboard/settings', description: 'Account and company settings' },
  { name: 'Subscription', path: '/dashboard/subscription', description: 'Manage subscription plan' },
  { name: 'Notifications', path: '/dashboard/notifications', description: 'View notifications' },
  { name: 'Offer Letters', path: '/dashboard/offer-letters', description: 'Manage offer letters' },
  { name: 'Phone Screening', path: '/dashboard/phone-screening', description: 'AI phone screening' },
  { name: 'AI Video Interviews', path: '/dashboard/ai-video-interviews', description: 'AI video interviews' }
];

const LIMIT_PER_TYPE = 10;

// GET /api/search?q=<query>&types=jobs,candidates,pages
router.get('/', authenticate, async (req, res) => {
  try {
    const { q, types } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ jobs: [], candidates: [], pages: [] });
    }

    const query = q.trim();
    const requestedTypes = types
      ? types.split(',').map(t => t.trim().toLowerCase())
      : ['jobs', 'candidates', 'pages'];

    const companyId = req.user.companyId;
    const results = {};

    // Search jobs
    if (requestedTypes.includes('jobs')) {
      const jobs = await db.job.findAll({
        where: {
          companyId,
          title: { [Op.like]: `%${query}%` }
        },
        attributes: ['id', 'title', 'company', 'location', 'status', 'type'],
        limit: LIMIT_PER_TYPE,
        order: [['createdAt', 'DESC']]
      });
      results.jobs = jobs;
    } else {
      results.jobs = [];
    }

    // Search candidates
    if (requestedTypes.includes('candidates')) {
      const candidates = await db.sequelize.query(`
        SELECT DISTINCT c.id, c.firstName, c.lastName, c.email, c.currentTitle, c.currentCompany
        FROM candidates c
        INNER JOIN applications a ON c.candidate_id = a.candidateId
        INNER JOIN jobs j ON a.jobId = j.id
        WHERE j.companyId = :companyId
          AND (
            CONCAT(c.firstName, ' ', c.lastName) LIKE :query
            OR c.email LIKE :query
          )
        ORDER BY c.updatedAt DESC
        LIMIT :limit
      `, {
        replacements: {
          companyId,
          query: `%${query}%`,
          limit: LIMIT_PER_TYPE
        },
        type: db.sequelize.QueryTypes.SELECT
      });
      results.candidates = candidates;
    } else {
      results.candidates = [];
    }

    // Search pages (static list, case-insensitive match)
    if (requestedTypes.includes('pages')) {
      const lowerQuery = query.toLowerCase();
      results.pages = STATIC_PAGES
        .filter(p =>
          p.name.toLowerCase().includes(lowerQuery) ||
          p.description.toLowerCase().includes(lowerQuery)
        )
        .slice(0, LIMIT_PER_TYPE);
    } else {
      results.pages = [];
    }

    res.json(results);
  } catch (error) {
    logger.error('Search error:', error);
    res.status(500).json({ message: 'Search failed' });
  }
});

module.exports = router;

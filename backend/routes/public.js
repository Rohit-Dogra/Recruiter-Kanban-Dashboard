const express = require('express');
const router = express.Router();
const db = require('../models');
const logger = require('../utils/logger');
const { getRedisOptions } = require('../config/redis.config');

let redisClient = null;

async function getRedis() {
  if (redisClient) return redisClient;
  try {
    const Redis = require('ioredis');
    const opts = getRedisOptions();
    redisClient = opts.url ? new Redis(opts.url) : new Redis(opts);
    return redisClient;
  } catch (err) {
    logger.warn('Redis not available for public stats caching:', err.message);
    return null;
  }
}

const CACHE_KEY = 'public:stats';
const CACHE_TTL = 3600; // 1 hour in seconds

// GET /api/public/stats — aggregate platform counts; no auth; cached in Redis
router.get('/stats', async (req, res) => {
  try {
    // Try cache first
    const redis = await getRedis();
    if (redis) {
      try {
        const cached = await redis.get(CACHE_KEY);
        if (cached) {
          return res.json(JSON.parse(cached));
        }
      } catch (cacheErr) {
        logger.warn('Redis cache read failed:', cacheErr.message);
      }
    }

    // Aggregate counts
    const [totalResumesScreened, totalCompanies, totalJobsPosted, totalInterviews] = await Promise.all([
      db.application.count(),
      db.company.count().catch(() =>
        db.user.count({ where: { userType: 'company' } }).catch(() => 0)
      ),
      db.job.count(),
      db.ai_video_interview.count()
    ]);

    const stats = {
      totalResumesScreened,
      totalCompanies,
      totalJobsPosted,
      totalInterviews
    };

    // Cache result
    if (redis) {
      try {
        await redis.set(CACHE_KEY, JSON.stringify(stats), 'EX', CACHE_TTL);
      } catch (cacheErr) {
        logger.warn('Redis cache write failed:', cacheErr.message);
      }
    }

    res.json(stats);
  } catch (error) {
    logger.error('Error fetching public stats:', error);
    res.status(500).json({ message: 'Failed to fetch platform statistics' });
  }
});

// GET /api/public/companies — list companies with logo and basic info; no auth
router.get('/companies', async (req, res) => {
  try {
    const companies = await db.company.findAll({
      attributes: ['id', 'name', 'industry', 'location', 'logo', 'website', 'size'],
      order: [['createdAt', 'DESC']],
      limit: 12,
    });

    // Convert logo BLOB to base64 data URI
    const result = companies.map(c => {
      const plain = c.toJSON();
      if (plain.logo) {
        const b64 = Buffer.from(plain.logo).toString('base64');
        plain.logo = `data:image/png;base64,${b64}`;
      }
      return plain;
    });

    res.json(result);
  } catch (error) {
    logger.error('Error fetching public companies:', error);
    res.status(500).json({ message: 'Failed to fetch companies' });
  }
});

// GET /api/public/recent-jobs — recently posted active jobs; no auth
router.get('/recent-jobs', async (req, res) => {
  try {
    const jobs = await db.job.findAll({
      where: { status: 'active' },
      attributes: ['id', 'title', 'company', 'location', 'type', 'salary', 'experience', 'workType', 'skills', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 8,
    });

    res.json(jobs);
  } catch (error) {
    logger.error('Error fetching recent jobs:', error);
    res.status(500).json({ message: 'Failed to fetch recent jobs' });
  }
});

// POST /api/public/book-demo — store a demo booking; no auth
router.post('/book-demo', async (req, res) => {
  try {
    const { name, email, company, teamSize, date, time } = req.body;
    if (!name || !email || !company || !date || !time) {
      return res.status(400).json({ success: false, message: 'Name, email, company, date, and time are required' });
    }
    const booking = await db.demo_booking.create({ name, email, company, teamSize: teamSize || null, date, time });
    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    logger.error('Error creating demo booking:', error);
    res.status(500).json({ success: false, message: 'Failed to book demo' });
  }
});

module.exports = router;

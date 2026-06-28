const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticate } = require('../middleware/auth.middleware');
const openaiService = require('../services/openai.service');

const effectiveCompanyId = (req) => req.user.companyId ?? req.user.id;

// Get screening questions for a job
router.get('/job/:jobId', authenticate, async (req, res, next) => {
  try {
    const companyId = effectiveCompanyId(req);
    const jobId = parseInt(req.params.jobId, 10);
    if (!jobId) {
      return res.status(400).json({ success: false, message: 'Invalid job ID' });
    }
    const job = await db.job.findByPk(jobId, { attributes: ['id', 'companyId'] });
    if (!job || job.companyId !== companyId) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    const row = await db.screening_question.findOne({
      where: { jobId, companyId }
    });
    const questions = row && Array.isArray(row.questions) ? row.questions : [];
    res.json({ success: true, questions });
  } catch (error) {
    next(error);
  }
});

// Save screening questions for a job
router.put('/job/:jobId', authenticate, async (req, res, next) => {
  try {
    const companyId = effectiveCompanyId(req);
    const jobId = parseInt(req.params.jobId, 10);
    const { questions } = req.body;
    if (!jobId) {
      return res.status(400).json({ success: false, message: 'Invalid job ID' });
    }
    if (!Array.isArray(questions)) {
      return res.status(400).json({ success: false, message: 'questions must be an array' });
    }
    const job = await db.job.findByPk(jobId, { attributes: ['id', 'companyId'] });
    if (!job || job.companyId !== companyId) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    const [row] = await db.screening_question.findOrCreate({
      where: { jobId, companyId },
      defaults: { jobId, companyId, questions: [] }
    });
    await row.update({ questions });
    res.json({ success: true, questions: row.questions });
  } catch (error) {
    next(error);
  }
});

// AI generate 4 screening questions for a job
router.post('/job/:jobId/generate', authenticate, async (req, res, next) => {
  try {
    const companyId = effectiveCompanyId(req);
    const jobId = parseInt(req.params.jobId, 10);
    if (!jobId) {
      return res.status(400).json({ success: false, message: 'Invalid job ID' });
    }
    const job = await db.job.findByPk(jobId, {
      attributes: ['id', 'companyId', 'title', 'company', 'description', 'requirements']
    });
    if (!job || job.companyId !== companyId) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    const questions = await openaiService.generatePhoneScreeningQuestions({
      jobTitle: job.title,
      companyName: job.company,
      description: job.description || '',
      requirements: typeof job.requirements === 'string' ? job.requirements : '',
      count: 4
    });
    res.json({ success: true, questions });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

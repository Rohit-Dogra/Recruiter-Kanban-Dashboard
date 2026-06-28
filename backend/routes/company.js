const express = require('express');
const multer = require('multer');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const db = require('../models');
const Company = db.company;
const Job = db.job;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// CREATE / UPDATE COMPANY (only owner can update; invited users share owner's company)
router.post('/', authenticate, upload.single('logo'), async (req, res) => {
  try {
    if (req.user.invitedByUserId) {
      return res.status(403).json({ error: 'Only the company owner can update company details' });
    }
    const userId = req.user.id;
    const {
      name,
      description,
      website,
      industry,
      size,
      location,
      founded,
      mission,
      values,
      culture
    } = req.body;

    const logo = req.file ? req.file.buffer : null;

    let company = await Company.findOne({ where: { company_id: userId } });

    if (company) {
      await company.update({
        name,
        description,
        website,
        industry,
        size,
        location,
        founded,
        mission,
        values,
        culture,
        ...(logo && { logo })
      });
    } else {
      company = await Company.create({
        company_id: userId,
        name,
        description,
        website,
        industry,
        size,
        location,
        founded,
        mission,
        values,
        culture,
        logo
      });
    }

    await db.user.update(
      { profile_completed: true },
      { where: { id: userId } }
    );

    res.status(200).json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET COMPANY (uses owner's company for invited users - same company as subscription)
router.get('/', authenticate, async (req, res) => {
  try {
    const ownerId = req.user.companyId ?? req.user.invitedByUserId ?? req.user.id;
    const company = await Company.findOne({
      where: { company_id: ownerId }
    });

    if (!company) {
      return res.status(200).json({ success: false, message: 'Company profile not found' });
    }

    res.json({ 
      success: true, 
      company: {
        ...company.toJSON(),
        userId: company.company_id // Map company_id to userId for frontend compatibility
      }
    });
  } catch (err) {
    console.error('Company GET error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Public: Get company by user ID (fallback for older shared links / jobs mapping)
router.get('/user/:userId', async (req, res) => {
  try {
    const company = await Company.findOne({ where: { company_id: req.params.userId } });

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    res.status(200).json({ 
      success: true, 
      company: {
        ...company.toJSON(),
        userId: company.company_id // Map company_id to userId for frontend compatibility
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Public: Get company by company ID (used by public careers pages)
router.get('/:companyId', async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.companyId);

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    res.status(200).json({ 
      success: true, 
      company: {
        ...company.toJSON(),
        userId: company.company_id // Map company_id to userId for frontend compatibility
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Public: Get all companies (with active job count per company)
router.get('/all/list', async (req, res) => {
  try {
    const companies = await Company.findAll({
      attributes: ['id', 'company_id', 'name', 'description', 'website', 'industry', 'size', 'location', 'founded', 'mission', 'values', 'culture', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    // Fetch active job count per company (jobs.companyId = company.company_id)
    const jobCounts = await Job.findAll({
      attributes: ['companyId', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
      where: { status: 'active' },
      group: ['companyId']
    });

    const countByUserId = {};
    jobCounts.forEach(row => {
      countByUserId[row.companyId] = parseInt(row.get('count') || 0, 10);
    });

    const formattedCompanies = companies.map(company => ({
      ...company.toJSON(),
      userId: company.company_id,
      jobCount: countByUserId[company.company_id] || 0
    }));

    res.status(200).json({ 
      success: true, 
      companies: formattedCompanies,
      count: formattedCompanies.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
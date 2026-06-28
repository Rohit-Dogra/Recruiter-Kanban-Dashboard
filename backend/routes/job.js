const express = require('express');
const router = express.Router();
const db = require('../models');
const Job = db.job;
const { Op } = require('sequelize');
const { validate, jobValidationRules } = require('../middleware/validation.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const NotificationService = require('../services/notification.service');

// Get jobs by company ID (Public endpoint for careers page)
router.get('/company/:companyId', async (req, res, next) => {
  try {
    const jobs = await Job.findAll({
      where: { 
        companyId: req.params.companyId,
        status: 'active'
      },
      attributes: ['id', 'title', 'company', 'location', 'type', 'salary', 'experience', 'description', 'deadline', 'isRemote', 'skills', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      jobs
    });
  } catch (error) {
    next(error);
  }
});

// Create a new job
router.post('/', authenticate, async (req, res, next) => {
  console.log('POST /jobs route hit');
  console.log('Request body:', req.body);
  console.log('User from auth:', req.user);
  
  try {
    // Validate required fields
    const {
      title,
      company,
      location,
      type,
      salary,
      department,
      experience,
      description,
      requirements,
      benefits,
      deadline,
      isRemote,
      skills,
      status,
      urgency,
      workType,
      expiresIn,
      applyFormConfig
    } = req.body;

    // Check if user exists and has an ID
    if (!req.user || !req.user.id) {
      console.log('Authentication failed - no user or user.id');
      return res.status(401).json({
        success: false,
        message: 'User authentication failed'
      });
    }

    // Validate required fields
    if (!title || !company || !type || !description || !requirements) {
      console.log('Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, company, type, description, requirements'
      });
    }

    console.log('Creating job with data:', {
      title, company, type, companyId: req.user.companyId
    });

    const job = await Job.create({
      title,
      company,
      location,
      type,
      companyId: req.user.companyId,
      salary,
      department,
      experience: experience || 'entry',
      description,
      requirements,
      benefits,
      deadline: deadline || null,
      isRemote: isRemote || false,
      skills: skills || [],
      status: status || 'active',
      urgency: urgency || 'medium',
      workType: workType || 'onsite',
      expiresIn: expiresIn || '30days',
      applyFormConfig: applyFormConfig || { phoneRequired: false, coverLetterRequired: false, customQuestions: [] }
    });

    console.log('Job created successfully:', job.id);

        
    // Create notification for job post
    try {
      await NotificationService.createJobPostNotification(job, req.user.id, req.app.get('io'));
    } catch (notifError) {
      console.error('Failed to create job notification:', notifError);
    }
    
    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      job
    });
  } catch (error) {
    console.error('Job creation error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    // Handle foreign key constraint errors
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID or user not found'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// Get all jobs
router.get('/', async (req, res, next) => {
  try {
    const { status, type, search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let condition = {};
    
    if (status && status !== 'all') {
      condition.status = status;
    }

    if (type) {
      condition.type = type;
    }

    if (search) {
      condition[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { company: { [Op.like]: `%${search}%` } },
        { department: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: jobs } = await Job.findAndCountAll({
      where: condition,
      attributes: ['id', 'companyId', 'title', 'company', 'location', 'type', 'salary', 'department', 'experience', 'description', 'requirements', 'benefits', 'urgency', 'workType', 'expiresIn', 'applyFormConfig', 'deadline', 'isRemote', 'skills', 'status', 'createdAt', 'updatedAt'],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      jobs
    });
  } catch (error) {
    next(error);
  }
});

// Get user's jobs
router.get('/user/me', authenticate, async (req, res, next) => {
  try {
    const { status } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let condition = { companyId: req.user.companyId };
    
    if (status && status !== 'all') {
      condition.status = status;
    }

    const Application = db.application;
    
    const { count, rows: jobs } = await Job.findAndCountAll({
      where: condition,
      attributes: [
        'id', 'companyId', 'title', 'company', 'location', 'type', 'salary', 
        'department', 'experience', 'description', 'requirements', 'benefits', 
        'urgency', 'workType', 'expiresIn', 'applyFormConfig', 'deadline', 
        'isRemote', 'skills', 'status', 'createdAt', 'updatedAt',
        [db.sequelize.fn('COUNT', db.sequelize.col('applications.id')), 'applicantCount']
      ],
      include: [{
        model: Application,
        as: 'applications',
        attributes: [],
        duplicating: false
      }],
      group: ['jobs.id'],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      subQuery: false
    });

    res.status(200).json({
      success: true,
      count: jobs.length,
      totalPages: Math.ceil(jobs.length / limit),
      currentPage: page,
      jobs
    });
  } catch (error) {
    next(error);
  }
});

// Get job by ID
router.get('/:id', async (req, res, next) => {
  try {
    const job = await Job.findByPk(req.params.id, {
      attributes: ['id', 'companyId', 'title', 'company', 'location', 'type', 'salary', 'department', 'experience', 'description', 'requirements', 'benefits', 'urgency', 'workType', 'expiresIn', 'applyFormConfig', 'deadline', 'isRemote', 'skills', 'status', 'createdAt', 'updatedAt']
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.status(200).json({
      success: true,
      job
    });
  } catch (error) {
    next(error);
  }
});

// Update job
router.put('/:id', authenticate, validate(jobValidationRules.update), async (req, res, next) => {
  try {
    const job = await Job.findByPk(req.params.id, {
      attributes: ['id', 'companyId', 'title', 'company', 'location', 'type', 'salary', 'department', 'experience', 'description', 'requirements', 'benefits', 'urgency', 'workType', 'expiresIn', 'applyFormConfig', 'deadline', 'isRemote', 'skills', 'status', 'createdAt', 'updatedAt']
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user is authorized to update this job
    if (job.companyId !== req.user.companyId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this job'
      });
    }

    // Update job in database
    await job.update(req.body);

    res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      job
    });
  } catch (error) {
    next(error);
  }
});

// Delete job
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const job = await Job.findByPk(req.params.id, {
      attributes: ['id', 'companyId', 'title', 'company', 'location', 'type', 'salary', 'department', 'experience', 'description', 'requirements', 'benefits', 'urgency', 'workType', 'expiresIn', 'applyFormConfig', 'deadline', 'isRemote', 'skills', 'status', 'createdAt', 'updatedAt']
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user is authorized to delete this job
    if (job.companyId !== req.user.companyId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this job'
      });
    }

    // Delete job from database
    await job.destroy();

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
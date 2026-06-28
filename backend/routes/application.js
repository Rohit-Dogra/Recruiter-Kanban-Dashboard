const express = require('express');
const router = express.Router();
const db = require('../models');
const Application = db.application;
const Candidate = db.candidate;
const ApplicationAnswer = db.application_answer;
const Job = db.job;
const { authenticate } = require('../middleware/auth.middleware');
const { authenticateCandidate } = require('../middleware/candidateAuth.middleware');
const { body, param, validationResult } = require('express-validator');
const atsService = require('../services/ats.service');
const NotificationService = require('../services/notification.service');
const { cacheInvalidate } = require('../utils/cache');
const { validateApplicationStatus } = require('../middleware/statusValidation.middleware');


// Rate limiting for security
const rateLimit = require('express-rate-limit');
const submitLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many application submissions, please try again later.'
});

// Check if candidate has previous applications and get saved answers
router.get('/candidate/check-previous/:jobId', authenticateCandidate, [
  param('jobId').isInt().withMessage('Job ID must be a valid integer')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID',
        errors: errors.array()
      });
    }
    
    const { jobId } = req.params;
    const candidateEmail = req.candidate.email;

    // Find candidate by email
    const candidate = await Candidate.findOne({ where: { email: candidateEmail } });
    
    if (!candidate) {
      return res.status(200).json({
        success: true,
        isFirstTime: true,
        savedAnswers: []
      });
    }

    // Check if candidate has any previous applications
    // applications.candidateId references users.id, so use candidate.candidate_id
    const previousApplication = await Application.findOne({
      where: { candidateId: candidate.candidate_id },
      include: [{
        model: ApplicationAnswer,
        as: 'answers',
        attributes: ['question', 'answer']
      }],
      order: [['createdAt', 'DESC']]
    });

    if (!previousApplication) {
      return res.status(200).json({
        success: true,
        isFirstTime: true,
        savedAnswers: []
      });
    }

    // Get the most recent application's answers
    const savedAnswers = previousApplication.answers || [];

    res.status(200).json({
      success: true,
      isFirstTime: false,
      savedAnswers: savedAnswers.map(answer => ({
        question: answer.question,
        answer: answer.answer
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Check if candidate has applied for a specific job
router.get('/candidate/check/:jobId', authenticateCandidate, [
  param('jobId').isInt().withMessage('Job ID must be a valid integer')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID',
        errors: errors.array()
      });
    }
    
    const { jobId } = req.params;
    const candidateEmail = req.candidate.email;

    // Find candidate by email
    const candidate = await Candidate.findOne({ where: { email: candidateEmail } });
    
    if (!candidate) {
      return res.status(200).json({
        success: true,
        hasApplied: false
      });
    }

    // Check if candidate has applied for this specific job
    const application = await Application.findOne({
      where: { 
        candidateId: candidate.candidate_id,
        jobId: parseInt(jobId)
      }
    });

    res.status(200).json({
      success: true,
      hasApplied: !!application
    });
  } catch (error) {
    next(error);
  }
});

// Get applications for current candidate
router.get('/candidate/me', authenticateCandidate, async (req, res, next) => {
  try {
    const candidateEmail = req.candidate.email;

    // Find candidate by email
    const candidate = await Candidate.findOne({ where: { email: candidateEmail } });
    
    if (!candidate) {
      return res.status(200).json({
        success: true,
        applications: []
      });
    }

    // Use candidate_id which references the users table
    const applications = await Application.findAll({
      where: { candidateId: candidate.candidate_id },
      include: [
        {
          model: Job,
          as: 'job',
          attributes: ['id', 'title', 'company', 'location', 'type']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Check for interviews for each application
    const applicationsWithInterviews = await Promise.all(
      applications.map(async (app) => {
        const interview = await db.interview.findOne({
          where: { applicationId: app.id }
        });
        
        return {
          ...app.toJSON(),
          hasInterview: !!interview
        };
      })
    );

    res.status(200).json({
      success: true,
      applications: applicationsWithInterviews
    });
  } catch (error) {
    next(error);
  }
});

// Submit job application
router.post('/', submitLimit, [
  body('jobId').isInt().withMessage('Job ID must be a valid integer'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    console.log('Application submission request body:', JSON.stringify(req.body, null, 2));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      jobId,
      firstName,
      lastName,
      email,
      phone,
      countryCode,
      resumeUrl,
      coverLetter,
      answers
    } = req.body;

    console.log('Processing application for job:', jobId);
    console.log('Resume URL provided:', resumeUrl);

    if (!resumeUrl) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Resume file is required'
      });
    }

    // Check if candidate user already exists (by email)
    let candidateUser = await db.user.findOne({ 
      where: { email, userType: 'candidate' }, 
      transaction 
    });

    if (!candidateUser) {
      // Create new user
      candidateUser = await db.user.create({
        userType: 'candidate',
        firstName,
        lastName,
        email
      }, { transaction });
    }

    // Check if candidate record exists
    let candidate = await Candidate.findOne({ where: { email }, transaction });

    if (!candidate) {
      // Create new candidate record
      candidate = await Candidate.create({
        firstName,
        lastName,
        email,
        phone: countryCode ? `${countryCode} ${phone}` : phone,
        source: 'career_page',
        candidate_id: candidateUser.id
      }, { transaction });
    } else {
      // Update candidate phone if provided
      if (phone && countryCode) {
        await candidate.update({
          phone: `${countryCode} ${phone}`
        }, { transaction });
      }
      // Ensure candidate_id is set
      if (!candidate.candidate_id) {
        await candidate.update({ candidate_id: candidateUser.id }, { transaction });
      }
    }
    
    // Check if same application already exists
    const existingApplication = await Application.findOne({
      where: { candidateId: candidateUser.id, jobId: parseInt(jobId) },
      transaction
    });

    if (existingApplication) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }
    
    // Get job details
    const job = await Job.findByPk(parseInt(jobId), { 
      attributes: ['id', 'companyId', 'title', 'company', 'location', 'type', 'salary', 'department', 'experience', 'description', 'requirements', 'benefits', 'urgency', 'workType', 'expiresIn', 'applyFormConfig', 'deadline', 'isRemote', 'skills', 'status', 'createdAt', 'updatedAt'],
      transaction 
    });
    
    if (!job) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Use companyId from job
    const companyUserId = job.companyId;
    const companyUser = await db.user.findByPk(companyUserId, { transaction });
    
    // Dynamic validation based on job configuration
    const jobConfig = job.applyFormConfig || {};
    
    // Validate cover letter if required
    if (jobConfig.coverLetterRequired && (!coverLetter || coverLetter.trim() === '')) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Cover Letter is required for this job'
      });
    }
    
    // Validate phone if required
    if (jobConfig.phoneRequired && (!phone || phone.trim() === '')) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Phone number is required for this job'
      });
    }
    
    // Create new application
    const application = await Application.create({
      candidateId: candidateUser.id,
      companyId: companyUser.id,
      jobId: parseInt(jobId),
      resumeUrl: resumeUrl || null,
      coverLetter: coverLetter || null,
      status: 'new',
      stage: 'applied'
    }, { transaction });

    // Save additional answers
    if (answers && Array.isArray(answers) && answers.length > 0) {
      // Validate answers format
      for (const answer of answers) {
        if (!answer.question || !answer.answer) {
          throw new Error('Invalid answer format: missing question or answer');
        }
      }

      // Save answers
      for (const answer of answers) {
        await ApplicationAnswer.create({
          applicationId: application.id,
          question: answer.question,
          answer: answer.answer
        }, { transaction });
      }
    }

    // Commit transaction
    await transaction.commit();

    // Invalidate analytics and public stats caches
    cacheInvalidate('public:stats', `analytics:${companyUser.id}`).catch(() => {});

     // Create notification for new application
    try {
      // Use candidate.id (candidates table PK) for notification since
      // notification.candidateId references candidates.id
      const io = req.app.get('io');
      await NotificationService.createApplicationNotification(application, job, {
        name: `${firstName} ${lastName}`,
        id: candidate.id,
        email,
        candidateUserId: candidateUser.id
      }, io);
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
    }

    // Process ATS analysis via background job queue (non-blocking)
    if (resumeUrl) {
      try {
        const appToUpdate = await Application.findByPk(application.id);
        if (appToUpdate) {
          await appToUpdate.update({ atsStatus: 'pending' });
        }

        const jobDescription = `${job.title}\n${job.description || ''}\nRequired Skills: ${job.requirements || ''}\n${job.skills ? `Skills: ${Array.isArray(job.skills) ? job.skills.join(', ') : job.skills}` : ''}`;

        const { addATSJob } = require('../services/queue.service');
        const queueResult = await addATSJob({
          applicationId: application.id,
          resumeUrl,
          jobDescription,
        });
        
        // If queue is unavailable (Redis down), addATSJob returns null — fall back to inline
        if (!queueResult) {
          throw new Error('Queue unavailable, falling back to inline processing');
        }
      } catch (queueError) {
        console.error('Failed to enqueue ATS job, falling back to inline:', queueError.message);
        // Fallback: process inline if queue is unavailable
        try {
          const appToUpdate = await Application.findByPk(application.id);
          if (appToUpdate) {
            await appToUpdate.update({ atsStatus: 'processing' });
          }

          const jobDescription = `${job.title}\n${job.description || ''}\nRequired Skills: ${job.requirements || ''}\n${job.skills ? `Skills: ${Array.isArray(job.skills) ? job.skills.join(', ') : job.skills}` : ''}`;
          const atsResult = await atsService.processResume(resumeUrl, jobDescription);

          const appToUpdate2 = await Application.findByPk(application.id);
          if (appToUpdate2) {
            await appToUpdate2.update({
              aiScore: atsResult.atsScore,
              atsStatus: 'completed',
              resumeMatch: atsResult.skillsMatchPercentage,
              skillsMatch: { matched: atsResult.matchedSkills, missing: atsResult.missingSkills },
              aiNotes: atsResult.recommendation
            });
          }
        } catch (atsError) {
          try {
            const appToUpdate3 = await Application.findByPk(application.id);
            if (appToUpdate3) {
              await appToUpdate3.update({
                aiScore: null,
                atsStatus: 'failed',
                aiNotes: `ATS analysis failed: ${atsError.message}. Retry available.`
              });
            }
          } catch (fallbackError) {
            console.error('Failed to update ATS failure status:', fallbackError);
          }
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application: {
        id: application.id,
        status: application.status,
        appliedDate: application.createdAt
      }
    });
  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();
    
    console.error('Application submission error:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit application'
    });
  }
});

// Get applications for a specific job
router.get('/job/:jobId', authenticate, [
  param('jobId').isInt().withMessage('Job ID must be a valid integer')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID',
        errors: errors.array()
      });
    }
    
    const { jobId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const applications = await Application.findAll({
      where: { jobId },
      include: [
        {
          model: Candidate,
          as: 'candidateRecord',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'location', 'experience', 'skills', 'currentTitle', 'currentCompany', 'education', 'avatarUrl', 'resumeUrl'],
          required: false,
        },
        {
          model: ApplicationAnswer,
          as: 'answers',
          attributes: ['question', 'answer']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    // Map candidateRecord to candidate for API compatibility
    const applicationsWithCandidates = applications.map((app) => {
      const json = app.toJSON();
      json.candidate = json.candidateRecord || null;
      delete json.candidateRecord;
      return json;
    });

    const count = await Application.count({ where: { jobId } });

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      applications: applicationsWithCandidates
    });
  } catch (error) {
    next(error);
  }
});

// Get single application by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const application = await Application.findByPk(req.params.id, {
      include: [
        {
          model: Candidate,
          as: 'candidate',
          attributes: ['firstName', 'lastName', 'email', 'phone', 'location', 'experience', 'skills']
        },
        {
          model: Job,
          as: 'job',
          attributes: ['title', 'company', 'location', 'type']
        },
        {
          model: ApplicationAnswer,
          as: 'answers',
          attributes: ['question', 'answer']
        }
      ]
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.status(200).json({
      success: true,
      application
    });
  } catch (error) {
    next(error);
  }
});

// Update application status
router.put('/:id/status', authenticate, validateApplicationStatus, async (req, res, next) => {
  try {
    let { status, notes } = req.body;
    const companyId = req.user.companyId || req.user.id;

    const application = await Application.findByPk(req.params.id, {
      include: [{ model: Job, as: 'job', attributes: ['id', 'companyId', 'title'] }]
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const job = application.job || await Job.findByPk(application.jobId, { attributes: ['companyId', 'title'] });
    if (!job || job.companyId !== companyId) {
      return res.status(403).json({
        success: false,
        message: 'Not allowed to update this application'
      });
    }

 
    const oldStatus = application.status;
    let oldStageName = oldStatus;
    let newStageName = status;

    // Get old stage name by systemStatus
    if (oldStatus && oldStatus.toString().startsWith('custom-')) {
      const oldStage = await db.pipeline_stage.findOne({
        where: { systemStatus: oldStatus, companyId: job.companyId }
      });
      if (oldStage) oldStageName = oldStage.name;
    }

    // Get new stage name by systemStatus
    let newSystemStatus = status;
    const statusStr = status.toString();
    
    if (!isNaN(parseInt(statusStr))) {
      const stage = await db.pipeline_stage.findByPk(parseInt(statusStr));
      if (stage) {
        newStageName = stage.name;
        newSystemStatus = stage.systemStatus;
      }
    } else if (statusStr.startsWith('custom-')) {
      const stage = await db.pipeline_stage.findOne({
        where: { systemStatus: statusStr, companyId: job.companyId }
      });
      if (stage) {
        newStageName = stage.name;
        newSystemStatus = stage.systemStatus;
      }
    }

    await application.update({
      status: newSystemStatus,
      notes: notes || application.notes,
      reviewedDate: newSystemStatus === 'reviewed' ? new Date() : application.reviewedDate
    });

    // Invalidate analytics cache for this company
    cacheInvalidate(`analytics:${companyId}`, 'public:stats').catch(() => {});

    // Create notification
    if (oldStatus !== newSystemStatus) {
      // Look up candidate record using candidate_id (users.id) from application
      const candidate = await Candidate.findOne({
        where: { candidate_id: application.candidateId },
        attributes: ['id', 'firstName', 'lastName', 'email', 'candidate_id']
      });
      if (candidate) {
        const io = req.app.get('io');
        // Pass candidate.id (candidates table PK) since notification.candidateId references candidates.id
        await NotificationService.createStageChangeNotification(
          application,
          job,
          { name: `${candidate.firstName} ${candidate.lastName}`, id: candidate.id, email: candidate.email, candidateUserId: candidate.candidate_id },
          oldStageName,
          newStageName,
          io
        );
      }
    }




    res.status(200).json({
      success: true,
      message: 'Application status updated successfully',
      application: {
        id: application.id,
        status: application.status,
        updatedAt: application.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get all applications (Admin)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const userId = req.user.companyId;

    let condition = {};
    if (status && status !== 'all') {
      condition.status = status;
    }

    const applications = await Application.findAll({
      where: condition,
      include: [
        {
          model: Job,
          as: 'job',
          where: { companyId: userId },
          attributes: ['title', 'company']
        },
        {
          model: Candidate,
          as: 'candidateRecord',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'location', 'experience', 'skills', 'currentTitle', 'currentCompany', 'education', 'avatarUrl', 'resumeUrl'],
          required: false,
        },
        {
          model: db.interview,
          as: 'interviews',
          attributes: ['id'],
          required: false,
        },
        {
          model: ApplicationAnswer,
          as: 'answers',
          attributes: ['question', 'answer']
        }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    // Map for API compatibility
    const applicationsWithCandidates = applications.map((app) => {
      const json = app.toJSON();
      json.candidate = json.candidateRecord || null;
      json.hasInterview = !!(json.interviews && json.interviews.length > 0);
      delete json.candidateRecord;
      delete json.interviews;
      return json;
    });

    const count = await Application.count({
      where: condition,
      include: [{
        model: Job,
        as: 'job',
        where: { companyId: userId }
      }]
    });

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      applications: applicationsWithCandidates
    });
  } catch (error) {
    next(error);
  }
});

// Retry ATS analysis for a failed application
router.post('/:id/retry-ats', authenticate, [
  param('id').isInt().withMessage('Application ID must be a valid integer')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID',
        errors: errors.array()
      });
    }

    const application = await Application.findByPk(req.params.id, {
      include: [{ model: Job, as: 'job' }]
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const companyId = req.user.companyId || req.user.id;
    const job = application.job || await Job.findByPk(application.jobId);
    if (!job || job.companyId !== companyId) {
      return res.status(403).json({
        success: false,
        message: 'Not allowed to retry ATS for this application'
      });
    }

    if (!application.resumeUrl) {
      return res.status(400).json({
        success: false,
        message: 'No resume available for ATS analysis'
      });
    }

    // Set status to processing
    await application.update({ atsStatus: 'processing', aiNotes: null });

    // Run ATS analysis asynchronously
    (async () => {
      try {
        const jobDescription = `${job.title}\n${job.description || ''}\nRequired Skills: ${job.requirements || ''}\n${job.skills ? `Skills: ${Array.isArray(job.skills) ? job.skills.join(', ') : job.skills}` : ''}`;
        const atsResult = await atsService.processResume(application.resumeUrl, jobDescription);

        await application.update({
          aiScore: atsResult.atsScore,
          atsStatus: 'completed',
          resumeMatch: atsResult.skillsMatchPercentage,
          skillsMatch: {
            matched: atsResult.matchedSkills,
            missing: atsResult.missingSkills
          },
          aiNotes: atsResult.recommendation
        });
      } catch (atsError) {
        await application.update({
          aiScore: null,
          atsStatus: 'failed',
          aiNotes: `ATS analysis failed: ${atsError.message}. Retry available.`
        });
      }
    })();

    res.status(200).json({
      success: true,
      message: 'ATS analysis re-initiated',
      application: {
        id: application.id,
        atsStatus: 'processing'
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/applications/bulk — bulk operations on multiple applications
router.post('/bulk', authenticate, [
  body('applicationIds').isArray({ min: 1 }).withMessage('applicationIds must be a non-empty array'),
  body('applicationIds.*').isInt().withMessage('Each application ID must be an integer'),
  body('action').isIn(['reject', 'move-stage', 'email']).withMessage('Action must be reject, move-stage, or email'),
  body('targetStage').optional().isString(),
  body('emailSubject').optional().isString(),
  body('emailBody').optional().isString()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { applicationIds, action, targetStage, emailSubject, emailBody } = req.body;
    const companyId = req.user.companyId || req.user.id;

    // Validate action-specific required fields
    if (action === 'move-stage' && !targetStage) {
      return res.status(400).json({ success: false, message: 'targetStage is required for move-stage action' });
    }
    if (action === 'email' && (!emailSubject || !emailBody)) {
      return res.status(400).json({ success: false, message: 'emailSubject and emailBody are required for email action' });
    }

    // Fetch all applications and verify ownership
    const applications = await Application.findAll({
      where: { id: applicationIds },
      include: [{ model: Job, as: 'job', attributes: ['id', 'companyId', 'title'] }]
    });

    // Check that all requested IDs were found and belong to the user
    const foundIds = applications.map(a => a.id);
    const missingIds = applicationIds.filter(id => !foundIds.includes(id));

    const unauthorized = applications.filter(a => {
      const job = a.job;
      return !job || job.companyId !== companyId;
    });

    if (unauthorized.length > 0) {
      return res.status(403).json({
        success: false,
        message: 'Some applications do not belong to your jobs',
        unauthorizedIds: unauthorized.map(a => a.id)
      });
    }

    const validApps = applications.filter(a => a.job && a.job.companyId === companyId);
    let successCount = 0;
    const failures = [];

    for (const app of validApps) {
      try {
        if (action === 'reject') {
          await app.update({ status: 'rejected' });
          successCount++;
        } else if (action === 'move-stage') {
          await app.update({ status: targetStage });
          successCount++;
        } else if (action === 'email') {
          // Look up candidate to get email
          const candidate = await Candidate.findOne({
            where: { candidate_id: app.candidateId },
            attributes: ['id', 'firstName', 'lastName', 'email']
          });
          if (candidate && candidate.email) {
            const emailService = require('../services/emailService');
            await emailService.sendEmail({
              to: candidate.email,
              subject: emailSubject,
              content: emailBody,
              candidateName: `${candidate.firstName} ${candidate.lastName}`
            });
            successCount++;
          } else {
            failures.push({ id: app.id, reason: 'Candidate email not found' });
          }
        }
      } catch (err) {
        failures.push({ id: app.id, reason: err.message });
      }
    }

    // Add missing IDs to failures
    for (const id of missingIds) {
      failures.push({ id, reason: 'Application not found' });
    }

    res.status(200).json({
      success: true,
      message: `Bulk ${action} completed`,
      successCount,
      failureCount: failures.length,
      failures
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/applications/:id/timeline — stage change history for an application
router.get('/:id/timeline', authenticate, async (req, res, next) => {
  try {
    const application = await Application.findByPk(req.params.id, {
      include: [
        { model: Job, as: 'job', attributes: ['id', 'title', 'companyId'] }
      ]
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Verify the requesting user owns this application's job
    const companyId = req.user.companyId || req.user.id;
    if (application.job && application.job.companyId !== companyId) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this application' });
    }

    // Build timeline from available data.
    // Since there's no dedicated stage_changes table, we construct a timeline
    // from the application's timestamps and current status.
    const timeline = [];

    // Applied entry
    timeline.push({
      stage: 'applied',
      label: 'Applied',
      timestamp: application.appliedDate || application.createdAt,
      status: 'completed'
    });

    // Reviewed entry
    if (application.reviewedDate) {
      timeline.push({
        stage: 'reviewed',
        label: 'Reviewed',
        timestamp: application.reviewedDate,
        status: 'completed'
      });
    }

    // Current status entry (if beyond applied/reviewed)
    const currentStatus = application.status;
    const advancedStatuses = ['shortlisted', 'interview', 'offered', 'hired', 'rejected'];
    if (advancedStatuses.includes(currentStatus) || (currentStatus && currentStatus.startsWith('custom-'))) {
      timeline.push({
        stage: currentStatus,
        label: currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1).replace(/-/g, ' '),
        timestamp: application.updatedAt,
        status: currentStatus === 'rejected' ? 'rejected' : 'completed'
      });
    }

    // Mark the current stage
    if (timeline.length > 0) {
      timeline[timeline.length - 1].current = true;
    }

    res.json({
      success: true,
      applicationId: application.id,
      currentStatus: application.status,
      timeline
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
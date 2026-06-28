/**
 * Consolidated Offer Letter Routes
 *
 * Combines functionality from:
 *   - offer-letters.js (legacy)
 *   - offer-letters-consolidated.js (enhanced)
 *   - candidate-offer-letters.js (candidate-facing)
 *   - offer-status.js (status checking)
 *
 * All operations use db.OfferLetterEnhanced exclusively.
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { authenticateCandidate } = require('../middleware/candidateAuth.middleware');
const { body, validationResult, param } = require('express-validator');
const db = require('../models');
const emailService = require('../services/emailService');
const pdfGenerator = require('../services/pdfGenerator.service');
const s3Service = require('../services/s3.service');
const logger = require('../utils/logger');
const crypto = require('crypto');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// COMPANY-FACING ROUTES (require authenticate)
// ─────────────────────────────────────────────────────────────

// Get available templates
router.get('/templates', authenticate, (req, res) => {
  const templates = [
    { id: 'modern', name: 'Modern Professional', description: 'Clean and contemporary design' },
    { id: 'classic', name: 'Classic Corporate', description: 'Traditional business format' },
    { id: 'executive', name: 'Executive Premium', description: 'Elegant design for senior roles' },
    { id: 'creative', name: 'Creative Design', description: 'Modern design for creative roles' },
    { id: 'minimal', name: 'Minimal Clean', description: 'Simple and clean layout' }
  ];
  res.json(templates);
});

// Get offer letter analytics
router.get('/analytics/stats', authenticate, async (req, res) => {
  try {
    const companyId = req.user.companyId || req.user.id;

    const stats = await db.OfferLetterEnhanced.findAll({
      where: { companyId },
      attributes: [
        'status',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const statusCounts = {
      total: 0, draft: 0, generated: 0, sent: 0,
      viewed: 0, accepted: 0, rejected: 0, expired: 0
    };

    stats.forEach(stat => {
      statusCounts[stat.status] = parseInt(stat.count);
      statusCounts.total += parseInt(stat.count);
    });

    const acceptanceRate = statusCounts.sent > 0
      ? ((statusCounts.accepted / statusCounts.sent) * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: { ...statusCounts, acceptanceRate: parseFloat(acceptanceRate) }
    });
  } catch (error) {
    logger.error('Error fetching offer letter analytics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
});

// ─── Status routes (from offer-status.js) ────────────────────

// Get offer letter status for a candidate (company-facing, for pipeline view)
router.get('/status/candidate/:candidateId', authenticate, async (req, res) => {
  try {
    const { candidateId } = req.params;
    const companyId = req.user.companyId || req.user.id;

    const offerLetter = await db.OfferLetterEnhanced.findOne({
      where: { candidateId: parseInt(candidateId), companyId },
      order: [['createdAt', 'DESC']]
    });

    if (!offerLetter) {
      return res.json({ hasOffer: false, message: 'No offer letter found for this candidate' });
    }

    let signedUrl = null;
    if (offerLetter.s3Uploaded && offerLetter.s3Key) {
      try {
        signedUrl = s3Service.getSignedUrl(offerLetter.s3Key, 3600);
      } catch (err) {
        logger.warn('Failed to generate signed URL:', err.message);
      }
    }

    res.json({
      hasOffer: true,
      offerId: offerLetter.id,
      status: offerLetter.status,
      pdfUrl: signedUrl || offerLetter.pdfUrl,
      sentAt: offerLetter.sentAt,
      expiresAt: offerLetter.expiresAt,
      salary: offerLetter.salary,
      joiningDate: offerLetter.joiningDate,
      workLocation: offerLetter.workLocation
    });
  } catch (error) {
    logger.error('Error fetching offer letter status:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch offer letter status' });
  }
});

// Get all offer letters for pipeline view
router.get('/status/pipeline', authenticate, async (req, res) => {
  try {
    const companyId = req.user.companyId || req.user.id;

    const offerLetters = await db.OfferLetterEnhanced.findAll({
      where: { companyId },
      include: [
        { model: db.user, as: 'candidate', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: db.job, as: 'job', attributes: ['id', 'title'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const offersWithUrls = await Promise.all(
      offerLetters.map(async (offer) => {
        let signedUrl = null;
        if (offer.s3Uploaded && offer.s3Key) {
          try {
            signedUrl = s3Service.getSignedUrl(offer.s3Key, 3600);
          } catch (err) {
            logger.warn('Failed to generate signed URL for offer:', offer.id);
          }
        }
        return { ...offer.toJSON(), pdfUrl: signedUrl || offer.pdfUrl };
      })
    );

    res.json({ success: true, offerLetters: offersWithUrls });
  } catch (error) {
    logger.error('Error fetching pipeline offer letters:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch offer letters' });
  }
});

// ─── List offer letters with enhanced filtering ──────────────

router.get('/', authenticate, async (req, res) => {
  try {
    const {
      page = 1, limit = 10, status, candidateId, applicationId,
      jobId, template, dateFrom, dateTo, search
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { companyId: req.user.companyId || req.user.id };

    if (status) whereClause.status = status;

    if (applicationId) {
      whereClause.applicationId = applicationId;
    } else if (candidateId) {
      const parsedId = parseInt(candidateId);
      if (!isNaN(parsedId)) {
        try {
          const application = await db.application.findByPk(parsedId);
          if (application) {
            whereClause.applicationId = parsedId;
          } else {
            whereClause.candidateId = parsedId;
          }
        } catch (_) {
          whereClause.candidateId = parsedId;
        }
      }
    }

    if (jobId) whereClause.jobId = jobId;
    if (template) whereClause.template = template;

    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) whereClause.createdAt[db.Sequelize.Op.gte] = new Date(dateFrom);
      if (dateTo) whereClause.createdAt[db.Sequelize.Op.lte] = new Date(dateTo);
    }

    if (search) {
      whereClause[db.Sequelize.Op.or] = [
        { candidateName: { [db.Sequelize.Op.like]: `%${search}%` } },
        { candidateEmail: { [db.Sequelize.Op.like]: `%${search}%` } },
        { jobTitle: { [db.Sequelize.Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await db.OfferLetterEnhanced.findAndCountAll({
      where: whereClause,
      include: [
        { model: db.user, as: 'candidate', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: db.job, as: 'job', attributes: ['id', 'title', 'department'] },
        { model: db.application, as: 'application', attributes: ['id', 'status', 'appliedDate'] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      offerLetters: rows,
      totalCount: count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      hasNextPage: page * limit < count,
      hasPrevPage: page > 1
    });
  } catch (error) {
    logger.error('Error fetching offer letters:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch offer letters' });
  }
});

// ─── Generate offer letter (enhanced, with PDF email attachment) ─

router.post('/generate', authenticate, [
  body('candidateName').notEmpty().withMessage('Candidate name required'),
  body('candidateEmail').isEmail().withMessage('Valid email required'),
  body('jobTitle').notEmpty().withMessage('Job title required'),
  body('salary').custom((value) => {
    const numericValue = value.toString().replace(/,/g, '');
    if (!/^\d+(\.\d{1,2})?$/.test(numericValue)) throw new Error('Valid salary required');
    return true;
  }).withMessage('Valid salary required'),
  body('joiningDate').isISO8601().withMessage('Valid joining date required'),
  body('template').optional().isIn(['modern', 'classic', 'executive', 'creative', 'minimal']).withMessage('Invalid template'),
  body('workLocation').optional().isLength({ min: 1, max: 100 }).withMessage('Invalid work location'),
  body('benefits').optional().isLength({ max: 2000 }).withMessage('Benefits too long'),
  body('customizations').optional().isObject().withMessage('Customizations must be an object')
], async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const {
      candidateName, candidateEmail, candidatePhone, jobTitle, salary,
      joiningDate, workLocation = 'Remote',
      benefits = 'Health Insurance, Provident Fund, Paid Time Off, Professional Development',
      template = 'modern', customizations = {},
      candidateId, jobId, applicationId, sendEmail = false
    } = req.body;

    if (!jobId) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Job ID is required to generate offer letter' });
    }

    const cleanSalary = salary.toString().replace(/,/g, '');
    const parsedSalary = parseFloat(cleanSalary);
    const trackingToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const offerContent = generateOfferContent({
      candidateName, jobTitle, salary: cleanSalary, joiningDate,
      workLocation, benefits, companyName: 'HirerMind', template, customizations
    });

    const pdfData = await pdfGenerator.generateOfferLetterPDF({
      candidateId: candidateId || Date.now(),
      candidateName, candidateEmail, jobTitle, salary: cleanSalary,
      joiningDate, workLocation, benefits, companyName: 'HirerMind',
      template, customizations
    });

    const offerData = {
      companyId: req.user.companyId || req.user.id,
      candidateName, candidateEmail,
      candidatePhone: candidatePhone || null,
      jobTitle, template,
      salary: parsedSalary,
      joiningDate: new Date(joiningDate),
      workLocation, benefits, offerContent, customizations,
      status: 'generated', generatedAt: new Date(),
      expiresAt, trackingToken,
      createdBy: req.user.id,
      s3BucketName: process.env.S3_BUCKET_NAME,
      s3Key: pdfData.s3Key,
      s3Url: pdfData.s3Url,
      s3Uploaded: pdfData.s3Uploaded,
      pdfUrl: pdfData.s3Url || `/uploads/offer-letters/${pdfData.fileName}`,
      jobId: parseInt(jobId)
    };

    // Link optional foreign keys
    if (candidateId) {
      const pid = parseInt(candidateId);
      if (!isNaN(pid)) {
        try { if (await db.user.findByPk(pid)) offerData.candidateId = pid; } catch (_) {}
      }
    }
    if (applicationId) {
      const pid = parseInt(applicationId);
      if (!isNaN(pid)) {
        try { if (await db.application.findByPk(pid)) offerData.applicationId = pid; } catch (_) {}
      }
    }

    const offerRecord = await db.OfferLetterEnhanced.create(offerData, { transaction });

    let emailResult = null;
    if (sendEmail) {
      try {
        emailResult = await sendOfferEmail(offerRecord, pdfData);
        await offerRecord.update({
          emailMessageId: emailResult.messageId,
          emailSent: true,
          status: 'sent',
          sentAt: new Date()
        }, { transaction });
      } catch (emailError) {
        logger.error('Email sending failed:', emailError.message);
      }
    }

    await transaction.commit();

    // Create notifications for both company user and candidate
    try {
      const NotificationService = require('../services/notification.service');
      const io = req.app.get('io');
      const jobRecord = await db.job.findByPk(parseInt(jobId), { attributes: ['id', 'title', 'company', 'companyId'] });
      // Resolve candidate record for candidateId (candidates table PK)
      let candidateRecord = null;
      if (candidateId) {
        candidateRecord = await db.candidate.findOne({ where: { candidate_id: parseInt(candidateId) }, attributes: ['id', 'candidate_id'] });
      }
      await NotificationService.createOfferNotification(
        offerRecord,
        jobRecord || { id: parseInt(jobId), title: jobTitle, company: 'HirerMind', companyId: req.user.companyId || req.user.id },
        req.user.companyId || req.user.id,
        {
          name: candidateName,
          id: candidateRecord?.id || null,
          candidateUserId: candidateId ? parseInt(candidateId) : null
        },
        io
      );
    } catch (notifError) {
      logger.error('Failed to create offer notification:', notifError);
    }

    res.json({
      success: true,
      message: 'Offer letter generated successfully',
      data: {
        offerId: offerRecord.id,
        trackingToken: offerRecord.trackingToken,
        pdfUrl: offerRecord.s3Url || offerRecord.pdfUrl,
        s3Url: offerRecord.s3Url,
        s3Key: offerRecord.s3Key,
        s3Uploaded: offerRecord.s3Uploaded,
        emailSent: !!emailResult,
        emailMessageId: emailResult?.messageId,
        status: offerRecord.status,
        expiresAt: offerRecord.expiresAt
      }
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('Error generating offer letter:', error);

    let errorMessage = 'Failed to generate offer letter';
    let statusCode = 500;
    if (error.message.includes('Chrome browser not installed')) { errorMessage = 'PDF generation service unavailable.'; statusCode = 503; }
    else if (error.message.includes('File storage error')) { errorMessage = 'File storage service unavailable.'; statusCode = 503; }

    res.status(statusCode).json({ success: false, message: errorMessage });
  }
});

// Legacy generate-and-send endpoint (redirects to generate with sendEmail=true)
router.post('/generate-and-send', authenticate, [
  body('candidateId').optional().isInt().withMessage('Valid candidate ID is required'),
  body('jobId').isInt().withMessage('Valid job ID is required'),
  body('salary').isNumeric().withMessage('Valid salary is required'),
  body('joiningDate').isISO8601().withMessage('Valid joining date is required'),
  body('template').optional().isIn(['modern', 'classic', 'executive', 'creative', 'minimal']).withMessage('Invalid template'),
  body('workLocation').optional().isLength({ min: 1, max: 255 }).withMessage('Invalid work location'),
  body('benefits').optional().isLength({ max: 2000 }).withMessage('Benefits too long')
], async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      candidateId, jobId, applicationId, salary, joiningDate,
      template = 'modern', workLocation = 'Remote',
      benefits = 'Health Insurance, Provident Fund, Paid Time Off, Professional Development',
      candidateName: providedName, candidateEmail: providedEmail
    } = req.body;

    // Resolve candidate info
    let candidateName = providedName || 'Candidate';
    let candidateEmail = providedEmail || '';
    if (candidateId) {
      const user = await db.user.findByPk(parseInt(candidateId), { attributes: ['firstName', 'lastName', 'email'] });
      if (user) {
        candidateName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || candidateName;
        candidateEmail = user.email || candidateEmail;
      }
    }

    // Resolve job title
    let jobTitle = 'Position';
    const job = await db.job.findByPk(parseInt(jobId), { attributes: ['title'] });
    if (job) jobTitle = job.title;

    const cleanSalary = salary.toString().replace(/,/g, '');
    const parsedSalary = parseFloat(cleanSalary);
    const trackingToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const offerContent = generateOfferContent({
      candidateName, jobTitle, salary: cleanSalary, joiningDate,
      workLocation, benefits, companyName: 'HirerMind', template, customizations: {}
    });

    const pdfData = await pdfGenerator.generateOfferLetterPDF({
      candidateId: candidateId || Date.now(),
      candidateName, candidateEmail, jobTitle, salary: cleanSalary,
      joiningDate, workLocation, benefits, companyName: 'HirerMind', template
    });

    const offerData = {
      companyId: req.user.companyId || req.user.id,
      candidateName, candidateEmail, jobTitle, template,
      salary: parsedSalary,
      joiningDate: new Date(joiningDate),
      workLocation, benefits, offerContent,
      status: 'sent', generatedAt: new Date(), sentAt: new Date(),
      expiresAt, trackingToken,
      createdBy: req.user.id,
      s3BucketName: process.env.S3_BUCKET_NAME,
      s3Key: pdfData.s3Key,
      s3Url: pdfData.s3Url,
      s3Uploaded: pdfData.s3Uploaded,
      pdfUrl: pdfData.s3Url || `/uploads/offer-letters/${pdfData.fileName}`,
      jobId: parseInt(jobId)
    };

    if (candidateId) offerData.candidateId = parseInt(candidateId);
    if (applicationId) offerData.applicationId = parseInt(applicationId);

    const offerRecord = await db.OfferLetterEnhanced.create(offerData, { transaction });

    // Send email with PDF attachment
    const emailResult = await sendOfferEmail(offerRecord, pdfData);
    await offerRecord.update({
      emailMessageId: emailResult.messageId,
      emailSent: true
    }, { transaction });

    await transaction.commit();

    // Create notifications for both company user and candidate
    try {
      const NotificationService = require('../services/notification.service');
      const io = req.app.get('io');
      const jobRecord = await db.job.findByPk(parseInt(jobId), { attributes: ['id', 'title', 'company', 'companyId'] });
      let candidateRecord = null;
      if (candidateId) {
        candidateRecord = await db.candidate.findOne({ where: { candidate_id: parseInt(candidateId) }, attributes: ['id', 'candidate_id'] });
      }
      await NotificationService.createOfferNotification(
        offerRecord,
        jobRecord || { id: parseInt(jobId), title: jobTitle, company: 'HirerMind', companyId: req.user.companyId || req.user.id },
        req.user.companyId || req.user.id,
        {
          name: candidateName,
          id: candidateRecord?.id || null,
          candidateUserId: candidateId ? parseInt(candidateId) : null
        },
        io
      );
    } catch (notifError) {
      logger.error('Failed to create offer notification:', notifError);
    }

    res.json({
      success: true,
      message: 'Offer letter generated and sent successfully',
      offerId: offerRecord.id,
      emailMessageId: emailResult.messageId,
      data: {
        offerId: offerRecord.id,
        trackingToken: offerRecord.trackingToken,
        pdfUrl: offerRecord.s3Url || offerRecord.pdfUrl,
        s3Url: offerRecord.s3Url,
        s3Uploaded: offerRecord.s3Uploaded,
        emailSent: true,
        emailMessageId: emailResult.messageId,
        status: offerRecord.status,
        expiresAt: offerRecord.expiresAt
      }
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('Error generating and sending offer letter:', error);
    res.status(500).json({ success: false, message: 'Failed to generate and send offer letter' });
  }
});

// ─── Get specific offer letter ───────────────────────────────

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const offerLetter = await db.OfferLetterEnhanced.findOne({
      where: { id, companyId: req.user.companyId || req.user.id },
      include: [
        { model: db.user, as: 'candidate', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: db.job, as: 'job', attributes: ['id', 'title', 'department', 'description'] },
        { model: db.application, as: 'application', attributes: ['id', 'status', 'appliedDate'] }
      ]
    });

    if (!offerLetter) {
      return res.status(404).json({ success: false, message: 'Offer letter not found' });
    }

    res.json({ success: true, data: offerLetter });
  } catch (error) {
    logger.error('Error fetching offer letter:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch offer letter' });
  }
});

// ─── Get offer letter PDF URL ────────────────────────────────

router.get('/:id/pdf', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { action = 'view' } = req.query;

    const offerLetter = await db.OfferLetterEnhanced.findOne({
      where: { id, companyId: req.user.companyId || req.user.id }
    });

    if (!offerLetter) {
      return res.status(404).json({ success: false, message: 'Offer letter not found' });
    }

    const pdfResponse = await resolvePdfUrl(offerLetter);
    if (!pdfResponse) {
      return res.status(404).json({ success: false, message: 'PDF file not found' });
    }

    res.json({
      success: true,
      data: {
        pdfUrl: pdfResponse.url,
        fileName: `Offer_Letter_${offerLetter.candidateName.replace(/\s+/g, '_')}.pdf`,
        action,
        source: pdfResponse.source
      }
    });
  } catch (error) {
    logger.error('Error fetching offer letter PDF:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch offer letter PDF' });
  }
});

// ─── Send offer letter via email ─────────────────────────────

router.post('/:id/send', authenticate, [
  param('id').isInt().withMessage('Valid offer letter ID required'),
  body('customMessage').optional().isLength({ max: 1000 }).withMessage('Custom message too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { customMessage } = req.body;

    const offerLetter = await db.OfferLetterEnhanced.findOne({
      where: { id, companyId: req.user.companyId || req.user.id }
    });

    if (!offerLetter) {
      return res.status(404).json({ success: false, message: 'Offer letter not found' });
    }

    if (offerLetter.status === 'sent') {
      return res.status(409).json({ success: false, message: 'Offer letter already sent' });
    }

    const emailContent = customMessage || buildDefaultEmailContent(offerLetter);

    // Build attachments array if PDF exists
    const attachments = [];
    if (offerLetter.s3Uploaded && offerLetter.s3Key) {
      try {
        const pdfBuffer = await s3Service.downloadFile(offerLetter.s3Key);
        const tmpPath = path.join('/tmp', `offer_${offerLetter.id}_${Date.now()}.pdf`);
        const fs = require('fs').promises;
        await fs.writeFile(tmpPath, pdfBuffer);
        attachments.push({
          filename: `Offer_Letter_${offerLetter.candidateName.replace(/\s+/g, '_')}.pdf`,
          path: tmpPath,
          contentType: 'application/pdf'
        });
      } catch (s3Err) {
        logger.warn('Could not download PDF for attachment, sending without:', s3Err.message);
      }
    }

    const emailResult = await emailService.sendEmail({
      to: offerLetter.candidateEmail,
      subject: `Job Offer - ${offerLetter.jobTitle}`,
      content: emailContent,
      candidateName: offerLetter.candidateName,
      attachments
    });

    await offerLetter.update({
      status: 'sent',
      sentAt: new Date(),
      emailMessageId: emailResult.messageId,
      emailSent: true
    });

    res.json({
      success: true,
      message: 'Offer letter sent successfully',
      data: { emailMessageId: emailResult.messageId, sentAt: offerLetter.sentAt }
    });
  } catch (error) {
    logger.error('Error sending offer letter:', error);
    res.status(500).json({ success: false, message: 'Failed to send offer letter' });
  }
});

// ─── Update offer letter status (company-facing) ─────────────

router.patch('/:id/status', [
  param('id').isInt().withMessage('Valid offer letter ID required'),
  body('status').isIn(['accepted', 'rejected', 'viewed']).withMessage('Invalid status'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { status, notes } = req.body;

    const offerLetter = await db.OfferLetterEnhanced.findByPk(id);
    if (!offerLetter) {
      return res.status(404).json({ success: false, message: 'Offer letter not found' });
    }

    if (offerLetter.expiresAt && new Date() > offerLetter.expiresAt) {
      await offerLetter.update({ status: 'expired' });
      return res.status(400).json({ success: false, message: 'Offer letter has expired' });
    }

    const updateData = { status, notes: notes || offerLetter.notes };

    if (status === 'accepted') {
      updateData.acceptedAt = new Date();
      if (offerLetter.applicationId) {
        await db.application.update(
          { status: 'hired', stage: 'hired' },
          { where: { id: offerLetter.applicationId } }
        );
      }
    } else if (status === 'rejected') {
      updateData.rejectedAt = new Date();
    } else if (status === 'viewed') {
      updateData.viewedAt = new Date();
    }

    await offerLetter.update(updateData);

    res.json({
      success: true,
      message: `Offer ${status} successfully`,
      data: {
        id: offerLetter.id,
        status: updateData.status,
        candidateName: offerLetter.candidateName,
        jobTitle: offerLetter.jobTitle
      }
    });
  } catch (error) {
    logger.error('Error updating offer letter status:', error);
    res.status(500).json({ success: false, message: 'Failed to update offer letter status' });
  }
});

// ─── Update offer letter content (draft only) ────────────────

router.put('/:id', authenticate, [
  body('content').optional().notEmpty().withMessage('Content cannot be empty')
], async (req, res) => {
  try {
    const { id } = req.params;
    const { content, salary, joiningDate, workLocation, benefits } = req.body;

    const offerLetter = await db.OfferLetterEnhanced.findOne({
      where: { id, companyId: req.user.companyId || req.user.id }
    });

    if (!offerLetter) {
      return res.status(404).json({ success: false, message: 'Offer letter not found' });
    }

    if (offerLetter.status !== 'draft' && offerLetter.status !== 'generated') {
      return res.status(400).json({ success: false, message: 'Cannot update sent offer letter' });
    }

    const updateData = {};
    if (content) updateData.offerContent = content;
    if (salary) updateData.salary = parseFloat(salary);
    if (joiningDate) updateData.joiningDate = new Date(joiningDate);
    if (workLocation) updateData.workLocation = workLocation;
    if (benefits) updateData.benefits = benefits;

    await offerLetter.update(updateData);

    res.json({ success: true, offerLetter });
  } catch (error) {
    logger.error('Error updating offer letter:', error);
    res.status(500).json({ success: false, message: 'Failed to update offer letter' });
  }
});

// ─────────────────────────────────────────────────────────────
// CANDIDATE-FACING ROUTES (require authenticateCandidate)
// ─────────────────────────────────────────────────────────────

// Get offer letters for the authenticated candidate
router.get('/my-offers', authenticateCandidate, async (req, res) => {
  try {
    const candidateEmail = req.candidate.email;

    const offerLetters = await db.OfferLetterEnhanced.findAll({
      where: { candidateEmail },
      include: [
        { model: db.job, as: 'job', attributes: ['id', 'title', 'department', 'location'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, offerLetters });
  } catch (error) {
    logger.error('Error fetching candidate offer letters:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch offer letters' });
  }
});

// Get offer letter by applicationId for the authenticated candidate
router.get('/my-offers/application/:applicationId', authenticateCandidate, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const candidateEmail = req.candidate.email;

    const offerLetter = await db.OfferLetterEnhanced.findOne({
      where: { applicationId: parseInt(applicationId), candidateEmail },
      include: [
        { model: db.job, as: 'job', attributes: ['id', 'title', 'department', 'location'] }
      ]
    });

    if (!offerLetter) {
      return res.status(404).json({ success: false, message: 'Offer letter not found' });
    }

    res.json({ success: true, offerLetter });
  } catch (error) {
    logger.error('Error fetching offer letter:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch offer letter' });
  }
});

// Get PDF URL for candidate viewing
router.get('/my-offers/:id/pdf', authenticateCandidate, async (req, res) => {
  try {
    const { id } = req.params;
    const candidateEmail = req.candidate.email;

    const offerLetter = await db.OfferLetterEnhanced.findOne({
      where: { id: parseInt(id), candidateEmail }
    });

    if (!offerLetter) {
      return res.status(404).json({ success: false, message: 'Offer letter not found' });
    }

    // Update viewed status
    if (offerLetter.status === 'sent' || offerLetter.status === 'generated') {
      await offerLetter.update({ status: 'viewed', viewedAt: new Date() });
    }

    const pdfResponse = await resolvePdfUrl(offerLetter);
    if (!pdfResponse) {
      return res.status(404).json({ success: false, message: 'PDF file not found' });
    }

    res.json({
      success: true,
      data: {
        pdfUrl: pdfResponse.url,
        fileName: `Offer_Letter_${offerLetter.candidateName.replace(/\s+/g, '_')}.pdf`,
        source: pdfResponse.source
      }
    });
  } catch (error) {
    logger.error('Error fetching offer letter PDF:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch offer letter PDF' });
  }
});

// Update offer letter status (candidate accept/reject)
router.patch('/my-offers/:id/status', authenticateCandidate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const candidateEmail = req.candidate.email;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be "accepted" or "rejected"' });
    }

    const offerLetter = await db.OfferLetterEnhanced.findOne({
      where: { id: parseInt(id), candidateEmail }
    });

    if (!offerLetter) {
      return res.status(404).json({ success: false, message: 'Offer letter not found' });
    }

    if (offerLetter.expiresAt && new Date() > offerLetter.expiresAt) {
      await offerLetter.update({ status: 'expired' });
      return res.status(400).json({ success: false, message: 'Offer letter has expired' });
    }

    const updateData = { status, notes: notes || offerLetter.notes };

    if (status === 'accepted') {
      updateData.acceptedAt = new Date();
      if (offerLetter.applicationId) {
        await db.application.update(
          { status: 'hired', stage: 'hired' },
          { where: { id: offerLetter.applicationId } }
        );
      }
    } else if (status === 'rejected') {
      updateData.rejectedAt = new Date();
    }

    await offerLetter.update(updateData);

    res.json({
      success: true,
      message: `Offer ${status} successfully`,
      data: { id: offerLetter.id, status: updateData.status }
    });
  } catch (error) {
    logger.error('Error updating offer letter status:', error);
    res.status(500).json({ success: false, message: 'Failed to update offer letter status' });
  }
});

// ─────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────

/**
 * Resolve the best available PDF URL for an offer letter (S3 signed → legacy).
 * Returns { url, source } or null.
 */
async function resolvePdfUrl(offerLetter) {
  if (offerLetter.s3Uploaded && offerLetter.s3Key) {
    try {
      const signedUrl = s3Service.getSignedUrl(offerLetter.s3Key, 3600);
      return { url: signedUrl, source: 's3' };
    } catch (err) {
      logger.error('Error generating S3 signed URL:', err);
      if (offerLetter.pdfUrl) return { url: offerLetter.pdfUrl, source: 'legacy' };
      return null;
    }
  }
  if (offerLetter.pdfUrl) return { url: offerLetter.pdfUrl, source: 'legacy' };
  return null;
}

/**
 * Send offer letter email with PDF attachment (Req 7.4, integrates task 1.5).
 */
async function sendOfferEmail(offerRecord, pdfData) {
  const formattedSalary = parseFloat(offerRecord.salary).toLocaleString('en-IN');
  const formattedDate = new Date(offerRecord.joiningDate).toLocaleDateString('en-IN');

  const emailContent = buildDefaultEmailContent(offerRecord);

  // Build attachments — prefer buffer from pdfData, fall back to S3 download
  const attachments = [];
  const attachmentFilename = `Offer_Letter_${offerRecord.candidateName.replace(/\s+/g, '_')}.pdf`;

  if (pdfData && pdfData.buffer) {
    // Write buffer to temp file for nodemailer
    const fs = require('fs').promises;
    const tmpPath = path.join('/tmp', `offer_${offerRecord.id || Date.now()}_${Date.now()}.pdf`);
    await fs.writeFile(tmpPath, pdfData.buffer);
    attachments.push({ filename: attachmentFilename, path: tmpPath, contentType: 'application/pdf' });
  } else if (pdfData && pdfData.filePath) {
    attachments.push({ filename: attachmentFilename, path: pdfData.filePath, contentType: 'application/pdf' });
  } else if (offerRecord.s3Uploaded && offerRecord.s3Key) {
    try {
      const pdfBuffer = await s3Service.downloadFile(offerRecord.s3Key);
      const fs = require('fs').promises;
      const tmpPath = path.join('/tmp', `offer_${offerRecord.id || Date.now()}_${Date.now()}.pdf`);
      await fs.writeFile(tmpPath, pdfBuffer);
      attachments.push({ filename: attachmentFilename, path: tmpPath, contentType: 'application/pdf' });
    } catch (err) {
      logger.warn('Could not download PDF for email attachment:', err.message);
    }
  }

  return emailService.sendEmail({
    to: offerRecord.candidateEmail,
    subject: `Job Offer - ${offerRecord.jobTitle}`,
    content: emailContent,
    candidateName: offerRecord.candidateName,
    attachments
  });
}

function buildDefaultEmailContent(offerLetter) {
  const formattedSalary = parseFloat(offerLetter.salary).toLocaleString('en-IN');
  const formattedDate = new Date(offerLetter.joiningDate).toLocaleDateString('en-IN');

  return `Dear ${offerLetter.candidateName},\n\nWe are pleased to offer you the position of ${offerLetter.jobTitle}.\n\nSalary: ₹${formattedSalary} per annum\nJoining Date: ${formattedDate}\nWork Location: ${offerLetter.workLocation}\n\nYour offer letter has been generated and is available for download from your dashboard.\n\nPlease review the terms and conditions and confirm your acceptance within 5 business days.\n\nWe look forward to welcoming you to our team!\n\nBest regards,\nHirerMind Team`;
}

function generateOfferContent({ candidateName, jobTitle, salary, joiningDate, workLocation, benefits, companyName, template, customizations }) {
  const formatSalary = (s) => {
    const amount = parseFloat(s.toString().replace(/[^\d.]/g, ''));
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const baseContent = `Dear ${candidateName},

We are pleased to offer you the position of ${jobTitle} at ${companyName}.

Position Details:
• Job Title: ${jobTitle}
• Annual Salary: ${formatSalary(salary)} per annum
• Start Date: ${new Date(joiningDate).toLocaleDateString('en-IN')}
• Work Location: ${workLocation}

Benefits Package:
${benefits.split(',').map(b => `• ${b.trim()}`).join('\n')}

Terms & Conditions:
• This offer is contingent upon successful completion of background verification
• Employment will be governed by company policies and Indian labor laws
• Notice period: 30 days
• This offer is valid until ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')}

Please confirm your acceptance by replying to this email within 5 business days.

We look forward to welcoming you to our team!

Best regards,
HR Team
${companyName}

---
This is a system-generated offer letter.`;

  return baseContent;
}

module.exports = router;

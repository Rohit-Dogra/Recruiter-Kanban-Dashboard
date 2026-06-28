const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { body, validationResult, param } = require('express-validator');
const db = require('../models');
const emailService = require('../services/emailService');
const pdfGenerator = require('../services/pdfGenerator.service');
const s3Service = require('../services/s3.service');
const logger = require('../utils/logger');
const crypto = require('crypto');

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

// Get all offer letters for a company with enhanced filtering
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      candidateId, 
      applicationId,
      jobId, 
      template,
      dateFrom,
      dateTo,
      search 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = { companyId: req.user.companyId };
    
    // Apply filters
    if (status) whereClause.status = status;
    
    // Support both candidateId and applicationId for backward compatibility
    if (applicationId) {
      whereClause.applicationId = applicationId;
    } else if (candidateId) {
      // Check if candidateId is actually an applicationId by trying to find the application
      const parsedId = parseInt(candidateId);
      if (!isNaN(parsedId)) {
        try {
          const application = await db.application.findByPk(parsedId);
          if (application) {
            // It's an applicationId, search by applicationId
            whereClause.applicationId = parsedId;
          } else {
            whereClause.candidateId = parsedId;
          }
        } catch (error) {
          // If error, assume it's candidateId
          whereClause.candidateId = parsedId;
        }
      }
    }
    
    if (jobId) whereClause.jobId = jobId;
    if (template) whereClause.template = template;
    
    // Date range filter
    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) whereClause.createdAt[db.Sequelize.Op.gte] = new Date(dateFrom);
      if (dateTo) whereClause.createdAt[db.Sequelize.Op.lte] = new Date(dateTo);
    }
    
    // Search filter
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
        { 
          model: db.user, 
          as: 'candidate',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        { 
          model: db.job, 
          as: 'job',
          attributes: ['id', 'title', 'department']
        },
        { 
          model: db.application, 
          as: 'application',
          attributes: ['id', 'status', 'appliedDate']
        }
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
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch offer letters',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Generate offer letter with enhanced customization
router.post('/generate', authenticate, [
  body('candidateName').notEmpty().withMessage('Candidate name required'),
  body('candidateEmail').isEmail().withMessage('Valid email required'),
  body('jobTitle').notEmpty().withMessage('Job title required'),
  body('salary').custom((value) => {
    // Remove commas and check if it's a valid number
    const numericValue = value.toString().replace(/,/g, '');
    if (!/^\d+(\.\d{1,2})?$/.test(numericValue)) {
      throw new Error('Valid salary required');
    }
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
      logger.error('Validation errors:', errors.array());
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: errors.array() 
      });
    }
    
    const { 
      candidateName, 
      candidateEmail, 
      candidatePhone,
      jobTitle, 
      salary, 
      joiningDate, 
      workLocation = 'Remote',
      benefits = 'Health Insurance, Provident Fund, Paid Time Off, Professional Development',
      template = 'modern',
      customizations = {},
      candidateId, 
      jobId, 
      applicationId,
      sendEmail = false
    } = req.body;
    
    // Validate required jobId
    if (!jobId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Job ID is required to generate offer letter'
      });
    }
    
    // Clean and parse salary
    const cleanSalary = salary.toString().replace(/,/g, '');
    const parsedSalary = parseFloat(cleanSalary);
    
    // Generate tracking token
    const trackingToken = crypto.randomBytes(32).toString('hex');
    
    // Set expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Generate offer content with customizations
    const offerContent = generateOfferContent({
      candidateName,
      jobTitle,
      salary: cleanSalary,
      joiningDate,
      workLocation,
      benefits,
      companyName: 'HirerMind',
      template,
      customizations
    });
    
    // Generate PDF with enhanced styling
    console.log('Generating PDF with data:', {
      candidateId: candidateId || Date.now(),
      candidateName,
      candidateEmail,
      jobTitle,
      salary: cleanSalary,
      joiningDate,
      workLocation,
      benefits,
      companyName: 'HirerMind'
    });
    
    const pdfData = await pdfGenerator.generateOfferLetterPDF({
      candidateId: candidateId || Date.now(),
      candidateName,
      candidateEmail,
      jobTitle,
      salary: cleanSalary,
      joiningDate,
      workLocation,
      benefits,
      companyName: 'HirerMind',
      template,
      customizations
    });
    
    console.log('PDF generation result:', {
      s3Key: pdfData.s3Key,
      s3Url: pdfData.s3Url,
      s3Uploaded: pdfData.s3Uploaded,
      fileName: pdfData.fileName
    });
    
    // Create offer letter record
    const offerData = {
      companyId: req.user.companyId || req.user.id,
      candidateName,
      candidateEmail,
      candidatePhone: candidatePhone || null,
      jobTitle,
      template,
      salary: parsedSalary,
      joiningDate: new Date(joiningDate),
      workLocation,
      benefits,
      offerContent,
      customizations,
      status: 'generated',
      generatedAt: new Date(),
      expiresAt,
      trackingToken,
      createdBy: req.user.id,
      
      // S3 storage details
      s3BucketName: process.env.S3_BUCKET_NAME,
      s3Key: pdfData.s3Key,
      s3Url: pdfData.s3Url,
      s3Uploaded: pdfData.s3Uploaded,
      
      // Legacy support
      pdfUrl: pdfData.s3Url || `/uploads/offer-letters/${pdfData.fileName}`,
      
      // Required jobId
      jobId: parseInt(jobId)
    };
    
    // Add optional foreign keys if provided and valid
    if (candidateId) {
      const parsedCandidateId = parseInt(candidateId);
      if (!isNaN(parsedCandidateId)) {
        try {
          const candidateExists = await db.user.findByPk(parsedCandidateId);
          if (candidateExists) {
            offerData.candidateId = parsedCandidateId;
          }
        } catch (error) {
          logger.error('Error linking candidate:', error);
        }
      }
    }
    
    if (applicationId) {
      const parsedApplicationId = parseInt(applicationId);
      if (!isNaN(parsedApplicationId)) {
        try {
          const applicationExists = await db.application.findByPk(parsedApplicationId);
          if (applicationExists) {
            offerData.applicationId = parsedApplicationId;
          }
        } catch (error) {
          logger.error('Error linking application:', error);
        }
      }
    }
    
    const offerRecord = await db.OfferLetterEnhanced.create(offerData, { transaction });
    
    let emailResult = null;
    if (sendEmail) {
      try {
        const formattedSalary = parseFloat(salary).toLocaleString('en-IN');
        const formattedDate = new Date(joiningDate).toLocaleDateString('en-IN');
        
        emailResult = await emailService.sendEmail({
          to: candidateEmail,
          subject: `Job Offer - ${jobTitle}`,
          content: `Dear ${candidateName},\n\nWe are pleased to offer you the position of ${jobTitle}.\n\nSalary: ₹${formattedSalary} per annum\nJoining Date: ${formattedDate}\nWork Location: ${workLocation}\n\nYour offer letter has been generated and is available for download.\n\nPlease review the terms and conditions and confirm your acceptance within 5 business days.\n\nWe look forward to welcoming you to our team!\n\nBest regards,\nHirerMind Team`,
          candidateName: candidateName
        });
        
        // Update email tracking
        await offerRecord.update({
          emailMessageId: emailResult.messageId,
          emailSent: true,
          status: 'sent',
          sentAt: new Date()
        }, { transaction });
      } catch (emailError) {
        logger.error('Email sending failed:', emailError.message);
        // Don't fail the entire operation if email fails
      }
    }
    
    await transaction.commit();
    
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
    
    // Provide specific error messages based on error type
    let errorMessage = 'Failed to generate offer letter';
    let statusCode = 500;
    
    if (error.message.includes('Chrome browser not installed')) {
      errorMessage = 'PDF generation service unavailable. Please contact support.';
      statusCode = 503;
    } else if (error.message.includes('File storage error')) {
      errorMessage = 'File storage service unavailable. Please try again later.';
      statusCode = 503;
    } else if (error.message.includes('Job ID is required')) {
      errorMessage = error.message;
      statusCode = 400;
    }
    
    res.status(statusCode).json({ 
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get specific offer letter with S3 URL
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const offerLetter = await db.OfferLetterEnhanced.findOne({
      where: { id, companyId: req.user.companyId },
      include: [
        { 
          model: db.user, 
          as: 'candidate',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        },
        { 
          model: db.job, 
          as: 'job',
          attributes: ['id', 'title', 'department', 'description']
        },
        { 
          model: db.application, 
          as: 'application',
          attributes: ['id', 'status', 'appliedDate']
        }
      ]
    });
    
    if (!offerLetter) {
      return res.status(404).json({ 
        success: false,
        message: 'Offer letter not found' 
      });
    }
    
    res.json({
      success: true,
      data: offerLetter
    });
  } catch (error) {
    logger.error('Error fetching offer letter:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch offer letter',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get offer letter PDF URL for viewing/downloading
router.get('/:id/pdf', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { action = 'view' } = req.query; // 'view' or 'download'
    
    const offerLetter = await db.OfferLetterEnhanced.findOne({
      where: { id, companyId: req.user.companyId }
    });
    
    if (!offerLetter) {
      return res.status(404).json({ 
        success: false,
        message: 'Offer letter not found' 
      });
    }
    
    // Check if PDF exists in S3
    if (offerLetter.s3Uploaded && offerLetter.s3Key) {
      try {
        // Generate a signed URL for secure access
        const signedUrl = await s3Service.getSignedUrl(offerLetter.s3Key, 3600); // 1 hour expiry
        
        res.json({
          success: true,
          data: {
            pdfUrl: signedUrl,
            fileName: `Offer_Letter_${offerLetter.candidateName.replace(/\s+/g, '_')}.pdf`,
            action,
            source: 's3'
          }
        });
      } catch (s3Error) {
        logger.error('Error generating S3 signed URL:', s3Error);
        
        // Fallback to legacy URL if available
        if (offerLetter.pdfUrl) {
          res.json({
            success: true,
            data: {
              pdfUrl: offerLetter.pdfUrl,
              fileName: `Offer_Letter_${offerLetter.candidateName.replace(/\s+/g, '_')}.pdf`,
              action,
              source: 'legacy'
            }
          });
        } else {
          res.status(500).json({
            success: false,
            message: 'PDF file not accessible'
          });
        }
      }
    } else if (offerLetter.pdfUrl) {
      // Use legacy URL
      res.json({
        success: true,
        data: {
          pdfUrl: offerLetter.pdfUrl,
          fileName: `Offer_Letter_${offerLetter.candidateName.replace(/\s+/g, '_')}.pdf`,
          action,
          source: 'legacy'
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'PDF file not found'
      });
    }
  } catch (error) {
    logger.error('Error fetching offer letter PDF:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch offer letter PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Send offer letter via email
router.post('/:id/send', authenticate, [
  param('id').isInt().withMessage('Valid offer letter ID required'),
  body('customMessage').optional().isLength({ max: 1000 }).withMessage('Custom message too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }
    
    const { id } = req.params;
    const { customMessage } = req.body;
    
    const offerLetter = await db.OfferLetterEnhanced.findOne({
      where: { id, companyId: req.user.companyId }
    });
    
    if (!offerLetter) {
      return res.status(404).json({ 
        success: false,
        message: 'Offer letter not found' 
      });
    }
    
    if (offerLetter.status === 'sent') {
      return res.status(409).json({ 
        success: false,
        message: 'Offer letter already sent' 
      });
    }
    
    // Send email
    const formattedSalary = parseFloat(offerLetter.salary).toLocaleString('en-IN');
    const formattedDate = new Date(offerLetter.joiningDate).toLocaleDateString('en-IN');
    
    const emailContent = customMessage || 
      `Dear ${offerLetter.candidateName},\n\nWe are pleased to offer you the position of ${offerLetter.jobTitle}.\n\nSalary: ₹${formattedSalary} per annum\nJoining Date: ${formattedDate}\nWork Location: ${offerLetter.workLocation}\n\nYour offer letter has been generated and is available for download from your dashboard.\n\nPlease review the terms and conditions and confirm your acceptance within 5 business days.\n\nWe look forward to welcoming you to our team!\n\nBest regards,\nHirerMind Team`;
    
    const emailResult = await emailService.sendEmail({
      to: offerLetter.candidateEmail,
      subject: `Job Offer - ${offerLetter.jobTitle}`,
      content: emailContent,
      candidateName: offerLetter.candidateName
    });
    
    // Update offer letter status
    await offerLetter.update({
      status: 'sent',
      sentAt: new Date(),
      emailMessageId: emailResult.messageId,
      emailSent: true
    });
    
    res.json({
      success: true,
      message: 'Offer letter sent successfully',
      data: {
        emailMessageId: emailResult.messageId,
        sentAt: offerLetter.sentAt
      }
    });
    
  } catch (error) {
    logger.error('Error sending offer letter:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send offer letter',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update offer letter status (for candidate acceptance/rejection)
router.patch('/:id/status', [
  param('id').isInt().withMessage('Valid offer letter ID required'),
  body('status').isIn(['accepted', 'rejected', 'viewed']).withMessage('Invalid status'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }
    
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const offerLetter = await db.OfferLetterEnhanced.findByPk(id);
    
    if (!offerLetter) {
      return res.status(404).json({ 
        success: false,
        message: 'Offer letter not found' 
      });
    }
    
    // Check if offer has expired
    if (offerLetter.expiresAt && new Date() > offerLetter.expiresAt) {
      await offerLetter.update({ status: 'expired' });
      return res.status(400).json({ 
        success: false,
        message: 'Offer letter has expired' 
      });
    }
    
    const updateData = {
      status,
      notes: notes || offerLetter.notes
    };
    
    if (status === 'accepted') {
      updateData.acceptedAt = new Date();
      // Update application status to hired if linked
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
    res.status(500).json({ 
      success: false,
      message: 'Failed to update offer letter status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get offer letter analytics
router.get('/analytics/stats', authenticate, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    
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
      total: 0,
      draft: 0,
      generated: 0,
      sent: 0,
      viewed: 0,
      accepted: 0,
      rejected: 0,
      expired: 0
    };
    
    stats.forEach(stat => {
      statusCounts[stat.status] = parseInt(stat.count);
      statusCounts.total += parseInt(stat.count);
    });
    
    const acceptanceRate = statusCounts.sent > 0 ? 
      ((statusCounts.accepted / statusCounts.sent) * 100).toFixed(1) : 0;
    
    res.json({
      success: true,
      data: {
        ...statusCounts,
        acceptanceRate: parseFloat(acceptanceRate)
      }
    });
  } catch (error) {
    logger.error('Error fetching offer letter analytics:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Helper function to generate offer content with customizations
function generateOfferContent({ candidateName, jobTitle, salary, joiningDate, workLocation, benefits, companyName, template, customizations }) {
  const formatSalary = (salary) => {
    const amount = parseFloat(salary.toString().replace(/[^\\d.]/g, ''));
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
${benefits.split(',').map(benefit => `• ${benefit.trim()}`).join('\\n')}

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

  // Apply template-specific customizations
  if (customizations && Object.keys(customizations).length > 0) {
    // Here you can apply custom formatting based on template and customizations
    // For now, return the base content
    return baseContent;
  }

  return baseContent;
}

module.exports = router;
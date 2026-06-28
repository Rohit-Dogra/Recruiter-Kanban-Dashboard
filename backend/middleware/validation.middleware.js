const { body, validationResult } = require('express-validator');

// Validation middleware
exports.validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    next();
  };
};

// User validation rules
exports.userValidationRules = {
  signup: [
    body('firstName')
      .notEmpty().withMessage('First name is required')
      .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
      .notEmpty().withMessage('Last name is required')
      .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
    body('email')
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Must be a valid email address'),
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('company').optional(),
    body('role').optional(),
    body('teamSize').optional()
  ],
  login: [
    body('email')
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Must be a valid email address'),
    body('password')
      .notEmpty().withMessage('Password is required')
  ],
  forgotPassword: [
    body('email')
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Must be a valid email address')
  ]
};

// Candidate validation rules
exports.candidateValidationRules = {
  create: [
    body('firstName')
      .notEmpty().withMessage('First name is required')
      .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
      .notEmpty().withMessage('Last name is required')
      .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
    body('email')
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Must be a valid email address'),
    body('phone').optional(),
    body('location').optional(),
    body('currentTitle').optional(),
    body('currentCompany').optional(),
    body('experience').optional().isInt().withMessage('Experience must be a number'),
    body('education').optional(),
    body('skills').optional(),
    body('resumeUrl').optional(),
    body('profileUrl').optional(),
    body('avatarUrl').optional(),
    body('notes').optional(),
    body('source').optional(),
    body('jobId').optional().isInt().withMessage('Job ID must be a number')
  ],
  update: [
    body('firstName')
      .optional()
      .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
      .optional()
      .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
    body('email')
      .optional()
      .isEmail().withMessage('Must be a valid email address'),
    body('experience').optional().isInt().withMessage('Experience must be a number'),
    body('resumeUrl').optional(),
    body('profileUrl').optional(),
    body('avatarUrl').optional()
  ]
};



// Interview validation rules
exports.interviewValidationRules = {
  create: [
    body('applicationId')
      .notEmpty().withMessage('Application ID is required')
      .isInt().withMessage('Application ID must be a number'),
    body('scheduledDate')
      .notEmpty().withMessage('Scheduled date is required')
      .isISO8601().withMessage('Scheduled date must be a valid date'),
    body('duration')
      .optional()
      .isInt({ min: 15 }).withMessage('Duration must be at least 15 minutes'),
    body('type')
      .notEmpty().withMessage('Interview type is required')
      .isIn(['phone', 'video', 'in-person', 'technical', 'hr']).withMessage('Invalid interview type'),
    body('location').optional(),
    body('meetingUrl').optional().isURL().withMessage('Meeting URL must be valid'),
    body('interviewerId').optional().isInt().withMessage('Interviewer ID must be a number'),
    body('notes').optional()
  ],
  updateFeedback: [
    body('feedback').optional(),
    body('rating')
      .optional()
      .isFloat({ min: 0, max: 5 }).withMessage('Rating must be between 0 and 5'),
    body('status')
      .optional()
      .isIn(['scheduled', 'completed', 'cancelled', 'no-show']).withMessage('Invalid interview status')
  ]
};

// Application validation rules
exports.applicationValidationRules = {
  submit: [
    body('jobId')
      .notEmpty().withMessage('Job ID is required')
      .isInt().withMessage('Job ID must be a number'),
    body('firstName')
      .notEmpty().withMessage('First name is required')
      .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
      .notEmpty().withMessage('Last name is required')
      .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
    body('email')
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Must be a valid email address'),
    body('phone')
      .notEmpty().withMessage('Phone number is required'),
    body('countryCode')
      .notEmpty().withMessage('Country code is required'),
    body('resumeUrl').optional(),
    body('coverLetter').optional(),
    body('answers').optional().isArray().withMessage('Answers must be an array')
  ],
  updateStatus: [
    body('status')
      .notEmpty().withMessage('Status is required')
      .isIn(['new', 'reviewed', 'shortlisted', 'interview', 'offered', 'hired', 'rejected'])
      .withMessage('Invalid status'),
    body('notes').optional()
  ]
};

// Job validation rules
exports.jobValidationRules = {
  create: [
    body('title')
      .notEmpty().withMessage('Job title is required')
      .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
    body('company')
      .notEmpty().withMessage('Company is required'),
    body('location').optional(),
    body('type')
      .notEmpty().withMessage('Job type is required')
      .isIn(['full-time', 'part-time', 'contract', 'internship', 'temporary']).withMessage('Invalid job type'),
    body('salary').optional(),
    body('department').optional(),
    body('experience')
      .optional()
      .isIn(['entry', 'mid', 'senior', 'lead', 'executive']).withMessage('Invalid experience level'),
    body('description')
      .notEmpty().withMessage('Job description is required'),
    body('requirements')
      .notEmpty().withMessage('Job requirements are required'),
    body('benefits').optional(),
    body('deadline').optional().isDate().withMessage('Deadline must be a valid date'),
    body('isRemote').optional().isBoolean().withMessage('isRemote must be a boolean'),
    body('skills').optional().isArray().withMessage('Skills must be an array'),
    body('status')
      .optional()
      .isIn(['draft', 'active', 'paused', 'closed']).withMessage('Invalid status'),
    body('urgency')
      .optional()
      .isIn(['low', 'medium', 'high']).withMessage('Invalid urgency level')
  ],
  update: [
    body('title')
      .optional()
      .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
    body('type')
      .optional()
      .isIn(['full-time', 'part-time', 'contract', 'internship', 'temporary']).withMessage('Invalid job type'),
    body('experience')
      .optional()
      .isIn(['entry', 'mid', 'senior', 'lead', 'executive']).withMessage('Invalid experience level'),
    body('deadline').optional().isDate().withMessage('Deadline must be a valid date'),
    body('isRemote').optional().isBoolean().withMessage('isRemote must be a boolean'),
    body('skills').optional().isArray().withMessage('Skills must be an array'),
    body('status')
      .optional()
      .isIn(['draft', 'active', 'paused', 'closed']).withMessage('Invalid status'),
    body('urgency')
      .optional()
      .isIn(['low', 'medium', 'high']).withMessage('Invalid urgency level')
  ]
};

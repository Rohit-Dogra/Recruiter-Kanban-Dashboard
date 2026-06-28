const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const { authenticate } = require('../middleware/auth.middleware');
const { body, validationResult } = require('express-validator');

// Send email to candidate
router.post('/send', authenticate, [
  body('to').isEmail().withMessage('Valid email is required'),
  body('subject').trim().isLength({ min: 1 }).withMessage('Subject is required'),
  body('content').trim().isLength({ min: 1 }).withMessage('Content is required'),
  body('candidateName').trim().isLength({ min: 1 }).withMessage('Candidate name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { to, subject, content, candidateName } = req.body;

    const result = await emailService.sendEmail({
      to,
      subject,
      content,
      candidateName
    });

    res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      messageId: result.messageId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send email'
    });
  }
});

module.exports = router;
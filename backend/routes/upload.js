const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const atsService = require('../services/ats.service');
const resumeValidationService = require('../services/resumeValidation.service');
const s3Service = require('../services/s3.service');

// Configure multer for memory storage (S3 upload)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: process.env.MAX_RESUME_SIZE || (10 * 1024 * 1024) // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype === 'application/pdf';

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Upload resume endpoint
router.post('/resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Check S3 configuration
    if (!process.env.S3_BUCKET_NAME) {
      return res.status(500).json({
        success: false,
        message: 'File storage not configured'
      });
    }

    // Validate resume content
    const validation = await resumeValidationService.validateResumeContent(req.file.buffer);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid resume file. Please upload a valid resume PDF containing professional information like experience, education, and skills.',
        error: validation.error || 'Resume content validation failed',
        validationDetails: validation.details
      });
    }

    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = uniqueSuffix + '-' + sanitizedName;

    // Upload to S3
    const s3Result = await s3Service.uploadFile(req.file.buffer, fileName, req.file.mimetype);

    res.status(200).json({
      success: true,
      message: 'Resume uploaded successfully',
      resumeUrl: s3Result.key,
      fileName: fileName,
      originalName: req.file.originalname
    });
  } catch (error) {
    // Handle specific AWS errors
    if (error.code === 'CredentialsError' || error.code === 'SignatureDoesNotMatch') {
      return res.status(500).json({
        success: false,
        message: 'File storage authentication failed'
      });
    }
    
    if (error.code === 'NoSuchBucket') {
      return res.status(500).json({
        success: false,
        message: 'File storage bucket not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload resume'
    });
  }
});

// Upload and analyze resume endpoint
router.post('/analyze-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { jobDescription, jobSkills } = req.body;
    
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = uniqueSuffix + '-' + sanitizedName;

    // Upload to S3
    const s3Result = await s3Service.uploadFile(req.file.buffer, fileName, req.file.mimetype);

    // Analyze resume using buffer (no local file needed)
    let analysis = null;
    let hasSkillsMatch = false;
    if (jobDescription) {
      try {
        // Use buffer-based processing for immediate analysis
        analysis = await atsService.processResumeBuffer(req.file.buffer, jobDescription);
        hasSkillsMatch = analysis && analysis.matchedSkills && analysis.matchedSkills.length > 0;
      } catch (error) {
        // Continue without analysis if it fails
      }
    }

    res.status(200).json({
      success: true,
      message: 'Resume uploaded and analyzed successfully',
      resumeUrl: s3Result.key,
      fileName: fileName,
      analysis: analysis,
      hasSkillsMatch: hasSkillsMatch,
      canProceed: hasSkillsMatch
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload and analyze resume'
    });
  }
});

// Get signed URL for resume access
router.get('/resume/:key(*)', async (req, res) => {
  try {
    let key = req.params.key;
    
    // Handle old local paths - convert to S3 key format
    if (key.includes('/')) {
      const parts = key.split('/');
      const filename = parts[parts.length - 1];
      key = `resumes/${filename}`;
    } else if (!key.startsWith('resumes/')) {
      key = `resumes/${key}`;
    }

    // Check S3 configuration
    if (!process.env.S3_BUCKET_NAME) {
      return res.status(500).json({
        success: false,
        message: 'File storage not configured'
      });
    }

    // Check if file exists in S3
    const exists = await s3Service.fileExists(key);
    if (!exists) {
      return res.status(404).json({
        success: false,
        message: 'Resume file not found'
      });
    }

    // Generate signed URL
    const signedUrl = s3Service.getSignedUrl(key, 3600);
    
    res.json({
      success: true,
      url: signedUrl
    });
  } catch (error) {
    // Handle specific AWS errors
    if (error.code === 'CredentialsError' || error.code === 'SignatureDoesNotMatch') {
      return res.status(500).json({
        success: false,
        message: 'File storage authentication failed'
      });
    }
    
    if (error.code === 'NoSuchBucket') {
      return res.status(500).json({
        success: false,
        message: 'File storage bucket not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to access resume'
    });
  }
});

module.exports = router;

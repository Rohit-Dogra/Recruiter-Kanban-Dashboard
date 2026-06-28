const express = require('express');
const router = express.Router();
const db = require('../models');
const User = db.user;
const Candidate = db.candidate;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validate } = require('../middleware/validation.middleware');
const { body } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Unified login validation rules
const unifiedLoginRules = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

// Helper function to generate JWT token
const generateToken = (user, type = 'company') => {
  const secret = process.env.JWT_SECRET || 'hirermind_super_secret_jwt_key_2024_change_in_production';
  const expiresIn = process.env.JWT_EXPIRES_IN || '30d';
  
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  
  return jwt.sign(
    { id: user.id, email: user.email, type }, 
    secret, 
    { expiresIn }
  );
};

// Unified login endpoint
router.post('/login', validate(unifiedLoginRules), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // First, check if user exists in users table
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No account found with this email address. Please check your email or sign up for a new account.'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token based on user type
    const token = generateToken(user, user.userType);

    // Handle company user
    if (user.userType === 'company') {
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        userType: 'company',
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          company: user.company,
          role: user.role,
          invitedByUserId: user.invitedByUserId || null
        },
        needsCompanyDetails: !user.profile_completed && !user.invitedByUserId,
        redirectTo: '/dashboard'
      });
    }

    // Handle candidate user
    if (user.userType === 'candidate') {
      // Get candidate details
      const candidate = await Candidate.findOne({ where: { email } });
      
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        userType: 'candidate',
        candidate: {
          id: candidate ? candidate.id : user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: candidate ? candidate.phone : null,
          location: candidate ? candidate.location : null
        },
        profileCompleted: user.profile_completed,
        redirectTo: user.profile_completed ? '/candidate/dashboard' : '/candidate/profile'
      });
    }

    // Handle admin user
    if (user.userType === 'admin') {
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        userType: 'admin',
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          company: user.company,
          role: user.role,
          userType: 'admin'
        },
        redirectTo: '/admin'
      });
    }

    // Fallback for unknown user type
    return res.status(400).json({
      success: false,
      message: 'Invalid account type'
    });

  } catch (error) {
    next(error);
  }
});

// Unified Google authentication
router.post('/google', async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required'
      });
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, given_name, family_name, picture } = payload;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email not provided by Google'
      });
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email. Please sign up first.'
      });
    }

    // Generate token based on user type
    const token = generateToken(user, user.userType);

    // Handle company user
    if (user.userType === 'company') {
      return res.status(200).json({
        success: true,
        message: 'Google login successful',
        token,
        userType: 'company',
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          company: user.company,
          role: user.role,
          profilePicture: user.profilePicture
        },
        needsCompanyDetails: !user.profile_completed,
        redirectTo: user.profile_completed ? '/dashboard' : '/auth/company-details'
      });
    }

    // Handle candidate user
    if (user.userType === 'candidate') {
      const candidate = await Candidate.findOne({ where: { email } });
      
      return res.status(200).json({
        success: true,
        message: 'Google login successful',
        token,
        userType: 'candidate',
        candidate: {
          id: candidate ? candidate.id : user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: candidate ? candidate.phone : null,
          location: candidate ? candidate.location : null,
          avatarUrl: user.profilePicture
        },
        profileCompleted: user.profile_completed,
        redirectTo: user.profile_completed ? '/candidate/dashboard' : '/candidate/profile'
      });
    }

    // Handle admin user
    if (user.userType === 'admin') {
      return res.status(200).json({
        success: true,
        message: 'Google login successful',
        token,
        userType: 'admin',
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          company: user.company,
          role: user.role,
          userType: 'admin',
          profilePicture: user.profilePicture
        },
        redirectTo: '/admin'
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid account type'
    });

  } catch (error) {
    console.error('Google auth error:', error);
    next(error);
  }
});

// ── Unified Google Signup ────────────────────────────────────
router.post('/google-signup', async (req, res, next) => {
  try {
    const { credential, accountType } = req.body;

    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential is required' });
    }
    if (!accountType || !['company', 'candidate'].includes(accountType)) {
      return res.status(400).json({ success: false, message: 'Account type must be company or candidate' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, given_name, family_name, picture } = payload;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email not provided by Google' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists. Please sign in instead.'
      });
    }

    if (accountType === 'company') {
      const user = await User.create({
        userType: 'company',
        firstName: given_name || 'User',
        lastName: family_name || '',
        email,
        googleId,
        profilePicture: picture,
        profile_completed: false
      });

      const token = generateToken(user, 'company');

      return res.status(201).json({
        success: true,
        message: 'Company account created with Google',
        token,
        userType: 'company',
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          company: '',
          role: '',
          profilePicture: user.profilePicture
        },
        needsCompanyDetails: true,
        redirectTo: '/auth/company-details'
      });
    }

    if (accountType === 'candidate') {
      const user = await User.create({
        userType: 'candidate',
        firstName: given_name || 'User',
        lastName: family_name || '',
        email,
        googleId,
        profilePicture: picture,
        profile_completed: false
      });

      const candidate = await Candidate.create({
        candidate_id: user.id,
        firstName: given_name || 'User',
        lastName: family_name || '',
        email,
        avatarUrl: picture,
        source: 'google_oauth'
      });

      const token = generateToken(user, 'candidate');

      return res.status(201).json({
        success: true,
        message: 'Candidate account created with Google',
        token,
        userType: 'candidate',
        candidate: {
          id: candidate.id,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          email: candidate.email,
          phone: null,
          location: null,
          avatarUrl: picture
        },
        profileCompleted: false,
        redirectTo: '/candidate/profile'
      });
    }
  } catch (error) {
    console.error('Google signup error:', error);
    next(error);
  }
});

// ── Unified Signup ──────────────────────────────────────────
const unifiedSignupRules = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('accountType').isIn(['company', 'candidate']).withMessage('Account type must be company or candidate'),
  body('company').optional(),
  body('role').optional(),
  body('phone').optional(),
  body('location').optional()
];

router.post('/signup', validate(unifiedSignupRules), async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, accountType, company, role, phone, location } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists. Please sign in instead.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (accountType === 'company') {
      const user = await User.create({
        userType: 'company',
        firstName,
        lastName,
        email,
        password: hashedPassword,
        company: company || '',
        role: role || ''
      });

      const token = generateToken(user, 'company');

      return res.status(201).json({
        success: true,
        message: 'Company account created successfully',
        token,
        userType: 'company',
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          company: user.company,
          role: user.role
        },
        needsCompanyDetails: true,
        redirectTo: '/auth/company-details'
      });
    }

    if (accountType === 'candidate') {
      // Create in users table
      const user = await User.create({
        userType: 'candidate',
        firstName,
        lastName,
        email,
        password: hashedPassword,
        profile_completed: false
      });

      // Create in candidates table
      const candidate = await Candidate.create({
        candidate_id: user.id,
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone: phone || null,
        location: location || null,
        source: 'direct_signup'
      });

      const token = generateToken(user, 'candidate');

      return res.status(201).json({
        success: true,
        message: 'Candidate account created successfully',
        token,
        userType: 'candidate',
        candidate: {
          id: candidate.id,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          email: candidate.email,
          phone: candidate.phone,
          location: candidate.location
        },
        profileCompleted: false,
        redirectTo: '/candidate/profile'
      });
    }

    return res.status(400).json({ success: false, message: 'Invalid account type' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
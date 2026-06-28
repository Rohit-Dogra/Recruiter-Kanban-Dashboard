const express = require('express');
const router = express.Router();
const db = require('../models');
const Candidate = db.candidate;
const User = db.user;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validate } = require('../middleware/validation.middleware');
const { body } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const { authenticateCandidate } = require('../middleware/candidateAuth.middleware');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper function to generate JWT token
// Uses the users table ID (userId) so the token works with authenticateCandidate middleware
const generateToken = (userId, email) => {
  return jwt.sign(
    { id: userId, email: email, userType: 'candidate' }, 
    process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// Candidate signup validation rules
const candidateSignupRules = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional(),
  body('location').optional()
];

// Candidate login validation rules
const candidateLoginRules = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

// Register candidate
router.post('/signup', validate(candidateSignupRules), async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone, location } = req.body;

    // Check if candidate already exists
    const existingCandidate = await Candidate.findOne({ where: { email } });
    if (existingCandidate) {
      return res.status(400).json({
        success: false,
        message: 'Candidate with this email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create candidate in both tables
    const candidate = await Candidate.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      location,
      source: 'direct_signup'
    });

    // Also create in users table
    const candidateUser = await User.create({
      userType: 'candidate',
      firstName,
      lastName,
      email,
      password: hashedPassword,
      profile_completed: false
    });
    
    // Update candidate with user ID
    console.log('Updating candidate with user ID:', candidateUser.id);
    await candidate.update({ candidate_id: candidateUser.id });
    console.log('Candidate updated successfully');

    // Generate token using users table ID
    const token = generateToken(candidateUser.id, candidate.email);

    res.status(201).json({
      success: true,
      message: 'Candidate registered successfully',
      token,
      candidate: {
        id: candidate.id,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        phone: candidate.phone,
        location: candidate.location
      }
    });
  } catch (error) {
    next(error);
  }
});

// Google OAuth login/signup
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
    const { sub: googleId, email, given_name, family_name, picture } = payload;
    
    console.log('Google OAuth payload:', { googleId, email, given_name, family_name });

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email not provided by Google'
      });
    }

    // Check if candidate exists by email or googleId
    let candidate = await Candidate.findOne({ where: { email } });
    let user = await User.findOne({ where: { email, userType: 'candidate' } });
    
    // Check if this email belongs to a company user
    const companyUser = await User.findOne({ where: { email, userType: 'company' } });
    if (companyUser && !candidate) {
      return res.status(403).json({
        success: false,
        message: 'This Google account is registered as a company account. Please use the company login page to access your recruitment dashboard.'
      });
    }
    
    console.log('Existing candidate:', candidate ? candidate.id : 'none');
    console.log('Existing user:', user ? user.id : 'none');

    if (!candidate) {
      // Create new candidate
      candidate = await Candidate.create({
        firstName: given_name || 'User',
        lastName: family_name || 'User',
        email,
        avatarUrl: picture,
        source: 'google_oauth'
      });

      // Also create in users table
      console.log('Creating new user with googleId:', googleId);
      user = await User.create({
        userType: 'candidate',
        firstName: given_name || 'User',
        lastName: family_name || 'User',
        email,
        googleId,
        profilePicture: picture,
        profile_completed: false
      });
      
      console.log('Created user:', user.id, 'with googleId:', user.googleId);
      // Update candidate with user ID
      await candidate.update({ candidate_id: user.id });
    } else if (!user) {
      // Candidate exists but no user record, create user
      user = await User.create({
        userType: 'candidate',
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        googleId,
        profilePicture: picture,
        profile_completed: false
      });
      
      await candidate.update({ candidate_id: user.id });
    } else {
      // Update existing user's googleId if not set
      console.log('Existing user googleId:', user.googleId);
      if (!user.googleId) {
        console.log('Updating existing user with googleId:', googleId);
        await user.update({ googleId, profilePicture: picture });
        console.log('Updated user googleId:', user.googleId);
      }
    }

    // Generate token using users table ID
    const token = generateToken(user.id, candidate.email);

    res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      token,
      candidate: {
        id: candidate.id,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        phone: candidate.phone,
        location: candidate.location,
        avatarUrl: candidate.avatarUrl
      },
      profileCompleted: user ? user.profile_completed : false
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed'
    });
  }
});

// Get candidate profile
router.get('/profile', authenticateCandidate, async (req, res, next) => {
  try {
    const email = req.candidate.email;

    const candidate = await Candidate.findOne({ where: { email } });
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    res.status(200).json({
      success: true,
      candidate: {
        id: candidate.id,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        phone: candidate.phone,
        location: candidate.location,
        currentTitle: candidate.currentTitle,
        currentCompany: candidate.currentCompany,
        experience: candidate.experience,
        education: candidate.education,
        skills: candidate.skills,
        resumeUrl: candidate.resumeUrl
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    next(error);
  }
});

// Update candidate profile
router.put('/profile', authenticateCandidate, async (req, res, next) => {
  console.log('Profile update endpoint hit');
  try {
    const email = req.candidate.email;

    const candidate = await Candidate.findOne({ where: { email } });
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    // Update candidate profile
    await candidate.update(req.body);
    
    // Mark profile as completed in users table
    const user = await User.findOne({ where: { email, userType: 'candidate' } });
    if (user) {
      await user.update({ profile_completed: true });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      candidate
    });
  } catch (error) {
    console.error('Profile update error:', error);
    next(error);
  }
});

// Login candidate
router.post('/login', validate(candidateLoginRules), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if candidate exists and has password
    const candidate = await Candidate.findOne({ where: { email } });
    if (!candidate || !candidate.password) {
      // Check if user exists as company
      const companyUser = await User.findOne({ where: { email, userType: 'company' } });
      if (companyUser) {
        return res.status(401).json({
          success: false,
          message: 'This email is registered as a company account. Please use the company login page to access your account.'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'No candidate account found with this email address. Please check your email or sign up for a new account.'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, candidate.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check profile completion status from users table
    const user = await User.findOne({ where: { email, userType: 'candidate' } });
    const profileCompleted = user ? user.profile_completed : false;

    // Generate token using users table ID
    // If no user record exists yet, create one to ensure JWT works with authenticateCandidate
    let userId;
    if (user) {
      userId = user.id;
    } else {
      const newUser = await User.create({
        userType: 'candidate',
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        profile_completed: false
      });
      userId = newUser.id;
      await candidate.update({ candidate_id: newUser.id });
    }

    const token = generateToken(userId, candidate.email);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      candidate: {
        id: candidate.id,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        phone: candidate.phone,
        location: candidate.location
      },
      profileCompleted
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
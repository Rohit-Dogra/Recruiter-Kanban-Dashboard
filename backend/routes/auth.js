const express = require('express');
const router = express.Router();
const db = require('../models');
const User = db.user;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validate, userValidationRules } = require('../middleware/validation.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper function to generate JWT token
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'hirermind_super_secret_jwt_key_2024_change_in_production';
  const expiresIn = process.env.JWT_EXPIRES_IN || '30d';
  
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  
  return jwt.sign(
    { id: user.id, email: user.email }, 
    secret, 
    { expiresIn }
  );
};

// Register a new user
router.post('/signup', async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, company, role, isGoogleUser } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, and email are required'
      });
    }

    // Validate password for non-Google users
    if (!isGoogleUser && (!password || password.length < 6)) {
      return res.status(400).json({
        success: false,
        message: 'Password is required and must be at least 6 characters'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password for non-Google users
    let hashedPassword = '';
    if (!isGoogleUser && password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    // Create user in database
    const user = await User.create({
      userType: 'company',
      firstName,
      lastName,
      email,
      password: hashedPassword,
      company: company || '',
      role: role || ''
    });

    // Generate token
    const token = generateToken(user);

    // Send response with token
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        company: user.company,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
});

// Login user
router.post('/login', validate(userValidationRules.login), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if user exists and is a company
    const user = await User.findOne({ where: { email, userType: 'company' } });
    if (!user) {
      // Check if user exists as candidate
      const candidateUser = await User.findOne({ where: { email, userType: 'candidate' } });
      if (candidateUser) {
        return res.status(401).json({
          success: false,
          message: 'This email is registered as a candidate account. Please use the candidate login page to access your account.'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'No company account found with this email address. Please check your email or sign up for a new account.'
      });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user);

    // Send response with token and profile completion status
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        company: user.company,
       role: user.role,
        invitedByUserId: user.invitedByUserId || null
      },
      needsCompanyDetails: !user.profile_completed && !user.invitedByUserId
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
});

// Send password reset email
router.post('/forgot-password', validate(userValidationRules.forgotPassword), async (req, res, next) => {
  try {
    const { email } = req.body;

    // Find the user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user with that email'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    next(error);
  }
});

// Reset password
router.post('/reset-password', async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: 'Password reset successful'
  });
});



// Change password (authenticated user - updates own password)
router.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google sign-in. Set a password via forgot password if needed.'
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await user.update({ password: hashedPassword });

    res.status(200).json({
      success: true,
      message: 'Password updated successfully. Please sign in with your new password.'
    });
  } catch (error) {
    next(error);
  }
});


// Google authentication for companies
router.post('/google', async (req, res, next) => {
  try {
    const { credential, mode, userType } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required'
      });
    }

    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google token'
      });
    }

    const { email, given_name, family_name, picture } = payload;

    // Check if user exists
    let user = await User.findOne({ where: { email } });

    if (mode === 'login') {
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'No company account found with this email. Please sign up first or use candidate login if you are a candidate.'
        });
      }
      
      // Verify this is a company user
      if (user.userType !== 'company') {
        return res.status(403).json({
          success: false,
          message: 'This Google account is linked to a candidate account. Please use the candidate login page to access your account.'
        });
      }
    } else if (mode === 'signup') {
      if (user) {
        // Check if existing user is a company
        if (user.userType === 'company') {
          return res.status(400).json({
            success: false,
            message: 'Company account already exists with this email. Please sign in instead.'
          });
        } else {
          return res.status(400).json({
            success: false,
            message: 'An account already exists with this email as a candidate. Please use a different email or sign in as a candidate.'
          });
        }
      }

      // Create new user for signup
      user = await User.create({
        userType: 'company',
        firstName: given_name || '',
        lastName: family_name || '',
        email,
        password: '', // No password for Google users
        company: '', // Will be filled in company details
        role: '',
        googleId: payload.sub,
        profilePicture: picture
      });
    }

    // Generate token
    const token = generateToken(user);

    // Check if profile is completed
    const profileCompleted = user.profile_completed;

    res.status(200).json({
      success: true,
      message: mode === 'login' ? 'Login successful' : 'Account created successfully',
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        company: user.company,
        role: user.role,
        profilePicture: user.profilePicture,
        profile_completed: user.profile_completed
      },
      profileCompleted
    });
  } catch (error) {
    console.error('Google auth error:', error);
    next(error);
  }
});

module.exports = router;
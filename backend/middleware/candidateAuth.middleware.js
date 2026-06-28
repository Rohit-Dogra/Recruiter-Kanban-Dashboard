const jwt = require('jsonwebtoken');
const db = require('../models');
const User = db.user;

exports.authenticateCandidate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login to continue.'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired, please login again'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      });
    }

    // Look up user by decoded id
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Please login again.'
      });
    }

    // Check userType is candidate
    if (user.userType !== 'candidate') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This endpoint is for candidates only.'
      });
    }

    // Attach candidate data to request
    req.candidate = user.toJSON ? user.toJSON() : user;
    req.candidate.candidateId = user.id;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

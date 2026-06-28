const rateLimit = require('express-rate-limit');

/**
 * Configurable rate limiters for sensitive endpoints.
 * Each limiter uses IP-based tracking with a descriptive 429 message.
 */

// Auth endpoints: 10 requests per minute
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 1 minute.',
  },
});

// AI endpoints: 5 requests per minute
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many AI requests. Please try again after 1 minute.',
  },
});

// Email endpoints: 10 requests per minute
const emailLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many email requests. Please try again after 1 minute.',
  },
});

// Upload endpoints: 5 requests per minute
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many upload requests. Please try again after 1 minute.',
  },
});

module.exports = {
  authLimiter,
  aiLimiter,
  emailLimiter,
  uploadLimiter,
};

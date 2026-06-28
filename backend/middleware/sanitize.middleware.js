const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

// Create a DOM window for DOMPurify (server-side)
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Fields that may contain HTML/rich text and need sanitization
const SANITIZE_FIELDS = new Set([
  'description',
  'content',
  'notes',
  'message',
  'coverLetter',
  'aiNotes',
  'benefits',
  'requirements',
  'feedback',
  'comment',
  'body',
  'text',
  'bio',
  'summary',
  'about'
]);

/**
 * Recursively sanitize string fields in an object.
 * Only sanitizes fields in the SANITIZE_FIELDS set to avoid
 * unnecessarily modifying non-HTML fields like emails or names.
 */
function sanitizeValue(value, key) {
  if (typeof value === 'string' && SANITIZE_FIELDS.has(key)) {
    return DOMPurify.sanitize(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, key));
  }
  if (value !== null && typeof value === 'object') {
    return sanitizeObject(value);
  }
  return value;
}

function sanitizeObject(obj) {
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeValue(value, key);
  }
  return sanitized;
}

/**
 * Express middleware that sanitizes req.body fields to prevent stored XSS.
 * Strips dangerous HTML/script tags from user-generated content fields
 * while preserving safe text content.
 */
function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
}

module.exports = { sanitizeInput, sanitizeObject, sanitizeValue, SANITIZE_FIELDS, DOMPurify };

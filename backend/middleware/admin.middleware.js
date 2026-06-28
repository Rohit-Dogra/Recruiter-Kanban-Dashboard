/**
 * Admin authorization middleware.
 * Must be used AFTER auth.middleware.js (authenticate) so req.user is set.
 */
exports.requireAdmin = (req, res, next) => {
  if (!req.user || req.user.userType !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }
  next();
};

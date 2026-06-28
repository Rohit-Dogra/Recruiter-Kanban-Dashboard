const s3Service = require('../services/s3.service');

// Middleware to handle old resume file paths
const handleLegacyResumeRoutes = async (req, res, next) => {
  // Check if this is a request for an old resume file
  if (req.path.startsWith('/uploads/resumes/')) {
    try {
      // Extract filename from the old path
      const filename = req.path.replace('/uploads/resumes/', '');
      const s3Key = `resumes/${filename}`;
      
      console.log('Legacy resume request:', req.path, '-> S3 key:', s3Key);
      
      // Check if file exists in S3
      const exists = await s3Service.fileExists(s3Key);
      if (!exists) {
        return res.status(404).json({
          success: false,
          message: 'Resume file not found'
        });
      }
      
      // Generate signed URL and redirect
      const signedUrl = s3Service.getSignedUrl(s3Key, 3600);
      return res.redirect(signedUrl);
      
    } catch (error) {
      console.error('Legacy resume route error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to access resume'
      });
    }
  }
  
  // Continue to next middleware if not a resume request
  next();
};

module.exports = handleLegacyResumeRoutes;
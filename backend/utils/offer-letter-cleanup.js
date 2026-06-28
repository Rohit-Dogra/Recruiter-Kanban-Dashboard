const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

class OfferLetterCleanup {
  constructor() {
    this.cleanupInterval = null;
    this.cleanupIntervalMs = 24 * 60 * 60 * 1000; // 24 hours
  }

  startPeriodicCleanup() {
    logger.info('Starting offer letter cleanup service');
    
    // Run cleanup immediately
    this.cleanupOldFiles();
    
    // Schedule periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldFiles();
    }, this.cleanupIntervalMs);
  }

  stopPeriodicCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.info('Stopped offer letter cleanup service');
    }
  }

  async cleanupOldFiles() {
    try {
      const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'offer-letters');
      
      // Check if directory exists
      try {
        await fs.access(uploadsDir);
      } catch (error) {
        // Directory doesn't exist, nothing to clean
        return;
      }

      const files = await fs.readdir(uploadsDir);
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      let cleanedCount = 0;

      for (const file of files) {
        const filePath = path.join(uploadsDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        logger.info(`Cleaned up ${cleanedCount} old offer letter files`);
      }
    } catch (error) {
      logger.error('Error during offer letter cleanup:', error.message);
    }
  }
}

const offerLetterCleanup = new OfferLetterCleanup();

module.exports = {
  offerLetterCleanup
};
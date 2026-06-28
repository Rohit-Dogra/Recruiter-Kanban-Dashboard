const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const db = require('../models');
const s3Service = require('../services/s3.service');
const logger = require('../utils/logger');

// Get offer letter status for a candidate
router.get('/candidate/:candidateId', authenticate, async (req, res) => {
  try {
    const { candidateId } = req.params;
    
    const offerLetter = await db.OfferLetter.findOne({
      where: { 
        candidateId: parseInt(candidateId),
        companyId: req.user.companyId || req.user.id
      },
      order: [['createdAt', 'DESC']]
    });
    
    if (!offerLetter) {
      return res.json({ 
        hasOffer: false,
        message: 'No offer letter found for this candidate'
      });
    }
    
    // Generate signed URL if S3 URL exists
    let signedUrl = null;
    if (offerLetter.pdfUrl && offerLetter.pdfUrl.includes('amazonaws.com')) {
      try {
        // Extract S3 key from URL
        const urlParts = offerLetter.pdfUrl.split('/');
        const key = urlParts.slice(-2).join('/'); // Get last two parts (folder/filename)
        signedUrl = s3Service.getSignedUrl(key, 3600); // 1 hour expiry
      } catch (error) {
        logger.warn('Failed to generate signed URL:', error.message);
      }
    }
    
    res.json({
      hasOffer: true,
      offerId: offerLetter.id,
      status: offerLetter.status,
      pdfUrl: signedUrl || offerLetter.pdfUrl,
      sentAt: offerLetter.sentAt,
      expiresAt: offerLetter.expiresAt,
      salary: offerLetter.salary,
      joiningDate: offerLetter.joiningDate,
      workLocation: offerLetter.workLocation
    });
    
  } catch (error) {
    logger.error('Error fetching offer letter status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch offer letter status'
    });
  }
});

// Get all offer letters for pipeline view
router.get('/pipeline', authenticate, async (req, res) => {
  try {
    const offerLetters = await db.OfferLetter.findAll({
      where: { 
        companyId: req.user.companyId || req.user.id
      },
      include: [
        {
          model: db.User,
          as: 'candidate',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: db.Job,
          as: 'job',
          attributes: ['id', 'title']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // Generate signed URLs for S3 files
    const offersWithUrls = await Promise.all(
      offerLetters.map(async (offer) => {
        let signedUrl = null;
        if (offer.pdfUrl && offer.pdfUrl.includes('amazonaws.com')) {
          try {
            const urlParts = offer.pdfUrl.split('/');
            const key = urlParts.slice(-2).join('/');
            signedUrl = s3Service.getSignedUrl(key, 3600);
          } catch (error) {
            logger.warn('Failed to generate signed URL for offer:', offer.id);
          }
        }
        
        return {
          ...offer.toJSON(),
          pdfUrl: signedUrl || offer.pdfUrl
        };
      })
    );
    
    res.json({
      success: true,
      offerLetters: offersWithUrls
    });
    
  } catch (error) {
    logger.error('Error fetching pipeline offer letters:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch offer letters'
    });
  }
});

module.exports = router;
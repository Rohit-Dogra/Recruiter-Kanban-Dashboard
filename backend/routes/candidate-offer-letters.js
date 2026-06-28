const express = require('express');
const router = express.Router();
const db = require('../models');
const s3Service = require('../services/s3.service');
const logger = require('../utils/logger');
const { authenticateCandidate } = require('../middleware/candidateAuth.middleware');

// Get offer letters for the authenticated candidate
router.get('/my-offers', authenticateCandidate, async (req, res) => {
  try {
    const candidateEmail = req.candidate.email;
    
    // Find all offer letters for this candidate
    const offerLetters = await db.OfferLetterEnhanced.findAll({
      where: { candidateEmail },
      include: [
        {
          model: db.job,
          as: 'job',
          attributes: ['id', 'title', 'department', 'location']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      offerLetters
    });
  } catch (error) {
    logger.error('Error fetching candidate offer letters:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch offer letters',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get offer letter by applicationId for the authenticated candidate
router.get('/my-offers/application/:applicationId', authenticateCandidate, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const candidateEmail = req.candidate.email;
    
    // Find offer letter for this application and candidate
    const offerLetter = await db.OfferLetterEnhanced.findOne({
      where: {
        applicationId: parseInt(applicationId),
        candidateEmail
      },
      include: [
        {
          model: db.job,
          as: 'job',
          attributes: ['id', 'title', 'department', 'location']
        }
      ]
    });
    
    if (!offerLetter) {
      return res.status(404).json({
        success: false,
        message: 'Offer letter not found'
      });
    }
    
    res.json({
      success: true,
      offerLetter
    });
  } catch (error) {
    logger.error('Error fetching offer letter:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch offer letter',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get PDF URL for viewing
router.get('/my-offers/:id/pdf', authenticateCandidate, async (req, res) => {
  try {
    const { id } = req.params;
    const candidateEmail = req.candidate.email;
    
    // Find offer letter and verify it belongs to this candidate
    const offerLetter = await db.OfferLetterEnhanced.findOne({
      where: {
        id: parseInt(id),
        candidateEmail
      }
    });
    
    if (!offerLetter) {
      return res.status(404).json({
        success: false,
        message: 'Offer letter not found'
      });
    }
    
    // Update viewed status if not already viewed
    if (offerLetter.status === 'sent' || offerLetter.status === 'generated') {
      await offerLetter.update({
        status: 'viewed',
        viewedAt: new Date()
      });
    }
    
    // Check if PDF exists in S3
    if (offerLetter.s3Uploaded && offerLetter.s3Key) {
      try {
        // Generate a signed URL for secure access
        const signedUrl = await s3Service.getSignedUrl(offerLetter.s3Key, 3600); // 1 hour expiry
        
        res.json({
          success: true,
          data: {
            pdfUrl: signedUrl,
            fileName: `Offer_Letter_${offerLetter.candidateName.replace(/\\s+/g, '_')}.pdf`,
            source: 's3'
          }
        });
      } catch (s3Error) {
        logger.error('Error generating S3 signed URL:', s3Error);
        
        // Fallback to legacy URL if available
        if (offerLetter.pdfUrl) {
          res.json({
            success: true,
            data: {
              pdfUrl: offerLetter.pdfUrl,
              fileName: `Offer_Letter_${offerLetter.candidateName.replace(/\\s+/g, '_')}.pdf`,
              source: 'legacy'
            }
          });
        } else {
          res.status(500).json({
            success: false,
            message: 'PDF file not accessible'
          });
        }
      }
    } else if (offerLetter.pdfUrl) {
      // Use legacy URL
      res.json({
        success: true,
        data: {
          pdfUrl: offerLetter.pdfUrl,
          fileName: `Offer_Letter_${offerLetter.candidateName.replace(/\\s+/g, '_')}.pdf`,
          source: 'legacy'
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'PDF file not found'
      });
    }
  } catch (error) {
    logger.error('Error fetching offer letter PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch offer letter PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update offer letter status (accept/reject)
router.patch('/my-offers/:id/status', authenticateCandidate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const candidateEmail = req.candidate.email;
    
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "accepted" or "rejected"'
      });
    }
    
    // Find offer letter and verify it belongs to this candidate
    const offerLetter = await db.OfferLetterEnhanced.findOne({
      where: {
        id: parseInt(id),
        candidateEmail
      }
    });
    
    if (!offerLetter) {
      return res.status(404).json({
        success: false,
        message: 'Offer letter not found'
      });
    }
    
    // Check if offer has expired
    if (offerLetter.expiresAt && new Date() > offerLetter.expiresAt) {
      await offerLetter.update({ status: 'expired' });
      return res.status(400).json({
        success: false,
        message: 'Offer letter has expired'
      });
    }
    
    const updateData = {
      status,
      notes: notes || offerLetter.notes
    };
    
    if (status === 'accepted') {
      updateData.acceptedAt = new Date();
      // Update application status to hired if linked
      if (offerLetter.applicationId) {
        await db.application.update(
          { status: 'hired', stage: 'hired' },
          { where: { id: offerLetter.applicationId } }
        );
      }
    } else if (status === 'rejected') {
      updateData.rejectedAt = new Date();
    }
    
    await offerLetter.update(updateData);
    
    res.json({
      success: true,
      message: `Offer ${status} successfully`,
      data: {
        id: offerLetter.id,
        status: updateData.status
      }
    });
  } catch (error) {
    logger.error('Error updating offer letter status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update offer letter status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;

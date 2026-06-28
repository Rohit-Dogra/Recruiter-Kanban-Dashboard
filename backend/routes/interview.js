const express = require('express');
const router = express.Router();
const db = require('../models');
const Interview = db.interview;
const Application = db.application;
const User = db.user;
const { Op } = db.Sequelize;
const { authenticate } = require('../middleware/auth.middleware');
const { checkCanUse, recordUsage } = require('./subscription');

// Create and Save a new Interview
router.post('/', authenticate, async (req, res) => {
  try {
    // Validate request
    if (!req.body.applicationId || !req.body.scheduledDate || !req.body.type) {
      return res.status(400).json({
        message: "Application ID, scheduled date, and interview type are required!"
      });
    }

    // Validate conditional fields based on interview type
    if (req.body.type === 'video' && !req.body.meetingUrl) {
      return res.status(400).json({
        message: "Meeting URL is required for virtual interviews!"
      });
    }

    if (req.body.type === 'in-person' && (!req.body.location || !req.body.mapLink)) {
      return res.status(400).json({
        message: "Meeting address and Google Map link are required for onsite interviews!"
      });
    }

    // Check subscription for technical interviews only (use owner id for invited users)
    const interviewType = req.body.type;
    const effectiveUserId = req.user.companyId ?? req.user.invitedByUserId ?? req.user.id;

    // Validate application exists and belongs to the company
    const application = await Application.findOne({
      where: {
        id: req.body.applicationId,
        companyId: req.user.id
      },
      include: [
        {
          model: db.job,
          as: 'job',
          attributes: ['title', 'company']
        }
      ]
    });
    if (!application) {
      return res.status(400).json({
        message: "Application not found or access denied!"
      });
    }

    // Get candidate details
    const candidate = await db.candidate.findOne({
      where: { candidate_id: application.candidateId },
      attributes: ['firstName', 'lastName', 'email']
    });

    // Validate interviewer exists if provided, otherwise set to null
    let validInterviewerId = null;
    let interviewer = null;
    if (req.body.interviewerId) {
      interviewer = await User.findByPk(req.body.interviewerId);
      if (interviewer) {
        validInterviewerId = req.body.interviewerId;
      }
    }

    // Create an Interview
    const interview = {
      applicationId: req.body.applicationId,
      scheduledDate: req.body.scheduledDate,
      duration: req.body.duration || 60,
      type: req.body.type,
      location: req.body.location,
      meetingUrl: req.body.meetingUrl,
      mapLink: req.body.mapLink,
      interviewerId: validInterviewerId,
      notes: req.body.notes
    };

    // Save Interview in the database
    const data = await Interview.create(interview);
    
    // Get user's custom pipeline configuration to find the correct status for interview stage
    const pipelineService = require('../services/pipeline.service');
    const userPipeline = await pipelineService.getCompanyPipeline(req.user.id);
    
    // Find the interview stage in user's pipeline configuration
    const interviewStage = userPipeline.find(stage => 
      stage.actionType === 'interview' || 
      stage.title.toLowerCase().includes('interview') ||
      stage.title.toLowerCase().includes('technical')
    );
    
    // Use the system status from user's pipeline configuration
    const statusToUse = interviewStage ? interviewStage.systemStatus : 'shortlisted';
    
    // Update application status using user-defined pipeline configuration
    await Application.update(
      { status: statusToUse, stage: 'technical-interview' },
      { where: { id: req.body.applicationId } }
    );

    // Create notifications for both company user and candidate
    try {
      const NotificationService = require('../services/notification.service');
      const io = req.app.get('io');
      await NotificationService.createInterviewNotification(
        data,
        application,
        application.job || { id: application.jobId, companyId: req.user.id, title: 'Position', company: '' },
        {
          name: candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Candidate',
          id: candidate?.id,
          candidateUserId: application.candidateId
        },
        io
      );
    } catch (notifError) {
      console.error('Failed to create interview notification:', notifError);
    }

    // Send email notifications
    const emailService = require('../services/emailService');
    const interviewDate = new Date(req.body.scheduledDate).toLocaleDateString();
    const interviewTime = new Date(req.body.scheduledDate).toLocaleTimeString();
    
    // Email to candidate
    if (candidate?.email) {
      const candidateEmailContent = `Dear ${candidate.firstName},

Your interview has been scheduled for the position: ${application.job?.title}

Interview Details:
• Date: ${interviewDate}
• Time: ${interviewTime}
• Duration: ${req.body.duration || 60} minutes
• Type: ${req.body.type}
${req.body.type === 'video' ? `• Meeting URL: ${req.body.meetingUrl}` : ''}
${req.body.type === 'in-person' ? `• Location: ${req.body.location}\n• Map Link: ${req.body.mapLink}` : ''}
${req.body.notes ? `\nNotes: ${req.body.notes}` : ''}

Please confirm your attendance and let us know if you have any questions.

Best regards,
Hiring Team`;
      
      try {
        await emailService.sendEmail({
          to: candidate.email,
          subject: `Interview Scheduled - ${application.job?.title}`,
          content: candidateEmailContent,
          candidateName: `${candidate.firstName} ${candidate.lastName}`
        });
      } catch (emailError) {
        console.error('Failed to send candidate email:', emailError);
      }
    }

    // Email to interviewer
    if (interviewer?.email) {
      const interviewerEmailContent = `Dear ${interviewer.firstName},

You have been assigned to conduct an interview for the position: ${application.job?.title}

Candidate: ${candidate?.firstName} ${candidate?.lastName}

Interview Details:
• Date: ${interviewDate}
• Time: ${interviewTime}
• Duration: ${req.body.duration || 60} minutes
• Type: ${req.body.type}
${req.body.type === 'video' ? `• Meeting URL: ${req.body.meetingUrl}` : ''}
${req.body.type === 'in-person' ? `• Location: ${req.body.location}\n• Map Link: ${req.body.mapLink}` : ''}
${req.body.notes ? `\nNotes: ${req.body.notes}` : ''}

Please prepare for the interview and contact the candidate if needed.

Best regards,
Hiring Team`;
      
      try {
        await emailService.sendEmail({
          to: interviewer.email,
          subject: `Interview Assignment - ${application.job?.title}`,
          content: interviewerEmailContent,
          candidateName: `${interviewer.firstName} ${interviewer.lastName}`
        });
      } catch (emailError) {
        console.error('Failed to send interviewer email:', emailError);
      }
    }

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({
      message: err.message || "Some error occurred while creating the Interview."
    });
  }
});

// Retrieve all Interviews
router.get('/', authenticate, async (req, res) => {
  try {
    const { applicationId, interviewerId, startDate, endDate, status } = req.query;
    let condition = {};
    let dateCondition = {};

    if (applicationId) {
      condition.applicationId = applicationId;
    }

    if (interviewerId) {
      condition.interviewerId = interviewerId;
    }

    if (status) {
      condition.status = status;
    }

    if (startDate) {
      dateCondition[Op.gte] = new Date(startDate);
    }

    if (endDate) {
      dateCondition[Op.lte] = new Date(endDate);
    }

    if (Object.keys(dateCondition).length > 0) {
      condition.scheduledDate = dateCondition;
    }

    const interviews = await Interview.findAll({
      where: condition,
      include: [
        {
          model: Application,
          as: 'application',
          where: {
            companyId: req.user.id
          },
          include: [
            {
              model: db.job,
              as: 'job',
              attributes: ['title', 'company', 'location']
            }
          ]
        },
        {
          model: User,
          as: 'interviewer',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['scheduledDate', 'ASC']]
    });

    // Manually fetch candidate details for each interview
    const data = await Promise.all(
      interviews.map(async (interview) => {
        const candidate = await db.candidate.findOne({
          where: { candidate_id: interview.application.candidateId },
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'location', 'experience', 'skills', 'currentTitle', 'currentCompany', 'education', 'avatarUrl', 'resumeUrl']
        });
        
        return {
          ...interview.toJSON(),
          application: {
            ...interview.application.toJSON(),
            candidate: candidate ? candidate.toJSON() : null
          }
        };
      })
    );
    
    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: err.message || "Some error occurred while retrieving interviews."
    });
  }
});

// Find a single Interview by id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const id = req.params.id;
    const interview = await Interview.findByPk(id, {
      include: [
        {
          model: Application,
          as: 'application',
          where: {
            companyId: req.user.id
          },
          include: [
            {
              model: db.job,
              as: 'job',
              attributes: ['title', 'company', 'location']
            }
          ]
        },
        {
          model: User,
          as: 'interviewer',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });
    
    let data = null;
    if (interview) {
      // Fetch full candidate details
      const candidate = await db.candidate.findOne({
        where: { candidate_id: interview.application.candidateId },
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'location', 'experience', 'skills', 'currentTitle', 'currentCompany', 'education', 'avatarUrl', 'resumeUrl']
      });
      
      data = {
        ...interview.toJSON(),
        application: {
          ...interview.application.toJSON(),
          candidate: candidate ? candidate.toJSON() : null
        }
      };
    }
    
    if (data) {
      res.json(data);
    } else {
      res.status(404).json({
        message: `Interview with id=${id} was not found.`
      });
    }
  } catch (err) {
    res.status(500).json({
      message: `Error retrieving Interview with id=${req.params.id}`
    });
  }
});

// Update interview feedback
router.put('/:id/feedback', authenticate, async (req, res) => {
  try {
    const id = req.params.id;
    const { feedback, rating, status } = req.body;
    
    if (!feedback && !rating) {
      return res.status(400).json({
        message: "Feedback or rating must be provided"
      });
    }

    // Verify interview belongs to the company
    const interview = await Interview.findByPk(id, {
      include: [{
        model: Application,
        as: 'application',
        where: { companyId: req.user.id }
      }]
    });
    
    if (!interview) {
      return res.status(404).json({
        message: "Interview not found or access denied"
      });
    }

    const updateData = {};
    if (feedback) updateData.feedback = feedback;
    if (rating) updateData.rating = rating;
    if (status) updateData.status = status;
    
    const num = await Interview.update(updateData, {
      where: { id: id }
    });

    if (num == 1) {
      // If interview is completed, update the application status
      if (status === 'completed') {
        const interview = await Interview.findByPk(id);
        if (interview) {
          await Application.update(
            { stage: 'post-interview' },
            { where: { id: interview.applicationId } }
          );
        }
      }

      res.json({
        message: "Interview feedback was updated successfully."
      });
    } else {
      res.status(404).json({
        message: `Cannot update Interview with id=${id}. Maybe Interview was not found!`
      });
    }
  } catch (err) {
    res.status(500).json({
      message: `Error updating Interview with id=${req.params.id}`
    });
  }
});

// Update an Interview by id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const id = req.params.id;
    // Verify interview belongs to the company
    const interview = await Interview.findByPk(id, {
      include: [{
        model: Application,
        as: 'application',
        where: { companyId: req.user.id }
      }]
    });
    
    if (!interview) {
      return res.status(404).json({
        message: "Interview not found or access denied"
      });
    }
    
    const num = await Interview.update(req.body, {
      where: { id: id }
    });

    if (num == 1) {
      res.json({
        message: "Interview was updated successfully."
      });
    } else {
      res.status(404).json({
        message: `Cannot update Interview with id=${id}. Maybe Interview was not found or req.body is empty!`
      });
    }
  } catch (err) {
    res.status(500).json({
      message: `Error updating Interview with id=${req.params.id}`
    });
  }
});

// Delete an Interview
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const id = req.params.id;
    // Verify interview belongs to the company
    const interview = await Interview.findByPk(id, {
      include: [{
        model: Application,
        as: 'application',
        where: { companyId: req.user.id }
      }]
    });
    
    if (!interview) {
      return res.status(404).json({
        message: "Interview not found or access denied"
      });
    }
    
    const num = await Interview.destroy({
      where: { id: id }
    });

    if (num == 1) {
      res.json({
        message: "Interview was deleted successfully!"
      });
    } else {
      res.status(404).json({
        message: `Cannot delete Interview with id=${id}. Maybe Interview was not found!`
      });
    }
  } catch (err) {
    res.status(500).json({
      message: `Could not delete Interview with id=${req.params.id}`
    });
  }
});

module.exports = router;
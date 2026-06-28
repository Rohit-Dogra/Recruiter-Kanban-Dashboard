const db = require('../models');

class NotificationService {
  /**
   * Emit a new_notification WebSocket event to a user's room.
   * @param {object|null} io - Socket.IO server instance
   * @param {number} userId - The user ID to notify
   * @param {object} notification - The notification record
   */
  static emitNotification(io, userId, notification) {
    if (io && userId) {
      io.to(`user_${userId}`).emit('new_notification', {
        notification: notification.toJSON ? notification.toJSON() : notification
      });
    }
  }

  // Create notification for new job application
  // Note: candidate.id here refers to the candidates table PK (not users.id)
  // because notification.candidateId references candidates.id
  static async createApplicationNotification(application, job, candidate, io) {
    try {
      // Company notification (no candidateId so it won't appear in candidate's feed)
      const companyNotif = await db.notification.create({
        userId: job.companyId,
        type: 'candidate',
        title: 'New Application Received',
        message: `${candidate.name} applied for ${job.title}`,
        tag: 'New Apply',
        jobId: job.id,
        applicationId: application.id,
        read: false
      });
      NotificationService.emitNotification(io, job.companyId, companyNotif);

      // Candidate notification
      const candidateNotif = await db.notification.create({
        candidateId: candidate.id,
        type: 'candidate',
        title: 'Application Submitted',
        message: `Your application for ${job.title} at ${job.company} has been submitted successfully`,
        tag: 'Applied',
        jobId: job.id,
        applicationId: application.id,
        read: false
      });
      // Emit to candidate's user ID (candidate.candidateUserId if available)
      if (candidate.candidateUserId) {
        NotificationService.emitNotification(io, candidate.candidateUserId, candidateNotif);
      }
    } catch (error) {
      console.error('Error creating application notification:', error);
    }
  }

  // Create notification for job post
  static async createJobPostNotification(job, userId, io) {
    try {
      const notif = await db.notification.create({
        userId: userId,
        type: 'job',
        title: 'Job Post Published',
        message: `Your job posting '${job.title}' is now live and receiving applications.`,
        tag: 'Job',
        jobId: job.id,
        read: false
      });
      NotificationService.emitNotification(io, userId, notif);
    } catch (error) {
      console.error('Error creating job post notification:', error);
    }
  }

  // Create notification for pipeline stage change (both company user and candidate)
  static async createStageChangeNotification(application, job, candidate, oldStage, newStage, io) {
    try {
      // Company notification (no candidateId so it won't appear in candidate's feed)
      const companyNotif = await db.notification.create({
        userId: job.companyId,
        type: 'candidate',
        title: 'Candidate Stage Updated',
        message: `${candidate.name} moved from ${oldStage} to ${newStage} for ${job.title}`,
        tag: newStage,
        jobId: job.id,
        applicationId: application.id,
        read: false
      });
      NotificationService.emitNotification(io, job.companyId, companyNotif);

      // Candidate notification
      const candidateNotif = await db.notification.create({
        candidateId: candidate.id,
        type: 'candidate',
        title: 'Application Status Updated',
        message: `Your application for ${job.title} at ${job.company} has been moved to ${newStage}`,
        tag: newStage,
        jobId: job.id,
        applicationId: application.id,
        read: false
      });
      // Emit to candidate's user ID
      if (candidate.candidateUserId) {
        NotificationService.emitNotification(io, candidate.candidateUserId, candidateNotif);
      }
    } catch (error) {
      console.error('Error creating stage change notification:', error);
    }
  }

  // Create notification for interview scheduled (both company user and candidate)
  static async createInterviewNotification(interview, application, job, candidate, io) {
    try {
      // Company notification (no candidateId so it won't appear in candidate's feed)
      const companyNotif = await db.notification.create({
        userId: job.companyId,
        type: 'interview',
        title: 'Interview Scheduled',
        message: `Interview scheduled with ${candidate.name} for ${job.title}`,
        tag: 'Scheduled',
        jobId: job.id,
        applicationId: application.id,
        read: false
      });
      NotificationService.emitNotification(io, job.companyId, companyNotif);

      // Candidate notification
      const candidateNotif = await db.notification.create({
        candidateId: candidate.id,
        type: 'interview',
        title: 'Interview Scheduled',
        message: `Your interview for ${job.title} at ${job.company} has been scheduled`,
        tag: 'Scheduled',
        jobId: job.id,
        applicationId: application.id,
        read: false
      });
      // Emit to candidate's user ID
      if (candidate.candidateUserId) {
        NotificationService.emitNotification(io, candidate.candidateUserId, candidateNotif);
      }
    } catch (error) {
      console.error('Error creating interview notification:', error);
    }
  }

  // Create notification for offer letter events (both company user and candidate)
  static async createOfferNotification(offerLetter, job, companyUserId, candidate, io) {
    try {
      // Company notification (no candidateId so it won't appear in candidate's feed)
      const companyNotif = await db.notification.create({
        userId: companyUserId,
        type: 'offer',
        title: 'Offer Letter Generated',
        message: `Offer letter for ${candidate.name} for ${job.title} has been generated`,
        tag: 'Offer',
        jobId: job.id,
        read: false
      });
      NotificationService.emitNotification(io, companyUserId, companyNotif);

      // Candidate notification
      const candidateNotif = await db.notification.create({
        candidateId: candidate.id,
        type: 'offer',
        title: 'Offer Letter Received',
        message: `You have received an offer letter for ${job.title} at ${job.company || 'the company'}`,
        tag: 'Offer',
        jobId: job.id,
        read: false
      });
      // Emit to candidate's user ID
      if (candidate.candidateUserId) {
        NotificationService.emitNotification(io, candidate.candidateUserId, candidateNotif);
      }
    } catch (error) {
      console.error('Error creating offer notification:', error);
    }
  }
}

module.exports = NotificationService;

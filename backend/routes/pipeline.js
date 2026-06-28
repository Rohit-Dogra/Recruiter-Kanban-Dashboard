const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const pipelineService = require('../services/pipeline.service');
const db = require('../models');

// Get company pipeline (admin or sub-users of that company can access)
router.get('/company/:companyId', authenticate, async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const effectiveCompanyId = req.user.companyId || req.user.id;
    if (effectiveCompanyId !== parseInt(companyId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const pipeline = await pipelineService.getCompanyPipeline(companyId);
    res.json({ success: true, pipeline });
  } catch (error) {
    next(error);
  }
});

// Update company pipeline (admin or sub-users of that company can update)
router.put('/company/:companyId', authenticate, async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { companyId } = req.params;
    const { stages } = req.body;
    const effectiveCompanyId = req.user.companyId || req.user.id;
    if (effectiveCompanyId !== parseInt(companyId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Delete existing stages
    await db.pipeline_stage.destroy({ where: { companyId }, transaction });

    // Create new stages
    const newStages = await Promise.all(
      stages.map((stage, index) => {
        console.log(`Creating stage ${index}:`, stage);
        return db.pipeline_stage.create({
          companyId,
          name: stage.name,
          systemStatus: stage.systemStatus,
          stage_order: index + 1,
          color: stage.color || 'bg-blue-500',
          icon: stage.icon || 'FileText',
          actionType: stage.actionType || 'email'
        }, { transaction });
      })
    );

    await transaction.commit();
    res.json({ success: true, stages: newStages });
  } catch (error) {
    await transaction.rollback();
    console.error('Pipeline update error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Move application to a new pipeline stage with transition validation
router.patch('/applications/:applicationId/stage', authenticate, async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const { targetStatus } = req.body;
    const effectiveCompanyId = req.user.companyId || req.user.id;

    if (!targetStatus) {
      return res.status(400).json({
        success: false,
        message: 'targetStatus is required in the request body'
      });
    }

    // Capture old status before the move for notification
    const applicationBefore = await db.application.findByPk(parseInt(applicationId));
    const oldStatus = applicationBefore ? applicationBefore.status : null;

    const result = await pipelineService.moveApplication(effectiveCompanyId, parseInt(applicationId), targetStatus);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    // Create notifications for both company user and candidate
    if (oldStatus && oldStatus !== targetStatus) {
      try {
        const NotificationService = require('../services/notification.service');
        const io = req.app.get('io');
        const application = await db.application.findByPk(parseInt(applicationId));
        const job = await db.job.findByPk(application.jobId, { attributes: ['id', 'title', 'company', 'companyId'] });
        const candidate = await db.candidate.findOne({
          where: { candidate_id: application.candidateId },
          attributes: ['id', 'firstName', 'lastName', 'email', 'candidate_id']
        });

        if (job && candidate) {
          // Resolve stage names from pipeline stages
          let oldStageName = oldStatus;
          let newStageName = targetStatus;
          const stages = await db.pipeline_stage.findAll({ where: { companyId: effectiveCompanyId } });
          for (const stage of stages) {
            if (stage.systemStatus === oldStatus) oldStageName = stage.name;
            if (stage.systemStatus === targetStatus) newStageName = stage.name;
          }

          await NotificationService.createStageChangeNotification(
            application,
            job,
            { name: `${candidate.firstName} ${candidate.lastName}`, id: candidate.id, email: candidate.email, candidateUserId: candidate.candidate_id },
            oldStageName,
            newStageName,
            io
          );
        }
      } catch (notifError) {
        console.error('Failed to create pipeline stage change notification:', notifError);
      }
    }

    res.json({
      success: true,
      message: result.message,
      application: result.application
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
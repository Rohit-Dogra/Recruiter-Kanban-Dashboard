const db = require('../models');

/**
 * Middleware that validates application.status values against valid
 * pipeline_stage.systemStatus entries for the associated company.
 *
 * Expects req.body.status and the application to be identifiable via req.params.id.
 * Requirement 20.4
 */
async function validateApplicationStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!status) return next(); // nothing to validate

    const applicationId = req.params.id;
    if (!applicationId) return next();

    const application = await db.application.findByPk(applicationId, {
      include: [{ model: db.job, as: 'job', attributes: ['id', 'companyId'] }],
    });

    if (!application || !application.job) return next();

    const companyId = application.job.companyId;

    // Fetch the company's pipeline stages
    const stages = await db.pipeline_stage.findAll({
      where: { companyId },
      attributes: ['systemStatus'],
    });

    if (stages.length === 0) {
      // No custom pipeline configured — allow default statuses + 'rejected'
      const defaults = ['new', 'reviewed', 'shortlisted', 'interview', 'offered', 'hired', 'rejected'];
      const statusStr = String(status);
      if (!defaults.includes(statusStr) && !statusStr.startsWith('custom-')) {
        return res.status(400).json({
          success: false,
          message: `Invalid application status '${status}'. Allowed: ${defaults.join(', ')}`,
        });
      }
      return next();
    }

    const validStatuses = stages.map((s) => s.systemStatus);
    // Always allow 'rejected' even if not explicitly in pipeline
    if (!validStatuses.includes('rejected')) {
      validStatuses.push('rejected');
    }

    const statusStr = String(status);

    // Allow numeric stage IDs (they get resolved to systemStatus in the route handler)
    if (!isNaN(parseInt(statusStr))) {
      return next();
    }

    if (!validStatuses.includes(statusStr)) {
      return res.status(400).json({
        success: false,
        message: `Invalid application status '${status}'. Valid statuses for this company: ${validStatuses.join(', ')}`,
      });
    }

    next();
  } catch (error) {
    // Don't block the request on validation errors — log and continue
    console.error('Status validation middleware error:', error.message);
    next();
  }
}

module.exports = { validateApplicationStatus };

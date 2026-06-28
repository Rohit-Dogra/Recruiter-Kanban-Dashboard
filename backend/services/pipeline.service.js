const db = require('../models');

const DEFAULT_STAGES = [
  { name: 'Applied', systemStatus: 'new', order: 1, color: 'bg-blue-500', icon: 'FileText', actionType: 'none' },
  { name: 'Phone Screening', systemStatus: 'reviewed', order: 2, color: 'bg-yellow-500', icon: 'Phone', actionType: 'call' },
  { name: 'Technical Interview', systemStatus: 'shortlisted', order: 3, color: 'bg-purple-500', icon: 'Video', actionType: 'interview' },
  { name: 'Final Review', systemStatus: 'interview', order: 4, color: 'bg-orange-500', icon: 'Users', actionType: 'email' },
  { name: 'Offer Extended', systemStatus: 'offered', order: 5, color: 'bg-green-500', icon: 'Award', actionType: 'email' },
  { name: 'Hired', systemStatus: 'hired', order: 6, color: 'bg-emerald-600', icon: 'CheckCircle', actionType: 'email' }
];

/**
 * Seed default pipeline stages into the database for a company that has none.
 * Returns the newly created stage records.
 */
async function seedDefaultStages(companyId) {
  const created = await Promise.all(
    DEFAULT_STAGES.map((s) =>
      db.pipeline_stage.create({
        companyId,
        name: s.name,
        systemStatus: s.systemStatus,
        stage_order: s.order,
        color: s.color,
        icon: s.icon,
        actionType: s.actionType,
      })
    )
  );
  return created;
}

// Default allowed transitions for standard pipeline statuses.
// Each stage can move forward to the next stage or be rejected.
const ALLOWED_TRANSITIONS = {
  'new': ['reviewed', 'rejected'],
  'reviewed': ['shortlisted', 'rejected'],
  'shortlisted': ['interview', 'rejected'],
  'interview': ['offered', 'rejected'],
  'offered': ['hired', 'rejected'],
  'hired': [],
  'rejected': []
};

/**
 * Build the allowed transitions map for a company's pipeline.
 * Standard statuses use the default map. Custom stages (systemStatus
 * starting with 'custom-') are allowed to transition to their adjacent
 * stages (previous and next by stage_order) and to 'rejected'.
 */
function buildAllowedTransitions(stages) {
  const sorted = [...stages].sort((a, b) => a.stage_order - b.stage_order);

  const transitions = {};

  for (let i = 0; i < sorted.length; i++) {
    const status = sorted[i].systemStatus;

    // If it's a standard status with a predefined transition set, use it
    if (ALLOWED_TRANSITIONS[status]) {
      transitions[status] = [...ALLOWED_TRANSITIONS[status]];
      continue;
    }

    // Custom stage: allow transitions to adjacent stages + rejected
    const targets = [];
    if (i > 0) {
      targets.push(sorted[i - 1].systemStatus);
    }
    if (i < sorted.length - 1) {
      targets.push(sorted[i + 1].systemStatus);
    }
    if (!targets.includes('rejected')) {
      targets.push('rejected');
    }
    transitions[status] = targets;
  }

  return transitions;
}

const pipelineService = {
  getCompanyPipeline: async (companyId) => {
    try {
      let stages = await db.pipeline_stage.findAll({
        where: { companyId },
        order: [['stage_order', 'ASC']]
      });

      // If no stages exist for this company, seed the defaults into the DB
      if (stages.length === 0) {
        stages = await seedDefaultStages(companyId);
      }

      return stages.map(s => ({
        id: s.id,
        title: s.name,
        systemStatus: s.systemStatus,
        color: s.color,
        icon: s.icon,
        actionType: s.actionType
      }));
    } catch (error) {
      console.error('Pipeline service error:', error);
      return [];
    }
  },

  /**
   * Validate whether an application can transition to the target status.
   * @param {number} companyId
   * @param {number} applicationId
   * @param {string} targetSystemStatus
   * @returns {{ valid: boolean, message: string }}
   */
  validateTransition: async (companyId, applicationId, targetSystemStatus) => {
    // Fetch the application
    const application = await db.application.findByPk(applicationId);
    if (!application) {
      return { valid: false, message: 'Application not found' };
    }

    // Verify the application belongs to a job owned by this company
    const job = await db.job.findByPk(application.jobId);
    if (!job || String(job.companyId) !== String(companyId)) {
      return { valid: false, message: 'Application does not belong to this company' };
    }

    // Fetch the company's pipeline stages
    const stages = await db.pipeline_stage.findAll({
      where: { companyId },
      order: [['stage_order', 'ASC']]
    });

    if (stages.length === 0) {
      return { valid: false, message: 'No pipeline stages configured for this company' };
    }

    // Verify the target status is a valid pipeline stage for this company
    const validStatuses = stages.map(s => s.systemStatus);
    if (!validStatuses.includes(targetSystemStatus)) {
      return {
        valid: false,
        message: `Invalid target status '${targetSystemStatus}'. Valid statuses: ${validStatuses.join(', ')}`
      };
    }

    const currentStatus = application.status;

    // If the application is already at the target status, no-op
    if (currentStatus === targetSystemStatus) {
      return { valid: false, message: `Application is already at status '${targetSystemStatus}'` };
    }

    // Build allowed transitions for this company's pipeline
    const transitions = buildAllowedTransitions(stages);
    const allowed = transitions[currentStatus];

    if (!allowed) {
      return {
        valid: false,
        message: `Current status '${currentStatus}' is not a recognized pipeline stage. Cannot determine valid transitions.`
      };
    }

    if (!allowed.includes(targetSystemStatus)) {
      return {
        valid: false,
        message: `Transition from '${currentStatus}' to '${targetSystemStatus}' is not allowed. Allowed transitions: ${allowed.join(', ') || 'none'}`
      };
    }

    return { valid: true, message: 'Transition is valid' };
  },

  /**
   * Move an application to a new pipeline stage after validation.
   * @param {number} companyId
   * @param {number} applicationId
   * @param {string} targetSystemStatus
   * @returns {{ success: boolean, application?: object, message: string }}
   */
  moveApplication: async (companyId, applicationId, targetSystemStatus) => {
    const validation = await pipelineService.validateTransition(companyId, applicationId, targetSystemStatus);
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }

    const application = await db.application.findByPk(applicationId);
    await application.update({ status: targetSystemStatus });

    return {
      success: true,
      message: `Application moved to '${targetSystemStatus}'`,
      application: application.toJSON()
    };
  }
};

// Export helpers for testing
pipelineService._buildAllowedTransitions = buildAllowedTransitions;
pipelineService.ALLOWED_TRANSITIONS = ALLOWED_TRANSITIONS;

module.exports = pipelineService;

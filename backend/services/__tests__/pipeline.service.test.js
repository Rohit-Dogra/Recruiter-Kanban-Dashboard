const { describe, it, expect, beforeEach } = require('@jest/globals');

// Mock db models
const mockFindByPk = jest.fn();
const mockFindAll = jest.fn();
const mockApplicationUpdate = jest.fn();
const mockJobFindByPk = jest.fn();

jest.mock('../../models', () => ({
  application: {
    findByPk: (...args) => mockFindByPk(...args)
  },
  job: {
    findByPk: (...args) => mockJobFindByPk(...args)
  },
  pipeline_stage: {
    findAll: (...args) => mockFindAll(...args)
  }
}));

let pipelineService;

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();

  jest.mock('../../models', () => ({
    application: { findByPk: (...args) => mockFindByPk(...args) },
    job: { findByPk: (...args) => mockJobFindByPk(...args) },
    pipeline_stage: { findAll: (...args) => mockFindAll(...args) }
  }));

  pipelineService = require('../pipeline.service');
});

const makeStages = (companyId) => [
  { id: 1, companyId, name: 'Applied', systemStatus: 'new', stage_order: 1 },
  { id: 2, companyId, name: 'Reviewed', systemStatus: 'reviewed', stage_order: 2 },
  { id: 3, companyId, name: 'Shortlisted', systemStatus: 'shortlisted', stage_order: 3 },
  { id: 4, companyId, name: 'Interview', systemStatus: 'interview', stage_order: 4 },
  { id: 5, companyId, name: 'Offered', systemStatus: 'offered', stage_order: 5 },
  { id: 6, companyId, name: 'Hired', systemStatus: 'hired', stage_order: 6 },
];

describe('buildAllowedTransitions', () => {
  it('should return standard transitions for default pipeline stages', () => {
    const stages = makeStages(1);
    const transitions = pipelineService._buildAllowedTransitions(stages);

    expect(transitions['new']).toEqual(['reviewed', 'rejected']);
    expect(transitions['reviewed']).toEqual(['shortlisted', 'rejected']);
    expect(transitions['shortlisted']).toEqual(['interview', 'rejected']);
    expect(transitions['interview']).toEqual(['offered', 'rejected']);
    expect(transitions['offered']).toEqual(['hired', 'rejected']);
    expect(transitions['hired']).toEqual([]);
  });

  it('should allow custom stages to transition to adjacent stages and rejected', () => {
    const stages = [
      { id: 1, companyId: 1, name: 'Applied', systemStatus: 'new', stage_order: 1 },
      { id: 2, companyId: 1, name: 'Custom Step', systemStatus: 'custom-10', stage_order: 2 },
      { id: 3, companyId: 1, name: 'Interview', systemStatus: 'interview', stage_order: 3 },
    ];
    const transitions = pipelineService._buildAllowedTransitions(stages);

    expect(transitions['custom-10']).toContain('new');
    expect(transitions['custom-10']).toContain('interview');
    expect(transitions['custom-10']).toContain('rejected');
  });

  it('should handle a custom stage at the beginning (no previous)', () => {
    const stages = [
      { id: 1, companyId: 1, name: 'Custom Start', systemStatus: 'custom-1', stage_order: 1 },
      { id: 2, companyId: 1, name: 'Reviewed', systemStatus: 'reviewed', stage_order: 2 },
    ];
    const transitions = pipelineService._buildAllowedTransitions(stages);

    expect(transitions['custom-1']).toContain('reviewed');
    expect(transitions['custom-1']).toContain('rejected');
    expect(transitions['custom-1']).not.toContain(undefined);
  });

  it('should handle a custom stage at the end (no next)', () => {
    const stages = [
      { id: 1, companyId: 1, name: 'Applied', systemStatus: 'new', stage_order: 1 },
      { id: 2, companyId: 1, name: 'Custom End', systemStatus: 'custom-99', stage_order: 2 },
    ];
    const transitions = pipelineService._buildAllowedTransitions(stages);

    expect(transitions['custom-99']).toContain('new');
    expect(transitions['custom-99']).toContain('rejected');
  });
});

describe('validateTransition', () => {
  const companyId = 1;
  const applicationId = 100;

  it('should return invalid when application is not found', async () => {
    mockFindByPk.mockResolvedValue(null);

    const result = await pipelineService.validateTransition(companyId, applicationId, 'reviewed');

    expect(result.valid).toBe(false);
    expect(result.message).toBe('Application not found');
  });

  it('should return invalid when application does not belong to the company', async () => {
    mockFindByPk.mockResolvedValue({ id: applicationId, jobId: 10, status: 'new' });
    mockJobFindByPk.mockResolvedValue({ id: 10, companyId: 999 }); // different company

    const result = await pipelineService.validateTransition(companyId, applicationId, 'reviewed');

    expect(result.valid).toBe(false);
    expect(result.message).toBe('Application does not belong to this company');
  });

  it('should return invalid when no pipeline stages are configured', async () => {
    mockFindByPk.mockResolvedValue({ id: applicationId, jobId: 10, status: 'new' });
    mockJobFindByPk.mockResolvedValue({ id: 10, companyId });
    mockFindAll.mockResolvedValue([]);

    const result = await pipelineService.validateTransition(companyId, applicationId, 'reviewed');

    expect(result.valid).toBe(false);
    expect(result.message).toBe('No pipeline stages configured for this company');
  });

  it('should return invalid when target status is not a valid pipeline stage', async () => {
    mockFindByPk.mockResolvedValue({ id: applicationId, jobId: 10, status: 'new' });
    mockJobFindByPk.mockResolvedValue({ id: 10, companyId });
    mockFindAll.mockResolvedValue(makeStages(companyId));

    const result = await pipelineService.validateTransition(companyId, applicationId, 'nonexistent');

    expect(result.valid).toBe(false);
    expect(result.message).toContain('Invalid target status');
  });

  it('should return invalid when application is already at the target status', async () => {
    mockFindByPk.mockResolvedValue({ id: applicationId, jobId: 10, status: 'new' });
    mockJobFindByPk.mockResolvedValue({ id: 10, companyId });
    mockFindAll.mockResolvedValue(makeStages(companyId));

    const result = await pipelineService.validateTransition(companyId, applicationId, 'new');

    expect(result.valid).toBe(false);
    expect(result.message).toContain('already at status');
  });

  it('should return invalid for a disallowed transition (e.g., new → hired)', async () => {
    mockFindByPk.mockResolvedValue({ id: applicationId, jobId: 10, status: 'new' });
    mockJobFindByPk.mockResolvedValue({ id: 10, companyId });
    mockFindAll.mockResolvedValue(makeStages(companyId));

    const result = await pipelineService.validateTransition(companyId, applicationId, 'hired');

    expect(result.valid).toBe(false);
    expect(result.message).toContain('not allowed');
  });

  it('should return valid for an allowed forward transition (new → reviewed)', async () => {
    mockFindByPk.mockResolvedValue({ id: applicationId, jobId: 10, status: 'new' });
    mockJobFindByPk.mockResolvedValue({ id: 10, companyId });
    mockFindAll.mockResolvedValue(makeStages(companyId));

    const result = await pipelineService.validateTransition(companyId, applicationId, 'reviewed');

    expect(result.valid).toBe(true);
    expect(result.message).toBe('Transition is valid');
  });

  it('should return invalid when current status is not in the pipeline (unrecognized)', async () => {
    mockFindByPk.mockResolvedValue({ id: applicationId, jobId: 10, status: 'unknown-status' });
    mockJobFindByPk.mockResolvedValue({ id: 10, companyId });
    mockFindAll.mockResolvedValue(makeStages(companyId));

    const result = await pipelineService.validateTransition(companyId, applicationId, 'reviewed');

    expect(result.valid).toBe(false);
    expect(result.message).toContain('not a recognized pipeline stage');
  });
});

describe('moveApplication', () => {
  const companyId = 1;
  const applicationId = 100;

  it('should return failure when validation fails', async () => {
    mockFindByPk.mockResolvedValue(null);

    const result = await pipelineService.moveApplication(companyId, applicationId, 'reviewed');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Application not found');
  });

  it('should update application status on valid transition', async () => {
    const mockApp = {
      id: applicationId,
      jobId: 10,
      status: 'new',
      update: mockApplicationUpdate,
      toJSON: () => ({ id: applicationId, jobId: 10, status: 'reviewed' })
    };
    // First call for validateTransition, second call for moveApplication
    mockFindByPk.mockResolvedValue(mockApp);
    mockJobFindByPk.mockResolvedValue({ id: 10, companyId });
    mockFindAll.mockResolvedValue(makeStages(companyId));
    mockApplicationUpdate.mockResolvedValue(mockApp);

    const result = await pipelineService.moveApplication(companyId, applicationId, 'reviewed');

    expect(result.success).toBe(true);
    expect(result.message).toContain("moved to 'reviewed'");
    expect(mockApplicationUpdate).toHaveBeenCalledWith({ status: 'reviewed' });
    expect(result.application).toBeDefined();
  });

  it('should reject transition from hired (terminal state)', async () => {
    const mockApp = {
      id: applicationId,
      jobId: 10,
      status: 'hired',
    };
    mockFindByPk.mockResolvedValue(mockApp);
    mockJobFindByPk.mockResolvedValue({ id: 10, companyId });
    mockFindAll.mockResolvedValue(makeStages(companyId));

    const result = await pipelineService.moveApplication(companyId, applicationId, 'offered');

    expect(result.success).toBe(false);
    expect(result.message).toContain('not allowed');
  });
});

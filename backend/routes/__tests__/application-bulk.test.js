const { describe, it, expect, beforeEach } = require('@jest/globals');

/**
 * Unit tests for POST /api/applications/bulk endpoint logic.
 *
 * These tests validate the bulk action handler's core logic without
 * requiring a running server or database — we test the validation
 * and branching logic in isolation.
 */

// --- Mock helpers ---

function createMockApp(id, companyId, candidateId = 100) {
  return {
    id,
    candidateId,
    status: 'new',
    job: { id: 1, companyId, title: 'Test Job' },
    update: jest.fn().mockResolvedValue(true),
    toJSON() { return { ...this }; },
  };
}

/**
 * Simulates the bulk endpoint logic extracted from the route handler.
 * This mirrors the actual implementation in backend/routes/application.js.
 */
async function executeBulkAction({
  applicationIds,
  action,
  targetStage,
  emailSubject,
  emailBody,
  companyId,
  findApplications,
  findCandidate,
  sendEmail,
}) {
  // Validation
  if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
    return { success: false, message: 'applicationIds must be a non-empty array' };
  }
  if (!['reject', 'move-stage', 'email'].includes(action)) {
    return { success: false, message: 'Invalid action' };
  }
  if (action === 'move-stage' && !targetStage) {
    return { success: false, message: 'targetStage is required for move-stage action' };
  }
  if (action === 'email' && (!emailSubject || !emailBody)) {
    return { success: false, message: 'emailSubject and emailBody are required for email action' };
  }

  const applications = await findApplications(applicationIds);
  const foundIds = applications.map(a => a.id);
  const missingIds = applicationIds.filter(id => !foundIds.includes(id));

  const unauthorized = applications.filter(a => !a.job || a.job.companyId !== companyId);
  if (unauthorized.length > 0) {
    return { success: false, message: 'Some applications do not belong to your jobs', unauthorizedIds: unauthorized.map(a => a.id) };
  }

  const validApps = applications.filter(a => a.job && a.job.companyId === companyId);
  let successCount = 0;
  const failures = [];

  for (const app of validApps) {
    try {
      if (action === 'reject') {
        await app.update({ status: 'rejected' });
        successCount++;
      } else if (action === 'move-stage') {
        await app.update({ status: targetStage });
        successCount++;
      } else if (action === 'email') {
        const candidate = await findCandidate(app.candidateId);
        if (candidate && candidate.email) {
          await sendEmail({
            to: candidate.email,
            subject: emailSubject,
            content: emailBody,
            candidateName: `${candidate.firstName} ${candidate.lastName}`,
          });
          successCount++;
        } else {
          failures.push({ id: app.id, reason: 'Candidate email not found' });
        }
      }
    } catch (err) {
      failures.push({ id: app.id, reason: err.message });
    }
  }

  for (const id of missingIds) {
    failures.push({ id, reason: 'Application not found' });
  }

  return { success: true, message: `Bulk ${action} completed`, successCount, failureCount: failures.length, failures };
}

// --- Tests ---

describe('Bulk Application Operations', () => {
  const companyId = 1;

  describe('reject action', () => {
    it('rejects all valid applications', async () => {
      const apps = [createMockApp(1, companyId), createMockApp(2, companyId)];
      const result = await executeBulkAction({
        applicationIds: [1, 2],
        action: 'reject',
        companyId,
        findApplications: () => Promise.resolve(apps),
        findCandidate: () => Promise.resolve(null),
        sendEmail: jest.fn(),
      });

      expect(result.success).toBe(true);
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
      expect(apps[0].update).toHaveBeenCalledWith({ status: 'rejected' });
      expect(apps[1].update).toHaveBeenCalledWith({ status: 'rejected' });
    });

    it('reports missing application IDs as failures', async () => {
      const apps = [createMockApp(1, companyId)];
      const result = await executeBulkAction({
        applicationIds: [1, 99],
        action: 'reject',
        companyId,
        findApplications: () => Promise.resolve(apps),
        findCandidate: () => Promise.resolve(null),
        sendEmail: jest.fn(),
      });

      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(1);
      expect(result.failures[0]).toEqual({ id: 99, reason: 'Application not found' });
    });
  });

  describe('move-stage action', () => {
    it('moves all applications to the target stage', async () => {
      const apps = [createMockApp(1, companyId), createMockApp(2, companyId)];
      const result = await executeBulkAction({
        applicationIds: [1, 2],
        action: 'move-stage',
        targetStage: 'interview',
        companyId,
        findApplications: () => Promise.resolve(apps),
        findCandidate: () => Promise.resolve(null),
        sendEmail: jest.fn(),
      });

      expect(result.success).toBe(true);
      expect(result.successCount).toBe(2);
      expect(apps[0].update).toHaveBeenCalledWith({ status: 'interview' });
      expect(apps[1].update).toHaveBeenCalledWith({ status: 'interview' });
    });

    it('fails validation when targetStage is missing', async () => {
      const result = await executeBulkAction({
        applicationIds: [1],
        action: 'move-stage',
        companyId,
        findApplications: jest.fn(),
        findCandidate: jest.fn(),
        sendEmail: jest.fn(),
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('targetStage');
    });
  });

  describe('email action', () => {
    it('sends emails to all candidates', async () => {
      const apps = [createMockApp(1, companyId, 100), createMockApp(2, companyId, 101)];
      const mockSendEmail = jest.fn().mockResolvedValue({ success: true });
      const mockFindCandidate = jest.fn()
        .mockResolvedValueOnce({ firstName: 'John', lastName: 'Doe', email: 'john@test.com' })
        .mockResolvedValueOnce({ firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com' });

      const result = await executeBulkAction({
        applicationIds: [1, 2],
        action: 'email',
        emailSubject: 'Update',
        emailBody: 'Hello!',
        companyId,
        findApplications: () => Promise.resolve(apps),
        findCandidate: mockFindCandidate,
        sendEmail: mockSendEmail,
      });

      expect(result.success).toBe(true);
      expect(result.successCount).toBe(2);
      expect(mockSendEmail).toHaveBeenCalledTimes(2);
    });

    it('reports failure when candidate email is not found', async () => {
      const apps = [createMockApp(1, companyId, 100)];
      const result = await executeBulkAction({
        applicationIds: [1],
        action: 'email',
        emailSubject: 'Update',
        emailBody: 'Hello!',
        companyId,
        findApplications: () => Promise.resolve(apps),
        findCandidate: () => Promise.resolve(null),
        sendEmail: jest.fn(),
      });

      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(1);
      expect(result.failures[0].reason).toContain('email not found');
    });

    it('fails validation when emailSubject or emailBody is missing', async () => {
      const result = await executeBulkAction({
        applicationIds: [1],
        action: 'email',
        emailSubject: '',
        emailBody: '',
        companyId,
        findApplications: jest.fn(),
        findCandidate: jest.fn(),
        sendEmail: jest.fn(),
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('emailSubject');
    });
  });

  describe('authorization', () => {
    it('rejects applications not belonging to the user', async () => {
      const apps = [createMockApp(1, 999)]; // different companyId
      const result = await executeBulkAction({
        applicationIds: [1],
        action: 'reject',
        companyId,
        findApplications: () => Promise.resolve(apps),
        findCandidate: () => Promise.resolve(null),
        sendEmail: jest.fn(),
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('do not belong');
      expect(result.unauthorizedIds).toEqual([1]);
    });
  });

  describe('validation', () => {
    it('rejects empty applicationIds array', async () => {
      const result = await executeBulkAction({
        applicationIds: [],
        action: 'reject',
        companyId,
        findApplications: jest.fn(),
        findCandidate: jest.fn(),
        sendEmail: jest.fn(),
      });

      expect(result.success).toBe(false);
    });

    it('rejects invalid action', async () => {
      const result = await executeBulkAction({
        applicationIds: [1],
        action: 'invalid-action',
        companyId,
        findApplications: jest.fn(),
        findCandidate: jest.fn(),
        sendEmail: jest.fn(),
      });

      expect(result.success).toBe(false);
    });
  });
});

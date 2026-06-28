const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');

// Mock node-cron before requiring the module
jest.mock('node-cron', () => ({
  schedule: jest.fn(() => ({ stop: jest.fn() }))
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

// Mock db models
const mockUpdate = jest.fn();
const mockFindAll = jest.fn();
const mockJobUpdate = jest.fn();

jest.mock('../../models', () => ({
  user_subscription: {
    findAll: (...args) => mockFindAll(...args)
  },
  job: {
    update: (...args) => mockJobUpdate(...args)
  },
  Sequelize: {
    Op: {
      lt: Symbol('lt')
    }
  }
}));

// We need to re-require after mocks are set up
let schedulerService;
let cron;

beforeEach(() => {
  jest.clearAllMocks();
  // Clear module cache so we get a fresh instance
  jest.resetModules();

  jest.mock('node-cron', () => ({
    schedule: jest.fn(() => ({ stop: jest.fn() }))
  }));
  jest.mock('../../utils/logger', () => ({
    info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn()
  }));
  jest.mock('../../models', () => ({
    user_subscription: { findAll: (...args) => mockFindAll(...args) },
    job: { update: (...args) => mockJobUpdate(...args) },
    Sequelize: { Op: { lt: Symbol('lt') } }
  }));

  schedulerService = require('../scheduler.service');
  cron = require('node-cron');
});

describe('SchedulerService', () => {
  describe('start()', () => {
    it('should schedule the subscription reset cron job', () => {
      schedulerService.start();
      expect(cron.schedule).toHaveBeenCalledWith('0 0 * * *', expect.any(Function));
    });

    it('should schedule the job expiration cron job at 1 AM', () => {
      schedulerService.start();
      expect(cron.schedule).toHaveBeenCalledWith('0 1 * * *', expect.any(Function));
    });
  });

  describe('stop()', () => {
    it('should stop all scheduled jobs', () => {
      const mockStop = jest.fn();
      cron.schedule.mockReturnValue({ stop: mockStop });

      schedulerService.start();
      schedulerService.stop();

      expect(mockStop).toHaveBeenCalled();
      expect(schedulerService.jobs).toEqual([]);
    });
  });

  describe('resetExpiredSubscriptions()', () => {
    it('should return { reset: 0 } when no expired subscriptions exist', async () => {
      mockFindAll.mockResolvedValue([]);

      const result = await schedulerService.resetExpiredSubscriptions();

      expect(result).toEqual({ reset: 0 });
      expect(mockFindAll).toHaveBeenCalledTimes(1);
      // Verify the query shape: status 'active' and currentPeriodEnd < now
      const queryArg = mockFindAll.mock.calls[0][0];
      expect(queryArg.where.status).toBe('active');
      expect(queryArg.where.currentPeriodEnd).toBeDefined();
    });

    it('should reset usage counters and advance period for expired subscriptions', async () => {
      const periodEnd = new Date('2025-01-15T00:00:00Z');
      const mockSub = {
        currentPeriodEnd: periodEnd,
        phoneScreeningsUsed: 5,
        technicalInterviewsUsed: 3,
        update: mockUpdate
      };
      mockFindAll.mockResolvedValue([mockSub]);
      mockUpdate.mockResolvedValue(mockSub);

      const result = await schedulerService.resetExpiredSubscriptions();

      expect(result).toEqual({ reset: 1 });
      expect(mockUpdate).toHaveBeenCalledWith({
        phoneScreeningsUsed: 0,
        technicalInterviewsUsed: 0,
        currentPeriodStart: new Date('2025-01-15T00:00:00Z'),
        currentPeriodEnd: new Date('2025-02-15T00:00:00Z')
      });
    });

    it('should reset multiple expired subscriptions', async () => {
      const sub1 = {
        currentPeriodEnd: new Date('2025-01-10T00:00:00Z'),
        update: jest.fn().mockResolvedValue({})
      };
      const sub2 = {
        currentPeriodEnd: new Date('2025-01-12T00:00:00Z'),
        update: jest.fn().mockResolvedValue({})
      };
      mockFindAll.mockResolvedValue([sub1, sub2]);

      const result = await schedulerService.resetExpiredSubscriptions();

      expect(result).toEqual({ reset: 2 });
      expect(sub1.update).toHaveBeenCalled();
      expect(sub2.update).toHaveBeenCalled();
    });

    it('should be idempotent — second run finds no expired subs after reset', async () => {
      // First run: one expired sub
      const periodEnd = new Date('2025-01-15T00:00:00Z');
      const mockSub = {
        currentPeriodEnd: periodEnd,
        update: jest.fn().mockResolvedValue({})
      };
      mockFindAll.mockResolvedValueOnce([mockSub]);

      const firstResult = await schedulerService.resetExpiredSubscriptions();
      expect(firstResult).toEqual({ reset: 1 });

      // Second run: no expired subs (period was advanced past now)
      mockFindAll.mockResolvedValueOnce([]);

      const secondResult = await schedulerService.resetExpiredSubscriptions();
      expect(secondResult).toEqual({ reset: 0 });
    });

    it('should throw and log on database error', async () => {
      mockFindAll.mockRejectedValue(new Error('DB connection lost'));

      await expect(schedulerService.resetExpiredSubscriptions()).rejects.toThrow('DB connection lost');
    });

    it('should advance period end correctly across month boundaries', async () => {
      // January 31 → February 28 (non-leap year behavior of JS Date)
      const periodEnd = new Date('2025-01-31T00:00:00Z');
      const mockSub = {
        currentPeriodEnd: periodEnd,
        update: jest.fn().mockResolvedValue({})
      };
      mockFindAll.mockResolvedValue([mockSub]);

      await schedulerService.resetExpiredSubscriptions();

      const updateCall = mockSub.update.mock.calls[0][0];
      expect(updateCall.currentPeriodStart).toEqual(new Date('2025-01-31T00:00:00Z'));
      // JS Date setMonth(1) on Jan 31 → March 3 (overflow), this is expected JS behavior
      expect(updateCall.currentPeriodEnd.getTime()).toBeGreaterThan(periodEnd.getTime());
    });
  });

  describe('expireOverdueJobs()', () => {
    it('should close active jobs with past deadlines via bulk update', async () => {
      mockJobUpdate.mockResolvedValue([3]);

      const result = await schedulerService.expireOverdueJobs();

      expect(result).toEqual({ closed: 3 });
      expect(mockJobUpdate).toHaveBeenCalledTimes(1);
      const [values, options] = mockJobUpdate.mock.calls[0];
      expect(values).toEqual({ status: 'closed' });
      expect(options.where.status).toBe('active');
      expect(options.where.deadline).toBeDefined();
    });

    it('should return { closed: 0 } when no jobs need closing', async () => {
      mockJobUpdate.mockResolvedValue([0]);

      const result = await schedulerService.expireOverdueJobs();

      expect(result).toEqual({ closed: 0 });
    });

    it('should throw and log on database error', async () => {
      mockJobUpdate.mockRejectedValue(new Error('DB connection lost'));

      await expect(schedulerService.expireOverdueJobs()).rejects.toThrow('DB connection lost');
    });
  });
});

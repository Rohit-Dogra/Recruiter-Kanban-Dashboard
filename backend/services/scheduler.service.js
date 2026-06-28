const cron = require('node-cron');
const db = require('../models');
const logger = require('../utils/logger');
const { Op } = db.Sequelize;

class SchedulerService {
  constructor() {
    this.jobs = [];
  }

  /**
   * Start all scheduled cron jobs.
   * Called once on server startup.
   */
  start() {
    this._scheduleSubscriptionReset();
    this._scheduleJobExpiration();
    logger.info('SchedulerService started');
  }

  /**
   * Stop all scheduled cron jobs.
   */
  stop() {
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    logger.info('SchedulerService stopped');
  }

  /**
   * Daily at midnight: reset usage counters for active subscriptions
   * whose billing period has ended (currentPeriodEnd < now).
   *
   * Idempotency: after reset, currentPeriodEnd is advanced past now(),
   * so the same subscription won't be picked up on a second run.
   */
  _scheduleSubscriptionReset() {
    const task = cron.schedule('0 0 * * *', () => this.resetExpiredSubscriptions());
    this.jobs.push(task);
  }

  /**
   * Daily at 1 AM: auto-close jobs whose deadline has passed.
   */
  _scheduleJobExpiration() {
    const task = cron.schedule('0 1 * * *', () => this.expireOverdueJobs());
    this.jobs.push(task);
  }

  /**
   * Close all active jobs whose deadline is in the past.
   * Uses a single bulk UPDATE for efficiency.
   */
  async expireOverdueJobs() {
    try {
      const now = new Date();

      const [updatedCount] = await db.job.update(
        { status: 'closed' },
        {
          where: {
            status: 'active',
            deadline: { [Op.lt]: now }
          }
        }
      );

      logger.info(`Job expiration: ${updatedCount} job(s) closed`);
      return { closed: updatedCount };
    } catch (error) {
      logger.error('Job expiration failed:', error.message);
      throw error;
    }
  }

  async resetExpiredSubscriptions() {
    try {
      const now = new Date();

      const expiredSubs = await db.user_subscription.findAll({
        where: {
          status: 'active',
          currentPeriodEnd: { [Op.lt]: now }
        }
      });

      if (expiredSubs.length === 0) {
        logger.info('Subscription reset: no expired subscriptions found');
        return { reset: 0 };
      }

      let resetCount = 0;
      for (const sub of expiredSubs) {
        const newPeriodStart = new Date(sub.currentPeriodEnd);
        const newPeriodEnd = new Date(sub.currentPeriodEnd);
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

        await sub.update({
          phoneScreeningsUsed: 0,
          technicalInterviewsUsed: 0,
          currentPeriodStart: newPeriodStart,
          currentPeriodEnd: newPeriodEnd
        });
        resetCount++;
      }

      logger.info(`Subscription reset: ${resetCount} subscription(s) renewed`);
      return { reset: resetCount };
    } catch (error) {
      logger.error('Subscription reset failed:', error.message);
      throw error;
    }
  }
}

module.exports = new SchedulerService();

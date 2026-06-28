const { Queue, Worker } = require('bullmq');
const logger = require('../utils/logger');
const { getRedisOptions } = require('../config/redis.config');

const QUEUE_NAME = 'bolna-webhook';
const ATS_QUEUE_NAME = 'ats-processing';

let webhookQueue = null;
let webhookWorker = null;
let atsQueue = null;
let atsWorker = null;
let redisAvailable = true;

/**
 * Initialise the BullMQ queue (producer side).
 * Safe to call multiple times — returns the existing queue if already created.
 */
function getWebhookQueue() {
  if (!redisAvailable) return null;
  if (!webhookQueue) {
    webhookQueue = new Queue(QUEUE_NAME, {
      connection: getRedisOptions(),
    });
  }
  return webhookQueue;
}

/**
 * Add a job to the bolna-webhook queue.
 *
 * @param {object} data - { executionId, companyId, duration, extractedData }
 * @returns {Promise<import('bullmq').Job>}
 */
async function addWebhookJob(data) {
  const queue = getWebhookQueue();
  if (!queue) {
    logger.warn(`Skipping webhook job for execution ${data.executionId} — Redis unavailable`);
    return null;
  }
  const job = await queue.add('store-call-details', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  });
  logger.info(`Queued bolna-webhook job ${job.id} for execution ${data.executionId}`);
  return job;
}

/**
 * Start the BullMQ worker that processes bolna-webhook jobs.
 * The worker calls `storeCallDetails` from phone-screening logic.
 */
function startWebhookWorker() {
  if (!redisAvailable) {
    logger.warn('Bolna webhook worker skipped — Redis >= 5.0 required');
    return null;
  }
  if (webhookWorker) {
    logger.info('Bolna webhook worker already running');
    return webhookWorker;
  }

  // Lazy-require to avoid circular dependency at module load time.
  const { storeCallDetails } = require('../routes/phone-screening');

  webhookWorker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { executionId, companyId, duration, extractedData } = job.data;
      logger.info(`Processing bolna-webhook job ${job.id} (attempt ${job.attemptsMade + 1}) for execution ${executionId}`);
      await storeCallDetails(executionId, companyId, duration, extractedData);
    },
    {
      connection: getRedisOptions(),
      concurrency: 3,
    }
  );

  webhookWorker.on('completed', (job) => {
    logger.info(`Bolna webhook job ${job.id} completed for execution ${job.data.executionId}`);
  });

  webhookWorker.on('failed', (job, err) => {
    logger.error(`Bolna webhook job ${job?.id} failed for execution ${job?.data?.executionId}: ${err.message}`);
  });

  logger.info('Bolna webhook worker started');
  return webhookWorker;
}

/**
 * Initialise the ATS processing queue (producer side).
 */
function getATSQueue() {
  if (!redisAvailable) return null;
  if (!atsQueue) {
    atsQueue = new Queue(ATS_QUEUE_NAME, {
      connection: getRedisOptions(),
    });
  }
  return atsQueue;
}

/**
 * Add an ATS analysis job to the queue.
 *
 * @param {object} data - { applicationId, resumeUrl, jobDescription }
 * @returns {Promise<import('bullmq').Job>}
 */
async function addATSJob(data) {
  const queue = getATSQueue();
  if (!queue) {
    logger.warn(`Skipping ATS job for application ${data.applicationId} — Redis unavailable`);
    return null;
  }
  const job = await queue.add('process-ats', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 10000 },
    removeOnComplete: 200,
    removeOnFail: 500,
  });
  logger.info(`Queued ATS job ${job.id} for application ${data.applicationId}`);
  return job;
}

/**
 * Start the BullMQ worker that processes ATS analysis jobs.
 */
function startATSWorker() {
  if (!redisAvailable) {
    logger.warn('ATS worker skipped — Redis >= 5.0 required');
    return null;
  }
  if (atsWorker) {
    logger.info('ATS worker already running');
    return atsWorker;
  }

  const atsService = require('./ats.service');
  const db = require('../models');

  atsWorker = new Worker(
    ATS_QUEUE_NAME,
    async (job) => {
      const { applicationId, resumeUrl, jobDescription } = job.data;
      logger.info(`Processing ATS job ${job.id} (attempt ${job.attemptsMade + 1}) for application ${applicationId}`);

      const application = await db.application.findByPk(applicationId);
      if (!application) {
        logger.warn(`ATS job ${job.id}: application ${applicationId} not found, skipping`);
        return;
      }

      try {
        const atsResult = await atsService.processResume(resumeUrl, jobDescription);

        await application.update({
          aiScore: atsResult.atsScore,
          atsStatus: 'completed',
          resumeMatch: atsResult.skillsMatchPercentage,
          skillsMatch: {
            matched: atsResult.matchedSkills,
            missing: atsResult.missingSkills,
          },
          aiNotes: atsResult.recommendation,
        });

        logger.info(`ATS job ${job.id}: application ${applicationId} scored ${atsResult.atsScore}`);
      } catch (atsError) {
        await application.update({
          aiScore: null,
          atsStatus: 'failed',
          aiNotes: `ATS analysis failed: ${atsError.message}. Retry available.`,
        });
        throw atsError; // Let BullMQ handle retries
      }
    },
    {
      connection: getRedisOptions(),
      concurrency: 2,
    }
  );

  atsWorker.on('completed', (job) => {
    logger.info(`ATS job ${job.id} completed for application ${job.data.applicationId}`);
  });

  atsWorker.on('failed', (job, err) => {
    logger.error(`ATS job ${job?.id} failed for application ${job?.data?.applicationId}: ${err.message}`);
  });

  logger.info('ATS processing worker started');
  return atsWorker;
}

/**
 * Gracefully shut down queue and worker (for clean server shutdown).
 */
async function shutdown() {
  if (webhookWorker) {
    await webhookWorker.close();
    webhookWorker = null;
  }
  if (webhookQueue) {
    await webhookQueue.close();
    webhookQueue = null;
  }
  if (atsWorker) {
    await atsWorker.close();
    atsWorker = null;
  }
  if (atsQueue) {
    await atsQueue.close();
    atsQueue = null;
  }
  logger.info('Queue service shut down');
}

/**
 * Check Redis version at startup. BullMQ requires >= 5.0.
 * If version is too old or Redis is unreachable, disable queue features gracefully.
 */
async function checkRedisVersion() {
  try {
    const Redis = require('ioredis');
    const opts = getRedisOptions();
    const client = opts.url ? new Redis(opts.url) : new Redis(opts);
    const info = await client.info('server');
    const match = info.match(/redis_version:(\d+\.\d+)/);
    await client.quit();
    if (match) {
      const version = parseFloat(match[1]);
      if (version < 5.0) {
        logger.warn(`Redis version ${match[1]} detected — BullMQ requires >= 5.0. Queue features disabled.`);
        redisAvailable = false;
        return false;
      }
      logger.info(`Redis version ${match[1]} — queue features enabled`);
      return true;
    }
    return true;
  } catch (err) {
    logger.warn(`Redis not reachable — queue features disabled: ${err.message}`);
    redisAvailable = false;
    return false;
  }
}

module.exports = { addWebhookJob, startWebhookWorker, addATSJob, startATSWorker, shutdown, checkRedisVersion };

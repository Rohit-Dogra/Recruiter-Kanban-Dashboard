/**
 * Redis connection configuration for BullMQ queues.
 * Reads REDIS_URL (full connection string) or falls back to REDIS_HOST/REDIS_PORT.
 */
function getRedisOptions() {
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    return { url: redisUrl, maxRetriesPerRequest: null };
  }

  return {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    maxRetriesPerRequest: null,
  };
}

module.exports = { getRedisOptions };

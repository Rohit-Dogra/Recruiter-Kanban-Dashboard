const logger = require('./logger');
const { getRedisOptions } = require('../config/redis.config');

let redisClient = null;

async function getRedis() {
  if (redisClient) return redisClient;
  try {
    const Redis = require('ioredis');
    const opts = getRedisOptions();
    redisClient = opts.url ? new Redis(opts.url) : new Redis(opts);
    return redisClient;
  } catch (err) {
    logger.warn('Redis not available for caching:', err.message);
    return null;
  }
}

/**
 * Get a cached value by key. Returns null on miss or error.
 */
async function cacheGet(key) {
  const redis = await getRedis();
  if (!redis) return null;
  try {
    const val = await redis.get(key);
    return val ? JSON.parse(val) : null;
  } catch (err) {
    logger.warn(`Cache get failed for ${key}:`, err.message);
    return null;
  }
}

/**
 * Set a cached value with TTL in seconds.
 */
async function cacheSet(key, value, ttlSeconds = 300) {
  const redis = await getRedis();
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    logger.warn(`Cache set failed for ${key}:`, err.message);
  }
}

/**
 * Delete one or more cache keys. Supports glob patterns via SCAN+DEL.
 */
async function cacheInvalidate(...patterns) {
  const redis = await getRedis();
  if (!redis) return;
  try {
    for (const pattern of patterns) {
      if (pattern.includes('*')) {
        // Glob pattern — scan and delete
        let cursor = '0';
        do {
          const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
          cursor = nextCursor;
          if (keys.length > 0) {
            await redis.del(...keys);
          }
        } while (cursor !== '0');
      } else {
        await redis.del(pattern);
      }
    }
  } catch (err) {
    logger.warn('Cache invalidation failed:', err.message);
  }
}

module.exports = { cacheGet, cacheSet, cacheInvalidate };

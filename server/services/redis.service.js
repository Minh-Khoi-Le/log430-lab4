import Redis from 'ioredis';
import { Counter } from 'prom-client';

// Create Redis client
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || '',
  retryStrategy: (times) => Math.min(times * 50, 2000)
});

// Handle Redis connection events
redisClient.on('connect', () => console.log('Redis client connected'));
redisClient.on('error', (err) => console.error('Redis client error:', err));

// Cache TTL in seconds
const DEFAULT_TTL = 60 * 5; // 5 minutes

// Cache metrics
export const cacheMetrics = {
  hits: new Counter({
    name: 'redis_cache_hits_total',
    help: 'Total number of cache hits',
    labelNames: ['endpoint']
  }),
  misses: new Counter({
    name: 'redis_cache_misses_total',
    help: 'Total number of cache misses',
    labelNames: ['endpoint']
  }),
  errors: new Counter({
    name: 'redis_cache_errors_total',
    help: 'Total number of cache errors',
    labelNames: ['operation']
  })
};

/**
 * Get cached data by key
 * @param {string} key - Cache key
 * @returns {Promise<any>} - Cached data or null if not found
 */
export const getCache = async (key) => {
  try {
    const data = await redisClient.get(key);
    
    // Extract endpoint from the cache key for metrics
    const endpoint = key.split(':')[1]?.split('?')[0] || 'unknown';
    
    if (data) {
      cacheMetrics.hits.inc({ endpoint });
      return JSON.parse(data);
    } else {
      cacheMetrics.misses.inc({ endpoint });
      return null;
    }
  } catch (error) {
    console.error('Redis get error:', error);
    cacheMetrics.errors.inc({ operation: 'get' });
    return null;
  }
};

/**
 * Set data in cache with TTL
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} [ttl=DEFAULT_TTL] - Time to live in seconds
 */
export const setCache = async (key, data, ttl = DEFAULT_TTL) => {
  try {
    await redisClient.set(key, JSON.stringify(data), 'EX', ttl);
  } catch (error) {
    console.error('Redis set error:', error);
    cacheMetrics.errors.inc({ operation: 'set' });
  }
};

/**
 * Delete cache by key
 * @param {string} key - Cache key
 */
export const deleteCache = async (key) => {
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error('Redis del error:', error);
    cacheMetrics.errors.inc({ operation: 'delete' });
  }
};

/**
 * Delete multiple cache entries by pattern
 * @param {string} pattern - Key pattern to delete
 */
export const deleteCachePattern = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch (error) {
    console.error('Redis delete pattern error:', error);
    cacheMetrics.errors.inc({ operation: 'deletePattern' });
  }
};

export default redisClient; 
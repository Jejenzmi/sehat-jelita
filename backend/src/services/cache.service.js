/**
 * SIMRS ZEN - Redis Cache Service
 * Handles caching for performance optimization
 */

import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Redis client
const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  lazyConnect: true
});

// Connection event handlers
redis.on('connect', () => {
  console.log('Redis connected');
});

redis.on('error', (error) => {
  console.error('Redis error:', error.message);
});

redis.on('close', () => {
  console.log('Redis connection closed');
});

/**
 * Connect to Redis
 */
export const connect = async () => {
  try {
    await redis.connect();
    return true;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    return false;
  }
};

/**
 * Disconnect from Redis
 */
export const disconnect = async () => {
  await redis.quit();
};

/**
 * Set cache value
 */
export const set = async (key, value, ttlSeconds = 3600) => {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  if (ttlSeconds) {
    return redis.setex(key, ttlSeconds, serialized);
  }
  return redis.set(key, serialized);
};

/**
 * Get cache value
 */
export const get = async (key) => {
  const value = await redis.get(key);
  if (!value) return null;
  
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

/**
 * Delete cache key
 */
export const del = async (key) => {
  return redis.del(key);
};

/**
 * Delete keys by pattern
 */
export const delByPattern = async (pattern) => {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    return redis.del(...keys);
  }
  return 0;
};

/**
 * Check if key exists
 */
export const exists = async (key) => {
  return redis.exists(key);
};

/**
 * Set expiration on key
 */
export const expire = async (key, ttlSeconds) => {
  return redis.expire(key, ttlSeconds);
};

/**
 * Get TTL of key
 */
export const ttl = async (key) => {
  return redis.ttl(key);
};

/**
 * Increment value
 */
export const incr = async (key) => {
  return redis.incr(key);
};

/**
 * Hash operations
 */
export const hset = async (key, field, value) => {
  return redis.hset(key, field, typeof value === 'string' ? value : JSON.stringify(value));
};

export const hget = async (key, field) => {
  const value = await redis.hget(key, field);
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export const hgetall = async (key) => {
  const hash = await redis.hgetall(key);
  if (!hash) return null;
  
  const result = {};
  for (const [field, value] of Object.entries(hash)) {
    try {
      result[field] = JSON.parse(value);
    } catch {
      result[field] = value;
    }
  }
  return result;
};

export const hdel = async (key, ...fields) => {
  return redis.hdel(key, ...fields);
};

/**
 * List operations
 */
export const lpush = async (key, value) => {
  return redis.lpush(key, typeof value === 'string' ? value : JSON.stringify(value));
};

export const rpush = async (key, value) => {
  return redis.rpush(key, typeof value === 'string' ? value : JSON.stringify(value));
};

export const lrange = async (key, start = 0, stop = -1) => {
  const items = await redis.lrange(key, start, stop);
  return items.map(item => {
    try {
      return JSON.parse(item);
    } catch {
      return item;
    }
  });
};

export const ltrim = async (key, start, stop) => {
  return redis.ltrim(key, start, stop);
};

/**
 * Cache-aside pattern helper
 */
export const cacheAside = async (key, fetchFn, ttlSeconds = 3600) => {
  // Try to get from cache
  const cached = await get(key);
  if (cached !== null) {
    return { data: cached, fromCache: true };
  }

  // Fetch fresh data
  const data = await fetchFn();
  
  // Store in cache
  if (data !== null && data !== undefined) {
    await set(key, data, ttlSeconds);
  }

  return { data, fromCache: false };
};

/**
 * Cache key generators
 */
export const CACHE_KEYS = {
  patient: (id) => `patient:${id}`,
  patientList: (page, limit) => `patients:list:${page}:${limit}`,
  visit: (id) => `visit:${id}`,
  doctor: (id) => `doctor:${id}`,
  doctorSchedule: (doctorId, date) => `doctor:${doctorId}:schedule:${date}`,
  department: (id) => `department:${id}`,
  medicine: (id) => `medicine:${id}`,
  medicineStock: (id) => `medicine:${id}:stock`,
  labTest: (id) => `lab:test:${id}`,
  billingRates: () => 'billing:rates',
  icd10: (code) => `icd10:${code}`,
  bpjsReferenceData: (type) => `bpjs:ref:${type}`,
  userSession: (userId) => `session:${userId}`,
  queuePosition: (departmentId, date) => `queue:${departmentId}:${date}`,
  dashboardStats: (date) => `dashboard:stats:${date}`
};

/**
 * Cache TTL presets (in seconds)
 */
export const CACHE_TTL = {
  SHORT: 60,           // 1 minute
  MEDIUM: 300,         // 5 minutes
  STANDARD: 3600,      // 1 hour
  LONG: 86400,         // 24 hours
  WEEK: 604800,        // 1 week
  SESSION: 7200        // 2 hours (for user sessions)
};

export default {
  connect,
  disconnect,
  set,
  get,
  del,
  delByPattern,
  exists,
  expire,
  ttl,
  incr,
  hset,
  hget,
  hgetall,
  hdel,
  lpush,
  rpush,
  lrange,
  ltrim,
  cacheAside,
  CACHE_KEYS,
  CACHE_TTL,
  client: redis
};

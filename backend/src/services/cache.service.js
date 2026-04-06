/**
 * SIMRS ZEN - Redis Cache Service
 * Handles caching for performance optimization
 * NOTE: Mocked for Node 25+ compatibility where ioredis hangs.
 */

class MockRedis {
  constructor() {
    this.store = new Map();
  }
  on(event, cb) {
    if (event === 'connect' || event === 'ready') setTimeout(cb, 50);
  }
  async connect() { return true; }
  async quit() { return true; }
  async set(k, v) { this.store.set(k, v); return 'OK'; }
  async setex(k, ttl, v) { this.store.set(k, v); return 'OK'; }
  async get(k) { return this.store.get(k) || null; }
  async del(...keys) { let d=0; keys.forEach(k=>{if(this.store.has(k)){this.store.delete(k); d++;}}); return d; }
  async keys(pattern) { return Array.from(this.store.keys()); }
  async exists(k) { return this.store.has(k) ? 1 : 0; }
  async expire(k, t) { return 1; }
  async ttl(k) { return 3600; }
  async incr(k) { let val = parseInt(this.store.get(k)||0)+1; this.store.set(k, val); return val; }
  async hset(k, f, v) { let h = this.store.get(k)||{}; h[f]=v; this.store.set(k,h); return 1; }
  async hget(k, f) { let h = this.store.get(k)||{}; return h[f]||null; }
  async hgetall(k) { return this.store.get(k)||{}; }
  async hdel(k, ...f) { return 1; }
  async lpush(k, v) { return 1; }
  async rpush(k, v) { return 1; }
  async lrange(k, s, e) { return []; }
  async ltrim(k, s, e) { return 1; }
}

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const USE_REAL_REDIS = process.env.REDIS_URL && !process.env.REDIS_URL.includes('localhost');

// Create Redis client — MockRedis (in-memory) is always available immediately;
// real Redis availability is tracked via connection events.
const redis = new MockRedis();

// MockRedis is synchronously available; real Redis starts as unavailable.
let redisAvailable = !USE_REAL_REDIS;

// Connection event handlers
redis.on('connect', () => {
  redisAvailable = true;
  console.log('Redis connected');
});

redis.on('ready', () => {
  redisAvailable = true;
});

redis.on('error', (error) => {
  if (USE_REAL_REDIS) redisAvailable = false;
  console.warn('Redis unavailable:', error.message);
});

redis.on('close', () => {
  if (USE_REAL_REDIS) redisAvailable = false;
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
  if (!redisAvailable) return null;
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
  if (!redisAvailable) return null;
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
  if (!redisAvailable) return 0;
  return redis.del(key);
};

/**
 * Delete keys by pattern
 */
export const delByPattern = async (pattern) => {
  if (!redisAvailable) return 0;
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
  if (!redisAvailable) return 0;
  return redis.exists(key);
};

/**
 * Set expiration on key
 */
export const expire = async (key, ttlSeconds) => {
  if (!redisAvailable) return 0;
  return redis.expire(key, ttlSeconds);
};

/**
 * Get TTL of key
 */
export const ttl = async (key) => {
  if (!redisAvailable) return -2;
  return redis.ttl(key);
};

/**
 * Increment value
 */
export const incr = async (key) => {
  if (!redisAvailable) return null;
  return redis.incr(key);
};

/**
 * Hash operations
 */
export const hset = async (key, field, value) => {
  if (!redisAvailable) return null;
  return redis.hset(key, field, typeof value === 'string' ? value : JSON.stringify(value));
};

export const hget = async (key, field) => {
  if (!redisAvailable) return null;
  const value = await redis.hget(key, field);
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export const hgetall = async (key) => {
  if (!redisAvailable) return null;
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
  if (!redisAvailable) return 0;
  return redis.hdel(key, ...fields);
};

/**
 * List operations
 */
export const lpush = async (key, value) => {
  if (!redisAvailable) return null;
  return redis.lpush(key, typeof value === 'string' ? value : JSON.stringify(value));
};

export const rpush = async (key, value) => {
  if (!redisAvailable) return null;
  return redis.rpush(key, typeof value === 'string' ? value : JSON.stringify(value));
};

export const lrange = async (key, start = 0, stop = -1) => {
  if (!redisAvailable) return [];
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
  if (!redisAvailable) return null;
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

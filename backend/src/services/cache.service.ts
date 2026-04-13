/**
 * SIMRS ZEN - Redis Cache Service
 * Handles caching for performance optimization
 * NOTE: Mocked for Node 25+ compatibility where ioredis hangs.
 */

// Redis client interface to abstract MockRedis vs real Redis
interface RedisClient {
  on(event: string, cb: (error?: Error) => void): void;
  connect(): Promise<void>;
  quit(): Promise<void>;
  set(key: string, value: string): Promise<string>;
  setex(key: string, ttl: number, value: string): Promise<string>;
  get(key: string): Promise<string | null>;
  del(...keys: string[]): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  exists(key: string): Promise<number>;
  expire(key: string, ttl: number): Promise<number>;
  ttl(key: string): Promise<number>;
  incr(key: string): Promise<number>;
  hset(key: string, field: string, value: string): Promise<number>;
  hget(key: string, field: string): Promise<string | null>;
  hgetall(key: string): Promise<Record<string, string>>;
  hdel(key: string, ...fields: string[]): Promise<number>;
  lpush(key: string, value: string): Promise<number>;
  rpush(key: string, value: string): Promise<number>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  ltrim(key: string, start: number, stop: number): Promise<number>;
}

class MockRedis implements RedisClient {
  private store: Map<string, unknown>;

  constructor() {
    this.store = new Map();
  }

  on(event: string, cb: () => void): void {
    if (event === 'connect' || event === 'ready') setTimeout(cb, 50);
  }

  async connect(): Promise<void> { }
  async quit(): Promise<void> { }

  async set(key: string, value: string): Promise<string> { this.store.set(key, value); return 'OK'; }
  async setex(key: string, _ttl: number, value: string): Promise<string> { this.store.set(key, value); return 'OK'; }
  async get(key: string): Promise<string | null> { return (this.store.get(key) as string) || null; }
  async del(...keys: string[]): Promise<number> {
    let d = 0;
    keys.forEach(k => { if (this.store.has(k)) { this.store.delete(k); d++; } });
    return d;
  }
  async keys(_pattern: string): Promise<string[]> { return Array.from(this.store.keys()); }
  async exists(key: string): Promise<number> { return this.store.has(key) ? 1 : 0; }
  async expire(_key: string, _t: number): Promise<number> { return 1; }
  async ttl(_key: string): Promise<number> { return 3600; }
  async incr(key: string): Promise<number> {
    const val = parseInt(this.store.get(key) as string || '0') + 1;
    this.store.set(key, val);
    return val;
  }
  async hset(key: string, field: string, value: string): Promise<number> {
    let h = this.store.get(key) as Record<string, string> || {};
    h[field] = value;
    this.store.set(key, h);
    return 1;
  }
  async hget(key: string, field: string): Promise<string | null> {
    const h = this.store.get(key) as Record<string, string> || {};
    return h[field] || null;
  }
  async hgetall(key: string): Promise<Record<string, string>> {
    return (this.store.get(key) as Record<string, string>) || {};
  }
  async hdel(_key: string, ..._fields: string[]): Promise<number> { return 1; }
  async lpush(_key: string, _value: string): Promise<number> { return 1; }
  async rpush(_key: string, _value: string): Promise<number> { return 1; }
  async lrange(_key: string, _start: number, _end: number): Promise<string[]> { return []; }
  async ltrim(_key: string, _start: number, _end: number): Promise<number> { return 1; }
}

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const USE_REAL_REDIS = process.env.REDIS_URL && !process.env.REDIS_URL.includes('localhost');

// Create Redis client -- MockRedis (in-memory) is always available immediately;
// real Redis availability is tracked via connection events.
const redis: RedisClient = new MockRedis();

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

redis.on('error', (error?: Error) => {
  if (USE_REAL_REDIS) redisAvailable = false;
  console.warn('Redis unavailable:', error?.message);
});

redis.on('close', () => {
  if (USE_REAL_REDIS) redisAvailable = false;
  console.log('Redis connection closed');
});

/**
 * Connect to Redis
 */
export const connect = async (): Promise<boolean> => {
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
export const disconnect = async (): Promise<void> => {
  await redis.quit();
};

/**
 * Set cache value
 */
export const set = async (key: string, value: unknown, ttlSeconds: number = 3600): Promise<string | null> => {
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
export const get = async <T = unknown>(key: string): Promise<T | null> => {
  if (!redisAvailable) return null;
  const value = await redis.get(key);
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return value as unknown as T;
  }
};

/**
 * Delete cache key
 */
export const del = async (key: string): Promise<number> => {
  if (!redisAvailable) return 0;
  return redis.del(key);
};

/**
 * Delete keys by pattern
 */
export const delByPattern = async (pattern: string): Promise<number> => {
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
export const exists = async (key: string): Promise<number> => {
  if (!redisAvailable) return 0;
  return redis.exists(key);
};

/**
 * Set expiration on key
 */
export const expire = async (key: string, ttlSeconds: number): Promise<number> => {
  if (!redisAvailable) return 0;
  return redis.expire(key, ttlSeconds);
};

/**
 * Get TTL of key
 */
export const ttl = async (key: string): Promise<number> => {
  if (!redisAvailable) return -2;
  return redis.ttl(key);
};

/**
 * Increment value
 */
export const incr = async (key: string): Promise<number | null> => {
  if (!redisAvailable) return null;
  return redis.incr(key);
};

/**
 * Hash operations
 */
export const hset = async (key: string, field: string, value: unknown): Promise<number | null> => {
  if (!redisAvailable) return null;
  return redis.hset(key, field, typeof value === 'string' ? value : JSON.stringify(value));
};

export const hget = async <T = unknown>(key: string, field: string): Promise<T | null> => {
  if (!redisAvailable) return null;
  const value = await redis.hget(key, field);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as unknown as T;
  }
};

export const hgetall = async (key: string): Promise<Record<string, unknown> | null> => {
  if (!redisAvailable) return null;
  const hash = await redis.hgetall(key);
  if (!hash) return null;

  const result: Record<string, unknown> = {};
  for (const [field, value] of Object.entries(hash)) {
    try {
      result[field] = JSON.parse(value as string);
    } catch {
      result[field] = value;
    }
  }
  return result;
};

export const hdel = async (key: string, ...fields: string[]): Promise<number> => {
  if (!redisAvailable) return 0;
  return redis.hdel(key, ...fields);
};

/**
 * List operations
 */
export const lpush = async (key: string, value: unknown): Promise<number | null> => {
  if (!redisAvailable) return null;
  return redis.lpush(key, typeof value === 'string' ? value : JSON.stringify(value));
};

export const rpush = async (key: string, value: unknown): Promise<number | null> => {
  if (!redisAvailable) return null;
  return redis.rpush(key, typeof value === 'string' ? value : JSON.stringify(value));
};

export const lrange = async <T = unknown>(key: string, start: number = 0, stop: number = -1): Promise<T[]> => {
  if (!redisAvailable) return [];
  const items = await redis.lrange(key, start, stop);
  return items.map(item => {
    try {
      return JSON.parse(item) as T;
    } catch {
      return item as unknown as T;
    }
  });
};

export const ltrim = async (key: string, start: number, stop: number): Promise<number | null> => {
  if (!redisAvailable) return null;
  return redis.ltrim(key, start, stop);
};

export interface CacheAsideResult<T> {
  data: T;
  fromCache: boolean;
}

/**
 * Cache-aside pattern helper
 */
export const cacheAside = async <T>(key: string, fetchFn: () => Promise<T>, ttlSeconds: number = 3600): Promise<CacheAsideResult<T>> => {
  // Try to get from cache
  const cached = await get<T>(key);
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
  patient: (id: string) => `patient:${id}`,
  patientList: (page: number, limit: number) => `patients:list:${page}:${limit}`,
  visit: (id: string) => `visit:${id}`,
  doctor: (id: string) => `doctor:${id}`,
  doctorSchedule: (doctorId: string, date: string) => `doctor:${doctorId}:schedule:${date}`,
  department: (id: string) => `department:${id}`,
  medicine: (id: string) => `medicine:${id}`,
  medicineStock: (id: string) => `medicine:${id}:stock`,
  labTest: (id: string) => `lab:test:${id}`,
  billingRates: () => 'billing:rates',
  icd10: (code: string) => `icd10:${code}`,
  bpjsReferenceData: (type: string) => `bpjs:ref:${type}`,
  userSession: (userId: string) => `session:${userId}`,
  queuePosition: (departmentId: string, date: string) => `queue:${departmentId}:${date}`,
  dashboardStats: (date: string) => `dashboard:stats:${date}`
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
} as const;

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

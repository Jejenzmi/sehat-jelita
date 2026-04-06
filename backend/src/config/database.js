/**
 * SIMRS ZEN - Database Configuration
 * Prisma Client with connection pooling, query logging, and slow-query detection
 */

import { PrismaClient } from '@prisma/client';

const isProd = process.env.NODE_ENV === 'production';

// Slow query threshold (ms)
const SLOW_QUERY_MS = isProd ? 500 : 1000;

// Singleton pattern for Prisma Client
const globalForPrisma = globalThis;

function createPrismaClient() {
  const logLevels = isProd
    ? [{ emit: 'event', level: 'error' }, { emit: 'event', level: 'warn' }]
    : [{ emit: 'event', level: 'query' }, { emit: 'event', level: 'error' }, { emit: 'event', level: 'warn' }];

  const client = new PrismaClient({
    log: logLevels,
    errorFormat: isProd ? 'minimal' : 'pretty',
  });

  // Slow query detection
  client.$on('query', (e) => {
    const duration = e.duration;
    if (duration > SLOW_QUERY_MS) {
      console.warn('[DB SLOW QUERY]', {
        duration: `${duration}ms`,
        query: e.query.slice(0, 200),
        params: e.params?.slice(0, 100),
      });
    }
  });

  client.$on('error', (e) => {
    console.error('[DB ERROR]', { message: e.message, target: e.target });
  });

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (!isProd) {
  globalForPrisma.prisma = prisma;
}

// ── Connection health check ───────────────────────────────────────────────────

export async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection established');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// ── Pool stats (best-effort) ──────────────────────────────────────────────────

export async function getDatabaseStats() {
  try {
    const [connStats, dbSize] = await Promise.all([
      prisma.$queryRaw`
        SELECT count(*) AS total,
               count(*) FILTER (WHERE state = 'active') AS active,
               count(*) FILTER (WHERE state = 'idle')   AS idle,
               count(*) FILTER (WHERE wait_event_type IS NOT NULL) AS waiting
        FROM pg_stat_activity
        WHERE datname = current_database()
      `,
      prisma.$queryRaw`
        SELECT pg_size_pretty(pg_database_size(current_database())) AS size,
               pg_database_size(current_database()) AS size_bytes
      `,
    ]);

    return {
      connections: connStats[0],
      database_size: dbSize[0],
    };
  } catch {
    return null;
  }
}

// ── Graceful shutdown ─────────────────────────────────────────────────────────

export async function disconnectDatabase() {
  await prisma.$disconnect();
  console.log('Database disconnected');
}

// ── Transaction helper ────────────────────────────────────────────────────────

export async function withTransaction(callback) {
  return prisma.$transaction(callback, {
    maxWait: 5000,  // max time to acquire connection
    timeout: 30000, // max transaction duration
  });
}

export default prisma;

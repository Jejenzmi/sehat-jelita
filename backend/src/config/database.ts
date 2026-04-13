/**
 * SIMRS ZEN - Database Configuration
 * Prisma Client with connection pooling, query logging, and slow-query detection
 */

import { PrismaClient, Prisma } from '@prisma/client';

const isProd = process.env.NODE_ENV === 'production';

// Slow query threshold (ms)
const SLOW_QUERY_MS = isProd ? 500 : 1000;

// Singleton pattern for Prisma Client
const globalForPrisma = globalThis as typeof globalThis & { prisma?: PrismaClient };

type PrismaLogEvent = {
  emit: 'event';
  level: 'query' | 'error' | 'warn';
};

function createPrismaClient(): PrismaClient {
  const logLevels: PrismaLogEvent[] = isProd
    ? [{ emit: 'event' as const, level: 'error' }, { emit: 'event' as const, level: 'warn' }]
    : [{ emit: 'event' as const, level: 'query' }, { emit: 'event' as const, level: 'error' }, { emit: 'event' as const, level: 'warn' }];

  const client = new PrismaClient({
    log: logLevels,
    errorFormat: isProd ? 'minimal' : 'pretty',
  });

  // Slow query detection
  client.$on('query', (e: Prisma.QueryEvent) => {
    const duration = e.duration;
    if (duration > SLOW_QUERY_MS) {
      console.warn('[DB SLOW QUERY]', {
        duration: `${duration}ms`,
        query: e.query.slice(0, 200),
        params: e.params?.slice(0, 100),
      });
    }
  });

  client.$on('error', (e: Prisma.LogEvent) => {
    console.error('[DB ERROR]', { message: e.message, target: e.target });
  });

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (!isProd) {
  globalForPrisma.prisma = prisma;
}

// ── Connection health check ───────────────────────────────────────────────────

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection established');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', (error as Error).message);
    return false;
  }
}

// ── Pool stats (best-effort) ──────────────────────────────────────────────────

interface ConnectionStats {
  total: bigint | number;
  active: bigint | number;
  idle: bigint | number;
  waiting: bigint | number;
}

interface DatabaseSizeInfo {
  size: string;
  size_bytes: bigint | number;
}

interface DatabaseStats {
  connections: ConnectionStats;
  database_size: DatabaseSizeInfo;
}

export async function getDatabaseStats(): Promise<DatabaseStats | null> {
  try {
    const [connStats, dbSize] = await Promise.all([
      prisma.$queryRaw`
        SELECT count(*) AS total,
               count(*) FILTER (WHERE state = 'active') AS active,
               count(*) FILTER (WHERE state = 'idle')   AS idle,
               count(*) FILTER (WHERE wait_event_type IS NOT NULL) AS waiting
        FROM pg_stat_activity
        WHERE datname = current_database()
      ` as Promise<ConnectionStats[]>,
      prisma.$queryRaw`
        SELECT pg_size_pretty(pg_database_size(current_database())) AS size,
               pg_database_size(current_database()) AS size_bytes
      ` as Promise<DatabaseSizeInfo[]>,
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

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log('Database disconnected');
}

// ── Transaction helper ────────────────────────────────────────────────────────

export async function withTransaction<T>(
  callback: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(callback, {
    maxWait: 5000,  // max time to acquire connection
    timeout: 30000, // max transaction duration
  });
}

export default prisma;

/**
 * SIMRS ZEN - Database Configuration
 * Prisma Client Setup with Connection Pooling
 */

import { PrismaClient } from '@prisma/client';

// Singleton pattern for Prisma Client
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
  errorFormat: 'pretty'
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Connection health check
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

// Graceful shutdown
export async function disconnectDatabase() {
  await prisma.$disconnect();
  console.log('Database disconnected');
}

// Transaction helper
export async function withTransaction(callback) {
  return prisma.$transaction(callback);
}

export default prisma;

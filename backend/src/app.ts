/**
 * SIMRS ZEN - Express Application Entry Point
 * SIMRS ZEN Node.js/Express application
 */

import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { createServer, type Server } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

// ============================================
// STARTUP VALIDATION
// ============================================

// Load .env and validate environment variables using Zod schema (exits on error)
import { env } from './config/Env.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { requestLogger } from './middleware/logger.js';
import piiSanitizer from './middleware/pii-sanitizer.js';
import { metricsMiddleware, metricsHandler, wsConnections } from './middleware/metrics.js';

// Import centralized routes
import apiRouter from './routes/index.js';
import { checkDatabaseConnection } from './config/database.js';

// Import Socket handlers
import { initializeSocketHandlers } from './socket/index.js';

// Phase 3: Queue, Scheduler, Swagger
import { startQueue, stopQueue, registerProcessor, type QueueJob } from './utils/queue.js';
import { startScheduler, stopScheduler } from './services/scheduler.js';
import { processPdfJob } from './workers/pdf.worker.js';
import { processReportJob } from './workers/report.worker.js';
import { processBpjsJob } from './workers/bpjs.worker.js';
import { processSatuSehatJob } from './workers/satusehat.worker.js';
import { mountSwagger } from './config/swagger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();
const httpServer: Server = createServer(app);

// Socket.IO Setup
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io accessible in routes
app.set('io', io);

// ============================================
// MIDDLEWARE
// ============================================

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));

// CORS Configuration
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ]
}));

// Cookie parser (required for httpOnly JWT cookies)
app.use(cookieParser());

// gzip/brotli compression (before routes, after cookie parser)
app.use(compression({ threshold: 1024 })); // only compress responses > 1KB

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Prometheus metrics collection (before routes)
app.use(metricsMiddleware);

// Request logging
app.use(requestLogger);

// PII sanitization — attaches req.sanitizedBody for safe logging of all requests
app.use(piiSanitizer);

// Rate limiting
app.use('/api/', rateLimiter);

// Static file serving — uploaded files (photos, documents)
app.use('/uploads', express.static(path.resolve(__dirname, '../../uploads')));

// ============================================
// ROUTES
// ============================================

// ── Comprehensive Health Check ────────────────────────────────────────────────
app.get('/health', async (_req: Request, res: Response) => {
  const checks: Record<string, unknown> = {};
  let overallOk = true;

  // 1. Database
  try {
    const { prisma, getDatabaseStats } = await import('./config/database.js');
    const t0 = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const stats = await getDatabaseStats();
    checks.database = { status: 'ok', latencyMs: Date.now() - t0, stats };
  } catch (err: unknown) {
    const error = err as Error;
    checks.database = { status: 'error', error: error.message };
    overallOk = false;
  }

  // 2. Redis / Cache
  try {
    const cache = await import('./services/cache.service.js');
    const t0 = Date.now();
    await cache.set('__healthcheck__', '1', 5);
    const val = await cache.get('__healthcheck__');
    checks.redis = { status: val === '1' ? 'ok' : 'degraded', latencyMs: Date.now() - t0 };
  } catch (err: unknown) {
    const error = err as Error;
    checks.redis = { status: 'error', error: error.message };
    // Redis failure is degraded, not fatal
  }

  // 3. Disk space (uploads directory)
  try {
    const { statfsSync } = await import('node:fs');
    const stat = statfsSync(process.env.STORAGE_PATH || './uploads');
    const freeGb = ((stat.bfree * stat.bsize) / 1e9).toFixed(2);
    const totalGb = ((stat.blocks * stat.bsize) / 1e9).toFixed(2);
    const usedPct = (((stat.blocks - stat.bfree) / stat.blocks) * 100).toFixed(1);
    const diskOk = parseFloat(usedPct) < 90;
    checks.disk = { status: diskOk ? 'ok' : 'warning', freeGb, totalGb, usedPct: `${usedPct}%` };
    if (!diskOk) overallOk = false;
  } catch {
    checks.disk = { status: 'unknown' };
  }

  // 4. Background queue
  try {
    const { getQueueStats } = await import('./utils/queue.js') as any;
    const qStats = getQueueStats ? await getQueueStats() : null;
    checks.queue = { status: 'ok', stats: qStats };
  } catch {
    checks.queue = { status: 'unknown' };
  }

  // 5. Circuit breakers (external API status)
  try {
    const { getAllBreakerStatus } = await import('./utils/circuit-breaker.js');
    checks.circuit_breakers = getAllBreakerStatus();
  } catch {
    checks.circuit_breakers = [];
  }

  const httpStatus = overallOk ? 200 : 503;
  res.status(httpStatus).json({
    status: overallOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: '1.0.0',
    service: 'SIMRS ZEN API',
    checks,
  });
});

// Prometheus metrics endpoint (unauthenticated, for scraping)
app.get('/metrics', metricsHandler);

// API Routes — versioned (v1) with backward-compatible /api alias
app.use('/api/v1', apiRouter);
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  // Backward compatibility: /api/* → /api/v1/* for existing clients
  if (!req.path.startsWith('/v1')) {
    return apiRouter(req, res, next);
  }
  next();
});

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint tidak ditemukan',
    path: req.originalUrl
  });
});

// Global Error Handler
app.use(errorHandler);

// ============================================
// SOCKET.IO
// ============================================

initializeSocketHandlers(io);

// Track WebSocket connections for Prometheus
io.on('connection', () => wsConnections.inc());
io.on('disconnect', () => wsConnections.dec());

// ============================================
// SERVER START
// ============================================

const PORT = env.PORT;

// Verify database connection before binding to the port
const dbConnected = await checkDatabaseConnection();
if (!dbConnected) {
  console.error('❌ Could not connect to the database. Exiting.');
  process.exit(1);
}

// ============================================
// SWAGGER / API DOCS
// ============================================
await mountSwagger(app);

// ============================================
// BACKGROUND QUEUE + SCHEDULER
// ============================================

// Register all job processors (must happen before startQueue recovers pending jobs)
registerProcessor('pdf', processPdfJob as (job: QueueJob) => Promise<unknown>);
registerProcessor('reports', processReportJob as (job: QueueJob) => Promise<unknown>);
registerProcessor('bpjs', processBpjsJob as (job: QueueJob) => Promise<unknown>);
registerProcessor('satusehat', processSatuSehatJob as (job: QueueJob) => Promise<unknown>);

await startQueue();
startScheduler();

// LIS Gateway (Lab Analyzer Interface) — start if enabled
if (process.env.LIS_GATEWAY_ENABLED === 'true') {
  const { startASTMServer, startHL7Server } = await import('./services/lis-gateway.js');
  startASTMServer(parseInt(process.env.LIS_ASTM_PORT || '9001'));
  startHL7Server(parseInt(process.env.LIS_HL7_PORT || '9002'));
}

// ============================================
// SERVER LISTEN
// ============================================

httpServer.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║     SIMRS ZEN API Server Started             ║
  ╠══════════════════════════════════════════════╣
  ║  Port:    ${String(PORT).padEnd(8)}                       ║
  ║  Env:     ${(process.env.NODE_ENV || 'development').padEnd(12)}                   ║
  ║  API v1:  http://localhost:${PORT}/api/v1      ║
  ║  Docs:    http://localhost:${PORT}/api/docs    ║
  ║  Metrics: http://localhost:${PORT}/metrics     ║
  ║  LIS:     ${process.env.LIS_GATEWAY_ENABLED === 'true' ? 'ASTM:' + (process.env.LIS_ASTM_PORT || '9001') + ' HL7:' + (process.env.LIS_HL7_PORT || '9002') : 'disabled'.padEnd(20)}       ║
  ╚══════════════════════════════════════════════╝
  `);
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

function gracefulShutdown(signal: string): void {
  console.log(`${signal} received. Shutting down gracefully...`);
  stopScheduler();
  stopQueue();
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
  // Force kill if server hasn't closed in 10s
  setTimeout(() => { process.exit(1); }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;

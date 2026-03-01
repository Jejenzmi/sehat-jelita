/**
 * SIMRS ZEN - Express Application Entry Point
 * SIMRS ZEN Node.js/Express application
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';

// ============================================
// STARTUP VALIDATION
// ============================================

// Load .env and validate environment variables using Zod schema (exits on error)
import { env } from './config/env.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { requestLogger } from './middleware/logger.js';

// Import centralized routes
import apiRouter from './routes/index.js';

import { checkDatabaseConnection } from './config/database.js';

// Import Socket handlers
import { initializeSocketHandlers } from './socket/index.js';

const app = express();
const httpServer = createServer(app);

// Socket.IO Setup
const io = new Server(httpServer, {
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

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Rate limiting
app.use('/api/', rateLimiter);

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', async (req, res) => {
  const start = Date.now();
  try {
    const { prisma } = await import('./config/database.js');
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      service: 'SIMRS ZEN API',
      database: { status: 'connected', latencyMs }
    });
  } catch (error) {
    console.error('Health check database error:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      service: 'SIMRS ZEN API',
      database: { status: 'disconnected' }
    });
  }
});

// API Routes
app.use('/api', apiRouter);

// 404 Handler
app.use((req, res) => {
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

httpServer.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║     SIMRS ZEN API Server Started          ║
  ╠═══════════════════════════════════════════╣
  ║  Port: ${PORT}                              ║
  ║  Environment: ${process.env.NODE_ENV || 'development'}             ║
  ║  API Base: http://localhost:${PORT}/api     ║
  ╚═══════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;

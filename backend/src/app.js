/**
 * SIMRS ZEN - Express Application Entry Point
 * Migration from Lovable Cloud to Node.js/Express
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ============================================
// STARTUP VALIDATION
// ============================================

import { validateEnv } from './config/env.js';
validateEnv();

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
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'SIMRS ZEN API'
  });
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

const PORT = process.env.PORT || 3000;

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

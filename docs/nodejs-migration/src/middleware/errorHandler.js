/**
 * SIMRS ZEN - Global Error Handler
 * Centralized error handling for all routes
 */

import { Prisma } from '@prisma/client';

/**
 * Custom API Error Class
 */
export class ApiError extends Error {
  constructor(statusCode, message, code = 'ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}

/**
 * Global Error Handler Middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    user: req.user?.id
  });

  // Handle known API errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
      details: err.details
    });
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(err, res);
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      error: 'Data tidak valid',
      code: 'VALIDATION_ERROR',
      details: err.message
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Token tidak valid',
      code: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token sudah kadaluarsa',
      code: 'TOKEN_EXPIRED'
    });
  }

  // Handle validation errors (Zod)
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: 'Validasi gagal',
      code: 'VALIDATION_ERROR',
      details: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    });
  }

  // Default 500 error
  return res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    code: 'INTERNAL_ERROR'
  });
};

/**
 * Handle Prisma-specific errors
 */
function handlePrismaError(err, res) {
  switch (err.code) {
    case 'P2002':
      // Unique constraint violation
      const field = err.meta?.target?.[0] || 'field';
      return res.status(409).json({
        success: false,
        error: `Data dengan ${field} ini sudah ada`,
        code: 'DUPLICATE_ENTRY',
        field
      });

    case 'P2003':
      // Foreign key constraint violation
      return res.status(400).json({
        success: false,
        error: 'Referensi data tidak valid',
        code: 'FOREIGN_KEY_ERROR'
      });

    case 'P2025':
      // Record not found
      return res.status(404).json({
        success: false,
        error: 'Data tidak ditemukan',
        code: 'NOT_FOUND'
      });

    case 'P2014':
      // Required relation violation
      return res.status(400).json({
        success: false,
        error: 'Data terkait diperlukan',
        code: 'RELATION_REQUIRED'
      });

    default:
      return res.status(500).json({
        success: false,
        error: 'Database error',
        code: 'DB_ERROR',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
  }
}

/**
 * Async Handler Wrapper
 * Catches async errors and passes to error handler
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Not Found Handler
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint tidak ditemukan',
    code: 'NOT_FOUND',
    path: req.originalUrl
  });
};

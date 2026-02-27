/**
 * SIMRS ZEN - Rate Limiting Middleware
 * Protects API from abuse and DDoS
 */

import rateLimit from 'express-rate-limit';

/**
 * General API Rate Limiter
 * 100 requests per 15 minutes per IP
 */
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Terlalu banyak request. Silakan coba lagi nanti.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60 // seconds
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.id || req.ip;
  }
});

/**
 * Strict Rate Limiter for Auth Endpoints
 * 5 attempts per 15 minutes
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: 'Terlalu banyak percobaan login. Silakan tunggu 15 menit.',
    code: 'AUTH_RATE_LIMIT'
  },
  skipSuccessfulRequests: true // Don't count successful logins
});

/**
 * Rate Limiter for BPJS/External API Calls
 * Respect external API limits
 */
export const externalApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    success: false,
    error: 'Rate limit untuk API eksternal tercapai. Tunggu sebentar.',
    code: 'EXTERNAL_API_RATE_LIMIT'
  }
});

/**
 * Rate Limiter for File Uploads
 * 10 uploads per hour
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: false,
    error: 'Batas upload tercapai. Maksimal 10 file per jam.',
    code: 'UPLOAD_RATE_LIMIT'
  }
});

/**
 * Rate Limiter for Report Generation
 * Heavy operations limited to 5 per hour
 */
export const reportRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: 'Batas generate laporan tercapai. Maksimal 5 laporan per jam.',
    code: 'REPORT_RATE_LIMIT'
  }
});

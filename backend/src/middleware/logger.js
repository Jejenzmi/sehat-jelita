/**
 * SIMRS ZEN - Structured Request Logger
 * JSON logs with correlation ID for distributed tracing.
 * Production: LOG_FORMAT=json → parsed by Loki/CloudWatch/ELK
 * Development: human-readable
 */

import { randomUUID } from 'node:crypto';
import { sanitizeObject } from './pii-sanitizer.js';

const isProd    = process.env.NODE_ENV === 'production';
const LOG_LEVEL = (process.env.LOG_LEVEL || 'info').toLowerCase();

// Minimum numeric level to emit
const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const minLevel = LEVELS[LOG_LEVEL] ?? 2;

function emit(level, obj) {
  if ((LEVELS[level] ?? 2) > minLevel) return;

  if (isProd) {
    // Structured JSON — one line per log event
    process.stdout.write(JSON.stringify({
      level,
      ts: new Date().toISOString(),
      ...obj,
    }) + '\n');
  } else {
    // Human-readable for local dev
    const { requestId, method, path, status, duration, ...rest } = obj;
    const prefix = requestId ? `[${requestId}]` : '';
    const statusStr = status ? ` ${status}` : '';
    const durationStr = duration ? ` (${duration})` : '';
    const extra = Object.keys(rest).length ? ' ' + JSON.stringify(rest) : '';
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
      `${level.toUpperCase()} ${prefix} ${method || ''} ${path || ''}${statusStr}${durationStr}${extra}`
    );
  }
}

// ── Request Logger Middleware ─────────────────────────────────────────────────

export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Correlation ID: use upstream header (load balancer / API gateway) or generate
  const correlationId = req.headers['x-correlation-id']
    || req.headers['x-request-id']
    || `req_${randomUUID().replace(/-/g, '').slice(0, 16)}`;

  req.requestId = correlationId;
  // Forward correlation ID in response headers so clients can trace
  res.setHeader('X-Correlation-Id', correlationId);

  // Log incoming request (debug only to avoid log spam in prod)
  emit('debug', {
    requestId: correlationId,
    method:    req.method,
    path:      req.path,
    query:     Object.keys(req.query).length ? req.query : undefined,
    ip:        req.ip,
    userAgent: req.get('User-Agent'),
    userId:    req.user?.id,
    event:     'request_start',
  });

  // Intercept response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level    = res.statusCode >= 500 ? 'error'
                   : res.statusCode >= 400 ? 'warn'
                   : 'info';

    emit(level, {
      requestId: correlationId,
      method:    req.method,
      path:      req.path,
      status:    res.statusCode,
      duration:  `${duration}ms`,
      userId:    req.user?.id,
      event:     'request_end',
    });
  });

  next();
};

// ── Error Logger ──────────────────────────────────────────────────────────────

export const errorLogger = (err, req, res, next) => {
  emit('error', {
    requestId: req.requestId,
    method:    req.method,
    path:      req.path,
    userId:    req.user?.id,
    error:     err.message,
    code:      err.code,
    stack:     isProd ? undefined : err.stack,
    body:      sanitizeObject(req.body),
    event:     'request_error',
  });
  next(err);
};

// ── Audit Logger ──────────────────────────────────────────────────────────────

export const auditLog = async (prisma, { tableName, action, recordId, userId, oldData, newData, req }) => {
  try {
    await prisma.audit_logs.create({
      data: {
        table_name:  tableName,
        action,
        record_id:   recordId,
        user_id:     userId,
        old_data:    oldData,
        new_data:    newData,
        ip_address:  req?.ip,
        user_agent:  req?.get?.('User-Agent'),
      },
    });
  } catch (error) {
    emit('warn', { event: 'audit_log_failed', error: error.message, action, tableName });
  }
};

// ── App-level logger (use anywhere) ──────────────────────────────────────────

export const logger = {
  info:  (msg, meta = {}) => emit('info',  { msg, ...meta }),
  warn:  (msg, meta = {}) => emit('warn',  { msg, ...meta }),
  error: (msg, meta = {}) => emit('error', { msg, ...meta }),
  debug: (msg, meta = {}) => emit('debug', { msg, ...meta }),
};

export default requestLogger;

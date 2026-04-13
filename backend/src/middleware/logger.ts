/**
 * SIMRS ZEN - Structured Request Logger
 * JSON logs with correlation ID for distributed tracing.
 * Production: LOG_FORMAT=json -> parsed by Loki/Cloudwatch/ELK
 * Development: human-readable
 */

import { randomUUID } from 'node:crypto';
import { sanitizeObject } from './pii-sanitizer.js';
import type { Request, Response, NextFunction } from 'express';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEvent {
  level?: LogLevel;
  ts?: string;
  msg?: string;
  requestId?: string;
  method?: string;
  path?: string;
  status?: number;
  duration?: string;
  query?: Record<string, unknown>;
  ip?: string | undefined;
  userAgent?: string | undefined;
  userId?: string | undefined;
  event?: string;
  error?: string;
  code?: string;
  stack?: string;
  body?: unknown;
  action?: string;
  tableName?: string;
  [key: string]: unknown;
}

interface AuditLogParams {
  tableName: string;
  action: string;
  recordId: string;
  userId: string;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  req?: Request;
}

const isProd = process.env.NODE_ENV === 'production';
const LOG_LEVEL = (process.env.LOG_LEVEL || 'info').toLowerCase();

// Minimum numeric level to emit
const LEVELS: Record<LogLevel, number> = { error: 0, warn: 1, info: 2, debug: 3 };
const minLevel = LEVELS[LOG_LEVEL as LogLevel] ?? 2;

function emit(level: LogLevel, obj: LogEvent) {
  if ((LEVELS[level] ?? 2) > minLevel) return;

  if (isProd) {
    // Structured JSON -- one line per log event
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

// -- Request Logger Middleware --

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Correlation ID: use upstream header (load balancer / API gateway) or generate
  const correlationId = (req.headers['x-correlation-id'] as string)
    || (req.headers['x-request-id'] as string)
    || `req_${randomUUID().replace(/-/g, '').slice(0, 16)}`;

  req.requestId = correlationId;
  // Forward correlation ID in response headers so clients can trace
  res.setHeader('X-Correlation-Id', correlationId);

  // Log incoming request (debug only to avoid log spam in prod)
  emit('debug', {
    requestId: correlationId,
    method: req.method,
    path: req.path,
    query: Object.keys(req.query).length ? req.query as Record<string, unknown> : undefined,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    event: 'request_start',
  });

  // Intercept response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level: LogLevel = res.statusCode >= 500 ? 'error'
      : res.statusCode >= 400 ? 'warn'
        : 'info';

    emit(level, {
      requestId: correlationId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id,
      event: 'request_end',
    });
  });

  next();
};

// -- Error Logger --

export const errorLogger = (err: Error, req: Request, res: Response, next: NextFunction) => {
  emit('error', {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    error: err.message,
    code: (err as unknown as Record<string, unknown>).code as string | undefined,
    stack: isProd ? undefined : err.stack,
    body: sanitizeObject(req.body),
    event: 'request_error',
  });
  next(err);
};

// -- Audit Logger --

export const auditLog = async (
  prisma: {
    audit_logs: {
      create: (params: { data: Record<string, unknown> }) => Promise<unknown>;
    };
  },
  { tableName, action, recordId, userId, oldData, newData, req }: AuditLogParams,
) => {
  try {
    await prisma.audit_logs.create({
      data: {
        table_name: tableName,
        action,
        record_id: recordId,
        user_id: userId,
        old_data: oldData,
        new_data: newData,
        ip_address: req?.ip,
        user_agent: req?.get?.('User-Agent'),
      },
    });
  } catch (error) {
    emit('warn', { event: 'audit_log_failed', error: (error as Error).message, action, tableName });
  }
};

// -- App-level logger (use anywhere) --

export const logger = {
  info: (msg: string, meta: Record<string, unknown> = {}) => emit('info', { msg, ...meta }),
  warn: (msg: string, meta: Record<string, unknown> = {}) => emit('warn', { msg, ...meta }),
  error: (msg: string, meta: Record<string, unknown> = {}) => emit('error', { msg, ...meta }),
  debug: (msg: string, meta: Record<string, unknown> = {}) => emit('debug', { msg, ...meta }),
};

export default requestLogger;

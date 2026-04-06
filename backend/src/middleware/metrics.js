/**
 * SIMRS ZEN - Prometheus Metrics Middleware
 * Exposes /metrics endpoint for Prometheus scraping
 * 
 * Tracks: HTTP requests, DB queries, queue jobs, system resources
 */

import client from 'prom-client';

// ── Create Registry ────────────────────────────────────────────────────────────
const register = new client.Registry();

// Add default Node.js metrics (CPU, memory, event loop, GC, etc.)
client.collectDefaultMetrics({ register, prefix: 'simrs_' });

// ── Custom Metrics ─────────────────────────────────────────────────────────────

// HTTP request duration
export const httpRequestDuration = new client.Histogram({
  name: 'simrs_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

// HTTP request counter
export const httpRequestTotal = new client.Counter({
  name: 'simrs_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Active HTTP connections
export const activeConnections = new client.Gauge({
  name: 'simrs_active_connections',
  help: 'Number of active HTTP connections',
  registers: [register],
});

// Database query duration
export const dbQueryDuration = new client.Histogram({
  name: 'simrs_db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'model'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register],
});

// Queue job metrics
export const queueJobsTotal = new client.Counter({
  name: 'simrs_queue_jobs_total',
  help: 'Total queue jobs processed',
  labelNames: ['queue', 'status'],
  registers: [register],
});

export const queueJobDuration = new client.Histogram({
  name: 'simrs_queue_job_duration_seconds',
  help: 'Duration of queue job processing',
  labelNames: ['queue'],
  buckets: [0.1, 0.5, 1, 5, 10, 30, 60],
  registers: [register],
});

export const queuePendingJobs = new client.Gauge({
  name: 'simrs_queue_pending_jobs',
  help: 'Number of pending jobs in queue',
  labelNames: ['queue'],
  registers: [register],
});

// Business metrics
export const activePatients = new client.Gauge({
  name: 'simrs_active_patients_total',
  help: 'Total active patients in system',
  registers: [register],
});

export const todayVisits = new client.Gauge({
  name: 'simrs_today_visits_total',
  help: 'Total visits today',
  registers: [register],
});

export const bedOccupancy = new client.Gauge({
  name: 'simrs_bed_occupancy_ratio',
  help: 'Current bed occupancy ratio (0-1)',
  registers: [register],
});

export const pendingLabOrders = new client.Gauge({
  name: 'simrs_pending_lab_orders',
  help: 'Number of pending lab orders',
  registers: [register],
});

export const notificationsSent = new client.Counter({
  name: 'simrs_notifications_sent_total',
  help: 'Total notifications sent',
  labelNames: ['channel', 'status'],
  registers: [register],
});

// WebSocket connections
export const wsConnections = new client.Gauge({
  name: 'simrs_websocket_connections',
  help: 'Number of active WebSocket connections',
  registers: [register],
});

// ── HTTP Metrics Middleware ────────────────────────────────────────────────────

export function metricsMiddleware(req, res, next) {
  // Skip metrics endpoint itself
  if (req.path === '/metrics') return next();

  activeConnections.inc();
  const end = httpRequestDuration.startTimer();

  // Normalize route for label (avoid cardinality explosion from UUIDs)
  const getRoute = () => {
    const route = req.route?.path || req.path || 'unknown';
    // Replace UUIDs and numeric IDs with :id placeholder
    return route
      .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
      .replace(/\/\d+/g, '/:id');
  };

  res.on('finish', () => {
    const route = getRoute();
    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode,
    };
    end(labels);
    httpRequestTotal.inc(labels);
    activeConnections.dec();
  });

  next();
}

// ── Metrics Endpoint Handler ──────────────────────────────────────────────────

export async function metricsHandler(_req, res) {
  // Collect business metrics before scraping
  try {
    const { prisma } = await import('../config/database.js');
    
    const [patientCount, visitCount, pendingLab, occupiedBeds, totalBeds] = await Promise.all([
      prisma.patients.count({ where: { is_active: true } }).catch(() => 0),
      prisma.visits.count({ 
        where: { visit_date: { gte: new Date(new Date().setHours(0,0,0,0)) } } 
      }).catch(() => 0),
      prisma.lab_orders.count({ where: { status: 'pending' } }).catch(() => 0),
      prisma.beds.count({ where: { status: 'occupied' } }).catch(() => 0),
      prisma.beds.count().catch(() => 1),
    ]);

    activePatients.set(patientCount);
    todayVisits.set(visitCount);
    pendingLabOrders.set(pendingLab);
    bedOccupancy.set(totalBeds > 0 ? occupiedBeds / totalBeds : 0);
  } catch {
    // Don't fail metrics if DB is down — still return Node.js metrics
  }

  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
}

export { register };

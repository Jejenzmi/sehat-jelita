/**
 * SIMRS ZEN - Persistent Background Job Queue
 *
 * Dual-layer queue:
 * - In-memory FIFO for immediate processing (fast path)
 * - DB-backed persistence for durability + retry + status tracking
 *
 * Drop-in replacement for BullMQ that works on Node 20+/25+ without ioredis issues.
 */

import { prisma } from '../config/database.js';

const POLL_INTERVAL_MS = 2000;   // how often to poll DB for missed jobs
const MAX_CONCURRENT   = 3;      // max parallel jobs across all queues

// ── Global processor registry ─────────────────────────────────────────────────
const processors = new Map();    // queueName → async fn(job) => result

// ── In-memory queue (fast path) ───────────────────────────────────────────────
const memQueue = [];             // [{ dbId, queueName, jobName, payload, attempts, maxAttempts }]
let running = 0;
let pollTimer = null;

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Register a processor for a queue.
 * Must be called at app startup before jobs are enqueued.
 */
export function registerProcessor(queueName, processorFn) {
  processors.set(queueName, processorFn);
}

/**
 * Enqueue a job. Persists to DB first, then pushes to in-memory queue.
 * Returns the persisted job record.
 */
export async function enqueue(queueName, jobName, payload = {}, opts = {}) {
  const {
    priority    = 5,
    maxAttempts = 3,
    scheduledAt = new Date(),
    createdBy   = null,
  } = opts;

  const job = await prisma.background_jobs.create({
    data: {
      queue_name:   queueName,
      job_name:     jobName,
      status:       'pending',
      payload,
      priority,
      max_attempts: maxAttempts,
      scheduled_at: scheduledAt,
      created_by:   createdBy,
    }
  });

  // Push to in-memory queue immediately if not scheduled for later
  if (scheduledAt <= new Date()) {
    memQueue.push({ dbId: job.id, queueName, jobName, payload, attempts: 0, maxAttempts });
    scheduleProcessing();
  }

  return job;
}

/**
 * Cancel a pending job.
 */
export async function cancel(jobId) {
  return prisma.background_jobs.updateMany({
    where: { id: jobId, status: 'pending' },
    data:  { status: 'cancelled', updated_at: new Date() }
  });
}

/**
 * Get job status from DB.
 */
export async function getJob(jobId) {
  return prisma.background_jobs.findUnique({ where: { id: jobId } });
}

/**
 * List jobs with filters.
 */
export async function listJobs({ queueName, status, page = 1, limit = 20 } = {}) {
  const where = {
    ...(queueName && { queue_name: queueName }),
    ...(status    && { status }),
  };
  const [jobs, total] = await Promise.all([
    prisma.background_jobs.findMany({
      where,
      orderBy: [{ priority: 'asc' }, { scheduled_at: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.background_jobs.count({ where }),
  ]);
  return { jobs, total, page, limit, total_pages: Math.ceil(total / limit) };
}

// ── Internal processing ───────────────────────────────────────────────────────

function scheduleProcessing() {
  if (running < MAX_CONCURRENT && memQueue.length > 0) {
    processNext();
  }
}

async function processNext() {
  if (memQueue.length === 0 || running >= MAX_CONCURRENT) return;

  const item = memQueue.shift();
  if (!item) return;

  running++;

  try {
    // Mark as running in DB
    await prisma.background_jobs.update({
      where: { id: item.dbId },
      data:  { status: 'running', started_at: new Date(), attempts: { increment: 1 } }
    }).catch(() => {});

    const processor = processors.get(item.queueName);
    if (!processor) throw new Error(`No processor registered for queue: ${item.queueName}`);

    const result = await processor({ id: item.dbId, name: item.jobName, data: item.payload });

    // Mark completed
    await prisma.background_jobs.update({
      where: { id: item.dbId },
      data:  { status: 'completed', result: result || {}, completed_at: new Date() }
    }).catch(() => {});

    console.log(`[queue] Job ${item.dbId} (${item.queueName}/${item.jobName}) completed`);
  } catch (err) {
    console.error(`[queue] Job ${item.dbId} failed:`, err.message);

    const attempts = item.attempts + 1;
    const shouldRetry = attempts < item.maxAttempts;

    await prisma.background_jobs.update({
      where: { id: item.dbId },
      data: {
        status:        shouldRetry ? 'pending' : 'failed',
        error_message: err.message,
        completed_at:  shouldRetry ? null : new Date(),
      }
    }).catch(() => {});

    if (shouldRetry) {
      // Exponential backoff: 5s, 30s, 3min
      const delayMs = Math.min(5000 * Math.pow(6, attempts - 1), 180000);
      setTimeout(() => {
        memQueue.push({ ...item, attempts });
        scheduleProcessing();
      }, delayMs);
    }
  } finally {
    running--;
    scheduleProcessing();
  }
}

/**
 * On startup: recover unfinished jobs from DB into memory queue.
 * Also starts the polling loop for scheduled future jobs.
 */
export async function startQueue() {
  try {
    // Recover stuck 'running' jobs → reset to pending
    await prisma.background_jobs.updateMany({
      where:  { status: 'running' },
      data:   { status: 'pending', started_at: null }
    });

    // Load pending + due jobs into memory
    const pending = await prisma.background_jobs.findMany({
      where:  { status: 'pending', scheduled_at: { lte: new Date() } },
      orderBy: [{ priority: 'asc' }, { scheduled_at: 'asc' }],
      take:   50
    });

    for (const job of pending) {
      memQueue.push({
        dbId:        job.id,
        queueName:   job.queue_name,
        jobName:     job.job_name,
        payload:     job.payload,
        attempts:    job.attempts,
        maxAttempts: job.max_attempts,
      });
    }

    if (pending.length > 0) {
      console.log(`[queue] Recovered ${pending.length} pending jobs`);
      scheduleProcessing();
    }

    // Poll DB every 2s for newly scheduled jobs not yet in memory
    pollTimer = setInterval(async () => {
      try {
        const due = await prisma.background_jobs.findMany({
          where: {
            status:       'pending',
            scheduled_at: { lte: new Date() },
            id:           { notIn: memQueue.map(j => j.dbId) }
          },
          orderBy: [{ priority: 'asc' }, { scheduled_at: 'asc' }],
          take: 20
        });
        for (const job of due) {
          memQueue.push({
            dbId:        job.id,
            queueName:   job.queue_name,
            jobName:     job.job_name,
            payload:     job.payload,
            attempts:    job.attempts,
            maxAttempts: job.max_attempts,
          });
        }
        if (due.length > 0) scheduleProcessing();
      } catch (e) {
        // DB might not be available yet — ignore poll errors
      }
    }, POLL_INTERVAL_MS);

    console.log('[queue] Background job queue started');
  } catch (err) {
    console.error('[queue] Failed to start queue:', err.message);
  }
}

export function stopQueue() {
  if (pollTimer) clearInterval(pollTimer);
  console.log('[queue] Background job queue stopped');
}

// ── Legacy MemoryQueue class (kept for backward compatibility) ─────────────────
export class MemoryQueue {
  constructor(name, processor) {
    this.name = name;
    registerProcessor(name, processor);
  }

  async add(jobName, data) {
    return enqueue(this.name, jobName, data);
  }
}

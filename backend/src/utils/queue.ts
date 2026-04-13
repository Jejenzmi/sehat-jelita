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
import { Prisma } from '@prisma/client';

const POLL_INTERVAL_MS = 2000;   // how often to poll DB for missed jobs
const MAX_CONCURRENT = 3;      // max parallel jobs across all queues

// -- Global processor registry --
const processors = new Map<string, (job: QueueJob) => Promise<any>>();    // queueName -> async fn(job) => result

// -- In-memory queue (fast path) --
interface MemoryQueueItem {
  dbId: string;
  queueName: string;
  jobName: string;
  payload: Record<string, unknown>;
  attempts: number;
  maxAttempts: number;
}

const memQueue: MemoryQueueItem[] = [];
let running = 0;
let pollTimer: NodeJS.Timeout | null = null;

export interface QueueJob {
  id: string;
  name: string;
  data: Record<string, unknown>;
}

export interface EnqueueOptions {
  priority?: number;
  maxAttempts?: number;
  scheduledAt?: Date;
  createdBy?: string | null;
}

export interface ListJobsOptions {
  queueName?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface ListJobsResult {
  jobs: any[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// -- Public API --

/**
 * Register a processor for a queue.
 * Must be called at app startup before jobs are enqueued.
 */
export function registerProcessor(queueName: string, processorFn: (job: QueueJob) => Promise<any>): void {
  processors.set(queueName, processorFn);
}

/**
 * Enqueue a job. Persists to DB first, then pushes to in-memory queue.
 * Returns the persisted job record.
 */
export async function enqueue(
  queueName: string,
  jobName: string,
  payload: Record<string, unknown> = {},
  opts: EnqueueOptions = {}
): Promise<any> {
  const {
    priority = 5,
    maxAttempts = 3,
    scheduledAt = new Date(),
    createdBy = null,
  } = opts;

  const job = await prisma.background_jobs.create({
    data: {
      queue_name: queueName,
      job_name: jobName,
      status: 'pending',
      payload: payload as unknown as Prisma.InputJsonValue,
      priority,
      max_attempts: maxAttempts,
      scheduled_at: scheduledAt,
      created_by: createdBy,
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
export async function cancel(jobId: string): Promise<any> {
  return prisma.background_jobs.updateMany({
    where: { id: jobId, status: 'pending' },
    data: { status: 'cancelled', updated_at: new Date() }
  });
}

/**
 * Get job status from DB.
 */
export async function getJob(jobId: string): Promise<any> {
  return prisma.background_jobs.findUnique({ where: { id: jobId } });
}

/**
 * List jobs with filters.
 */
export async function listJobs({ queueName, status, page = 1, limit = 20 }: ListJobsOptions = {}): Promise<ListJobsResult> {
  const where: Record<string, unknown> = {
    ...(queueName && { queue_name: queueName }),
    ...(status && { status }),
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

// -- Internal processing --

function scheduleProcessing(): void {
  if (running < MAX_CONCURRENT && memQueue.length > 0) {
    processNext();
  }
}

async function processNext(): Promise<void> {
  if (memQueue.length === 0 || running >= MAX_CONCURRENT) return;

  const item = memQueue.shift();
  if (!item) return;

  running++;

  try {
    // Mark as running in DB
    await prisma.background_jobs.update({
      where: { id: item.dbId },
      data: { status: 'running', started_at: new Date(), attempts: { increment: 1 } }
    }).catch(() => { });

    const processor = processors.get(item.queueName);
    if (!processor) throw new Error(`No processor registered for queue: ${item.queueName}`);

    const result = await processor({ id: item.dbId, name: item.jobName, data: item.payload });

    // Mark completed
    await prisma.background_jobs.update({
      where: { id: item.dbId },
      data: { status: 'completed', result: result || {}, completed_at: new Date() }
    }).catch(() => { });

    console.log(`[queue] Job ${item.dbId} (${item.queueName}/${item.jobName}) completed`);
  } catch (err) {
    console.error(`[queue] Job ${item.dbId} failed:`, (err as Error).message);

    const attempts = item.attempts + 1;
    const shouldRetry = attempts < item.maxAttempts;

    await prisma.background_jobs.update({
      where: { id: item.dbId },
      data: {
        status: shouldRetry ? 'pending' : 'failed',
        error_message: (err as Error).message,
        completed_at: shouldRetry ? null : new Date(),
      }
    }).catch(() => { });

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
export async function startQueue(): Promise<void> {
  try {
    // Recover stuck 'running' jobs -> reset to pending
    await prisma.background_jobs.updateMany({
      where: { status: 'running' },
      data: { status: 'pending', started_at: null }
    });

    // Load pending + due jobs into memory
    const pending = await prisma.background_jobs.findMany({
      where: { status: 'pending', scheduled_at: { lte: new Date() } },
      orderBy: [{ priority: 'asc' }, { scheduled_at: 'asc' }],
      take: 50
    });

    for (const job of pending) {
      memQueue.push({
        dbId: job.id,
        queueName: job.queue_name,
        jobName: job.job_name,
        payload: job.payload as Record<string, unknown>,
        attempts: job.attempts,
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
            status: 'pending',
            scheduled_at: { lte: new Date() },
            id: { notIn: memQueue.map(j => j.dbId) }
          },
          orderBy: [{ priority: 'asc' }, { scheduled_at: 'asc' }],
          take: 20
        });
        for (const job of due) {
          memQueue.push({
            dbId: job.id,
            queueName: job.queue_name,
            jobName: job.job_name,
            payload: job.payload as Record<string, unknown>,
            attempts: job.attempts,
            maxAttempts: job.max_attempts,
          });
        }
        if (due.length > 0) scheduleProcessing();
      } catch {
        // DB might not be available yet -- ignore poll errors
      }
    }, POLL_INTERVAL_MS);

    console.log('[queue] Background job queue started');
  } catch (err) {
    console.error('[queue] Failed to start queue:', (err as Error).message);
  }
}

export function stopQueue(): void {
  if (pollTimer) clearInterval(pollTimer);
  console.log('[queue] Background job queue stopped');
}

// -- Legacy MemoryQueue class (kept for backward compatibility) --
export class MemoryQueue {
  name: string;

  constructor(name: string, processor: (job: QueueJob) => Promise<any>) {
    this.name = name;
    registerProcessor(name, processor);
  }

  async add(jobName: string, data: Record<string, unknown>): Promise<any> {
    return enqueue(this.name, jobName, data);
  }
}

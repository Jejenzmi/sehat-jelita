/**
 * SIMRS ZEN - Background Jobs API
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireRole } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { enqueue, cancel, getJob, listJobs } from '../utils/queue.js';
import { triggerReport } from '../services/scheduler.js';

const router = Router();

interface JobsQuery {
  queue_name?: string;
  status?: string;
  page?: string;
  limit?: string;
}

interface ReportTypeQuery {
  reportType: string;
}

interface PruneQuery {
  days?: string;
}

const submitSchema = z.object({
  queue_name: z.string().min(1),
  job_name: z.string().min(1),
  payload: z.record(z.unknown()).optional().default({}),
  priority: z.number().int().min(1).max(10).optional().default(5),
  max_attempts: z.number().int().min(1).max(10).optional().default(3),
  scheduled_at: z.string().datetime().optional(),
});

interface SubmitBody extends z.infer<typeof submitSchema> { }

// GET /api/jobs
router.get('/', requireRole(['admin', 'it']), asyncHandler(async (req: Request<Record<string, string>, any, any, JobsQuery>, res: Response) => {
  const { queue_name, status, page = '1', limit = '20' } = req.query;
  const result = await listJobs({
    queueName: queue_name,
    status,
    page: parseInt(page),
    limit: parseInt(limit),
  });
  res.json({ success: true, ...result });
}));

// GET /api/jobs/queues
router.get('/queues', requireRole(['admin', 'it']), asyncHandler(async (_req: Request, res: Response) => {
  const { prisma } = await import('../config/database.js');
  const summary = await prisma.background_jobs.groupBy({
    by: ['queue_name', 'status'],
    _count: true,
    orderBy: { queue_name: 'asc' }
  });

  const result: Record<string, Record<string, number>> = {};
  for (const row of summary) {
    if (!result[row.queue_name]) result[row.queue_name] = {};
    result[row.queue_name][row.status] = row._count;
  }

  res.json({ success: true, data: result });
}));

// GET /api/jobs/:id
router.get('/:id', requireRole(['admin', 'it']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const job = await getJob(req.params.id);
  if (!job) throw new ApiError(404, 'Job tidak ditemukan', 'JOB_NOT_FOUND');
  res.json({ success: true, data: job });
}));

// POST /api/jobs
router.post('/', requireRole(['admin', 'it']), asyncHandler(async (req: Request<Record<string, string>, any, SubmitBody>, res: Response) => {
  const { queue_name, job_name, payload, priority, max_attempts, scheduled_at } = submitSchema.parse(req.body);

  const job = await enqueue(queue_name, job_name, payload, {
    priority,
    maxAttempts: max_attempts,
    scheduledAt: scheduled_at ? new Date(scheduled_at) : new Date(),
    createdBy: (req.user as Record<string, string>).id,
  });

  res.status(202).json({
    success: true,
    message: 'Job berhasil diantrekan',
    data: job
  });
}));

// POST /api/jobs/reports/:reportType
router.post('/reports/:reportType', requireRole(['admin', 'manajemen', 'it', 'keuangan']), asyncHandler(async (req: Request<ReportTypeQuery>, res: Response) => {
  const { reportType } = req.params;
  const params = req.body || {};

  const job = await triggerReport(reportType, params);

  res.status(202).json({
    success: true,
    message: `Report "${reportType}" berhasil dijadwalkan`,
    data: job
  });
}));

// POST /api/jobs/:id/cancel
router.post('/:id/cancel', requireRole(['admin', 'it']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const result = await cancel(req.params.id);
  if (!(result as { count: number }).count) throw new ApiError(400, 'Job tidak bisa dibatalkan (mungkin sudah selesai atau tidak ada)', 'CANCEL_FAILED');
  res.json({ success: true, message: 'Job berhasil dibatalkan' });
}));

// POST /api/jobs/:id/retry
router.post('/:id/retry', requireRole(['admin', 'it']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { prisma } = await import('../config/database.js');
  const { enqueue: enqueueFn } = await import('../utils/queue.js');

  const job = await prisma.background_jobs.findUnique({ where: { id: req.params.id } });
  if (!job) throw new ApiError(404, 'Job tidak ditemukan', 'JOB_NOT_FOUND');
  if (job.status !== 'failed' && job.status !== 'cancelled') {
    throw new ApiError(400, 'Hanya job dengan status failed atau cancelled yang bisa di-retry', 'INVALID_STATE');
  }

  const newJob = await enqueueFn(job.queue_name, job.job_name, job.payload as Record<string, unknown>, {
    priority: job.priority,
    maxAttempts: job.max_attempts,
    createdBy: (req.user as Record<string, string>).id,
  });

  res.status(202).json({ success: true, message: 'Job berhasil di-retry', data: newJob });
}));

// DELETE /api/jobs/completed
router.delete('/completed', requireRole(['admin']), asyncHandler(async (req: Request<Record<string, string>, any, any, PruneQuery>, res: Response) => {
  const { prisma } = await import('../config/database.js');
  const { days = '7' } = req.query;
  const cutoff = new Date(Date.now() - parseInt(days) * 86400000);

  const result = await prisma.background_jobs.deleteMany({
    where: {
      status: { in: ['completed', 'cancelled'] },
      updated_at: { lt: cutoff }
    }
  });

  res.json({ success: true, message: `${result.count} job lama berhasil dihapus`, deleted: result.count });
}));

export default router;

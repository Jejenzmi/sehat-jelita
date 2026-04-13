/**
 * SIMRS ZEN - CSSD Routes
 * Central Sterile Supply Department
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { prisma } from '../config/database.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();
router.use(authenticateToken);

interface BatchQuery {
  status?: string;
  limit?: string;
  page?: string;
}

// STATS
router.get('/stats', asyncHandler(async (_req: Request, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [total, todayBatches, pending, completed] = await Promise.all([
    prisma.cssd_items.count(),
    prisma.cssd_batches.count({ where: { batch_date: { gte: today, lt: tomorrow } } }),
    prisma.cssd_batches.count({ where: { status: { in: ['pending', 'in_process'] } } }),
    prisma.cssd_batches.count({ where: { status: 'completed', batch_date: { gte: today, lt: tomorrow } } }),
  ]);

  const allToday = await prisma.cssd_batches.findMany({
    where: { batch_date: { gte: today, lt: tomorrow } },
    select: { status: true },
  });
  const successRate = allToday.length > 0
    ? Math.round((allToday.filter(b => b.status === 'completed').length / allToday.length) * 100)
    : 0;

  res.json({ success: true, data: { totalItems: total, todayBatches, pending, successRate } });
}));

// BATCHES
router.get('/batches', asyncHandler(async (req: Request<Record<string, string>, any, any, BatchQuery>, res: Response) => {
  const { status, limit = '30', page = '1' } = req.query;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [batches, total] = await Promise.all([
    prisma.cssd_batches.findMany({
      where,
      include: { cssd_items: { select: { id: true, item_name: true, quantity: true, status: true } } },
      orderBy: { batch_date: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
    }),
    prisma.cssd_batches.count({ where }),
  ]);

  res.json({ success: true, data: batches, meta: { total, page: parseInt(page), limit: parseInt(limit) } });
}));

router.post('/batches', asyncHandler(async (req: Request, res: Response) => {
  const { items = [], ...batchData } = req.body;

  const count = await prisma.cssd_batches.count();
  const batchNumber = `CSSD-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

  const batch = await prisma.$transaction(async (tx) => {
    const b = await tx.cssd_batches.create({
      data: {
        ...batchData,
        batch_number: batchNumber,
        batch_date: new Date(),
        item_count: items.length,
      },
    });
    if (items.length > 0) {
      await tx.cssd_items.createMany({
        data: items.map((item: Record<string, unknown>) => ({ ...item, batch_id: b.id })),
      });
    }
    return b;
  });

  res.status(201).json({ success: true, data: batch });
}));

router.put('/batches/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const data: Record<string, unknown> = req.body;
  if (data.status === 'completed') data.completed_at = new Date();

  const batch = await prisma.cssd_batches.update({ where: { id }, data });
  res.json({ success: true, data: batch });
}));

router.get('/batches/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const batch = await prisma.cssd_batches.findUnique({
    where: { id: req.params.id },
    include: { cssd_items: true },
  });
  if (!batch) throw new ApiError(404, 'Batch tidak ditemukan');
  res.json({ success: true, data: batch });
}));

export default router;

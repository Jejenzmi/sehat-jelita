/**
 * SIMRS ZEN - Linen & Laundry Routes
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();

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

  const inventory = await prisma.linen_inventory.aggregate({
    _sum: { total_qty: true, clean_qty: true, in_laundry_qty: true, damaged_qty: true },
  });

  const todayBatches = await prisma.linen_batches.count({
    where: { batch_date: { gte: today, lt: tomorrow } },
  });

  res.json({
    success: true,
    data: {
      totalLinen: inventory._sum.total_qty || 0,
      cleanLinen: inventory._sum.clean_qty || 0,
      inLaundry: inventory._sum.in_laundry_qty || 0,
      damaged: inventory._sum.damaged_qty || 0,
      todayBatches,
    },
  });
}));

// INVENTORY
router.get('/inventory', asyncHandler(async (_req: Request, res: Response) => {
  const items = await prisma.linen_inventory.findMany({
    include: { linen_categories: true },
    orderBy: { item_name: 'asc' },
  });
  res.json({ success: true, data: items });
}));

router.post('/inventory', asyncHandler(async (req: Request, res: Response) => {
  const item = await prisma.linen_inventory.create({ data: req.body });
  res.status(201).json({ success: true, data: item });
}));

router.put('/inventory/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const item = await prisma.linen_inventory.update({
    where: { id: req.params.id },
    data: { ...req.body, last_updated: new Date() },
  });
  res.json({ success: true, data: item });
}));

// BATCHES
router.get('/batches', asyncHandler(async (req: Request<Record<string, string>, any, any, BatchQuery>, res: Response) => {
  const { status, limit = '30', page = '1' } = req.query;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [batches, total] = await Promise.all([
    prisma.linen_batches.findMany({
      where,
      orderBy: { batch_date: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
    }),
    prisma.linen_batches.count({ where }),
  ]);

  res.json({ success: true, data: batches, meta: { total, page: parseInt(page), limit: parseInt(limit) } });
}));

router.post('/batches', asyncHandler(async (req: Request, res: Response) => {
  const count = await prisma.linen_batches.count();
  const batchNumber = `LINEN-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

  const batch = await prisma.linen_batches.create({
    data: { ...req.body, batch_number: batchNumber, batch_date: new Date() },
  });
  res.status(201).json({ success: true, data: batch });
}));

router.put('/batches/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const data: Record<string, unknown> = req.body;
  if (data.status === 'distributed') data.completed_at = new Date();

  const batch = await prisma.linen_batches.update({ where: { id: req.params.id }, data });
  res.json({ success: true, data: batch });
}));

// CATEGORIES
router.get('/categories', asyncHandler(async (_req: Request, res: Response) => {
  const categories = await prisma.linen_categories.findMany({ orderBy: { category_name: 'asc' } });
  res.json({ success: true, data: categories });
}));

router.post('/categories', asyncHandler(async (req: Request, res: Response) => {
  const cat = await prisma.linen_categories.create({ data: req.body });
  res.status(201).json({ success: true, data: cat });
}));

export default router;

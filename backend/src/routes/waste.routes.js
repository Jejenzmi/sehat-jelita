/**
 * SIMRS ZEN - Waste Management Routes
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { prisma } from '../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();
router.use(authenticateToken);

// ─── STATS ────────────────────────────────────────────────────────────────────

router.get('/stats', asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayAgg, b3Agg, pendingCount, totalCount] = await Promise.all([
    prisma.waste_records.aggregate({
      where: { record_date: { gte: today, lt: tomorrow } },
      _sum: { weight_kg: true },
    }),
    prisma.waste_records.aggregate({
      where: { record_date: { gte: today, lt: tomorrow }, waste_type: 'b3' },
      _sum: { weight_kg: true },
    }),
    prisma.waste_records.count({
      where: { status: { in: ['collected', 'stored'] } },
    }),
    prisma.waste_records.count({
      where: { record_date: { gte: today, lt: tomorrow } },
    }),
  ]);

  const disposed = await prisma.waste_records.count({
    where: { record_date: { gte: today, lt: tomorrow }, status: 'disposed' },
  });
  const compliance = totalCount > 0 ? Math.round((disposed / totalCount) * 100) : 100;

  res.json({
    success: true,
    data: {
      todayWeight:  Number(todayAgg._sum.weight_kg || 0),
      b3Weight:     Number(b3Agg._sum.weight_kg   || 0),
      pendingPickup: pendingCount,
      compliance,
    },
  });
}));

// ─── RECORDS ──────────────────────────────────────────────────────────────────

router.get('/records', asyncHandler(async (req, res) => {
  const { waste_type, status, start_date, end_date, limit = '30', page = '1' } = req.query;
  const where = {};
  if (waste_type) where.waste_type = waste_type;
  if (status)     where.status     = status;
  if (start_date || end_date) {
    where.record_date = {};
    if (start_date) where.record_date.gte = new Date(start_date);
    if (end_date)   where.record_date.lte = new Date(end_date);
  }

  const [records, total] = await Promise.all([
    prisma.waste_records.findMany({
      where,
      orderBy: { record_date: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
    }),
    prisma.waste_records.count({ where }),
  ]);

  res.json({ success: true, data: records, meta: { total, page: parseInt(page), limit: parseInt(limit) } });
}));

router.post('/records', asyncHandler(async (req, res) => {
  const record = await prisma.waste_records.create({
    data: { ...req.body, record_date: new Date() },
  });
  res.status(201).json({ success: true, data: record });
}));

router.put('/records/:id', asyncHandler(async (req, res) => {
  const data = req.body;
  if (data.status === 'disposed') data.disposed_at = new Date();
  const record = await prisma.waste_records.update({ where: { id: req.params.id }, data });
  res.json({ success: true, data: record });
}));

// ─── MONTHLY SUMMARY ──────────────────────────────────────────────────────────

router.get('/summary', asyncHandler(async (req, res) => {
  const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;
  const start = new Date(parseInt(year), parseInt(month) - 1, 1);
  const end   = new Date(parseInt(year), parseInt(month), 1);

  const byType = await prisma.waste_records.groupBy({
    by: ['waste_type'],
    where: { record_date: { gte: start, lt: end } },
    _sum: { weight_kg: true },
    _count: { id: true },
  });

  res.json({ success: true, data: byType });
}));

export default router;

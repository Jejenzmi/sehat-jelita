/**
 * ASPAK Routes — Aset & Peralatan RS (Kemenkes)
 * Input validation via Zod
 */
import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { prisma } from '../config/database.js';

const router = Router();
router.use(authenticateToken);

// ── Zod Schemas ───────────────────────────────────────────────────────────────

const AssetSchema = z.object({
  asset_code:          z.string().min(1).max(50),
  asset_name:          z.string().min(1).max(200),
  asset_category:      z.string().min(1),
  asset_type:          z.string().optional(),
  brand:               z.string().optional(),
  model:               z.string().optional(),
  serial_number:       z.string().optional(),
  year_of_purchase:    z.coerce.number().int().min(1900).max(2100).optional().nullable(),
  purchase_price:      z.coerce.number().min(0).optional().nullable(),
  current_condition:   z.enum(['baik', 'rusak_ringan', 'rusak_berat', 'tidak_layak']).default('baik'),
  department_id:       z.string().uuid().optional().nullable(),
  room_location:       z.string().optional(),
  quantity:            z.coerce.number().int().min(1).default(1),
  unit:                z.string().default('unit'),
  last_maintenance_at: z.string().datetime({ offset: true }).optional().nullable(),
  next_maintenance_at: z.string().datetime({ offset: true }).optional().nullable(),
  kemenkes_code:       z.string().optional(),
  notes:               z.string().optional(),
});

const AssetUpdateSchema = AssetSchema.partial().extend({
  is_active: z.boolean().optional(),
});

const ReportSchema = z.object({
  report_period: z.string().regex(/^\d{4}-\d{2}$/, 'Format YYYY-MM'),
  notes:         z.string().optional(),
});

// ── Helper: parse date safely ─────────────────────────────────────────────────
const toDate = (s) => (s ? new Date(s) : null);

// ── ASSETS ───────────────────────────────────────────────────────────────────

router.get('/assets', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, category, condition, department_id, search, maintenance_due } = req.query;
  const take = Math.min(Number(limit), 100);
  const skip = (Number(page) - 1) * take;

  const where = { is_active: true };
  if (category)      where.asset_category = category;
  if (condition)     where.current_condition = condition;
  if (department_id) where.department_id = department_id;
  if (search)        where.OR = [
    { asset_name:    { contains: search, mode: 'insensitive' } },
    { asset_code:    { contains: search, mode: 'insensitive' } },
    { kemenkes_code: { contains: search, mode: 'insensitive' } },
  ];
  if (maintenance_due === 'true') {
    where.next_maintenance_at = { lte: new Date(Date.now() + 30 * 86400000) };
  }

  const [assets, total] = await Promise.all([
    prisma.aspak_assets.findMany({
      where, skip, take,
      orderBy: { asset_name: 'asc' },
      include: { departments: { select: { department_name: true } } },
    }),
    prisma.aspak_assets.count({ where }),
  ]);

  res.json({ success: true, data: assets, meta: { total, page: Number(page), limit: take } });
}));

router.get('/assets/:id', asyncHandler(async (req, res) => {
  const asset = await prisma.aspak_assets.findUnique({
    where: { id: req.params.id },
    include: { departments: { select: { department_name: true } } },
  });
  if (!asset) throw new ApiError(404, 'Aset tidak ditemukan');
  res.json({ success: true, data: asset });
}));

router.post('/assets', requireRole(['admin', 'manajemen']), asyncHandler(async (req, res) => {
  const body = AssetSchema.parse(req.body);

  const asset = await prisma.aspak_assets.create({
    data: {
      ...body,
      last_maintenance_at: toDate(body.last_maintenance_at),
      next_maintenance_at: toDate(body.next_maintenance_at),
    },
  });

  res.status(201).json({ success: true, data: asset });
}));

router.put('/assets/:id', requireRole(['admin', 'manajemen']), asyncHandler(async (req, res) => {
  const body = AssetUpdateSchema.parse(req.body);

  const asset = await prisma.aspak_assets.update({
    where: { id: req.params.id },
    data: {
      ...body,
      last_maintenance_at: body.last_maintenance_at !== undefined ? toDate(body.last_maintenance_at) : undefined,
      next_maintenance_at: body.next_maintenance_at !== undefined ? toDate(body.next_maintenance_at) : undefined,
      updated_at: new Date(),
    },
  });

  res.json({ success: true, data: asset });
}));

router.delete('/assets/:id', requireRole(['admin']), asyncHandler(async (req, res) => {
  await prisma.aspak_assets.update({
    where: { id: req.params.id },
    data: { is_active: false, updated_at: new Date() },
  });
  res.json({ success: true, message: 'Aset dinonaktifkan' });
}));

// ── SUMMARY ───────────────────────────────────────────────────────────────────

router.get('/summary', asyncHandler(async (req, res) => {
  const [totalAssets, byCategory, maintenanceDue, byCondition] = await Promise.all([
    prisma.aspak_assets.count({ where: { is_active: true } }),
    prisma.aspak_assets.groupBy({
      by: ['asset_category'],
      where: { is_active: true },
      _count: { id: true },
      _sum: { purchase_price: true },
    }),
    prisma.aspak_assets.count({
      where: { is_active: true, next_maintenance_at: { lte: new Date(Date.now() + 30 * 86400000) } },
    }),
    prisma.aspak_assets.groupBy({
      by: ['current_condition'],
      where: { is_active: true },
      _count: { id: true },
    }),
  ]);

  res.json({ success: true, data: { totalAssets, byCategory, maintenanceDue, byCondition } });
}));

// ── REPORTS ───────────────────────────────────────────────────────────────────

router.get('/reports', asyncHandler(async (req, res) => {
  const reports = await prisma.aspak_reports.findMany({
    orderBy: { report_period: 'desc' },
    take: 24,
  });
  res.json({ success: true, data: reports });
}));

router.post('/reports', requireRole(['admin', 'manajemen']), asyncHandler(async (req, res) => {
  const { report_period, notes } = ReportSchema.parse(req.body);

  const assets = await prisma.aspak_assets.findMany({
    where: { is_active: true },
    include: { departments: { select: { department_name: true } } },
  });

  const summary = { total: assets.length, by_category: {}, by_condition: {}, total_value: 0 };
  for (const a of assets) {
    const cat  = a.asset_category   || 'lainnya';
    const cond = a.current_condition || 'baik';
    summary.by_category[cat]   = (summary.by_category[cat]   || 0) + 1;
    summary.by_condition[cond] = (summary.by_condition[cond] || 0) + 1;
    summary.total_value += Number(a.purchase_price || 0);
  }

  const report = await prisma.aspak_reports.create({
    data: {
      report_period,
      report_type: 'monthly',
      status: 'draft',
      data_snapshot: { summary, generated_at: new Date().toISOString() },
      notes,
    },
  });

  res.status(201).json({ success: true, data: report });
}));

router.patch('/reports/:id/submit', requireRole(['admin', 'manajemen']), asyncHandler(async (req, res) => {
  const report = await prisma.aspak_reports.update({
    where: { id: req.params.id },
    data: {
      status: 'submitted',
      submitted_at: new Date(),
      submitted_by: req.user.id,
      updated_at: new Date(),
    },
  });
  res.json({ success: true, data: report });
}));

export default router;

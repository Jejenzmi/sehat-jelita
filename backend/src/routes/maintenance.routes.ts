/**
 * SIMRS ZEN - Maintenance & Asset Management Routes
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { prisma } from '../config/database.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();
router.use(authenticateToken);

interface AssetsQuery {
  status?: string;
  category?: string;
  department_id?: string;
  limit?: string;
  page?: string;
}

interface RequestsQuery {
  status?: string;
  priority?: string;
  asset_id?: string;
  limit?: string;
  page?: string;
}

// STATS
router.get('/stats', asyncHandler(async (_req: Request, res: Response) => {
  const [totalAssets, needRepair, scheduledThisWeek, operational] = await Promise.all([
    prisma.maintenance_assets.count(),
    prisma.maintenance_requests.count({ where: { status: { in: ['open', 'in_progress'] } } }),
    prisma.maintenance_requests.count({
      where: {
        request_type: 'preventive',
        status: 'open',
        scheduled_date: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.maintenance_assets.count({ where: { status: 'operational' } }),
  ]);

  const uptime = totalAssets > 0 ? Math.round((operational / totalAssets) * 100) : 100;

  res.json({
    success: true,
    data: { totalAssets, needRepair, scheduledThisWeek, uptime },
  });
}));

// ASSETS
router.get('/assets', asyncHandler(async (req: Request<Record<string, string>, any, any, AssetsQuery>, res: Response) => {
  const { status, category, department_id, limit = '50', page = '1' } = req.query;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (category) where.asset_category = category;
  if (department_id) where.department_id = department_id;

  const [assets, total] = await Promise.all([
    prisma.maintenance_assets.findMany({
      where,
      include: {
        maintenance_requests: {
          where: { status: { in: ['open', 'in_progress'] } },
          select: { id: true, priority: true, title: true },
        },
      },
      orderBy: { asset_name: 'asc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
    }),
    prisma.maintenance_assets.count({ where }),
  ]);

  res.json({ success: true, data: assets, meta: { total, page: parseInt(page), limit: parseInt(limit) } });
}));

router.post('/assets', asyncHandler(async (req: Request, res: Response) => {
  const count = await prisma.maintenance_assets.count();
  const assetCode = req.body.asset_code || `ASSET-${String(count + 1).padStart(5, '0')}`;

  const asset = await prisma.maintenance_assets.create({
    data: { ...req.body, asset_code: assetCode },
  });
  res.status(201).json({ success: true, data: asset });
}));

router.get('/assets/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const asset = await prisma.maintenance_assets.findUnique({
    where: { id: req.params.id },
    include: {
      maintenance_requests: { orderBy: { created_at: 'desc' }, take: 10 },
    },
  });
  if (!asset) throw new ApiError(404, 'Aset tidak ditemukan');
  res.json({ success: true, data: asset });
}));

router.put('/assets/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const asset = await prisma.maintenance_assets.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json({ success: true, data: asset });
}));

// REQUESTS
router.get('/requests', asyncHandler(async (req: Request<Record<string, string>, any, any, RequestsQuery>, res: Response) => {
  const { status, priority, asset_id, limit = '30', page = '1' } = req.query;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (asset_id) where.asset_id = asset_id;

  const [requests, total] = await Promise.all([
    prisma.maintenance_requests.findMany({
      where,
      include: {
        maintenance_assets: { select: { id: true, asset_name: true, asset_code: true, location: true } },
      },
      orderBy: [{ priority: 'desc' }, { created_at: 'desc' }],
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
    }),
    prisma.maintenance_requests.count({ where }),
  ]);

  res.json({ success: true, data: requests, meta: { total, page: parseInt(page), limit: parseInt(limit) } });
}));

router.post('/requests', asyncHandler(async (req: Request, res: Response) => {
  const count = await prisma.maintenance_requests.count();
  const requestNumber = `WO-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

  const request = await prisma.maintenance_requests.create({
    data: { ...req.body, request_number: requestNumber },
    include: { maintenance_assets: { select: { asset_name: true, asset_code: true } } },
  });

  if (req.body.asset_id && req.body.request_type === 'corrective') {
    await prisma.maintenance_assets.update({
      where: { id: req.body.asset_id },
      data: { status: 'repair' },
    });
  }

  res.status(201).json({ success: true, data: request });
}));

router.put('/requests/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const data: Record<string, unknown> = req.body;
  if (data.status === 'in_progress') data.started_at = new Date();
  if (data.status === 'completed') data.completed_at = new Date();

  const request = await prisma.maintenance_requests.update({
    where: { id: req.params.id },
    data,
    include: { maintenance_assets: { select: { id: true, asset_name: true } } },
  });

  if (data.status === 'completed' && request.asset_id) {
    await prisma.maintenance_assets.update({
      where: { id: request.asset_id },
      data: { status: 'operational', last_service_date: new Date() },
    });
  }

  res.json({ success: true, data: request });
}));

export default router;

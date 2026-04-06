/**
 * SIMRS ZEN - Vendor / Supplier Routes
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { prisma } from '../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();
router.use(authenticateToken);

// ─── Stats ────────────────────────────────────────────────────────────────────

router.get('/stats', asyncHandler(async (_req, res) => {
  const [total, active, contractActive] = await Promise.all([
    prisma.vendors.count().catch(() => 0),
    prisma.vendors.count({ where: { is_active: true } }).catch(() => 0),
    prisma.vendor_contracts.count({ where: { status: 'active' } }).catch(() => 0),
  ]);

  // Average rating
  const ratingAgg = await prisma.vendors.aggregate({
    _avg: { rating: true },
    where: { is_active: true, rating: { not: null } },
  }).catch(() => ({ _avg: { rating: null } }));

  res.json({
    success: true,
    data: {
      total_vendors:       total,
      active_vendors:      active,
      active_contracts:    contractActive,
      average_rating:      ratingAgg._avg.rating ? parseFloat(ratingAgg._avg.rating.toFixed(1)) : 0,
    },
  });
}));

// ─── Vendors CRUD ─────────────────────────────────────────────────────────────

router.get('/', asyncHandler(async (req, res) => {
  const { search, category, is_active, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (search)    where.OR = [
    { vendor_name: { contains: search, mode: 'insensitive' } },
    { vendor_code: { contains: search, mode: 'insensitive' } },
    { contact_person: { contains: search, mode: 'insensitive' } },
  ];
  if (category)  where.category = category;
  if (is_active !== undefined) where.is_active = is_active === 'true';

  const [total, vendors] = await Promise.all([
    prisma.vendors.count({ where }).catch(() => 0),
    prisma.vendors.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { vendor_name: 'asc' },
      include: {
        vendor_contracts: {
          where: { status: 'active' },
          select: { id: true, contract_number: true, end_date: true },
          orderBy: { end_date: 'desc' },
          take: 1,
        },
      },
    }).catch(() => []),
  ]);

  res.json({ success: true, data: vendors, total, page: parseInt(page), limit: parseInt(limit) });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const vendor = await prisma.vendors.findUnique({
    where: { id: req.params.id },
    include: {
      vendor_contracts: { orderBy: { created_at: 'desc' } },
    },
  });
  if (!vendor) return res.status(404).json({ success: false, error: 'Vendor tidak ditemukan' });
  res.json({ success: true, data: vendor });
}));

router.post('/', requireRole(['admin', 'pengadaan']), asyncHandler(async (req, res) => {
  const vendor = await prisma.vendors.create({ data: req.body });
  res.status(201).json({ success: true, data: vendor });
}));

router.put('/:id', requireRole(['admin', 'pengadaan']), asyncHandler(async (req, res) => {
  const vendor = await prisma.vendors.update({
    where: { id: req.params.id },
    data: { ...req.body, updated_at: new Date() },
  });
  res.json({ success: true, data: vendor });
}));

router.delete('/:id', requireRole(['admin', 'pengadaan']), asyncHandler(async (req, res) => {
  await prisma.vendors.update({
    where: { id: req.params.id },
    data: { is_active: false, updated_at: new Date() },
  });
  res.json({ success: true, data: { id: req.params.id } });
}));

// ─── Contracts ────────────────────────────────────────────────────────────────

router.get('/contracts/list', asyncHandler(async (req, res) => {
  const { vendor_id, status } = req.query;
  const where = {};
  if (vendor_id) where.vendor_id = vendor_id;
  if (status)    where.status = status;

  const contracts = await prisma.vendor_contracts.findMany({
    where,
    orderBy: { created_at: 'desc' },
    include: { vendors: { select: { id: true, vendor_name: true, vendor_code: true } } },
  }).catch(() => []);

  res.json({ success: true, data: contracts });
}));

router.post('/contracts', requireRole(['admin', 'pengadaan']), asyncHandler(async (req, res) => {
  const contract = await prisma.vendor_contracts.create({ data: req.body });
  res.status(201).json({ success: true, data: contract });
}));

router.put('/contracts/:id', requireRole(['admin', 'pengadaan']), asyncHandler(async (req, res) => {
  const contract = await prisma.vendor_contracts.update({
    where: { id: req.params.id },
    data: { ...req.body, updated_at: new Date() },
  });
  res.json({ success: true, data: contract });
}));

export default router;

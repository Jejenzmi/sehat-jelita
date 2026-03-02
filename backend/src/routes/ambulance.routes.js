/**
 * SIMRS ZEN - Ambulance Routes
 * Manages ambulance fleet and dispatch operations
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { requireRole } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();

const fleetSchema = z.object({
  ambulance_code: z.string().max(20),
  plate_number: z.string().max(20),
  ambulance_type: z.string().max(50).optional(),
  status: z.string().max(50).optional(),
  driver_name: z.string().max(100).optional().nullable(),
  crew_names: z.string().optional().nullable(),
  equipment_status: z.string().optional().nullable(),
  last_service_date: z.string().optional().nullable(),
  next_service_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const dispatchSchema = z.object({
  ambulance_id: z.string().uuid().optional().nullable(),
  patient_info: z.string(),
  pickup_location: z.string(),
  destination: z.string(),
  priority: z.string().max(50).optional(),
  status: z.string().max(50).optional(),
  caller_name: z.string().max(100).optional().nullable(),
  caller_phone: z.string().max(20).optional().nullable(),
  request_time: z.string().optional(),
  notes: z.string().optional().nullable(),
});
// ============================================
// FLEET
// ============================================

/**
 * GET /api/ambulance/fleet
 */
router.get('/fleet', asyncHandler(async (req, res) => {
  const { status, search } = req.query;

  const where = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { ambulance_code: { contains: search, mode: 'insensitive' } },
      { plate_number: { contains: search, mode: 'insensitive' } },
    ];
  }

  const fleet = await prisma.ambulance_fleet.findMany({
    where,
    orderBy: { ambulance_code: 'asc' },
  });

  res.json({ success: true, data: fleet });
}));

/**
 * POST /api/ambulance/fleet
 */
router.post('/fleet', requireRole(['admin']), asyncHandler(async (req, res) => {
  const data = fleetSchema.parse(req.body);
  const ambulance = await prisma.ambulance_fleet.create({ data });
  res.status(201).json({ success: true, data: ambulance });
}));

/**
 * PUT /api/ambulance/fleet/:id
 */
router.put('/fleet/:id', requireRole(['admin']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = fleetSchema.partial().parse(req.body);
  const ambulance = await prisma.ambulance_fleet.update({ where: { id }, data });
  res.json({ success: true, data: ambulance });
}));

// ============================================
// DISPATCHES
// ============================================

/**
 * GET /api/ambulance/dispatches
 */
router.get('/dispatches', asyncHandler(async (req, res) => {
  const { status, date_from, date_to, page = 1, limit = 50 } = req.query;

  const where = {};
  if (status) where.status = status;
  if (date_from || date_to) {
    where.request_time = {};
    if (date_from) where.request_time.gte = new Date(date_from);
    if (date_to) where.request_time.lte = new Date(date_to);
  }

  const [total, dispatches] = await Promise.all([
    prisma.ambulance_dispatches.count({ where }),
    prisma.ambulance_dispatches.findMany({
      where,
      include: { ambulance: true },
      orderBy: { request_time: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    }),
  ]);

  res.json({
    success: true,
    data: dispatches,
    pagination: { page: parseInt(page), limit: parseInt(limit), total },
  });
}));

/**
 * POST /api/ambulance/dispatches
 */
router.post('/dispatches', requireRole(['admin', 'registrasi', 'perawat']), asyncHandler(async (req, res) => {
  const data = dispatchSchema.parse(req.body);

  // Auto-generate dispatch number
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const count = await prisma.ambulance_dispatches.count();
  const dispatch_number = `AMB-${dateStr}-${String(count + 1).padStart(4, '0')}`;

  const dispatch = await prisma.ambulance_dispatches.create({ data: { ...data, dispatch_number } });

  // Update ambulance status to on_mission if ambulance assigned
  if (data.ambulance_id) {
    await prisma.ambulance_fleet.update({
      where: { id: data.ambulance_id },
      data: { status: 'on_mission' },
    });
  }

  res.status(201).json({ success: true, data: dispatch });
}));

/**
 * PUT /api/ambulance/dispatches/:id
 */
router.put('/dispatches/:id', requireRole(['admin', 'registrasi', 'perawat']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = dispatchSchema.partial().parse(req.body);

  const dispatch = await prisma.ambulance_dispatches.update({
    where: { id },
    data,
    include: { ambulance: true },
  });

  // If dispatch completed, set ambulance back to available
  if (data.status === 'completed' && dispatch.ambulance_id) {
    await prisma.ambulance_fleet.update({
      where: { id: dispatch.ambulance_id },
      data: { status: 'available' },
    });
  }

  res.json({ success: true, data: dispatch });
}));

// ============================================
// NUMBER GENERATOR
// ============================================

/**
 * GET /api/ambulance/next-dispatch-number
 */
router.get('/next-dispatch-number', asyncHandler(async (req, res) => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const count = await prisma.ambulance_dispatches.count();
  const dispatchNumber = `AMB-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  res.json({ success: true, data: dispatchNumber });
}));

export default router;

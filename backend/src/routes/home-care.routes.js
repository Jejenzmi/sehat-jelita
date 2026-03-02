/**
 * SIMRS ZEN - Home Care Routes
 * Manages home care visit scheduling and management
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { requireRole } from '../middleware/role.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

const visitSchema = z.object({
  patient_id: z.string().uuid().optional().nullable(),
  patient_name: z.string(),
  patient_phone: z.string().max(20).optional().nullable(),
  address: z.string(),
  nurse_id: z.string().uuid().optional().nullable(),
  nurse_name: z.string(),
  doctor_id: z.string().uuid().optional().nullable(),
  doctor_name: z.string().optional().nullable(),
  visit_date: z.string(),
  visit_time: z.string(),
  service_type: z.string(),
  status: z.string().max(50).optional(),
  notes: z.string().optional().nullable(),
});

// ============================================
// VISITS
// ============================================

/**
 * GET /api/home-care/visits
 */
router.get('/visits', asyncHandler(async (req, res) => {
  const { status, date_from, date_to, patient_id, page = 1, limit = 50 } = req.query;

  const where = {};
  if (status) where.status = status;
  if (patient_id) where.patient_id = patient_id;
  if (date_from || date_to) {
    where.visit_date = {};
    if (date_from) where.visit_date.gte = new Date(date_from);
    if (date_to) where.visit_date.lte = new Date(date_to);
  }

  const [total, visits] = await Promise.all([
    prisma.home_care_visits.count({ where }),
    prisma.home_care_visits.findMany({
      where,
      include: {
        patient: { select: { id: true, full_name: true, medical_record_number: true } },
      },
      orderBy: { visit_date: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    }),
  ]);

  res.json({
    success: true,
    data: visits,
    pagination: { page: parseInt(page), limit: parseInt(limit), total },
  });
}));

/**
 * GET /api/home-care/visits/:id
 */
router.get('/visits/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const visit = await prisma.home_care_visits.findUnique({
    where: { id },
    include: {
      patient: { select: { id: true, full_name: true, medical_record_number: true, phone: true, address: true } },
    },
  });
  if (!visit) throw new Error('Home care visit not found');
  res.json({ success: true, data: visit });
}));

/**
 * POST /api/home-care/visits
 */
router.post('/visits', requireRole(['admin', 'registrasi', 'perawat']), asyncHandler(async (req, res) => {
  const data = visitSchema.parse(req.body);

  // Auto-generate visit number
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const count = await prisma.home_care_visits.count();
  const visit_number = `HC-${dateStr}-${String(count + 1).padStart(4, '0')}`;

  const visit = await prisma.home_care_visits.create({ data: { ...data, visit_number } });
  res.status(201).json({ success: true, data: visit });
}));

/**
 * PUT /api/home-care/visits/:id
 */
router.put('/visits/:id', requireRole(['admin', 'registrasi', 'perawat', 'dokter']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = visitSchema.partial().parse(req.body);

  // Set completed_at when status changes to completed
  if (data.status === 'completed' && !data.completed_at) {
    data.completed_at = new Date();
  }

  const visit = await prisma.home_care_visits.update({ where: { id }, data });
  res.json({ success: true, data: visit });
}));

// ============================================
// NUMBER GENERATOR
// ============================================

/**
 * GET /api/home-care/next-visit-number
 */
router.get('/next-visit-number', asyncHandler(async (req, res) => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const count = await prisma.home_care_visits.count();
  const visitNumber = `HC-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  res.json({ success: true, data: visitNumber });
}));

export default router;

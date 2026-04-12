/**
 * SIMRS ZEN - SISRUTE (Sistem Informasi Rujukan Terintegrasi) Routes
 * Manajemen rujukan antar fasilitas kesehatan
 */
import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { prisma } from '../config/database.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();
router.use(authenticateToken);

// ─── Validation schemas ───────────────────────────────────────────────────────

const ReferralSchema = z.object({
  patient_id:            z.string().uuid(),
  visit_id:              z.string().uuid().optional().nullable(),
  referral_type:         z.enum(['inbound', 'outbound']),
  urgency_level:         z.enum(['biasa', 'segera', 'darurat']).default('biasa'),
  diagnosis_code:        z.string().optional().nullable(),
  diagnosis_description: z.string().optional().nullable(),
  reason:                z.string().min(5, 'Alasan rujukan minimal 5 karakter'),
  referring_facility:    z.string().optional().nullable(),
  destination_facility:  z.string().optional().nullable(),
  referring_doctor:      z.string().optional().nullable(),
  destination_doctor:    z.string().optional().nullable(),
  notes:                 z.string().optional().nullable(),
  scheduled_date:        z.string().datetime({ offset: true }).optional().nullable(),
});

const StatusSchema = z.object({
  status: z.enum(['pending', 'accepted', 'in_transfer', 'arrived', 'rejected', 'cancelled']),
  notes:  z.string().optional().nullable(),
});

// ─── Helper: generate referral number ────────────────────────────────────────

async function generateReferralNumber(type) {
  const prefix = type === 'inbound' ? 'RJK' : 'RJL'; // masuk / keluar
  const count  = await prisma.sisrute_referrals.count();
  const year   = new Date().getFullYear();
  return `${prefix}-${year}-${String(count + 1).padStart(5, '0')}`;
}

// ─── GET /api/sisrute/stats ───────────────────────────────────────────────────

router.get('/stats', asyncHandler(async (_req, res) => {
  const [total, pending, inTransfer, today] = await Promise.all([
    prisma.sisrute_referrals.count(),
    prisma.sisrute_referrals.count({ where: { status: 'pending' } }),
    prisma.sisrute_referrals.count({ where: { status: 'in_transfer' } }),
    prisma.sisrute_referrals.count({
      where: { created_at: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
  ]);

  const byType = await prisma.sisrute_referrals.groupBy({
    by: ['referral_type'],
    _count: { id: true },
  });

  res.json({
    success: true,
    data: {
      total,
      pending,
      in_transfer: inTransfer,
      today,
      by_type: Object.fromEntries(byType.map(b => [b.referral_type, b._count.id])),
    },
  });
}));

// ─── GET /api/sisrute ─────────────────────────────────────────────────────────

router.get('/', asyncHandler(async (req, res) => {
  const {
    referral_type, status, urgency_level,
    search, page = '1', limit = '20',
  } = req.query;

  const where = {};
  if (referral_type)  where.referral_type  = referral_type;
  if (status)         where.status         = status;
  if (urgency_level)  where.urgency_level  = urgency_level;
  if (search) {
    where.OR = [
      { referral_number:       { contains: search, mode: 'insensitive' } },
      { reason:                { contains: search, mode: 'insensitive' } },
      { destination_facility:  { contains: search, mode: 'insensitive' } },
      { patients: { full_name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const take = Math.min(parseInt(limit) || 20, 100);
  const skip = (parseInt(page) - 1) * take;

  const [referrals, total] = await Promise.all([
    prisma.sisrute_referrals.findMany({
      where,
      include: {
        patients: { select: { id: true, full_name: true, medical_record_number: true, birth_date: true } },
      },
      orderBy: [{ urgency_level: 'desc' }, { created_at: 'desc' }],
      take,
      skip,
    }),
    prisma.sisrute_referrals.count({ where }),
  ]);

  res.json({
    success: true,
    data: referrals,
    pagination: { page: parseInt(page), limit: take, total, total_pages: Math.ceil(total / take) },
  });
}));

// ─── GET /api/sisrute/:id ─────────────────────────────────────────────────────

router.get('/:id', asyncHandler(async (req, res) => {
  const referral = await prisma.sisrute_referrals.findUnique({
    where: { id: req.params.id },
    include: {
      patients: { select: { id: true, full_name: true, medical_record_number: true, birth_date: true, gender: true, blood_type: true } },
    },
  });
  if (!referral) throw new ApiError(404, 'Rujukan tidak ditemukan');
  res.json({ success: true, data: referral });
}));

// ─── POST /api/sisrute ────────────────────────────────────────────────────────

router.post('/', requireRole(['admin', 'dokter', 'perawat', 'registrasi']), asyncHandler(async (req, res) => {
  const data = ReferralSchema.parse(req.body);

  const referral_number = await generateReferralNumber(data.referral_type);

  const referral = await prisma.sisrute_referrals.create({
    data: {
      ...data,
      referral_number,
      status:       'pending',
      created_by:   req.user.id,
      scheduled_date: data.scheduled_date ? new Date(data.scheduled_date) : null,
    },
    include: {
      patients: { select: { full_name: true, medical_record_number: true } },
    },
  });

  res.status(201).json({ success: true, data: referral });
}));

// ─── PATCH /api/sisrute/:id/status ───────────────────────────────────────────

router.patch('/:id/status', requireRole(['admin', 'dokter', 'perawat', 'registrasi']), asyncHandler(async (req, res) => {
  const { status, notes } = StatusSchema.parse(req.body);

  const timestamps = {};
  if (status === 'accepted')    timestamps.accepted_at    = new Date();
  if (status === 'in_transfer') timestamps.transferred_at = new Date();
  if (status === 'arrived')     timestamps.arrived_at     = new Date();

  const referral = await prisma.sisrute_referrals.update({
    where: { id: req.params.id },
    data: { status, notes, updated_at: new Date(), ...timestamps },
  });

  res.json({ success: true, data: referral });
}));

// ─── PUT /api/sisrute/:id ─────────────────────────────────────────────────────

router.put('/:id', requireRole(['admin', 'dokter', 'registrasi']), asyncHandler(async (req, res) => {
  const data = ReferralSchema.partial().parse(req.body);
  const referral = await prisma.sisrute_referrals.update({
    where: { id: req.params.id },
    data: { ...data, updated_at: new Date() },
  });
  res.json({ success: true, data: referral });
}));

// ─── DELETE /api/sisrute/:id (cancel) ────────────────────────────────────────

router.delete('/:id', requireRole(['admin']), asyncHandler(async (req, res) => {
  const referral = await prisma.sisrute_referrals.update({
    where: { id: req.params.id },
    data: { status: 'cancelled', updated_at: new Date() },
  });
  res.json({ success: true, data: referral });
}));

export default router;

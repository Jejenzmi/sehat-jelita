/**
 * SIMRS ZEN - Vital Signs Routes
 * CRUD operations for patient vital signs
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { requireRole } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();

// Require clinical roles for all vital signs routes
router.use(requireRole(['admin', 'dokter', 'perawat']));

// Validation schemas
const createVitalSignSchema = z.object({
  patient_id: z.string().uuid('Patient ID tidak valid'),
  visit_id: z.string().uuid('Visit ID tidak valid').optional(),
  recorded_at: z.string().datetime().optional(),
  systolic_bp: z.number().int().positive().optional(),
  diastolic_bp: z.number().int().positive().optional(),
  heart_rate: z.number().int().positive().optional(),
  respiratory_rate: z.number().int().positive().optional(),
  temperature: z.number().positive().optional(),
  spo2: z.number().min(0).max(100).optional(),
  weight: z.number().positive().optional(),
  height: z.number().positive().optional(),
  bmi: z.number().positive().optional(),
  pain_scale: z.number().min(0).max(10).optional(),
  consciousness: z.string().optional(),
  notes: z.string().optional()
});

const updateVitalSignSchema = createVitalSignSchema.partial();

// ============================================
// VITAL SIGNS CRUD
// ============================================

/**
 * GET /api/vital-signs
 * Get all vital signs with pagination
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', patient_id, visit_id } = req.query;

  const where: Record<string, unknown> = {};
  if (patient_id) where.patient_id = patient_id;
  if (visit_id) where.visit_id = visit_id;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const [vitalSigns, total] = await Promise.all([
    prisma.vital_signs.findMany({
      where,
      include: {
        patients: {
          select: {
            id: true,
            medical_record_number: true,
            full_name: true
          }
        }
      },
      orderBy: { recorded_at: 'desc' },
      skip,
      take: parseInt(limit as string)
    }),
    prisma.vital_signs.count({ where })
  ]);

  res.json({
    success: true,
    data: vitalSigns,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      totalPages: Math.ceil(total / parseInt(limit as string))
    }
  });
}));

/**
 * GET /api/vital-signs/:id
 * Get single vital sign record
 */
router.get('/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const vitalSign = await prisma.vital_signs.findUnique({
    where: { id },
    include: {
      patients: {
        select: {
          id: true,
          medical_record_number: true,
          full_name: true
        }
      }
    }
  });

  if (!vitalSign) {
    throw new ApiError(404, 'Vital sign record tidak ditemukan', 'VITAL_SIGN_NOT_FOUND');
  }

  res.json({ success: true, data: vitalSign });
}));

/**
 * GET /api/vital-signs/latest/:patient_id
 * Get latest vital signs for a patient
 */
router.get('/latest/:patient_id', asyncHandler(async (req: Request<{ patient_id: string }>, res: Response) => {
  const { patient_id } = req.params;

  const latestVital = await prisma.vital_signs.findFirst({
    where: { patient_id },
    orderBy: { recorded_at: 'desc' }
  });

  if (!latestVital) {
    throw new ApiError(404, 'Tidak ada data vital sign untuk pasien ini', 'NO_VITAL_SIGNS');
  }

  res.json({ success: true, data: latestVital });
}));

/**
 * GET /api/vital-signs/trend/:patient_id
 * Get vital signs trend for a patient (last 10 records)
 */
router.get('/trend/:patient_id', asyncHandler(async (req: Request<{ patient_id: string }>, res: Response) => {
  const { patient_id } = req.params;

  const trends = await prisma.vital_signs.findMany({
    where: { patient_id },
    orderBy: { recorded_at: 'desc' },
    take: 10
  });

  res.json({ success: true, data: trends.reverse() }); // Oldest first for chart
}));

/**
 * POST /api/vital-signs
 * Create new vital sign record
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createVitalSignSchema.parse(req.body);

  const vitalSign = await prisma.vital_signs.create({
    data: {
      ...validatedData,
      recorded_at: validatedData.recorded_at ? new Date(validatedData.recorded_at) : new Date()
    }
  });

  res.status(201).json({ success: true, data: vitalSign });
}));

/**
 * PUT /api/vital-signs/:id
 * Update vital sign record
 */
router.put('/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const validatedData = updateVitalSignSchema.parse(req.body);

  const vitalSign = await prisma.vital_signs.findUnique({ where: { id } });
  if (!vitalSign) {
    throw new ApiError(404, 'Vital sign record tidak ditemukan', 'VITAL_SIGN_NOT_FOUND');
  }

  const updated = await prisma.vital_signs.update({
    where: { id },
    data: validatedData
  });

  res.json({ success: true, data: updated });
}));

/**
 * DELETE /api/vital-signs/:id
 * Delete vital sign record
 */
router.delete('/:id', requireRole(['admin']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const vitalSign = await prisma.vital_signs.findUnique({ where: { id } });
  if (!vitalSign) {
    throw new ApiError(404, 'Vital sign record tidak ditemukan', 'VITAL_SIGN_NOT_FOUND');
  }

  await prisma.vital_signs.delete({ where: { id } });

  res.json({ success: true, message: 'Vital sign record berhasil dihapus' });
}));

export default router;

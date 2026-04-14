/**
 * SIMRS ZEN - Staff Certifications Routes
 * CRUD operations for staff certifications and trainings
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { requireRole } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();

// Require HR/admin roles for all staff certification routes
router.use(requireRole(['admin', 'manajemen']));

// Validation schemas
const createCertificationSchema = z.object({
  employee_id: z.string().uuid('Employee ID tidak valid'),
  cert_name: z.string().min(2, 'Nama sertifikat minimal 2 karakter'),
  cert_type: z.string().min(2, 'Tipe sertifikat minimal 2 karakter'),
  issuing_organization: z.string().optional(),
  issue_date: z.string().datetime(),
  expiry_date: z.string().datetime().optional(),
  cert_number: z.string().optional(),
  file_url: z.string().url().optional(),
  notes: z.string().optional()
});

const updateCertificationSchema = createCertificationSchema.partial();

const createTrainingSchema = z.object({
  employee_id: z.string().uuid('Employee ID tidak valid'),
  training_name: z.string().min(2, 'Nama pelatihan minimal 2 karakter'),
  training_type: z.string().min(2, 'Tipe pelatihan minimal 2 karakter'),
  start_date: z.string().datetime(),
  end_date: z.string().datetime().optional(),
  duration_hours: z.number().positive().optional(),
  location: z.string().optional(),
  organizer: z.string().optional(),
  certificate_url: z.string().url().optional(),
  cost: z.number().positive().optional(),
  notes: z.string().optional()
});

const updateTrainingSchema = createTrainingSchema.partial();

// ============================================
// CERTIFICATIONS CRUD
// ============================================

/**
 * GET /api/staff-certifications
 * Get all certifications with pagination
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', employee_id, cert_type, status } = req.query;

  const where: Record<string, unknown> = {};
  if (employee_id) where.employee_id = employee_id;
  if (cert_type) where.cert_type = cert_type;
  if (status === 'active') {
    where.expiry_date = { gte: new Date() };
  } else if (status === 'expired') {
    where.expiry_date = { lt: new Date() };
  }

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const [certifications, total] = await Promise.all([
    prisma.staff_certifications.findMany({
      where,
      include: {
        employees: {
          select: {
            id: true,
            full_name: true,
            employee_id: true
          }
        }
      },
      orderBy: { issue_date: 'desc' },
      skip,
      take: parseInt(limit as string)
    }),
    prisma.staff_certifications.count({ where })
  ]);

  res.json({
    success: true,
    data: certifications,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      totalPages: Math.ceil(total / parseInt(limit as string))
    }
  });
}));

/**
 * GET /api/staff-certifications/stats
 * Get certification statistics
 */
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const now = new Date();

  const [total, active, expiringSoon, expired] = await Promise.all([
    prisma.staff_certifications.count(),
    prisma.staff_certifications.count({ where: { expiry_date: { gte: now } } }),
    prisma.staff_certifications.count({
      where: {
        expiry_date: {
          gte: now,
          lt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      }
    }),
    prisma.staff_certifications.count({ where: { expiry_date: { lt: now } } })
  ]);

  res.json({
    success: true,
    data: { total, active, expiringSoon, expired }
  });
}));

/**
 * GET /api/staff-certifications/:id
 * Get single certification
 */
router.get('/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const certification = await prisma.staff_certifications.findUnique({
    where: { id },
    include: {
      employees: {
        select: {
          id: true,
          full_name: true,
          employee_id: true
        }
      }
    }
  });

  if (!certification) {
    throw new ApiError(404, 'Sertifikasi tidak ditemukan', 'CERTIFICATION_NOT_FOUND');
  }

  res.json({ success: true, data: certification });
}));

/**
 * POST /api/staff-certifications
 * Create new certification
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createCertificationSchema.parse(req.body);

  const certification = await prisma.staff_certifications.create({
    data: {
      ...validatedData,
      issue_date: new Date(validatedData.issue_date),
      expiry_date: validatedData.expiry_date ? new Date(validatedData.expiry_date) : null
    }
  });

  res.status(201).json({ success: true, data: certification });
}));

/**
 * PUT /api/staff-certifications/:id
 * Update certification
 */
router.put('/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const validatedData = updateCertificationSchema.parse(req.body);

  const certification = await prisma.staff_certifications.findUnique({ where: { id } });
  if (!certification) {
    throw new ApiError(404, 'Sertifikasi tidak ditemukan', 'CERTIFICATION_NOT_FOUND');
  }

  const updated = await prisma.staff_certifications.update({
    where: { id },
    data: {
      ...validatedData,
      issue_date: validatedData.issue_date ? new Date(validatedData.issue_date) : undefined,
      expiry_date: validatedData.expiry_date ? new Date(validatedData.expiry_date) : undefined
    }
  });

  res.json({ success: true, data: updated });
}));

/**
 * DELETE /api/staff-certifications/:id
 * Delete certification
 */
router.delete('/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const certification = await prisma.staff_certifications.findUnique({ where: { id } });
  if (!certification) {
    throw new ApiError(404, 'Sertifikasi tidak ditemukan', 'CERTIFICATION_NOT_FOUND');
  }

  await prisma.staff_certifications.delete({ where: { id } });

  res.json({ success: true, message: 'Sertifikasi berhasil dihapus' });
}));

// ============================================
// TRAININGS CRUD
// ============================================

/**
 * GET /api/staff-certifications/trainings
 * Get all trainings with pagination
 */
router.get('/trainings', asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', employee_id, training_type } = req.query;

  const where: Record<string, unknown> = {};
  if (employee_id) where.employee_id = employee_id;
  if (training_type) where.training_type = training_type;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const [trainings, total] = await Promise.all([
    prisma.trainings.findMany({
      where,
      include: {
        employees: {
          select: {
            id: true,
            full_name: true,
            employee_id: true
          }
        }
      },
      orderBy: { start_date: 'desc' },
      skip,
      take: parseInt(limit as string)
    }),
    prisma.trainings.count({ where })
  ]);

  res.json({
    success: true,
    data: trainings,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      totalPages: Math.ceil(total / parseInt(limit as string))
    }
  });
}));

/**
 * GET /api/staff-certifications/trainings/:id
 * Get single training
 */
router.get('/trainings/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const training = await prisma.trainings.findUnique({
    where: { id },
    include: {
      employees: {
        select: {
          id: true,
          full_name: true,
          employee_id: true
        }
      }
    }
  });

  if (!training) {
    throw new ApiError(404, 'Pelatihan tidak ditemukan', 'TRAINING_NOT_FOUND');
  }

  res.json({ success: true, data: training });
}));

/**
 * POST /api/staff-certifications/trainings
 * Create new training
 */
router.post('/trainings', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createTrainingSchema.parse(req.body);

  const training = await prisma.trainings.create({
    data: {
      ...validatedData,
      start_date: new Date(validatedData.start_date),
      end_date: validatedData.end_date ? new Date(validatedData.end_date) : null
    }
  });

  res.status(201).json({ success: true, data: training });
}));

/**
 * PUT /api/staff-certifications/trainings/:id
 * Update training
 */
router.put('/trainings/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const validatedData = updateTrainingSchema.parse(req.body);

  const training = await prisma.trainings.findUnique({ where: { id } });
  if (!training) {
    throw new ApiError(404, 'Pelatihan tidak ditemukan', 'TRAINING_NOT_FOUND');
  }

  const updated = await prisma.trainings.update({
    where: { id },
    data: {
      ...validatedData,
      start_date: validatedData.start_date ? new Date(validatedData.start_date) : undefined,
      end_date: validatedData.end_date ? new Date(validatedData.end_date) : undefined
    }
  });

  res.json({ success: true, data: updated });
}));

/**
 * DELETE /api/staff-certifications/trainings/:id
 * Delete training
 */
router.delete('/trainings/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const training = await prisma.trainings.findUnique({ where: { id } });
  if (!training) {
    throw new ApiError(404, 'Pelatihan tidak ditemukan', 'TRAINING_NOT_FOUND');
  }

  await prisma.trainings.delete({ where: { id } });

  res.json({ success: true, message: 'Pelatihan berhasil dihapus' });
}));

export default router;

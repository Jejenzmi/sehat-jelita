/**
 * SIMRS ZEN - Staff Certifications & Trainings Routes
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { prisma } from '../config/database.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();
router.use(authenticateToken);

interface CertsQuery {
  employee_id?: string;
  cert_type?: string;
  expiring_days?: string;
  expired?: string;
  page?: string;
  limit?: string;
}

interface TrainingsQuery {
  training_type?: string;
  employee_id?: string;
  department_id?: string;
  upcoming?: string;
  page?: string;
  limit?: string;
}

const CertSchema = z.object({
  employee_id: z.string().uuid(),
  cert_name: z.string().min(2, 'Nama sertifikasi minimal 2 karakter'),
  cert_number: z.string().optional().nullable(),
  issuing_authority: z.string().optional().nullable(),
  cert_type: z.enum(['clinical', 'general', 'technical', 'management', 'other']).default('general'),
  issue_date: z.string().datetime({ offset: true }).optional().nullable(),
  expiry_date: z.string().datetime({ offset: true }).optional().nullable(),
  is_mandatory: z.boolean().default(false),
  notes: z.string().optional().nullable(),
});

const TrainingSchema = z.object({
  employee_id: z.string().uuid().optional().nullable(),
  department_id: z.string().uuid().optional().nullable(),
  training_name: z.string().min(2, 'Nama pelatihan minimal 2 karakter'),
  training_type: z.enum(['internal', 'external', 'online', 'seminar', 'workshop']).default('internal'),
  organizer: z.string().optional().nullable(),
  venue: z.string().optional().nullable(),
  start_date: z.string().datetime({ offset: true }),
  end_date: z.string().datetime({ offset: true }).optional().nullable(),
  duration_hours: z.coerce.number().min(0).optional().nullable(),
  max_participants: z.coerce.number().int().min(1).optional().nullable(),
  cost: z.coerce.number().min(0).optional().nullable(),
  description: z.string().optional().nullable(),
  is_mandatory: z.boolean().default(false),
});

interface CertBody extends z.infer<typeof CertSchema> { }
interface TrainingBody extends z.infer<typeof TrainingSchema> { }

// CERTIFICATIONS
router.get('/certifications', asyncHandler(async (req: Request<Record<string, string>, any, any, CertsQuery>, res: Response) => {
  const {
    employee_id, cert_type, expiring_days, expired,
    page = '1', limit = '20',
  } = req.query;

  const where: Record<string, unknown> = {};
  if (employee_id) where.employee_id = employee_id;
  if (cert_type) where.cert_type = cert_type;

  if (expiring_days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + parseInt(expiring_days));
    where.expiry_date = { gte: new Date(), lte: cutoff };
  }
  if (expired === 'true') {
    where.expiry_date = { lt: new Date() };
  }

  const take = Math.min(parseInt(limit) || 20, 100);
  const skip = (parseInt(page) - 1) * take;

  const [certs, total] = await Promise.all([
    prisma.staff_certifications.findMany({
      where,
      include: {
        employees: { select: { id: true, full_name: true, employee_code: true, position: true } },
      },
      orderBy: { expiry_date: 'asc' },
      take,
      skip,
    }),
    prisma.staff_certifications.count({ where }),
  ]);

  const enriched = (certs as Array<Record<string, unknown>>).map(c => ({
    ...c,
    days_until_expiry: c.expiry_date
      ? Math.ceil((new Date(c.expiry_date as string | Date).getTime() - new Date().getTime()) / 86_400_000)
      : null,
  }));

  res.json({
    success: true,
    data: enriched,
    pagination: { page: parseInt(page), limit: take, total, total_pages: Math.ceil(total / take) },
  });
}));

router.get('/certifications/stats', asyncHandler(async (_req: Request, res: Response) => {
  const now = new Date();
  const in30 = new Date(); in30.setDate(in30.getDate() + 30);

  const [total, expiringSoon, expired, mandatory] = await Promise.all([
    prisma.staff_certifications.count(),
    prisma.staff_certifications.count({ where: { expiry_date: { gte: now, lte: in30 } } }),
    prisma.staff_certifications.count({ where: { expiry_date: { lt: now } } }),
    prisma.staff_certifications.count({ where: { is_mandatory: true } as any }),
  ]);

  const byType = await prisma.staff_certifications.groupBy({
    by: ['cert_type'],
    _count: { id: true },
  });

  res.json({
    success: true,
    data: {
      total,
      expiring_soon: expiringSoon,
      expired,
      mandatory,
      by_type: Object.fromEntries((byType as Array<{ cert_type: string; _count: { id: number } }>).map(b => [b.cert_type, b._count.id])),
    },
  });
}));

router.get('/certifications/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const cert = await prisma.staff_certifications.findUnique({
    where: { id: req.params.id },
    include: { employees: { select: { full_name: true, employee_code: true, position: true } } },
  });
  if (!cert) throw new ApiError(404, 'Sertifikasi tidak ditemukan');
  res.json({ success: true, data: cert });
}));

router.post('/certifications', requireRole(['admin', 'sdm']), asyncHandler(async (req: Request, res: Response) => {
  const data = CertSchema.parse(req.body);
  const cert = await prisma.staff_certifications.create({
    data: {
      ...data,
      issue_date: data.issue_date ? new Date(data.issue_date) : null,
      expiry_date: data.expiry_date ? new Date(data.expiry_date) : null,
    } as any,
    include: { employees: { select: { full_name: true } } } as any,
  });
  res.status(201).json({ success: true, data: cert });
}));

router.put('/certifications/:id', requireRole(['admin', 'sdm']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const data = CertSchema.partial().parse(req.body);
  const cert = await prisma.staff_certifications.update({
    where: { id: req.params.id },
    data: {
      ...data,
      issue_date: data.issue_date ? new Date(data.issue_date) : undefined,
      expiry_date: data.expiry_date ? new Date(data.expiry_date) : undefined,
      updated_at: new Date(),
    },
  });
  res.json({ success: true, data: cert });
}));

router.delete('/certifications/:id', requireRole(['admin']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  await prisma.staff_certifications.delete({ where: { id: req.params.id } });
  res.json({ success: true, data: { id: req.params.id } });
}));

// TRAININGS
router.get('/trainings', asyncHandler(async (req: Request<Record<string, string>, any, any, TrainingsQuery>, res: Response) => {
  const {
    training_type, employee_id, department_id,
    upcoming, page = '1', limit = '20',
  } = req.query;

  const where: Record<string, unknown> = {};
  if (training_type) where.training_type = training_type;
  if (employee_id) where.employee_id = employee_id;
  if (department_id) where.department_id = department_id;
  if (upcoming === 'true') where.start_date = { gte: new Date() };

  const take = Math.min(parseInt(limit) || 20, 100);
  const skip = (parseInt(page) - 1) * take;

  const [trainings, total] = await Promise.all([
    prisma.trainings.findMany({
      where,
      // TODO: Add employees and departments relations to trainings schema
      // include: {
      //   employees: { select: { id: true, full_name: true, employee_code: true } },
      //   departments: { select: { id: true, department_name: true } },
      // },
      orderBy: { start_date: 'desc' },
      take,
      skip,
    }),
    prisma.trainings.count({ where }),
  ]);

  res.json({
    success: true,
    data: trainings,
    pagination: { page: parseInt(page), limit: take, total, total_pages: Math.ceil(total / take) },
  });
}));

router.get('/trainings/stats', asyncHandler(async (_req: Request, res: Response) => {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [totalThisYear, upcoming, byType] = await Promise.all([
    prisma.trainings.count({ where: { start_date: { gte: yearStart } } }),
    prisma.trainings.count({ where: { start_date: { gte: now } } }),
    prisma.trainings.groupBy({ by: ['training_type'], _count: { id: true } }),
  ]);

  res.json({
    success: true,
    data: {
      total_this_year: totalThisYear,
      upcoming,
      by_type: Object.fromEntries((byType as Array<{ training_type: string; _count: { id: number } }>).map(b => [b.training_type, b._count.id])),
    },
  });
}));

router.get('/trainings/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const training = await prisma.trainings.findUnique({
    where: { id: req.params.id },
    include: {
      employees: { select: { full_name: true, employee_code: true } },
      departments: { select: { department_name: true } },
    },
  } as any);
  if (!training) throw new ApiError(404, 'Pelatihan tidak ditemukan');
  res.json({ success: true, data: training });
}));

router.post('/trainings', requireRole(['admin', 'sdm']), asyncHandler(async (req: Request, res: Response) => {
  const data = TrainingSchema.parse(req.body);
  const training = await prisma.trainings.create({
    data: {
      ...data,
      start_date: new Date(data.start_date),
      end_date: data.end_date ? new Date(data.end_date) : null,
    } as any,
  });
  res.status(201).json({ success: true, data: training });
}));

router.put('/trainings/:id', requireRole(['admin', 'sdm']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const data = TrainingSchema.partial().parse(req.body);
  const training = await prisma.trainings.update({
    where: { id: req.params.id },
    data: {
      ...data,
      start_date: data.start_date ? new Date(data.start_date) : undefined,
      end_date: data.end_date ? new Date(data.end_date) : undefined,
      updated_at: new Date(),
    },
  });
  res.json({ success: true, data: training });
}));

router.delete('/trainings/:id', requireRole(['admin']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  await prisma.trainings.delete({ where: { id: req.params.id } });
  res.json({ success: true, data: { id: req.params.id } });
}));

export default router;

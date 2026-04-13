/**
 * SIMRS ZEN - Drug Interactions Admin Routes
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { prisma } from '../config/database.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import type { Prisma } from '@prisma/client';

const router = Router();
router.use(authenticateToken);

interface InteractionsQuery {
  severity?: string;
  search?: string;
  medicine_id?: string;
  page?: string;
  limit?: string;
}

interface AllergiesQuery {
  patient_id?: string;
}

// Base schema matching Prisma drug_interactions model fields
const InteractionBaseSchema = z.object({
  medicine_id_a: z.string().uuid(),
  medicine_id_b: z.string().uuid(),
  severity: z.enum(['minor', 'moderate', 'major', 'contraindicated']),
  description: z.string().min(10, 'Description minimal 10 karakter'),
  mechanism: z.string().optional().nullable(),
  clinical_effect: z.string().optional().nullable(),
  management: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

const InteractionSchema = InteractionBaseSchema.refine(d => d.medicine_id_a !== d.medicine_id_b, {
  message: 'Obat A dan obat B tidak boleh sama',
  path: ['medicine_id_b'],
});

const InteractionUpdateSchema = InteractionBaseSchema.partial();

const AllergySchema = z.object({
  patient_id: z.string().uuid(),
  medicine_id: z.string().uuid().optional().nullable(),
  allergen_name: z.string().min(2),
  reaction_type: z.string().optional().nullable(),
  severity: z.enum(['mild', 'moderate', 'severe', 'life_threatening']).default('moderate'),
  notes: z.string().optional().nullable(),
});

interface InteractionBody extends z.infer<typeof InteractionSchema> { }
interface AllergyBody extends z.infer<typeof AllergySchema> { }

// Drug Interactions
router.get('/', asyncHandler(async (req: Request<Record<string, string>, any, any, InteractionsQuery>, res: Response) => {
  const { severity, search, medicine_id, page = '1', limit = '30' } = req.query;

  const where: Record<string, unknown> = { is_active: true };
  if (severity) where.severity = severity;
  if (medicine_id) where.OR = [{ medicine_id_a: medicine_id }, { medicine_id_b: medicine_id }];
  if (search) {
    where.AND = [{
      OR: [
        { description: { contains: search, mode: 'insensitive' } },
        { clinical_effect: { contains: search, mode: 'insensitive' } },
      ],
    }];
  }

  const take = Math.min(parseInt(limit) || 30, 100);
  const skip = (parseInt(page) - 1) * take;

  const [interactions, total] = await Promise.all([
    prisma.drug_interactions.findMany({
      where,
      include: {
        medicine_a: {
          select: { id: true, medicine_name: true, generic_name: true, category: true },
        },
        medicine_b: {
          select: { id: true, medicine_name: true, generic_name: true, category: true },
        },
      },
      orderBy: [{ severity: 'desc' }, { created_at: 'desc' }],
      take,
      skip,
    }),
    prisma.drug_interactions.count({ where }),
  ]);

  const data = (interactions as Array<Record<string, unknown>>).map(i => ({
    ...i,
    medicine_a: i.medicine_a,
    medicine_b: i.medicine_b,
  }));

  res.json({
    success: true,
    data,
    pagination: { page: parseInt(page), limit: take, total, total_pages: Math.ceil(total / take) },
  });
}));

router.get('/stats', asyncHandler(async (_req: Request, res: Response) => {
  const [total, bySeverity] = await Promise.all([
    prisma.drug_interactions.count({ where: { is_active: true } }),
    prisma.drug_interactions.groupBy({
      by: ['severity'],
      _count: { id: true },
      where: { is_active: true },
    }),
  ]);

  res.json({
    success: true,
    data: {
      total,
      by_severity: Object.fromEntries((bySeverity as Array<{ severity: string; _count: { id: number } }>).map(b => [b.severity, b._count.id])),
    },
  });
}));

router.get('/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const interaction = await prisma.drug_interactions.findUnique({
    where: { id: req.params.id },
    include: {
      medicine_a: { select: { id: true, medicine_name: true, generic_name: true } },
      medicine_b: { select: { id: true, medicine_name: true, generic_name: true } },
    },
  });
  if (!interaction) throw new ApiError(404, 'Interaksi obat tidak ditemukan');
  res.json({ success: true, data: interaction });
}));

router.post('/', requireRole(['admin', 'apoteker', 'dokter']), asyncHandler(async (req: Request, res: Response) => {
  const parsed = InteractionSchema.parse(req.body);

  const existing = await prisma.drug_interactions.findFirst({
    where: {
      OR: [
        { medicine_id_a: parsed.medicine_id_a, medicine_id_b: parsed.medicine_id_b },
        { medicine_id_a: parsed.medicine_id_b, medicine_id_b: parsed.medicine_id_a },
      ],
      is_active: true,
    },
  });
  if (existing) throw new ApiError(409, 'Interaksi antara kedua obat ini sudah terdaftar');

  const createData: Prisma.drug_interactionsCreateInput = {
    medicine_a: { connect: { id: parsed.medicine_id_a } },
    medicine_b: { connect: { id: parsed.medicine_id_b } },
    severity: parsed.severity,
    description: parsed.description,
    mechanism: parsed.mechanism ?? undefined,
    clinical_effect: parsed.clinical_effect ?? undefined,
    management: parsed.management ?? undefined,
    source: parsed.source ?? undefined,
    is_active: parsed.is_active,
  };

  const interaction = await prisma.drug_interactions.create({ data: createData });
  res.status(201).json({ success: true, data: interaction });
}));

router.put('/:id', requireRole(['admin', 'apoteker', 'dokter']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const data = InteractionUpdateSchema.parse(req.body);
  const updateData: Prisma.drug_interactionsUpdateInput = {
    ...data,
    updated_at: new Date(),
  };
  const interaction = await prisma.drug_interactions.update({
    where: { id: req.params.id },
    data: updateData,
  });
  res.json({ success: true, data: interaction });
}));

router.delete('/:id', requireRole(['admin']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  await prisma.drug_interactions.update({
    where: { id: req.params.id },
    data: { is_active: false, updated_at: new Date() },
  });
  res.json({ success: true, data: { id: req.params.id } });
}));

// Patient Drug Allergies
router.get('/allergies', asyncHandler(async (req: Request<Record<string, string>, any, any, AllergiesQuery>, res: Response) => {
  const { patient_id } = req.query;
  if (!patient_id) throw new ApiError(400, 'patient_id wajib diisi');

  const allergies = await prisma.patient_drug_allergies.findMany({
    where: { patient_id },
    include: { medicines: { select: { id: true, medicine_name: true, generic_name: true } } },
    orderBy: { severity: 'desc' },
  });

  res.json({ success: true, data: allergies });
}));

router.post('/allergies', requireRole(['admin', 'dokter', 'apoteker', 'perawat']), asyncHandler(async (req: Request, res: Response) => {
  const data = AllergySchema.parse(req.body);
  const allergy = await prisma.patient_drug_allergies.create({
    data: {
      allergen_name: data.allergen_name,
      patient_id: data.patient_id,
      medicine_id: data.medicine_id,
      reaction_type: data.reaction_type,
      severity: data.severity,
      notes: data.notes,
      reported_by: (req.user as Record<string, string>).id,
    },
  });
  res.status(201).json({ success: true, data: allergy });
}));

router.delete('/allergies/:id', requireRole(['admin', 'dokter']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  await prisma.patient_drug_allergies.update({
    where: { id: req.params.id },
    data: { is_active: false },
  });
  res.json({ success: true, data: { id: req.params.id } });
}));

export default router;

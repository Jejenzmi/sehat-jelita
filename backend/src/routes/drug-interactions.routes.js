/**
 * SIMRS ZEN - Drug Interactions Admin Routes
 * CRUD database interaksi obat untuk Clinical Decision Support (CDS)
 */
import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { prisma } from '../config/database.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();
router.use(authenticateToken);

// ─── Validation ───────────────────────────────────────────────────────────────

const InteractionSchema = z.object({
  medicine_a_id:    z.string().uuid(),
  medicine_b_id:    z.string().uuid(),
  severity:         z.enum(['minor', 'moderate', 'major', 'contraindicated']),
  mechanism:        z.string().optional().nullable(),
  clinical_effect:  z.string().min(10, 'Clinical effect minimal 10 karakter'),
  management:       z.string().optional().nullable(),
  evidence_level:   z.enum(['theoretical', 'case_report', 'controlled_study', 'established']).default('theoretical'),
  references:       z.string().optional().nullable(),
  is_active:        z.boolean().default(true),
}).refine(d => d.medicine_a_id !== d.medicine_b_id, {
  message: 'Obat A dan obat B tidak boleh sama',
  path: ['medicine_b_id'],
});

const AllergySchema = z.object({
  patient_id:        z.string().uuid(),
  medicine_id:       z.string().uuid().optional().nullable(),
  allergen_name:     z.string().min(2),
  allergen_class:    z.string().optional().nullable(),
  reaction_type:     z.enum(['anaphylaxis', 'urticaria', 'rash', 'gi', 'other']).default('other'),
  severity:          z.enum(['mild', 'moderate', 'severe', 'life_threatening']).default('moderate'),
  onset_date:        z.string().datetime({ offset: true }).optional().nullable(),
  notes:             z.string().optional().nullable(),
});

// ─── Drug Interactions ────────────────────────────────────────────────────────

router.get('/', asyncHandler(async (req, res) => {
  const { severity, search, medicine_id, page = '1', limit = '30' } = req.query;

  const where = { is_active: true };
  if (severity)    where.severity = severity;
  if (medicine_id) where.OR = [{ medicine_a_id: medicine_id }, { medicine_b_id: medicine_id }];
  if (search) {
    where.AND = [{
      OR: [
        { clinical_effect: { contains: search, mode: 'insensitive' } },
        { mechanism:       { contains: search, mode: 'insensitive' } },
      ],
    }];
  }

  const take = Math.min(parseInt(limit) || 30, 100);
  const skip = (parseInt(page) - 1) * take;

  const [interactions, total] = await Promise.all([
    prisma.drug_interactions.findMany({
      where,
      include: {
        medicines_drug_interactions_medicine_a_idTomedicines: {
          select: { id: true, name: true, generic_name: true, drug_class: true },
        },
        medicines_drug_interactions_medicine_b_idTomedicines: {
          select: { id: true, name: true, generic_name: true, drug_class: true },
        },
      },
      orderBy: [{ severity: 'desc' }, { created_at: 'desc' }],
      take,
      skip,
    }),
    prisma.drug_interactions.count({ where }),
  ]);

  // Flatten relation names for easier client consumption
  const data = interactions.map(i => ({
    ...i,
    medicine_a: i.medicines_drug_interactions_medicine_a_idTomedicines,
    medicine_b: i.medicines_drug_interactions_medicine_b_idTomedicines,
    medicines_drug_interactions_medicine_a_idTomedicines: undefined,
    medicines_drug_interactions_medicine_b_idTomedicines: undefined,
  }));

  res.json({
    success: true,
    data,
    pagination: { page: parseInt(page), limit: take, total, total_pages: Math.ceil(total / take) },
  });
}));

router.get('/stats', asyncHandler(async (_req, res) => {
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
      by_severity: Object.fromEntries(bySeverity.map(b => [b.severity, b._count.id])),
    },
  });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const interaction = await prisma.drug_interactions.findUnique({
    where: { id: req.params.id },
    include: {
      medicines_drug_interactions_medicine_a_idTomedicines: { select: { id: true, name: true, generic_name: true } },
      medicines_drug_interactions_medicine_b_idTomedicines: { select: { id: true, name: true, generic_name: true } },
    },
  });
  if (!interaction) throw new ApiError(404, 'Interaksi obat tidak ditemukan');
  res.json({ success: true, data: interaction });
}));

router.post('/', requireRole(['admin', 'apoteker', 'dokter']), asyncHandler(async (req, res) => {
  const data = InteractionSchema.parse(req.body);

  // Prevent duplicate pairs (A-B or B-A)
  const existing = await prisma.drug_interactions.findFirst({
    where: {
      OR: [
        { medicine_a_id: data.medicine_a_id, medicine_b_id: data.medicine_b_id },
        { medicine_a_id: data.medicine_b_id, medicine_b_id: data.medicine_a_id },
      ],
      is_active: true,
    },
  });
  if (existing) throw new ApiError(409, 'Interaksi antara kedua obat ini sudah terdaftar');

  const interaction = await prisma.drug_interactions.create({ data });
  res.status(201).json({ success: true, data: interaction });
}));

router.put('/:id', requireRole(['admin', 'apoteker', 'dokter']), asyncHandler(async (req, res) => {
  const data = InteractionSchema.partial().parse(req.body);
  const interaction = await prisma.drug_interactions.update({
    where: { id: req.params.id },
    data: { ...data, updated_at: new Date() },
  });
  res.json({ success: true, data: interaction });
}));

router.delete('/:id', requireRole(['admin']), asyncHandler(async (req, res) => {
  // Soft delete
  await prisma.drug_interactions.update({
    where: { id: req.params.id },
    data: { is_active: false, updated_at: new Date() },
  });
  res.json({ success: true, data: { id: req.params.id } });
}));

// ─── Patient Drug Allergies ───────────────────────────────────────────────────

router.get('/allergies', asyncHandler(async (req, res) => {
  const { patient_id } = req.query;
  if (!patient_id) throw new ApiError(400, 'patient_id wajib diisi');

  const allergies = await prisma.patient_drug_allergies.findMany({
    where: { patient_id },
    include: { medicines: { select: { id: true, name: true, generic_name: true } } },
    orderBy: { severity: 'desc' },
  });

  res.json({ success: true, data: allergies });
}));

router.post('/allergies', requireRole(['admin', 'dokter', 'apoteker', 'perawat']), asyncHandler(async (req, res) => {
  const data = AllergySchema.parse(req.body);
  const allergy = await prisma.patient_drug_allergies.create({
    data: {
      ...data,
      onset_date: data.onset_date ? new Date(data.onset_date) : null,
      recorded_by: req.user.id,
    },
  });
  res.status(201).json({ success: true, data: allergy });
}));

router.delete('/allergies/:id', requireRole(['admin', 'dokter']), asyncHandler(async (req, res) => {
  await prisma.patient_drug_allergies.delete({ where: { id: req.params.id } });
  res.json({ success: true, data: { id: req.params.id } });
}));

export default router;

/**
 * IKP Routes — Insiden Keselamatan Pasien
 * Input validation via Zod
 */
import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { prisma } from '../config/database.js';

const router = Router();
router.use(authenticateToken);

// ── Zod Schemas ───────────────────────────────────────────────────────────────

const IncidentSchema = z.object({
  patient_id:            z.string().uuid().optional().nullable(),
  visit_id:              z.string().uuid().optional().nullable(),
  department_id:         z.string().uuid().optional().nullable(),
  incident_date:         z.string().datetime({ offset: true }),
  incident_type:         z.enum(['near_miss', 'sentinel', 'adverse_event', 'medication_error', 'fall', 'lainnya']),
  incident_category:     z.string().optional(),
  description:           z.string().min(10, 'Deskripsi minimal 10 karakter'),
  immediate_action:      z.string().optional(),
  contributing_factors:  z.array(z.string()).optional(),
  severity_grade:        z.enum(['1', '2', '3', '4', '5']).default('2'),
  harm_to_patient:       z.enum(['tidak_ada', 'ringan', 'sedang', 'berat', 'meninggal']).default('tidak_ada'),
  reporter_role:         z.string().optional(),
});

const IncidentUpdateSchema = IncidentSchema.partial().extend({
  status:              z.enum(['draft', 'reported', 'investigating', 'closed']).optional(),
  investigation_notes: z.string().optional(),
  corrective_action:   z.string().optional(),
  prevention_plan:     z.string().optional(),
  investigator_id:     z.string().uuid().optional().nullable(),
});

const StatusUpdateSchema = z.object({
  status: z.enum(['draft', 'reported', 'investigating', 'closed']),
  notes:  z.string().optional(),
});

// ── Helper: generate incident code ───────────────────────────────────────────
async function generateIncidentCode() {
  try {
    const result = await prisma.$queryRaw`SELECT generate_incident_code() AS code`;
    return result[0].code;
  } catch {
    // Fallback if DB function doesn't exist
    const prefix = `IKP-${new Date().getFullYear()}`;
    const count = await prisma.patient_incidents.count();
    return `${prefix}-${String(count + 1).padStart(5, '0')}`;
  }
}

// ── LIST ─────────────────────────────────────────────────────────────────────

router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, incident_type, department_id, from, to, search } = req.query;
  const take = Math.min(Number(limit), 100);
  const skip = (Number(page) - 1) * take;

  const where = {};
  if (status)        where.status = status;
  if (incident_type) where.incident_type = incident_type;
  if (department_id) where.department_id = department_id;
  if (from || to) {
    where.incident_date = {};
    if (from) where.incident_date.gte = new Date(from);
    if (to)   where.incident_date.lte = new Date(to);
  }
  if (search) where.OR = [
    { incident_code: { contains: search, mode: 'insensitive' } },
    { description:   { contains: search, mode: 'insensitive' } },
  ];

  const [incidents, total] = await Promise.all([
    prisma.patient_incidents.findMany({
      where, skip, take,
      orderBy: { incident_date: 'desc' },
      include: {
        patients:    { select: { full_name: true, medical_record_number: true } },
        departments: { select: { name: true } },
      },
    }),
    prisma.patient_incidents.count({ where }),
  ]);

  res.json({ success: true, data: incidents, meta: { total, page: Number(page), limit: take } });
}));

// ── DASHBOARD ────────────────────────────────────────────────────────────────

router.get('/dashboard', asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [total, thisMonth, byType, bySeverity, byStatus, openCount] = await Promise.all([
    prisma.patient_incidents.count(),
    prisma.patient_incidents.count({ where: { incident_date: { gte: startOfMonth } } }),
    prisma.patient_incidents.groupBy({ by: ['incident_type'],  _count: { id: true } }),
    prisma.patient_incidents.groupBy({ by: ['severity_grade'], _count: { id: true } }),
    prisma.patient_incidents.groupBy({ by: ['status'],         _count: { id: true } }),
    prisma.patient_incidents.count({ where: { status: { notIn: ['closed'] } } }),
  ]);

  res.json({ success: true, data: { total, thisMonth, byType, bySeverity, byStatus, openCount } });
}));

// ── GET ONE ───────────────────────────────────────────────────────────────────

router.get('/:id', asyncHandler(async (req, res) => {
  const incident = await prisma.patient_incidents.findUnique({
    where: { id: req.params.id },
    include: {
      patients:    { select: { full_name: true, medical_record_number: true } },
      visits:      { select: { visit_number: true, visit_date: true } },
      departments: { select: { name: true } },
    },
  });
  if (!incident) throw new ApiError('Insiden tidak ditemukan', 404);
  res.json({ success: true, data: incident });
}));

// ── CREATE ───────────────────────────────────────────────────────────────────

router.post('/', asyncHandler(async (req, res) => {
  const body = IncidentSchema.parse(req.body);
  const incident_code = await generateIncidentCode();

  const incident = await prisma.patient_incidents.create({
    data: {
      incident_code,
      ...body,
      incident_date: new Date(body.incident_date),
      status: 'draft',
      reported_by: req.user.id,
    },
    include: {
      patients:    { select: { full_name: true } },
      departments: { select: { name: true } },
    },
  });

  // Socket alert for sentinel events
  const io = req.app.get('io');
  if (io && (body.severity_grade === '5' || body.incident_type === 'sentinel')) {
    io.emit('sentinel_incident', {
      id: incident.id, code: incident.incident_code,
      type: incident.incident_type, severity: incident.severity_grade,
    });
  }

  res.status(201).json({ success: true, data: incident });
}));

// ── UPDATE ───────────────────────────────────────────────────────────────────

router.put('/:id', asyncHandler(async (req, res) => {
  const body = IncidentUpdateSchema.parse(req.body);

  const data = {
    ...body,
    incident_date: body.incident_date ? new Date(body.incident_date) : undefined,
    updated_at: new Date(),
  };
  if (body.status === 'closed') data.closed_at = new Date();

  const incident = await prisma.patient_incidents.update({
    where: { id: req.params.id },
    data,
  });

  res.json({ success: true, data: incident });
}));

// ── STATUS UPDATE ─────────────────────────────────────────────────────────────

router.patch('/:id/status', asyncHandler(async (req, res) => {
  const { status, notes } = StatusUpdateSchema.parse(req.body);

  const data = { status, updated_at: new Date() };
  if (status === 'closed') data.closed_at = new Date();
  if (notes) data.investigation_notes = notes;

  const incident = await prisma.patient_incidents.update({
    where: { id: req.params.id },
    data,
  });
  res.json({ success: true, data: incident });
}));

export default router;

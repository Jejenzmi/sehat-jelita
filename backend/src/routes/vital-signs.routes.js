/**
 * Vital Signs Time-Series Routes
 * Input validation via Zod
 */
import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { prisma } from '../config/database.js';

const router = Router();
router.use(authenticateToken);

// ── Zod Schemas ───────────────────────────────────────────────────────────────

const VitalSignsSchema = z.object({
  patient_id:       z.string().uuid(),
  visit_id:         z.string().uuid().optional().nullable(),
  recorded_at:      z.string().datetime({ offset: true }).optional(),
  systolic_bp:      z.coerce.number().int().min(0).max(350).optional().nullable(),
  diastolic_bp:     z.coerce.number().int().min(0).max(250).optional().nullable(),
  heart_rate:       z.coerce.number().int().min(0).max(350).optional().nullable(),
  respiratory_rate: z.coerce.number().int().min(0).max(100).optional().nullable(),
  spo2:             z.coerce.number().min(0).max(100).optional().nullable(),
  temperature:      z.coerce.number().min(25).max(45).optional().nullable(),
  temp_route:       z.enum(['oral', 'axillary', 'rectal', 'tympanic', 'forehead']).optional(),
  weight_kg:        z.coerce.number().min(0).max(500).optional().nullable(),
  height_cm:        z.coerce.number().min(0).max(300).optional().nullable(),
  pain_score:       z.coerce.number().int().min(0).max(10).optional().nullable(),
  gcs_total:        z.coerce.number().int().min(3).max(15).optional().nullable(),
  gcs_eye:          z.coerce.number().int().min(1).max(4).optional().nullable(),
  gcs_verbal:       z.coerce.number().int().min(1).max(5).optional().nullable(),
  gcs_motor:        z.coerce.number().int().min(1).max(6).optional().nullable(),
  blood_glucose:    z.coerce.number().min(0).max(1000).optional().nullable(),
  notes:            z.string().max(500).optional(),
  source:           z.enum(['manual', 'device', 'lis', 'hl7']).default('manual'),
}).refine(data => {
  // At least one vital sign must be provided
  const vitalFields = [
    'systolic_bp', 'heart_rate', 'respiratory_rate', 'spo2',
    'temperature', 'weight_kg', 'pain_score', 'gcs_total', 'blood_glucose',
  ];
  return vitalFields.some(f => data[f] != null);
}, { message: 'Minimal satu tanda vital harus diisi' });

// ── GET LIST ──────────────────────────────────────────────────────────────────

router.get('/', asyncHandler(async (req, res) => {
  const { patient_id, visit_id, from, to, limit = 50 } = req.query;

  if (!patient_id && !visit_id) {
    throw new ApiError(400, 'patient_id atau visit_id diperlukan');
  }

  const where = {};
  if (patient_id) where.patient_id = patient_id;
  if (visit_id)   where.visit_id   = visit_id;
  if (from || to) {
    where.recorded_at = {};
    if (from) where.recorded_at.gte = new Date(from);
    if (to)   where.recorded_at.lte = new Date(to);
  }

  const vitals = await prisma.vital_signs.findMany({
    where,
    orderBy: { recorded_at: 'desc' },
    take: Math.min(Number(limit), 200),
  });

  res.json({ success: true, data: vitals });
}));

// ── LATEST ────────────────────────────────────────────────────────────────────

router.get('/latest/:patient_id', asyncHandler(async (req, res) => {
  const latest = await prisma.vital_signs.findFirst({
    where: { patient_id: req.params.patient_id },
    orderBy: { recorded_at: 'desc' },
  });
  res.json({ success: true, data: latest });
}));

// ── TREND ─────────────────────────────────────────────────────────────────────

router.get('/trend/:patient_id', asyncHandler(async (req, res) => {
  const { days = 7, visit_id } = req.query;
  const since = new Date(Date.now() - Math.min(Number(days), 365) * 86400000);

  const where = { patient_id: req.params.patient_id, recorded_at: { gte: since } };
  if (visit_id) where.visit_id = visit_id;

  const vitals = await prisma.vital_signs.findMany({
    where,
    orderBy: { recorded_at: 'asc' },
    select: {
      recorded_at: true,
      systolic_bp: true, diastolic_bp: true, heart_rate: true,
      respiratory_rate: true, spo2: true, temperature: true,
      pain_score: true, gcs_total: true, blood_glucose: true,
      weight_kg: true, bmi: true,
    },
  });

  const latest = vitals[vitals.length - 1] || null;
  const latest_stats = latest ? {
    bp:   latest.systolic_bp ? `${latest.systolic_bp}/${latest.diastolic_bp}` : null,
    hr:   latest.heart_rate,
    rr:   latest.respiratory_rate,
    spo2: latest.spo2,
    temp: latest.temperature,
    pain: latest.pain_score,
    gcs:  latest.gcs_total,
  } : {};

  res.json({ success: true, data: { trend: vitals, latest_stats } });
}));

// ── CREATE ────────────────────────────────────────────────────────────────────

router.post('/', asyncHandler(async (req, res) => {
  const body = VitalSignsSchema.parse(req.body);

  // Auto-calculate BMI
  let bmi = null;
  if (body.weight_kg && body.height_cm) {
    const h = body.height_cm / 100;
    bmi = parseFloat((body.weight_kg / (h * h)).toFixed(2));
  }

  const vital = await prisma.vital_signs.create({
    data: {
      ...body,
      bmi,
      recorded_by: req.user.id,
      recorded_at: body.recorded_at ? new Date(body.recorded_at) : new Date(),
    },
  });

  // Real-time update via Socket.IO
  const io = req.app.get('io');
  if (io) {
    io.to(`patient:${body.patient_id}`).emit('vital_signs_updated', {
      patient_id: body.patient_id,
      visit_id:   body.visit_id,
      data: vital,
    });

    // Critical value alerts
    const alerts = [];
    if (body.systolic_bp && (body.systolic_bp >= 180 || body.systolic_bp < 90)) {
      alerts.push({ type: 'BP_CRITICAL', value: `${body.systolic_bp}/${body.diastolic_bp}` });
    }
    if (body.spo2 != null && body.spo2 < 90) {
      alerts.push({ type: 'SPO2_CRITICAL', value: body.spo2 });
    }
    if (body.gcs_total != null && body.gcs_total <= 8) {
      alerts.push({ type: 'GCS_CRITICAL', value: body.gcs_total });
    }
    if (body.temperature != null && (body.temperature >= 40 || body.temperature < 35)) {
      alerts.push({ type: 'TEMP_CRITICAL', value: body.temperature });
    }
    if (alerts.length > 0) {
      io.emit('vital_signs_alert', { patient_id: body.patient_id, visit_id: body.visit_id, alerts });
    }
  }

  res.status(201).json({ success: true, data: vital });
}));

// ── DELETE ────────────────────────────────────────────────────────────────────

router.delete('/:id', asyncHandler(async (req, res) => {
  await prisma.vital_signs.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Data tanda vital dihapus' });
}));

export default router;

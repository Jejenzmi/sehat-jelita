/**
 * SIMRS ZEN - ICU Routes
 * Manages ICU admissions, monitoring, and critical care
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { requireRole, ROLES } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();


// Validation schemas
const icuAdmissionSchema = z.object({
  patientId: z.string().uuid(),
  visitId: z.string().uuid(),
  bedId: z.string().uuid(),
  admissionReason: z.string(),
  admissionSource: z.enum(['ER', 'OR', 'WARD', 'TRANSFER', 'DIRECT']),
  diagnosisOnAdmission: z.string(),
  apacheScore: z.number().optional(),
  sofaScore: z.number().optional(),
  ventilatorRequired: z.boolean().default(false),
  isolationRequired: z.boolean().default(false),
  attendingPhysicianId: z.string().uuid()
});

const vitalSignsSchema = z.object({
  heartRate: z.number(),
  systolicBp: z.number(),
  diastolicBp: z.number(),
  meanArterialPressure: z.number().optional(),
  respiratoryRate: z.number(),
  temperature: z.number(),
  spo2: z.number(),
  fio2: z.number().optional(),
  gcsEye: z.number().min(1).max(4),
  gcsVerbal: z.number().min(1).max(5),
  gcsMotor: z.number().min(1).max(6),
  pupilLeft: z.string().optional(),
  pupilRight: z.string().optional(),
  cvp: z.number().optional(),
  urineOutput: z.number().optional(),
  notes: z.string().optional()
});

/**
 * GET /api/icu/patients
 * List current ICU patients
 */
router.get('/patients',
  requireRole([ROLES.ICU, ROLES.DOKTER, ROLES.PERAWAT]),
  asyncHandler(async (req, res) => {
    const patients = await prisma.icu_admissions.findMany({
      where: {
        discharge_date: null
      },
      include: {
        patients: {
          select: {
            id: true,
            medical_record_number: true,
            full_name: true,
            date_of_birth: true,
            blood_type: true,
            allergies: true
          }
        },
        beds: {
          select: {
            id: true,
            bed_number: true,
            rooms: { select: { room_name: true } }
          }
        },
        icu_vital_signs: {
          orderBy: { recorded_at: 'desc' },
          take: 1
        }
      },
      orderBy: { admission_date: 'desc' }
    });

    res.json({
      success: true,
      data: patients
    });
  })
);

/**
 * POST /api/icu/admissions
 * Admit patient to ICU
 */
router.post('/admissions',
  requireRole([ROLES.ICU, ROLES.DOKTER]),
  asyncHandler(async (req, res) => {
    const data = icuAdmissionSchema.parse(req.body);

    // Check bed availability
    const bed = await prisma.beds.findUnique({
      where: { id: data.bedId }
    });

    if (!bed || bed.status !== 'AVAILABLE') {
      throw new ApiError(409, 'Bed tidak tersedia');
    }

    const admission = await prisma.$transaction(async (tx) => {
      // Create admission
      const icuAdmission = await tx.icu_admissions.create({
        data: {
          patient_id: data.patientId,
          visit_id: data.visitId,
          bed_id: data.bedId,
          admission_date: new Date(),
          admission_reason: data.admissionReason,
          admission_source: data.admissionSource,
          diagnosis_on_admission: data.diagnosisOnAdmission,
          apache_score: data.apacheScore,
          sofa_score: data.sofaScore,
          ventilator_required: data.ventilatorRequired,
          isolation_required: data.isolationRequired,
          attending_physician_id: data.attendingPhysicianId,
          admitted_by: req.user.id
        }
      });

      // Update bed status
      await tx.beds.update({
        where: { id: data.bedId },
        data: {
          status: 'OCCUPIED',
          current_patient_id: data.patientId
        }
      });

      return icuAdmission;
    });

    // Emit real-time event
    req.app.get('io').to('icu').emit('new-admission', {
      admissionId: admission.id,
      bedId: data.bedId
    });

    res.status(201).json({
      success: true,
      data: admission
    });
  })
);

/**
 * POST /api/icu/admissions/:id/vitals
 * Record vital signs
 */
router.post('/admissions/:id/vitals',
  requireRole([ROLES.ICU, ROLES.PERAWAT]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = vitalSignsSchema.parse(req.body);

    const gcsTotal = data.gcsEye + data.gcsVerbal + data.gcsMotor;

    const vitals = await prisma.icu_vital_signs.create({
      data: {
        admission_id: id,
        recorded_at: new Date(),
        recorded_by: req.user.id,
        heart_rate: data.heartRate,
        systolic_bp: data.systolicBp,
        diastolic_bp: data.diastolicBp,
        mean_arterial_pressure: data.meanArterialPressure || 
          Math.round((data.systolicBp + 2 * data.diastolicBp) / 3),
        respiratory_rate: data.respiratoryRate,
        temperature: data.temperature,
        spo2: data.spo2,
        fio2: data.fio2,
        gcs_eye: data.gcsEye,
        gcs_verbal: data.gcsVerbal,
        gcs_motor: data.gcsMotor,
        gcs_total: gcsTotal,
        pupil_left: data.pupilLeft,
        pupil_right: data.pupilRight,
        cvp: data.cvp,
        urine_output: data.urineOutput,
        notes: data.notes
      }
    });

    // Broadcast vital signs for real-time monitoring
    req.app.get('io').to('icu').emit('vital-signs-update', {
      admissionId: id,
      vitals: vitals
    });

    // Check for critical values
    checkCriticalVitals(vitals, id, req.app.get('io'));

    res.status(201).json({
      success: true,
      data: vitals
    });
  })
);

/**
 * GET /api/icu/admissions/:id/vitals
 * Get vital signs history
 */
router.get('/admissions/:id/vitals',
  requireRole([ROLES.ICU, ROLES.DOKTER, ROLES.PERAWAT]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { hours = 24 } = req.query;

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const vitals = await prisma.icu_vital_signs.findMany({
      where: {
        admission_id: id,
        recorded_at: { gte: since }
      },
      orderBy: { recorded_at: 'asc' }
    });

    res.json({
      success: true,
      data: vitals
    });
  })
);

/**
 * POST /api/icu/admissions/:id/ventilator
 * Record ventilator settings
 */
router.post('/admissions/:id/ventilator',
  requireRole([ROLES.ICU, ROLES.PERAWAT]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const ventData = req.body;

    const record = await prisma.icu_ventilator_records.create({
      data: {
        admission_id: id,
        recorded_at: new Date(),
        recorded_by: req.user.id,
        mode: ventData.mode,
        fio2: ventData.fio2,
        peep: ventData.peep,
        tidal_volume: ventData.tidalVolume,
        respiratory_rate_set: ventData.respiratoryRateSet,
        respiratory_rate_actual: ventData.respiratoryRateActual,
        pip: ventData.pip,
        plateau_pressure: ventData.plateauPressure,
        ie_ratio: ventData.ieRatio,
        minute_volume: ventData.minuteVolume,
        notes: ventData.notes
      }
    });

    res.status(201).json({
      success: true,
      data: record
    });
  })
);

/**
 * POST /api/icu/admissions/:id/intake-output
 * Record intake/output
 */
router.post('/admissions/:id/intake-output',
  requireRole([ROLES.ICU, ROLES.PERAWAT]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { type, category, amount, route, notes } = req.body;

    const record = await prisma.icu_intake_output.create({
      data: {
        admission_id: id,
        recorded_at: new Date(),
        recorded_by: req.user.id,
        type, // 'INTAKE' or 'OUTPUT'
        category, // 'IV_FLUID', 'ORAL', 'URINE', 'DRAIN', etc.
        amount,
        route,
        notes
      }
    });

    res.status(201).json({
      success: true,
      data: record
    });
  })
);

/**
 * GET /api/icu/admissions/:id/balance
 * Get fluid balance summary
 */
router.get('/admissions/:id/balance',
  requireRole([ROLES.ICU, ROLES.DOKTER, ROLES.PERAWAT]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { date } = req.query;

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const records = await prisma.icu_intake_output.findMany({
      where: {
        admission_id: id,
        recorded_at: {
          gte: targetDate,
          lt: nextDate
        }
      }
    });

    const intake = records
      .filter(r => r.type === 'INTAKE')
      .reduce((sum, r) => sum + r.amount, 0);

    const output = records
      .filter(r => r.type === 'OUTPUT')
      .reduce((sum, r) => sum + r.amount, 0);

    res.json({
      success: true,
      data: {
        date: targetDate.toISOString().split('T')[0],
        intake,
        output,
        balance: intake - output,
        records
      }
    });
  })
);

/**
 * PUT /api/icu/admissions/:id/discharge
 * Discharge from ICU
 */
router.put('/admissions/:id/discharge',
  requireRole([ROLES.ICU, ROLES.DOKTER]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { 
      dischargeDestination, 
      diagnosisOnDischarge,
      dischargeCondition,
      lengthOfStay,
      notes 
    } = req.body;

    const admission = await prisma.$transaction(async (tx) => {
      const updated = await tx.icu_admissions.update({
        where: { id },
        data: {
          discharge_date: new Date(),
          discharge_destination: dischargeDestination,
          diagnosis_on_discharge: diagnosisOnDischarge,
          discharge_condition: dischargeCondition,
          length_of_stay_hours: lengthOfStay,
          discharge_notes: notes,
          discharged_by: req.user.id
        }
      });

      // Free up bed
      await tx.beds.update({
        where: { id: updated.bed_id },
        data: {
          status: 'CLEANING',
          current_patient_id: null
        }
      });

      return updated;
    });

    req.app.get('io').to('icu').emit('patient-discharge', {
      admissionId: id,
      bedId: admission.bed_id
    });

    res.json({
      success: true,
      data: admission
    });
  })
);

/**
 * GET /api/icu/beds
 * Get ICU bed status
 */
router.get('/beds',
  requireRole([ROLES.ICU, ROLES.DOKTER, ROLES.PERAWAT, ROLES.MANAJEMEN]),
  asyncHandler(async (req, res) => {
    const beds = await prisma.beds.findMany({
      where: {
        rooms: {
          room_type: { in: ['ICU', 'ICCU', 'PICU', 'NICU'] }
        }
      },
      include: {
        rooms: true,
        patients: {
          select: {
            id: true,
            medical_record_number: true,
            full_name: true
          }
        }
      }
    });

    const summary = {
      total: beds.length,
      available: beds.filter(b => b.status === 'AVAILABLE').length,
      occupied: beds.filter(b => b.status === 'OCCUPIED').length,
      cleaning: beds.filter(b => b.status === 'CLEANING').length,
      maintenance: beds.filter(b => b.status === 'MAINTENANCE').length
    };

    res.json({
      success: true,
      data: { beds, summary }
    });
  })
);

// Helper function to check critical vital signs
function checkCriticalVitals(vitals, admissionId, io) {
  const alerts = [];

  if (vitals.heart_rate < 40 || vitals.heart_rate > 150) {
    alerts.push({ type: 'HEART_RATE', value: vitals.heart_rate, severity: 'CRITICAL' });
  }
  if (vitals.systolic_bp < 80 || vitals.systolic_bp > 200) {
    alerts.push({ type: 'BLOOD_PRESSURE', value: `${vitals.systolic_bp}/${vitals.diastolic_bp}`, severity: 'CRITICAL' });
  }
  if (vitals.spo2 < 90) {
    alerts.push({ type: 'SPO2', value: vitals.spo2, severity: 'CRITICAL' });
  }
  if (vitals.gcs_total < 8) {
    alerts.push({ type: 'GCS', value: vitals.gcs_total, severity: 'CRITICAL' });
  }
  if (vitals.temperature < 35 || vitals.temperature > 40) {
    alerts.push({ type: 'TEMPERATURE', value: vitals.temperature, severity: 'WARNING' });
  }

  if (alerts.length > 0) {
    io.to('icu').emit('critical-alert', {
      admissionId,
      alerts,
      timestamp: new Date()
    });
  }
}

export default router;

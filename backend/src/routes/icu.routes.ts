/**
 * SIMRS ZEN - ICU Routes
 * Manages ICU admissions, monitoring, and critical care
 */

import { Router, Request, Response } from 'express';
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

// Type definitions
interface ICUAdmissionBody extends z.infer<typeof icuAdmissionSchema> { }
interface VitalSignsBody extends z.infer<typeof vitalSignsSchema> { }
interface VentilatorBody {
  mode?: string;
  fio2?: number;
  peep?: number;
  tidalVolume?: number;
  respiratoryRateSet?: number;
  respiratoryRateActual?: number;
  pip?: number;
  plateauPressure?: number;
  ieRatio?: string;
  minuteVolume?: number;
  notes?: string;
}
interface IntakeOutputBody {
  type: 'INTAKE' | 'OUTPUT';
  category: string;
  amount: number;
  route?: string;
  notes?: string;
}
interface DischargeBody {
  dischargeDestination?: string;
  diagnosisOnDischarge?: string;
  dischargeCondition?: string;
  lengthOfStay?: number;
  notes?: string;
}

type VitalsQuery = {
  hours?: string;
};

type BalanceQuery = {
  date?: string;
};

type MonitoringQuery = {
  admission_id?: string;
  limit?: string;
};

/**
 * GET /api/icu/patients
 * List current ICU patients
 */
router.get('/patients',
  requireRole([ROLES.ICU, ROLES.DOKTER, ROLES.PERAWAT]),
  asyncHandler(async (req: Request, res: Response) => {
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
            birth_date: true,
            blood_type: true,
            allergy_notes: true
          }
        },
        icu_vital_signs: {
          orderBy: { recorded_at: 'desc' },
          take: 1
        }
      },
      orderBy: { admission_date: 'desc' }
    });

    // Manually join beds data since there's no direct Prisma relation
    const enrichedPatients = await Promise.all(
      patients.map(async (p) => {
        let bedInfo = null;
        if (p.bed_id) {
          bedInfo = await prisma.beds.findUnique({
            where: { id: p.bed_id },
            select: { id: true, bed_number: true, rooms: { select: { room_name: true } } }
          }).catch(() => null);
        }
        return { ...p, beds: bedInfo };
      })
    );

    res.json({
      success: true,
      data: enrichedPatients
    });
  })
);

/**
 * POST /api/icu/admissions
 * Admit patient to ICU
 */
router.post('/admissions',
  requireRole([ROLES.ICU, ROLES.DOKTER]),
  asyncHandler(async (req: Request<Record<string, string>, any, ICUAdmissionBody>, res: Response) => {
    const data = icuAdmissionSchema.parse(req.body);

    // Check bed availability
    const bed = await prisma.beds.findUnique({
      where: { id: data.bedId }
    });

    if (!bed || bed.status !== 'available') {
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
          admitted_by: req.user!.id
        }
      });

      // Update bed status
      await tx.beds.update({
        where: { id: data.bedId },
        data: {
          status: 'occupied',
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
  asyncHandler(async (req: Request<{ id: string }, any, VitalSignsBody>, res: Response) => {
    const { id } = req.params;
    const data = vitalSignsSchema.parse(req.body);

    const gcsTotal = data.gcsEye + data.gcsVerbal + data.gcsMotor;

    const vitals = await prisma.icu_vital_signs.create({
      data: {
        admission_id: id,
        recorded_at: new Date(),
        recorded_by: req.user!.id,
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
  asyncHandler(async (req: Request<{ id: string }, any, any, VitalsQuery>, res: Response) => {
    const { id } = req.params;
    const { hours = '24' } = req.query;

    const since = new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000);

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
  asyncHandler(async (req: Request<{ id: string }, any, VentilatorBody>, res: Response) => {
    const { id } = req.params;
    const ventData = req.body;

    const record = await prisma.icu_ventilator_records.create({
      data: {
        admission_id: id,
        recorded_at: new Date(),
        recorded_by: req.user!.id,
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
  asyncHandler(async (req: Request<{ id: string }, any, IntakeOutputBody>, res: Response) => {
    const { id } = req.params;
    const { type, category, amount, route, notes } = req.body;

    const record = await prisma.icu_intake_output.create({
      data: {
        admission_id: id,
        recorded_at: new Date(),
        recorded_by: req.user!.id,
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
  asyncHandler(async (req: Request<{ id: string }, any, any, BalanceQuery>, res: Response) => {
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
      .reduce((sum, r) => sum + r.amount.toNumber(), 0);

    const output = records
      .filter(r => r.type === 'OUTPUT')
      .reduce((sum, r) => sum + r.amount.toNumber(), 0);

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
  asyncHandler(async (req: Request<{ id: string }, any, DischargeBody>, res: Response) => {
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
          // TODO: discharge_destination, diagnosis_on_discharge, discharge_condition, length_of_stay_hours, discharge_notes, discharged_by not in schema
        }
      });

      // Free up bed
      await tx.beds.update({
        where: { id: updated.bed_id },
        data: {
          status: 'maintenance',
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
  asyncHandler(async (req: Request, res: Response) => {
    const beds = await prisma.beds.findMany({
      where: {
        rooms: {
          room_type: { in: ['ICU', 'ICCU', 'PICU', 'NICU'] }
        }
      },
      include: {
        rooms: true
        // TODO: patients relation doesn't exist on beds - only through visits
      }
    });

    const summary = {
      total: beds.length,
      available: beds.filter(b => b.status === 'available').length,
      occupied: beds.filter(b => b.status === 'occupied').length,
      // TODO: 'cleaning' not a valid BedStatus - was removed
      maintenance: beds.filter(b => b.status === 'maintenance').length
    };

    res.json({
      success: true,
      data: { beds, summary }
    });
  })
);

/**
 * GET /api/icu/monitoring
 * Get recent vital signs across all ICU patients
 */
router.get('/monitoring',
  requireRole([ROLES.ICU, ROLES.DOKTER, ROLES.PERAWAT, ROLES.MANAJEMEN]),
  asyncHandler(async (req: Request<Record<string, string>, any, any, MonitoringQuery>, res: Response) => {
    const { admission_id, limit = '50' } = req.query;

    const where: Record<string, any> = {};
    if (admission_id) where.admission_id = admission_id;

    const vitals = await prisma.icu_vital_signs.findMany({
      where,
      include: {
        icu_admissions: {
          include: {
            patients: { select: { id: true, full_name: true, medical_record_number: true } }
          }
        }
      },
      orderBy: { recorded_at: 'desc' },
      take: parseInt(limit),
    });

    res.json({ success: true, data: vitals });
  })
);

// Helper function to check critical vital signs
interface VitalsRecord {
  heart_rate: number | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  spo2: any; // Decimal in Prisma
  gcs_total: number | null;
  temperature: any; // Decimal in Prisma
}

function checkCriticalVitals(vitals: VitalsRecord, admissionId: string, io: any): void {
  const alerts: Array<{ type: string; value: number | string; severity: string }> = [];

  const hr = vitals.heart_rate;
  const sysBp = vitals.systolic_bp;
  const diaBp = vitals.diastolic_bp;
  const spo2 = typeof vitals.spo2?.toNumber === 'function' ? vitals.spo2.toNumber() : Number(vitals.spo2);
  const gcs = vitals.gcs_total;
  const temp = typeof vitals.temperature?.toNumber === 'function' ? vitals.temperature.toNumber() : Number(vitals.temperature);

  if (hr && (hr < 40 || hr > 150)) {
    alerts.push({ type: 'HEART_RATE', value: hr, severity: 'CRITICAL' });
  }
  if (sysBp && (sysBp < 80 || sysBp > 200)) {
    alerts.push({ type: 'BLOOD_PRESSURE', value: `${sysBp}/${diaBp}`, severity: 'CRITICAL' });
  }
  if (spo2 && spo2 < 90) {
    alerts.push({ type: 'SPO2', value: spo2, severity: 'CRITICAL' });
  }
  if (gcs && gcs < 8) {
    alerts.push({ type: 'GCS', value: gcs, severity: 'CRITICAL' });
  }
  if (temp && (temp < 35 || temp > 40)) {
    alerts.push({ type: 'TEMPERATURE', value: temp, severity: 'WARNING' });
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

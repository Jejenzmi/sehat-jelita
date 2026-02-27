/**
 * SIMRS ZEN - Emergency (IGD) Routes
 * Manages emergency admissions, triage, and acute care
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { requireRole, ROLES } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();


// Validation schemas
const triageSchema = z.object({
  patientId: z.string().uuid(),
  chiefComplaint: z.string(),
  arrivalMode: z.enum(['WALK_IN', 'AMBULANCE', 'REFERRED', 'POLICE']),
  triageLevel: z.enum(['RESUSCITATION', 'EMERGENT', 'URGENT', 'LESS_URGENT', 'NON_URGENT']), // ESI 1-5
  vitalSigns: z.object({
    bloodPressure: z.string(),
    heartRate: z.number(),
    respiratoryRate: z.number(),
    temperature: z.number(),
    spo2: z.number(),
    gcs: z.number().optional(),
    painScale: z.number().min(0).max(10).optional()
  }),
  allergies: z.string().optional(),
  currentMedications: z.string().optional(),
  accompanyingPerson: z.string().optional(),
  notes: z.string().optional()
});

/**
 * GET /api/emergency/patients
 * List current ER patients
 */
router.get('/patients',
  requireRole([ROLES.DOKTER, ROLES.PERAWAT, ROLES.PENDAFTARAN]),
  asyncHandler(async (req, res) => {
    const patients = await prisma.emergency_visits.findMany({
      where: {
        status: { notIn: ['DISCHARGED', 'ADMITTED', 'TRANSFERRED', 'DECEASED'] }
      },
      include: {
        patients: {
          select: {
            id: true,
            medical_record_number: true,
            full_name: true,
            date_of_birth: true,
            gender: true,
            blood_type: true
          }
        },
        visits: { select: { id: true, visit_number: true } }
      },
      orderBy: [
        { triage_level: 'asc' }, // Most critical first
        { arrival_time: 'asc' }  // Then by arrival time
      ]
    });

    res.json({
      success: true,
      data: patients
    });
  })
);

/**
 * POST /api/emergency/triage
 * Register and triage new ER patient
 */
router.post('/triage',
  requireRole([ROLES.PERAWAT, ROLES.DOKTER]),
  asyncHandler(async (req, res) => {
    const data = triageSchema.parse(req.body);

    const emergencyVisit = await prisma.$transaction(async (tx) => {
      // Create visit
      const visitNumber = await generateERVisitNumber();
      
      const visit = await tx.visits.create({
        data: {
          visit_number: visitNumber,
          patient_id: data.patientId,
          visit_type: 'EMERGENCY',
          status: 'IN_PROGRESS',
          checkin_time: new Date()
        }
      });

      // Create emergency visit record
      const erVisit = await tx.emergency_visits.create({
        data: {
          visit_id: visit.id,
          patient_id: data.patientId,
          arrival_time: new Date(),
          arrival_mode: data.arrivalMode,
          chief_complaint: data.chiefComplaint,
          triage_level: data.triageLevel,
          triage_time: new Date(),
          triaged_by: req.user.id,
          vital_signs: data.vitalSigns,
          allergies: data.allergies,
          current_medications: data.currentMedications,
          accompanying_person: data.accompanyingPerson,
          notes: data.notes,
          status: 'TRIAGED'
        }
      });

      return { visit, erVisit };
    });

    // Emit real-time notification for critical cases
    if (['RESUSCITATION', 'EMERGENT'].includes(data.triageLevel)) {
      req.app.get('io').to('emergency').emit('critical-patient', {
        visitId: emergencyVisit.erVisit.id,
        triageLevel: data.triageLevel,
        chiefComplaint: data.chiefComplaint
      });
    }

    res.status(201).json({
      success: true,
      data: emergencyVisit
    });
  })
);

/**
 * PUT /api/emergency/:id/assign-doctor
 * Assign doctor to ER patient
 */
router.put('/:id/assign-doctor',
  requireRole([ROLES.PERAWAT, ROLES.DOKTER]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { doctorId, bedNumber } = req.body;

    const updated = await prisma.emergency_visits.update({
      where: { id },
      data: {
        attending_doctor_id: doctorId,
        bed_number: bedNumber,
        status: 'IN_TREATMENT',
        treatment_start_time: new Date()
      }
    });

    res.json({
      success: true,
      data: updated
    });
  })
);

/**
 * POST /api/emergency/:id/treatment
 * Record treatment/intervention
 */
router.post('/:id/treatment',
  requireRole([ROLES.DOKTER, ROLES.PERAWAT]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { treatmentType, description, medications, procedures } = req.body;

    const treatment = await prisma.emergency_treatments.create({
      data: {
        emergency_visit_id: id,
        treatment_type: treatmentType,
        description,
        medications,
        procedures,
        performed_by: req.user.id,
        performed_at: new Date()
      }
    });

    res.status(201).json({
      success: true,
      data: treatment
    });
  })
);

/**
 * PUT /api/emergency/:id/disposition
 * Determine patient disposition (discharge/admit/transfer)
 */
router.put('/:id/disposition',
  requireRole([ROLES.DOKTER]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { 
      disposition,
      diagnosis,
      dischargeMedications,
      followUpInstructions,
      admissionWard,
      transferDestination,
      deathTime,
      deathCause
    } = req.body;

    const erVisit = await prisma.$transaction(async (tx) => {
      const updateData = {
        status: disposition,
        diagnosis,
        disposition_time: new Date(),
        disposition_by: req.user.id
      };

      switch (disposition) {
        case 'DISCHARGED':
          updateData.discharge_medications = dischargeMedications;
          updateData.follow_up_instructions = followUpInstructions;
          break;
        case 'ADMITTED':
          updateData.admission_ward = admissionWard;
          break;
        case 'TRANSFERRED':
          updateData.transfer_destination = transferDestination;
          break;
        case 'DECEASED':
          updateData.death_time = deathTime;
          updateData.death_cause = deathCause;
          break;
      }

      const updated = await tx.emergency_visits.update({
        where: { id },
        data: updateData
      });

      // Update visit status
      await tx.visits.update({
        where: { id: updated.visit_id },
        data: { 
          status: disposition === 'ADMITTED' ? 'IN_PROGRESS' : 'COMPLETED',
          checkout_time: disposition !== 'ADMITTED' ? new Date() : null
        }
      });

      return updated;
    });

    res.json({
      success: true,
      data: erVisit
    });
  })
);

/**
 * GET /api/emergency/stats
 * ER statistics
 */
router.get('/stats',
  requireRole([ROLES.DOKTER, ROLES.PERAWAT, ROLES.MANAJEMEN]),
  asyncHandler(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      currentPatients,
      todayArrivals,
      byTriageLevel,
      avgWaitTime
    ] = await Promise.all([
      // Current patients in ER
      prisma.emergency_visits.count({
        where: {
          status: { notIn: ['DISCHARGED', 'ADMITTED', 'TRANSFERRED', 'DECEASED'] }
        }
      }),
      // Today's arrivals
      prisma.emergency_visits.count({
        where: { arrival_time: { gte: today } }
      }),
      // By triage level
      prisma.emergency_visits.groupBy({
        by: ['triage_level'],
        where: { arrival_time: { gte: today } },
        _count: true
      }),
      // Average wait time (triage to treatment)
      prisma.$queryRaw`
        SELECT AVG(EXTRACT(EPOCH FROM (treatment_start_time - triage_time)) / 60) as avg_wait_minutes
        FROM emergency_visits
        WHERE arrival_time >= ${today}
        AND treatment_start_time IS NOT NULL
      `
    ]);

    res.json({
      success: true,
      data: {
        currentPatients,
        todayArrivals,
        byTriageLevel,
        avgWaitTimeMinutes: avgWaitTime[0]?.avg_wait_minutes || 0
      }
    });
  })
);

/**
 * GET /api/emergency/board
 * ER tracking board data
 */
router.get('/board',
  requireRole([ROLES.DOKTER, ROLES.PERAWAT]),
  asyncHandler(async (req, res) => {
    const patients = await prisma.emergency_visits.findMany({
      where: {
        status: { notIn: ['DISCHARGED', 'ADMITTED', 'TRANSFERRED', 'DECEASED'] }
      },
      select: {
        id: true,
        bed_number: true,
        triage_level: true,
        chief_complaint: true,
        status: true,
        arrival_time: true,
        triage_time: true,
        treatment_start_time: true,
        patients: {
          select: {
            medical_record_number: true,
            full_name: true,
            gender: true,
            date_of_birth: true
          }
        },
        doctors: {
          select: { full_name: true }
        }
      },
      orderBy: [
        { triage_level: 'asc' },
        { arrival_time: 'asc' }
      ]
    });

    // Calculate wait times
    const now = new Date();
    const board = patients.map(p => ({
      ...p,
      waitingMinutes: p.treatment_start_time 
        ? null 
        : Math.floor((now - new Date(p.arrival_time)) / 60000)
    }));

    res.json({
      success: true,
      data: board
    });
  })
);

// Helper function
async function generateERVisitNumber() {
  const today = new Date();
  const prefix = `ER${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  
  const lastVisit = await prisma.visits.findFirst({
    where: { 
      visit_number: { startsWith: prefix },
      visit_type: 'EMERGENCY'
    },
    orderBy: { visit_number: 'desc' }
  });

  const sequence = lastVisit 
    ? parseInt(lastVisit.visit_number.slice(-4)) + 1 
    : 1;

  return `${prefix}${String(sequence).padStart(4, '0')}`;
}

export default router;

/**
 * SIMRS ZEN - Surgery/Operating Room Routes
 * Manages surgery scheduling, OR management, and surgical records
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireRole, ROLES } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();

router.use(authenticateToken);

// Validation schemas
const surgerySchema = z.object({
  patientId: z.string().uuid(),
  visitId: z.string().uuid(),
  procedureName: z.string(),
  procedureCode: z.string().optional(),
  surgeonId: z.string().uuid(),
  anesthesiologistId: z.string().uuid().optional(),
  scheduledDate: z.string(),
  scheduledStartTime: z.string(),
  estimatedDuration: z.number().min(15), // minutes
  operatingRoomId: z.string().uuid(),
  surgeryType: z.enum(['ELECTIVE', 'EMERGENCY', 'URGENT']),
  anesthesiaType: z.enum(['GENERAL', 'REGIONAL', 'LOCAL', 'SEDATION']),
  preOpDiagnosis: z.string(),
  notes: z.string().optional()
});

/**
 * GET /api/surgery/schedule
 * Get surgery schedule with filters
 */
router.get('/schedule',
  requireRole([ROLES.BEDAH, ROLES.DOKTER, ROLES.PERAWAT]),
  asyncHandler(async (req, res) => {
    const { date, roomId, surgeonId, status } = req.query;
    
    const where = {};
    if (date) {
      where.scheduled_date = new Date(date);
    }
    if (roomId) where.operating_room_id = roomId;
    if (surgeonId) where.surgeon_id = surgeonId;
    if (status) where.status = status;

    const surgeries = await prisma.surgeries.findMany({
      where,
      include: {
        patients: { select: { id: true, medical_record_number: true, full_name: true, blood_type: true } },
        operating_rooms: { select: { id: true, room_name: true, room_number: true } },
        anesthesia_records: true
      },
      orderBy: [
        { scheduled_date: 'asc' },
        { scheduled_start_time: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: surgeries
    });
  })
);

/**
 * POST /api/surgery
 * Schedule new surgery
 */
router.post('/',
  requireRole([ROLES.BEDAH, ROLES.DOKTER]),
  asyncHandler(async (req, res) => {
    const data = surgerySchema.parse(req.body);

    // Check OR availability
    const conflict = await prisma.surgeries.findFirst({
      where: {
        operating_room_id: data.operatingRoomId,
        scheduled_date: new Date(data.scheduledDate),
        status: { notIn: ['CANCELLED', 'COMPLETED'] },
        OR: [
          {
            scheduled_start_time: { lte: data.scheduledStartTime },
            scheduled_end_time: { gt: data.scheduledStartTime }
          }
        ]
      }
    });

    if (conflict) {
      throw new ApiError(409, 'Ruang operasi tidak tersedia pada waktu tersebut');
    }

    // Calculate end time
    const startTime = new Date(`${data.scheduledDate}T${data.scheduledStartTime}`);
    const endTime = new Date(startTime.getTime() + data.estimatedDuration * 60000);

    const surgery = await prisma.surgeries.create({
      data: {
        patient_id: data.patientId,
        visit_id: data.visitId,
        procedure_name: data.procedureName,
        procedure_code: data.procedureCode,
        surgeon_id: data.surgeonId,
        anesthesiologist_id: data.anesthesiologistId,
        scheduled_date: new Date(data.scheduledDate),
        scheduled_start_time: data.scheduledStartTime,
        scheduled_end_time: endTime.toTimeString().slice(0, 5),
        estimated_duration: data.estimatedDuration,
        operating_room_id: data.operatingRoomId,
        surgery_type: data.surgeryType,
        anesthesia_type: data.anesthesiaType,
        pre_op_diagnosis: data.preOpDiagnosis,
        notes: data.notes,
        status: 'SCHEDULED',
        created_by: req.user.id
      }
    });

    res.status(201).json({
      success: true,
      data: surgery
    });
  })
);

/**
 * PUT /api/surgery/:id/checkin
 * Patient check-in to pre-op
 */
router.put('/:id/checkin',
  requireRole([ROLES.BEDAH, ROLES.PERAWAT]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { preOpNotes, consentSigned, npoDuration } = req.body;

    const surgery = await prisma.surgeries.update({
      where: { id },
      data: {
        status: 'CHECKED_IN',
        pre_op_checkin_time: new Date(),
        pre_op_notes: preOpNotes,
        consent_signed: consentSigned,
        npo_duration_hours: npoDuration
      }
    });

    req.app.get('io').to('surgery').emit('patient-checkin', { surgeryId: id });

    res.json({
      success: true,
      data: surgery
    });
  })
);

/**
 * PUT /api/surgery/:id/start
 * Start surgery
 */
router.put('/:id/start',
  requireRole([ROLES.BEDAH]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { teamMembers } = req.body;

    const surgery = await prisma.surgeries.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        actual_start_time: new Date(),
        surgical_team: teamMembers
      }
    });

    // Update OR status
    await prisma.operating_rooms.update({
      where: { id: surgery.operating_room_id },
      data: { status: 'IN_USE' }
    });

    req.app.get('io').to('surgery').emit('surgery-started', { surgeryId: id });

    res.json({
      success: true,
      data: surgery
    });
  })
);

/**
 * PUT /api/surgery/:id/complete
 * Complete surgery
 */
router.put('/:id/complete',
  requireRole([ROLES.BEDAH]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { 
      postOpDiagnosis, 
      procedureDetails,
      complications,
      estimatedBloodLoss,
      specimens,
      drains,
      postOpInstructions
    } = req.body;

    const surgery = await prisma.surgeries.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        actual_end_time: new Date(),
        post_op_diagnosis: postOpDiagnosis,
        procedure_details: procedureDetails,
        complications,
        estimated_blood_loss: estimatedBloodLoss,
        specimens_collected: specimens,
        drains_inserted: drains,
        post_op_instructions: postOpInstructions
      }
    });

    // Free up OR
    await prisma.operating_rooms.update({
      where: { id: surgery.operating_room_id },
      data: { status: 'CLEANING' }
    });

    res.json({
      success: true,
      data: surgery
    });
  })
);

/**
 * GET /api/surgery/operating-rooms
 * List operating rooms with status
 */
router.get('/operating-rooms',
  requireRole([ROLES.BEDAH, ROLES.PERAWAT, ROLES.MANAJEMEN]),
  asyncHandler(async (req, res) => {
    const rooms = await prisma.operating_rooms.findMany({
      include: {
        surgeries: {
          where: {
            scheduled_date: new Date(),
            status: { notIn: ['CANCELLED', 'COMPLETED'] }
          },
          orderBy: { scheduled_start_time: 'asc' }
        }
      }
    });

    res.json({
      success: true,
      data: rooms
    });
  })
);

/**
 * POST /api/surgery/:id/anesthesia
 * Add anesthesia record
 */
router.post('/:id/anesthesia',
  requireRole([ROLES.BEDAH, ROLES.DOKTER]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const anesthesiaData = req.body;

    const record = await prisma.anesthesia_records.create({
      data: {
        surgery_id: id,
        anesthesiologist_name: anesthesiaData.anesthesiologistName,
        anesthesiologist_id: anesthesiaData.anesthesiologistId,
        pre_anesthesia_assessment: anesthesiaData.preAssessment,
        airway_assessment: anesthesiaData.airwayAssessment,
        npo_status: anesthesiaData.npoStatus,
        premedication: anesthesiaData.premedication,
        induction_agents: anesthesiaData.inductionAgents,
        maintenance_agents: anesthesiaData.maintenanceAgents,
        airway_device: anesthesiaData.airwayDevice,
        ett_size: anesthesiaData.ettSize,
        intubation_grade: anesthesiaData.intubationGrade,
        iv_fluids: anesthesiaData.ivFluids,
        blood_products: anesthesiaData.bloodProducts,
        vital_signs_timeline: anesthesiaData.vitalSigns,
        estimated_blood_loss: anesthesiaData.bloodLoss,
        urine_output: anesthesiaData.urineOutput,
        emergence_time: anesthesiaData.emergenceTime,
        extubation_time: anesthesiaData.extubationTime,
        pacu_admission_time: anesthesiaData.pacuAdmissionTime,
        aldrete_score_admission: anesthesiaData.aldreteAdmission,
        aldrete_score_discharge: anesthesiaData.aldreteDischarge,
        anesthesia_complications: anesthesiaData.complications,
        notes: anesthesiaData.notes
      }
    });

    res.status(201).json({
      success: true,
      data: record
    });
  })
);

/**
 * GET /api/surgery/stats
 * Surgery statistics
 */
router.get('/stats',
  requireRole([ROLES.BEDAH, ROLES.MANAJEMEN]),
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    
    const where = {};
    if (startDate && endDate) {
      where.scheduled_date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const [total, byType, byStatus, complications] = await Promise.all([
      prisma.surgeries.count({ where }),
      prisma.surgeries.groupBy({
        by: ['surgery_type'],
        where,
        _count: true
      }),
      prisma.surgeries.groupBy({
        by: ['status'],
        where,
        _count: true
      }),
      prisma.surgeries.count({
        where: {
          ...where,
          complications: { not: null }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        total,
        byType,
        byStatus,
        complicationRate: total > 0 ? (complications / total * 100).toFixed(2) : 0
      }
    });
  })
);

export default router;

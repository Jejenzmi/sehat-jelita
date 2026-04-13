/**
 * SIMRS ZEN - Surgery/Operating Room Routes
 * Manages surgery scheduling, OR management, and surgical records
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { requireRole, ROLES } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();


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

// Type definitions
interface SurgeryBody extends z.infer<typeof surgerySchema> { }
interface CheckinBody {
  preOpNotes?: string;
  consentSigned?: boolean;
  npoDuration?: number;
}
interface StartBody {
  teamMembers?: string[];
}
interface CompleteBody {
  postOpDiagnosis?: string;
  procedureDetails?: string;
  complications?: string;
  estimatedBloodLoss?: number;
  specimens?: string[];
  drains?: string[];
  postOpInstructions?: string;
}
interface AnesthesiaBody {
  anesthesiologistName?: string;
  anesthesiologistId?: string;
  preAssessment?: string;
  airwayAssessment?: string;
  npoStatus?: boolean;
  premedication?: string;
  inductionAgents?: string[];
  maintenanceAgents?: string[];
  airwayDevice?: string;
  ettSize?: number;
  intubationGrade?: string;
  ivFluids?: string;
  bloodProducts?: string;
  vitalSigns?: any[];
  bloodLoss?: number;
  urineOutput?: number;
  emergenceTime?: Date;
  extubationTime?: Date;
  pacuAdmissionTime?: Date;
  aldreteAdmission?: number;
  aldreteDischarge?: number;
  complications?: string;
  notes?: string;
}
interface TeamBody {
  surgery_id: string;
  staff_id?: string;
  staff_name: string;
  role: string;
  is_primary?: boolean;
  notes?: string;
}
interface ChecklistBody {
  surgery_id: string;
  [key: string]: any;
}

type SurgeryScheduleQuery = {
  date?: string;
  roomId?: string;
  surgeonId?: string;
  status?: string;
};

type StatsQuery = {
  startDate?: string;
  endDate?: string;
};

type ListQuery = {
  surgery_id?: string;
};

/**
 * GET /api/surgery/schedule
 * Get surgery schedule with filters
 */
router.get('/schedule',
  requireRole([ROLES.BEDAH, ROLES.DOKTER, ROLES.PERAWAT]),
  asyncHandler(async (req: Request<Record<string, string>, any, any, SurgeryScheduleQuery>, res: Response) => {
    const { date, roomId, surgeonId, status } = req.query;

    const where: Record<string, any> = {};
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
        operating_rooms: { select: { id: true, room_name: true } },
        anesthesia_records: true
      },
      orderBy: [
        { scheduled_date: 'asc' },
        { scheduled_time: 'asc' }
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
  asyncHandler(async (req: Request<Record<string, string>, any, SurgeryBody>, res: Response) => {
    const data = surgerySchema.parse(req.body);

    // Check OR availability
    const conflict = await prisma.surgeries.findFirst({
      where: {
        operating_room_id: data.operatingRoomId,
        scheduled_date: new Date(data.scheduledDate),
        status: { notIn: ['CANCELLED', 'COMPLETED'] },
        // TODO: Add time overlap check once scheduled_end_time field is added to schema
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
        surgery_number: `SRG${Date.now()}`,
        patient_id: data.patientId,
        visit_id: data.visitId,
        procedure_name: data.procedureName,
        procedure_code: data.procedureCode,
        surgeon_id: data.surgeonId,
        anesthesiologist_id: data.anesthesiologistId,
        scheduled_date: new Date(data.scheduledDate),
        scheduled_time: data.scheduledStartTime,
        // TODO: scheduled_end_time, estimated_duration not in schema yet
        operating_room_id: data.operatingRoomId,
        surgery_type: data.surgeryType,
        anesthesia_type: data.anesthesiaType,
        pre_diagnosis: data.preOpDiagnosis,
        // TODO: notes field does not exist in surgeries schema
        status: 'SCHEDULED',
        // created_by not in schema
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
  asyncHandler(async (req: Request<{ id: string }, any, CheckinBody>, res: Response) => {
    const { id } = req.params;
    const { preOpNotes, consentSigned, npoDuration } = req.body;

    const surgery = await prisma.surgeries.update({
      where: { id },
      data: {
        status: 'CHECKED_IN',
        // TODO: pre_op_checkin_time, pre_op_notes, consent_signed, npo_duration_hours not in schema
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
  asyncHandler(async (req: Request<{ id: string }, any, StartBody>, res: Response) => {
    const { id } = req.params;
    const { teamMembers } = req.body;

    const surgery = await prisma.surgeries.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        actual_start_time: new Date(),
        // TODO: surgical_team not in schema - manage via surgery_teams table instead
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
  asyncHandler(async (req: Request<{ id: string }, any, CompleteBody>, res: Response) => {
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
        post_diagnosis: postOpDiagnosis,
        procedure_notes: procedureDetails,
        complications,
        blood_loss: estimatedBloodLoss,
        // TODO: specimens_collected, drains_inserted, post_op_instructions not in schema
      }
    });

    // Free up OR
    await prisma.operating_rooms.update({
      where: { id: surgery.operating_room_id },
      data: { status: 'cleaning' }
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
  asyncHandler(async (req: Request, res: Response) => {
    const rooms = await prisma.operating_rooms.findMany({
      include: {
        surgeries: {
          where: {
            scheduled_date: new Date(),
            status: { notIn: ['CANCELLED', 'COMPLETED'] }
          },
          orderBy: { scheduled_time: 'asc' }
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
  asyncHandler(async (req: Request<{ id: string }, any, AnesthesiaBody>, res: Response) => {
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
        // TODO: pacu_admission_time, aldrete_score_admission, aldrete_score_discharge not in schema
        complications: anesthesiaData.complications,
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
  asyncHandler(async (req: Request<Record<string, string>, any, any, StatsQuery>, res: Response) => {
    const { startDate, endDate } = req.query;

    const where: Record<string, any> = {};
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

// ============================================
// SURGERY TEAMS
// ============================================

/**
 * GET /api/surgery/teams
 */
router.get('/teams', asyncHandler(async (req: Request<Record<string, string>, any, any, ListQuery>, res: Response) => {
  const { surgery_id } = req.query;
  const where: Record<string, any> = {};
  if (surgery_id) where.surgery_id = surgery_id;

  const teams = await prisma.surgery_teams.findMany({
    where,
    orderBy: { created_at: 'asc' },
  });
  res.json({ success: true, data: teams });
}));

/**
 * POST /api/surgery/teams
 */
router.post('/teams', requireRole([ROLES.BEDAH, ROLES.DOKTER]), asyncHandler(async (req: Request<Record<string, string>, any, TeamBody>, res: Response) => {
  const { surgery_id, staff_id, staff_name, role, is_primary, notes } = req.body;
  const member = await prisma.surgery_teams.create({
    data: { surgery_id, staff_id, staff_name, role, is_primary: is_primary ?? false, notes },
  });
  res.status(201).json({ success: true, data: member });
}));

/**
 * DELETE /api/surgery/teams/:id
 */
router.delete('/teams/:id', requireRole([ROLES.BEDAH, ROLES.DOKTER]), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  await prisma.surgery_teams.delete({ where: { id } });
  res.json({ success: true, message: 'Team member removed' });
}));

// ============================================
// SURGICAL SAFETY CHECKLISTS
// ============================================

/**
 * GET /api/surgery/safety-checklists
 */
router.get('/safety-checklists', asyncHandler(async (req: Request<Record<string, string>, any, any, ListQuery>, res: Response) => {
  const { surgery_id } = req.query;
  const where: Record<string, any> = {};
  if (surgery_id) where.surgery_id = surgery_id;

  const checklists = await prisma.surgical_safety_checklists.findMany({
    where,
    orderBy: { created_at: 'desc' },
  });
  res.json({ success: true, data: checklists });
}));

/**
 * POST /api/surgery/safety-checklists
 */
router.post('/safety-checklists', requireRole([ROLES.BEDAH, ROLES.DOKTER, ROLES.PERAWAT]), asyncHandler(async (req: Request<Record<string, string>, any, ChecklistBody>, res: Response) => {
  const data = req.body;
  const checklist = await prisma.surgical_safety_checklists.upsert({
    where: { surgery_id: data.surgery_id },
    update: data,
    create: data,
  });
  res.status(201).json({ success: true, data: checklist });
}));

export default router;

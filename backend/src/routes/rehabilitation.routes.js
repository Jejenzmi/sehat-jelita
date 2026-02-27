/**
 * SIMRS ZEN - Rehabilitation Routes
 * Manages physiotherapy, occupational therapy, and rehab programs
 */

import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireRole, ROLES } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();

router.use(authenticateToken);

/**
 * GET /api/rehabilitation/patients
 * List rehab patients
 */
router.get('/patients',
  requireRole([ROLES.REHABILITASI, ROLES.DOKTER]),
  asyncHandler(async (req, res) => {
    const { status, therapyType } = req.query;

    const where = {};
    if (status) where.status = status;
    if (therapyType) where.therapy_type = therapyType;

    const patients = await prisma.rehabilitation_cases.findMany({
      where,
      include: {
        patients: {
          select: { id: true, medical_record_number: true, full_name: true, date_of_birth: true }
        },
        doctors: { select: { full_name: true, specialization: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json({ success: true, data: patients });
  })
);

/**
 * POST /api/rehabilitation/cases
 * Create new rehab case
 */
router.post('/cases',
  requireRole([ROLES.REHABILITASI, ROLES.DOKTER]),
  asyncHandler(async (req, res) => {
    const {
      patientId,
      visitId,
      referringDoctorId,
      diagnosis,
      therapyType,
      goals,
      estimatedSessions,
      frequency,
      notes
    } = req.body;

    const caseNumber = await generateRehabCaseNumber();

    const rehabCase = await prisma.rehabilitation_cases.create({
      data: {
        case_number: caseNumber,
        patient_id: patientId,
        visit_id: visitId,
        referring_doctor_id: referringDoctorId,
        diagnosis,
        therapy_type: therapyType,
        goals,
        estimated_sessions: estimatedSessions,
        frequency,
        notes,
        status: 'ACTIVE',
        created_by: req.user.id
      }
    });

    res.status(201).json({ success: true, data: rehabCase });
  })
);

/**
 * GET /api/rehabilitation/schedule
 * Get therapy schedule
 */
router.get('/schedule',
  requireRole([ROLES.REHABILITASI]),
  asyncHandler(async (req, res) => {
    const { date, therapistId, therapyType } = req.query;

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const where = {
      scheduled_date: { gte: targetDate, lt: nextDate }
    };
    if (therapistId) where.therapist_id = therapistId;
    if (therapyType) where.rehabilitation_cases = { therapy_type: therapyType };

    const sessions = await prisma.rehabilitation_sessions.findMany({
      where,
      include: {
        rehabilitation_cases: {
          include: {
            patients: { select: { full_name: true, medical_record_number: true } }
          }
        },
        therapists: { select: { full_name: true } }
      },
      orderBy: { scheduled_time: 'asc' }
    });

    res.json({ success: true, data: sessions });
  })
);

/**
 * POST /api/rehabilitation/sessions
 * Schedule therapy session
 */
router.post('/sessions',
  requireRole([ROLES.REHABILITASI]),
  asyncHandler(async (req, res) => {
    const {
      caseId,
      therapistId,
      scheduledDate,
      scheduledTime,
      duration,
      sessionType,
      notes
    } = req.body;

    const session = await prisma.rehabilitation_sessions.create({
      data: {
        case_id: caseId,
        therapist_id: therapistId,
        scheduled_date: new Date(scheduledDate),
        scheduled_time: scheduledTime,
        duration_minutes: duration,
        session_type: sessionType,
        notes,
        status: 'SCHEDULED'
      }
    });

    res.status(201).json({ success: true, data: session });
  })
);

/**
 * PUT /api/rehabilitation/sessions/:id/complete
 * Complete therapy session with notes
 */
router.put('/sessions/:id/complete',
  requireRole([ROLES.REHABILITASI]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      treatmentProvided,
      patientResponse,
      painLevel,
      functionalProgress,
      homeExercises,
      nextSessionGoals,
      notes
    } = req.body;

    const session = await prisma.rehabilitation_sessions.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        actual_start_time: new Date(),
        actual_end_time: new Date(),
        treatment_provided: treatmentProvided,
        patient_response: patientResponse,
        pain_level: painLevel,
        functional_progress: functionalProgress,
        home_exercises: homeExercises,
        next_session_goals: nextSessionGoals,
        session_notes: notes,
        completed_by: req.user.id
      }
    });

    // Update case completed sessions count
    await prisma.rehabilitation_cases.update({
      where: { id: session.case_id },
      data: { completed_sessions: { increment: 1 } }
    });

    res.json({ success: true, data: session });
  })
);

/**
 * GET /api/rehabilitation/therapy-types
 * Get available therapy types
 */
router.get('/therapy-types',
  requireRole([ROLES.REHABILITASI, ROLES.DOKTER]),
  asyncHandler(async (req, res) => {
    const types = await prisma.therapy_types.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' }
    });

    res.json({ success: true, data: types });
  })
);

/**
 * GET /api/rehabilitation/cases/:id/progress
 * Get patient progress report
 */
router.get('/cases/:id/progress',
  requireRole([ROLES.REHABILITASI, ROLES.DOKTER]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const [rehabCase, sessions] = await Promise.all([
      prisma.rehabilitation_cases.findUnique({
        where: { id },
        include: {
          patients: true,
          doctors: true
        }
      }),
      prisma.rehabilitation_sessions.findMany({
        where: { case_id: id, status: 'COMPLETED' },
        orderBy: { scheduled_date: 'asc' }
      })
    ]);

    // Calculate progress metrics
    const progressMetrics = {
      totalSessions: sessions.length,
      avgPainLevel: sessions.reduce((sum, s) => sum + (s.pain_level || 0), 0) / sessions.length || 0,
      completionRate: (sessions.length / (rehabCase.estimated_sessions || 1)) * 100
    };

    res.json({
      success: true,
      data: { case: rehabCase, sessions, metrics: progressMetrics }
    });
  })
);

/**
 * GET /api/rehabilitation/stats
 */
router.get('/stats',
  requireRole([ROLES.REHABILITASI, ROLES.MANAJEMEN]),
  asyncHandler(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      activeCases,
      todaySessions,
      byTherapyType,
      completedThisMonth
    ] = await Promise.all([
      prisma.rehabilitation_cases.count({ where: { status: 'ACTIVE' } }),
      prisma.rehabilitation_sessions.count({
        where: {
          scheduled_date: today,
          status: { not: 'CANCELLED' }
        }
      }),
      prisma.rehabilitation_cases.groupBy({
        by: ['therapy_type'],
        where: { status: 'ACTIVE' },
        _count: true
      }),
      prisma.rehabilitation_sessions.count({
        where: {
          status: 'COMPLETED',
          scheduled_date: {
            gte: new Date(today.getFullYear(), today.getMonth(), 1)
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: { activeCases, todaySessions, byTherapyType, completedThisMonth }
    });
  })
);

// Helper
async function generateRehabCaseNumber() {
  const today = new Date();
  const prefix = `RH${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
  
  const last = await prisma.rehabilitation_cases.findFirst({
    where: { case_number: { startsWith: prefix } },
    orderBy: { case_number: 'desc' }
  });

  const seq = last ? parseInt(last.case_number.slice(-4)) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

export default router;

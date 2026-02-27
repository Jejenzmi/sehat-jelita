/**
 * SIMRS ZEN - Medical Education Routes
 * Handles trainees, rotations, research, and academic activities
 */

import { Router } from 'express';
import { prisma } from '../config/database.js';
import { requireRole, ROLES } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();


// ============================================
// MEDICAL TRAINEES
// ============================================

/**
 * GET /api/education/trainees
 * List medical trainees
 */
router.get('/trainees',
  requireRole([ROLES.DOKTER, ROLES.ADMIN, ROLES.MANAJEMEN]),
  asyncHandler(async (req, res) => {
    const { trainee_type, status, institution } = req.query;

    const where = {};
    if (trainee_type) where.trainee_type = trainee_type;
    if (status) where.status = status;
    if (institution) where.institution = { contains: institution, mode: 'insensitive' };

    const trainees = await prisma.medical_trainees.findMany({
      where,
      include: {
        clinical_rotations: {
          where: { status: 'active' },
          include: { departments: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json({
      success: true,
      data: trainees
    });
  })
);

/**
 * POST /api/education/trainees
 * Register new trainee
 */
router.post('/trainees',
  requireRole([ROLES.ADMIN, ROLES.DOKTER]),
  asyncHandler(async (req, res) => {
    const {
      traineeCode, fullName, traineeType, institution, program,
      startDate, endDate, supervisorId, email, phone, address, notes
    } = req.body;

    const trainee = await prisma.medical_trainees.create({
      data: {
        trainee_code: traineeCode,
        full_name: fullName,
        trainee_type: traineeType, // koas, residen, ppds, observer
        institution,
        program,
        start_date: startDate,
        end_date: endDate,
        primary_supervisor_id: supervisorId,
        email,
        phone,
        address,
        status: 'active',
        notes,
        created_by: req.user.id
      }
    });

    res.status(201).json({
      success: true,
      data: trainee
    });
  })
);

// ============================================
// CLINICAL ROTATIONS
// ============================================

/**
 * GET /api/education/rotations
 * List clinical rotations
 */
router.get('/rotations', asyncHandler(async (req, res) => {
  const { trainee_id, department_id, status } = req.query;

  const where = {};
  if (trainee_id) where.trainee_id = trainee_id;
  if (department_id) where.department_id = department_id;
  if (status) where.status = status;

  const rotations = await prisma.clinical_rotations.findMany({
    where,
    include: {
      medical_trainees: true,
      departments: true,
      doctors: true // supervisor
    },
    orderBy: { start_date: 'desc' }
  });

  res.json({
    success: true,
    data: rotations
  });
}));

/**
 * POST /api/education/rotations
 * Schedule clinical rotation
 */
router.post('/rotations',
  requireRole([ROLES.DOKTER, ROLES.ADMIN]),
  asyncHandler(async (req, res) => {
    const { traineeId, departmentId, supervisorId, startDate, endDate, rotationType, objectives, notes } = req.body;

    // Check for overlapping rotations
    const overlap = await prisma.clinical_rotations.findFirst({
      where: {
        trainee_id: traineeId,
        status: 'active',
        OR: [
          { start_date: { lte: endDate }, end_date: { gte: startDate } }
        ]
      }
    });

    if (overlap) {
      throw new ApiError(409, 'Trainee sudah memiliki rotasi aktif di periode tersebut');
    }

    const rotation = await prisma.clinical_rotations.create({
      data: {
        trainee_id: traineeId,
        department_id: departmentId,
        supervisor_id: supervisorId,
        start_date: startDate,
        end_date: endDate,
        rotation_type: rotationType,
        objectives,
        status: 'scheduled',
        notes
      },
      include: {
        medical_trainees: true,
        departments: true
      }
    });

    res.status(201).json({
      success: true,
      data: rotation
    });
  })
);

/**
 * PATCH /api/education/rotations/:id/evaluate
 * Submit rotation evaluation
 */
router.patch('/rotations/:id/evaluate',
  requireRole([ROLES.DOKTER]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { evaluationScore, evaluationNotes, competenciesAchieved, areasForImprovement } = req.body;

    const rotation = await prisma.clinical_rotations.update({
      where: { id },
      data: {
        evaluation_score: evaluationScore,
        evaluation_notes: evaluationNotes,
        competencies_achieved: competenciesAchieved,
        areas_for_improvement: areasForImprovement,
        status: 'completed',
        evaluated_by: req.user.id,
        evaluated_at: new Date()
      }
    });

    res.json({
      success: true,
      data: rotation
    });
  })
);

// ============================================
// ACADEMIC ACTIVITIES
// ============================================

/**
 * GET /api/education/activities
 * List academic activities (seminars, workshops, etc.)
 */
router.get('/activities', asyncHandler(async (req, res) => {
  const { activity_type, department_id, upcoming } = req.query;

  const where = {};
  if (activity_type) where.activity_type = activity_type;
  if (department_id) where.department_id = department_id;
  if (upcoming === 'true') {
    where.activity_date = { gte: new Date().toISOString().split('T')[0] };
  }

  const activities = await prisma.academic_activities.findMany({
    where,
    include: { departments: true },
    orderBy: { activity_date: 'asc' }
  });

  res.json({
    success: true,
    data: activities
  });
}));

/**
 * POST /api/education/activities
 * Create academic activity
 */
router.post('/activities',
  requireRole([ROLES.DOKTER, ROLES.ADMIN]),
  asyncHandler(async (req, res) => {
    const {
      activityType, title, description, activityDate, startTime, endTime,
      location, departmentId, speakerNames, maxParticipants, skpPoints, notes
    } = req.body;

    // Generate activity code
    const year = new Date().getFullYear();
    const count = await prisma.academic_activities.count({
      where: { activity_code: { startsWith: `ACT-${year}` } }
    });
    const activityCode = `ACT-${year}-${String(count + 1).padStart(4, '0')}`;

    const activity = await prisma.academic_activities.create({
      data: {
        activity_code: activityCode,
        activity_type: activityType, // seminar, workshop, journal_club, case_presentation, grand_round
        title,
        description,
        activity_date: activityDate,
        start_time: startTime,
        end_time: endTime,
        location,
        department_id: departmentId,
        speaker_names: speakerNames,
        max_participants: maxParticipants,
        skp_points: skpPoints,
        status: 'scheduled',
        notes,
        organizer_id: req.user.id
      }
    });

    res.status(201).json({
      success: true,
      data: activity
    });
  })
);

/**
 * POST /api/education/activities/:id/register
 * Register for activity
 */
router.post('/activities/:id/register', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const activity = await prisma.academic_activities.findUnique({
    where: { id }
  });

  if (!activity) {
    throw new ApiError(404, 'Kegiatan tidak ditemukan');
  }

  if (activity.max_participants && activity.registered_count >= activity.max_participants) {
    throw new ApiError(409, 'Kuota peserta sudah penuh');
  }

  // Check if already registered
  const existing = await prisma.activity_registrations.findFirst({
    where: { activity_id: id, user_id: req.user.id }
  });

  if (existing) {
    throw new ApiError(409, 'Anda sudah terdaftar');
  }

  await prisma.$transaction([
    prisma.activity_registrations.create({
      data: {
        activity_id: id,
        user_id: req.user.id,
        registered_at: new Date()
      }
    }),
    prisma.academic_activities.update({
      where: { id },
      data: { registered_count: { increment: 1 } }
    })
  ]);

  res.json({
    success: true,
    message: 'Pendaftaran berhasil'
  });
}));

// ============================================
// RESEARCH PROJECTS
// ============================================

/**
 * GET /api/education/research
 * List research projects
 */
router.get('/research',
  requireRole([ROLES.DOKTER, ROLES.ADMIN]),
  asyncHandler(async (req, res) => {
    const { status, department_id } = req.query;

    const where = {};
    if (status) where.status = status;
    if (department_id) where.department_id = department_id;

    const projects = await prisma.research_projects.findMany({
      where,
      include: { departments: true },
      orderBy: { created_at: 'desc' }
    });

    res.json({
      success: true,
      data: projects
    });
  })
);

/**
 * POST /api/education/research
 * Create research project
 */
router.post('/research',
  requireRole([ROLES.DOKTER]),
  asyncHandler(async (req, res) => {
    const {
      projectCode, title, principalInvestigator, coInvestigators,
      departmentId, startDate, endDate, fundingSource, budget,
      ethicsApprovalNumber, ethicsApprovalDate, abstract, methodology, notes
    } = req.body;

    const project = await prisma.research_projects.create({
      data: {
        project_code: projectCode,
        title,
        principal_investigator: principalInvestigator,
        co_investigators: coInvestigators,
        department_id: departmentId,
        start_date: startDate,
        end_date: endDate,
        funding_source: fundingSource,
        budget,
        ethics_approval_number: ethicsApprovalNumber,
        ethics_approval_date: ethicsApprovalDate,
        abstract,
        methodology,
        status: 'proposal',
        notes,
        created_by: req.user.id
      }
    });

    res.status(201).json({
      success: true,
      data: project
    });
  })
);

export default router;

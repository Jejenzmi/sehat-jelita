/**
 * SIMRS ZEN - Hemodialysis Routes
 * Handles dialysis scheduling, sessions, and machine management
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { requireRole, ROLES } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();


// ============================================
// DIALYSIS MACHINES
// ============================================

/**
 * GET /api/dialysis/machines
 * List dialysis machines
 */
router.get('/machines', asyncHandler(async (req, res) => {
  const { status } = req.query;

  const where = status ? { status } : {};

  const machines = await prisma.dialysis_machines.findMany({
    where,
    orderBy: { machine_number: 'asc' }
  });

  res.json({
    success: true,
    data: machines
  });
}));

/**
 * POST /api/dialysis/machines
 * Add new dialysis machine
 */
router.post('/machines',
  requireRole([ROLES.ADMIN, ROLES.HEMODIALISA]),
  asyncHandler(async (req, res) => {
    const { machineNumber, brand, model, serialNumber, installationDate, lastMaintenanceDate, nextMaintenanceDate, location, notes } = req.body;

    const machine = await prisma.dialysis_machines.create({
      data: {
        machine_number: machineNumber,
        brand,
        model,
        serial_number: serialNumber,
        installation_date: installationDate,
        last_maintenance_date: lastMaintenanceDate,
        next_maintenance_date: nextMaintenanceDate,
        location,
        status: 'available',
        notes
      }
    });

    res.status(201).json({
      success: true,
      data: machine
    });
  })
);

/**
 * PATCH /api/dialysis/machines/:id/status
 * Update machine status
 */
router.patch('/machines/:id/status',
  requireRole([ROLES.HEMODIALISA, ROLES.ADMIN]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;

    const machine = await prisma.dialysis_machines.update({
      where: { id },
      data: { status, notes }
    });

    res.json({
      success: true,
      data: machine
    });
  })
);

// ============================================
// DIALYSIS SCHEDULES
// ============================================

/**
 * GET /api/dialysis/schedules
 * Get dialysis schedules
 */
router.get('/schedules', asyncHandler(async (req, res) => {
  const { date, patient_id, machine_id } = req.query;

  const where = {};
  if (date) where.schedule_date = date;
  if (patient_id) where.patient_id = patient_id;
  if (machine_id) where.machine_id = machine_id;

  const schedules = await prisma.dialysis_schedules.findMany({
    where,
    include: {
      patients: true,
      dialysis_machines: true
    },
    orderBy: [
      { schedule_date: 'asc' },
      { shift: 'asc' }
    ]
  });

  res.json({
    success: true,
    data: schedules
  });
}));

/**
 * POST /api/dialysis/schedules
 * Create dialysis schedule
 */
router.post('/schedules',
  requireRole([ROLES.HEMODIALISA, ROLES.PENDAFTARAN]),
  asyncHandler(async (req, res) => {
    const { patientId, machineId, scheduleDate, shift, duration, accessType, dialyzerType, notes, isRecurring, recurringPattern } = req.body;

    // Check machine availability
    const conflict = await prisma.dialysis_schedules.findFirst({
      where: {
        machine_id: machineId,
        schedule_date: scheduleDate,
        shift,
        status: { notIn: ['cancelled'] }
      }
    });

    if (conflict) {
      throw new ApiError(409, 'Mesin sudah dijadwalkan untuk shift tersebut');
    }

    const schedule = await prisma.dialysis_schedules.create({
      data: {
        patient_id: patientId,
        machine_id: machineId,
        schedule_date: scheduleDate,
        shift, // 1, 2, 3
        duration_hours: duration || 4,
        access_type: accessType, // av_fistula, av_graft, catheter
        dialyzer_type: dialyzerType,
        status: 'scheduled',
        is_recurring: isRecurring,
        recurring_pattern: recurringPattern,
        notes,
        created_by: req.user.id
      },
      include: {
        patients: true,
        dialysis_machines: true
      }
    });

    res.status(201).json({
      success: true,
      data: schedule
    });
  })
);

// ============================================
// DIALYSIS SESSIONS
// ============================================

/**
 * GET /api/dialysis/sessions
 * List dialysis sessions
 */
router.get('/sessions', asyncHandler(async (req, res) => {
  const { status, patient_id, date_from, date_to, page = 1, limit = 50 } = req.query;

  const where = {};
  if (status) where.status = status;
  if (date_from || date_to) {
    where.start_time = {};
    if (date_from) where.start_time.gte = new Date(date_from);
    if (date_to) where.start_time.lte = new Date(date_to);
  }
  if (patient_id) {
    where.dialysis_schedules = { patient_id };
  }

  const [total, sessions] = await Promise.all([
    prisma.dialysis_sessions.count({ where }),
    prisma.dialysis_sessions.findMany({
      where,
      include: {
        dialysis_schedules: {
          include: {
            patients: { select: { id: true, full_name: true, medical_record_number: true } },
            dialysis_machines: { select: { id: true, machine_name: true } },
          }
        }
      },
      orderBy: { start_time: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    }),
  ]);

  res.json({
    success: true,
    data: sessions,
    pagination: { page: parseInt(page), limit: parseInt(limit), total },
  });
}));

/**
 * POST /api/dialysis/sessions/start
 * Start dialysis session
 */
router.post('/sessions/start',
  requireRole([ROLES.HEMODIALISA, ROLES.PERAWAT]),
  asyncHandler(async (req, res) => {
    const { scheduleId, preWeight, preBp, prePulse, preTemp, accessCondition, dialysateSolution, heparinDose, bloodFlowRate, dialysateFlowRate, notes } = req.body;

    const session = await prisma.$transaction(async (tx) => {
      // Update schedule status
      await tx.dialysis_schedules.update({
        where: { id: scheduleId },
        data: { status: 'in_progress' }
      });

      // Update machine status
      const schedule = await tx.dialysis_schedules.findUnique({
        where: { id: scheduleId }
      });

      await tx.dialysis_machines.update({
        where: { id: schedule.machine_id },
        data: { status: 'in_use' }
      });

      // Create session record
      const sess = await tx.dialysis_sessions.create({
        data: {
          schedule_id: scheduleId,
          start_time: new Date(),
          pre_weight: preWeight,
          pre_bp: preBp,
          pre_pulse: prePulse,
          pre_temp: preTemp,
          access_condition: accessCondition,
          dialysate_solution: dialysateSolution,
          heparin_dose: heparinDose,
          blood_flow_rate: bloodFlowRate,
          dialysate_flow_rate: dialysateFlowRate,
          status: 'ongoing',
          notes,
          nurse_id: req.user.id
        },
        include: {
          dialysis_schedules: {
            include: { patients: true }
          }
        }
      });

      return sess;
    });

    res.status(201).json({
      success: true,
      data: session
    });
  })
);

/**
 * POST /api/dialysis/sessions/:id/vitals
 * Record intradialytic vitals
 */
router.post('/sessions/:id/vitals',
  requireRole([ROLES.HEMODIALISA, ROLES.PERAWAT]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { bp, pulse, temp, bloodFlowRate, venousPressure, transmembranePressure, ufRate, notes } = req.body;

    const vital = await prisma.dialysis_vitals.create({
      data: {
        session_id: id,
        recorded_at: new Date(),
        bp,
        pulse,
        temp,
        blood_flow_rate: bloodFlowRate,
        venous_pressure: venousPressure,
        tmp: transmembranePressure,
        uf_rate: ufRate,
        notes,
        recorded_by: req.user.id
      }
    });

    res.status(201).json({
      success: true,
      data: vital
    });
  })
);

/**
 * POST /api/dialysis/sessions/:id/complete
 * Complete dialysis session
 */
router.post('/sessions/:id/complete',
  requireRole([ROLES.HEMODIALISA, ROLES.PERAWAT]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { postWeight, postBp, postPulse, postTemp, totalUfVolume, actualDuration, complications, accessConditionPost, notes } = req.body;

    const session = await prisma.$transaction(async (tx) => {
      const sess = await tx.dialysis_sessions.update({
        where: { id },
        data: {
          end_time: new Date(),
          post_weight: postWeight,
          post_bp: postBp,
          post_pulse: postPulse,
          post_temp: postTemp,
          total_uf_volume: totalUfVolume,
          actual_duration_minutes: actualDuration,
          complications,
          access_condition_post: accessConditionPost,
          status: 'completed',
          notes
        },
        include: {
          dialysis_schedules: true
        }
      });

      // Update schedule status
      await tx.dialysis_schedules.update({
        where: { id: sess.schedule_id },
        data: { status: 'completed' }
      });

      // Free up machine
      await tx.dialysis_machines.update({
        where: { id: sess.dialysis_schedules.machine_id },
        data: { status: 'available' }
      });

      return sess;
    });

    res.json({
      success: true,
      data: session
    });
  })
);

// ============================================
// DIALYSIS REPORTS
// ============================================

/**
 * GET /api/dialysis/reports/patient/:patientId
 * Get patient dialysis history
 */
router.get('/reports/patient/:patientId', asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { limit = 10 } = req.query;

  const sessions = await prisma.dialysis_sessions.findMany({
    where: {
      dialysis_schedules: { patient_id: patientId }
    },
    include: {
      dialysis_schedules: {
        include: { dialysis_machines: true }
      },
      dialysis_vitals: true
    },
    orderBy: { start_time: 'desc' },
    take: parseInt(limit)
  });

  res.json({
    success: true,
    data: sessions
  });
}));

export default router;

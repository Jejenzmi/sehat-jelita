/**
 * SIMRS ZEN - Dialysis Routes
 * Handles dialysis machines, schedules, sessions, and analytics
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// ============================================
// DIALYSIS MACHINES CRUD
// ============================================

/**
 * GET /api/dialysis/machines
 * Get all dialysis machines with optional status filter
 */
router.get('/machines', asyncHandler(async (req: Request, res: Response) => {
  const { status, is_active } = req.query;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (is_active !== undefined) where.is_active = is_active === 'true';

  const machines = await prisma.dialysis_machines.findMany({
    where,
    orderBy: { machine_code: 'asc' }
  });

  res.json({ success: true, data: machines });
}));

/**
 * GET /api/dialysis/machines/:id
 * Get a specific dialysis machine
 */
router.get('/machines/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const machine = await prisma.dialysis_machines.findUnique({
    where: { id },
    include: {
      dialysis_schedules: {
        where: { status: 'scheduled' },
        orderBy: { scheduled_date: 'asc' },
        take: 10
      }
    }
  });

  if (!machine) {
    return res.status(404).json({ success: false, error: 'Mesin dialysis tidak ditemukan' });
  }

  res.json({ success: true, data: machine });
}));

/**
 * POST /api/dialysis/machines
 * Create a new dialysis machine
 */
router.post('/machines', asyncHandler(async (req: Request, res: Response) => {
  const {
    machine_code,
    machine_name,
    manufacturer,
    model_number,
    serial_number,
    status,
    is_active,
    notes
  } = req.body;

  const machine = await prisma.dialysis_machines.create({
    data: {
      machine_code,
      machine_name,
      manufacturer,
      model_number,
      serial_number,
      status: status || 'available',
      is_active: is_active !== undefined ? is_active : true,
      notes
    }
  });

  res.status(201).json({ success: true, data: machine });
}));

/**
 * PUT /api/dialysis/machines/:id
 * Update a dialysis machine
 */
router.put('/machines/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const {
    machine_code,
    machine_name,
    manufacturer,
    model_number,
    serial_number,
    status,
    last_maintenance,
    next_maintenance,
    is_active,
    notes
  } = req.body;

  const machine = await prisma.dialysis_machines.update({
    where: { id },
    data: {
      ...(machine_code && { machine_code }),
      ...(machine_name && { machine_name }),
      ...(manufacturer && { manufacturer }),
      ...(model_number && { model_number }),
      ...(serial_number && { serial_number }),
      ...(status && { status }),
      ...(last_maintenance && { last_maintenance: new Date(last_maintenance) }),
      ...(next_maintenance && { next_maintenance: new Date(next_maintenance) }),
      ...(is_active !== undefined && { is_active }),
      ...(notes !== undefined && { notes })
    }
  });

  res.json({ success: true, data: machine });
}));

/**
 * DELETE /api/dialysis/machines/:id
 * Delete (deactivate) a dialysis machine
 */
router.delete('/machines/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  await prisma.dialysis_machines.update({
    where: { id },
    data: { is_active: false, status: 'maintenance' }
  });

  res.json({ success: true, message: 'Mesin dialysis dinonaktifkan' });
}));

// ============================================
// DIALYSIS SCHEDULES CRUD
// ============================================

/**
 * GET /api/dialysis/schedules
 * Get all dialysis schedules with optional filters
 */
router.get('/schedules', asyncHandler(async (req: Request, res: Response) => {
  const { patient_id, status, date_from, date_to, machine_id } = req.query;

  const where: Record<string, unknown> = {};
  if (patient_id) where.patient_id = patient_id;
  if (status) where.status = status;
  if (machine_id) where.machine_id = machine_id;
  if (date_from || date_to) {
    where.scheduled_date = {};
    if (date_from) (where.scheduled_date as any).gte = new Date(date_from as string);
    if (date_to) (where.scheduled_date as any).lte = new Date(date_to as string);
  }

  const schedules = await prisma.dialysis_schedules.findMany({
    where,
    include: {
      patients: { select: { full_name: true, medical_record_number: true } },
      dialysis_machines: { select: { machine_name: true, machine_code: true } }
    },
    orderBy: { scheduled_date: 'asc' }
  });

  res.json({ success: true, data: schedules });
}));

/**
 * GET /api/dialysis/schedules/:id
 * Get a specific dialysis schedule
 */
router.get('/schedules/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const schedule = await prisma.dialysis_schedules.findUnique({
    where: { id },
    include: {
      patients: { select: { full_name: true, medical_record_number: true, birth_date: true, gender: true } },
      dialysis_machines: { select: { machine_name: true, machine_code: true, manufacturer: true } },
      dialysis_sessions: {
        orderBy: { start_time: 'desc' },
        take: 5
      }
    }
  });

  if (!schedule) {
    return res.status(404).json({ success: false, error: 'Jadwal dialysis tidak ditemukan' });
  }

  res.json({ success: true, data: schedule });
}));

/**
 * POST /api/dialysis/schedules
 * Create a new dialysis schedule
 */
router.post('/schedules', asyncHandler(async (req: Request, res: Response) => {
  const {
    patient_id,
    machine_id,
    scheduled_date,
    scheduled_time,
    duration_minutes,
    frequency,
    dry_weight,
    vascular_access,
    status,
    notes,
    created_by
  } = req.body;

  const schedule = await prisma.dialysis_schedules.create({
    data: {
      patient_id,
      machine_id,
      scheduled_date: new Date(scheduled_date),
      scheduled_time,
      duration_minutes: duration_minutes || 240,
      frequency,
      dry_weight: dry_weight ? parseFloat(dry_weight) : undefined,
      vascular_access,
      status: status || 'scheduled',
      notes,
      created_by
    }
  });

  res.status(201).json({ success: true, data: schedule });
}));

/**
 * PUT /api/dialysis/schedules/:id
 * Update a dialysis schedule
 */
router.put('/schedules/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const {
    machine_id,
    scheduled_date,
    scheduled_time,
    duration_minutes,
    frequency,
    dry_weight,
    vascular_access,
    status,
    notes
  } = req.body;

  const schedule = await prisma.dialysis_schedules.update({
    where: { id },
    data: {
      ...(machine_id !== undefined && { machine_id }),
      ...(scheduled_date && { scheduled_date: new Date(scheduled_date) }),
      ...(scheduled_time !== undefined && { scheduled_time }),
      ...(duration_minutes !== undefined && { duration_minutes }),
      ...(frequency !== undefined && { frequency }),
      ...(dry_weight !== undefined && { dry_weight: parseFloat(dry_weight) }),
      ...(vascular_access !== undefined && { vascular_access }),
      ...(status && { status }),
      ...(notes !== undefined && { notes })
    }
  });

  res.json({ success: true, data: schedule });
}));

/**
 * DELETE /api/dialysis/schedules/:id
 * Cancel a dialysis schedule
 */
router.delete('/schedules/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  await prisma.dialysis_schedules.update({
    where: { id },
    data: { status: 'cancelled' }
  });

  res.json({ success: true, message: 'Jadwal dialysis dibatalkan' });
}));

// ============================================
// DIALYSIS SESSIONS CRUD
// ============================================

/**
 * GET /api/dialysis/sessions
 * Get all dialysis sessions with optional filters
 */
router.get('/sessions', asyncHandler(async (req: Request, res: Response) => {
  const { schedule_id, status, nurse_id, date_from, date_to } = req.query;

  const where: Record<string, unknown> = {};
  if (schedule_id) where.schedule_id = schedule_id;
  if (status) where.status = status;
  if (nurse_id) where.nurse_id = nurse_id;
  if (date_from || date_to) {
    where.start_time = {};
    if (date_from) (where.start_time as any).gte = new Date(date_from as string);
    if (date_to) (where.start_time as any).lte = new Date(date_to as string);
  }

  const sessions = await prisma.dialysis_sessions.findMany({
    where,
    include: {
      dialysis_schedules: {
        include: {
          patients: { select: { full_name: true, medical_record_number: true } },
          dialysis_machines: { select: { machine_name: true } }
        }
      }
    },
    orderBy: { start_time: 'desc' }
  });

  res.json({ success: true, data: sessions });
}));

/**
 * GET /api/dialysis/sessions/:id
 * Get a specific dialysis session
 */
router.get('/sessions/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const session = await prisma.dialysis_sessions.findUnique({
    where: { id },
    include: {
      dialysis_schedules: {
        include: {
          patients: { select: { full_name: true, medical_record_number: true, birth_date: true } },
          dialysis_machines: { select: { machine_name: true } }
        }
      },
      dialysis_vitals: {
        orderBy: { recorded_at: 'asc' }
      }
    }
  });

  if (!session) {
    return res.status(404).json({ success: false, error: 'Sesi dialysis tidak ditemukan' });
  }

  res.json({ success: true, data: session });
}));

/**
 * POST /api/dialysis/sessions
 * Create a new dialysis session
 */
router.post('/sessions', asyncHandler(async (req: Request, res: Response) => {
  const {
    schedule_id,
    start_time,
    pre_weight,
    pre_bp,
    pre_pulse,
    pre_temp,
    access_condition,
    dialysate_solution,
    heparin_dose,
    blood_flow_rate,
    dialysate_flow_rate,
    uf_goal,
    nurse_id,
    notes
  } = req.body;

  const session = await prisma.dialysis_sessions.create({
    data: {
      schedule_id,
      start_time: start_time ? new Date(start_time) : new Date(),
      pre_weight: pre_weight ? parseFloat(pre_weight) : undefined,
      pre_bp,
      pre_pulse: pre_pulse ? parseInt(pre_pulse) : undefined,
      pre_temp: pre_temp ? parseFloat(pre_temp) : undefined,
      access_condition,
      dialysate_solution,
      heparin_dose: heparin_dose ? parseInt(heparin_dose) : undefined,
      blood_flow_rate: blood_flow_rate ? parseInt(blood_flow_rate) : undefined,
      dialysate_flow_rate: dialysate_flow_rate ? parseInt(dialysate_flow_rate) : undefined,
      uf_goal: uf_goal ? parseFloat(uf_goal) : undefined,
      nurse_id,
      notes,
      status: 'ongoing'
    },
    include: {
      dialysis_schedules: {
        include: {
          patients: { select: { full_name: true } },
          dialysis_machines: { select: { machine_name: true } }
        }
      }
    }
  });

  // Update schedule status to in_progress
  if (schedule_id) {
    await prisma.dialysis_schedules.update({
      where: { id: schedule_id },
      data: { status: 'in_progress' }
    });
  }

  res.status(201).json({ success: true, data: session });
}));

/**
 * PUT /api/dialysis/sessions/:id
 * Update a dialysis session (including completion)
 */
router.put('/sessions/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const {
    end_time,
    post_weight,
    post_bp,
    post_pulse,
    post_temp,
    uf_achieved,
    kt_v,
    complications,
    status,
    notes
  } = req.body;

  const session = await prisma.dialysis_sessions.update({
    where: { id },
    data: {
      ...(end_time && { end_time: new Date(end_time) }),
      ...(post_weight !== undefined && { post_weight: parseFloat(post_weight) }),
      ...(post_bp !== undefined && { post_bp }),
      ...(post_pulse !== undefined && { post_pulse: parseInt(post_pulse) }),
      ...(post_temp !== undefined && { post_temp: parseFloat(post_temp) }),
      ...(uf_achieved !== undefined && { uf_achieved: parseFloat(uf_achieved) }),
      ...(kt_v !== undefined && { kt_v: parseFloat(kt_v) }),
      ...(complications !== undefined && { complications }),
      ...(status && { status }),
      ...(notes !== undefined && { notes })
    },
    include: {
      dialysis_schedules: {
        include: {
          patients: { select: { full_name: true } }
        }
      }
    }
  });

  // If completed, update schedule status
  if (status === 'completed' && session.schedule_id) {
    await prisma.dialysis_schedules.update({
      where: { id: session.schedule_id },
      data: { status: 'completed' }
    });
  }

  res.json({ success: true, data: session });
}));

/**
 * DELETE /api/dialysis/sessions/:id
 * Cancel a dialysis session
 */
router.delete('/sessions/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const session = await prisma.dialysis_sessions.findUnique({
    where: { id },
    select: { schedule_id: true }
  });

  await prisma.dialysis_sessions.update({
    where: { id },
    data: { status: 'cancelled' }
  });

  // Revert schedule status if exists
  if (session?.schedule_id) {
    await prisma.dialysis_schedules.update({
      where: { id: session.schedule_id },
      data: { status: 'scheduled' }
    });
  }

  res.json({ success: true, message: 'Sesi dialysis dibatalkan' });
}));

// ============================================
// DIALYSIS VITALS CRUD
// ============================================

/**
 * GET /api/dialysis/sessions/:sessionId/vitals
 * Get vitals for a dialysis session
 */
router.get('/sessions/:sessionId/vitals', asyncHandler(async (req: Request<{ sessionId: string }>, res: Response) => {
  const { sessionId } = req.params;

  const vitals = await prisma.dialysis_vitals.findMany({
    where: { session_id: sessionId },
    orderBy: { recorded_at: 'asc' }
  });

  res.json({ success: true, data: vitals });
}));

/**
 * POST /api/dialysis/sessions/:sessionId/vitals
 * Record vitals for a dialysis session
 */
router.post('/sessions/:sessionId/vitals', asyncHandler(async (req: Request<{ sessionId: string }>, res: Response) => {
  const { sessionId } = req.params;
  const { bp, pulse, temp, blood_flow_rate, venous_pressure, tmp, uf_rate, notes, recorded_by } = req.body;

  const vital = await prisma.dialysis_vitals.create({
    data: {
      session_id: sessionId,
      bp,
      pulse: pulse ? parseInt(pulse) : undefined,
      temp: temp ? parseFloat(temp) : undefined,
      blood_flow_rate: blood_flow_rate ? parseInt(blood_flow_rate) : undefined,
      venous_pressure: venous_pressure ? parseInt(venous_pressure) : undefined,
      tmp: tmp ? parseInt(tmp) : undefined,
      uf_rate: uf_rate ? parseFloat(uf_rate) : undefined,
      notes,
      recorded_by
    }
  });

  res.status(201).json({ success: true, data: vital });
}));

// ============================================
// DIALYSIS STATISTICS & ANALYTICS
// ============================================

/**
 * GET /api/dialysis/statistics
 * Get dialysis unit statistics
 */
router.get('/statistics', asyncHandler(async (req: Request, res: Response) => {
  const { date_from, date_to } = req.query;

  const where: Record<string, unknown> = {};
  if (date_from || date_to) {
    where.start_time = {};
    if (date_from) (where.start_time as any).gte = new Date(date_from as string);
    if (date_to) (where.start_time as any).lte = new Date(date_to as string);
  }

  const [totalSessions, completedSessions, machineCount] = await Promise.all([
    prisma.dialysis_sessions.count({ where }),
    prisma.dialysis_sessions.count({ where: { ...where, status: 'completed' } }),
    prisma.dialysis_machines.count({ where: { is_active: true } })
  ]);

  const sessions = await prisma.dialysis_sessions.findMany({
    where,
    select: { schedule_id: true }
  });
  const totalPatients = new Set(sessions.map(s => s.schedule_id)).size;

  res.json({
    success: true,
    data: {
      totalSessions,
      completedSessions,
      totalPatients,
      machineCount,
      utilizationRate: machineCount > 0 ? ((completedSessions / (machineCount * 30)) * 100).toFixed(1) : '0'
    }
  });
}));

/**
 * GET /api/dialysis/weekly-summary
 * Get weekly dialysis summary
 */
router.get('/weekly-summary', asyncHandler(async (req: Request, res: Response) => {
  const { week_start } = req.query;
  const startDate = week_start ? new Date(week_start as string) : new Date();
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);

  const sessions = await prisma.dialysis_sessions.findMany({
    where: {
      start_time: { gte: startDate, lt: endDate }
    },
    include: {
      dialysis_schedules: {
        include: {
          patients: { select: { full_name: true, medical_record_number: true } },
          dialysis_machines: { select: { machine_name: true } }
        }
      }
    },
    orderBy: { start_time: 'asc' }
  });

  const summary = {
    weekStart: startDate,
    weekEnd: endDate,
    totalSessions: sessions.length,
    completedSessions: sessions.filter(s => s.status === 'completed').length,
    cancelledSessions: sessions.filter(s => s.status === 'cancelled').length,
    patients: Array.from(new Set(sessions.map(s => s.dialysis_schedules?.patient_id))).length,
    sessionsByDay: sessions.reduce((acc: Record<string, number>, session) => {
      const day = session.start_time.toISOString().split('T')[0];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  res.json({ success: true, data: summary });
}));

/**
 * GET /api/dialysis/adequacy
 * Get dialysis adequacy metrics (Kt/V, URR)
 */
router.get('/adequacy', asyncHandler(async (req: Request, res: Response) => {
  const { patient_id, date_from, date_to } = req.query;

  const where: Record<string, unknown> = { status: 'completed' };
  if (patient_id) {
    where.dialysis_schedules = { patient_id: patient_id as string };
  }
  if (date_from || date_to) {
    where.start_time = {};
    if (date_from) (where.start_time as any).gte = new Date(date_from as string);
    if (date_to) (where.start_time as any).lte = new Date(date_to as string);
  }

  const sessions = await prisma.dialysis_sessions.findMany({
    where,
    select: {
      id: true,
      start_time: true,
      blood_flow_rate: true,
      uf_goal: true,
      uf_achieved: true,
      kt_v: true,
      dialysis_schedules: {
        select: {
          patient_id: true,
          patients: { select: { full_name: true } }
        }
      }
    },
    orderBy: { start_time: 'desc' },
    take: 100
  });

  const adequacyData = sessions.map(session => ({
    sessionId: session.id,
    date: session.start_time,
    patientId: session.dialysis_schedules?.patient_id,
    patientName: session.dialysis_schedules?.patients?.full_name,
    bloodFlowRate: session.blood_flow_rate,
    ufGoal: session.uf_goal,
    ufAchieved: session.uf_achieved,
    ktv: session.kt_v ? Number(session.kt_v) : null,
    ktvAdequate: session.kt_v ? Number(session.kt_v) >= 1.2 : false
  }));

  const validKtv = adequacyData.filter(d => d.ktv !== null);
  const averageKtv = validKtv.length > 0
    ? (validKtv.reduce((sum, d) => sum + (d.ktv as number), 0) / validKtv.length).toFixed(2)
    : '0';

  res.json({
    success: true,
    data: {
      sessions: adequacyData,
      averageKtv: parseFloat(averageKtv as string),
      adequateSessions: adequacyData.filter(d => d.ktvAdequate).length,
      totalSessions: adequacyData.length
    }
  });
}));

/**
 * GET /api/dialysis/sessions/:id/monitoring
 * Get real-time monitoring data for active dialysis session
 */
router.get('/sessions/:id/monitoring', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const session = await prisma.dialysis_sessions.findUnique({
    where: { id },
    include: {
      dialysis_schedules: {
        include: {
          patients: { select: { full_name: true, medical_record_number: true, birth_date: true } },
          dialysis_machines: { select: { machine_name: true } }
        }
      },
      dialysis_vitals: {
        orderBy: { recorded_at: 'desc' },
        take: 50
      }
    }
  });

  if (!session) {
    return res.status(404).json({ success: false, error: 'Sesi dialysis tidak ditemukan' });
  }

  const startTime = session.start_time;
  const endTime = session.end_time || new Date();
  const elapsedMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

  const latestVitals: Record<string, unknown> = session.dialysis_vitals[0] || {};
  const vitals: Record<string, unknown> = {
    bp: (latestVitals as any).bp || session.pre_bp,
    pulse: (latestVitals as any).pulse || session.pre_pulse,
    temp: (latestVitals as any).temp || session.pre_temp
  };

  const ufGoal = session.uf_goal ? Number(session.uf_goal) : 0;
  const ufAchieved = session.uf_achieved ? Number(session.uf_achieved) : 0;
  const ufRemaining = ufGoal - ufAchieved;
  const ufRatePerHour = elapsedMinutes > 0 ? (ufAchieved / (elapsedMinutes / 60)) : 0;

  res.json({
    success: true,
    data: {
      session: {
        id: session.id,
        status: session.status,
        startTime,
        endTime: session.end_time,
        elapsedMinutes: parseFloat(elapsedMinutes.toFixed(1))
      },
      patient: session.dialysis_schedules?.patients,
      machine: session.dialysis_schedules?.dialysis_machines,
      prescription: {
        bloodFlowRate: session.blood_flow_rate,
        dialysateFlowRate: session.dialysate_flow_rate,
        ufGoal,
        heparinDose: session.heparin_dose,
        dialysateSolution: session.dialysate_solution
      },
      currentVitals: vitals,
      ultrafiltration: {
        goal: ufGoal,
        achieved: ufAchieved,
        remaining: ufRemaining,
        ratePerHour: parseFloat(ufRatePerHour.toFixed(2))
      },
      ktv: session.kt_v ? Number(session.kt_v) : null,
      complications: session.complications,
      notes: session.notes
    }
  });
}));

export default router;

/**
 * SIMRS ZEN - Queue Routes
 * Manage outpatient queue entries
 */

import { Router } from 'express';
import { prisma } from '../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import * as cache from '../services/cache.service.js';

const router = Router();

/**
 * GET /api/queue/today
 * Today's queue entries with patient info — cached 30s
 */
router.get('/today', asyncHandler(async (req, res) => {
  const { department_id, visit_type } = req.query;
  const todayStr = new Date().toISOString().split('T')[0];
  const cacheKey = `queue:today:${todayStr}:${department_id || 'all'}`;

  const { data: result } = await cache.cacheAside(cacheKey, async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const entries = await prisma.queue_entries.findMany({
      where: {
        created_at: { gte: today, lt: tomorrow },
        ...(department_id && { department_id }),
      },
      include: {
        visits: {
          select: {
            id: true, visit_type: true, payment_type: true,
            patients: { select: { id: true, full_name: true, medical_record_number: true } }
          }
        }
      },
      orderBy: [{ queue_number: 'asc' }]
    });

    return entries.map(e => ({
      id: e.id,
      ticket_number: String(e.queue_number).padStart(3, '0'),
      patient_id: e.visits?.patients?.id || null,
      visit_id: e.visit_id,
      department_id: e.department_id,
      service_type: e.visits?.visit_type || 'outpatient',
      queue_date: e.created_at.toISOString().split('T')[0],
      called_at: e.called_at?.toISOString() || null,
      served_at: e.served_at?.toISOString() || null,
      completed_at: null,
      counter_number: null,
      status: e.status,
      priority: 0,
      notes: e.notes,
      patients: e.visits?.patients
        ? { full_name: e.visits.patients.full_name, medical_record_number: e.visits.patients.medical_record_number }
        : null,
    }));
  }, 30); // 30 seconds TTL — queue changes frequently

  const filtered = visit_type && visit_type !== 'all'
    ? result.filter(e => e.service_type === visit_type)
    : result;

  res.json({ success: true, data: filtered });
}));

/**
 * POST /api/queue
 * Create a new queue entry from a visit or walk-in
 */
router.post('/', writeLimiter, asyncHandler(async (req, res) => {
  const { visit_id, patient_id, department_id, service_type, notes, priority } = req.body;

  if (!visit_id && !patient_id) {
    return res.status(400).json({ success: false, error: 'visit_id atau patient_id diperlukan' });
  }

  // Get or create visit for this patient today (for walk-in kiosk)
  let resolvedVisitId = visit_id;
  if (!resolvedVisitId && patient_id && department_id) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find existing visit today
    const existingVisit = await prisma.visits.findFirst({
      where: {
        patient_id,
        department_id,
        visit_date: { gte: today, lt: tomorrow },
        visit_type: 'outpatient',
      }
    });
    if (existingVisit) {
      resolvedVisitId = existingVisit.id;
    } else {
      // Get next queue number for department today
      const lastEntry = await prisma.queue_entries.findFirst({
        where: { department_id, created_at: { gte: today, lt: tomorrow } },
        orderBy: { queue_number: 'desc' }
      });
      const queueNumber = (lastEntry?.queue_number || 0) + 1;

      // Create a minimal outpatient visit for walk-in
      const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const lastVisit = await prisma.visits.findFirst({
        where: { visit_number: { startsWith: `RJ${datePrefix}` } },
        orderBy: { visit_number: 'desc' }
      });
      const seq = lastVisit ? parseInt(lastVisit.visit_number.slice(-4)) + 1 : 1;
      const visit_number = `RJ${datePrefix}${seq.toString().padStart(4, '0')}`;

      const newVisit = await prisma.visits.create({
        data: {
          visit_number,
          patient_id,
          department_id,
          visit_type: 'outpatient',
          payment_type: 'cash',
          visit_date: new Date(),
          status: 'waiting',
          queue_number: queueNumber,
          created_by: req.user?.id || patient_id,
        }
      });
      resolvedVisitId = newVisit.id;

      const entry = await prisma.queue_entries.create({
        data: { visit_id: resolvedVisitId, department_id, queue_number: queueNumber, status: 'waiting', notes }
      });
      return res.status(201).json({ success: true, data: { ...entry, ticket_number: String(queueNumber).padStart(3, '0') } });
    }
  }

  // Get next queue number
  const today2 = new Date();
  today2.setHours(0, 0, 0, 0);
  const tomorrow2 = new Date(today2);
  tomorrow2.setDate(tomorrow2.getDate() + 1);
  const lastEntry = await prisma.queue_entries.findFirst({
    where: { department_id, created_at: { gte: today2, lt: tomorrow2 } },
    orderBy: { queue_number: 'desc' }
  });
  const queueNumber = (lastEntry?.queue_number || 0) + 1;

  const entry = await prisma.queue_entries.create({
    data: {
      visit_id: resolvedVisitId,
      department_id: department_id || null,
      queue_number: queueNumber,
      status: 'waiting',
      notes: notes || null,
    }
  });

  // Invalidate today's queue cache
  const todayStr = new Date().toISOString().split('T')[0];
  await cache.delByPattern(`queue:today:${todayStr}:*`);

  res.status(201).json({ success: true, data: { ...entry, ticket_number: String(queueNumber).padStart(3, '0') } });
}));

/**
 * GET /api/queue/appointments
 * Today's appointments for a patient (for kiosk check-in)
 */
router.get('/appointments', asyncHandler(async (req, res) => {
  const { patient_id, date } = req.query;
  if (!patient_id) return res.status(400).json({ success: false, error: 'patient_id diperlukan' });

  const targetDate = date ? new Date(date) : new Date();
  targetDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const appointments = await prisma.appointments.findMany({
    where: {
      patient_id,
      appointment_date: { gte: targetDate, lt: nextDay },
      status: { in: ['confirmed', 'scheduled'] }
    },
    include: {
      doctors: { select: { id: true, full_name: true } },
      departments: { select: { id: true, department_name: true } }
    },
    orderBy: { appointment_time: 'asc' }
  });

  res.json({ success: true, data: appointments });
}));

/**
 * POST /api/queue/checkin/:appointmentId
 * Check in an appointment and generate queue number
 */
router.post('/checkin/:appointmentId', writeLimiter, asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;

  const appointment = await prisma.appointments.findUnique({
    where: { id: appointmentId },
    include: { doctors: true, departments: true }
  });

  if (!appointment) return res.status(404).json({ success: false, error: 'Booking tidak ditemukan' });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const department_id = appointment.department_id;
  const lastEntry = await prisma.queue_entries.findFirst({
    where: { department_id, created_at: { gte: today, lt: tomorrow } },
    orderBy: { queue_number: 'desc' }
  });
  const queueNumber = (lastEntry?.queue_number || 0) + 1;

  // Create or find visit for today
  let visit = await prisma.visits.findFirst({
    where: { patient_id: appointment.patient_id, department_id, visit_date: { gte: today, lt: tomorrow }, visit_type: 'outpatient' }
  });
  if (!visit) {
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const lastVisit = await prisma.visits.findFirst({ where: { visit_number: { startsWith: `RJ${datePrefix}` } }, orderBy: { visit_number: 'desc' } });
    const seq = lastVisit ? parseInt(lastVisit.visit_number.slice(-4)) + 1 : 1;
    visit = await prisma.visits.create({
      data: {
        visit_number: `RJ${datePrefix}${seq.toString().padStart(4, '0')}`,
        patient_id: appointment.patient_id,
        department_id,
        visit_type: 'outpatient',
        payment_type: 'bpjs',
        visit_date: new Date(),
        status: 'waiting',
        queue_number: queueNumber,
        created_by: appointment.patient_id,
      }
    });
  }

  const [entry] = await prisma.$transaction([
    prisma.queue_entries.create({
      data: {
        visit_id: visit.id,
        department_id,
        queue_number: queueNumber,
        status: 'waiting',
        notes: `Check-in booking - ${appointment.doctors?.full_name || ''}`
      }
    }),
    prisma.appointments.update({ where: { id: appointmentId }, data: { status: 'checked_in' } })
  ]);

  const todayStrCI = new Date().toISOString().split('T')[0];
  await cache.delByPattern(`queue:today:${todayStrCI}:*`);

  res.status(201).json({ success: true, data: { ...entry, ticket_number: String(queueNumber).padStart(3, '0') } });
}));

/**
 * PATCH /api/queue/:id/status
 * Update queue entry status
 */
router.patch('/:id/status', writeLimiter, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, called_at, served_at } = req.body;

  const data = { status };
  if (called_at) data.called_at = new Date(called_at);
  if (served_at) data.served_at = new Date(served_at);

  const entry = await prisma.queue_entries.update({ where: { id }, data });

  // Invalidate today's queue cache on any status change
  const todayStr = new Date().toISOString().split('T')[0];
  await cache.delByPattern(`queue:today:${todayStr}:*`);

  res.json({ success: true, data: entry });
}));

/**
 * GET /api/queue/stats
 * Today's queue statistics per department — cached 30s
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const { department_id } = req.query;
  const todayStr = new Date().toISOString().split('T')[0];
  const cacheKey = `queue:stats:${todayStr}:${department_id || 'all'}`;

  const { data } = await cache.cacheAside(cacheKey, async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where = {
      created_at: { gte: today, lt: tomorrow },
      ...(department_id && { department_id })
    };

    const [total, waiting, serving, completed] = await Promise.all([
      prisma.queue_entries.count({ where }),
      prisma.queue_entries.count({ where: { ...where, status: 'waiting' } }),
      prisma.queue_entries.count({ where: { ...where, status: 'serving' } }),
      prisma.queue_entries.count({ where: { ...where, status: 'completed' } }),
    ]);

    return { total, waiting, serving, completed };
  }, 30);

  res.json({ success: true, data });
}));

export default router;

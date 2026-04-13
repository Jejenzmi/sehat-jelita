/**
 * SIMRS ZEN - Telemedicine Routes
 * Sessions, WebRTC signaling (polling-based), and appointment management
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { prisma } from '../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();
router.use(authenticateToken);

interface SessionsQuery {
  date?: string;
  status?: string;
  doctor_id?: string;
}

interface SignalsQuery {
  since?: string;
  exclude_sender?: string;
}

// Stats
router.get('/stats', asyncHandler(async (_req: Request, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayTotal, waiting, completed, allCompleted] = await Promise.all([
    prisma.telemedicine_sessions.count({
      where: { scheduled_start: { gte: today, lt: tomorrow } },
    }).catch(() => 0),
    prisma.telemedicine_sessions.count({
      where: { scheduled_start: { gte: today, lt: tomorrow }, status: { in: ['waiting', 'in_progress'] } },
    }).catch(() => 0),
    prisma.telemedicine_sessions.count({
      where: { scheduled_start: { gte: today, lt: tomorrow }, status: 'completed' },
    }).catch(() => 0),
    prisma.telemedicine_sessions.aggregate({
      where: { status: 'completed', duration_minutes: { not: null } },
      _avg: { duration_minutes: true },
    }).catch(() => ({ _avg: { duration_minutes: null } }) as { _avg: { duration_minutes: number | null } }),
  ]);

  res.json({
    success: true,
    data: {
      today: todayTotal,
      waiting,
      completed,
      avg_duration: (allCompleted._avg as { duration_minutes: number | null })?.duration_minutes
        ? Math.round((allCompleted._avg as { duration_minutes: number }).duration_minutes)
        : 0,
    },
  });
}));

// Sessions
router.get('/sessions', asyncHandler(async (req: Request<Record<string, string>, any, any, SessionsQuery>, res: Response) => {
  const { date, status, doctor_id } = req.query;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (doctor_id) where.doctor_id = doctor_id;

  if (date) {
    const d = new Date(date);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    where.scheduled_start = { gte: d, lt: next };
  }

  const sessions = await prisma.telemedicine_sessions.findMany({
    where,
    orderBy: { scheduled_start: 'asc' },
    include: {
      patients: { select: { id: true, full_name: true, medical_record_number: true } },
      doctors: { select: { id: true, full_name: true, specialization: true } },
    },
  }).catch(() => []);

  res.json({ success: true, data: sessions });
}));

router.get('/sessions/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const session = await prisma.telemedicine_sessions.findUnique({
    where: { id: req.params.id },
    include: {
      patients: { select: { id: true, full_name: true, medical_record_number: true } },
      doctors: { select: { id: true, full_name: true, specialization: true } },
    },
  });
  if (!session) return res.status(404).json({ success: false, error: 'Sesi tidak ditemukan' });
  res.json({ success: true, data: session });
}));

router.post('/sessions', asyncHandler(async (req: Request, res: Response) => {
  const { appointment_id, patient_id, doctor_id, scheduled_start } = req.body;

  const roomName = `room-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  const session = await prisma.telemedicine_sessions.create({
    data: {
      appointment_id,
      patient_id,
      doctor_id,
      room_name: roomName,
      scheduled_start: new Date(scheduled_start),
      status: 'scheduled',
    },
  });

  res.status(201).json({ success: true, data: session });
}));

router.patch('/sessions/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { status, user_type, notes, technical_issues } = req.body;

  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;
  if (notes !== undefined) updates.notes = notes;
  if (technical_issues !== undefined) updates.technical_issues = technical_issues;

  if (status === 'in_progress') {
    if (user_type === 'doctor') {
      updates.doctor_joined_at = new Date();
      updates.actual_start = new Date();
    } else if (user_type === 'patient') {
      updates.patient_joined_at = new Date();
    }
  }

  if (status === 'completed') {
    updates.actual_end = new Date();
    const existing = await prisma.telemedicine_sessions.findUnique({
      where: { id: req.params.id }, select: { actual_start: true },
    });
    if (existing?.actual_start) {
      updates.duration_minutes = Math.round(
        (Date.now() - new Date(existing.actual_start).getTime()) / 60000
      );
    }
  }

  const session = await prisma.telemedicine_sessions.update({
    where: { id: req.params.id },
    data: updates,
  });

  res.json({ success: true, data: session });
}));

// WebRTC Signaling
router.post('/sessions/:id/signal', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { sender_id, signal_type, signal_data } = req.body;

  const signal = await prisma.webrtc_signals.create({
    data: {
      session_id: req.params.id,
      sender_id,
      signal_type,
      signal_data,
    },
  });

  res.status(201).json({ success: true, data: signal });
}));

router.get('/sessions/:id/signals', asyncHandler(async (req: Request<{ id: string }, any, any, SignalsQuery>, res: Response) => {
  const { since, exclude_sender } = req.query;

  const where: Record<string, unknown> = { session_id: req.params.id };
  if (since) where.created_at = { gt: new Date(since) };
  if (exclude_sender) where.sender_id = { not: exclude_sender };

  const signals = await prisma.webrtc_signals.findMany({
    where,
    orderBy: { created_at: 'asc' },
  }).catch(() => []);

  res.json({ success: true, data: signals });
}));

// WebRTC ICE Server Config
router.get('/ice-servers', asyncHandler(async (_req: Request, res: Response) => {
  const iceServers: Array<Record<string, unknown>> = [];

  iceServers.push({ urls: 'stun:stun.l.google.com:19302' });
  iceServers.push({ urls: 'stun:stun1.l.google.com:19302' });

  const turnHost = process.env.TURN_HOST;
  const turnSecret = process.env.TURN_SECRET;
  const turnUser = process.env.TURN_USERNAME;
  const turnPass = process.env.TURN_PASSWORD;

  if (turnHost && turnSecret) {
    const { createHmac } = await import('node:crypto');
    const expiry = Math.floor(Date.now() / 1000) + 3600;
    const username = `${expiry}:simrs-zen`;
    const credential = createHmac('sha1', turnSecret)
      .update(username)
      .digest('base64');

    iceServers.push({
      urls: [`turn:${turnHost}:3478`, `turn:${turnHost}:3478?transport=tcp`],
      username,
      credential,
    });
  } else if (turnHost && turnUser && turnPass) {
    iceServers.push({
      urls: [`turn:${turnHost}:3478`, `turn:${turnHost}:3478?transport=tcp`],
      username: turnUser,
      credential: turnPass,
    });
  }

  res.json({ success: true, data: { iceServers } });
}));

export default router;

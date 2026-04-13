/**
 * SIMRS ZEN - Patient Portal API Routes
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { prisma } from '../config/database.js';

const router = Router();

interface CursorQuery {
  cursor?: string;
  limit?: string;
}

interface AppointmentsQuery extends CursorQuery {
  status?: string;
}

interface DoctorsQuery {
  department_id?: string;
}

interface AppointmentBody {
  doctor_id?: string;
  department_id?: string;
  appointment_date?: string;
  appointment_time?: string;
  chief_complaint?: string;
  notes?: string;
}

interface ProfileBody {
  phone?: string;
  address?: string;
  emergency_contact?: string;
  emergency_contact_phone?: string;
}

async function getPatientByUserId(userId: string) {
  return prisma.patients.findFirst({
    where: { user_id: userId, is_active: true },
  });
}

// GET /patient-portal/profile
router.get('/profile', asyncHandler(async (req: Request, res: Response) => {
  const patient = await getPatientByUserId((req.user as Record<string, string>).id);
  if (!patient) return res.status(404).json({ success: false, error: 'Profil pasien tidak ditemukan' });

  res.json({ success: true, data: patient });
}));

// PUT /patient-portal/profile
router.put('/profile', asyncHandler(async (req: Request<Record<string, string>, any, ProfileBody>, res: Response) => {
  const patient = await getPatientByUserId((req.user as Record<string, string>).id);
  if (!patient) return res.status(404).json({ success: false, error: 'Profil pasien tidak ditemukan' });

  const allowed = ['phone', 'address', 'emergency_contact', 'emergency_contact_phone'];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if ((req.body as Record<string, unknown>)[key] !== undefined) data[key] = (req.body as Record<string, unknown>)[key];
  }

  const updated = await prisma.patients.update({ where: { id: patient.id }, data });
  res.json({ success: true, data: updated });
}));

// GET /patient-portal/lab-results
router.get('/lab-results', asyncHandler(async (req: Request<Record<string, string>, any, any, CursorQuery>, res: Response) => {
  const patient = await getPatientByUserId((req.user as Record<string, string>).id);
  if (!patient) return res.status(404).json({ success: false, error: 'Pasien tidak ditemukan' });

  const { cursor, limit = '20' } = req.query;
  const take = Math.min(parseInt(limit), 50);

  const orders = await prisma.lab_orders.findMany({
    where: { patient_id: patient.id },
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    take,
    orderBy: { order_date: 'desc' },
    select: {
      id: true,
      order_number: true,
      order_date: true,
      status: true,
      notes: true,
      lab_results: {
        select: {
          id: true,
          test_name: true,
          result_value: true,
          unit: true,
          reference_range: true,
          flag: true,
          verified_at: true,
        },
      },
    },
  });

  const nextCursor = (orders as Array<Record<string, unknown>>).length === take ? ((orders as Array<Record<string, unknown>>)[(orders as Array<unknown>).length - 1] as Record<string, unknown>).id as string : null;
  res.json({ success: true, data: orders, next_cursor: nextCursor });
}));

// GET /patient-portal/lab-results/:orderId
router.get('/lab-results/:orderId', asyncHandler(async (req: Request<{ orderId: string }>, res: Response) => {
  const patient = await getPatientByUserId((req.user as Record<string, string>).id);
  if (!patient) return res.status(404).json({ success: false, error: 'Pasien tidak ditemukan' });

  const order = await prisma.lab_orders.findFirst({
    where: { id: req.params.orderId, patient_id: patient.id },
    include: {
      lab_results: true,
      doctors: { select: { full_name: true, specialization: true } },
    },
  });

  if (!order) return res.status(404).json({ success: false, error: 'Order tidak ditemukan' });
  res.json({ success: true, data: order });
}));

// GET /patient-portal/medical-records
router.get('/medical-records', asyncHandler(async (req: Request<Record<string, string>, any, any, CursorQuery>, res: Response) => {
  const patient = await getPatientByUserId((req.user as Record<string, string>).id);
  if (!patient) return res.status(404).json({ success: false, error: 'Pasien tidak ditemukan' });

  const { cursor, limit = '20' } = req.query;
  const take = Math.min(parseInt(limit), 50);

  const records = await prisma.medical_records.findMany({
    where: {
      visits: { patient_id: patient.id } as Record<string, unknown>,
    },
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    take,
    orderBy: { record_date: 'desc' },
    include: {
      visits: {
        select: {
          visit_number: true,
          visit_type: true,
          chief_complaint: true,
          doctors: { select: { full_name: true, specialization: true } },
        },
      },
    },
  });

  const nextCursor = (records as Array<Record<string, unknown>>).length === take ? ((records as Array<Record<string, unknown>>)[(records as Array<unknown>).length - 1] as Record<string, unknown>).id as string : null;
  res.json({ success: true, data: records, next_cursor: nextCursor });
}));

// GET /patient-portal/prescriptions
router.get('/prescriptions', asyncHandler(async (req: Request<Record<string, string>, any, any, CursorQuery>, res: Response) => {
  const patient = await getPatientByUserId((req.user as Record<string, string>).id);
  if (!patient) return res.status(404).json({ success: false, error: 'Pasien tidak ditemukan' });

  const { cursor, limit = '20' } = req.query;
  const take = Math.min(parseInt(limit), 50);

  const prescriptions = await prisma.prescriptions.findMany({
    where: { patient_id: patient.id },
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    take,
    orderBy: { prescription_date: 'desc' },
    include: {
      doctors: { select: { full_name: true, specialization: true } },
      prescription_items: true,
    },
  });

  const nextCursor = (prescriptions as Array<Record<string, unknown>>).length === take ? ((prescriptions as Array<Record<string, unknown>>)[(prescriptions as Array<unknown>).length - 1] as Record<string, unknown>).id as string : null;
  res.json({ success: true, data: prescriptions, next_cursor: nextCursor });
}));

// GET /patient-portal/appointments
router.get('/appointments', asyncHandler(async (req: Request<Record<string, string>, any, any, AppointmentsQuery>, res: Response) => {
  const patient = await getPatientByUserId((req.user as Record<string, string>).id);
  if (!patient) return res.status(404).json({ success: false, error: 'Pasien tidak ditemukan' });

  const { status, cursor, limit = '20' } = req.query;
  const take = Math.min(parseInt(limit), 50);

  const where: Record<string, unknown> = { patient_id: patient.id };
  if (status) where.status = status;

  const appointments = await prisma.appointments.findMany({
    where,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    take,
    orderBy: { appointment_date: 'desc' },
    include: {
      doctors: { select: { full_name: true, specialization: true } },
      departments: { select: { department_name: true } },
    },
  });

  const nextCursor = (appointments as Array<Record<string, unknown>>).length === take ? ((appointments as Array<Record<string, unknown>>)[(appointments as Array<unknown>).length - 1] as Record<string, unknown>).id as string : null;
  res.json({ success: true, data: appointments, next_cursor: nextCursor });
}));

// POST /patient-portal/appointments
router.post('/appointments', asyncHandler(async (req: Request<Record<string, string>, any, AppointmentBody>, res: Response) => {
  const patient = await getPatientByUserId((req.user as Record<string, string>).id);
  if (!patient) return res.status(404).json({ success: false, error: 'Pasien tidak ditemukan' });

  const { doctor_id, department_id, appointment_date, appointment_time, chief_complaint, notes } = req.body;

  if (!doctor_id || !appointment_date || !appointment_time) {
    return res.status(400).json({ success: false, error: 'doctor_id, appointment_date, appointment_time wajib diisi' });
  }

  const existing = await prisma.appointments.findFirst({
    where: {
      doctor_id,
      appointment_date: new Date(appointment_date),
      appointment_time,
      status: { in: ['pending', 'confirmed'] },
    },
  });
  if (existing) {
    return res.status(409).json({ success: false, error: 'Slot waktu sudah terisi' });
  }

  const appointment = await prisma.appointments.create({
    data: {
      patient_id: patient.id,
      doctor_id,
      department_id: department_id || null,
      appointment_date: new Date(appointment_date),
      appointment_time,
      chief_complaint: chief_complaint || null,
      notes: notes || null,
      status: 'pending',
    },
    include: {
      doctors: { select: { full_name: true, specialization: true } },
      departments: { select: { department_name: true } },
    },
  });

  res.status(201).json({ success: true, data: appointment });
}));

// DELETE /patient-portal/appointments/:id
router.delete('/appointments/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const patient = await getPatientByUserId((req.user as Record<string, string>).id);
  if (!patient) return res.status(404).json({ success: false, error: 'Pasien tidak ditemukan' });

  const apt = await prisma.appointments.findFirst({
    where: { id: req.params.id, patient_id: patient.id },
  });
  if (!apt) return res.status(404).json({ success: false, error: 'Appointment tidak ditemukan' });

  if (!['pending', 'confirmed'].includes(apt.status)) {
    return res.status(400).json({ success: false, error: 'Appointment tidak bisa dibatalkan' });
  }

  await prisma.appointments.update({
    where: { id: apt.id },
    data: { status: 'cancelled' },
  });

  res.json({ success: true, message: 'Appointment berhasil dibatalkan' });
}));

// GET /patient-portal/doctors
router.get('/doctors', asyncHandler(async (req: Request<Record<string, string>, any, any, DoctorsQuery>, res: Response) => {
  const { department_id } = req.query;
  const where: Record<string, unknown> = { is_active: true };
  if (department_id) where.department_id = department_id;

  const doctors = await prisma.doctors.findMany({
    where,
    select: {
      id: true,
      full_name: true,
      specialization: true,
      department_id: true,
      departments: { select: { id: true, department_name: true } },
    },
    orderBy: { full_name: 'asc' },
  });

  res.json({ success: true, data: doctors });
}));

// GET /patient-portal/insurances
router.get('/insurances', asyncHandler(async (req: Request, res: Response) => {
  const patient = await getPatientByUserId((req.user as Record<string, string>).id);
  if (!patient) return res.status(404).json({ success: false, error: 'Pasien tidak ditemukan' });

  const insurances = await prisma.patient_insurances.findMany({
    where: { patient_id: patient.id },
    orderBy: { created_at: 'desc' },
  });

  res.json({ success: true, data: insurances });
}));

export default router;

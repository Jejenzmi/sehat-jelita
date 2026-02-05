/**
 * SIMRS ZEN - Patients Routes
 * CRUD operations for patient management
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireRole, checkMenuAccess } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);
router.use(checkMenuAccess('pasien'));

// Validation schemas
const patientSchema = z.object({
  full_name: z.string().min(2, 'Nama minimal 2 karakter'),
  nik: z.string().length(16, 'NIK harus 16 digit').optional().nullable(),
  bpjs_number: z.string().optional().nullable(),
  birth_date: z.string().optional().nullable(),
  birth_place: z.string().optional().nullable(),
  gender: z.enum(['male', 'female']).optional(),
  blood_type: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional().nullable(),
  religion: z.string().optional().nullable(),
  marital_status: z.string().optional().nullable(),
  education: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  rt: z.string().optional().nullable(),
  rw: z.string().optional().nullable(),
  kelurahan: z.string().optional().nullable(),
  kecamatan: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  postal_code: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  mobile_phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  emergency_contact_name: z.string().optional().nullable(),
  emergency_contact_phone: z.string().optional().nullable(),
  emergency_contact_relation: z.string().optional().nullable(),
  allergy_notes: z.string().optional().nullable(),
  chronic_conditions: z.string().optional().nullable()
});

/**
 * GET /api/patients
 * Get all patients with pagination and search
 */
router.get('/', asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    search, 
    status = 'active',
    sort_by = 'created_at',
    sort_order = 'desc'
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Build where clause
  const where = {
    is_active: status === 'active',
    ...(search && {
      OR: [
        { full_name: { contains: search, mode: 'insensitive' } },
        { medical_record_number: { contains: search, mode: 'insensitive' } },
        { nik: { contains: search } },
        { bpjs_number: { contains: search } },
        { phone: { contains: search } }
      ]
    })
  };

  const [patients, total] = await Promise.all([
    prisma.patients.findMany({
      where,
      skip,
      take,
      orderBy: { [sort_by]: sort_order },
      select: {
        id: true,
        medical_record_number: true,
        full_name: true,
        nik: true,
        bpjs_number: true,
        birth_date: true,
        gender: true,
        phone: true,
        address: true,
        created_at: true
      }
    }),
    prisma.patients.count({ where })
  ]);

  res.json({
    success: true,
    data: patients,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      total_pages: Math.ceil(total / take)
    }
  });
}));

/**
 * GET /api/patients/:id
 * Get patient by ID with full details
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const patient = await prisma.patients.findUnique({
    where: { id },
    include: {
      visits: {
        take: 10,
        orderBy: { visit_date: 'desc' },
        include: {
          doctors: { select: { id: true } },
          departments: { select: { id: true, department_name: true } }
        }
      }
    }
  });

  if (!patient) {
    throw new ApiError(404, 'Pasien tidak ditemukan', 'PATIENT_NOT_FOUND');
  }

  res.json({
    success: true,
    data: patient
  });
}));

/**
 * GET /api/patients/mrn/:mrn
 * Get patient by Medical Record Number
 */
router.get('/mrn/:mrn', asyncHandler(async (req, res) => {
  const { mrn } = req.params;

  const patient = await prisma.patients.findUnique({
    where: { medical_record_number: mrn }
  });

  if (!patient) {
    throw new ApiError(404, 'Pasien tidak ditemukan', 'PATIENT_NOT_FOUND');
  }

  res.json({
    success: true,
    data: patient
  });
}));

/**
 * GET /api/patients/nik/:nik
 * Get patient by NIK
 */
router.get('/nik/:nik', asyncHandler(async (req, res) => {
  const { nik } = req.params;

  const patient = await prisma.patients.findUnique({
    where: { nik }
  });

  if (!patient) {
    throw new ApiError(404, 'Pasien tidak ditemukan', 'PATIENT_NOT_FOUND');
  }

  res.json({
    success: true,
    data: patient
  });
}));

/**
 * POST /api/patients
 * Create new patient
 */
router.post('/', requireRole(['admin', 'registrasi', 'rekam_medis']), asyncHandler(async (req, res) => {
  const data = patientSchema.parse(req.body);

  // Check for duplicate NIK
  if (data.nik) {
    const existing = await prisma.patients.findUnique({ where: { nik: data.nik } });
    if (existing) {
      throw new ApiError(409, 'NIK sudah terdaftar', 'DUPLICATE_NIK');
    }
  }

  // Generate MRN
  const mrn = await prisma.$queryRaw`SELECT generate_mrn() as mrn`;

  const patient = await prisma.patients.create({
    data: {
      ...data,
      medical_record_number: mrn[0].mrn
    }
  });

  // Audit log
  await prisma.audit_logs.create({
    data: {
      table_name: 'patients',
      record_id: patient.id,
      action: 'INSERT',
      user_id: req.user.id,
      new_data: patient
    }
  });

  res.status(201).json({
    success: true,
    message: 'Pasien berhasil didaftarkan',
    data: patient
  });
}));

/**
 * PUT /api/patients/:id
 * Update patient
 */
router.put('/:id', requireRole(['admin', 'registrasi', 'rekam_medis']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = patientSchema.partial().parse(req.body);

  const existing = await prisma.patients.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, 'Pasien tidak ditemukan', 'PATIENT_NOT_FOUND');
  }

  // Check for duplicate NIK if changing
  if (data.nik && data.nik !== existing.nik) {
    const duplicate = await prisma.patients.findUnique({ where: { nik: data.nik } });
    if (duplicate) {
      throw new ApiError(409, 'NIK sudah terdaftar', 'DUPLICATE_NIK');
    }
  }

  const patient = await prisma.patients.update({
    where: { id },
    data
  });

  // Audit log
  await prisma.audit_logs.create({
    data: {
      table_name: 'patients',
      record_id: patient.id,
      action: 'UPDATE',
      user_id: req.user.id,
      old_data: existing,
      new_data: patient
    }
  });

  res.json({
    success: true,
    message: 'Data pasien berhasil diperbarui',
    data: patient
  });
}));

/**
 * DELETE /api/patients/:id
 * Soft delete patient
 */
router.delete('/:id', requireRole(['admin']), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.patients.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, 'Pasien tidak ditemukan', 'PATIENT_NOT_FOUND');
  }

  await prisma.patients.update({
    where: { id },
    data: { is_active: false }
  });

  // Audit log
  await prisma.audit_logs.create({
    data: {
      table_name: 'patients',
      record_id: id,
      action: 'DELETE',
      user_id: req.user.id,
      old_data: existing
    }
  });

  res.json({
    success: true,
    message: 'Pasien berhasil dihapus'
  });
}));

/**
 * GET /api/patients/:id/visits
 * Get patient visit history
 */
router.get('/:id/visits', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const [visits, total] = await Promise.all([
    prisma.visits.findMany({
      where: { patient_id: id },
      skip,
      take,
      orderBy: { visit_date: 'desc' },
      include: {
        doctors: { select: { id: true } },
        departments: { select: { id: true, department_name: true } }
      }
    }),
    prisma.visits.count({ where: { patient_id: id } })
  ]);

  res.json({
    success: true,
    data: visits,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      total_pages: Math.ceil(total / take)
    }
  });
}));

/**
 * GET /api/patients/:id/medical-records
 * Get patient medical records
 */
router.get('/:id/medical-records', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const records = await prisma.medical_records.findMany({
    where: { patient_id: id },
    orderBy: { record_date: 'desc' },
    take: 50,
    include: {
      doctors: { select: { id: true } }
    }
  });

  res.json({
    success: true,
    data: records
  });
}));

/**
 * GET /api/patients/:id/prescriptions
 * Get patient prescriptions
 */
router.get('/:id/prescriptions', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const prescriptions = await prisma.prescriptions.findMany({
    where: { patient_id: id },
    orderBy: { prescription_date: 'desc' },
    take: 50,
    include: {
      prescription_items: true,
      doctors: { select: { id: true } }
    }
  });

  res.json({
    success: true,
    data: prescriptions
  });
}));

/**
 * GET /api/patients/:id/lab-results
 * Get patient lab results
 */
router.get('/:id/lab-results', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const labOrders = await prisma.lab_orders.findMany({
    where: { patient_id: id },
    orderBy: { order_date: 'desc' },
    take: 50,
    include: {
      lab_results: true
    }
  });

  res.json({
    success: true,
    data: labOrders
  });
}));

/**
 * GET /api/patients/:id/billings
 * Get patient billing history
 */
router.get('/:id/billings', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const billings = await prisma.billings.findMany({
    where: { patient_id: id },
    orderBy: { billing_date: 'desc' },
    take: 50,
    include: {
      billing_items: true
    }
  });

  res.json({
    success: true,
    data: billings
  });
}));

export default router;

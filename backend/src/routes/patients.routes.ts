/**
 * SIMRS ZEN - Patients Routes
 * CRUD operations for patient management
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { prisma } from '../config/database.js';
import { requireRole } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { searchRateLimiter } from '../middleware/rateLimiter.js';
import * as cache from '../services/cache.service.js';
import { encrypt, decrypt } from '../services/encryption.service.js';

// ── PII helpers ───────────────────────────────────────────────────────────────

/** SHA-256 hex of a PII value — stored in hash columns for searchable lookup */
function hashPII(value: string | null | undefined): string | null {
  if (value == null || value === '') return null;
  return createHash('sha256').update(String(value)).digest('hex');
}

/**
 * Encrypt PII fields and populate hash columns.
 * Only processes fields that are present (supports partial updates).
 */
function encryptPII(data: Record<string, any>): Record<string, any> {
  const out = { ...data };
  if ('nik' in data) {
    out.nik = data.nik ? encrypt(data.nik) : data.nik;
    out.nik_hash = hashPII(data.nik);
  }
  if ('mobile_phone' in data) {
    out.mobile_phone = data.mobile_phone ? encrypt(data.mobile_phone) : data.mobile_phone;
    out.mobile_phone_hash = hashPII(data.mobile_phone);
  }
  if ('email' in data) {
    out.email = data.email ? encrypt(data.email) : data.email;
    out.email_hash = hashPII(data.email);
  }
  if ('bpjs_number' in data) {
    out.bpjs_number = data.bpjs_number ? encrypt(data.bpjs_number) : data.bpjs_number;
    out.bpjs_number_hash = hashPII(data.bpjs_number);
  }
  return out;
}

/** Decrypt PII fields in a patient record before returning to client */
function decryptPatient(patient: Record<string, any> | null): Record<string, any> | null {
  if (!patient) return patient;
  return {
    ...patient,
    nik: patient.nik ? tryDecrypt(patient.nik) : patient.nik,
    mobile_phone: patient.mobile_phone ? tryDecrypt(patient.mobile_phone) : patient.mobile_phone,
    email: patient.email ? tryDecrypt(patient.email) : patient.email,
    bpjs_number: patient.bpjs_number ? tryDecrypt(patient.bpjs_number) : patient.bpjs_number,
  };
}

/** Safe decrypt — returns original value if decryption fails (e.g. legacy plain-text rows) */
function tryDecrypt(value: string): string {
  try {
    const result = decrypt(value);
    return result ?? value;
  } catch { return value; }
}

const router = Router();

// Helper: Generate Medical Record Number in JavaScript (with retry on duplicate to prevent race conditions)
async function generateMRN(): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2);
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const prefix = `RM${year}${month}`;

  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const lastPatient = await prisma.patients.findFirst({
      where: { medical_record_number: { startsWith: prefix } },
      orderBy: { medical_record_number: 'desc' },
      select: { medical_record_number: true }
    });

    let sequence = 1;
    if (lastPatient) {
      const lastSeq = parseInt(lastPatient.medical_record_number.slice(-5), 10);
      if (!isNaN(lastSeq)) sequence = lastSeq + 1;
    }

    const mrn = `${prefix}${sequence.toString().padStart(5, '0')}`;

    // Verify uniqueness
    const existing = await prisma.patients.findUnique({
      where: { medical_record_number: mrn },
      select: { id: true }
    });

    if (!existing) return mrn;

    await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)));
  }

  // Fallback
  const fallbackSeq = Math.floor(Math.random() * 90000) + 10000;
  return `${prefix}${fallbackSeq}`;
}

// Validation schemas
const patientSchema = z.object({
  full_name: z.string().min(2, 'Nama minimal 2 karakter'),
  nik: z.string().length(16, 'NIK harus 16 digit').optional().nullable(),
  bpjs_number: z.string().optional().nullable(),
  birth_date: z.string().optional().nullable(),
  birth_place: z.string().optional().nullable(),
  gender: z.enum(['male', 'female']).optional(),
  blood_type: z.enum(['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE']).optional().nullable(),
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

// Type definitions
type PatientBody = z.infer<typeof patientSchema>;

interface PatientQuery {
  page?: string;
  limit?: string;
  cursor?: string;
  search?: string;
  status?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

interface VisitHistoryQuery {
  page?: string;
  limit?: string;
}

interface PatientProfileResponse {
  patient: Record<string, any> | null;
  visits: any[];
  medicalRecords: any[];
  prescriptions: any[];
  billings: any[];
}

/**
 * GET /api/patients/stats
 * Get patient statistics
 */
router.get('/stats', asyncHandler(async (_req: Request, res: Response) => {
  const cacheKey = 'patients:stats';
  const { data: cached } = await cache.cacheAside(cacheKey, async () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const [total, bpjsCount, newThisMonth] = await Promise.all([
      prisma.patients.count({ where: { is_active: true } }),
      prisma.patients.count({ where: { is_active: true, bpjs_number: { not: null } } }),
      prisma.patients.count({ where: { is_active: true, created_at: { gte: startOfMonth } } })
    ]);
    return { total, bpjs: bpjsCount, umum: total - bpjsCount, newThisMonth };
  }, cache.CACHE_TTL.MEDIUM); // 5 min

  res.json({ success: true, data: cached });
}));

/**
 * GET /api/patients/search
 * Quick search for patients (autocomplete)
 */
router.get('/search', searchRateLimiter, asyncHandler(async (req: Request<Record<string, string>, any, any, { q?: string; limit?: string }>, res: Response) => {
  const { q, limit = '10' } = req.query;
  if (!q || String(q).length < 2) return res.json({ success: true, data: [] });

  const nikHash = hashPII(q);

  const patients = await prisma.patients.findMany({
    where: {
      is_active: true,
      OR: [
        { full_name: { contains: q, mode: 'insensitive' } },
        { medical_record_number: { contains: q, mode: 'insensitive' } },
        { nik_hash: nikHash },
        { bpjs_number_hash: hashPII(q) }
      ]
    },
    take: parseInt(limit),
    select: {
      id: true,
      full_name: true,
      medical_record_number: true,
      nik: true,
      gender: true,
      birth_date: true,
      bpjs_number: true
    }
  });

  res.json({ success: true, data: patients.map((p: Record<string, any>) => ({ ...p, nik: p.nik ? tryDecrypt(p.nik) : p.nik })) });
}));

/**
 * GET /api/patients/next-mrn
 * Generate next Medical Record Number (RPC shim)
 */
router.get('/next-mrn', asyncHandler(async (_req: Request, res: Response) => {
  const mrn = await generateMRN();
  res.json({ success: true, data: mrn });
}));

/**
 * GET /api/patients
 * Get all patients with pagination and search
 */
router.get('/', asyncHandler(async (req: Request<Record<string, string>, any, any, PatientQuery>, res: Response) => {
  const {
    page = '1',
    limit = '20',
    cursor,          // cursor-based pagination: last seen patient ID
    search,
    status = 'active',
    sort_by = 'created_at',
    sort_order = 'desc'
  } = req.query;

  const limitInt = Math.min(parseInt(limit) || 20, 100);
  const useCursor = !!cursor;

  // Only cache non-search, non-cursor list pages
  const pageInt = parseInt(page);
  const cacheKey = (!search && !useCursor)
    ? `patients:list:${status}:${pageInt}:${limitInt}:${sort_by}:${sort_order}`
    : null;

  const fetchData = async () => {
    const where: Record<string, any> = {
      is_active: status === 'active',
      ...(search && {
        OR: [
          { full_name: { contains: search, mode: 'insensitive' } },
          { medical_record_number: { contains: search, mode: 'insensitive' } },
          { nik_hash: hashPII(search) },
          { bpjs_number: { contains: search } }
        ]
      })
    };

    if (useCursor) {
      // Cursor pagination — no total count (fast for infinite scroll)
      const patients = await prisma.patients.findMany({
        where,
        take: limitInt + 1,
        cursor: { id: cursor },
        skip: 1,
        orderBy: { [sort_by]: sort_order },
        select: {
          id: true, medical_record_number: true, full_name: true,
          nik: true, bpjs_number: true, birth_date: true,
          gender: true, phone: true, address: true, created_at: true
        }
      });
      const hasMore = patients.length > limitInt;
      const items = hasMore ? patients.slice(0, limitInt) : patients;
      return { patients: items, total: null, nextCursor: hasMore ? items[items.length - 1].id : null };
    }

    // Offset pagination (default)
    const skip = (pageInt - 1) * limitInt;
    const [patients, total] = await Promise.all([
      prisma.patients.findMany({
        where, skip, take: limitInt,
        orderBy: { [sort_by]: sort_order },
        select: {
          id: true, medical_record_number: true, full_name: true,
          nik: true, bpjs_number: true, birth_date: true,
          gender: true, phone: true, address: true, created_at: true
        }
      }),
      prisma.patients.count({ where })
    ]);
    return { patients, total, nextCursor: null };
  };

  let result: { patients: Record<string, any>[]; total: number | null; nextCursor: string | null };
  if (cacheKey) {
    const { data } = await cache.cacheAside(cacheKey, fetchData, cache.CACHE_TTL.MEDIUM);
    result = data as { patients: Record<string, any>[]; total: number | null; nextCursor: string | null };
  } else {
    result = await fetchData();
  }

  const decrypted = result.patients.map((p: Record<string, any>) => ({ ...p, nik: p.nik ? tryDecrypt(p.nik) : p.nik }));

  res.json({
    success: true,
    data: decrypted,
    pagination: useCursor
      ? { limit: limitInt, nextCursor: result.nextCursor, hasMore: !!result.nextCursor }
      : { page: pageInt, limit: limitInt, total: result.total, total_pages: Math.ceil((result.total || 0) / limitInt) }
  });
}));

/**
 * GET /api/patients/:id
 * Get patient by ID with full details
 */
router.get('/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const cacheKey = cache.CACHE_KEYS.patient(id);

  const { data: patient } = await cache.cacheAside(cacheKey, async () => {
    const p = await prisma.patients.findUnique({
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
    return p;
  }, cache.CACHE_TTL.STANDARD); // 1 hour

  if (!patient) throw new ApiError(404, 'Pasien tidak ditemukan', 'PATIENT_NOT_FOUND');

  res.json({ success: true, data: decryptPatient(patient as Record<string, any>) });
}));

/**
 * GET /api/patients/mrn/:mrn
 * Get patient by Medical Record Number
 */
router.get('/mrn/:mrn', asyncHandler(async (req: Request<{ mrn: string }>, res: Response) => {
  const { mrn } = req.params;

  const patient = await prisma.patients.findUnique({
    where: { medical_record_number: mrn }
  });

  if (!patient) {
    throw new ApiError(404, 'Pasien tidak ditemukan', 'PATIENT_NOT_FOUND');
  }

  res.json({
    success: true,
    data: decryptPatient(patient as Record<string, any>)
  });
}));

/**
 * GET /api/patients/nik/:nik
 * Get patient by NIK (searches via hash index)
 */
router.get('/nik/:nik', asyncHandler(async (req: Request<{ nik: string }>, res: Response) => {
  const { nik } = req.params;
  const nikHash = hashPII(nik);

  const patient = await prisma.patients.findFirst({
    where: { nik_hash: nikHash }
  });

  if (!patient) {
    throw new ApiError(404, 'Pasien tidak ditemukan', 'PATIENT_NOT_FOUND');
  }

  res.json({
    success: true,
    data: decryptPatient(patient as Record<string, any>)
  });
}));

/**
 * POST /api/patients
 * Create new patient
 */
router.post('/', requireRole(['admin', 'registrasi', 'rekam_medis', 'pendaftaran', 'perawat', 'dokter']), asyncHandler(async (req: Request<Record<string, string>, any, PatientBody>, res: Response) => {
  const data = patientSchema.parse(req.body);

  // Check for duplicate NIK via hash index (fast, constant-time)
  if (data.nik) {
    const existing = await prisma.patients.findFirst({ where: { nik_hash: hashPII(data.nik) } });
    if (existing) {
      throw new ApiError(409, 'NIK sudah terdaftar', 'DUPLICATE_NIK');
    }
  }

  // Generate MRN using JavaScript helper (no stored proc needed)
  const medical_record_number = await generateMRN();

  // Encrypt PII before storing
  const encryptedData = encryptPII(data);

  const patient = await prisma.patients.create({
    data: {
      ...encryptedData,
      medical_record_number,
      full_name: data.full_name
    } as any
  });

  // Audit log (non-fatal)
  try {
    await prisma.audit_logs.create({
      data: {
        table_name: 'patients',
        record_id: patient.id,
        action: 'INSERT',
        user_id: req.user?.id,
        new_data: patient
      }
    });
  } catch (auditErr) {
    console.warn('Audit log failed (non-fatal):', (auditErr as Error).message);
  }

  // Invalidate patient list & stats caches
  await cache.delByPattern('patients:list:*');
  await cache.del('patients:stats');

  res.status(201).json({
    success: true,
    message: 'Pasien berhasil didaftarkan',
    data: decryptPatient(patient as Record<string, any>)
  });
}));

/**
 * PUT /api/patients/:id
 * Update patient
 */
router.put('/:id', requireRole(['admin', 'registrasi', 'rekam_medis', 'pendaftaran', 'perawat', 'dokter']), asyncHandler(async (req: Request<{ id: string }, any, Partial<PatientBody>>, res: Response) => {
  const { id } = req.params;
  const data = patientSchema.partial().parse(req.body);

  const existing = await prisma.patients.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, 'Pasien tidak ditemukan', 'PATIENT_NOT_FOUND');
  }

  // Check for duplicate NIK via hash index (only if NIK is being changed)
  if (data.nik) {
    const newNikHash = hashPII(data.nik);
    if (newNikHash !== existing.nik_hash) {
      const duplicate = await prisma.patients.findFirst({ where: { nik_hash: newNikHash } });
      if (duplicate) {
        throw new ApiError(409, 'NIK sudah terdaftar', 'DUPLICATE_NIK');
      }
    }
  }

  // Encrypt PII fields in the update payload
  const encryptedData = encryptPII(data);

  const patient = await prisma.patients.update({
    where: { id },
    data: encryptedData
  });

  // Audit log
  await prisma.audit_logs.create({
    data: {
      table_name: 'patients',
      record_id: patient.id,
      action: 'UPDATE',
      user_id: req.user!.id,
      old_data: existing,
      new_data: patient
    }
  });

  // Invalidate specific patient cache + list cache
  await Promise.all([
    cache.del(cache.CACHE_KEYS.patient(id)),
    cache.delByPattern('patients:list:*'),
    cache.del('patients:stats'),
  ]);

  res.json({
    success: true,
    message: 'Data pasien berhasil diperbarui',
    data: decryptPatient(patient as Record<string, any>)
  });
}));

/**
 * DELETE /api/patients/:id
 * Soft delete patient
 */
router.delete('/:id', requireRole(['admin']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
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
      user_id: req.user!.id,
      old_data: existing
    }
  });

  await Promise.all([
    cache.del(cache.CACHE_KEYS.patient(id)),
    cache.delByPattern('patients:list:*'),
    cache.del('patients:stats'),
  ]);

  res.json({
    success: true,
    message: 'Pasien berhasil dihapus'
  });
}));

/**
 * GET /api/patients/:id/visits
 * Get patient visit history
 */
router.get('/:id/visits', asyncHandler(async (req: Request<{ id: string }, any, any, VisitHistoryQuery>, res: Response) => {
  const { id } = req.params;
  const { page = '1', limit = '20' } = req.query;

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
router.get('/:id/medical-records', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
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
router.get('/:id/prescriptions', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
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
router.get('/:id/lab-results', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
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
router.get('/:id/billings', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
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

/**
 * GET /api/patients/:id/profile
 * Full patient profile with related visits, medical records, prescriptions, billings
 */
router.get('/:id/profile', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const [patient, visits, medicalRecords, prescriptions, billings] = await Promise.all([
    prisma.patients.findUnique({ where: { id } }),
    prisma.visits.findMany({
      where: { patient_id: id },
      orderBy: { visit_date: 'desc' },
      take: 20,
      include: {
        departments: { select: { id: true, department_name: true } },
        doctors: { select: { id: true, full_name: true } }
      }
    }),
    prisma.medical_records.findMany({
      where: { patient_id: id },
      orderBy: { record_date: 'desc' },
      take: 10,
      select: { id: true, visit_id: true, patient_id: true, record_date: true, subjective: true, assessment: true }
    }),
    prisma.prescriptions.findMany({
      where: { patient_id: id },
      orderBy: { created_at: 'desc' },
      take: 10,
      include: { prescription_items: { select: { id: true } } }
    }),
    prisma.billings.findMany({
      where: { patient_id: id },
      orderBy: { billing_date: 'desc' },
      take: 10,
      select: { id: true, invoice_number: true, visit_id: true, patient_id: true, total: true, status: true }
    }),
  ]);

  if (!patient) return res.status(404).json({ success: false, error: 'Pasien tidak ditemukan' });

  res.json({
    success: true,
    data: {
      patient,
      visits,
      medicalRecords,
      prescriptions: prescriptions.map((p: any) => ({ ...p, item_count: p.prescription_items?.length || 0 })),
      billings,
    }
  });
}));

export default router;

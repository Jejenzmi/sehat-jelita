/**
 * SIMRS ZEN - Patients Controller
 * Handles all patient management business logic
 */

import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';

// Validation schemas
const createPatientSchema = z.object({
  full_name: z.string().min(2, 'Nama minimal 2 karakter'),
  gender: z.enum(['male', 'female']),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal: YYYY-MM-DD'),
  nik: z.string().length(16, 'NIK harus 16 digit').optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  blood_type: z.enum(['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE']).optional(),
  allergies: z.array(z.string()).optional(),
  bpjs_number: z.string().optional(),
  insurance_provider: z.string().optional(),
  insurance_number: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
});

const updatePatientSchema = createPatientSchema.partial();

// Request body types
interface CreatePatientBody {
  full_name: string;
  gender: string;
  date_of_birth: string;
  nik?: string;
  phone?: string;
  email?: string;
  address?: string;
  blood_type?: string;
  allergies?: string[];
  bpjs_number?: string;
  insurance_provider?: string;
  insurance_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

type UpdatePatientBody = Partial<CreatePatientBody>;

interface PatientQuery {
  page?: string;
  limit?: string;
  search?: string;
  gender?: string;
  blood_type?: string;
  has_bpjs?: string;
  sort_by?: string;
  sort_order?: string;
}

interface SearchQuery {
  q?: string;
  limit?: string;
}

interface HistoryQuery {
  type?: string;
}

/**
 * Generate Medical Record Number
 */
const generateMRN = async (): Promise<string> => {
  const year = new Date().getFullYear().toString().slice(-2);
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0');

  const lastPatient = await prisma.patients.findFirst({
    where: {
      medical_record_number: {
        startsWith: `RM${year}${month}`
      }
    },
    orderBy: { medical_record_number: 'desc' }
  });

  let sequence = 1;
  if (lastPatient) {
    const lastSequence = parseInt(lastPatient.medical_record_number.slice(-5));
    sequence = lastSequence + 1;
  }

  return `RM${year}${month}${sequence.toString().padStart(5, '0')}`;
};

/**
 * Get all patients with pagination and filtering
 */
export const getPatients = async (req: Request<unknown, unknown, unknown, PatientQuery>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '20',
      search,
      gender,
      blood_type,
      has_bpjs,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { full_name: { contains: search, mode: 'insensitive' } },
        { medical_record_number: { contains: search, mode: 'insensitive' } },
        { nik: { contains: search } },
        { phone: { contains: search } }
      ];
    }

    if (gender) {
      where.gender = gender;
    }

    if (blood_type) {
      where.blood_type = blood_type;
    }

    if (has_bpjs === 'true') {
      where.bpjs_number = { not: null };
    } else if (has_bpjs === 'false') {
      where.bpjs_number = null;
    }

    // Get total count
    const total = await prisma.patients.count({ where });

    // Get patients
    const patients = await prisma.patients.findMany({
      where,
      skip,
      take,
      orderBy: { [sort_by]: sort_order },
      include: {
        visits: {
          take: 1,
          orderBy: { created_at: 'desc' }
        }
      }
    });

    res.json({
      success: true,
      data: patients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single patient by ID
 */
export const getPatient = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const patient = await prisma.patients.findUnique({
      where: { id },
      include: {
        visits: {
          take: 10,
          orderBy: { created_at: 'desc' },
          include: {
            departments: true,
            doctors: true
          }
        },
        billings: {
          take: 5,
          orderBy: { created_at: 'desc' }
        },
        prescriptions: {
          take: 5,
          orderBy: { created_at: 'desc' }
        },
        lab_orders: {
          take: 5,
          orderBy: { created_at: 'desc' }
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
  } catch (error) {
    next(error);
  }
};

/**
 * Create new patient
 */
export const createPatient = async (req: Request<unknown, unknown, CreatePatientBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createPatientSchema.parse(req.body);

    // Check for duplicate NIK
    if (data.nik) {
      const existing = await prisma.patients.findFirst({
        where: { nik: data.nik }
      });
      if (existing) {
        throw new ApiError(409, 'NIK sudah terdaftar', 'DUPLICATE_NIK');
      }
    }

    // Generate MRN
    const medical_record_number = await generateMRN();

    // Create patient
    const patient = await prisma.patients.create({
      data: {
        full_name: data.full_name,
        gender: data.gender as 'male' | 'female',
        birth_date: new Date(data.date_of_birth),
        medical_record_number,
        ...(data.nik && { nik: data.nik }),
        ...(data.phone && { phone: data.phone }),
        ...(data.email && { email: data.email }),
        ...(data.address && { address: data.address }),
        ...(data.blood_type && { blood_type: data.blood_type }),
        ...(data.bpjs_number && { bpjs_number: data.bpjs_number }),
        ...(data.insurance_provider && { insurance_provider: data.insurance_provider }),
        ...(data.insurance_number && { insurance_number: data.insurance_number }),
        ...(data.emergency_contact_name && { emergency_contact_name: data.emergency_contact_name }),
        ...(data.emergency_contact_phone && { emergency_contact_phone: data.emergency_contact_phone }),
        // TODO: Add created_by field to patients schema
        // created_by: req.user?.id
      }
    });

    // Audit log
    await prisma.audit_logs.create({
      data: {
        table_name: 'patients',
        action: 'CREATE',
        record_id: patient.id,
        user_id: req.user?.id,
        new_data: patient as unknown as object
      }
    });

    res.status(201).json({
      success: true,
      data: patient,
      message: 'Pasien berhasil didaftarkan'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update patient
 */
export const updatePatient = async (req: Request<{ id: string }, unknown, UpdatePatientBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const data = updatePatientSchema.parse(req.body);

    // Check patient exists
    const existing = await prisma.patients.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, 'Pasien tidak ditemukan', 'PATIENT_NOT_FOUND');
    }

    // Check for duplicate NIK if changing NIK
    if (data.nik && data.nik !== existing.nik) {
      const duplicateNik = await prisma.patients.findFirst({
        where: { nik: data.nik, id: { not: id } }
      });
      if (duplicateNik) {
        throw new ApiError(409, 'NIK sudah terdaftar', 'DUPLICATE_NIK');
      }
    }

    // Update patient
    const patient = await prisma.patients.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date()
      }
    });

    // Audit log
    await prisma.audit_logs.create({
      data: {
        table_name: 'patients',
        action: 'UPDATE',
        record_id: id,
        user_id: req.user?.id,
        old_data: existing as unknown as object,
        new_data: patient as unknown as object
      }
    });

    res.json({
      success: true,
      data: patient,
      message: 'Data pasien berhasil diperbarui'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete patient
 */
export const deletePatient = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await prisma.patients.findUnique({
      where: { id },
      include: {
        visits: { take: 1 },
        billings: { take: 1 }
      }
    });

    if (!existing) {
      throw new ApiError(404, 'Pasien tidak ditemukan', 'PATIENT_NOT_FOUND');
    }

    // Check for dependencies
    if ((existing.visits as unknown[]).length > 0 || (existing.billings as unknown[]).length > 0) {
      throw new ApiError(400, 'Pasien memiliki riwayat kunjungan/tagihan', 'HAS_DEPENDENCIES');
    }

    // Soft delete - just mark as inactive
    await prisma.patients.update({
      where: { id },
      data: { is_active: false }
    });

    // Audit log
    await prisma.audit_logs.create({
      data: {
        table_name: 'patients',
        action: 'DELETE',
        record_id: id,
        user_id: req.user?.id,
        old_data: existing as unknown as object
      }
    });

    res.json({
      success: true,
      message: 'Pasien berhasil dihapus'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search patients
 */
export const searchPatients = async (req: Request<unknown, unknown, unknown, SearchQuery>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q, limit = '10' } = req.query;

    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const patients = await prisma.patients.findMany({
      where: {
        OR: [
          { full_name: { contains: q, mode: 'insensitive' } },
          { medical_record_number: { contains: q, mode: 'insensitive' } },
          { nik: { contains: q } },
          { phone: { contains: q } }
        ],
        is_active: true
      },
      take: parseInt(limit),
      select: {
        id: true,
        full_name: true,
        medical_record_number: true,
        nik: true,
        birth_date: true,
        gender: true,
        phone: true,
        bpjs_number: true
      }
    });

    res.json({
      success: true,
      data: patients
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get patient medical history
 */
export const getPatientHistory = async (req: Request<{ id: string }, unknown, unknown, HistoryQuery>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { type = 'all' } = req.query;

    const patient = await prisma.patients.findUnique({ where: { id } });
    if (!patient) {
      throw new ApiError(404, 'Pasien tidak ditemukan', 'PATIENT_NOT_FOUND');
    }

    const history: Record<string, unknown> = {};

    if (type === 'all' || type === 'visits') {
      history.visits = await prisma.visits.findMany({
        where: { patient_id: id },
        orderBy: { created_at: 'desc' },
        include: {
          departments: true,
          doctors: true,
          medical_records: true
        }
      });
    }

    if (type === 'all' || type === 'lab') {
      history.labOrders = await prisma.lab_orders.findMany({
        where: { patient_id: id },
        orderBy: { created_at: 'desc' },
        include: {
          lab_results: true
        }
      });
    }

    if (type === 'all' || type === 'prescriptions') {
      history.prescriptions = await prisma.prescriptions.findMany({
        where: { patient_id: id },
        orderBy: { created_at: 'desc' },
        include: {
          prescription_items: true
        }
      });
    }

    if (type === 'all' || type === 'radiology') {
      history.radiologyOrders = await prisma.radiology_orders.findMany({
        where: { patient_id: id },
        orderBy: { created_at: 'desc' }
      });
    }

    res.json({
      success: true,
      data: {
        patient,
        history
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get patient statistics
 */
export const getPatientStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    const [
      totalPatients,
      activePatients,
      newThisMonth,
      newThisYear,
      bpjsPatients,
      genderStats
    ] = await Promise.all([
      prisma.patients.count(),
      prisma.patients.count({ where: { is_active: true } }),
      prisma.patients.count({ where: { created_at: { gte: startOfMonth } } }),
      prisma.patients.count({ where: { created_at: { gte: startOfYear } } }),
      prisma.patients.count({ where: { bpjs_number: { not: null } } }),
      prisma.patients.groupBy({
        by: ['gender'],
        _count: true
      })
    ]);

    res.json({
      success: true,
      data: {
        total: totalPatients,
        active: activePatients,
        newThisMonth,
        newThisYear,
        bpjsPatients,
        genderDistribution: genderStats.reduce<Record<string, number>>((acc, g) => {
          acc[g.gender] = g._count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * SIMRS ZEN - Visits Controller
 * Handles all visit/encounter management
 */

import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';

// Validation schemas
const createVisitSchema = z.object({
  patient_id: z.string().uuid(),
  department_id: z.string().uuid(),
  doctor_id: z.string().uuid().optional(),
  visit_type: z.enum(['rawat_jalan', 'igd', 'rawat_inap', 'mcu']),
  payment_type: z.enum(['cash', 'bpjs', 'insurance', 'corporate']),
  chief_complaint: z.string().optional(),
  bpjs_sep_number: z.string().optional(),
  insurance_info: z.object({}).optional(),
  referral_number: z.string().optional(),
  notes: z.string().optional()
});

// Request body types
interface CreateVisitBody {
  patient_id: string;
  department_id: string;
  doctor_id?: string;
  visit_type: string;
  payment_type: string;
  chief_complaint?: string;
  bpjs_sep_number?: string;
  insurance_info?: Record<string, unknown>;
  referral_number?: string;
  notes?: string;
}

interface UpdateVisitBody {
  [key: string]: unknown;
}

interface VisitQuery {
  page?: string;
  limit?: string;
  patient_id?: string;
  department_id?: string;
  doctor_id?: string;
  visit_type?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: string;
}

interface VitalSignsBody {
  [key: string]: unknown;
}

/**
 * Generate Visit Number (with retry on duplicate to prevent race conditions)
 */
const generateVisitNumber = async (visitType: string): Promise<string> => {
  const date = new Date();
  const prefix = {
    rawat_jalan: 'RJ',
    igd: 'IGD',
    rawat_inap: 'RI',
    mcu: 'MCU'
  }[visitType] || 'VIS';

  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const visitPrefix = `${prefix}${dateStr}`;

  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const lastVisit = await prisma.visits.findFirst({
      where: {
        visit_number: { startsWith: visitPrefix }
      },
      orderBy: { visit_number: 'desc' },
      select: { visit_number: true }
    });

    let sequence = 1;
    if (lastVisit) {
      const lastSeq = parseInt(lastVisit.visit_number.slice(-4));
      sequence = lastSeq + 1;
    }

    const visitNumber = `${visitPrefix}${sequence.toString().padStart(4, '0')}`;

    // Verify uniqueness
    const existing = await prisma.visits.findFirst({
      where: { visit_number: visitNumber },
      select: { id: true }
    });

    if (!existing) return visitNumber;

    await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)));
  }

  // Fallback
  const fallbackSeq = Math.floor(Math.random() * 9000) + 1000;
  return `${visitPrefix}${fallbackSeq}`;
};

/**
 * Get all visits with pagination
 */
export const getVisits = async (req: Request<unknown, unknown, unknown, VisitQuery>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '20',
      patient_id,
      department_id,
      doctor_id,
      visit_type,
      status,
      date_from,
      date_to,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: Record<string, unknown> = {};

    if (patient_id) where.patient_id = patient_id;
    if (department_id) where.department_id = department_id;
    if (doctor_id) where.doctor_id = doctor_id;
    if (visit_type) where.visit_type = visit_type;
    if (status) where.status = status;

    if (date_from || date_to) {
      where.visit_date = {};
      if (date_from) (where.visit_date as Record<string, unknown>).gte = new Date(date_from);
      if (date_to) (where.visit_date as Record<string, unknown>).lte = new Date(date_to);
    }

    const [total, visits] = await Promise.all([
      prisma.visits.count({ where }),
      prisma.visits.findMany({
        where,
        skip,
        take,
        orderBy: { [sort_by]: sort_order },
        include: {
          patients: {
            select: {
              id: true,
              full_name: true,
              medical_record_number: true,
              gender: true,
              birth_date: true
            }
          },
          departments: true,
          doctors: {
            select: {
              id: true,
              full_name: true,
              specialization: true
            }
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: visits,
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
 * Get single visit by ID
 */
export const getVisit = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const visit = await prisma.visits.findUnique({
      where: { id },
      include: {
        patients: true,
        departments: true,
        doctors: true,
        medical_records: true,
        prescriptions: {
          include: { prescription_items: true }
        },
        lab_orders: {
          include: { lab_results: true }
        },
        billings: {
          include: { billing_items: true }
        },
        vital_signs: {
          orderBy: { recorded_at: 'desc' },
          take: 10
        }
      }
    });

    if (!visit) {
      throw new ApiError(404, 'Kunjungan tidak ditemukan', 'VISIT_NOT_FOUND');
    }

    res.json({
      success: true,
      data: visit
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new visit
 */
export const createVisit = async (req: Request<unknown, unknown, CreateVisitBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createVisitSchema.parse(req.body);

    // Verify patient exists
    const patient = await prisma.patients.findUnique({
      where: { id: data.patient_id }
    });
    if (!patient) {
      throw new ApiError(404, 'Pasien tidak ditemukan', 'PATIENT_NOT_FOUND');
    }

    // Generate visit number
    const visit_number = await generateVisitNumber(data.visit_type);

    // Create visit
    const visit = await prisma.visits.create({
      data: {
        visit_number,
        visit_date: new Date(),
        status: 'waiting',
        patient_id: data.patient_id,
        department_id: data.department_id,
        doctor_id: data.doctor_id,
        visit_type: data.visit_type,
        payment_type: data.payment_type as any,
        chief_complaint: data.chief_complaint,
        bpjs_sep_number: data.bpjs_sep_number,
        insurance_policy_number: data.insurance_info ? JSON.stringify(data.insurance_info) : undefined,
        created_by: req.user?.id
      },
      include: {
        patients: true,
        departments: true,
        doctors: true
      }
    });

    // Create initial queue entry
    await prisma.queue_entries.create({
      data: {
        visit_id: visit.id,
        department_id: data.department_id,
        queue_number: await getNextQueueNumber(data.department_id),
        status: 'waiting'
      }
    });

    // Audit log
    await prisma.audit_logs.create({
      data: {
        table_name: 'visits',
        action: 'CREATE',
        record_id: visit.id,
        user_id: req.user?.id,
        new_data: visit as unknown as object
      }
    });

    // Emit socket event for queue updates
    const io = req.app.get('io');
    if (io) {
      io.to(`department:${data.department_id}`).emit('queue:updated', {
        type: 'new_patient',
        visit
      });
    }

    res.status(201).json({
      success: true,
      data: visit,
      message: 'Kunjungan berhasil didaftarkan'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update visit
 */
export const updateVisit = async (req: Request<{ id: string }, unknown, UpdateVisitBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const existing = await prisma.visits.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, 'Kunjungan tidak ditemukan', 'VISIT_NOT_FOUND');
    }

    const visit = await prisma.visits.update({
      where: { id },
      data: {
        ...updateData,
        updated_at: new Date()
      },
      include: {
        patients: true,
        departments: true,
        doctors: true
      }
    });

    // Audit log
    await prisma.audit_logs.create({
      data: {
        table_name: 'visits',
        action: 'UPDATE',
        record_id: id,
        user_id: req.user?.id,
        old_data: existing as unknown as object,
        new_data: visit as unknown as object
      }
    });

    res.json({
      success: true,
      data: visit,
      message: 'Kunjungan berhasil diperbarui'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check-in patient (start consultation)
 */
export const checkinVisit = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const visit = await prisma.visits.update({
      where: { id },
      data: {
        status: 'in_progress'
      }
    });

    // Update queue entry
    await prisma.queue_entries.updateMany({
      where: { visit_id: id },
      data: { status: 'in_progress', served_at: new Date() }
    });

    res.json({
      success: true,
      data: visit,
      message: 'Pasien mulai konsultasi'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check-out patient (end consultation)
 */
export const checkoutVisit = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const visit = await prisma.visits.update({
      where: { id },
      data: {
        status: 'completed'
      }
    });

    // Update queue entry
    await prisma.queue_entries.updateMany({
      where: { visit_id: id },
      data: { status: 'completed' }
    });

    res.json({
      success: true,
      data: visit,
      message: 'Konsultasi selesai'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Record vital signs
 */
export const recordVitalSigns = async (req: Request<{ id: string }, unknown, VitalSignsBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const vitalData = req.body;

    const visit = await prisma.visits.findUnique({ where: { id } });
    if (!visit) {
      throw new ApiError(404, 'Kunjungan tidak ditemukan', 'VISIT_NOT_FOUND');
    }

    const vitalSigns = await prisma.vital_signs.create({
      data: {
        visit_id: id,
        patient_id: visit.patient_id,
        ...vitalData,
        recorded_by: req.user?.id,
        recorded_at: new Date()
      }
    });

    res.status(201).json({
      success: true,
      data: vitalSigns,
      message: 'Tanda vital berhasil dicatat'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get today's visits summary
 */
export const getTodaySummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalVisits,
      waitingVisits,
      inProgressVisits,
      completedVisits,
      visitsByDepartment,
      visitsByType
    ] = await Promise.all([
      prisma.visits.count({
        where: { visit_date: { gte: today, lt: tomorrow } }
      }),
      prisma.visits.count({
        where: { visit_date: { gte: today, lt: tomorrow }, status: 'waiting' }
      }),
      prisma.visits.count({
        where: { visit_date: { gte: today, lt: tomorrow }, status: 'in_progress' }
      }),
      prisma.visits.count({
        where: { visit_date: { gte: today, lt: tomorrow }, status: 'completed' }
      }),
      prisma.visits.groupBy({
        by: ['department_id'],
        where: { visit_date: { gte: today, lt: tomorrow } },
        _count: true
      }),
      prisma.visits.groupBy({
        by: ['visit_type'],
        where: { visit_date: { gte: today, lt: tomorrow } },
        _count: true
      })
    ]);

    res.json({
      success: true,
      data: {
        total: totalVisits,
        waiting: waitingVisits,
        inProgress: inProgressVisits,
        completed: completedVisits,
        byDepartment: visitsByDepartment,
        byType: visitsByType
      }
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to get next queue number (with retry on duplicate to prevent race conditions)
async function getNextQueueNumber(departmentId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const lastQueue = await prisma.queue_entries.findFirst({
      where: {
        department_id: departmentId,
        created_at: { gte: today }
      },
      orderBy: { queue_number: 'desc' },
      select: { queue_number: true }
    });

    const nextNumber = (lastQueue?.queue_number || 0) + 1;

    // Verify uniqueness
    const existing = await prisma.queue_entries.findFirst({
      where: {
        department_id: departmentId,
        queue_number: nextNumber,
        created_at: { gte: today }
      },
      select: { id: true }
    });

    if (!existing) return nextNumber;

    await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)));
  }

  // Fallback: add random offset
  return Math.floor(Math.random() * 900) + 100;
}

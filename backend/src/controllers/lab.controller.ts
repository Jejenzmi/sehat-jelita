/**
 * SIMRS ZEN - Laboratory Controller
 * Handles lab orders, results, and templates
 */

import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';

// Validation schemas
const createLabOrderSchema = z.object({
  patient_id: z.string().uuid(),
  visit_id: z.string().uuid(),
  doctor_id: z.string().uuid(),
  priority: z.enum(['normal', 'urgent', 'cito']).default('normal'),
  clinical_notes: z.string().optional(),
  tests: z.array(z.object({
    test_id: z.string().uuid(),
    test_name: z.string(),
    test_code: z.string()
  }))
});

const addResultsSchema = z.object({
  results: z.array(z.object({
    test_id: z.string().uuid(),
    result_value: z.string(),
    unit: z.string().optional(),
    reference_range: z.string().optional(),
    flag: z.enum(['normal', 'low', 'high', 'critical']).optional(),
    notes: z.string().optional()
  }))
});

// Request body types
interface LabTest {
  test_id: string;
  test_name: string;
  test_code: string;
}

interface LabResult {
  test_id: string;
  result_value: string;
  unit?: string;
  reference_range?: string;
  flag?: string;
  notes?: string;
}

interface CreateLabOrderBody {
  patient_id: string;
  visit_id: string;
  doctor_id: string;
  priority: string;
  clinical_notes?: string;
  tests: LabTest[];
}

interface AddResultsBody {
  results: LabResult[];
}

interface CollectSampleBody {
  collector_notes?: string;
}

interface VerificationBody {
  verification_notes?: string;
}

interface LabQuery {
  page?: string;
  limit?: string;
  patient_id?: string;
  status?: string;
  priority?: string;
  date_from?: string;
  date_to?: string;
  category?: string;
}

/**
 * Generate Lab Number
 */
const generateLabNumber = async (): Promise<string> => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

  const count = await prisma.lab_orders.count({
    where: {
      order_number: { startsWith: `LAB${dateStr}` }
    }
  });

  return `LAB${dateStr}${(count + 1).toString().padStart(4, '0')}`;
};

/**
 * Get lab orders
 */
export const getLabOrders = async (req: Request<unknown, unknown, unknown, LabQuery>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '20',
      patient_id,
      status,
      priority,
      date_from,
      date_to
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: Record<string, unknown> = {};
    if (patient_id) where.patient_id = patient_id;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (date_from || date_to) {
      where.created_at = {};
      if (date_from) (where.created_at as Record<string, unknown>).gte = new Date(date_from);
      if (date_to) (where.created_at as Record<string, unknown>).lte = new Date(date_to);
    }

    const [total, orders] = await Promise.all([
      prisma.lab_orders.count({ where }),
      prisma.lab_orders.findMany({
        where,
        skip,
        take,
        orderBy: [
          { priority: 'desc' },
          { created_at: 'desc' }
        ],
        include: {
          patients: {
            select: { id: true, full_name: true, medical_record_number: true, birth_date: true, gender: true }
          },
          doctors: {
            select: { id: true, full_name: true }
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: orders,
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
 * Get single lab order
 */
export const getLabOrder = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const order = await prisma.lab_orders.findUnique({
      where: { id },
      include: {
        patients: true,
        visits: true,
        doctors: true,
        lab_results: true
      }
    });

    if (!order) {
      throw new ApiError(404, 'Order lab tidak ditemukan', 'ORDER_NOT_FOUND');
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create lab order
 */
export const createLabOrder = async (req: Request<unknown, unknown, CreateLabOrderBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createLabOrderSchema.parse(req.body);

    const order_number = await generateLabNumber();

    const order = await prisma.lab_orders.create({
      data: {
        order_number,
        patient_id: data.patient_id,
        visit_id: data.visit_id,
        doctor_id: data.doctor_id,
        priority: data.priority,
        notes: data.clinical_notes,
        status: 'pending',
        // NOTE: created_by field doesn't exist in lab_orders schema
      },
      include: {
        patients: true,
        doctors: true
      }
    });

    // Emit socket event for lab queue
    const io = req.app.get('io');
    if (io) {
      io.to('lab:orders').emit('lab:new_order', order);
    }

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order laboratorium berhasil dibuat'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Collect sample
 */
export const collectSample = async (req: Request<{ id: string }, unknown, CollectSampleBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { collector_notes } = req.body;

    const order = await prisma.lab_orders.update({
      where: { id },
      data: {
        status: 'sample_collected',
        // NOTE: sample_collected_at and sample_collected_by fields don't exist in schema
        notes: collector_notes
      }
    });

    res.json({
      success: true,
      data: order,
      message: 'Sampel berhasil diambil'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add lab results
 */
export const addLabResults = async (req: Request<{ id: string }, unknown, AddResultsBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const data = addResultsSchema.parse(req.body);

    const order = await prisma.lab_orders.findUnique({
      where: { id },
      include: { lab_results: true }
    });

    if (!order) {
      throw new ApiError(404, 'Order lab tidak ditemukan', 'ORDER_NOT_FOUND');
    }

    // Add results for each test
    for (const result of data.results) {
      await prisma.lab_results.create({
        data: {
          order_id: id,
          test_code: result.test_id,
          test_name: result.test_id,
          result_value: result.result_value,
          unit: result.unit,
          reference_range: result.reference_range,
          flag: result.flag || 'normal',
          notes: result.notes,
          performed_by: req.user?.id,
          result_date: new Date()
        }
      });
    }

    // Update order status to results_ready
    await prisma.lab_orders.update({
      where: { id },
      data: {
        status: 'results_ready'
      }
    });

    res.json({
      success: true,
      message: 'Hasil lab berhasil diinput'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify lab results
 */
export const verifyResults = async (req: Request<{ id: string }, unknown, VerificationBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { verification_notes } = req.body;

    const order = await prisma.lab_orders.update({
      where: { id },
      data: {
        status: 'verified',
        // NOTE: verified_at, verified_by fields don't exist in schema
        notes: verification_notes
      },
      include: {
        patients: true,
        lab_results: true
      }
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`patient:${order.patient_id}`).emit('lab:results_ready', {
        orderId: id,
        orderNumber: order.order_number
      });
    }

    res.json({
      success: true,
      data: order,
      message: 'Hasil lab berhasil diverifikasi'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get lab templates
 * NOTE: lab_templates model does not exist in schema - returning empty array
 */
export const getLabTemplates = async (_req: Request<unknown, unknown, unknown, { category?: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json({
      success: true,
      data: [],
      message: 'Lab templates not implemented - lab_templates model does not exist'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get lab statistics
 */
export const getLabStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      todayOrders,
      pendingOrders,
      completedToday,
      avgTurnaroundTime
    ] = await Promise.all([
      prisma.lab_orders.count({
        where: { created_at: { gte: today, lt: tomorrow } }
      }),
      prisma.lab_orders.count({
        where: { status: { in: ['pending', 'sample_collected', 'processing'] } }
      }),
      prisma.lab_orders.count({
        where: {
          status: 'verified',
          updated_at: { gte: today, lt: tomorrow }
        }
      }),
      prisma.$queryRaw`
        SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as avg_hours
        FROM lab_orders
        WHERE status = 'verified'
        AND updated_at >= ${today}
      `
    ]) as [number, number, number, Array<{ avg_hours: number | string } | null>];

    res.json({
      success: true,
      data: {
        todayOrders,
        pendingOrders,
        completedToday,
        avgTurnaroundTime: avgTurnaroundTime[0]?.avg_hours != null ? Number(avgTurnaroundTime[0].avg_hours).toFixed(1) : '0'
      }
    });
  } catch (error) {
    next(error);
  }
};

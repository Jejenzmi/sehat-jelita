/**
 * SIMRS ZEN - Laboratory Controller
 * Handles lab orders, results, and templates
 */

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

/**
 * Generate Lab Number
 */
const generateLabNumber = async () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  
  const count = await prisma.lab_orders.count({
    where: {
      lab_number: { startsWith: `LAB${dateStr}` }
    }
  });

  return `LAB${dateStr}${(count + 1).toString().padStart(4, '0')}`;
};

/**
 * Get lab orders
 */
export const getLabOrders = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      patient_id,
      status,
      priority,
      date_from,
      date_to
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (patient_id) where.patient_id = patient_id;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (date_from || date_to) {
      where.created_at = {};
      if (date_from) where.created_at.gte = new Date(date_from);
      if (date_to) where.created_at.lte = new Date(date_to);
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
          patient: {
            select: { id: true, full_name: true, medical_record_number: true, date_of_birth: true, gender: true }
          },
          doctor: {
            select: { id: true, name: true }
          },
          lab_order_items: true
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
export const getLabOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.lab_orders.findUnique({
      where: { id },
      include: {
        patient: true,
        visit: true,
        doctor: true,
        lab_order_items: {
          include: {
            lab_results: true
          }
        }
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
export const createLabOrder = async (req, res, next) => {
  try {
    const data = createLabOrderSchema.parse(req.body);

    const lab_number = await generateLabNumber();

    const order = await prisma.lab_orders.create({
      data: {
        lab_number,
        patient_id: data.patient_id,
        visit_id: data.visit_id,
        doctor_id: data.doctor_id,
        priority: data.priority,
        clinical_notes: data.clinical_notes,
        status: 'pending',
        created_by: req.user?.id,
        lab_order_items: {
          create: data.tests.map(test => ({
            test_id: test.test_id,
            test_name: test.test_name,
            test_code: test.test_code,
            status: 'pending'
          }))
        }
      },
      include: {
        patient: true,
        doctor: true,
        lab_order_items: true
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
export const collectSample = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { collector_notes } = req.body;

    const order = await prisma.lab_orders.update({
      where: { id },
      data: {
        status: 'sample_collected',
        sample_collected_at: new Date(),
        sample_collected_by: req.user?.id,
        collector_notes
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
export const addLabResults = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = addResultsSchema.parse(req.body);

    const order = await prisma.lab_orders.findUnique({
      where: { id },
      include: { lab_order_items: true }
    });

    if (!order) {
      throw new ApiError(404, 'Order lab tidak ditemukan', 'ORDER_NOT_FOUND');
    }

    // Add results for each test
    for (const result of data.results) {
      await prisma.lab_results.create({
        data: {
          order_item_id: result.test_id,
          result_value: result.result_value,
          unit: result.unit,
          reference_range: result.reference_range,
          flag: result.flag || 'normal',
          notes: result.notes,
          entered_by: req.user?.id,
          entered_at: new Date()
        }
      });

      // Update item status
      await prisma.lab_order_items.update({
        where: { id: result.test_id },
        data: { status: 'completed' }
      });
    }

    // Check if all items are completed
    const updatedItems = await prisma.lab_order_items.findMany({
      where: { order_id: id }
    });
    
    const allCompleted = updatedItems.every(item => item.status === 'completed');

    if (allCompleted) {
      await prisma.lab_orders.update({
        where: { id },
        data: {
          status: 'results_ready',
          results_ready_at: new Date()
        }
      });
    }

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
export const verifyResults = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { verification_notes } = req.body;

    const order = await prisma.lab_orders.update({
      where: { id },
      data: {
        status: 'verified',
        verified_at: new Date(),
        verified_by: req.user?.id,
        verification_notes
      },
      include: {
        patient: true,
        lab_order_items: {
          include: { lab_results: true }
        }
      }
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`patient:${order.patient_id}`).emit('lab:results_ready', {
        orderId: id,
        labNumber: order.lab_number
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
 */
export const getLabTemplates = async (req, res, next) => {
  try {
    const { category } = req.query;

    const where = { is_active: true };
    if (category) where.category = category;

    const templates = await prisma.lab_templates.findMany({
      where,
      include: {
        lab_template_items: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get lab statistics
 */
export const getLabStats = async (req, res, next) => {
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
          verified_at: { gte: today, lt: tomorrow }
        }
      }),
      prisma.$queryRaw`
        SELECT AVG(EXTRACT(EPOCH FROM (verified_at - created_at))/3600) as avg_hours
        FROM lab_orders
        WHERE verified_at IS NOT NULL
        AND created_at >= ${today}
      `
    ]);

    res.json({
      success: true,
      data: {
        todayOrders,
        pendingOrders,
        completedToday,
        avgTurnaroundTime: avgTurnaroundTime[0]?.avg_hours?.toFixed(1) || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * SIMRS ZEN - Laboratory Routes
 * CRUD operations for lab orders and results
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { requireRole, checkMenuAccess } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();

router.use(checkMenuAccess('laboratorium'));

// Validation schemas
const labOrderSchema = z.object({
  patient_id: z.string().uuid(),
  visit_id: z.string().uuid().optional(),
  doctor_id: z.string().uuid().optional(),
  tests: z.array(z.object({
    test_code: z.string(),
    test_name: z.string()
  })),
  priority: z.enum(['normal', 'urgent', 'cito']).default('normal'),
  notes: z.string().optional()
});

const labResultSchema = z.object({
  test_code: z.string(),
  test_name: z.string(),
  result_value: z.string(),
  unit: z.string().optional(),
  reference_range: z.string().optional(),
  flag: z.enum(['normal', 'high', 'low', 'critical']).optional(),
  notes: z.string().optional()
});

/**
 * GET /api/lab/orders
 * Get all lab orders
 */
router.get('/orders', asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    status,
    priority,
    date_from,
    date_to,
    search
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {
    ...(status && { status }),
    ...(priority && { priority }),
    ...(date_from && date_to && {
      order_date: {
        gte: new Date(date_from),
        lte: new Date(date_to)
      }
    }),
    ...(search && {
      OR: [
        { order_number: { contains: search, mode: 'insensitive' } },
        { patients: { full_name: { contains: search, mode: 'insensitive' } } },
        { patients: { medical_record_number: { contains: search, mode: 'insensitive' } } }
      ]
    })
  };

  const [orders, total] = await Promise.all([
    prisma.lab_orders.findMany({
      where,
      skip,
      take,
      orderBy: [
        { priority: 'desc' },
        { order_date: 'desc' }
      ],
      include: {
        patients: {
          select: {
            id: true,
            medical_record_number: true,
            full_name: true,
            birth_date: true,
            gender: true
          }
        },
        doctors: { select: { id: true } },
        lab_results: true
      }
    }),
    prisma.lab_orders.count({ where })
  ]);

  res.json({
    success: true,
    data: orders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      total_pages: Math.ceil(total / take)
    }
  });
}));

/**
 * GET /api/lab/orders/pending
 * Get pending lab orders for worklist
 */
router.get('/orders/pending', asyncHandler(async (req, res) => {
  const orders = await prisma.lab_orders.findMany({
    where: {
      status: { in: ['pending', 'in_progress'] }
    },
    orderBy: [
      { priority: 'desc' },
      { order_date: 'asc' }
    ],
    include: {
      patients: {
        select: {
          id: true,
          medical_record_number: true,
          full_name: true,
          birth_date: true,
          gender: true
        }
      },
      doctors: { select: { id: true } }
    }
  });

  res.json({
    success: true,
    data: orders
  });
}));

/**
 * GET /api/lab/orders/:id
 * Get lab order details
 */
router.get('/orders/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await prisma.lab_orders.findUnique({
    where: { id },
    include: {
      patients: true,
      doctors: { select: { id: true } },
      visits: true,
      lab_results: true
    }
  });

  if (!order) {
    throw new ApiError(404, 'Order lab tidak ditemukan', 'LAB_ORDER_NOT_FOUND');
  }

  res.json({
    success: true,
    data: order
  });
}));

/**
 * POST /api/lab/orders
 * Create new lab order
 */
router.post('/orders', requireRole(['admin', 'dokter', 'perawat', 'laboratorium']), asyncHandler(async (req, res) => {
  const data = labOrderSchema.parse(req.body);

  // Verify patient exists
  const patient = await prisma.patients.findUnique({ 
    where: { id: data.patient_id } 
  });
  if (!patient) {
    throw new ApiError(404, 'Pasien tidak ditemukan', 'PATIENT_NOT_FOUND');
  }

  // Generate order number
  const datePrefix = 'LAB' + new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const lastOrder = await prisma.lab_orders.findFirst({
    where: { order_number: { startsWith: datePrefix } },
    orderBy: { order_number: 'desc' }
  });
  
  const seq = lastOrder 
    ? parseInt(lastOrder.order_number.slice(-4)) + 1 
    : 1;
  
  const order_number = `${datePrefix}${seq.toString().padStart(4, '0')}`;

  const order = await prisma.lab_orders.create({
    data: {
      order_number,
      patient_id: data.patient_id,
      visit_id: data.visit_id,
      doctor_id: data.doctor_id,
      priority: data.priority,
      notes: data.notes,
      status: 'pending'
    }
  });

  // Create pending results for each test
  await prisma.lab_results.createMany({
    data: data.tests.map(test => ({
      order_id: order.id,
      test_code: test.test_code,
      test_name: test.test_name
    }))
  });

  const fullOrder = await prisma.lab_orders.findUnique({
    where: { id: order.id },
    include: { lab_results: true }
  });

  res.status(201).json({
    success: true,
    message: 'Order lab berhasil dibuat',
    data: fullOrder
  });
}));

/**
 * PUT /api/lab/orders/:id/status
 * Update lab order status
 */
router.put('/orders/:id/status', requireRole(['admin', 'laboratorium']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'in_progress', 'completed', 'cancelled'].includes(status)) {
    throw new ApiError(400, 'Status tidak valid', 'INVALID_STATUS');
  }

  const order = await prisma.lab_orders.update({
    where: { id },
    data: { status }
  });

  res.json({
    success: true,
    message: 'Status order berhasil diperbarui',
    data: order
  });
}));

/**
 * POST /api/lab/orders/:id/results
 * Add/Update lab results
 */
router.post('/orders/:id/results', requireRole(['admin', 'laboratorium']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const results = z.array(labResultSchema).parse(req.body);

  const order = await prisma.lab_orders.findUnique({ where: { id } });
  if (!order) {
    throw new ApiError(404, 'Order lab tidak ditemukan', 'LAB_ORDER_NOT_FOUND');
  }

  // Upsert results
  for (const result of results) {
    await prisma.lab_results.upsert({
      where: {
        order_id_test_code: {
          order_id: id,
          test_code: result.test_code
        }
      },
      create: {
        order_id: id,
        ...result,
        performed_by: req.user.id,
        result_date: new Date()
      },
      update: {
        ...result,
        performed_by: req.user.id,
        result_date: new Date()
      }
    });
  }

  // Check if all results are complete
  const pendingResults = await prisma.lab_results.count({
    where: {
      order_id: id,
      result_value: null
    }
  });

  if (pendingResults === 0) {
    await prisma.lab_orders.update({
      where: { id },
      data: { status: 'completed' }
    });
  } else {
    await prisma.lab_orders.update({
      where: { id },
      data: { status: 'in_progress' }
    });
  }

  const updatedOrder = await prisma.lab_orders.findUnique({
    where: { id },
    include: { lab_results: true }
  });

  // Emit socket event for result update
  const io = req.app.get('io');
  io?.to(`patient:${order.patient_id}`).emit('lab:result_updated', {
    order_id: id,
    order_number: order.order_number
  });

  res.json({
    success: true,
    message: 'Hasil lab berhasil disimpan',
    data: updatedOrder
  });
}));

/**
 * POST /api/lab/orders/:id/verify
 * Verify lab results
 */
router.post('/orders/:id/verify', requireRole(['admin', 'laboratorium']), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await prisma.lab_orders.findUnique({
    where: { id },
    include: { lab_results: true }
  });

  if (!order) {
    throw new ApiError(404, 'Order lab tidak ditemukan', 'LAB_ORDER_NOT_FOUND');
  }

  // Check if all results have values
  const incomplete = order.lab_results.some(r => !r.result_value);
  if (incomplete) {
    throw new ApiError(400, 'Masih ada hasil yang belum diisi', 'INCOMPLETE_RESULTS');
  }

  // Update all results as verified
  await prisma.lab_results.updateMany({
    where: { order_id: id },
    data: { verified_by: req.user.id }
  });

  await prisma.lab_orders.update({
    where: { id },
    data: { status: 'verified' }
  });

  res.json({
    success: true,
    message: 'Hasil lab berhasil diverifikasi'
  });
}));

/**
 * GET /api/lab/results/patient/:patientId
 * Get all lab results for a patient
 */
router.get('/results/patient/:patientId', asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { limit = 20 } = req.query;

  const orders = await prisma.lab_orders.findMany({
    where: { 
      patient_id: patientId,
      status: { in: ['completed', 'verified'] }
    },
    orderBy: { order_date: 'desc' },
    take: parseInt(limit),
    include: {
      lab_results: true,
      doctors: { select: { id: true } }
    }
  });

  res.json({
    success: true,
    data: orders
  });
}));

/**
 * GET /api/lab/stats/workload
 * Get lab workload statistics
 */
router.get('/stats/workload', asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [pending, inProgress, completedToday, totalToday] = await Promise.all([
    prisma.lab_orders.count({ where: { status: 'pending' } }),
    prisma.lab_orders.count({ where: { status: 'in_progress' } }),
    prisma.lab_orders.count({
      where: {
        status: { in: ['completed', 'verified'] },
        order_date: { gte: today }
      }
    }),
    prisma.lab_orders.count({
      where: { order_date: { gte: today } }
    })
  ]);

  res.json({
    success: true,
    data: {
      pending,
      in_progress: inProgress,
      completed_today: completedToday,
      total_today: totalToday
    }
  });
}));

/**
 * GET /api/lab/print/:orderId
 * Get lab result for printing
 */
router.get('/print/:orderId', asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await prisma.lab_orders.findUnique({
    where: { id: orderId },
    include: {
      patients: true,
      doctors: { select: { id: true } },
      lab_results: true
    }
  });

  if (!order) {
    throw new ApiError(404, 'Order lab tidak ditemukan', 'LAB_ORDER_NOT_FOUND');
  }

  // Get hospital info
  const hospitalSettings = await prisma.system_settings.findMany({
    where: {
      setting_key: {
        in: ['hospital_name', 'hospital_address', 'hospital_phone']
      }
    }
  });

  const hospital = {};
  hospitalSettings.forEach(s => {
    hospital[s.setting_key] = s.setting_value;
  });

  res.json({
    success: true,
    data: {
      hospital,
      order
    }
  });
}));

export default router;

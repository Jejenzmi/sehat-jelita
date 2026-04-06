/**
 * SIMRS ZEN - Laboratory Routes
 * CRUD operations for lab orders and results
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { requireRole, checkMenuAccess } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import * as cache from '../services/cache.service.js';

// ============================================================
// Helper: Auto-flag result based on reference ranges
// Returns: 'normal' | 'high' | 'low' | 'critical'
// ============================================================
async function autoFlag(testCode, resultValue, patient) {
  const numVal = parseFloat(resultValue);
  if (isNaN(numVal)) return null; // non-numeric (e.g. "positive", "+3")

  const gender = patient?.gender || 'all';
  const ageYears = patient?.birth_date
    ? Math.floor((Date.now() - new Date(patient.birth_date)) / (365.25 * 24 * 3600 * 1000))
    : null;

  // Find best-matching reference range
  const ranges = await prisma.lab_reference_ranges.findMany({
    where: {
      test_code: testCode,
      OR: [{ gender }, { gender: 'all' }]
    }
  });

  if (!ranges.length) return null;

  // Pick the most specific range for this patient's gender & age
  const range = ranges.find(r => {
    if (r.gender !== 'all' && r.gender !== gender) return false;
    if (ageYears !== null && r.age_min !== null && ageYears < r.age_min) return false;
    if (ageYears !== null && r.age_max !== null && ageYears > r.age_max) return false;
    return true;
  }) || ranges[0];

  const critLow  = range.critical_low  !== null ? Number(range.critical_low)  : null;
  const critHigh = range.critical_high !== null ? Number(range.critical_high) : null;
  const normMin  = range.normal_min    !== null ? Number(range.normal_min)    : null;
  const normMax  = range.normal_max    !== null ? Number(range.normal_max)    : null;

  if (critLow  !== null && numVal <= critLow)  return 'critical';
  if (critHigh !== null && numVal >= critHigh) return 'critical';
  if (normMin  !== null && numVal < normMin)   return 'low';
  if (normMax  !== null && numVal > normMax)   return 'high';
  return 'normal';
}

// ============================================================
// Helper: Delta check — compare with most recent previous result
// Returns percentage change, flags if > 25% or absolute delta
// ============================================================
async function deltaCheck(orderId, testCode, currentValue) {
  const numCurrent = parseFloat(currentValue);
  if (isNaN(numCurrent)) return { delta_flag: false, previous_value: null };

  // Get current order's patient
  const currentOrder = await prisma.lab_orders.findUnique({ where: { id: orderId }, select: { patient_id: true, order_date: true } });
  if (!currentOrder) return { delta_flag: false, previous_value: null };

  // Find previous result for same test code for same patient
  const previousResult = await prisma.lab_results.findFirst({
    where: {
      test_code: testCode,
      result_value: { not: null },
      lab_orders: { patient_id: currentOrder.patient_id, order_date: { lt: currentOrder.order_date } }
    },
    orderBy: { result_date: 'desc' },
    select: { result_value: true }
  });

  if (!previousResult?.result_value) return { delta_flag: false, previous_value: null };

  const numPrev = parseFloat(previousResult.result_value);
  if (isNaN(numPrev) || numPrev === 0) return { delta_flag: false, previous_value: previousResult.result_value };

  const pctChange = Math.abs((numCurrent - numPrev) / numPrev) * 100;
  return {
    delta_flag: pctChange >= 25, // Flag if ≥ 25% change
    previous_value: previousResult.result_value,
    pct_change: Math.round(pctChange)
  };
}

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
    cursor,
    status,
    priority,
    date_from,
    date_to,
    search
  } = req.query;

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

  const include = {
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
  };

  // ── Cursor-based pagination (when ?cursor=xxx is provided) ──
  if (cursor) {
    const orders = await prisma.lab_orders.findMany({
      where: { ...where, id: { gt: cursor } },
      take: take + 1,
      orderBy: { id: 'asc' },
      include,
    });

    const hasMore = orders.length > take;
    if (hasMore) orders.pop();

    return res.json({
      success: true,
      data: orders,
      meta: {
        next_cursor: hasMore ? orders[orders.length - 1]?.id : null,
        has_more: hasMore,
        limit: take,
      },
    });
  }

  // ── Offset-based pagination (backward compatible) ──
  const skip = (parseInt(page) - 1) * take;

  const [orders, total] = await Promise.all([
    prisma.lab_orders.findMany({
      where,
      skip,
      take,
      orderBy: [
        { priority: 'desc' },
        { order_date: 'desc' }
      ],
      include,
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
 * Input hasil lab — auto-flag + delta check
 */
router.post('/orders/:id/results', requireRole(['admin', 'laboratorium']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const results = z.array(labResultSchema).parse(req.body);

  const order = await prisma.lab_orders.findUnique({
    where: { id },
    include: { patients: { select: { id: true, gender: true, birth_date: true } } }
  });
  if (!order) throw new ApiError(404, 'Order lab tidak ditemukan', 'LAB_ORDER_NOT_FOUND');

  const criticalResults = [];

  for (const result of results) {
    // Auto-flag if not manually provided
    let flag = result.flag || null;
    if (result.result_value && !flag) {
      flag = await autoFlag(result.test_code, result.result_value, order.patients);
    }

    // Delta check
    const { delta_flag, previous_value } = result.result_value
      ? await deltaCheck(id, result.test_code, result.result_value)
      : { delta_flag: false, previous_value: null };

    await prisma.lab_results.upsert({
      where: { order_id_test_code: { order_id: id, test_code: result.test_code } },
      create: {
        order_id: id,
        ...result,
        flag,
        delta_flag,
        previous_value,
        performed_by: req.user.id,
        result_date: new Date()
      },
      update: {
        ...result,
        flag,
        delta_flag,
        previous_value,
        performed_by: req.user.id,
        result_date: new Date()
      }
    });

    if (flag === 'critical') {
      criticalResults.push({ test_code: result.test_code, test_name: result.test_name, value: result.result_value, unit: result.unit });
    }
  }

  // Update order status
  const pendingCount = await prisma.lab_results.count({ where: { order_id: id, result_value: null } });
  await prisma.lab_orders.update({
    where: { id },
    data: { status: pendingCount === 0 ? 'completed' : 'in_progress' }
  });

  const updatedOrder = await prisma.lab_orders.findUnique({ where: { id }, include: { lab_results: true } });

  const io = req.app.get('io');
  io?.to(`patient:${order.patient_id}`).emit('lab:result_updated', { order_id: id, order_number: order.order_number });

  // Emit critical alert immediately so monitor screens can react
  if (criticalResults.length > 0) {
    io?.to('lab').emit('lab:critical_pending', {
      order_id: id,
      order_number: order.order_number,
      patient_id: order.patient_id,
      critical_results: criticalResults
    });
  }

  res.json({
    success: true,
    message: 'Hasil lab berhasil disimpan',
    data: updatedOrder,
    critical_results: criticalResults,
    has_critical: criticalResults.length > 0
  });
}));

/**
 * POST /api/lab/orders/:id/verify
 * Analis verifikasi hasil — triggers critical value notification to doctor
 */
router.post('/orders/:id/verify', requireRole(['admin', 'laboratorium']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;

  const order = await prisma.lab_orders.findUnique({
    where: { id },
    include: {
      lab_results: true,
      patients: { select: { id: true, full_name: true, gender: true, birth_date: true } },
      doctors: { select: { id: true, full_name: true } }
    }
  });
  if (!order) throw new ApiError(404, 'Order lab tidak ditemukan', 'LAB_ORDER_NOT_FOUND');

  const incomplete = order.lab_results.some(r => !r.result_value);
  if (incomplete) throw new ApiError(400, 'Masih ada hasil yang belum diisi', 'INCOMPLETE_RESULTS');

  const now = new Date();

  // Verify all results, mark critical alerts
  const criticalItems = order.lab_results.filter(r => r.flag === 'critical' && !r.critical_alerted);

  await prisma.$transaction(async (tx) => {
    // Mark all results as verified
    await tx.lab_results.updateMany({
      where: { order_id: id },
      data: { verified_by: req.user.id, verified_at: now }
    });

    // Mark critical alerts as sent
    if (criticalItems.length > 0) {
      await tx.lab_results.updateMany({
        where: { order_id: id, flag: 'critical' },
        data: {
          critical_alerted: true,
          critical_alert_at: now,
          critical_alert_to: order.doctor_id || null
        }
      });
    }

    // Mark order as verified
    await tx.lab_orders.update({
      where: { id },
      data: { status: 'verified' }
    });
  });

  const io = req.app.get('io');

  // Notify requesting doctor and nursing station of verified results
  io?.to(`doctor:${order.doctor_id}`).emit('lab:verified', {
    order_id: id,
    order_number: order.order_number,
    patient_id: order.patient_id,
    patient_name: order.patients?.full_name,
    has_critical: criticalItems.length > 0
  });

  // Critical value panic notification — broadcast prominently
  if (criticalItems.length > 0) {
    const criticalPayload = {
      order_id: id,
      order_number: order.order_number,
      patient_id: order.patient_id,
      patient_name: order.patients?.full_name,
      doctor_id: order.doctor_id,
      doctor_name: order.doctors?.full_name,
      critical_values: criticalItems.map(r => ({
        test_code: r.test_code,
        test_name: r.test_name,
        value: r.result_value,
        unit: r.unit,
        previous_value: r.previous_value,
        delta_flag: r.delta_flag,
        reference_range: r.reference_range,
      })),
      alerted_at: now
    };

    io?.to('lab').emit('lab:critical_alert', criticalPayload);
    io?.to(`doctor:${order.doctor_id}`).emit('lab:critical_alert', criticalPayload);
    io?.to('nursing').emit('lab:critical_alert', criticalPayload);

    // Persist notification to DB for doctors
    if (order.doctor_id) {
      await prisma.notifications.create({
        data: {
          user_id: order.doctor_id,
          title: `⚠️ Nilai Kritis Lab — ${order.patients?.full_name}`,
          message: `Order ${order.order_number}: ${criticalItems.map(r => `${r.test_name}=${r.result_value}${r.unit || ''}`).join(', ')}`,
          type: 'critical_lab',
          reference_id: id,
          reference_type: 'lab_order'
        }
      }).catch(() => {});
    }
  }

  res.json({
    success: true,
    message: criticalItems.length > 0
      ? `Hasil diverifikasi. ${criticalItems.length} nilai kritis — notifikasi dikirim ke dokter`
      : 'Hasil lab berhasil diverifikasi',
    critical_count: criticalItems.length,
    critical_values: criticalItems.map(r => ({ test_code: r.test_code, test_name: r.test_name, value: r.result_value }))
  });
}));

/**
 * GET /api/lab/results
 * Get lab results with optional filters
 */
router.get('/results', asyncHandler(async (req, res) => {
  const { order_id, status, page = 1, limit = 50 } = req.query;

  const where = {};
  if (order_id) where.order_id = order_id;
  if (status) where.status = status;

  const [total, results] = await Promise.all([
    prisma.lab_results.count({ where }),
    prisma.lab_results.findMany({
      where,
      include: {
        lab_orders: {
          include: {
            patients: { select: { id: true, full_name: true, medical_record_number: true } }
          }
        }
      },
      orderBy: { created_at: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    })
  ]);

  res.json({
    success: true,
    data: results,
    pagination: { page: parseInt(page), limit: parseInt(limit), total }
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
 * GET /api/lab/reference-ranges
 * Get all reference ranges (cached 24h — rarely changes)
 */
router.get('/reference-ranges', asyncHandler(async (req, res) => {
  const { test_code } = req.query;
  const cacheKey = `lab:reference-ranges:${test_code || 'all'}`;

  const { data } = await cache.cacheAside(cacheKey, async () => {
    const where = test_code ? { test_code } : {};
    return prisma.lab_reference_ranges.findMany({ where, orderBy: [{ test_code: 'asc' }, { gender: 'asc' }] });
  }, cache.CACHE_TTL.LONG);

  res.json({ success: true, data });
}));

/**
 * PUT /api/lab/reference-ranges/:id
 * Update a reference range (admin only)
 */
router.put('/reference-ranges/:id', requireRole(['admin', 'laboratorium']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updated = await prisma.lab_reference_ranges.update({ where: { id }, data: req.body });
  // Invalidate cache
  await cache.delByPattern('lab:reference-ranges:*');
  res.json({ success: true, data: updated });
}));

/**
 * GET /api/lab/stats/workload
 * Get lab workload statistics — cached 1 min
 */
router.get('/stats/workload', asyncHandler(async (req, res) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const { data } = await cache.cacheAside(`lab:stats:workload:${todayStr}`, async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pending, inProgress, completedToday, totalToday, criticalPending] = await Promise.all([
      prisma.lab_orders.count({ where: { status: 'pending' } }),
      prisma.lab_orders.count({ where: { status: 'in_progress' } }),
      prisma.lab_orders.count({ where: { status: { in: ['completed', 'verified'] }, order_date: { gte: today } } }),
      prisma.lab_orders.count({ where: { order_date: { gte: today } } }),
      prisma.lab_results.count({ where: { flag: 'critical', critical_alerted: false } })
    ]);

    return { pending, in_progress: inProgress, completed_today: completedToday, total_today: totalToday, critical_pending: criticalPending };
  }, 60); // 1 min

  res.json({ success: true, data });
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

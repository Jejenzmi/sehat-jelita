/**
 * SIMRS ZEN - Billing Routes
 * CRUD operations for billing and payments
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireRole, checkMenuAccess } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();

router.use(authenticateToken);
router.use(checkMenuAccess('kasir'));

// Validation schemas
const billingItemSchema = z.object({
  item_type: z.string(),
  item_name: z.string(),
  quantity: z.number().int().positive(),
  unit_price: z.number().positive()
});

const paymentSchema = z.object({
  paid_amount: z.number().positive(),
  payment_method: z.enum(['cash', 'credit_card', 'debit_card', 'transfer', 'qris']),
  paid_by: z.string().optional()
});

// Valid BillingStatus enum values from Prisma schema
const VALID_BILLING_STATUSES = ['pending', 'partial', 'paid', 'cancelled', 'refunded'];

/**
 * GET /api/billing
 * Get all billings with filters
 */
router.get('/', asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    status,
    payment_type,
    date_from,
    date_to,
    search
  } = req.query;

  if (status && !VALID_BILLING_STATUSES.includes(status)) {
    throw new ApiError(400, `Invalid status. Must be one of: ${VALID_BILLING_STATUSES.join(', ')}`, 'INVALID_STATUS');
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {
    ...(status && { status }),
    ...(payment_type && { payment_type }),
    ...(date_from && date_to && {
      billing_date: {
        gte: new Date(date_from),
        lte: new Date(date_to)
      }
    }),
    ...(search && {
      OR: [
        { invoice_number: { contains: search, mode: 'insensitive' } },
        { patients: { full_name: { contains: search, mode: 'insensitive' } } },
        { patients: { medical_record_number: { contains: search, mode: 'insensitive' } } }
      ]
    })
  };

  const [billings, total] = await Promise.all([
    prisma.billings.findMany({
      where,
      skip,
      take,
      orderBy: { billing_date: 'desc' },
      include: {
        patients: {
          select: {
            id: true,
            medical_record_number: true,
            full_name: true
          }
        },
        visits: {
          select: {
            id: true,
            visit_number: true,
            visit_type: true
          }
        },
        billing_items: true
      }
    }),
    prisma.billings.count({ where })
  ]);

  res.json({
    success: true,
    data: billings,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      total_pages: Math.ceil(total / take)
    }
  });
}));

/**
 * GET /api/billing/pending
 * Get pending billings
 */
router.get('/pending', asyncHandler(async (req, res) => {
  const billings = await prisma.billings.findMany({
    where: {
      status: { in: ['pending', 'partial'] }
    },
    orderBy: { billing_date: 'asc' },
    include: {
      patients: {
        select: {
          id: true,
          medical_record_number: true,
          full_name: true
        }
      },
      visits: {
        select: {
          visit_number: true,
          visit_type: true
        }
      }
    }
  });

  res.json({
    success: true,
    data: billings
  });
}));

/**
 * GET /api/billing/:id
 * Get billing details
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const billing = await prisma.billings.findUnique({
    where: { id },
    include: {
      patients: true,
      visits: {
        include: {
          doctors: { select: { id: true } },
          departments: true
        }
      },
      billing_items: true
    }
  });

  if (!billing) {
    throw new ApiError(404, 'Billing tidak ditemukan', 'BILLING_NOT_FOUND');
  }

  res.json({
    success: true,
    data: billing
  });
}));

/**
 * GET /api/billing/visit/:visitId
 * Get billing by visit ID
 */
router.get('/visit/:visitId', asyncHandler(async (req, res) => {
  const { visitId } = req.params;

  const billing = await prisma.billings.findFirst({
    where: { visit_id: visitId },
    include: {
      patients: true,
      billing_items: true
    }
  });

  if (!billing) {
    throw new ApiError(404, 'Billing tidak ditemukan untuk kunjungan ini', 'BILLING_NOT_FOUND');
  }

  res.json({
    success: true,
    data: billing
  });
}));

/**
 * POST /api/billing
 * Create new billing for a visit
 */
router.post('/', requireRole(['admin', 'kasir']), asyncHandler(async (req, res) => {
  const { visit_id, items, discount = 0, tax_rate = 0 } = req.body;

  // Verify visit exists
  const visit = await prisma.visits.findUnique({
    where: { id: visit_id },
    include: { patients: true }
  });

  if (!visit) {
    throw new ApiError(404, 'Kunjungan tidak ditemukan', 'VISIT_NOT_FOUND');
  }

  // Check existing billing
  const existingBilling = await prisma.billings.findFirst({
    where: { visit_id }
  });

  if (existingBilling) {
    throw new ApiError(409, 'Billing sudah ada untuk kunjungan ini', 'BILLING_EXISTS');
  }

  // Generate invoice number
  const invoiceNumber = await prisma.$queryRaw`SELECT generate_invoice_number() as inv`;

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const taxAmount = subtotal * (tax_rate / 100);
  const total = subtotal - discount + taxAmount;

  // Create billing with items
  const billing = await prisma.billings.create({
    data: {
      invoice_number: invoiceNumber[0].inv,
      patient_id: visit.patient_id,
      visit_id,
      payment_type: visit.payment_type,
      subtotal,
      discount,
      tax: taxAmount,
      total,
      created_by: req.user.id,
      billing_items: {
        create: items.map(item => ({
          item_type: item.item_type,
          item_name: item.item_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.unit_price * item.quantity
        }))
      }
    },
    include: {
      billing_items: true
    }
  });

  res.status(201).json({
    success: true,
    message: 'Billing berhasil dibuat',
    data: billing
  });
}));

/**
 * POST /api/billing/:id/items
 * Add item to billing
 */
router.post('/:id/items', requireRole(['admin', 'kasir']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = billingItemSchema.parse(req.body);

  const billing = await prisma.billings.findUnique({ where: { id } });
  if (!billing) {
    throw new ApiError(404, 'Billing tidak ditemukan', 'BILLING_NOT_FOUND');
  }

  if (billing.status === 'paid') {
    throw new ApiError(400, 'Billing sudah lunas', 'BILLING_ALREADY_PAID');
  }

  const totalPrice = item.unit_price * item.quantity;

  // Create item and update totals
  await prisma.$transaction([
    prisma.billing_items.create({
      data: {
        billing_id: id,
        ...item,
        total_price: totalPrice
      }
    }),
    prisma.billings.update({
      where: { id },
      data: {
        subtotal: { increment: totalPrice },
        total: { increment: totalPrice }
      }
    })
  ]);

  const updatedBilling = await prisma.billings.findUnique({
    where: { id },
    include: { billing_items: true }
  });

  res.json({
    success: true,
    message: 'Item berhasil ditambahkan',
    data: updatedBilling
  });
}));

/**
 * DELETE /api/billing/:id/items/:itemId
 * Remove item from billing
 */
router.delete('/:id/items/:itemId', requireRole(['admin', 'kasir']), asyncHandler(async (req, res) => {
  const { id, itemId } = req.params;

  const billing = await prisma.billings.findUnique({ where: { id } });
  if (!billing) {
    throw new ApiError(404, 'Billing tidak ditemukan', 'BILLING_NOT_FOUND');
  }

  if (billing.status === 'paid') {
    throw new ApiError(400, 'Billing sudah lunas', 'BILLING_ALREADY_PAID');
  }

  const item = await prisma.billing_items.findUnique({ where: { id: itemId } });
  if (!item || item.billing_id !== id) {
    throw new ApiError(404, 'Item tidak ditemukan', 'ITEM_NOT_FOUND');
  }

  await prisma.$transaction([
    prisma.billing_items.delete({ where: { id: itemId } }),
    prisma.billings.update({
      where: { id },
      data: {
        subtotal: { decrement: item.total_price },
        total: { decrement: item.total_price }
      }
    })
  ]);

  res.json({
    success: true,
    message: 'Item berhasil dihapus'
  });
}));

/**
 * POST /api/billing/:id/pay
 * Process payment
 */
router.post('/:id/pay', requireRole(['admin', 'kasir']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const payment = paymentSchema.parse(req.body);

  const billing = await prisma.billings.findUnique({ where: { id } });
  if (!billing) {
    throw new ApiError(404, 'Billing tidak ditemukan', 'BILLING_NOT_FOUND');
  }

  if (billing.status === 'paid') {
    throw new ApiError(400, 'Billing sudah lunas', 'BILLING_ALREADY_PAID');
  }

  const newPaidAmount = (billing.paid_amount || 0) + payment.paid_amount;
  const remaining = billing.total - newPaidAmount;

  let newStatus = 'partial';
  if (remaining <= 0) {
    newStatus = 'paid';
  }

  const updatedBilling = await prisma.billings.update({
    where: { id },
    data: {
      paid_amount: newPaidAmount,
      payment_method: payment.payment_method,
      payment_date: new Date(),
      paid_by: payment.paid_by,
      status: newStatus
    }
  });

  // Audit log
  await prisma.audit_logs.create({
    data: {
      table_name: 'billings',
      record_id: id,
      action: 'PAYMENT',
      user_id: req.user.id,
      new_data: {
        amount: payment.paid_amount,
        method: payment.payment_method,
        status: newStatus
      }
    }
  });

  res.json({
    success: true,
    message: newStatus === 'paid' ? 'Pembayaran lunas' : 'Pembayaran berhasil',
    data: {
      ...updatedBilling,
      remaining: remaining > 0 ? remaining : 0
    }
  });
}));

/**
 * POST /api/billing/:id/cancel
 * Cancel billing
 */
router.post('/:id/cancel', requireRole(['admin']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const billing = await prisma.billings.findUnique({ where: { id } });
  if (!billing) {
    throw new ApiError(404, 'Billing tidak ditemukan', 'BILLING_NOT_FOUND');
  }

  if (billing.status === 'paid') {
    throw new ApiError(400, 'Billing sudah lunas, tidak bisa dibatalkan', 'CANNOT_CANCEL_PAID');
  }

  const updatedBilling = await prisma.billings.update({
    where: { id },
    data: {
      status: 'cancelled',
      notes: `Dibatalkan: ${reason || 'Tidak ada alasan'}`
    }
  });

  // Audit log
  await prisma.audit_logs.create({
    data: {
      table_name: 'billings',
      record_id: id,
      action: 'CANCEL',
      user_id: req.user.id,
      old_data: billing,
      new_data: { reason }
    }
  });

  res.json({
    success: true,
    message: 'Billing berhasil dibatalkan',
    data: updatedBilling
  });
}));

/**
 * GET /api/billing/stats/daily
 * Get daily revenue statistics
 */
router.get('/stats/daily', requireRole(['admin', 'kasir', 'keuangan']), asyncHandler(async (req, res) => {
  const { date } = req.query;
  const targetDate = date ? new Date(date) : new Date();
  targetDate.setHours(0, 0, 0, 0);
  
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const stats = await prisma.billings.aggregate({
    where: {
      payment_date: {
        gte: targetDate,
        lt: nextDay
      },
      status: 'paid'
    },
    _sum: { paid_amount: true },
    _count: true
  });

  const byPaymentMethod = await prisma.billings.groupBy({
    by: ['payment_method'],
    where: {
      payment_date: {
        gte: targetDate,
        lt: nextDay
      },
      status: 'paid'
    },
    _sum: { paid_amount: true },
    _count: true
  });

  res.json({
    success: true,
    data: {
      date: targetDate.toISOString().split('T')[0],
      total_revenue: stats._sum.paid_amount || 0,
      total_transactions: stats._count || 0,
      by_payment_method: byPaymentMethod
    }
  });
}));

/**
 * GET /api/billing/print/:id
 * Get billing data for printing receipt
 */
router.get('/print/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const billing = await prisma.billings.findUnique({
    where: { id },
    include: {
      patients: true,
      visits: {
        include: {
          doctors: { select: { id: true } },
          departments: true
        }
      },
      billing_items: true
    }
  });

  if (!billing) {
    throw new ApiError(404, 'Billing tidak ditemukan', 'BILLING_NOT_FOUND');
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
      billing
    }
  });
}));

export default router;

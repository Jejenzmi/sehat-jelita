/**
 * SIMRS ZEN - Billing Routes
 * CRUD operations for billing and payments
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { requireRole, checkMenuAccess, Role } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();

// Authentication applied globally in routes/index.js
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
const VALID_BILLING_STATUSES = ['pending', 'partial', 'paid', 'cancelled', 'refunded'] as const;
type BillingStatus = (typeof VALID_BILLING_STATUSES)[number];

// Type definitions
interface BillingQuery {
  page?: string;
  limit?: string;
  cursor?: string;
  status?: BillingStatus;
  payment_type?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  date?: string;
}

interface BillingItemInput {
  item_type: string;
  item_name: string;
  quantity: number;
  unit_price: number;
}

interface CreateBillingBody {
  visit_id: string;
  items: BillingItemInput[];
  discount?: number;
  tax_rate?: number;
}

interface PaymentBody {
  paid_amount: number;
  payment_method: string;
  paid_by?: string;
}

interface CancelBillingBody {
  reason?: string;
}

interface DischargeBody {
  discharge_summary?: string;
}

interface TransferBody {
  new_department_id?: string;
  new_bed_id?: string;
  reason?: string;
}

interface RulesPreviewQuery {
  payment_type?: string;
  visit_type?: string;
  department_id?: string;
}

interface RawBillingItem {
  item_type: string;
  item_name: string;
  quantity: number;
  unit_price: number;
}

interface BillingRuleResult {
  rule: string;
  type: 'tariff' | 'discount' | 'tax';
  item?: string;
  original?: number;
  adjusted?: number;
  amount?: number;
}

interface BillingRulesPreviewResult {
  adjustedItems: RawBillingItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  rulesApplied: BillingRuleResult[];
}

interface RulesPreviewBody {
  items?: RawBillingItem[];
}

// Extend Express Request for body items on rules preview
interface RulesPreviewRequest extends Request {
  query: RulesPreviewQuery;
  body: RulesPreviewBody;
}

// ── Billing Rule Engine ────────────────────────────────────────────────────────

/**
 * Apply active billing_rules to a set of raw items.
 * Returns items with adjusted unit_price + a breakdown of applied rules.
 */
async function applyBillingRules(
  items: RawBillingItem[],
  payment_type: string,
  visit_type: string,
  department_id: string | null = null
): Promise<BillingRulesPreviewResult> {
  const rules = await prisma.billing_rules.findMany({
    where: {
      is_active: true,
      AND: [
        { OR: [{ payment_type }, { payment_type: null }] },
        { OR: [{ visit_type }, { visit_type: null }] },
        { OR: [{ department_id }, { department_id: null }] },
      ]
    },
    orderBy: { priority: 'desc' }
  });

  const tariffs = rules.filter((r: { rule_type: string | null }) => r.rule_type === 'tariff');
  const discounts = rules.filter((r: { rule_type: string | null }) => r.rule_type === 'discount');
  const taxes = rules.filter((r: { rule_type: string | null }) => r.rule_type === 'tax');

  const rulesApplied: BillingRuleResult[] = [];

  // Step 1: Apply tariff overrides (replace unit_price if a tariff rule matches item_type)
  const adjustedItems = items.map(item => {
    const tariff = tariffs.find((r: { item_type: string | null }) => !r.item_type || r.item_type === item.item_type);
    if (tariff) {
      const amountNum = Number((tariff as any).amount);
      const newPrice = (tariff as any).amount_type === 'fixed'
        ? amountNum
        : item.unit_price * (1 - amountNum / 100);
      rulesApplied.push({ rule: (tariff as any).rule_name, type: 'tariff', item: item.item_type, original: item.unit_price, adjusted: newPrice });
      return { ...item, unit_price: newPrice };
    }
    return item;
  });

  const subtotal = adjustedItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

  // Step 2: Apply discounts (per matching item_type or all)
  let totalDiscount = 0;
  for (const disc of discounts) {
    const applicableItems = adjustedItems.filter((i: RawBillingItem) => !(disc as any).item_type || (disc as any).item_type === i.item_type);
    const base = applicableItems.reduce((s: number, i: RawBillingItem) => s + i.unit_price * i.quantity, 0);
    const amount = (disc as any).amount_type === 'fixed' ? Number((disc as any).amount) : base * (Number((disc as any).amount) / 100);
    totalDiscount += amount;
    rulesApplied.push({ rule: (disc as any).rule_name, type: 'discount', amount });
  }

  // Step 3: Apply taxes
  let totalTax = 0;
  for (const tax of taxes) {
    const applicableItems = adjustedItems.filter((i: RawBillingItem) => !(tax as any).item_type || (tax as any).item_type === i.item_type);
    const base = applicableItems.reduce((s: number, i: RawBillingItem) => s + i.unit_price * i.quantity, 0);
    const amount = (tax as any).amount_type === 'fixed' ? Number((tax as any).amount) : base * (Number((tax as any).amount) / 100);
    totalTax += amount;
    rulesApplied.push({ rule: (tax as any).rule_name, type: 'tax', amount });
  }

  const total = Math.max(0, subtotal - totalDiscount + totalTax);

  return {
    adjustedItems,
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(totalDiscount * 100) / 100,
    tax: Math.round(totalTax * 100) / 100,
    total: Math.round(total * 100) / 100,
    rulesApplied
  };
}

/**
 * GET /api/billing
 * Get all billings with filters
 */
router.get('/', asyncHandler(async (req: Request<Record<string, string>, any, any, BillingQuery>, res: Response) => {
  const {
    page = '1',
    limit = '20',
    cursor,
    status,
    payment_type,
    date_from,
    date_to,
    search
  } = req.query;

  if (status && !VALID_BILLING_STATUSES.includes(status)) {
    throw new ApiError(400, `Invalid status. Must be one of: ${VALID_BILLING_STATUSES.join(', ')}`, 'INVALID_STATUS');
  }

  const limitInt = Math.min(parseInt(limit) || 20, 100);
  const useCursor = !!cursor;

  const include = {
    patients: { select: { id: true, medical_record_number: true, full_name: true } },
    visits: { select: { id: true, visit_number: true, visit_type: true } },
    billing_items: true
  };

  const where: Record<string, any> = {
    ...(status && { status }),
    ...(payment_type && { payment_type }),
    ...(date_from && date_to && { billing_date: { gte: new Date(date_from), lte: new Date(date_to) } }),
    ...(search && {
      OR: [
        { invoice_number: { contains: search, mode: 'insensitive' } },
        { patients: { full_name: { contains: search, mode: 'insensitive' } } },
        { patients: { medical_record_number: { contains: search, mode: 'insensitive' } } }
      ]
    })
  };

  if (useCursor) {
    const billings = await prisma.billings.findMany({
      where, take: limitInt + 1, cursor: { id: cursor }, skip: 1,
      orderBy: { billing_date: 'desc' }, include
    });
    const hasMore = billings.length > limitInt;
    const items = hasMore ? billings.slice(0, limitInt) : billings;
    return res.json({
      success: true, data: items,
      pagination: { limit: limitInt, nextCursor: hasMore ? items[items.length - 1].id : null, hasMore }
    });
  }

  const pageInt = parseInt(page);
  const skip = (pageInt - 1) * limitInt;
  const [billings, total] = await Promise.all([
    prisma.billings.findMany({ where, skip, take: limitInt, orderBy: { billing_date: 'desc' }, include }),
    prisma.billings.count({ where })
  ]);

  res.json({
    success: true,
    data: billings,
    pagination: { page: pageInt, limit: limitInt, total, total_pages: Math.ceil(total / limitInt) }
  });
}));

/**
 * GET /api/billing/pending
 * Get pending billings
 */
router.get('/pending', asyncHandler(async (_req: Request, res: Response) => {
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
router.get('/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
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
router.get('/visit/:visitId', asyncHandler(async (req: Request<{ visitId: string }>, res: Response) => {
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
router.post('/', requireRole(['admin', 'kasir']), asyncHandler(async (req: Request<Record<string, string>, any, CreateBillingBody>, res: Response) => {
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
  const invoiceNumber = await prisma.$queryRaw`SELECT generate_invoice_number() as inv` as Array<{ inv: string }>;

  // Calculate totals
  const subtotal = items.reduce((sum: number, item: BillingItemInput) => sum + (item.unit_price * item.quantity), 0);
  const taxAmount = subtotal * (tax_rate / 100);
  const total = subtotal - discount + taxAmount;

  // Create billing with items
  const billing = await prisma.billings.create({
    data: {
      invoice_number: invoiceNumber[0].inv,
      patient_id: visit.patient_id,
      visit_id,
      payment_type: visit.payment_type as any,
      subtotal,
      discount,
      tax: taxAmount,
      total,
      created_by: req.user!.id,
      billing_items: {
        create: items.map((item: BillingItemInput) => ({
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
router.post('/:id/items', requireRole(['admin', 'kasir']), asyncHandler(async (req: Request<{ id: string }, any, z.infer<typeof billingItemSchema>>, res: Response) => {
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
        billings: { connect: { id } },
        item_type: item.item_type || 'lainnya',
        item_name: item.item_name || 'Item',
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
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
router.delete('/:id/items/:itemId', requireRole(['admin', 'kasir']), asyncHandler(async (req: Request<{ id: string; itemId: string }>, res: Response) => {
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
router.post('/:id/pay', requireRole(['admin', 'kasir']), asyncHandler(async (req: Request<{ id: string }, any, PaymentBody>, res: Response) => {
  const { id } = req.params;
  const payment = paymentSchema.parse(req.body);

  const billing = await prisma.billings.findUnique({ where: { id } });
  if (!billing) {
    throw new ApiError(404, 'Billing tidak ditemukan', 'BILLING_NOT_FOUND');
  }

  if (billing.status === 'paid') {
    throw new ApiError(400, 'Billing sudah lunas', 'BILLING_ALREADY_PAID');
  }

  const newPaidAmount = Number(billing.paid_amount || 0) + payment.paid_amount;
  const remaining = Number(billing.total) - newPaidAmount;

  let newStatus: 'partial' | 'paid' = 'partial';
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
      status: newStatus as any
    }
  });

  // Audit log
  await prisma.audit_logs.create({
    data: {
      table_name: 'billings',
      record_id: id,
      action: 'PAYMENT',
      user_id: req.user!.id,
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
router.post('/:id/cancel', requireRole(['admin']), asyncHandler(async (req: Request<{ id: string }, any, CancelBillingBody>, res: Response) => {
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
      user_id: req.user!.id,
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
router.get('/stats/daily', requireRole(['admin', 'kasir', 'keuangan']), asyncHandler(async (req: Request<Record<string, string>, any, any, { date?: string }>, res: Response) => {
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
router.get('/print/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
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

  const hospital: Record<string, string> = {};
  hospitalSettings.forEach(s => {
    hospital[s.setting_key] = s.setting_value || '';
  });

  res.json({
    success: true,
    data: {
      hospital,
      billing
    }
  });
}));

// GET /api/billing/next-invoice-number
// Returns a preview of the next invoice number without creating one.
router.get('/next-invoice-number', asyncHandler(async (_req: Request, res: Response) => {
  try {
    const result = await prisma.$queryRaw`SELECT generate_invoice_number() as inv` as Array<{ inv: string }>;
    res.json({ success: true, data: result[0].inv });
  } catch {
    // Fallback if the generate_invoice_number() SQL function is not yet installed
    const today = new Date();
    const prefix = `INV${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const last = await prisma.billings.findFirst({
      where: { invoice_number: { startsWith: prefix } },
      orderBy: { invoice_number: 'desc' }
    }).catch(() => null);
    const seq = last ? parseInt(last!.invoice_number.slice(-4), 10) + 1 : 1;
    res.json({ success: true, data: `${prefix}${String(seq).padStart(4, '0')}` });
  }
}));

/**
 * GET /api/billing/rules/preview
 * Preview billing rule application without creating a billing
 */
router.get('/rules/preview', requireRole(['admin', 'kasir', 'keuangan']), asyncHandler(async (req: RulesPreviewRequest, res: Response) => {
  const { payment_type = 'cash', visit_type = 'outpatient', department_id } = req.query;
  const items = req.body?.items || [];
  const result = await applyBillingRules(items, payment_type, visit_type, department_id || null);
  res.json({ success: true, data: result });
}));

/**
 * POST /api/billing/generate/:visitId
 * Auto-generate billing from visit services (prescriptions, lab, radiology)
 * and apply billing rules based on payment_type + visit_type.
 */
router.post('/generate/:visitId', requireRole(['admin', 'kasir']), asyncHandler(async (req: Request<{ visitId: string }>, res: Response) => {
  const { visitId } = req.params;

  // Check existing billing
  const existing = await prisma.billings.findFirst({ where: { visit_id: visitId } });
  if (existing) {
    throw new ApiError(409, 'Billing sudah ada untuk kunjungan ini. Gunakan endpoint edit untuk menambah item.', 'BILLING_EXISTS');
  }

  // Fetch visit with all related services
  const visit = await prisma.visits.findUnique({
    where: { id: visitId },
    include: {
      patients: true,
      departments: true
    }
  });

  if (!visit) throw new ApiError(404, 'Kunjungan tidak ditemukan', 'VISIT_NOT_FOUND');

  // Collect raw items
  const rawItems: RawBillingItem[] = [];

  // Consultation fee
  rawItems.push({
    item_type: 'konsultasi',
    item_name: `Konsultasi - ${visit.departments?.department_name || 'Umum'}`,
    quantity: 1,
    unit_price: 0  // will be set by tariff rule
  });

  // TODO: Add prescriptions, lab, and radiology items when relations are available in schema

  const { adjustedItems, subtotal, discount, tax, total, rulesApplied } =
    await applyBillingRules(rawItems, visit.payment_type || 'cash', visit.visit_type || 'outpatient', visit.department_id);

  // Generate invoice number
  let invoiceNumber: string;
  try {
    const result = await prisma.$queryRaw`SELECT generate_invoice_number() as inv` as Array<{ inv: string }>;
    invoiceNumber = result[0].inv;
  } catch {
    const today = new Date();
    const prefix = `INV${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const last = await prisma.billings.findFirst({
      where: { invoice_number: { startsWith: prefix } },
      orderBy: { invoice_number: 'desc' }
    }).catch(() => null);
    const seq = last ? parseInt(last!.invoice_number.slice(-4), 10) + 1 : 1;
    invoiceNumber = `${prefix}${String(seq).padStart(4, '0')}`;
  }

  const billing = await prisma.billings.create({
    data: {
      invoice_number: invoiceNumber,
      patient_id: visit.patient_id,
      visit_id: visitId,
      payment_type: visit.payment_type || 'cash',
      subtotal,
      discount,
      tax,
      total,
      notes: `Auto-generated. Rules applied: ${rulesApplied.map(r => r.rule).join(', ')}`,
      created_by: req.user!.id,
      billing_items: {
        create: adjustedItems.map(item => ({
          item_type: item.item_type,
          item_name: item.item_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.unit_price * item.quantity
        }))
      }
    },
    include: { billing_items: true }
  });

  await prisma.audit_logs.create({
    data: {
      table_name: 'billings',
      record_id: billing.id,
      action: 'AUTO_GENERATE',
      user_id: req.user!.id,
      new_data: { visitId, rulesApplied: JSON.stringify(rulesApplied), invoiceNumber } as any
    }
  }).catch(() => { });

  res.status(201).json({
    success: true,
    message: 'Billing berhasil dibuat otomatis dari data kunjungan',
    data: { billing, rulesApplied }
  });
}));

export default router;

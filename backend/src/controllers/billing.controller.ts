/**
 * SIMRS ZEN - Billing Controller
 * Handles all billing and payment operations
 */

import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';

// Validation schemas
const createBillingSchema = z.object({
  patient_id: z.string().uuid(),
  visit_id: z.string().uuid(),
  payment_type: z.enum(['cash', 'bpjs', 'insurance', 'corporate']),
  items: z.array(z.object({
    item_name: z.string(),
    item_type: z.enum(['consultation', 'procedure', 'medicine', 'lab', 'radiology', 'room', 'equipment', 'other']),
    quantity: z.number().min(1),
    unit_price: z.number().min(0)
  })).optional(),
  discount: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  notes: z.string().optional()
});

const paymentSchema = z.object({
  payment_method: z.enum(['cash', 'debit', 'credit', 'transfer', 'qris', 'bpjs', 'insurance']),
  amount: z.number().min(0),
  reference_number: z.string().optional(),
  notes: z.string().optional()
});

// Request body types
interface BillingItemInput {
  item_name: string;
  item_type: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface CreateBillingBody {
  patient_id: string;
  visit_id: string;
  payment_type: string;
  items?: BillingItemInput[];
  discount?: number;
  tax?: number;
  notes?: string;
}

interface PaymentBody {
  payment_method: string;
  amount: number;
  reference_number?: string;
  notes?: string;
}

interface BillingItemBody {
  item_name: string;
  item_type: string;
  quantity: number;
  unit_price: number;
}

interface CancelBillingBody {
  reason: string;
}

interface BillingQuery {
  page?: string;
  limit?: string;
  patient_id?: string;
  status?: string;
  payment_type?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: string;
}

/**
 * Generate Invoice Number
 */
const generateInvoiceNumber = async (): Promise<string> => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');

  const lastInvoice = await prisma.billings.findFirst({
    where: {
      invoice_number: { startsWith: `INV${year}${month}` }
    },
    orderBy: { invoice_number: 'desc' }
  });

  let sequence = 1;
  if (lastInvoice) {
    const lastSeq = parseInt(lastInvoice.invoice_number.slice(-5));
    sequence = lastSeq + 1;
  }

  return `INV${year}${month}${sequence.toString().padStart(5, '0')}`;
};

/**
 * Get all billings with pagination
 */
export const getBillings = async (req: Request<unknown, unknown, unknown, BillingQuery>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '20',
      patient_id,
      status,
      payment_type,
      date_from,
      date_to,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: Record<string, unknown> = {};

    if (patient_id) where.patient_id = patient_id;
    if (status) where.status = status;
    if (payment_type) where.payment_type = payment_type;

    if (date_from || date_to) {
      where.billing_date = {};
      if (date_from) (where.billing_date as Record<string, unknown>).gte = new Date(date_from);
      if (date_to) (where.billing_date as Record<string, unknown>).lte = new Date(date_to);
    }

    const [total, billings] = await Promise.all([
      prisma.billings.count({ where }),
      prisma.billings.findMany({
        where,
        skip,
        take,
        orderBy: { [sort_by]: sort_order },
        include: {
          patients: {
            select: {
              id: true,
              full_name: true,
              medical_record_number: true
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
      })
    ]);

    res.json({
      success: true,
      data: billings,
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
 * Get single billing by ID
 */
export const getBilling = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const billing = await prisma.billings.findUnique({
      where: { id },
      include: {
        patients: true,
        visits: {
          include: {
            departments: true,
            doctors: true
          }
        },
        billing_items: true
        // TODO: Add payments model to Prisma schema, then re-enable:
        // payments: true
      }
    });

    if (!billing) {
      throw new ApiError(404, 'Tagihan tidak ditemukan', 'BILLING_NOT_FOUND');
    }

    res.json({
      success: true,
      data: billing
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new billing
 */
export const createBilling = async (req: Request<unknown, unknown, CreateBillingBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createBillingSchema.parse(req.body);

    // Verify visit exists
    const visit = await prisma.visits.findUnique({
      where: { id: data.visit_id },
      include: { patients: true }
    });
    if (!visit) {
      throw new ApiError(404, 'Kunjungan tidak ditemukan', 'VISIT_NOT_FOUND');
    }

    // Generate invoice number
    const invoice_number = await generateInvoiceNumber();

    // Calculate totals
    let subtotal = 0;
    const items = (data.items || []).map(item => {
      const totalPrice = item.quantity * item.unit_price;
      subtotal += totalPrice;
      return {
        item_name: item.item_name,
        item_type: item.item_type,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: totalPrice
      };
    });

    const discount = data.discount || 0;
    const tax = data.tax || 0;
    const total = subtotal - discount + tax;

    // Create billing with items
    const billing = await prisma.billings.create({
      data: {
        invoice_number,
        patient_id: data.patient_id,
        visit_id: data.visit_id,
        payment_type: data.payment_type,
        billing_date: new Date(),
        subtotal,
        discount,
        tax,
        total,
        status: 'pending',
        notes: data.notes,
        created_by: req.user?.id,
        billing_items: {
          create: items
        }
      },
      include: {
        patients: true,
        visits: true,
        billing_items: true
      }
    });

    // Audit log
    await prisma.audit_logs.create({
      data: {
        table_name: 'billings',
        action: 'CREATE',
        record_id: billing.id,
        user_id: req.user?.id,
        new_data: billing as unknown as object
      }
    });

    res.status(201).json({
      success: true,
      data: billing,
      message: 'Tagihan berhasil dibuat'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add item to billing
 */
export const addBillingItem = async (req: Request<{ id: string }, unknown, BillingItemBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const itemData = req.body;

    const billing = await prisma.billings.findUnique({ where: { id } });
    if (!billing) {
      throw new ApiError(404, 'Tagihan tidak ditemukan', 'BILLING_NOT_FOUND');
    }

    if (billing.status === 'paid') {
      throw new ApiError(400, 'Tagihan sudah dibayar', 'BILLING_PAID');
    }

    const total_price = itemData.quantity * itemData.unit_price;

    const item = await prisma.billing_items.create({
      data: {
        billing_id: id,
        ...itemData,
        total_price
      }
    });

    // Update billing totals
    const newSubtotal = billing.subtotal.toNumber() + total_price;
    const newTotal = newSubtotal - (billing.discount?.toNumber() || 0) + (billing.tax?.toNumber() || 0);

    await prisma.billings.update({
      where: { id },
      data: {
        subtotal: newSubtotal,
        total: newTotal
      }
    });

    res.status(201).json({
      success: true,
      data: item,
      message: 'Item berhasil ditambahkan'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove item from billing
 */
export const removeBillingItem = async (req: Request<{ id: string; itemId: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, itemId } = req.params;

    const billing = await prisma.billings.findUnique({ where: { id } });
    if (!billing) {
      throw new ApiError(404, 'Tagihan tidak ditemukan', 'BILLING_NOT_FOUND');
    }

    if (billing.status === 'paid') {
      throw new ApiError(400, 'Tagihan sudah dibayar', 'BILLING_PAID');
    }

    const item = await prisma.billing_items.findUnique({ where: { id: itemId } });
    if (!item || item.billing_id !== id) {
      throw new ApiError(404, 'Item tidak ditemukan', 'ITEM_NOT_FOUND');
    }

    await prisma.billing_items.delete({ where: { id: itemId } });

    // Update billing totals
    const newSubtotal = billing.subtotal.toNumber() - item.total_price.toNumber();
    const newTotal = newSubtotal - (billing.discount?.toNumber() || 0) + (billing.tax?.toNumber() || 0);

    await prisma.billings.update({
      where: { id },
      data: {
        subtotal: newSubtotal,
        total: newTotal
      }
    });

    res.json({
      success: true,
      message: 'Item berhasil dihapus'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Process payment
 */
export const processPayment = async (req: Request<{ id: string }, unknown, PaymentBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const paymentData = paymentSchema.parse(req.body);

    const billing = await prisma.billings.findUnique({
      where: { id },
      include: { billing_items: true }
    });

    if (!billing) {
      throw new ApiError(404, 'Tagihan tidak ditemukan', 'BILLING_NOT_FOUND');
    }

    if (billing.status === 'paid') {
      throw new ApiError(400, 'Tagihan sudah lunas', 'ALREADY_PAID');
    }

    const previousPaid = billing.paid_amount?.toNumber() || 0;
    const newPaidAmount = previousPaid + paymentData.amount;
    const remaining = billing.total.toNumber() - newPaidAmount;

    // Create payment record
    // TODO: Add payments model to Prisma schema to enable payment tracking
    // await prisma.payments.create({
    //   data: {
    //     billing_id: id,
    //     amount: paymentData.amount,
    //     payment_method: paymentData.payment_method,
    //     reference_number: paymentData.reference_number,
    //     notes: paymentData.notes,
    //     processed_by: req.user?.id,
    //     payment_date: new Date()
    //   }
    // });
    void paymentData; // suppress unused warning until payments model is added

    // Update billing status
    const updatedBilling = await prisma.billings.update({
      where: { id },
      data: {
        paid_amount: newPaidAmount,
        payment_method: paymentData.payment_method,
        payment_date: new Date(),
        status: remaining <= 0 ? 'paid' : 'partial',
        paid_by: req.user?.id
      },
      include: {
        patients: true,
        billing_items: true
        // TODO: Add payments model to Prisma schema, then re-enable:
        // payments: true
      }
    });

    // Audit log
    await prisma.audit_logs.create({
      data: {
        table_name: 'billings',
        action: 'PAYMENT',
        record_id: id,
        user_id: req.user?.id,
        new_data: { ...paymentData, remaining } as unknown as object
      }
    });

    res.json({
      success: true,
      data: {
        billing: updatedBilling,
        payment: {
          amount: paymentData.amount,
          remaining: Math.max(0, remaining),
          status: remaining <= 0 ? 'paid' : 'partial'
        }
      },
      message: remaining <= 0 ? 'Pembayaran lunas' : `Sisa tagihan: Rp ${remaining.toLocaleString('id-ID')}`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get billing summary/statistics
 */
export const getBillingSummary = async (req: Request<unknown, unknown, unknown, { date_from?: string; date_to?: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { date_from, date_to } = req.query;

    const where: Record<string, unknown> = {};
    if (date_from || date_to) {
      where.billing_date = {};
      if (date_from) (where.billing_date as Record<string, unknown>).gte = new Date(date_from);
      if (date_to) (where.billing_date as Record<string, unknown>).lte = new Date(date_to);
    }

    const [
      totalBillings,
      paidBillings,
      pendingBillings,
      totalRevenue,
      pendingAmount,
      byPaymentType
    ] = await Promise.all([
      prisma.billings.count({ where }),
      prisma.billings.count({ where: { ...where, status: 'paid' } }),
      prisma.billings.count({ where: { ...where, status: 'pending' } }),
      prisma.billings.aggregate({
        where: { ...where, status: 'paid' },
        _sum: { total: true }
      }),
      prisma.billings.aggregate({
        where: { ...where, status: 'pending' },
        _sum: { total: true }
      }),
      prisma.billings.groupBy({
        by: ['payment_type'],
        where: { ...where, status: 'paid' },
        _sum: { total: true },
        _count: true
      })
    ]);

    res.json({
      success: true,
      data: {
        total: totalBillings,
        paid: paidBillings,
        pending: pendingBillings,
        revenue: totalRevenue._sum.total || 0,
        pendingAmount: pendingAmount._sum.total || 0,
        byPaymentType: byPaymentType.map(p => ({
          type: p.payment_type,
          count: p._count,
          amount: p._sum.total || 0
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel billing
 */
export const cancelBilling = async (req: Request<{ id: string }, unknown, CancelBillingBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const billing = await prisma.billings.findUnique({ where: { id } });
    if (!billing) {
      throw new ApiError(404, 'Tagihan tidak ditemukan', 'BILLING_NOT_FOUND');
    }

    if (billing.status === 'paid') {
      throw new ApiError(400, 'Tagihan yang sudah lunas tidak dapat dibatalkan', 'BILLING_PAID');
    }

    const updatedBilling = await prisma.billings.update({
      where: { id },
      data: {
        status: 'cancelled',
        notes: `${billing.notes || ''}\n[BATAL] ${reason}`
      }
    });

    // Audit log
    await prisma.audit_logs.create({
      data: {
        table_name: 'billings',
        action: 'CANCEL',
        record_id: id,
        user_id: req.user?.id,
        old_data: billing as unknown as object,
        new_data: { reason }
      }
    });

    res.json({
      success: true,
      data: updatedBilling,
      message: 'Tagihan berhasil dibatalkan'
    });
  } catch (error) {
    next(error);
  }
};

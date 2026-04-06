/**
 * SIMRS ZEN - Inventory Routes
 * Manages stock, purchase orders, suppliers, and auto-reorder
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { requireRole, ROLES } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();


// ============================================
// STOCK MANAGEMENT
// ============================================

/**
 * GET /api/inventory/stock
 */
router.get('/stock',
  requireRole([ROLES.FARMASI, ROLES.PROCUREMENT, ROLES.MANAJEMEN]),
  asyncHandler(async (req, res) => {
    const { category, lowStock, search, cursor, page = 1, limit = 50 } = req.query;
    const take = Math.min(parseInt(limit), 200);

    const where = {};
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { item_name: { contains: search, mode: 'insensitive' } },
        { item_code: { contains: search } }
      ];
    }
    if (lowStock === 'true') {
      where.AND = [{ current_stock: { not: null } }]; // filter handled post-query below
    }

    const include = {
      inventory_batches: {
        where: { remaining_quantity: { gt: 0 } },
        orderBy: { expiry_date: 'asc' }
      },
      inventory_reorder_settings: { take: 1 },
    };

    const mapItem = item => ({
      ...item,
      name: item.item_name,
      code: item.item_code,
      stock: item.current_stock,
      min_stock: item.minimum_stock,
      settings: item.inventory_reorder_settings?.[0] || null,
    });

    // Cursor-based pagination
    if (cursor) {
      const items = await prisma.inventory_items.findMany({
        where: { ...where, id: { gt: cursor } },
        take: take + 1,
        orderBy: { id: 'asc' },
        include,
      });
      const hasMore = items.length > take;
      if (hasMore) items.pop();
      return res.json({
        success: true,
        data: items.map(mapItem),
        meta: { next_cursor: hasMore ? items[items.length - 1]?.id : null, has_more: hasMore, limit: take },
      });
    }

    // Offset pagination
    const skip = (parseInt(page) - 1) * take;
    const [items, total] = await Promise.all([
      prisma.inventory_items.findMany({ where, include, orderBy: { item_name: 'asc' }, skip, take }),
      prisma.inventory_items.count({ where })
    ]);

    let data = items.map(mapItem);
    if (lowStock === 'true') {
      data = data.filter(i => i.current_stock !== null && i.min_stock !== null && i.current_stock <= i.min_stock);
    }

    res.json({ success: true, data, pagination: { page: parseInt(page), limit: take, total } });
  })
);

/**
 * GET /api/inventory/stock/expiring
 */
router.get('/stock/expiring',
  requireRole([ROLES.FARMASI, ROLES.PROCUREMENT]),
  asyncHandler(async (req, res) => {
    const { days = 90 } = req.query;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(days));

    const batches = await prisma.inventory_batches.findMany({
      where: {
        expiry_date: { lte: expiryDate },
        remaining_quantity: { gt: 0 }
      },
      include: { inventory_items: { select: { item_name: true, item_code: true } } },
      orderBy: { expiry_date: 'asc' }
    });

    res.json({ success: true, data: batches });
  })
);

/**
 * POST /api/inventory/stock/adjust
 */
router.post('/stock/adjust',
  requireRole([ROLES.FARMASI, ROLES.PROCUREMENT]),
  asyncHandler(async (req, res) => {
    const { itemId, batchId, quantity, reason, type } = req.body;

    const transaction = await prisma.$transaction(async (tx) => {
      // Update batch
      const batch = await tx.inventory_batches.update({
        where: { id: batchId },
        data: {
          remaining_quantity: { increment: type === 'IN' ? quantity : -quantity }
        }
      });

      // Update item stock
      await tx.inventory_items.update({
        where: { id: itemId },
        data: {
          current_stock: { increment: type === 'IN' ? quantity : -quantity }
        }
      });

      // Log transaction
      const txRecord = await tx.inventory_transactions.create({
        data: {
          item_id: itemId,
          batch_id: batchId,
          transaction_type: type === 'IN' ? 'STOCK_IN' : 'STOCK_OUT',
          quantity,
          reason,
          performed_by: req.user.id
        }
      });

      return txRecord;
    });

    res.json({ success: true, data: transaction });
  })
);

// ============================================
// PURCHASE ORDERS
// ============================================

/**
 * GET /api/inventory/purchase-orders
 */
router.get('/purchase-orders',
  requireRole([ROLES.PROCUREMENT, ROLES.KEUANGAN, ROLES.MANAJEMEN]),
  asyncHandler(async (req, res) => {
    const { status, supplierId, startDate, endDate } = req.query;

    const where = {};
    if (status) where.status = status;
    if (supplierId) where.supplier_id = supplierId;
    if (startDate && endDate) {
      where.order_date = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const orders = await prisma.purchase_orders.findMany({
      where,
      include: {
        suppliers: { select: { supplier_name: true } },
        purchase_order_items: true
      },
      orderBy: { order_date: 'desc' }
    });

    res.json({ success: true, data: orders });
  })
);

/**
 * POST /api/inventory/purchase-orders
 */
router.post('/purchase-orders',
  requireRole([ROLES.PROCUREMENT]),
  asyncHandler(async (req, res) => {
    const { supplierId, items, notes, expectedDelivery } = req.body;

    const poNumber = await generatePONumber();

    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    const order = await prisma.purchase_orders.create({
      data: {
        po_number: poNumber,
        supplier_id: supplierId,
        order_date: new Date(),
        expected_delivery: expectedDelivery ? new Date(expectedDelivery) : null,
        total_amount: totalAmount,
        notes,
        status: 'DRAFT',
        created_by: req.user.id,
        purchase_order_items: {
          create: items.map(item => ({
            item_id: item.itemId,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            subtotal: item.quantity * item.unitPrice
          }))
        }
      },
      include: { purchase_order_items: true }
    });

    res.status(201).json({ success: true, data: order });
  })
);

/**
 * PUT /api/inventory/purchase-orders/:id/submit
 */
router.put('/purchase-orders/:id/submit',
  requireRole([ROLES.PROCUREMENT]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const order = await prisma.purchase_orders.update({
      where: { id },
      data: { status: 'SUBMITTED', submitted_at: new Date() }
    });

    res.json({ success: true, data: order });
  })
);

/**
 * PUT /api/inventory/purchase-orders/:id/approve
 */
router.put('/purchase-orders/:id/approve',
  requireRole([ROLES.MANAJEMEN, ROLES.KEUANGAN]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { approved } = req.body;

    const order = await prisma.purchase_orders.update({
      where: { id },
      data: {
        status: approved ? 'APPROVED' : 'REJECTED',
        approved_by: req.user.id,
        approved_at: new Date()
      }
    });

    res.json({ success: true, data: order });
  })
);

/**
 * PUT /api/inventory/purchase-orders/:id/receive
 */
router.put('/purchase-orders/:id/receive',
  requireRole([ROLES.PROCUREMENT, ROLES.FARMASI]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { receivedItems } = req.body; // [{ itemId, batchNumber, expiryDate, quantityReceived }]

    const result = await prisma.$transaction(async (tx) => {
      // Update PO status
      await tx.purchase_orders.update({
        where: { id },
        data: { status: 'RECEIVED', received_at: new Date(), received_by: req.user.id }
      });

      // Create batches and update stock
      for (const item of receivedItems) {
        // Create batch
        const batch = await tx.inventory_batches.create({
          data: {
            item_id: item.itemId,
            batch_number: item.batchNumber,
            expiry_date: new Date(item.expiryDate),
            initial_quantity: item.quantityReceived,
            remaining_quantity: item.quantityReceived,
            purchase_order_id: id
          }
        });

        // Update item stock
        await tx.inventory_items.update({
          where: { id: item.itemId },
          data: { current_stock: { increment: item.quantityReceived } }
        });

        // Log transaction
        await tx.inventory_transactions.create({
          data: {
            item_id: item.itemId,
            batch_id: batch.id,
            transaction_type: 'PURCHASE',
            quantity: item.quantityReceived,
            reference_type: 'PO',
            reference_id: id,
            performed_by: req.user.id
          }
        });
      }

      return { received: receivedItems.length };
    });

    res.json({ success: true, data: result });
  })
);

// ============================================
// SUPPLIERS
// ============================================

/**
 * GET /api/inventory/suppliers
 */
router.get('/suppliers',
  requireRole([ROLES.PROCUREMENT]),
  asyncHandler(async (req, res) => {
    const suppliers = await prisma.suppliers.findMany({
      where: { is_active: true },
      orderBy: { supplier_name: 'asc' }
    });

    res.json({ success: true, data: suppliers });
  })
);

/**
 * POST /api/inventory/suppliers
 */
router.post('/suppliers',
  requireRole([ROLES.PROCUREMENT]),
  asyncHandler(async (req, res) => {
    const supplier = await prisma.suppliers.create({
      data: { ...req.body, created_by: req.user.id }
    });

    res.status(201).json({ success: true, data: supplier });
  })
);

// ============================================
// AUTO REORDER
// ============================================

/**
 * GET /api/inventory/reorder-suggestions
 */
router.get('/reorder-suggestions',
  requireRole([ROLES.PROCUREMENT]),
  asyncHandler(async (req, res) => {
    const items = await prisma.inventory_items.findMany({
      where: {
        auto_reorder: true,
        current_stock: { lte: prisma.raw('reorder_point') }
      },
      include: {
        suppliers: { select: { id: true, supplier_name: true } }
      }
    });

    const suggestions = items.map(item => ({
      item,
      suggestedQuantity: item.reorder_quantity || (item.maximum_stock - item.current_stock)
    }));

    res.json({ success: true, data: suggestions });
  })
);

// Helper
async function generatePONumber() {
  const today = new Date();
  const prefix = `PO${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
  
  const last = await prisma.purchase_orders.findFirst({
    where: { po_number: { startsWith: prefix } },
    orderBy: { po_number: 'desc' }
  });

  const seq = last ? parseInt(last.po_number.slice(-4), 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

// GET /api/inventory/next-po-number
// Returns a preview of the next PO number without creating one.
router.get('/next-po-number', asyncHandler(async (req, res) => {
  const number = await generatePONumber();
  res.json({ success: true, data: number });
}));

// GET /api/inventory/next-pr-number
// Returns a preview of the next Purchase Request number without creating one.
router.get('/next-pr-number', asyncHandler(async (req, res) => {
  const today = new Date();
  const prefix = `PR${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
  let seq = 1;
  try {
    const last = await prisma.purchase_requests.findFirst({
      where: { pr_number: { startsWith: prefix } },
      orderBy: { pr_number: 'desc' }
    });
    if (last) seq = parseInt(last.pr_number.slice(-4), 10) + 1;
  } catch {
    // purchase_requests table may not exist yet; return a placeholder number
  }
  res.json({ success: true, data: `${prefix}${String(seq).padStart(4, '0')}` });
}));

// ============================================
// PURCHASE REQUESTS
// ============================================

/**
 * GET /api/inventory/purchase-requests
 */
router.get('/purchase-requests',
  requireRole([ROLES.PROCUREMENT]),
  asyncHandler(async (req, res) => {
    const { status, department_id, page = 1, limit = 50 } = req.query;

    const where = {};
    if (status) where.status = status;
    if (department_id) where.department_id = department_id;

    const [total, requests] = await Promise.all([
      prisma.purchase_requests.count({ where }),
      prisma.purchase_requests.findMany({
        where,
        orderBy: { request_date: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
    ]);

    res.json({
      success: true,
      data: requests,
      pagination: { page: parseInt(page), limit: parseInt(limit), total },
    });
  })
);

/**
 * POST /api/inventory/purchase-requests
 */
router.post('/purchase-requests',
  requireRole([ROLES.PROCUREMENT]),
  asyncHandler(async (req, res) => {
    const today = new Date();
    const prefix = `PR${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
    const last = await prisma.purchase_requests.findFirst({
      where: { pr_number: { startsWith: prefix } },
      orderBy: { pr_number: 'desc' },
    });
    const seq = last ? parseInt(last.pr_number.slice(-4), 10) + 1 : 1;
    const pr_number = `${prefix}${String(seq).padStart(4, '0')}`;

    const request = await prisma.purchase_requests.create({
      data: { ...req.body, pr_number, requested_by: req.user.id },
    });
    res.status(201).json({ success: true, data: request });
  })
);

/**
 * PUT /api/inventory/purchase-requests/:id
 */
router.put('/purchase-requests/:id',
  requireRole([ROLES.PROCUREMENT]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const request = await prisma.purchase_requests.update({ where: { id }, data: req.body });
    res.json({ success: true, data: request });
  })
);

// ============================================
// VENDORS (alias to suppliers)
// ============================================

/**
 * GET /api/inventory/vendors
 */
router.get('/vendors',
  requireRole([ROLES.PROCUREMENT]),
  asyncHandler(async (req, res) => {
    const vendors = await prisma.suppliers.findMany({
      where: { is_active: true },
      orderBy: { supplier_name: 'asc' },
    });
    res.json({ success: true, data: vendors });
  })
);

/**
 * POST /api/inventory/vendors
 */
router.post('/vendors',
  requireRole([ROLES.PROCUREMENT]),
  asyncHandler(async (req, res) => {
    const vendor = await prisma.suppliers.create({
      data: { ...req.body, created_by: req.user.id },
    });
    res.status(201).json({ success: true, data: vendor });
  })
);

// ============================================
// INVENTORY REORDER SETTINGS
// ============================================

/**
 * GET /api/inventory/settings/:id
 * id = inventory_reorder_settings.id OR medicine_id OR inventory_item_id
 */
router.get('/settings/:id',
  requireRole([ROLES.FARMASI, ROLES.PROCUREMENT, ROLES.MANAJEMEN]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const setting = await prisma.inventory_reorder_settings.findFirst({
      where: { OR: [{ id }, { medicine_id: id }, { inventory_item_id: id }] },
    });
    if (!setting) return res.status(404).json({ success: false, error: 'Settings tidak ditemukan' });
    res.json({ success: true, data: setting });
  })
);

/**
 * POST /api/inventory/settings
 */
router.post('/settings',
  requireRole([ROLES.FARMASI, ROLES.PROCUREMENT]),
  asyncHandler(async (req, res) => {
    const {
      medicine_id, inventory_item_id,
      auto_reorder_enabled = true,
      reorder_point = 10,
      reorder_quantity = 100,
      max_stock, preferred_supplier, lead_time_days = 7,
    } = req.body;

    // Upsert by medicine_id or inventory_item_id
    const existingWhere = medicine_id
      ? { medicine_id }
      : inventory_item_id
        ? { inventory_item_id }
        : null;

    if (existingWhere) {
      const existing = await prisma.inventory_reorder_settings.findFirst({ where: existingWhere });
      if (existing) {
        const updated = await prisma.inventory_reorder_settings.update({
          where: { id: existing.id },
          data: { auto_reorder_enabled, reorder_point, reorder_quantity, max_stock: max_stock ?? null, preferred_supplier: preferred_supplier ?? null, lead_time_days },
        });
        return res.json({ success: true, data: updated });
      }
    }

    const setting = await prisma.inventory_reorder_settings.create({
      data: {
        medicine_id: medicine_id || null,
        inventory_item_id: inventory_item_id || null,
        auto_reorder_enabled,
        reorder_point,
        reorder_quantity,
        max_stock: max_stock ?? null,
        preferred_supplier: preferred_supplier ?? null,
        lead_time_days,
      },
    });
    res.status(201).json({ success: true, data: setting });
  })
);

/**
 * PUT /api/inventory/settings/:id
 */
router.put('/settings/:id',
  requireRole([ROLES.FARMASI, ROLES.PROCUREMENT]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      auto_reorder_enabled, reorder_point, reorder_quantity,
      max_stock, preferred_supplier, lead_time_days,
    } = req.body;

    // Allow lookup by medicine_id or inventory_item_id as well
    const existing = await prisma.inventory_reorder_settings.findFirst({
      where: { OR: [{ id }, { medicine_id: id }, { inventory_item_id: id }] },
    });
    if (!existing) return res.status(404).json({ success: false, error: 'Settings tidak ditemukan' });

    const updated = await prisma.inventory_reorder_settings.update({
      where: { id: existing.id },
      data: {
        auto_reorder_enabled: auto_reorder_enabled ?? existing.auto_reorder_enabled,
        reorder_point: reorder_point ?? existing.reorder_point,
        reorder_quantity: reorder_quantity ?? existing.reorder_quantity,
        max_stock: max_stock !== undefined ? (max_stock ?? null) : existing.max_stock,
        preferred_supplier: preferred_supplier !== undefined ? (preferred_supplier ?? null) : existing.preferred_supplier,
        lead_time_days: lead_time_days ?? existing.lead_time_days,
      },
    });
    res.json({ success: true, data: updated });
  })
);

export default router;

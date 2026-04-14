/**
 * SIMRS ZEN - Pharmacy Routes
 * CRUD operations for prescriptions and medicine dispensing
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { requireRole, checkMenuAccess } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import * as cache from '../services/cache.service.js';

const router = Router();

// Using requireRole (in-memory check) instead of checkMenuAccess (DB query) to avoid N+1
router.use(requireRole(['farmasi', 'admin']));

// Validation schemas
const prescriptionItemSchema = z.object({
  medicine_id: z.string().uuid().optional(),
  medicine_name: z.string(),
  dosage: z.string(),
  frequency: z.string(),
  duration: z.string().optional(),
  quantity: z.number().int().positive(),
  unit: z.string(),
  instructions: z.string().optional()
});

const prescriptionSchema = z.object({
  patient_id: z.string().uuid(),
  visit_id: z.string().uuid().optional(),
  doctor_id: z.string().uuid().optional(),
  items: z.array(prescriptionItemSchema),
  notes: z.string().optional()
});

const dispensedItemSchema = z.object({
  item_id: z.string(),
  dispensed_quantity: z.number()
});

const returnItemSchema = z.object({
  item_id: z.string(),
  return_quantity: z.number(),
  batch_id: z.string().optional()
});

// Type definitions
interface PrescriptionBody extends z.infer<typeof prescriptionSchema> { }
interface VerifyBody {
  notes?: string;
}
interface DispenseBody {
  dispensed_items?: z.infer<typeof dispensedItemSchema>[];
}
interface RejectBody {
  reason: string;
}
interface ReturnBody {
  return_items?: z.infer<typeof returnItemSchema>[];
  reason?: string;
}
interface CheckInteractionsBody {
  medicine_ids: string[];
  patient_id?: string;
}

type PrescriptionQuery = {
  page?: string;
  limit?: string;
  cursor?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
};

type MedicineQuery = {
  page?: string;
  limit?: string;
  search?: string;
  category?: string;
};

type ExpiringQuery = {
  days?: string;
};

/** Valid state transitions */
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['verified', 'rejected'],
  verified: ['preparing', 'rejected'],
  preparing: ['ready', 'rejected'],
  ready: ['dispensed'],
  dispensed: ['returned'],
  rejected: [],
  returned: [],
};

function assertTransition(current: string, next: string): void {
  if (!VALID_TRANSITIONS[current]?.includes(next)) {
    throw new ApiError(400,
      `Tidak bisa mengubah status dari "${current}" ke "${next}"`,
      'INVALID_TRANSITION'
    );
  }
}

/**
 * GET /api/pharmacy/prescriptions
 * Get all prescriptions
 */
router.get('/prescriptions', asyncHandler(async (req: Request<Record<string, string>, any, any, PrescriptionQuery>, res: Response) => {
  const {
    page = '1',
    limit = '20',
    cursor,
    status,
    date_from,
    date_to,
    search
  } = req.query;

  const take = parseInt(limit);

  const where: Record<string, any> = {
    ...(status && { status }),
    ...(date_from && date_to && {
      prescription_date: {
        gte: new Date(date_from),
        lte: new Date(date_to)
      }
    }),
    ...(search && {
      OR: [
        { prescription_number: { contains: search, mode: 'insensitive' as const } },
        { patients: { full_name: { contains: search, mode: 'insensitive' as const } } },
        { patients: { medical_record_number: { contains: search, mode: 'insensitive' as const } } }
      ]
    })
  };

  const include = {
    patients: {
      select: { id: true, medical_record_number: true, full_name: true }
    },
    doctors: { select: { id: true } },
    prescription_items: true
  };

  // Cursor-based pagination
  if (cursor) {
    const prescriptions = await prisma.prescriptions.findMany({
      where: { ...where, id: { gt: cursor } },
      take: take + 1,
      orderBy: { id: 'asc' },
      include,
    });

    const hasMore = prescriptions.length > take;
    if (hasMore) prescriptions.pop();

    return res.json({
      success: true,
      data: prescriptions,
      meta: {
        next_cursor: hasMore ? prescriptions[prescriptions.length - 1]?.id : null,
        has_more: hasMore,
        limit: take,
      },
    });
  }

  // Offset-based pagination (backward compatible)
  const skip = (parseInt(page) - 1) * take;

  const [prescriptions, total] = await Promise.all([
    prisma.prescriptions.findMany({
      where,
      skip,
      take,
      orderBy: { prescription_date: 'desc' },
      include,
    }),
    prisma.prescriptions.count({ where })
  ]);

  res.json({
    success: true,
    data: prescriptions,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      total_pages: Math.ceil(total / take)
    }
  });
}));

/**
 * GET /api/pharmacy/prescriptions/pending
 * Get pending prescriptions for dispensing
 */
router.get('/prescriptions/pending', asyncHandler(async (req: Request, res: Response) => {
  const prescriptions = await prisma.prescriptions.findMany({
    where: { status: 'pending' },
    orderBy: { prescription_date: 'asc' },
    include: {
      patients: {
        select: {
          id: true,
          medical_record_number: true,
          full_name: true,
          allergy_notes: true
        }
      },
      doctors: { select: { id: true } },
      prescription_items: true
    }
  });

  res.json({
    success: true,
    data: prescriptions
  });
}));

/**
 * GET /api/pharmacy/prescriptions/:id
 * Get prescription details
 */
router.get('/prescriptions/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const prescription = await prisma.prescriptions.findUnique({
    where: { id },
    include: {
      patients: true,
      doctors: { select: { id: true } },
      visits: true,
      prescription_items: true
    }
  });

  if (!prescription) {
    throw new ApiError(404, 'Resep tidak ditemukan', 'PRESCRIPTION_NOT_FOUND');
  }

  res.json({
    success: true,
    data: prescription
  });
}));

/**
 * POST /api/pharmacy/prescriptions
 * Create new prescription
 */
router.post('/prescriptions', requireRole(['admin', 'dokter']), asyncHandler(async (req: Request<Record<string, string>, any, PrescriptionBody>, res: Response) => {
  const data = prescriptionSchema.parse(req.body);

  // Generate prescription number
  const datePrefix = 'RX' + new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const lastRx = await prisma.prescriptions.findFirst({
    where: { prescription_number: { startsWith: datePrefix } },
    orderBy: { prescription_number: 'desc' }
  });

  const seq = lastRx
    ? parseInt(lastRx.prescription_number.slice(-4)) + 1
    : 1;

  const prescription_number = `${datePrefix}${seq.toString().padStart(4, '0')}`;

  const prescription = await prisma.prescriptions.create({
    data: {
      prescription_number,
      patient_id: data.patient_id,
      visit_id: data.visit_id,
      doctor_id: data.doctor_id,
      notes: data.notes,
      status: 'pending',
      prescription_items: {
        create: data.items as any
      }
    },
    include: { prescription_items: true }
  });

  // Emit socket event
  const io = req.app.get('io');
  io?.to('pharmacy').emit('prescription:new', {
    id: prescription.id,
    prescription_number
  });

  res.status(201).json({
    success: true,
    message: 'Resep berhasil dibuat',
    data: prescription
  });
}));

/**
 * POST /api/pharmacy/prescriptions/:id/verify
 * Farmasis verifikasi resep: cek alergi, stok, interaksi obat
 */
router.post('/prescriptions/:id/verify', requireRole(['admin', 'farmasi']), asyncHandler(async (req: Request<{ id: string }, any, VerifyBody>, res: Response) => {
  const { id } = req.params;
  const { notes } = req.body;

  const prescription = await prisma.prescriptions.findUnique({
    where: { id },
    include: {
      prescription_items: true,
      patients: { select: { id: true, full_name: true, allergy_notes: true } }
    }
  });
  if (!prescription) throw new ApiError(404, 'Resep tidak ditemukan');
  assertTransition(prescription.status, 'verified');

  // Allergy Check
  const allergyWarnings: Array<{ medicine: string; allergy: string; severity: string }> = [];
  const allergyNotes = (prescription.patients?.allergy_notes || '').toLowerCase();
  if (allergyNotes) {
    for (const item of prescription.prescription_items) {
      const nameLower = item.medicine_name.toLowerCase();
      const words = allergyNotes.split(/[\s,;]+/).filter(w => w.length > 3);
      for (const word of words) {
        if (nameLower.includes(word)) {
          allergyWarnings.push({
            medicine: item.medicine_name,
            allergy: word,
            severity: 'warning',
          });
        }
      }
    }
  }

  // Drug Interaction Check
  const interactionWarnings: Array<{
    medicine_a: string;
    medicine_b: string;
    severity: string;
    description: string | null;
    clinical_effect: string | null;
    management: string | null;
  }> = [];
  const medicineIds = prescription.prescription_items
    .map(i => i.medicine_id)
    .filter((id): id is string => Boolean(id));

  if (medicineIds.length > 1) {
    const interactions = await prisma.drug_interactions.findMany({
      where: {
        is_active: true,
        OR: [
          { medicine_id_a: { in: medicineIds }, medicine_id_b: { in: medicineIds } },
        ],
      },
      include: {
        medicine_a: { select: { medicine_name: true } },
        medicine_b: { select: { medicine_name: true } },
      },
    });

    for (const ix of interactions) {
      if (medicineIds.includes(ix.medicine_id_a) && medicineIds.includes(ix.medicine_id_b)) {
        interactionWarnings.push({
          medicine_a: ix.medicine_a.medicine_name,
          medicine_b: ix.medicine_b.medicine_name,
          severity: ix.severity,
          description: ix.description,
          clinical_effect: ix.clinical_effect,
          management: ix.management,
        });
      }
    }
  }

  // Stock Check
  const stockWarnings: Array<{ medicine: string; requested: number; available: number }> = [];
  for (const item of prescription.prescription_items) {
    if (!item.medicine_id || !item.quantity) continue;
    const stock = await prisma.medicine_batches.aggregate({
      where: {
        medicine_id: item.medicine_id,
        status: 'available',
        quantity: { gt: 0 },
        expiry_date: { gt: new Date() }
      },
      _sum: { quantity: true }
    });
    const available = stock._sum.quantity || 0;
    if (available < item.quantity) {
      stockWarnings.push({
        medicine: item.medicine_name,
        requested: item.quantity,
        available,
      });
    }
  }

  const updated = await prisma.prescriptions.update({
    where: { id },
    data: {
      status: 'verified',
      verified_by: req.user!.id,
      verified_at: new Date(),
      allergy_checked: true,
      allergy_warnings: allergyWarnings,
      notes: notes ?? prescription.notes,
    }
  });

  await prisma.audit_logs.create({
    data: { table_name: 'prescriptions', record_id: id, action: 'VERIFY', user_id: req.user!.id, new_data: { allergyWarnings, stockWarnings } }
  }).catch(() => { });

  res.json({
    success: true,
    message: 'Resep berhasil diverifikasi',
    data: updated,
    warnings: { allergies: allergyWarnings, interactions: interactionWarnings, stock: stockWarnings }
  });
}));

/**
 * POST /api/pharmacy/prescriptions/:id/prepare
 * Mulai siapkan/racik obat
 */
router.post('/prescriptions/:id/prepare', requireRole(['admin', 'farmasi']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const prescription = await prisma.prescriptions.findUnique({ where: { id } });
  if (!prescription) throw new ApiError(404, 'Resep tidak ditemukan');
  assertTransition(prescription.status, 'preparing');

  const updated = await prisma.prescriptions.update({
    where: { id },
    data: { status: 'preparing', prepared_by: req.user!.id, prepared_at: new Date() }
  });

  // Notify pharmacy room via socket
  req.app.get('io')?.to('pharmacy').emit('prescription:preparing', { id, prescription_number: prescription.prescription_number });

  res.json({ success: true, message: 'Obat sedang disiapkan', data: updated });
}));

/**
 * POST /api/pharmacy/prescriptions/:id/ready
 * Obat siap diambil/diserahkan
 */
router.post('/prescriptions/:id/ready', requireRole(['admin', 'farmasi']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const prescription = await prisma.prescriptions.findUnique({ where: { id } });
  if (!prescription) throw new ApiError(404, 'Resep tidak ditemukan');
  assertTransition(prescription.status, 'ready');

  const updated = await prisma.prescriptions.update({
    where: { id },
    data: { status: 'ready' }
  });

  // Notify patient waiting area
  req.app.get('io')?.to('pharmacy').emit('prescription:ready', {
    id,
    prescription_number: prescription.prescription_number,
    patient_id: prescription.patient_id
  });

  res.json({ success: true, message: 'Obat siap diserahkan', data: updated });
}));

/**
 * POST /api/pharmacy/prescriptions/:id/dispense
 * Serahkan obat ke pasien — deduct stock FEFO
 */
router.post('/prescriptions/:id/dispense', requireRole(['admin', 'farmasi']), asyncHandler(async (req: Request<{ id: string }, any, DispenseBody>, res: Response) => {
  const { id } = req.params;
  const { dispensed_items } = req.body;

  const prescription = await prisma.prescriptions.findUnique({
    where: { id },
    include: { prescription_items: true }
  });
  if (!prescription) throw new ApiError(404, 'Resep tidak ditemukan');
  assertTransition(prescription.status, 'dispensed');

  // Build dispensed quantity map (use requested qty if not overridden)
  const qtyMap: Record<string, number> = {};
  if (Array.isArray(dispensed_items)) {
    dispensed_items.forEach(d => { qtyMap[d.item_id] = d.dispensed_quantity; });
  }

  const updated = await prisma.$transaction(async (tx) => {
    // Deduct stock FEFO per item
    for (const item of prescription.prescription_items) {
      if (!item.medicine_id) continue;
      const dispQty = qtyMap[item.id] ?? item.quantity ?? 0;
      if (dispQty <= 0) continue;

      const batches = await tx.medicine_batches.findMany({
        where: { medicine_id: item.medicine_id, status: 'available', quantity: { gt: 0 }, expiry_date: { gt: new Date() } },
        orderBy: { expiry_date: 'asc' }
      });

      let remaining = dispQty;
      const batchLog: Array<{ batch_id: string; batch_number: string; deducted: number }> = [];
      for (const batch of batches) {
        if (remaining <= 0) break;
        const deduct = Math.min(batch.quantity, remaining);
        await tx.medicine_batches.update({ where: { id: batch.id }, data: { quantity: { decrement: deduct } } });
        batchLog.push({ batch_id: batch.id, batch_number: batch.batch_number, deducted: deduct });
        remaining -= deduct;
      }

      if (remaining > 0) {
        console.warn(`Stock shortage: ${item.medicine_name}, short by ${remaining}`);
      }

      // Update item with dispensed tracking
      await tx.prescription_items.update({
        where: { id: item.id },
        data: { dispensed_quantity: dispQty, dispensed_from_batches: batchLog }
      });
    }

    return tx.prescriptions.update({
      where: { id },
      data: { status: 'dispensed', dispensed_by: req.user!.id, dispensed_at: new Date() }
    });
  });

  // Invalidate medicines cache (stock changed)
  await cache.delByPattern('pharmacy:medicines:*');

  await prisma.audit_logs.create({
    data: { table_name: 'prescriptions', record_id: id, action: 'DISPENSE', user_id: req.user!.id, new_data: { dispensed_at: new Date() } }
  }).catch(() => { });

  res.json({ success: true, message: 'Obat berhasil diserahkan kepada pasien', data: updated });
}));

/**
 * POST /api/pharmacy/prescriptions/:id/reject
 * Tolak resep (alergi, OOS, kedaluwarsa, dll)
 */
router.post('/prescriptions/:id/reject', requireRole(['admin', 'farmasi']), asyncHandler(async (req: Request<{ id: string }, any, RejectBody>, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) throw new ApiError(400, 'Alasan penolakan wajib diisi');

  const prescription = await prisma.prescriptions.findUnique({ where: { id } });
  if (!prescription) throw new ApiError(404, 'Resep tidak ditemukan');
  assertTransition(prescription.status, 'rejected');

  const updated = await prisma.prescriptions.update({
    where: { id },
    data: { status: 'rejected', rejection_reason: reason }
  });

  req.app.get('io')?.to('pharmacy').emit('prescription:rejected', { id, reason });

  res.json({ success: true, message: 'Resep ditolak', data: updated });
}));

/**
 * POST /api/pharmacy/prescriptions/:id/return
 * Kembalikan obat (partial atau seluruhnya)
 */
router.post('/prescriptions/:id/return', requireRole(['admin', 'farmasi']), asyncHandler(async (req: Request<{ id: string }, any, ReturnBody>, res: Response) => {
  const { id } = req.params;
  const { return_items, reason } = req.body;

  const prescription = await prisma.prescriptions.findUnique({
    where: { id },
    include: { prescription_items: true }
  });
  if (!prescription) throw new ApiError(404, 'Resep tidak ditemukan');
  assertTransition(prescription.status, 'returned');

  if (Array.isArray(return_items) && return_items.length > 0) {
    await prisma.$transaction(async (tx) => {
      for (const ret of return_items) {
        if (!ret.return_quantity || ret.return_quantity <= 0) continue;
        // Add stock back to batch (or create adjustment)
        if (ret.batch_id) {
          await tx.medicine_batches.update({
            where: { id: ret.batch_id },
            data: { quantity: { increment: ret.return_quantity } }
          });
        }
      }
    });
    await cache.delByPattern('pharmacy:medicines:*');
  }

  const updated = await prisma.prescriptions.update({
    where: { id },
    data: {
      status: 'returned',
      returned_by: req.user!.id,
      returned_at: new Date(),
      notes: prescription.notes
        ? `${prescription.notes}\nReturn: ${reason || 'tidak ada keterangan'}`
        : `Return: ${reason || 'tidak ada keterangan'}`
    }
  });

  await prisma.audit_logs.create({
    data: { table_name: 'prescriptions', record_id: id, action: 'RETURN', user_id: req.user!.id, new_data: { reason, return_items } }
  }).catch(() => { });

  res.json({ success: true, message: 'Pengembalian obat berhasil dicatat', data: updated });
}));

/**
 * GET /api/pharmacy/medicines
 * Get all medicines — cached 15 min (changes infrequently)
 */
router.get('/medicines', asyncHandler(async (req: Request<Record<string, string>, any, any, MedicineQuery>, res: Response) => {
  const { page = '1', limit = '50', search, category } = req.query;
  const pageInt = parseInt(page);
  const limitInt = parseInt(limit);
  const cacheKey = search
    ? null
    : `pharmacy:medicines:${category || 'all'}:${pageInt}:${limitInt}`;

  const fetch = async () => {
    const where: Record<string, any> = {
      is_active: true,
      ...(category && { category }),
      ...(search && {
        OR: [
          { medicine_name: { contains: search, mode: 'insensitive' as const } },
          { generic_name: { contains: search, mode: 'insensitive' as const } },
          { medicine_code: { contains: search, mode: 'insensitive' as const } }
        ]
      })
    };
    const [medicines, total] = await Promise.all([
      prisma.medicines.findMany({ where, skip: (pageInt - 1) * limitInt, take: limitInt, orderBy: { medicine_name: 'asc' } }),
      prisma.medicines.count({ where })
    ]);
    return { medicines, total };
  };

  let result: { medicines: any[]; total: number };
  if (cacheKey) {
    const { data } = await cache.cacheAside(cacheKey, fetch, 900); // 15 min
    result = data;
  } else {
    result = await fetch();
  }

  res.json({
    success: true,
    data: result.medicines,
    pagination: { page: pageInt, limit: limitInt, total: result.total, total_pages: Math.ceil(result.total / limitInt) }
  });
}));

/**
 * GET /api/pharmacy/medicines/:id/stock
 * Get medicine stock info
 */
router.get('/medicines/:id/stock', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const medicine = await prisma.medicines.findUnique({
    where: { id }
  });

  if (!medicine) {
    throw new ApiError(404, 'Obat tidak ditemukan', 'MEDICINE_NOT_FOUND');
  }

  const batches = await prisma.medicine_batches.findMany({
    where: {
      medicine_id: id,
      status: 'available',
      quantity: { gt: 0 }
    },
    orderBy: { expiry_date: 'asc' }
  });

  const totalStock = batches.reduce((sum, b) => sum + b.quantity, 0);
  const nearExpiry = batches.filter(b => {
    const daysUntilExpiry = Math.floor((new Date(b.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 90;
  });

  res.json({
    success: true,
    data: {
      medicine,
      total_stock: totalStock,
      batches,
      near_expiry: nearExpiry.length,
      is_low_stock: totalStock <= medicine.min_stock
    }
  });
}));

/**
 * GET /api/pharmacy/stock/low
 * Get medicines with low stock (optimized with single groupBy query)
 */
router.get('/stock/low', asyncHandler(async (req: Request, res: Response) => {
  const medicines = await prisma.medicines.findMany({
    where: { is_active: true }
  });

  // Single query to get all stock quantities grouped by medicine_id
  const stockByMedicine = await prisma.medicine_batches.groupBy({
    by: ['medicine_id'],
    where: {
      status: 'available',
      quantity: { gt: 0 }
    },
    _sum: { quantity: true }
  });

  // Create a map of medicine_id -> total stock
  const stockMap = new Map<string, number>();
  for (const entry of stockByMedicine) {
    stockMap.set(entry.medicine_id, entry._sum.quantity || 0);
  }

  // Filter medicines with low stock
  const lowStockMedicines = medicines
    .filter(med => {
      const stock = stockMap.get(med.id) || 0;
      return stock <= med.min_stock;
    })
    .map(med => ({
      ...med,
      current_stock: stockMap.get(med.id) || 0
    }));

  res.json({
    success: true,
    data: lowStockMedicines
  });
}));

/**
 * GET /api/pharmacy/stock/expiring
 * Get medicines expiring soon
 */
router.get('/stock/expiring', asyncHandler(async (req: Request<Record<string, string>, any, any, ExpiringQuery>, res: Response) => {
  const { days = '90' } = req.query;

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + parseInt(days));

  const batches = await prisma.medicine_batches.findMany({
    where: {
      status: 'available',
      quantity: { gt: 0 },
      expiry_date: {
        lte: expiryDate,
        gt: new Date()
      }
    },
    include: {
      medicines: true
    },
    orderBy: { expiry_date: 'asc' }
  });

  res.json({
    success: true,
    data: batches
  });
}));

/**
 * GET /api/pharmacy/print/:id
 * Get prescription for printing drug label
 */
router.get('/print/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const prescription = await prisma.prescriptions.findUnique({
    where: { id },
    include: {
      patients: true,
      doctors: { select: { id: true } },
      prescription_items: true
    }
  });

  if (!prescription) {
    throw new ApiError(404, 'Resep tidak ditemukan', 'PRESCRIPTION_NOT_FOUND');
  }

  // Get hospital info
  const hospitalSettings = await prisma.system_settings.findMany({
    where: {
      setting_key: {
        in: ['hospital_name', 'hospital_address', 'hospital_phone']
      }
    }
  });

  const hospital: Record<string, any> = {};
  hospitalSettings.forEach(s => {
    hospital[s.setting_key] = s.setting_value;
  });

  res.json({
    success: true,
    data: {
      hospital,
      prescription
    }
  });
}));

/**
 * POST /api/pharmacy/check-interactions
 * Check drug interactions for a list of medicine IDs
 */
router.post('/check-interactions', asyncHandler(async (req: Request<Record<string, string>, any, CheckInteractionsBody>, res: Response) => {
  const { medicine_ids, patient_id } = req.body;

  if (!Array.isArray(medicine_ids) || medicine_ids.length < 2) {
    return res.json({ success: true, data: { interactions: [], allergies: [] } });
  }

  const [interactions, patientAllergies] = await Promise.all([
    prisma.drug_interactions.findMany({
      where: {
        is_active: true,
        medicine_id_a: { in: medicine_ids },
        medicine_id_b: { in: medicine_ids },
      },
      include: {
        medicine_a: { select: { medicine_name: true } },
        medicine_b: { select: { medicine_name: true } },
      },
    }),
    patient_id
      ? prisma.patient_drug_allergies.findMany({
        where: { patient_id, is_active: true, medicine_id: { in: medicine_ids } },
        include: { medicines: { select: { medicine_name: true } } },
      })
      : Promise.resolve([] as any[]),
  ]);

  res.json({
    success: true,
    data: {
      interactions: interactions.map(ix => ({
        medicine_a: ix.medicine_a.medicine_name,
        medicine_b: ix.medicine_b.medicine_name,
        severity: ix.severity,
        description: ix.description,
        clinical_effect: ix.clinical_effect,
        management: ix.management,
      })),
      allergies: patientAllergies.map((a: any) => ({
        medicine: a.medicines?.medicine_name || a.allergen_name,
        reaction_type: a.reaction_type,
        severity: a.severity,
        notes: a.notes,
      })),
    },
  });
}));

export default router;

/**
 * SIMRS ZEN - Pharmacy Routes
 * CRUD operations for prescriptions and medicine dispensing
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { requireRole, checkMenuAccess } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();

router.use(checkMenuAccess('farmasi'));

// Validation schemas
const prescriptionSchema = z.object({
  patient_id: z.string().uuid(),
  visit_id: z.string().uuid().optional(),
  doctor_id: z.string().uuid().optional(),
  items: z.array(z.object({
    medicine_id: z.string().uuid().optional(),
    medicine_name: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    duration: z.string().optional(),
    quantity: z.number().int().positive(),
    unit: z.string(),
    instructions: z.string().optional()
  })),
  notes: z.string().optional()
});

/**
 * GET /api/pharmacy/prescriptions
 * Get all prescriptions
 */
router.get('/prescriptions', asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    status,
    date_from,
    date_to,
    search
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {
    ...(status && { status }),
    ...(date_from && date_to && {
      prescription_date: {
        gte: new Date(date_from),
        lte: new Date(date_to)
      }
    }),
    ...(search && {
      OR: [
        { prescription_number: { contains: search, mode: 'insensitive' } },
        { patients: { full_name: { contains: search, mode: 'insensitive' } } },
        { patients: { medical_record_number: { contains: search, mode: 'insensitive' } } }
      ]
    })
  };

  const [prescriptions, total] = await Promise.all([
    prisma.prescriptions.findMany({
      where,
      skip,
      take,
      orderBy: { prescription_date: 'desc' },
      include: {
        patients: {
          select: {
            id: true,
            medical_record_number: true,
            full_name: true
          }
        },
        doctors: { select: { id: true } },
        prescription_items: true
      }
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
router.get('/prescriptions/pending', asyncHandler(async (req, res) => {
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
router.get('/prescriptions/:id', asyncHandler(async (req, res) => {
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
router.post('/prescriptions', requireRole(['admin', 'dokter']), asyncHandler(async (req, res) => {
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
        create: data.items
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
 * POST /api/pharmacy/prescriptions/:id/dispense
 * Dispense prescription (mark as completed)
 */
router.post('/prescriptions/:id/dispense', requireRole(['admin', 'farmasi']), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const prescription = await prisma.prescriptions.findUnique({
    where: { id },
    include: { prescription_items: true }
  });

  if (!prescription) {
    throw new ApiError(404, 'Resep tidak ditemukan', 'PRESCRIPTION_NOT_FOUND');
  }

  if (prescription.status === 'dispensed') {
    throw new ApiError(400, 'Resep sudah diserahkan', 'ALREADY_DISPENSED');
  }

  // Wrap stock deduction and status update in a single transaction
  const updated = await prisma.$transaction(async (tx) => {
    // Deduct stock for each item
    for (const item of prescription.prescription_items) {
      if (item.medicine_id) {
        // Find available batch with FEFO (First Expiry First Out)
        const batches = await tx.medicine_batches.findMany({
          where: {
            medicine_id: item.medicine_id,
            status: 'available',
            quantity: { gt: 0 },
            expiry_date: { gt: new Date() }
          },
          orderBy: { expiry_date: 'asc' }
        });

        let remaining = item.quantity;
        for (const batch of batches) {
          if (remaining <= 0) break;

          const deduct = Math.min(batch.quantity, remaining);
          await tx.medicine_batches.update({
            where: { id: batch.id },
            data: { quantity: { decrement: deduct } }
          });
          remaining -= deduct;
        }

        if (remaining > 0) {
          console.warn(`Insufficient stock for medicine ${item.medicine_name} (id: ${item.medicine_id}): needed ${item.quantity}, short by ${remaining}`);
        }
      }
    }

    return tx.prescriptions.update({
      where: { id },
      data: {
        status: 'dispensed',
        updated_at: new Date()
      }
    });
  });

  // Audit log (outside transaction – non-critical)
  await prisma.audit_logs.create({
    data: {
      table_name: 'prescriptions',
      record_id: id,
      action: 'DISPENSE',
      user_id: req.user.id,
      new_data: { dispensed_at: new Date() }
    }
  }).catch(err => console.error('Audit log failed:', err));

  res.json({
    success: true,
    message: 'Obat berhasil diserahkan',
    data: updated
  });
}));

/**
 * GET /api/pharmacy/medicines
 * Get all medicines
 */
router.get('/medicines', asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 50, 
    search,
    category
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {
    is_active: true,
    ...(category && { category }),
    ...(search && {
      OR: [
        { medicine_name: { contains: search, mode: 'insensitive' } },
        { generic_name: { contains: search, mode: 'insensitive' } },
        { medicine_code: { contains: search, mode: 'insensitive' } }
      ]
    })
  };

  const [medicines, total] = await Promise.all([
    prisma.medicines.findMany({
      where,
      skip,
      take,
      orderBy: { medicine_name: 'asc' }
    }),
    prisma.medicines.count({ where })
  ]);

  res.json({
    success: true,
    data: medicines,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      total_pages: Math.ceil(total / take)
    }
  });
}));

/**
 * GET /api/pharmacy/medicines/:id/stock
 * Get medicine stock info
 */
router.get('/medicines/:id/stock', asyncHandler(async (req, res) => {
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
    const daysUntilExpiry = Math.floor((new Date(b.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
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
 * Get medicines with low stock
 */
router.get('/stock/low', asyncHandler(async (req, res) => {
  const medicines = await prisma.medicines.findMany({
    where: { is_active: true }
  });

  const lowStockMedicines = [];

  for (const med of medicines) {
    const totalStock = await prisma.medicine_batches.aggregate({
      where: {
        medicine_id: med.id,
        status: 'available',
        quantity: { gt: 0 }
      },
      _sum: { quantity: true }
    });

    const stock = totalStock._sum.quantity || 0;
    if (stock <= med.min_stock) {
      lowStockMedicines.push({
        ...med,
        current_stock: stock
      });
    }
  }

  res.json({
    success: true,
    data: lowStockMedicines
  });
}));

/**
 * GET /api/pharmacy/stock/expiring
 * Get medicines expiring soon
 */
router.get('/stock/expiring', asyncHandler(async (req, res) => {
  const { days = 90 } = req.query;
  
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
router.get('/print/:id', asyncHandler(async (req, res) => {
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

  const hospital = {};
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

export default router;

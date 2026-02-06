/**
 * SIMRS ZEN - Pharmacy Controller
 * Handles prescriptions, dispensing, and stock management
 */

import { z } from 'zod';
import { prisma } from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';

// Validation schemas
const createPrescriptionSchema = z.object({
  patient_id: z.string().uuid(),
  visit_id: z.string().uuid(),
  doctor_id: z.string().uuid(),
  items: z.array(z.object({
    medicine_id: z.string().uuid(),
    medicine_name: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    duration: z.string(),
    quantity: z.number().min(1),
    instructions: z.string().optional()
  })),
  notes: z.string().optional()
});

const dispenseSchema = z.object({
  dispensed_items: z.array(z.object({
    item_id: z.string().uuid(),
    batch_number: z.string(),
    quantity_dispensed: z.number().min(1)
  })),
  notes: z.string().optional()
});

/**
 * Get prescriptions with filters
 */
export const getPrescriptions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      patient_id,
      status,
      date_from,
      date_to
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (patient_id) where.patient_id = patient_id;
    if (status) where.status = status;
    if (date_from || date_to) {
      where.created_at = {};
      if (date_from) where.created_at.gte = new Date(date_from);
      if (date_to) where.created_at.lte = new Date(date_to);
    }

    const [total, prescriptions] = await Promise.all([
      prisma.prescriptions.count({ where }),
      prisma.prescriptions.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: 'desc' },
        include: {
          patient: {
            select: { id: true, full_name: true, medical_record_number: true }
          },
          doctor: {
            select: { id: true, name: true, specialization: true }
          },
          prescription_items: true
        }
      })
    ]);

    res.json({
      success: true,
      data: prescriptions,
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
 * Get single prescription
 */
export const getPrescription = async (req, res, next) => {
  try {
    const { id } = req.params;

    const prescription = await prisma.prescriptions.findUnique({
      where: { id },
      include: {
        patient: true,
        visit: true,
        doctor: true,
        prescription_items: {
          include: {
            medicine: true
          }
        }
      }
    });

    if (!prescription) {
      throw new ApiError(404, 'Resep tidak ditemukan', 'PRESCRIPTION_NOT_FOUND');
    }

    res.json({
      success: true,
      data: prescription
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create prescription
 */
export const createPrescription = async (req, res, next) => {
  try {
    const data = createPrescriptionSchema.parse(req.body);

    // Generate prescription number
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await prisma.prescriptions.count({
      where: {
        prescription_number: { startsWith: `RX${dateStr}` }
      }
    });
    const prescription_number = `RX${dateStr}${(count + 1).toString().padStart(4, '0')}`;

    // Create prescription with items
    const prescription = await prisma.prescriptions.create({
      data: {
        prescription_number,
        patient_id: data.patient_id,
        visit_id: data.visit_id,
        doctor_id: data.doctor_id,
        status: 'pending',
        notes: data.notes,
        created_by: req.user?.id,
        prescription_items: {
          create: data.items.map(item => ({
            medicine_id: item.medicine_id,
            medicine_name: item.medicine_name,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            quantity: item.quantity,
            instructions: item.instructions
          }))
        }
      },
      include: {
        patient: true,
        doctor: true,
        prescription_items: true
      }
    });

    res.status(201).json({
      success: true,
      data: prescription,
      message: 'Resep berhasil dibuat'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Dispense prescription
 */
export const dispensePrescription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = dispenseSchema.parse(req.body);

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

    // Update stock for each item
    for (const item of data.dispensed_items) {
      // Reduce medicine stock
      await prisma.medicine_batches.update({
        where: { 
          id: item.batch_number 
        },
        data: {
          current_quantity: {
            decrement: item.quantity_dispensed
          }
        }
      });

      // Create stock transaction
      await prisma.stock_transactions.create({
        data: {
          medicine_id: prescription.prescription_items.find(i => i.id === item.item_id)?.medicine_id,
          transaction_type: 'dispense',
          quantity: -item.quantity_dispensed,
          reference_id: id,
          reference_type: 'prescription',
          batch_number: item.batch_number,
          created_by: req.user?.id
        }
      });
    }

    // Update prescription status
    const updatedPrescription = await prisma.prescriptions.update({
      where: { id },
      data: {
        status: 'dispensed',
        dispensed_at: new Date(),
        dispensed_by: req.user?.id,
        notes: data.notes ? `${prescription.notes || ''}\n${data.notes}` : prescription.notes
      },
      include: {
        patient: true,
        prescription_items: true
      }
    });

    res.json({
      success: true,
      data: updatedPrescription,
      message: 'Obat berhasil diserahkan'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get medicine stock
 */
export const getMedicineStock = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      search,
      category,
      low_stock
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { generic_name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (category) where.category = category;
    if (low_stock === 'true') {
      where.current_stock = { lte: prisma.raw('minimum_stock') };
    }

    const [total, medicines] = await Promise.all([
      prisma.medicines.count({ where }),
      prisma.medicines.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
        include: {
          medicine_batches: {
            where: {
              expiry_date: { gt: new Date() },
              current_quantity: { gt: 0 }
            },
            orderBy: { expiry_date: 'asc' }
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: medicines,
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
 * Get expiring medicines
 */
export const getExpiringMedicines = async (req, res, next) => {
  try {
    const { days = 90 } = req.query;
    
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(days));

    const batches = await prisma.medicine_batches.findMany({
      where: {
        expiry_date: {
          lte: expiryDate,
          gt: new Date()
        },
        current_quantity: { gt: 0 }
      },
      include: {
        medicine: true
      },
      orderBy: { expiry_date: 'asc' }
    });

    res.json({
      success: true,
      data: batches
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Drug interaction check
 */
export const checkDrugInteractions = async (req, res, next) => {
  try {
    const { medicine_ids } = req.body;

    if (!medicine_ids || medicine_ids.length < 2) {
      return res.json({
        success: true,
        data: { interactions: [], hasInteraction: false }
      });
    }

    const interactions = await prisma.drug_interactions.findMany({
      where: {
        OR: [
          { medicine_a_id: { in: medicine_ids }, medicine_b_id: { in: medicine_ids } }
        ]
      },
      include: {
        medicine_a: true,
        medicine_b: true
      }
    });

    res.json({
      success: true,
      data: {
        interactions,
        hasInteraction: interactions.length > 0
      }
    });
  } catch (error) {
    next(error);
  }
};

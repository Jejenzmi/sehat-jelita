/**
 * SIMRS ZEN - Pharmacy Controller
 * Handles prescriptions, dispensing, and stock management
 */

import type { Request, Response, NextFunction } from 'express';
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

// Request body types
interface PrescriptionItemInput {
  medicine_id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions?: string;
}

interface CreatePrescriptionBody {
  patient_id: string;
  visit_id: string;
  doctor_id: string;
  items: PrescriptionItemInput[];
  notes?: string;
}

interface DispensedItem {
  item_id: string;
  batch_number: string;
  quantity_dispensed: number;
}

interface DispenseBody {
  dispensed_items: DispensedItem[];
  notes?: string;
}

interface DrugInteractionBody {
  medicine_ids?: string[];
}

interface PrescriptionQuery {
  page?: string;
  limit?: string;
  patient_id?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}

interface MedicineStockQuery {
  page?: string;
  limit?: string;
  search?: string;
  category?: string;
  low_stock?: string;
}

interface ExpiringMedicinesQuery {
  days?: string;
}

/**
 * Get prescriptions with filters
 */
export const getPrescriptions = async (req: Request<unknown, unknown, unknown, PrescriptionQuery>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '20',
      patient_id,
      status,
      date_from,
      date_to
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: Record<string, unknown> = {};
    if (patient_id) where.patient_id = patient_id;
    if (status) where.status = status;
    if (date_from || date_to) {
      where.created_at = {};
      if (date_from) (where.created_at as Record<string, unknown>).gte = new Date(date_from);
      if (date_to) (where.created_at as Record<string, unknown>).lte = new Date(date_to);
    }

    const [total, prescriptions] = await Promise.all([
      prisma.prescriptions.count({ where }),
      prisma.prescriptions.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: 'desc' },
        include: {
          patients: {
            select: { id: true, full_name: true, medical_record_number: true }
          },
          doctors: {
            select: { id: true }
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
export const getPrescription = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const prescription = await prisma.prescriptions.findUnique({
      where: { id },
      include: {
        patients: true,
        visits: true,
        doctors: true,
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
  } catch (error) {
    next(error);
  }
};

/**
 * Create prescription
 */
export const createPrescription = async (req: Request<unknown, unknown, CreatePrescriptionBody>, res: Response, next: NextFunction): Promise<void> => {
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
        // TODO: Add created_by field to prescriptions schema - if it exists
        // created_by: req.user?.id,
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
        patients: true,
        doctors: true,
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
export const dispensePrescription = async (req: Request<{ id: string }, unknown, DispenseBody>, res: Response, next: NextFunction): Promise<void> => {
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
          quantity: {
            decrement: item.quantity_dispensed
          }
        }
      });

      // TODO: Add stock_transactions model to Prisma schema to track inventory movements
      // Create stock transaction
      // const prescriptionItem = prescription.prescription_items.find(i => i.id === item.item_id);
      // await prisma.stock_transactions.create({
      //   data: {
      //     medicine_id: prescriptionItem?.medicine_id,
      //     transaction_type: 'dispense',
      //     quantity: -item.quantity_dispensed,
      //     reference_id: id,
      //     reference_type: 'prescription',
      //     batch_number: item.batch_number,
      //     created_by: req.user?.id
      //   }
      // });
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
        patients: true,
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
export const getMedicineStock = async (req: Request<unknown, unknown, unknown, MedicineStockQuery>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '50',
      search,
      category,
      low_stock
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { medicine_name: { contains: search, mode: 'insensitive' } },
        { generic_name: { contains: search, mode: 'insensitive' } },
        { medicine_code: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (category) where.category = category;
    // TODO: Add current_stock and raw() to schema - using min_stock instead
    // if (low_stock === 'true') {
    //   where.current_stock = { lte: prisma.raw('minimum_stock') };
    // }

    const [total, medicines] = await Promise.all([
      prisma.medicines.count({ where }),
      prisma.medicines.findMany({
        where,
        skip,
        take,
        orderBy: { medicine_name: 'asc' },
        include: {
          medicine_batches: {
            where: {
              expiry_date: { gt: new Date() },
              quantity: { gt: 0 }
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
export const getExpiringMedicines = async (req: Request<unknown, unknown, unknown, ExpiringMedicinesQuery>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { days = '90' } = req.query;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(days));

    const batches = await prisma.medicine_batches.findMany({
      where: {
        expiry_date: {
          lte: expiryDate,
          gt: new Date()
        },
        quantity: { gt: 0 }
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
  } catch (error) {
    next(error);
  }
};

/**
 * Drug interaction check
 */
export const checkDrugInteractions = async (req: Request<unknown, unknown, DrugInteractionBody>, res: Response, next: NextFunction): Promise<void> => {
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
        is_active: true,
        medicine_id_a: { in: medicine_ids },
        medicine_id_b: { in: medicine_ids },
      },
      include: {
        medicine_a: { select: { medicine_name: true } },
        medicine_b: { select: { medicine_name: true } },
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

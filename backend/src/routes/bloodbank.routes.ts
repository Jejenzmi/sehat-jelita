/**
 * SIMRS ZEN - Blood Bank Routes
 * Handles blood inventory, transfusion requests, crossmatch
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { requireRole, ROLES } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { paginate, paginatedResponse } from '../middleware/pagination.js';

const router = Router();
// ============================================
// BLOOD INVENTORY
// ============================================

const bloodBagSchema = z.object({
  bagNumber: z.string().min(1),
  bloodType: z.enum(['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE']),
  productType: z.enum(['whole_blood', 'packed_red_cells', 'fresh_frozen_plasma', 'platelets', 'cryoprecipitate']),
  collectionDate: z.string(),
  expiryDate: z.string(),
  volume: z.number().optional(),
  donorId: z.string().optional(),
  sourceBloodBank: z.string().optional(),
  storageLocation: z.string().optional()
});

const screeningBody = z.object({
  hivStatus: z.string().optional(),
  hbsagStatus: z.string().optional(),
  hcvStatus: z.string().optional(),
  vdrlStatus: z.string().optional(),
  malariaStatus: z.string().optional(),
  notes: z.string().optional()
});

// Type definitions
interface BloodBagBody extends z.infer<typeof bloodBagSchema> { }
interface ScreeningBodyType extends z.infer<typeof screeningBody> { }
interface TransfusionRequestBody {
  patientId: string;
  bloodType: string;
  productType: string;
  unitsRequested: number;
  priority?: string;
  indication?: string;
  requestingDepartment?: string;
  notes?: string;
}
interface CrossmatchBody {
  requestId: string;
  bloodBagId: string;
  majorResult: string;
  minorResult: string;
  antibodyScreen?: string;
  datResult?: string;
  iatResult?: string;
  notes?: string;
}
interface TransfusionBody {
  requestId: string;
  bloodBagId: string;
  startTime: string;
  endTime: string;
  vitalSignsBefore?: any;
  vitalSignsAfter?: any;
  reactions?: string;
  notes?: string;
}

type InventoryQuery = {
  blood_type?: string;
  product_type?: string;
  status?: string;
  expiring_soon?: string;
};

type RequestsQuery = {
  status?: string;
  priority?: string;
  patient_id?: string;
};

/**
 * Blood type compatibility map.
 * Maps each blood type to the set of blood types it can safely receive for
 * red-cell-containing products (whole_blood, packed_red_cells).
 */
const COMPATIBLE_DONORS: Record<string, Set<string>> = {
  'A_POSITIVE': new Set(['A_POSITIVE', 'A_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE']),
  'A_NEGATIVE': new Set(['A_NEGATIVE', 'O_NEGATIVE']),
  'B_POSITIVE': new Set(['B_POSITIVE', 'B_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE']),
  'B_NEGATIVE': new Set(['B_NEGATIVE', 'O_NEGATIVE']),
  'AB_POSITIVE': new Set(['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE']),
  'AB_NEGATIVE': new Set(['A_NEGATIVE', 'B_NEGATIVE', 'AB_NEGATIVE', 'O_NEGATIVE']),
  'O_POSITIVE': new Set(['O_POSITIVE', 'O_NEGATIVE']),
  'O_NEGATIVE': new Set(['O_NEGATIVE']),
};

/** Products that require ABO/Rh compatibility checks */
const RED_CELL_PRODUCTS = new Set(['whole_blood', 'packed_red_cells']);

/**
 * GET /api/bloodbank/inventory
 * List blood inventory with pagination
 */
router.get('/inventory', paginate, asyncHandler(async (req: Request<Record<string, string>, any, any, InventoryQuery>, res: Response) => {
  const { blood_type, product_type, status, expiring_soon } = req.query;
  const { skip, take } = req.pagination as { skip: number; take: number };

  const where: Record<string, any> = {};
  if (blood_type) where.blood_type = blood_type;
  if (product_type) where.product_type = product_type;
  if (status) where.status = status;

  if (expiring_soon === 'true') {
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    where.expiry_date = { lte: sevenDaysLater.toISOString() };
    where.status = 'available';
  }

  const [inventory, total] = await Promise.all([
    prisma.blood_inventory.findMany({
      where,
      orderBy: { expiry_date: 'asc' },
      skip,
      take
    }),
    prisma.blood_inventory.count({ where })
  ]);

  res.json(paginatedResponse(inventory, total, req.pagination as any));
}));

/**
 * GET /api/bloodbank/inventory/summary
 * Get inventory summary by blood type
 */
router.get('/inventory/summary', asyncHandler(async (req: Request, res: Response) => {
  const summary = await prisma.blood_inventory.groupBy({
    by: ['blood_type', 'product_type'],
    where: { status: 'available' },
    _count: true,
    _sum: { volume: true }
  });

  res.json({
    success: true,
    data: summary
  });
}));

/**
 * POST /api/bloodbank/inventory
 * Add blood bag to inventory
 */
router.post('/inventory',
  requireRole([ROLES.LABORATORIUM, ROLES.ADMIN]),
  asyncHandler(async (req: Request<Record<string, string>, any, BloodBagBody>, res: Response) => {
    const data = bloodBagSchema.parse(req.body);

    // Check for duplicate bag number
    const existing = await prisma.blood_inventory.findFirst({
      where: { bag_number: data.bagNumber }
    });

    if (existing) {
      throw new ApiError(409, 'Nomor kantong darah sudah ada');
    }

    const bloodBag = await prisma.blood_inventory.create({
      data: {
        bag_number: data.bagNumber,
        blood_type: data.bloodType,
        product_type: data.productType,
        collection_date: data.collectionDate,
        expiry_date: data.expiryDate,
        volume: data.volume,
        donor_id: data.donorId,
        source_blood_bank: data.sourceBloodBank,
        storage_location: data.storageLocation,
        status: 'quarantine' // Start in quarantine for screening
      }
    });

    res.status(201).json({
      success: true,
      data: bloodBag
    });
  })
);

/**
 * PATCH /api/bloodbank/inventory/:id/screening
 * Update blood bag screening results
 */
router.patch('/inventory/:id/screening',
  requireRole([ROLES.LABORATORIUM]),
  asyncHandler(async (req: Request<{ id: string }, any, ScreeningBodyType>, res: Response) => {
    const { id } = req.params;
    const { hivStatus, hbsagStatus, hcvStatus, vdrlStatus, malariaStatus, notes } = req.body;

    const allNegative = [hivStatus, hbsagStatus, hcvStatus, vdrlStatus, malariaStatus]
      .every(s => s === 'negative' || s === 'non_reactive');

    const bloodBag = await prisma.blood_inventory.update({
      where: { id },
      data: {
        hiv_status: hivStatus,
        hbsag_status: hbsagStatus,
        hcv_status: hcvStatus,
        vdrl_status: vdrlStatus,
        malaria_status: malariaStatus,
        screening_date: new Date(),
        screened_by: req.user!.id,
        status: allNegative ? 'available' : 'discarded',
        notes
      }
    });

    res.json({
      success: true,
      data: bloodBag
    });
  })
);

// ============================================
// TRANSFUSION REQUESTS
// ============================================

/**
 * GET /api/bloodbank/requests
 * List transfusion requests with pagination
 */
router.get('/requests', paginate, asyncHandler(async (req: Request<Record<string, string>, any, any, RequestsQuery>, res: Response) => {
  const { status, priority, patient_id } = req.query;
  const { skip, take } = req.pagination as { skip: number; take: number };

  const where: Record<string, any> = {};
  if (status) where.status = status;
  if (priority) where.urgency = priority;
  if (patient_id) where.patient_id = patient_id;

  const [requests, total] = await Promise.all([
    prisma.transfusion_requests.findMany({
      where,
      include: {
        patients: true
      },
      orderBy: [
        { urgency: 'desc' },
        { created_at: 'desc' }
      ],
      skip,
      take
    }),
    prisma.transfusion_requests.count({ where })
  ]);

  res.json(paginatedResponse(requests, total, req.pagination as any));
}));

/**
 * POST /api/bloodbank/requests
 * Create transfusion request
 */
router.post('/requests',
  requireRole([ROLES.DOKTER, ROLES.PERAWAT, ROLES.ICU, ROLES.BEDAH]),
  asyncHandler(async (req: Request<Record<string, string>, any, TransfusionRequestBody>, res: Response) => {
    const { patientId, bloodType, productType, unitsRequested, priority, indication, requestingDepartment, notes } = req.body;

    // Blood type compatibility check for red-cell-containing products
    if (RED_CELL_PRODUCTS.has(productType)) {
      const patient = await prisma.patients.findUnique({
        where: { id: patientId },
        select: { blood_type: true, full_name: true }
      });

      if (patient?.blood_type) {
        const compatible = COMPATIBLE_DONORS[patient.blood_type];
        if (compatible && !compatible.has(bloodType)) {
          throw new ApiError(
            422,
            `Golongan darah ${bloodType} tidak kompatibel dengan golongan darah pasien (${patient.blood_type})`,
            'BLOOD_TYPE_INCOMPATIBLE'
          );
        }
      }
    }

    const request = await prisma.transfusion_requests.create({
      data: {
        request_number: `TRF${Date.now()}`,
        patient_id: patientId,
        blood_type: bloodType,
        product_type: productType,
        units_requested: unitsRequested,
        urgency: priority, // routine, urgent, emergency
        indication,
        // TODO: requesting_department, requested_by not in schema
        status: 'pending',
        notes
      },
      include: { patients: true }
    });

    // Emit real-time notification for urgent requests
    if (priority === 'urgent' || priority === 'emergency') {
      const io = req.app.get('io');
      io?.to('bloodbank').emit('urgent_request', {
        type: 'URGENT_TRANSFUSION_REQUEST',
        data: request
      });
    }

    res.status(201).json({
      success: true,
      data: request
    });
  })
);

// ============================================
// CROSSMATCH
// ============================================

/**
 * POST /api/bloodbank/crossmatch
 * Perform crossmatch test
 */
router.post('/crossmatch',
  requireRole([ROLES.LABORATORIUM]),
  asyncHandler(async (req: Request<Record<string, string>, any, CrossmatchBody>, res: Response) => {
    const { requestId, bloodBagId, majorResult, minorResult, antibodyScreen, datResult, iatResult, notes } = req.body;

    const isCompatible = majorResult === 'compatible' && minorResult === 'compatible';

    const crossmatch = await prisma.$transaction(async (tx) => {
      // Get patient ID from the transfusion request
      const request = await tx.transfusion_requests.findUnique({
        where: { id: requestId },
        select: { patient_id: true }
      });

      const test = await tx.crossmatch_tests.create({
        data: {
          patient_id: request!.patient_id,
          request_id: requestId,
          blood_bag_id: bloodBagId,
          major_crossmatch: majorResult,
          minor_crossmatch: minorResult,
          antibody_screen: antibodyScreen,
          dat_result: datResult,
          iat_result: iatResult,
          is_compatible: isCompatible,
          tested_by: req.user!.id,
          test_date: new Date(),
          notes
        }
      });

      // If compatible, reserve the blood bag
      if (isCompatible) {
        const request = await tx.transfusion_requests.findUnique({
          where: { id: requestId }
        });

        await tx.blood_inventory.update({
          where: { id: bloodBagId },
          data: {
            status: 'reserved',
            reserved_for_patient_id: request!.patient_id
          }
        });
      }

      return test;
    });

    res.status(201).json({
      success: true,
      data: crossmatch
    });
  })
);

/**
 * POST /api/bloodbank/transfusions
 * Record transfusion administration
 */
router.post('/transfusions',
  requireRole([ROLES.PERAWAT, ROLES.DOKTER, ROLES.ICU]),
  asyncHandler(async (req: Request<Record<string, string>, any, TransfusionBody>, res: Response) => {
    const { requestId, bloodBagId, startTime, endTime, vitalSignsBefore, vitalSignsAfter, reactions, notes } = req.body;

    const transfusion = await prisma.$transaction(async (tx) => {
      // TODO: transfusion_records model doesn't exist in schema
      // const record = await tx.transfusion_records.create({
      //   data: {
      //     request_id: requestId,
      //     blood_bag_id: bloodBagId,
      //     start_time: startTime,
      //     end_time: endTime,
      //     vitals_before: vitalSignsBefore,
      //     vitals_after: vitalSignsAfter,
      //     reactions,
      //     administered_by: req.user!.id,
      //     notes
      //   }
      // });

      // Update blood bag status
      await tx.blood_inventory.update({
        where: { id: bloodBagId },
        data: { status: 'issued', issued_date: new Date() }
      });

      // Update request
      await tx.transfusion_requests.update({
        where: { id: requestId },
        data: {
          units_issued: { increment: 1 },
          status: 'completed'
        }
      });

      return { requestId, bloodBagId };
    });

    res.status(201).json({
      success: true,
      data: transfusion
    });
  })
);

export default router;

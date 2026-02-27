/**
 * SIMRS ZEN - Blood Bank Routes
 * Handles blood inventory, transfusion requests, crossmatch
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { requireRole, ROLES } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();


// ============================================
// BLOOD INVENTORY
// ============================================

const bloodBagSchema = z.object({
  bagNumber: z.string().min(1),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  productType: z.enum(['whole_blood', 'packed_red_cells', 'fresh_frozen_plasma', 'platelets', 'cryoprecipitate']),
  collectionDate: z.string(),
  expiryDate: z.string(),
  volume: z.number().optional(),
  donorId: z.string().optional(),
  sourceBloodBank: z.string().optional(),
  storageLocation: z.string().optional()
});

/**
 * GET /api/bloodbank/inventory
 * List blood inventory
 */
router.get('/inventory', asyncHandler(async (req, res) => {
  const { blood_type, product_type, status, expiring_soon } = req.query;

  const where = {};
  if (blood_type) where.blood_type = blood_type;
  if (product_type) where.product_type = product_type;
  if (status) where.status = status;

  if (expiring_soon === 'true') {
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    where.expiry_date = { lte: sevenDaysLater.toISOString() };
    where.status = 'available';
  }

  const inventory = await prisma.blood_inventory.findMany({
    where,
    orderBy: { expiry_date: 'asc' }
  });

  res.json({
    success: true,
    data: inventory
  });
}));

/**
 * GET /api/bloodbank/inventory/summary
 * Get inventory summary by blood type
 */
router.get('/inventory/summary', asyncHandler(async (req, res) => {
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
  asyncHandler(async (req, res) => {
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
  asyncHandler(async (req, res) => {
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
        screened_by: req.user.id,
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
 * List transfusion requests
 */
router.get('/requests', asyncHandler(async (req, res) => {
  const { status, priority, patient_id } = req.query;

  const where = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (patient_id) where.patient_id = patient_id;

  const requests = await prisma.transfusion_requests.findMany({
    where,
    include: {
      patients: true
    },
    orderBy: [
      { priority: 'desc' },
      { created_at: 'desc' }
    ]
  });

  res.json({
    success: true,
    data: requests
  });
}));

/**
 * POST /api/bloodbank/requests
 * Create transfusion request
 */
router.post('/requests',
  requireRole([ROLES.DOKTER, ROLES.PERAWAT, ROLES.ICU, ROLES.BEDAH]),
  asyncHandler(async (req, res) => {
    const { patientId, bloodType, productType, unitsRequested, priority, indication, requestingDepartment, notes } = req.body;

    const request = await prisma.transfusion_requests.create({
      data: {
        patient_id: patientId,
        blood_type_requested: bloodType,
        product_type: productType,
        units_requested: unitsRequested,
        priority, // routine, urgent, emergency
        indication,
        requesting_department: requestingDepartment,
        requested_by: req.user.id,
        status: 'pending',
        notes
      },
      include: { patients: true }
    });

    // Emit real-time notification for urgent requests
    if (priority === 'urgent' || priority === 'emergency') {
      const io = req.app.get('io');
      io.to('bloodbank').emit('urgent_request', {
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
  asyncHandler(async (req, res) => {
    const { requestId, bloodBagId, majorResult, minorResult, antibodyScreen, datResult, iatResult, notes } = req.body;

    const isCompatible = majorResult === 'compatible' && minorResult === 'compatible';

    const crossmatch = await prisma.$transaction(async (tx) => {
      const test = await tx.crossmatch_tests.create({
        data: {
          request_id: requestId,
          blood_bag_id: bloodBagId,
          major_crossmatch: majorResult,
          minor_crossmatch: minorResult,
          antibody_screen: antibodyScreen,
          dat_result: datResult,
          iat_result: iatResult,
          is_compatible: isCompatible,
          tested_by: req.user.id,
          tested_at: new Date(),
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
            reserved_for_patient_id: request.patient_id
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
  asyncHandler(async (req, res) => {
    const { requestId, bloodBagId, startTime, endTime, vitalSignsBefore, vitalSignsAfter, reactions, notes } = req.body;

    const transfusion = await prisma.$transaction(async (tx) => {
      const record = await tx.transfusion_records.create({
        data: {
          request_id: requestId,
          blood_bag_id: bloodBagId,
          start_time: startTime,
          end_time: endTime,
          vitals_before: vitalSignsBefore,
          vitals_after: vitalSignsAfter,
          reactions,
          administered_by: req.user.id,
          notes
        }
      });

      // Update blood bag status
      await tx.blood_inventory.update({
        where: { id: bloodBagId },
        data: { status: 'transfused', issued_date: new Date() }
      });

      // Update request
      await tx.transfusion_requests.update({
        where: { id: requestId },
        data: {
          units_transfused: { increment: 1 },
          status: 'completed'
        }
      });

      return record;
    });

    res.status(201).json({
      success: true,
      data: transfusion
    });
  })
);

export default router;

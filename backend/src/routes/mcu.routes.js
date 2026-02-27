/**
 * SIMRS ZEN - MCU (Medical Check Up) Routes
 * Handles corporate health screening packages
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { requireRole, ROLES } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();

// Apply authentication to all routes

// ============================================
// MCU PACKAGES
// ============================================

const packageSchema = z.object({
  packageCode: z.string().min(1),
  packageName: z.string().min(1),
  description: z.string().optional(),
  basePrice: z.number().positive(),
  components: z.array(z.object({
    name: z.string(),
    category: z.string(),
    price: z.number()
  })).optional(),
  isActive: z.boolean().default(true)
});

/**
 * GET /api/mcu/packages
 * List all MCU packages
 */
router.get('/packages', asyncHandler(async (req, res) => {
  const { active_only } = req.query;

  const where = active_only === 'true' ? { is_active: true } : {};

  const packages = await prisma.mcu_packages.findMany({
    where,
    orderBy: { base_price: 'asc' }
  });

  res.json({
    success: true,
    data: packages
  });
}));

/**
 * POST /api/mcu/packages
 * Create new MCU package
 */
router.post('/packages',
  requireRole([ROLES.ADMIN, ROLES.MANAJEMEN]),
  asyncHandler(async (req, res) => {
    const data = packageSchema.parse(req.body);

    const pkg = await prisma.mcu_packages.create({
      data: {
        package_code: data.packageCode,
        package_name: data.packageName,
        description: data.description,
        base_price: data.basePrice,
        components: data.components,
        is_active: data.isActive
      }
    });

    res.status(201).json({
      success: true,
      data: pkg
    });
  })
);

// ============================================
// CORPORATE CLIENTS
// ============================================

/**
 * GET /api/mcu/clients
 * List corporate clients
 */
router.get('/clients',
  requireRole([ROLES.ADMIN, ROLES.PENDAFTARAN, ROLES.KEUANGAN]),
  asyncHandler(async (req, res) => {
    const clients = await prisma.corporate_clients.findMany({
      where: { is_active: true },
      orderBy: { company_name: 'asc' }
    });

    res.json({
      success: true,
      data: clients
    });
  })
);

/**
 * POST /api/mcu/clients
 * Add new corporate client
 */
router.post('/clients',
  requireRole([ROLES.ADMIN, ROLES.MANAJEMEN]),
  asyncHandler(async (req, res) => {
    const { companyName, companyCode, address, phone, email, picName, picPhone, discountPercentage, contractStart, contractEnd, paymentTerms } = req.body;

    const client = await prisma.corporate_clients.create({
      data: {
        company_name: companyName,
        company_code: companyCode,
        address,
        phone,
        email,
        pic_name: picName,
        pic_phone: picPhone,
        discount_percentage: discountPercentage,
        contract_start: contractStart,
        contract_end: contractEnd,
        payment_terms: paymentTerms,
        is_active: true
      }
    });

    res.status(201).json({
      success: true,
      data: client
    });
  })
);

// ============================================
// MCU REGISTRATIONS
// ============================================

/**
 * GET /api/mcu/registrations
 * List MCU registrations
 */
router.get('/registrations', asyncHandler(async (req, res) => {
  const { date, status, client_id } = req.query;

  const where = {};
  if (date) where.registration_date = date;
  if (status) where.status = status;
  if (client_id) where.corporate_client_id = client_id;

  const registrations = await prisma.mcu_registrations.findMany({
    where,
    include: {
      patients: true,
      mcu_packages: true,
      corporate_clients: true
    },
    orderBy: { created_at: 'desc' }
  });

  res.json({
    success: true,
    data: registrations
  });
}));

/**
 * POST /api/mcu/registrations
 * Register patient for MCU
 */
router.post('/registrations',
  requireRole([ROLES.PENDAFTARAN, ROLES.ADMIN]),
  asyncHandler(async (req, res) => {
    const { patientId, packageId, corporateClientId, registrationDate, notes } = req.body;

    const registration = await prisma.$transaction(async (tx) => {
      // Get package details
      const pkg = await tx.mcu_packages.findUnique({
        where: { id: packageId }
      });

      if (!pkg) {
        throw new ApiError(404, 'Paket MCU tidak ditemukan');
      }

      // Calculate price with corporate discount if applicable
      let finalPrice = pkg.base_price;
      if (corporateClientId) {
        const client = await tx.corporate_clients.findUnique({
          where: { id: corporateClientId }
        });
        if (client?.discount_percentage) {
          finalPrice = pkg.base_price * (1 - client.discount_percentage / 100);
        }
      }

      // Create registration
      const reg = await tx.mcu_registrations.create({
        data: {
          patient_id: patientId,
          package_id: packageId,
          corporate_client_id: corporateClientId,
          registration_date: registrationDate || new Date().toISOString().split('T')[0],
          total_price: finalPrice,
          status: 'registered',
          notes,
          created_by: req.user.id
        },
        include: {
          patients: true,
          mcu_packages: true
        }
      });

      return reg;
    });

    res.status(201).json({
      success: true,
      data: registration
    });
  })
);

/**
 * PATCH /api/mcu/registrations/:id/status
 * Update MCU registration status
 */
router.patch('/registrations/:id/status',
  requireRole([ROLES.DOKTER, ROLES.PERAWAT, ROLES.LABORATORIUM, ROLES.RADIOLOGI]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['registered', 'in_progress', 'lab_pending', 'radiology_pending', 'doctor_review', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new ApiError(400, 'Status tidak valid');
    }

    const registration = await prisma.mcu_registrations.update({
      where: { id },
      data: {
        status,
        notes,
        completed_at: status === 'completed' ? new Date() : undefined
      }
    });

    res.json({
      success: true,
      data: registration
    });
  })
);

// ============================================
// MCU RESULTS
// ============================================

/**
 * GET /api/mcu/registrations/:id/results
 * Get MCU examination results
 */
router.get('/registrations/:id/results', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const results = await prisma.mcu_results.findMany({
    where: { registration_id: id },
    orderBy: { category: 'asc' }
  });

  res.json({
    success: true,
    data: results
  });
}));

/**
 * POST /api/mcu/registrations/:id/results
 * Add MCU examination result
 */
router.post('/registrations/:id/results',
  requireRole([ROLES.DOKTER, ROLES.LABORATORIUM, ROLES.RADIOLOGI]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { category, examName, result, normalRange, unit, status, notes } = req.body;

    const mcuResult = await prisma.mcu_results.create({
      data: {
        registration_id: id,
        category,
        exam_name: examName,
        result,
        normal_range: normalRange,
        unit,
        status, // normal, abnormal, critical
        notes,
        examined_by: req.user.id,
        examined_at: new Date()
      }
    });

    res.status(201).json({
      success: true,
      data: mcuResult
    });
  })
);

// ============================================
// MCU REPORTS
// ============================================

/**
 * GET /api/mcu/reports/summary
 * Get MCU summary report
 */
router.get('/reports/summary',
  requireRole([ROLES.ADMIN, ROLES.MANAJEMEN, ROLES.KEUANGAN]),
  asyncHandler(async (req, res) => {
    const { start_date, end_date, client_id } = req.query;

    const where = {};
    if (start_date && end_date) {
      where.registration_date = {
        gte: start_date,
        lte: end_date
      };
    }
    if (client_id) where.corporate_client_id = client_id;

    const [totalRegistrations, completedCount, revenue, byPackage] = await Promise.all([
      prisma.mcu_registrations.count({ where }),
      prisma.mcu_registrations.count({ where: { ...where, status: 'completed' } }),
      prisma.mcu_registrations.aggregate({
        where: { ...where, status: 'completed' },
        _sum: { total_price: true }
      }),
      prisma.mcu_registrations.groupBy({
        by: ['package_id'],
        where,
        _count: true
      })
    ]);

    res.json({
      success: true,
      data: {
        totalRegistrations,
        completedCount,
        totalRevenue: revenue._sum.total_price || 0,
        completionRate: totalRegistrations > 0 ? (completedCount / totalRegistrations * 100).toFixed(1) : 0,
        byPackage
      }
    });
  })
);

export default router;

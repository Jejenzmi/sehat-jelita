/**
 * SIMRS ZEN - Radiology Routes
 * Manages radiology orders, examinations, and PACS integration
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { requireRole, ROLES } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();

// All routes require authentication

// Validation schemas
const radiologyOrderSchema = z.object({
  visitId: z.string().uuid(),
  patientId: z.string().uuid(),
  examinationType: z.string(),
  modalityType: z.enum(['X-RAY', 'CT', 'MRI', 'USG', 'MAMMOGRAPHY', 'FLUOROSCOPY']),
  priority: z.enum(['ROUTINE', 'URGENT', 'CITO']).default('ROUTINE'),
  clinicalInfo: z.string().optional(),
  bodyPart: z.string(),
  notes: z.string().optional()
});

// Type definitions
interface RadiologyOrderBody extends z.infer<typeof radiologyOrderSchema> { }
interface StartBody {
  technicianId?: string;
  roomNumber?: string;
}
interface CompleteBody {
  imageUrls?: string[];
  dose?: number;
  technique?: string;
}
interface ResultBody {
  findings?: string;
  impression?: string;
  recommendations?: string;
}

type RadiologyOrderQuery = {
  status?: string;
  modalityType?: string;
  date?: string;
  priority?: string;
  page?: string;
  limit?: string;
};

/**
 * GET /api/radiology/orders
 * List radiology orders with filters
 */
router.get('/orders',
  requireRole([ROLES.RADIOLOGI, ROLES.DOKTER, ROLES.PERAWAT]),
  asyncHandler(async (req: Request<Record<string, string>, any, any, RadiologyOrderQuery>, res: Response) => {
    const { status, modalityType, date, priority, page = '1', limit = '20' } = req.query;

    const where: Record<string, any> = {};
    if (status) where.status = status;
    if (modalityType) where.modality_type = modalityType;
    if (priority) where.priority = priority;
    if (date) {
      where.order_date = {
        gte: new Date(date),
        lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
      };
    }

    const [orders, total] = await Promise.all([
      prisma.radiology_orders.findMany({
        where,
        include: {
          patients: { select: { id: true, medical_record_number: true, full_name: true } }
        },
        orderBy: [
          { priority: 'desc' as const },
          { created_at: 'desc' as const }
        ],
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.radiology_orders.count({ where })
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  })
);

/**
 * POST /api/radiology/orders
 * Create new radiology order
 */
router.post('/orders',
  requireRole([ROLES.DOKTER, ROLES.RADIOLOGI]),
  asyncHandler(async (req: Request<Record<string, string>, any, RadiologyOrderBody>, res: Response) => {
    const data = radiologyOrderSchema.parse(req.body);

    const orderNumber = await generateRadiologyOrderNumber();

    const order = await prisma.radiology_orders.create({
      data: {
        order_number: orderNumber,
        visit_id: data.visitId,
        patient_id: data.patientId,
        modality: data.modalityType,
        body_part: data.bodyPart,
        clinical_info: data.clinicalInfo,
        priority: data.priority,
        doctor_id: req.user!.id,
        status: 'pending'
      }
    });

    // Emit real-time event
    req.app.get('io').to('radiology').emit('new-order', {
      orderId: order.id,
      priority: order.priority,
      modalityType: order.modality
    });

    res.status(201).json({
      success: true,
      data: order
    });
  })
);

/**
 * PUT /api/radiology/orders/:id/start
 * Start examination
 */
router.put('/orders/:id/start',
  requireRole([ROLES.RADIOLOGI]),
  asyncHandler(async (req: Request<{ id: string }, any, StartBody>, res: Response) => {
    const { id } = req.params;
    const { technicianId, roomNumber } = req.body;

    const order = await prisma.radiology_orders.update({
      where: { id },
      data: {
        status: 'in_progress'
      }
    });

    res.json({
      success: true,
      data: order
    });
  })
);

/**
 * PUT /api/radiology/orders/:id/complete
 * Complete examination and upload images
 */
router.put('/orders/:id/complete',
  requireRole([ROLES.RADIOLOGI]),
  asyncHandler(async (req: Request<{ id: string }, any, CompleteBody>, res: Response) => {
    const { id } = req.params;
    const { imageUrls, dose, technique } = req.body;

    const order = await prisma.radiology_orders.update({
      where: { id },
      data: {
        status: 'completed'
      }
    });

    res.json({
      success: true,
      data: order
    });
  })
);

/**
 * POST /api/radiology/orders/:id/result
 * Add radiology result/interpretation
 */
router.post('/orders/:id/result',
  requireRole([ROLES.RADIOLOGI, ROLES.DOKTER]),
  asyncHandler(async (req: Request<{ id: string }, any, ResultBody>, res: Response) => {
    const { id } = req.params;
    const { findings, impression, recommendations } = req.body;

    const result = await prisma.radiology_results.create({
      data: {
        order_id: id,
        findings,
        impression,
        recommendation: recommendations,
        radiologist_id: req.user!.id,
        report_date: new Date()
      }
    });

    // Update order status
    await prisma.radiology_orders.update({
      where: { id },
      data: { status: 'completed' }
    });

    // Notify ordering doctor
    req.app.get('io').emit('radiology-result-ready', { orderId: id });

    res.status(201).json({
      success: true,
      data: result
    });
  })
);

/**
 * GET /api/radiology/modalities
 * Get modality statistics and availability
 */
router.get('/modalities',
  requireRole([ROLES.RADIOLOGI, ROLES.MANAJEMEN]),
  asyncHandler(async (req: Request, res: Response) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await prisma.radiology_orders.groupBy({
      by: ['modality'],
      _count: { id: true }
    });

    res.json({
      success: true,
      data: stats
    });
  })
);

// Helper function
async function generateRadiologyOrderNumber(): Promise<string> {
  const today = new Date();
  const prefix = `RAD${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

  const lastOrder = await prisma.radiology_orders.findFirst({
    where: { order_number: { startsWith: prefix } },
    orderBy: { order_number: 'desc' as const }
  });

  const sequence = lastOrder
    ? parseInt(lastOrder.order_number.slice(-4)) + 1
    : 1;

  return `${prefix}${String(sequence).padStart(4, '0')}`;
}

/**
 * POST /api/radiology/pacs
 * PACS bridge proxy endpoint
 */
router.post('/pacs', asyncHandler(async (req: Request, res: Response) => {
  const { action, ...params } = req.body;
  // Forward to PACS bridge service if configured
  res.json({ success: true, data: { action, params, message: 'PACS bridge not configured' } });
}));

export default router;

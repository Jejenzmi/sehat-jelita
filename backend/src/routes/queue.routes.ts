/**
 * SIMRS ZEN - Queue Routes
 * Queue management for patient registration and service
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { requireRole } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { startOfDay } from 'date-fns';

const router = Router();

// Validation schemas
const createQueueSchema = z.object({
  patient_id: z.string().uuid('Patient ID tidak valid'),
  visit_type: z.enum(['rawat_jalan', 'igd', 'rawat_inap', 'mcu']),
  department_id: z.string().uuid('Department ID tidak valid').optional(),
  doctor_id: z.string().uuid('Doctor ID tidak valid').optional(),
  priority: z.enum(['normal', 'urgent', 'cito']).default('normal'),
  notes: z.string().optional()
});

const updateQueueStatusSchema = z.object({
  status: z.enum(['menunggu', 'dipanggil', 'dilayani', 'selesai', 'dibatalkan']),
  notes: z.string().optional()
});

// ============================================
// QUEUE ENTRIES CRUD
// ============================================

/**
 * GET /api/queue/today
 * Get today's queue entries
 */
router.get('/today', asyncHandler(async (req: Request, res: Response) => {
  const today = startOfDay(new Date());

  const queues = await prisma.queue_entries.findMany({
    where: {
      created_at: { gte: today }
    },
    include: {
      visits: {
        include: {
          patients: {
            select: {
              id: true,
              medical_record_number: true,
              full_name: true,
              gender: true,
              birth_date: true
            }
          }
        }
      },
      departments: {
        select: {
          id: true,
          department_name: true,
          department_code: true
        }
      }
    },
    orderBy: [
      { priority: 'asc' },
      { created_at: 'asc' }
    ]
  });

  res.json({ success: true, data: queues });
}));

/**
 * GET /api/queue/stats
 * Get queue statistics
 */
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const today = startOfDay(new Date());

  const [
    total,
    waiting,
    called,
    serving,
    completed,
    cancelled
  ] = await Promise.all([
    prisma.queue_entries.count({ where: { created_at: { gte: today } } }),
    prisma.queue_entries.count({ where: { created_at: { gte: today }, status: 'menunggu' } }),
    prisma.queue_entries.count({ where: { created_at: { gte: today }, status: 'dipanggil' } }),
    prisma.queue_entries.count({ where: { created_at: { gte: today }, status: 'dilayani' } }),
    prisma.queue_entries.count({ where: { created_at: { gte: today }, status: 'selesai' } }),
    prisma.queue_entries.count({ where: { created_at: { gte: today }, status: 'dibatalkan' } })
  ]);

  res.json({
    success: true,
    data: {
      total,
      waiting,
      called,
      serving,
      completed,
      cancelled,
      averageWaitTime: 15 // Can be calculated from actual data
    }
  });
}));

/**
 * GET /api/queue
 * Get all queue entries with pagination
 */
router.get('/', requireRole(['admin', 'pendaftaran', 'dokter', 'perawat']), asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', status, department_id, visit_type } = req.query;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (department_id) where.department_id = department_id;
  if (visit_type) where.visit_type = visit_type;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const [queues, total] = await Promise.all([
    prisma.queue_entries.findMany({
      where,
      include: {
        visits: {
          include: {
            patients: {
              select: {
                id: true,
                medical_record_number: true,
                full_name: true
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: parseInt(limit as string)
    }),
    prisma.queue_entries.count({ where })
  ]);

  res.json({
    success: true,
    data: queues,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      totalPages: Math.ceil(total / parseInt(limit as string))
    }
  });
}));

/**
 * GET /api/queue/:id
 * Get single queue entry
 */
router.get('/:id', requireRole(['admin', 'pendaftaran', 'dokter', 'perawat']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const queue = await prisma.queue_entries.findUnique({
    where: { id },
    include: {
      visits: {
        include: {
          patients: true
        }
      }
    }
  });

  if (!queue) {
    throw new ApiError(404, 'Queue entry tidak ditemukan', 'QUEUE_NOT_FOUND');
  }

  res.json({ success: true, data: queue });
}));

/**
 * POST /api/queue
 * Create new queue entry
 */
router.post('/', requireRole(['admin', 'pendaftaran']), asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createQueueSchema.parse(req.body);

  // Generate queue number
  const today = startOfDay(new Date());
  const countToday = await prisma.queue_entries.count({
    where: { created_at: { gte: today } }
  });
  const queueNumber = `Q${String(countToday + 1).padStart(4, '0')}`;

  const queue = await prisma.queue_entries.create({
    data: {
      ...validatedData,
      queue_number: queueNumber,
      status: 'menunggu'
    }
  });

  res.status(201).json({ success: true, data: queue });
}));

/**
 * PATCH /api/queue/:id/status
 * Update queue status
 */
router.patch('/:id/status', requireRole(['admin', 'pendaftaran', 'dokter', 'perawat']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const validatedData = updateQueueStatusSchema.parse(req.body);

  const queue = await prisma.queue_entries.findUnique({ where: { id } });
  if (!queue) {
    throw new ApiError(404, 'Queue entry tidak ditemukan', 'QUEUE_NOT_FOUND');
  }

  const updated = await prisma.queue_entries.update({
    where: { id },
    data: validatedData
  });

  res.json({ success: true, data: updated });
}));

/**
 * DELETE /api/queue/:id
 * Delete/cancel queue entry (soft delete)
 */
router.delete('/:id', requireRole(['admin', 'pendaftaran']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const queue = await prisma.queue_entries.findUnique({ where: { id } });
  if (!queue) {
    throw new ApiError(404, 'Queue entry tidak ditemukan', 'QUEUE_NOT_FOUND');
  }

  // Soft delete - set status to cancelled
  const deleted = await prisma.queue_entries.update({
    where: { id },
    data: { status: 'dibatalkan' }
  });

  res.json({ success: true, message: 'Queue entry berhasil dibatalkan', data: deleted });
}));

export default router;

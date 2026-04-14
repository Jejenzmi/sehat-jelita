/**
 * SIMRS ZEN - Smart Display Routes
 * CRUD operations for smart display config, devices, and media
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { requireRole } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();

// Require admin/management roles for all smart display routes
router.use(requireRole(['admin', 'manajemen']));

// Validation schemas
const createDeviceSchema = z.object({
  device_name: z.string().min(2, 'Nama device minimal 2 karakter'),
  device_code: z.string().min(2, 'Kode device minimal 2 karakter'),
  location: z.string().optional(),
  display_type: z.enum(['queue', 'info', 'advertisement']).default('queue'),
  orientation: z.enum(['landscape', 'portrait']).default('landscape'),
  is_active: z.boolean().default(true),
  config: z.record(z.unknown()).optional()
});

const updateDeviceSchema = createDeviceSchema.partial();

const createMediaSchema = z.object({
  media_name: z.string().min(2, 'Nama media minimal 2 karakter'),
  media_type: z.enum(['image', 'video', 'text']).default('image'),
  file_url: z.string().url('URL file tidak valid'),
  duration_seconds: z.number().positive().optional(),
  display_order: z.number().int().nonnegative().default(0),
  is_active: z.boolean().default(true),
  schedule_start: z.string().datetime().optional(),
  schedule_end: z.string().datetime().optional()
});

const updateMediaSchema = createMediaSchema.partial();

// ============================================
// DEVICES CRUD
// ============================================

/**
 * GET /api/smart-display/devices
 * Get all devices
 */
router.get('/devices', asyncHandler(async (req: Request, res: Response) => {
  const { display_type, is_active } = req.query;

  const where: Record<string, unknown> = {};
  if (display_type) where.display_type = display_type;
  if (is_active !== undefined) where.is_active = is_active === 'true';

  const devices = await prisma.smart_display_devices.findMany({
    where,
    orderBy: { created_at: 'desc' }
  });

  res.json({ success: true, data: devices });
}));

/**
 * GET /api/smart-display/devices/:id
 * Get single device
 */
router.get('/devices/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const device = await prisma.smart_display_devices.findUnique({ where: { id } });

  if (!device) {
    throw new ApiError(404, 'Device tidak ditemukan', 'DEVICE_NOT_FOUND');
  }

  res.json({ success: true, data: device });
}));

/**
 * POST /api/smart-display/devices
 * Create new device
 */
router.post('/devices', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createDeviceSchema.parse(req.body);

  const device = await prisma.smart_display_devices.create({
    data: validatedData
  });

  res.status(201).json({ success: true, data: device });
}));

/**
 * PUT /api/smart-display/devices/:id
 * Update device
 */
router.put('/devices/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const validatedData = updateDeviceSchema.parse(req.body);

  const device = await prisma.smart_display_devices.findUnique({ where: { id } });
  if (!device) {
    throw new ApiError(404, 'Device tidak ditemukan', 'DEVICE_NOT_FOUND');
  }

  const updated = await prisma.smart_display_devices.update({
    where: { id },
    data: validatedData
  });

  res.json({ success: true, data: updated });
}));

/**
 * DELETE /api/smart-display/devices/:id
 * Delete device
 */
router.delete('/devices/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const device = await prisma.smart_display_devices.findUnique({ where: { id } });
  if (!device) {
    throw new ApiError(404, 'Device tidak ditemukan', 'DEVICE_NOT_FOUND');
  }

  await prisma.smart_display_devices.delete({ where: { id } });

  res.json({ success: true, message: 'Device berhasil dihapus' });
}));

// ============================================
// MEDIA CRUD
// ============================================

/**
 * GET /api/smart-display/media
 * Get all media
 */
router.get('/media', asyncHandler(async (req: Request, res: Response) => {
  const { media_type, is_active } = req.query;

  const where: Record<string, unknown> = {};
  if (media_type) where.media_type = media_type;
  if (is_active !== undefined) where.is_active = is_active === 'true';

  const media = await prisma.smart_display_media.findMany({
    where,
    orderBy: { display_order: 'asc' }
  });

  res.json({ success: true, data: media });
}));

/**
 * POST /api/smart-display/media
 * Create new media
 */
router.post('/media', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createMediaSchema.parse(req.body);

  const media = await prisma.smart_display_media.create({
    data: validatedData
  });

  res.status(201).json({ success: true, data: media });
}));

/**
 * DELETE /api/smart-display/media/:id
 * Delete media
 */
router.delete('/media/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const media = await prisma.smart_display_media.findUnique({ where: { id } });
  if (!media) {
    throw new ApiError(404, 'Media tidak ditemukan', 'MEDIA_NOT_FOUND');
  }

  await prisma.smart_display_media.delete({ where: { id } });

  res.json({ success: true, message: 'Media berhasil dihapus' });
}));

// ============================================
// CONFIG
// ============================================

/**
 * GET /api/smart-display/config/:displayType
 * Get config for display type
 */
router.get('/config/:displayType', asyncHandler(async (req: Request<{ displayType: string }>, res: Response) => {
  const { displayType } = req.params;

  const config = await prisma.smart_display_config.findFirst({
    where: { display_type: displayType }
  });

  res.json({ success: true, data: config });
}));

/**
 * PUT /api/smart-display/config/:id
 * Update config
 */
router.put('/config/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const configData = req.body;

  const config = await prisma.smart_display_config.findUnique({ where: { id } });
  if (!config) {
    throw new ApiError(404, 'Config tidak ditemukan', 'CONFIG_NOT_FOUND');
  }

  const updated = await prisma.smart_display_config.update({
    where: { id },
    data: configData
  });

  res.json({ success: true, data: updated });
}));

export default router;

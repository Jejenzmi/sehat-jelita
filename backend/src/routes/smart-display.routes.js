/**
 * SIMRS ZEN - Smart Display Routes
 * Config, devices, and media management for lobby/ward/pharmacy displays
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { prisma } from '../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

const router = Router();

// Public guard helper — only admin/it can modify display config
const adminOnly = [authenticateToken, requireRole(['admin', 'it'])];

// ─── Config ───────────────────────────────────────────────────────────────────

router.get('/config/:displayType', asyncHandler(async (req, res) => {
  let config = await prisma.smart_display_config.findFirst({
    where: { display_type: req.params.displayType },
  }).catch(() => null);

  // Auto-create default config if none exists
  if (!config) {
    config = await prisma.smart_display_config.create({
      data: {
        display_type:          req.params.displayType,
        running_text:          '',
        running_text_enabled:  true,
        slideshow_enabled:     true,
        slideshow_interval:    5,
        video_enabled:         false,
        video_auto_play:       true,
        auto_refresh:          true,
        auto_refresh_interval: 30,
      },
    }).catch(() => null);
  }

  res.json({ success: true, data: config });
}));

router.put('/config/:id', ...adminOnly, asyncHandler(async (req, res) => {
  const config = await prisma.smart_display_config.update({
    where: { id: req.params.id },
    data: { ...req.body, updated_at: new Date() },
  });
  res.json({ success: true, data: config });
}));

// ─── Devices ──────────────────────────────────────────────────────────────────

router.get('/devices', asyncHandler(async (_req, res) => {
  const devices = await prisma.smart_display_devices.findMany({
    orderBy: { device_code: 'asc' },
  }).catch(() => []);
  res.json({ success: true, data: devices });
}));

router.get('/devices/:code', asyncHandler(async (req, res) => {
  const device = await prisma.smart_display_devices.findFirst({
    where: { device_code: req.params.code },
  }).catch(() => null);
  res.json({ success: true, data: device });
}));

router.post('/devices', ...adminOnly, asyncHandler(async (req, res) => {
  const device = await prisma.smart_display_devices.create({ data: req.body });
  res.status(201).json({ success: true, data: device });
}));

router.put('/devices/:id', ...adminOnly, asyncHandler(async (req, res) => {
  const device = await prisma.smart_display_devices.update({
    where: { id: req.params.id },
    data: { ...req.body, updated_at: new Date() },
  });
  res.json({ success: true, data: device });
}));

router.delete('/devices/:id', ...adminOnly, asyncHandler(async (req, res) => {
  await prisma.smart_display_devices.delete({ where: { id: req.params.id } });
  res.json({ success: true, data: { id: req.params.id } });
}));

// ─── Media ────────────────────────────────────────────────────────────────────

router.get('/media', asyncHandler(async (req, res) => {
  const { display_type, media_type } = req.query;
  const where = {};
  if (display_type) where.display_type = display_type;
  if (media_type)   where.media_type   = media_type;

  const media = await prisma.smart_display_media.findMany({
    where,
    orderBy: { display_order: 'asc' },
  }).catch(() => []);

  res.json({ success: true, data: media });
}));

router.post('/media/upload', ...adminOnly, asyncHandler(async (req, res) => {
  // Expect multipart/form-data with file + metadata
  // For simplicity, handle base64 encoded file in JSON body
  const { display_type, media_type, file_name, file_data, title } = req.body;

  if (!file_data || !file_name) {
    return res.status(400).json({ success: false, error: 'file_data dan file_name diperlukan' });
  }

  const uploadsDir = path.join(process.cwd(), 'uploads', 'smart-display', display_type, media_type);
  fs.mkdirSync(uploadsDir, { recursive: true });

  const ext      = path.extname(file_name) || '';
  const storedName = `${randomUUID()}${ext}`;
  const filePath   = path.join(uploadsDir, storedName);

  const buffer = Buffer.from(file_data.replace(/^data:[^;]+;base64,/, ''), 'base64');
  fs.writeFileSync(filePath, buffer);

  const fileUrl = `/uploads/smart-display/${display_type}/${media_type}/${storedName}`;

  const maxOrder = await prisma.smart_display_media.aggregate({
    where: { display_type, media_type },
    _max: { display_order: true },
  }).catch(() => ({ _max: { display_order: 0 } }));

  const media = await prisma.smart_display_media.create({
    data: {
      display_type,
      media_type,
      file_url:      fileUrl,
      file_name,
      title:         title || file_name,
      display_order: (maxOrder._max?.display_order ?? 0) + 1,
    },
  });

  res.status(201).json({ success: true, data: media });
}));

router.delete('/media/:id', ...adminOnly, asyncHandler(async (req, res) => {
  const media = await prisma.smart_display_media.findUnique({ where: { id: req.params.id } });

  if (media?.file_url?.startsWith('/uploads/')) {
    const filePath = path.join(process.cwd(), media.file_url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  await prisma.smart_display_media.delete({ where: { id: req.params.id } });
  res.json({ success: true, data: { id: req.params.id } });
}));

export default router;

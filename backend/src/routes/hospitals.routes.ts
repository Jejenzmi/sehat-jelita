/**
 * SIMRS ZEN - Hospitals Routes
 * Endpoint for hospitals setup (insert/update/get)
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { requireRole } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();

// All routes require admin role
router.use(requireRole(['admin']));

/**
 * GET /api/admin/hospitals
 * Get all hospitals
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const hospitals = await prisma.hospitals.findMany();
  res.json({ success: true, data: hospitals });
}));

/**
 * POST /api/admin/hospitals
 * Create hospital (setup)
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  const hospital = await prisma.hospitals.create({ data });
  res.status(201).json({ success: true, data: hospital });
}));

/**
 * PUT /api/admin/hospitals/:id
 * Update hospital by id
 */
router.put('/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const data = req.body;
  const hospital = await prisma.hospitals.update({ where: { id }, data });
  res.json({ success: true, data: hospital });
}));

export default router;

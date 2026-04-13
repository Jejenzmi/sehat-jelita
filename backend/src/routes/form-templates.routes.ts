/**
 * SIMRS ZEN - Custom Form Templates Routes
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { prisma } from '../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();
router.use(authenticateToken);

router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const templates = await prisma.custom_form_templates.findMany({
    where: { is_active: true },
    orderBy: { created_at: 'desc' },
  }).catch(() => []);
  res.json({ success: true, data: templates });
}));

router.post('/', requireRole(['admin']), asyncHandler(async (req: Request, res: Response) => {
  const template = await prisma.custom_form_templates.create({ data: req.body });
  res.status(201).json({ success: true, data: template });
}));

router.put('/:id', requireRole(['admin']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const template = await prisma.custom_form_templates.update({
    where: { id: req.params.id },
    data: { ...req.body, updated_at: new Date() },
  });
  res.json({ success: true, data: template });
}));

router.delete('/:id', requireRole(['admin']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  await prisma.custom_form_templates.update({
    where: { id: req.params.id },
    data: { is_active: false, updated_at: new Date() },
  });
  res.json({ success: true, data: { id: req.params.id } });
}));

export default router;

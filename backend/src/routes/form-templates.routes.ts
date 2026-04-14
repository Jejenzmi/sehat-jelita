/**
 * SIMRS ZEN - Form Templates Routes
 * CRUD operations for custom form templates
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { requireRole } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();

// Require admin/management roles for all form template routes
router.use(requireRole(['admin', 'manajemen']));

// Validation schemas
const createFormTemplateSchema = z.object({
  template_name: z.string().min(2, 'Nama template minimal 2 karakter'),
  template_type: z.string().min(2, 'Tipe template minimal 2 karakter'),
  category: z.string().optional(),
  description: z.string().optional(),
  schema: z.record(z.unknown()),
  ui_config: z.record(z.unknown()).optional(),
  is_active: z.boolean().default(true),
  version: z.string().default('1.0.0')
});

const updateFormTemplateSchema = createFormTemplateSchema.partial();

// ============================================
// FORM TEMPLATES CRUD
// ============================================

/**
 * GET /api/form-templates
 * Get all form templates with pagination
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', template_type, category, is_active } = req.query;

  const where: Record<string, unknown> = {};
  if (template_type) where.template_type = template_type;
  if (category) where.category = category;
  if (is_active !== undefined) where.is_active = is_active === 'true';

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const [templates, total] = await Promise.all([
    prisma.custom_form_templates.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: parseInt(limit as string)
    }),
    prisma.custom_form_templates.count({ where })
  ]);

  res.json({
    success: true,
    data: templates,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      totalPages: Math.ceil(total / parseInt(limit as string))
    }
  });
}));

/**
 * GET /api/form-templates/:id
 * Get single form template
 */
router.get('/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const template = await prisma.custom_form_templates.findUnique({ where: { id } });

  if (!template) {
    throw new ApiError(404, 'Form template tidak ditemukan', 'FORM_TEMPLATE_NOT_FOUND');
  }

  res.json({ success: true, data: template });
}));

/**
 * POST /api/form-templates
 * Create new form template
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createFormTemplateSchema.parse(req.body);

  const template = await prisma.custom_form_templates.create({
    data: validatedData
  });

  res.status(201).json({ success: true, data: template });
}));

/**
 * PUT /api/form-templates/:id
 * Update form template
 */
router.put('/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const validatedData = updateFormTemplateSchema.parse(req.body);

  const template = await prisma.custom_form_templates.findUnique({ where: { id } });
  if (!template) {
    throw new ApiError(404, 'Form template tidak ditemukan', 'FORM_TEMPLATE_NOT_FOUND');
  }

  const updated = await prisma.custom_form_templates.update({
    where: { id },
    data: validatedData
  });

  res.json({ success: true, data: updated });
}));

/**
 * DELETE /api/form-templates/:id
 * Delete form template
 */
router.delete('/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const template = await prisma.custom_form_templates.findUnique({ where: { id } });
  if (!template) {
    throw new ApiError(404, 'Form template tidak ditemukan', 'FORM_TEMPLATE_NOT_FOUND');
  }

  await prisma.custom_form_templates.delete({ where: { id } });

  res.json({ success: true, message: 'Form template berhasil dihapus' });
}));

export default router;

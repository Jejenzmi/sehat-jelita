/**
 * SIMRS ZEN - Report Templates Routes
 * CRUD operations for custom report templates
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { requireRole } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();

// Require admin/management roles for all report template routes
router.use(requireRole(['admin', 'manajemen']));

// Validation schemas
const createReportTemplateSchema = z.object({
  template_name: z.string().min(2, 'Nama template minimal 2 karakter'),
  report_type: z.string().min(2, 'Tipe report minimal 2 karakter'),
  category: z.string().optional(),
  description: z.string().optional(),
  query_config: z.record(z.unknown()),
  display_config: z.record(z.unknown()).optional(),
  schedule_config: z.record(z.unknown()).optional(),
  is_active: z.boolean().default(true),
  version: z.string().default('1.0.0')
});

const updateReportTemplateSchema = createReportTemplateSchema.partial();

// ============================================
// REPORT TEMPLATES CRUD
// ============================================

/**
 * GET /api/report-templates
 * Get all report templates with pagination
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', report_type, category, is_active } = req.query;

  const where: Record<string, unknown> = {};
  if (report_type) where.report_type = report_type;
  if (category) where.category = category;
  if (is_active !== undefined) where.is_active = is_active === 'true';

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const [templates, total] = await Promise.all([
    prisma.custom_report_templates.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: parseInt(limit as string)
    }),
    prisma.custom_report_templates.count({ where })
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
 * GET /api/report-templates/:id
 * Get single report template
 */
router.get('/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const template = await prisma.custom_report_templates.findUnique({ where: { id } });

  if (!template) {
    throw new ApiError(404, 'Report template tidak ditemukan', 'REPORT_TEMPLATE_NOT_FOUND');
  }

  res.json({ success: true, data: template });
}));

/**
 * POST /api/report-templates
 * Create new report template
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createReportTemplateSchema.parse(req.body);

  const template = await prisma.custom_report_templates.create({
    data: validatedData
  });

  res.status(201).json({ success: true, data: template });
}));

/**
 * PUT /api/report-templates/:id
 * Update report template
 */
router.put('/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const validatedData = updateReportTemplateSchema.parse(req.body);

  const template = await prisma.custom_report_templates.findUnique({ where: { id } });
  if (!template) {
    throw new ApiError(404, 'Report template tidak ditemukan', 'REPORT_TEMPLATE_NOT_FOUND');
  }

  const updated = await prisma.custom_report_templates.update({
    where: { id },
    data: validatedData
  });

  res.json({ success: true, data: updated });
}));

/**
 * DELETE /api/report-templates/:id
 * Delete report template
 */
router.delete('/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const template = await prisma.custom_report_templates.findUnique({ where: { id } });
  if (!template) {
    throw new ApiError(404, 'Report template tidak ditemukan', 'REPORT_TEMPLATE_NOT_FOUND');
  }

  await prisma.custom_report_templates.delete({ where: { id } });

  res.json({ success: true, message: 'Report template berhasil dihapus' });
}));

export default router;

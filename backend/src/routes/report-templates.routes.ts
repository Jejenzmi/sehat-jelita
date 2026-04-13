/**
 * SIMRS ZEN - Custom Report Templates Routes
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { prisma } from '../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();
router.use(authenticateToken);

interface DataPreviewQuery {
  source?: string;
}

router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const templates = await prisma.custom_report_templates.findMany({
    where: { is_active: true },
    orderBy: { created_at: 'desc' },
  }).catch(() => []);
  res.json({ success: true, data: templates });
}));

router.post('/', requireRole(['admin']), asyncHandler(async (req: Request, res: Response) => {
  const template = await prisma.custom_report_templates.create({ data: req.body });
  res.status(201).json({ success: true, data: template });
}));

router.delete('/:id', requireRole(['admin']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  await prisma.custom_report_templates.update({
    where: { id: req.params.id },
    data: { is_active: false, updated_at: new Date() },
  });
  res.json({ success: true, data: { id: req.params.id } });
}));

// Data preview
router.get('/data/:source', requireRole(['admin', 'pelaporan']), asyncHandler(async (req: Request<{ source: string }, any, any, DataPreviewQuery>, res: Response) => {
  const { source } = req.params;
  let data: Array<Record<string, unknown>> = [];

  switch (source) {
    case 'visits':
      data = await prisma.visits.findMany({
        take: 100, orderBy: { visit_date: 'desc' },
        include: { patients: { select: { full_name: true } }, doctors: { select: { full_name: true } }, departments: { select: { department_name: true } } },
      }).catch(() => []);
      data = (data as Array<Record<string, unknown>>).map((v: Record<string, unknown>) => ({
        visit_date: v.visit_date, patient_name: (v as Record<string, { full_name?: string }>).patients?.full_name || '-',
        doctor_name: (v as Record<string, { full_name?: string }>).doctors?.full_name || '-', department: ((v as Record<string, { department_name?: string }>).departments)?.department_name || '-',
        visit_type: v.visit_type || '-', status: v.status || '-', payment_type: v.payment_type || '-',
        diagnosis: v.chief_complaint || '-',
      }));
      break;

    case 'billing':
      data = await prisma.billings.findMany({
        take: 100, orderBy: { billing_date: 'desc' },
        include: { patients: { select: { full_name: true } } },
      }).catch(() => []);
      data = (data as Array<Record<string, unknown>>).map((b: Record<string, unknown>) => ({
        invoice_number: b.invoice_number, billing_date: b.billing_date,
        patient_name: (b as Record<string, { full_name?: string }>).patients?.full_name || '-', total: b.total,
        paid_amount: b.paid_amount || 0, payment_type: b.payment_type || '-', status: b.status || '-',
      }));
      break;

    case 'pharmacy':
      data = await prisma.prescriptions.findMany({
        take: 100, orderBy: { created_at: 'desc' },
        include: { patients: { select: { full_name: true } } },
      }).catch(() => []);
      data = (data as Array<Record<string, unknown>>).map((p: Record<string, unknown>) => ({
        prescription_date: p.created_at, patient_name: (p as Record<string, { full_name?: string }>).patients?.full_name || '-',
        status: p.status || '-',
      }));
      break;

    case 'lab':
      data = await prisma.lab_orders.findMany({
        take: 100, orderBy: { order_date: 'desc' },
        include: { patients: { select: { full_name: true } } },
      }).catch(() => []);
      data = (data as Array<Record<string, unknown>>).map((l: Record<string, unknown>) => ({
        order_date: l.order_date, patient_name: (l as Record<string, { full_name?: string }>).patients?.full_name || '-', status: l.status || '-',
      }));
      break;

    case 'employees':
      data = await prisma.employees.findMany({
        take: 100, orderBy: { full_name: 'asc' },
        include: { departments: { select: { department_name: true } } },
      }).catch(() => []);
      data = (data as Array<Record<string, unknown>>).map((e: Record<string, unknown>) => ({
        employee_name: e.full_name, department: ((e as Record<string, { department_name?: string }>).departments)?.department_name || '-',
        position: e.position || '-', status: e.employment_type || '-', join_date: e.join_date || '-',
      }));
      break;

    case 'inventory':
      data = await prisma.medicines.findMany({ take: 100, orderBy: { medicine_name: 'asc' } }).catch(() => []);
      data = (data as Array<Record<string, unknown>>).map((m: Record<string, unknown>) => ({
        item_name: m.medicine_name, category: m.category || '-', stock: m.min_stock || 0,
        unit: m.unit || '-', min_stock: m.min_stock || 0,
      }));
      break;

    case 'bpjs':
      data = await prisma.bpjs_claims.findMany({
        take: 100, orderBy: { claim_date: 'desc' },
      } as any).catch(() => []);
      data = (data as Array<Record<string, unknown>>).map((c: Record<string, unknown>) => ({
        claim_date: c.claim_date, sep_number: c.sep_number,
        patient_name: (c as Record<string, { full_name?: string }>).patients?.full_name || '-', claim_amount: c.claim_amount,
        approved_amount: c.approved_amount || 0, status: c.status || '-',
      }));
      break;

    default:
      data = [];
  }

  res.json({ success: true, data });
}));

export default router;

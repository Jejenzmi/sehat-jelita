/**
 * SIMRS ZEN - Custom Report Templates Routes
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { prisma } from '../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();
router.use(authenticateToken);

router.get('/', asyncHandler(async (_req, res) => {
  const templates = await prisma.custom_report_templates.findMany({
    where: { is_active: true },
    orderBy: { created_at: 'desc' },
  }).catch(() => []);
  res.json({ success: true, data: templates });
}));

router.post('/', requireRole(['admin']), asyncHandler(async (req, res) => {
  const template = await prisma.custom_report_templates.create({ data: req.body });
  res.status(201).json({ success: true, data: template });
}));

router.delete('/:id', requireRole(['admin']), asyncHandler(async (req, res) => {
  await prisma.custom_report_templates.update({
    where: { id: req.params.id },
    data: { is_active: false, updated_at: new Date() },
  });
  res.json({ success: true, data: { id: req.params.id } });
}));

// ─── Data preview (admin only) ────────────────────────────────────────────────

router.get('/data/:source', requireRole(['admin', 'pelaporan']), asyncHandler(async (req, res) => {
  const { source } = req.params;
  let data = [];

  switch (source) {
    case 'visits':
      data = await prisma.visits.findMany({
        take: 100, orderBy: { visit_date: 'desc' },
        include: { patients: { select: { full_name: true } }, doctors: { select: { full_name: true } }, departments: { select: { department_name: true } } },
      }).catch(() => []);
      data = data.map(v => ({
        visit_date:   v.visit_date, patient_name: v.patients?.full_name || '-',
        doctor_name:  v.doctors?.full_name  || '-', department: v.departments?.department_name || '-',
        visit_type:   v.visit_type || '-', status: v.status || '-', payment_type: v.payment_type || '-',
        diagnosis:    v.chief_complaint || '-',
      }));
      break;

    case 'billing':
      data = await prisma.billings.findMany({
        take: 100, orderBy: { billing_date: 'desc' },
        include: { patients: { select: { full_name: true } } },
      }).catch(() => []);
      data = data.map(b => ({
        invoice_number: b.invoice_number, billing_date: b.billing_date,
        patient_name:   b.patients?.full_name || '-', total: b.total,
        paid_amount:    b.paid_amount || 0, payment_type: b.payment_type || '-', status: b.status || '-',
      }));
      break;

    case 'pharmacy':
      data = await prisma.prescriptions.findMany({
        take: 100, orderBy: { created_at: 'desc' },
        include: { patients: { select: { full_name: true } } },
      }).catch(() => []);
      data = data.map(p => ({
        prescription_date: p.created_at, patient_name: p.patients?.full_name || '-',
        status: p.status || '-',
      }));
      break;

    case 'lab':
      data = await prisma.lab_orders.findMany({
        take: 100, orderBy: { ordered_at: 'desc' },
        include: { patients: { select: { full_name: true } } },
      }).catch(() => []);
      data = data.map(l => ({
        order_date: l.ordered_at, patient_name: l.patients?.full_name || '-', status: l.status || '-',
      }));
      break;

    case 'employees':
      data = await prisma.employees.findMany({
        take: 100, orderBy: { full_name: 'asc' },
        include: { departments: { select: { department_name: true } } },
      }).catch(() => []);
      data = data.map(e => ({
        employee_name: e.full_name, department: e.departments?.department_name || '-',
        position: e.job_title || '-', status: e.employment_status || '-', join_date: e.hire_date || '-',
      }));
      break;

    case 'inventory':
      data = await prisma.medicines.findMany({ take: 100, orderBy: { name: 'asc' } }).catch(() => []);
      data = data.map(m => ({
        item_name: m.name, category: m.category || '-', stock: m.stock_quantity || 0,
        unit: m.unit || '-', min_stock: m.minimum_stock || 0,
      }));
      break;

    case 'bpjs':
      data = await prisma.bpjs_claims.findMany({
        take: 100, orderBy: { claim_date: 'desc' },
        include: { patients: { select: { full_name: true } } },
      }).catch(() => []);
      data = data.map(c => ({
        claim_date: c.claim_date, sep_number: c.sep_number,
        patient_name: c.patients?.full_name || '-', claim_amount: c.claim_amount,
        approved_amount: c.approved_amount || 0, status: c.status || '-',
      }));
      break;

    default:
      data = [];
  }

  res.json({ success: true, data });
}));

export default router;

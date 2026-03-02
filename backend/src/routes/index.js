/**
 * SIMRS ZEN - Routes Index
 * Central routing configuration
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// Import route modules
import authRoutes from './auth.routes.js';
import patientRoutes from './patients.routes.js';
import visitRoutes from './visits.routes.js';
import billingRoutes from './billing.routes.js';
import pharmacyRoutes from './pharmacy.routes.js';
import labRoutes from './lab.routes.js';
import radiologyRoutes from './radiology.routes.js';
import surgeryRoutes from './surgery.routes.js';
import icuRoutes from './icu.routes.js';
import inpatientRoutes from './inpatient.routes.js';
import emergencyRoutes from './emergency.routes.js';
import bpjsRoutes from './bpjs.routes.js';
import satusehatRoutes from './satusehat.routes.js';
import hrRoutes from './hr.routes.js';
import inventoryRoutes from './inventory.routes.js';
import accountingRoutes from './accounting.routes.js';
import nutritionRoutes from './nutrition.routes.js';
import rehabilitationRoutes from './rehabilitation.routes.js';
import mcuRoutes from './mcu.routes.js';
import bloodbankRoutes from './bloodbank.routes.js';
import dialysisRoutes from './dialysis.routes.js';
import forensicRoutes from './forensic.routes.js';
import educationRoutes from './education.routes.js';
import eklaimIDRGRoutes from './eklaim-idrg.routes.js';
import adminRoutes from './admin.routes.js';
import ambulanceRoutes from './ambulance.routes.js';
import homeCareRoutes from './home-care.routes.js';

const router = Router();

// ============================================
// PUBLIC ROUTES (No Authentication)
// ============================================

// Auth routes (login, register, password reset)
router.use('/auth', authRoutes);

// ============================================
// PROTECTED ROUTES (Require Authentication)
// ============================================

// Apply authentication middleware to all routes below
router.use(authenticateToken);

// Core Clinical Modules
router.use('/patients', patientRoutes);
router.use('/visits', visitRoutes);
router.use('/pharmacy', pharmacyRoutes);
router.use('/lab', labRoutes);
router.use('/radiology', radiologyRoutes);

// Specialized Clinical Modules
router.use('/surgery', surgeryRoutes);
router.use('/icu', icuRoutes);
router.use('/inpatient', inpatientRoutes);
router.use('/emergency', emergencyRoutes);

// Support Clinical Modules
router.use('/nutrition', nutritionRoutes);
router.use('/rehabilitation', rehabilitationRoutes);
router.use('/mcu', mcuRoutes);
router.use('/bloodbank', bloodbankRoutes);
router.use('/dialysis', dialysisRoutes);
router.use('/forensic', forensicRoutes);

// Administrative Modules
router.use('/billing', billingRoutes);
router.use('/hr', hrRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/accounting', accountingRoutes);

// Admin Module
router.use('/admin', adminRoutes);

// External Integration Modules
router.use('/bpjs', bpjsRoutes);
router.use('/satusehat', satusehatRoutes);
router.use('/eklaim', eklaimIDRGRoutes);

// Education Module (Teaching Hospital)
router.use('/education', educationRoutes);

// Ambulance & Home Care Modules
router.use('/ambulance', ambulanceRoutes);
router.use('/home-care', homeCareRoutes);

// ============================================
// ADMIN ONLY ROUTES
// ============================================

// System administration routes
router.get('/admin/audit-logs', requireRole(['admin']), asyncHandler(async (req, res) => {
  const { prisma } = await import('../config/database.js');
  const { page = 1, limit = 50, table_name, action, user_id } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);
  
  const where = {};
  if (table_name) where.table_name = table_name;
  if (action) where.action = action;
  if (user_id) where.user_id = user_id;
  
  const [total, logs] = await Promise.all([
    prisma.audit_logs.count({ where }),
    prisma.audit_logs.findMany({
      where,
      skip,
      take,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: { id: true, email: true, full_name: true }
        }
      }
    })
  ]);
  
  res.json({
    success: true,
    data: logs,
    pagination: { page: parseInt(page), limit: parseInt(limit), total }
  });
}));

router.get('/admin/system-settings', requireRole(['admin']), asyncHandler(async (req, res) => {
  const { prisma } = await import('../config/database.js');
  const settings = await prisma.system_settings.findMany();
  res.json({ success: true, data: settings });
}));

router.put('/admin/system-settings/:key', requireRole(['admin']), asyncHandler(async (req, res) => {
  const { prisma } = await import('../config/database.js');
  const { key } = req.params;
  const { value } = req.body;
  
  const setting = await prisma.system_settings.upsert({
    where: { setting_key: key },
    update: { setting_value: value },
    create: { setting_key: key, setting_value: value }
  });
  
  res.json({ success: true, data: setting });
}));

// Check whether initial hospital setup has been completed
router.get('/admin/setup-status', asyncHandler(async (req, res) => {
  const { prisma } = await import('../config/database.js');
  const setting = await prisma.system_settings.findUnique({
    where: { setting_key: 'setup_completed' }
  });
  res.json({ success: true, data: setting?.setting_value === 'true' });
}));

// Get available modules (optionally filtered by hospital type)
router.get('/admin/modules', asyncHandler(async (req, res) => {
  const { prisma } = await import('../config/database.js');
  const { hospital_type } = req.query;
  const where = { setting_key: { startsWith: 'module_' } };
  const settings = await prisma.system_settings.findMany({ where });
  // If hospital_type is provided, filter client-side using description or key naming convention
  const filtered = hospital_type
    ? settings.filter(s => !s.description || s.description.includes(hospital_type) || s.description.includes('all'))
    : settings;
  res.json({ success: true, data: filtered });
}));

// Get menu access for the current user's roles
router.get('/admin/menu-access', asyncHandler(async (req, res) => {
  const { prisma } = await import('../config/database.js');
  const userRoles = req.user?.roles ?? [];
  const access = await prisma.menu_access.findMany({
    where: { role: { in: userRoles } }
  });
  res.json({ success: true, data: access });
}));

// Reset system to initial state (admin only)
router.post('/admin/reset-system', requireRole(['admin']), asyncHandler(async (req, res) => {
  const { prisma } = await import('../config/database.js');
  await prisma.system_settings.upsert({
    where: { setting_key: 'setup_completed' },
    update: { setting_value: 'false' },
    create: { setting_key: 'setup_completed', setting_value: 'false' }
  });
  res.json({ success: true, data: true });
}));

// Preview hospital type migration
router.post('/admin/hospital-migration/preview', requireRole(['admin']), asyncHandler(async (req, res) => {
  const { target_type } = req.body;
  res.json({ success: true, data: { target_type, modules_affected: [] } });
}));

// Execute hospital type migration
router.post('/admin/hospital-migration/execute', requireRole(['admin']), asyncHandler(async (req, res) => {
  const { prisma } = await import('../config/database.js');
  const { target_type } = req.body;
  await prisma.system_settings.upsert({
    where: { setting_key: 'hospital_type' },
    update: { setting_value: target_type },
    create: { setting_key: 'hospital_type', setting_value: target_type }
  });
  res.json({ success: true, data: true });
}));

// ============================================
// REPORTS ROUTES
// ============================================

router.get('/reports/dashboard', asyncHandler(async (req, res) => {
  const { prisma } = await import('../config/database.js');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const [
    totalPatients,
    todayVisits,
    pendingBillings,
    occupiedBeds
  ] = await Promise.all([
    prisma.patients.count({ where: { is_active: true } }),
    prisma.visits.count({
      where: { visit_date: { gte: today, lt: tomorrow } }
    }),
    prisma.billings.count({ where: { status: 'pending' } }),
    prisma.beds.count({ where: { status: 'occupied' } })
  ]);
  
  res.json({
    success: true,
    data: {
      totalPatients,
      todayVisits,
      pendingBillings,
      occupiedBeds
    }
  });
}));

router.get('/reports/revenue', requireRole(['admin', 'keuangan', 'direktur']), asyncHandler(async (req, res) => {
  const { prisma } = await import('../config/database.js');
  const { date_from, date_to, group_by = 'day' } = req.query;
  
  const where = { status: 'paid' };
  if (date_from || date_to) {
    where.payment_date = {};
    if (date_from) where.payment_date.gte = new Date(date_from);
    if (date_to) where.payment_date.lte = new Date(date_to);
  }
  
  const revenue = await prisma.billings.aggregate({
    where,
    _sum: { total: true, paid_amount: true },
    _count: true
  });
  
  const byPaymentType = await prisma.billings.groupBy({
    by: ['payment_type'],
    where,
    _sum: { total: true },
    _count: true
  });
  
  res.json({
    success: true,
    data: {
      totalRevenue: revenue._sum.total || 0,
      totalPaid: revenue._sum.paid_amount || 0,
      transactionCount: revenue._count,
      byPaymentType
    }
  });
}));

router.get('/reports/visits', asyncHandler(async (req, res) => {
  const { prisma } = await import('../config/database.js');
  const { date_from, date_to } = req.query;
  
  const where = {};
  if (date_from || date_to) {
    where.visit_date = {};
    if (date_from) where.visit_date.gte = new Date(date_from);
    if (date_to) where.visit_date.lte = new Date(date_to);
  }
  
  const [
    byType,
    byDepartment,
    byStatus
  ] = await Promise.all([
    prisma.visits.groupBy({
      by: ['visit_type'],
      where,
      _count: true
    }),
    prisma.visits.groupBy({
      by: ['department_id'],
      where,
      _count: true
    }),
    prisma.visits.groupBy({
      by: ['status'],
      where,
      _count: true
    })
  ]);
  
  res.json({
    success: true,
    data: { byType, byDepartment, byStatus }
  });
}));

router.post('/reports/rl6-indicators', asyncHandler(async (req, res) => {
  const { prisma } = await import('../config/database.js');
  const { month, year } = req.body;

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const [
    totalInpatient,
    totalDischarges,
    occupiedBeds,
    totalBeds
  ] = await Promise.all([
    prisma.inpatient_admissions.count({
      where: { admission_date: { gte: startDate, lte: endDate } }
    }),
    prisma.inpatient_admissions.count({
      where: { discharge_date: { gte: startDate, lte: endDate } }
    }),
    prisma.beds.count({ where: { status: 'occupied' } }),
    prisma.beds.count()
  ]);

  const bor = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(2) : 0;

  res.json({
    success: true,
    data: {
      month,
      year,
      totalInpatient,
      totalDischarges,
      occupiedBeds,
      totalBeds,
      bor: parseFloat(bor)
    }
  });
}));

// ============================================
// QUEUE MANAGEMENT
// ============================================

router.get('/queue/:departmentId', asyncHandler(async (req, res) => {
  const { prisma } = await import('../config/database.js');
  const { departmentId } = req.params;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const queue = await prisma.queue_entries.findMany({
    where: {
      department_id: departmentId,
      created_at: { gte: today },
      status: { in: ['waiting', 'called'] }
    },
    include: {
      visits: {
        include: {
          patients: {
            select: { id: true, full_name: true, medical_record_number: true }
          }
        }
      }
    },
    orderBy: { queue_number: 'asc' }
  });
  
  res.json({ success: true, data: queue });
}));

router.post('/queue/:id/call', asyncHandler(async (req, res) => {
  const { prisma } = await import('../config/database.js');
  const { id } = req.params;
  
  const entry = await prisma.queue_entries.update({
    where: { id },
    data: {
      status: 'called',
      called_at: new Date()
    },
    include: {
      visits: {
        include: { patients: true }
      }
    }
  });
  
  // Emit socket event for queue display
  const io = req.app.get('io');
  if (io) {
    io.to(`queue:${entry.department_id}`).emit('queue:called', entry);
  }
  
  res.json({ success: true, data: entry });
}));

export default router;

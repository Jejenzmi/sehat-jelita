/**
 * SIMRS ZEN - Admin Routes
 * System settings, departments, doctors, user roles, profiles, circuit breakers, backup jobs
 */

import { Router } from 'express';
import { prisma } from '../config/database.js';
import { requireRole } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { getAllBreakerStatus } from '../utils/circuit-breaker.js';
import { bpjsBreaker, satusehatBreaker, icd11Breaker } from '../utils/circuit-breaker.js';

const router = Router();

// ============================================
// SYSTEM SETTINGS
// ============================================

router.get('/system-settings', asyncHandler(async (_req, res) => {
  const settings = await prisma.system_settings.findMany({
    orderBy: { setting_key: 'asc' }
  });
  res.json({ success: true, data: settings });
}));

router.put('/system-settings/:key', requireRole(['admin']), asyncHandler(async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;

  const setting = await prisma.system_settings.upsert({
    where: { setting_key: key },
    update: { setting_value: String(value) },
    create: { setting_key: key, setting_value: String(value) }
  });

  res.json({ success: true, data: setting });
}));

// ============================================
// DEPARTMENTS
// ============================================

router.get('/departments', asyncHandler(async (req, res) => {
  const { is_active, search } = req.query;

  const where: Record<string, unknown> = {};
  if (is_active !== undefined) where.is_active = is_active === 'true';
  if (search) where.department_name = { contains: search as string, mode: 'insensitive' };

  const departments = await prisma.departments.findMany({
    where,
    orderBy: { department_name: 'asc' }
  });

  res.json({ success: true, data: departments });
}));

router.post('/departments', requireRole(['admin']), asyncHandler(async (req, res) => {
  const { department_name, department_code, description, is_active } = req.body;

  const department = await prisma.departments.create({
    data: {
      department_name,
      department_code,
      is_active: is_active ?? true
    }
  });

  res.status(201).json({ success: true, data: department });
}));

router.put('/departments/:id', requireRole(['admin']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  const department = await prisma.departments.update({
    where: { id },
    data: { is_active }
  });

  res.json({ success: true, data: department });
}));

// ============================================
// DOCTORS (via employees with doctor role)
// ============================================

router.get('/doctors', asyncHandler(async (req, res) => {
  const { is_active, search } = req.query;

  const where: Record<string, unknown> = { is_active: is_active === 'false' ? false : true };
  if (search) where.full_name = { contains: search as string, mode: 'insensitive' };

  const doctors = await prisma.employees.findMany({
    where,
    include: { departments: true },
    orderBy: { full_name: 'asc' }
  });

  res.json({ success: true, data: doctors });
}));

router.post('/doctors', requireRole(['admin']), asyncHandler(async (req, res) => {
  const { full_name, employee_code, department_id, specialization, phone, email, is_active } = req.body;

  const doctor = await prisma.employees.create({
    data: {
      full_name,
      employee_code,
      department_id,
      phone,
      email,
      is_active: is_active ?? true
    }
  });

  res.status(201).json({ success: true, data: doctor });
}));

router.put('/doctors/:id', requireRole(['admin']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  const doctor = await prisma.employees.update({
    where: { id },
    data: { is_active }
  });

  res.json({ success: true, data: doctor });
}));

// ============================================
// USER ROLES
// ============================================

router.get('/user-roles', asyncHandler(async (_req, res) => {
  const roles = await prisma.user_roles.findMany({
    include: { profile: { select: { user_id: true, email: true, full_name: true } } }
  });
  res.json({ success: true, data: roles });
}));

router.put('/user-roles/user/:userId', requireRole(['admin']), asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { roles } = req.body;

  if (!Array.isArray(roles)) {
    throw new ApiError(400, 'Roles must be an array');
  }

  await prisma.user_roles.deleteMany({ where: { user_id: userId } });

  const newRoles = await Promise.all(
    roles.map((role: string) =>
      prisma.user_roles.create({ data: { user_id: userId, role } })
    )
  );

  res.json({ success: true, data: newRoles });
}));

// ============================================
// PROFILES (User Management)
// ============================================

router.get('/profiles', requireRole(['admin']), asyncHandler(async (req, res) => {
  const { limit = 200, search } = req.query;

  const where: Record<string, unknown> = {};
  if (search) where.full_name = { contains: search as string, mode: 'insensitive' };

  const profiles = await prisma.profiles.findMany({
    where,
    include: { user_roles: true },
    take: Number(limit),
    orderBy: { created_at: 'desc' }
  });

  res.json({ success: true, data: profiles });
}));

router.put('/profiles/:id', requireRole(['admin']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { is_active, roles } = req.body;

  const profile = await prisma.profiles.update({
    where: { user_id: id },
    data: { is_active }
  });

  if (roles && Array.isArray(roles)) {
    await prisma.user_roles.deleteMany({ where: { user_id: id } });
    await Promise.all(
      roles.map((role: string) =>
        prisma.user_roles.create({ data: { user_id: id, role } })
      )
    );
  }

  res.json({ success: true, data: profile });
}));

// ============================================
// CIRCUIT BREAKERS
// ============================================

router.get('/circuit-breakers', requireRole(['admin']), asyncHandler(async (_req, res) => {
  const breakers = getAllBreakerStatus();
  res.json({ success: true, data: breakers });
}));

router.post('/circuit-breakers/:name/reset', requireRole(['admin']), asyncHandler(async (req, res) => {
  const { name } = req.params;
  const breakers: Record<string, any> = { bpjs: bpjsBreaker, satusehat: satusehatBreaker, icd11: icd11Breaker };
  const breaker = breakers[name];
  const success = breaker ? (breaker.reset(), true) : false;

  if (!success) {
    throw new ApiError(404, `Circuit breaker '${name}' not found`);
  }

  res.json({ success: true, message: `Circuit breaker '${name}' has been reset` });
}));

// ============================================
// BACKUP JOBS
// ============================================

router.post('/jobs/backup', requireRole(['admin']), asyncHandler(async (req, res) => {
  const { enqueue } = await import('../utils/queue.js');
  
  const job = await enqueue('reports', 'manual-backup', {
    triggered_by: req.user?.id,
    timestamp: new Date().toISOString()
  });

  res.status(202).json({ success: true, data: job, message: 'Backup job queued' });
}));

// ============================================
// BOOTSTRAP (Initial system setup)
// ============================================

router.get('/bootstrap', asyncHandler(async (_req, res) => {
  const settings = await prisma.system_settings.findMany({
    where: { setting_key: { in: ['setup_completed', 'hospital_name', 'hospital_code'] } }
  });

  const bootstrap = {
    setup_completed: settings.find(s => s.setting_key === 'setup_completed')?.setting_value === 'true',
    hospital_name: settings.find(s => s.setting_key === 'hospital_name')?.setting_value || '',
    hospital_code: settings.find(s => s.setting_key === 'hospital_code')?.setting_value || ''
  };

  res.json({ success: true, data: bootstrap });
}));

export default router;

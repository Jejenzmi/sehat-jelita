/**
 * SIMRS ZEN - Admin Routes
 * Manages departments, profiles, notifications, doctors, and system settings
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { requireRole } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();

// All admin routes require admin role
router.use(requireRole(['admin']));

// Validation schemas
const departmentSchema = z.object({
  department_code: z.string().max(20),
  department_name: z.string().max(100),
  department_type: z.string().max(50).optional(),
  head_doctor_id: z.string().uuid().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  is_active: z.boolean().optional()
});

const doctorSchema = z.object({
  employee_id: z.string().uuid().optional().nullable(),
  user_id: z.string().uuid().optional().nullable(),
  doctor_code: z.string().max(20),
  sip_number: z.string().max(50).optional().nullable(),
  str_number: z.string().max(50).optional().nullable(),
  full_name: z.string().max(100).optional().nullable(),
  specialization: z.string().max(100).optional().nullable(),
  department_id: z.string().uuid().optional().nullable(),
  consultation_fee: z.number().optional().nullable(),
  is_active: z.boolean().optional(),
  schedule: z.record(z.unknown()).optional().nullable()
});

const notificationSchema = z.object({
  user_id: z.string().uuid(),
  title: z.string().max(200),
  message: z.string().optional().nullable(),
  type: z.string().max(50).optional().nullable(),
  reference_type: z.string().max(50).optional().nullable(),
  reference_id: z.string().uuid().optional().nullable()
});

// ============================================
// DEPARTMENTS
// ============================================

/**
 * GET /api/admin/departments
 */
router.get('/departments', asyncHandler(async (req, res) => {
  const { search, is_active } = req.query;

  const where = {};
  if (is_active !== undefined) where.is_active = is_active === 'true';
  if (search) {
    where.OR = [
      { department_name: { contains: search, mode: 'insensitive' } },
      { department_code: { contains: search, mode: 'insensitive' } }
    ];
  }

  const departments = await prisma.departments.findMany({
    where,
    orderBy: { department_name: 'asc' }
  });

  res.json({ success: true, data: departments });
}));

/**
 * POST /api/admin/departments
 */
router.post('/departments', asyncHandler(async (req, res) => {
  const data = departmentSchema.parse(req.body);
  const department = await prisma.departments.create({ data });

  res.status(201).json({ success: true, data: department });
}));

/**
 * PUT /api/admin/departments/:id
 */
router.put('/departments/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = departmentSchema.partial().parse(req.body);

  const department = await prisma.departments.update({ where: { id }, data });

  res.json({ success: true, data: department });
}));

/**
 * DELETE /api/admin/departments/:id
 */
router.delete('/departments/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.departments.update({
    where: { id },
    data: { is_active: false }
  });

  res.json({ success: true, message: 'Department deactivated' });
}));

// ============================================
// PROFILES (USERS)
// ============================================

/**
 * GET /api/admin/profiles
 */
router.get('/profiles', asyncHandler(async (req, res) => {
  const { search, is_active, page = 1, limit = 50 } = req.query;

  const where = {};
  if (is_active !== undefined) where.is_active = is_active === 'true';
  if (search) {
    where.OR = [
      { full_name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [profiles, total] = await Promise.all([
    prisma.profiles.findMany({
      where,
      select: {
        id: true,
        user_id: true,
        email: true,
        full_name: true,
        phone: true,
        avatar_url: true,
        is_active: true,
        last_login: true,
        created_at: true,
        user_roles: { select: { role: true } }
      },
      orderBy: { full_name: 'asc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    }),
    prisma.profiles.count({ where })
  ]);

  res.json({
    success: true,
    data: profiles,
    pagination: { page: parseInt(page), limit: parseInt(limit), total }
  });
}));

/**
 * PUT /api/admin/profiles/:id
 */
router.put('/profiles/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { full_name, phone, is_active } = req.body;

  const profile = await prisma.profiles.update({
    where: { id },
    data: { full_name, phone, is_active },
    select: {
      id: true,
      email: true,
      full_name: true,
      phone: true,
      is_active: true
    }
  });

  res.json({ success: true, data: profile });
}));

// ============================================
// NOTIFICATIONS
// ============================================

/**
 * GET /api/admin/notifications
 */
router.get('/notifications', asyncHandler(async (req, res) => {
  const { user_id, is_read, page = 1, limit = 50 } = req.query;

  const where = {};
  if (user_id) where.user_id = user_id;
  if (is_read !== undefined) where.is_read = is_read === 'true';

  const [notifications, total] = await Promise.all([
    prisma.notifications.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    }),
    prisma.notifications.count({ where })
  ]);

  res.json({
    success: true,
    data: notifications,
    pagination: { page: parseInt(page), limit: parseInt(limit), total }
  });
}));

/**
 * POST /api/admin/notifications
 */
router.post('/notifications', asyncHandler(async (req, res) => {
  const data = notificationSchema.parse(req.body);
  const notification = await prisma.notifications.create({ data });

  res.status(201).json({ success: true, data: notification });
}));

/**
 * DELETE /api/admin/notifications/:id
 */
router.delete('/notifications/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.notifications.delete({ where: { id } });

  res.json({ success: true, message: 'Notification deleted' });
}));

// ============================================
// DOCTORS
// ============================================

/**
 * GET /api/admin/doctors
 */
router.get('/doctors', asyncHandler(async (req, res) => {
  const { search, departmentId, is_active, page = 1, limit = 50 } = req.query;

  const where = {};
  if (is_active !== undefined) where.is_active = is_active === 'true';
  if (departmentId) where.department_id = departmentId;
  if (search) {
    where.OR = [
      { full_name: { contains: search, mode: 'insensitive' } },
      { doctor_code: { contains: search, mode: 'insensitive' } },
      { specialization: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [doctors, total] = await Promise.all([
    prisma.doctors.findMany({
      where,
      include: {
        departments: { select: { id: true, department_name: true } }
      },
      orderBy: { full_name: 'asc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    }),
    prisma.doctors.count({ where })
  ]);

  res.json({
    success: true,
    data: doctors,
    pagination: { page: parseInt(page), limit: parseInt(limit), total }
  });
}));

/**
 * POST /api/admin/doctors
 */
router.post('/doctors', asyncHandler(async (req, res) => {
  const data = doctorSchema.parse(req.body);
  const doctor = await prisma.doctors.create({ data });

  res.status(201).json({ success: true, data: doctor });
}));

/**
 * PUT /api/admin/doctors/:id
 */
router.put('/doctors/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = doctorSchema.partial().parse(req.body);

  const doctor = await prisma.doctors.update({ where: { id }, data });

  res.json({ success: true, data: doctor });
}));

// ============================================
// SYSTEM SETTINGS
// ============================================

const SYSTEM_SETTINGS_COLUMNS = new Set([
  'id', 'setting_key', 'setting_value', 'setting_type', 'description', 'is_public', 'created_at', 'updated_at'
]);
const MAX_SETTING_KEYS = 50;

/**
 * GET /api/admin/system-settings
 * Supports query params: setting_key (eq), setting_key_in (comma-separated IN), select (comma-separated fields)
 */
router.get('/system-settings', asyncHandler(async (req, res) => {
  const { setting_key, setting_key_in, select } = req.query;

  const where = {};
  if (setting_key) {
    where.setting_key = setting_key;
  } else if (setting_key_in) {
    const keys = setting_key_in.split(',').map(k => k.trim()).filter(Boolean).slice(0, MAX_SETTING_KEYS);
    if (keys.length > 0) where.setting_key = { in: keys };
  }

  let selectFields;
  if (select && select !== '*') {
    const fields = select.split(',').map(f => f.trim()).filter(f => SYSTEM_SETTINGS_COLUMNS.has(f));
    if (fields.length > 0) {
      selectFields = {};
      fields.forEach(f => { selectFields[f] = true; });
    }
  }

  const settings = await prisma.system_settings.findMany({
    where,
    ...(selectFields ? { select: selectFields } : {})
  });
  res.json({ success: true, data: settings });
}));

/**
 * PUT /api/admin/system-settings/:key
 */
router.put('/system-settings/:key', asyncHandler(async (req, res) => {
  const { key } = req.params;
  // Accept both 'value' (standard API format) and 'setting_value' (column format).
  // 'value' takes precedence when both are present.
  const { value, setting_value } = req.body;
  const settingValue = value !== undefined ? value : setting_value;

  const setting = await prisma.system_settings.upsert({
    where: { setting_key: key },
    update: { setting_value: settingValue },
    create: { setting_key: key, setting_value: settingValue }
  });

  res.json({ success: true, data: setting });
}));

/**
 * PUT /api/admin/system-settings
 * Fallback route when the key is provided in the request body instead of the URL.
 */
router.put('/system-settings', asyncHandler(async (req, res) => {
  const { setting_key, value, setting_value } = req.body;
  if (!setting_key) {
    return res.status(400).json({ success: false, error: 'setting_key diperlukan' });
  }
  const settingValue = value !== undefined ? value : setting_value;

  const setting = await prisma.system_settings.upsert({
    where: { setting_key },
    update: { setting_value: settingValue },
    create: { setting_key, setting_value: settingValue }
  });

  res.json({ success: true, data: setting });
}));

// ============================================
// USER ROLES
// ============================================

/**
 * GET /api/admin/user-roles
 */
router.get('/user-roles', asyncHandler(async (req, res) => {
  const { user_id } = req.query;

  const where = {};
  if (user_id) where.user_id = user_id;

  const userRoles = await prisma.user_roles.findMany({
    where,
    orderBy: { created_at: 'desc' },
  });

  res.json({ success: true, data: userRoles });
}));

/**
 * POST /api/admin/user-roles
 */
router.post('/user-roles', asyncHandler(async (req, res) => {
  const { user_id, role } = req.body;
  const userRole = await prisma.user_roles.create({ data: { user_id, role } });
  res.status(201).json({ success: true, data: userRole });
}));

/**
 * DELETE /api/admin/user-roles/:id
 */
router.delete('/user-roles/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.user_roles.delete({ where: { id } });
  res.json({ success: true, message: 'User role removed' });
}));

export default router;

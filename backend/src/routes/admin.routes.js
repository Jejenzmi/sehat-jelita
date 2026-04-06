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

/**
 * PUT /api/admin/user-roles/user/:userId
 * Replace all roles for a user
 */
router.put('/user-roles/user/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { roles } = req.body;

  if (!Array.isArray(roles)) {
    return res.status(400).json({ success: false, error: 'roles harus berupa array' });
  }

  // Delete all existing roles then insert new ones in a transaction
  await prisma.$transaction(async (tx) => {
    await tx.user_roles.deleteMany({ where: { user_id: userId } });
    if (roles.length > 0) {
      await tx.user_roles.createMany({
        data: roles.map((role) => ({ user_id: userId, role }))
      });
    }
  });

  res.json({ success: true, message: 'Roles updated' });
}));

// ============================================
// HOSPITAL TYPE MIGRATION
// ============================================

const HOSPITAL_TYPE_MODULES = {
  A: ['rawat_jalan', 'rawat_inap', 'igd', 'laboratorium', 'radiologi', 'farmasi', 'billing', 'bpjs', 'icu', 'bedah', 'hemodialisa', 'bank_darah', 'rehabilitasi', 'mcu', 'forensik', 'pendidikan'],
  B: ['rawat_jalan', 'rawat_inap', 'igd', 'laboratorium', 'radiologi', 'farmasi', 'billing', 'bpjs', 'icu', 'bedah', 'hemodialisa', 'bank_darah', 'rehabilitasi'],
  C: ['rawat_jalan', 'rawat_inap', 'igd', 'laboratorium', 'radiologi', 'farmasi', 'billing', 'bpjs', 'icu', 'bedah'],
  D: ['rawat_jalan', 'rawat_inap', 'igd', 'laboratorium', 'farmasi', 'billing', 'bpjs'],
  FKTP: ['rawat_jalan', 'laboratorium', 'farmasi', 'billing', 'bpjs'],
};

router.get('/hospital-migration/preview', asyncHandler(async (req, res) => {
  const { new_type } = req.query;
  const hospital = await prisma.hospitals.findFirst();
  const currentType = hospital?.hospital_type || 'C';
  const currentModules = HOSPITAL_TYPE_MODULES[currentType] || [];
  const newModules = HOSPITAL_TYPE_MODULES[new_type] || [];
  res.json({
    success: true,
    data: {
      current_type: currentType,
      new_type,
      current_modules: currentModules.map(m => ({ code: m, name: m, category: 'clinical' })),
      new_modules: newModules.map(m => ({ code: m, name: m, category: 'clinical' })),
      modules_added: newModules.filter(m => !currentModules.includes(m)).map(m => ({ code: m, name: m, category: 'clinical' })),
      modules_removed: currentModules.filter(m => !newModules.includes(m)).map(m => ({ code: m, name: m, category: 'clinical' })),
    }
  });
}));

router.post('/hospital-migration/execute', asyncHandler(async (req, res) => {
  const { new_type, notes } = req.body;
  const hospital = await prisma.hospitals.findFirst();
  if (!hospital) return res.status(404).json({ success: false, error: 'Profil rumah sakit tidak ditemukan' });

  const currentType = hospital.hospital_type || 'C';
  const currentModules = HOSPITAL_TYPE_MODULES[currentType] || [];
  const newModules = HOSPITAL_TYPE_MODULES[new_type] || [];

  await prisma.hospitals.update({ where: { id: hospital.id }, data: { hospital_type: new_type } });

  res.json({
    success: true,
    data: {
      from_type: currentType,
      to_type: new_type,
      modules_added: newModules.filter(m => !currentModules.includes(m)),
      modules_removed: currentModules.filter(m => !newModules.includes(m)),
    }
  });
}));

router.get('/hospital-migration/logs', asyncHandler(async (req, res) => {
  // Return empty logs — migration history not separately tracked
  res.json({ success: true, data: [] });
}));

/**
 * POST /api/admin/system-reset
 * Reset system to initial state (admin only)
 */
router.post('/system-reset', asyncHandler(async (req, res) => {
  // Delete all operational data but keep master data and settings
  await prisma.$transaction([
    prisma.audit_logs.deleteMany({}),
    prisma.billing_items.deleteMany({}),
    prisma.billings.deleteMany({}),
    prisma.prescription_items.deleteMany({}),
    prisma.prescriptions.deleteMany({}),
    prisma.lab_results.deleteMany({}),
    prisma.lab_orders.deleteMany({}),
    prisma.medical_records.deleteMany({}),
    prisma.queue_entries.deleteMany({}),
    prisma.visits.deleteMany({}),
  ]);

  // Reset setup_completed flag
  await prisma.system_settings.upsert({
    where: { setting_key: 'setup_completed' },
    update: { setting_value: 'false' },
    create: { setting_key: 'setup_completed', setting_value: 'false' },
  });

  res.json({ success: true, message: 'Sistem berhasil direset ke kondisi awal' });
}));

/**
 * POST /api/admin/bootstrap
 * Grant admin role to first user (only when no roles exist)
 */
router.post('/bootstrap', asyncHandler(async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ success: false, error: 'user_id diperlukan' });

  const existingRoles = await prisma.user_roles.count();
  if (existingRoles > 0) {
    return res.status(403).json({ success: false, error: 'Bootstrap tidak diizinkan — role sudah ada' });
  }

  const role = await prisma.user_roles.create({ data: { user_id, role: 'admin' } });
  res.status(201).json({ success: true, data: role });
}));

// ============================================
// MEDICINES (MASTER DATA)
// ============================================

const medicineSchema = z.object({
  medicine_code: z.string().max(50),
  medicine_name: z.string().max(200),
  generic_name: z.string().max(200).optional().nullable(),
  category: z.string().max(50).optional().nullable(),
  unit: z.string().max(20).optional().nullable(),
  unit_price: z.number().optional().nullable(),
  current_stock: z.number().int().optional().nullable(),
  min_stock: z.number().int().optional().nullable(),
  is_active: z.boolean().optional()
});

router.get('/medicines', asyncHandler(async (req, res) => {
  const { search, is_active } = req.query;
  const where = {};
  if (is_active !== undefined) where.is_active = is_active === 'true';
  if (search) {
    where.OR = [
      { medicine_name: { contains: search, mode: 'insensitive' } },
      { medicine_code: { contains: search, mode: 'insensitive' } },
      { generic_name: { contains: search, mode: 'insensitive' } }
    ];
  }
  const medicines = await prisma.medicines.findMany({ where, orderBy: { medicine_name: 'asc' } });
  res.json({ success: true, data: medicines });
}));

router.post('/medicines', asyncHandler(async (req, res) => {
  const data = medicineSchema.parse(req.body);
  const medicine = await prisma.medicines.create({ data });
  res.status(201).json({ success: true, data: medicine });
}));

router.put('/medicines/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = medicineSchema.partial().parse(req.body);
  const medicine = await prisma.medicines.update({ where: { id }, data });
  res.json({ success: true, data: medicine });
}));

// ============================================
// ROOMS (MASTER DATA)
// ============================================

const roomSchema = z.object({
  room_number: z.string().max(20),
  room_name: z.string().max(100),
  room_class: z.string().max(50).optional().nullable(),
  room_type: z.string().max(50).optional().nullable(),
  department_id: z.string().uuid().optional().nullable(),
  capacity: z.number().int().optional().nullable(),
  daily_rate: z.number().optional().nullable(),
  is_active: z.boolean().optional()
});

router.get('/rooms', asyncHandler(async (req, res) => {
  const { search, is_active } = req.query;
  const where = {};
  if (is_active !== undefined) where.is_active = is_active === 'true';
  if (search) {
    where.OR = [
      { room_name: { contains: search, mode: 'insensitive' } },
      { room_number: { contains: search, mode: 'insensitive' } }
    ];
  }
  const rooms = await prisma.rooms.findMany({
    where,
    include: { beds: { select: { id: true, bed_number: true, status: true } } },
    orderBy: { room_number: 'asc' }
  });
  res.json({ success: true, data: rooms });
}));

router.post('/rooms', asyncHandler(async (req, res) => {
  const data = roomSchema.parse(req.body);
  const room = await prisma.rooms.create({ data });
  res.status(201).json({ success: true, data: room });
}));

router.put('/rooms/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = roomSchema.partial().parse(req.body);
  const room = await prisma.rooms.update({ where: { id }, data });
  res.json({ success: true, data: room });
}));

// ============================================================
// RBAC — Menu Access Management
// ============================================================

const ALL_ROLES = [
  'admin','dokter','perawat','farmasi','laboratorium','radiologi',
  'pendaftaran','kasir','keuangan','hrd','manajemen','rekam_medis',
  'gizi','rehabilitasi','bedah','icu','hemodialisa','forensik',
  'procurement','it','guest'
];

const ALL_MENUS = [
  'dashboard','pendaftaran','pasien','antrian','rawat_jalan','igd',
  'rekam_medis','laboratorium','radiologi','farmasi','kasir','bpjs',
  'rawat_inap','kamar_operasi','icu','hemodialisa','bank_darah','gizi',
  'rehabilitasi','mcu','inventory','sdm','akuntansi','laporan',
  'pengaturan','manajemen_user','mutu','telemedicine','smart_display'
];

/**
 * GET /admin/menu-access
 * Returns full permission matrix: { role -> { menu_path -> permissions } }
 */
router.get('/menu-access', asyncHandler(async (req, res) => {
  const rows = await prisma.menu_access.findMany({ orderBy: [{ role: 'asc' }, { menu_path: 'asc' }] });

  // Build matrix structure for frontend
  const matrix = {};
  for (const role of ALL_ROLES) {
    matrix[role] = {};
    for (const menu of ALL_MENUS) {
      matrix[role][menu] = { can_view: false, can_create: false, can_edit: false, can_delete: false, id: null };
    }
  }
  for (const row of rows) {
    if (matrix[row.role] && matrix[row.role][row.menu_path] !== undefined) {
      matrix[row.role][row.menu_path] = {
        id: row.id,
        can_view: row.can_view,
        can_create: row.can_create,
        can_edit: row.can_edit,
        can_delete: row.can_delete
      };
    }
  }

  res.json({ success: true, data: { matrix, roles: ALL_ROLES, menus: ALL_MENUS } });
}));

/**
 * PUT /admin/menu-access
 * Bulk upsert: [{ role, menu_path, can_view, can_create, can_edit, can_delete }]
 */
router.put('/menu-access', asyncHandler(async (req, res) => {
  const updates = z.array(z.object({
    role:       z.string(),
    menu_path:  z.string(),
    can_view:   z.boolean().default(false),
    can_create: z.boolean().default(false),
    can_edit:   z.boolean().default(false),
    can_delete: z.boolean().default(false),
  })).parse(req.body);

  const results = await prisma.$transaction(
    updates.map(u => prisma.menu_access.upsert({
      where:  { role_menu_path: { role: u.role, menu_path: u.menu_path } },
      create: u,
      update: { can_view: u.can_view, can_create: u.can_create, can_edit: u.can_edit, can_delete: u.can_delete }
    }))
  );

  // Invalidate menu-access cache so checkMenuAccess picks up new rules
  const { default: cache } = await import('../services/cache.service.js');
  await cache.delByPattern('menu_access:*');

  res.json({ success: true, message: `${results.length} aturan diperbarui`, data: results });
}));

/**
 * PUT /admin/menu-access/:role/:menu
 * Update single role+menu permission
 */
router.put('/menu-access/:role/:menu', asyncHandler(async (req, res) => {
  const { role, menu } = req.params;
  const { can_view = false, can_create = false, can_edit = false, can_delete = false } = req.body;

  const result = await prisma.menu_access.upsert({
    where:  { role_menu_path: { role, menu_path: menu } },
    create: { role, menu_path: menu, can_view, can_create, can_edit, can_delete },
    update: { can_view, can_create, can_edit, can_delete }
  });

  const { default: cache } = await import('../services/cache.service.js');
  await cache.delByPattern('menu_access:*');

  res.json({ success: true, data: result });
}));

// ============================================================
// BILLING RULES — Rule Engine Management
// ============================================================

/**
 * GET /admin/billing-rules
 */
router.get('/billing-rules', asyncHandler(async (req, res) => {
  const { rule_type, payment_type, is_active } = req.query;
  const where = {
    ...(rule_type    && { rule_type }),
    ...(payment_type && { payment_type }),
    ...(is_active !== undefined && { is_active: is_active === 'true' }),
  };
  const rules = await prisma.billing_rules.findMany({
    where,
    include: { departments: { select: { id: true, department_name: true } } },
    orderBy: [{ rule_type: 'asc' }, { priority: 'asc' }, { rule_name: 'asc' }]
  });
  res.json({ success: true, data: rules });
}));

/**
 * POST /admin/billing-rules
 */
router.post('/billing-rules', asyncHandler(async (req, res) => {
  const schema = z.object({
    rule_name:    z.string().min(3),
    rule_type:    z.enum(['tariff', 'discount', 'tax']),
    payment_type: z.string().optional().nullable(),
    visit_type:   z.string().optional().nullable(),
    department_id:z.string().uuid().optional().nullable(),
    item_type:    z.string().optional().nullable(),
    amount:       z.number().min(0),
    amount_type:  z.enum(['fixed', 'percent']),
    priority:     z.number().int().default(10),
    description:  z.string().optional().nullable(),
  });
  const data = schema.parse(req.body);
  const rule = await prisma.billing_rules.create({ data: { ...data, created_by: req.user.id } });
  res.status(201).json({ success: true, data: rule });
}));

/**
 * PUT /admin/billing-rules/:id
 */
router.put('/billing-rules/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const rule = await prisma.billing_rules.update({
    where: { id },
    data: { ...req.body, updated_at: new Date() }
  });
  res.json({ success: true, data: rule });
}));

/**
 * DELETE /admin/billing-rules/:id  (soft: set is_active = false)
 */
router.delete('/billing-rules/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.billing_rules.update({ where: { id }, data: { is_active: false } });
  res.json({ success: true, message: 'Aturan billing dinonaktifkan' });
}));

// ============================================================
// ACTIVE SESSIONS — Refresh Token Management
// ============================================================

/**
 * GET /admin/users/:userId/sessions
 * List active refresh tokens (sessions) for a user
 */
router.get('/users/:userId/sessions', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const sessions = await prisma.refresh_tokens.findMany({
    where: { user_id: userId, revoked_at: null, expires_at: { gt: new Date() } },
    select: { id: true, created_at: true, expires_at: true, user_agent: true, ip_address: true },
    orderBy: { created_at: 'desc' }
  });
  res.json({ success: true, data: sessions });
}));

/**
 * DELETE /admin/users/:userId/sessions
 * Force logout all sessions for a user
 */
router.delete('/users/:userId/sessions', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { default: auth } = await import('../middleware/auth.middleware.js');
  await auth.revokeAllUserTokens(userId);
  res.json({ success: true, message: 'Semua sesi pengguna telah dicabut' });
}));

// ============================================================
// CIRCUIT BREAKERS — External API Health
// ============================================================

router.get('/circuit-breakers', asyncHandler(async (req, res) => {
  const { getAllBreakerStatus } = await import('../utils/circuit-breaker.js');
  res.json({ success: true, data: getAllBreakerStatus() });
}));

router.post('/circuit-breakers/:name/reset', asyncHandler(async (req, res) => {
  const { bpjsBreaker, satusehatBreaker, icd11Breaker } = await import('../utils/circuit-breaker.js');
  const breakers = { bpjs: bpjsBreaker, satusehat: satusehatBreaker, icd11: icd11Breaker };
  const breaker = breakers[req.params.name];
  if (!breaker) return res.status(404).json({ success: false, error: 'Circuit breaker tidak ditemukan' });
  breaker.reset();
  res.json({ success: true, message: `Circuit breaker '${req.params.name}' direset`, data: breaker.getStatus() });
}));

// ── Manual job triggers ───────────────────────────────────────────────────────

router.post('/jobs/backup', asyncHandler(async (req, res) => {
  const { enqueue } = await import('../utils/queue.js');
  const job = await enqueue('reports', 'db-backup', {}, { priority: 1 });
  res.json({ success: true, message: 'Backup dijadwalkan', jobId: job?.id });
}));

router.post('/jobs/archive', asyncHandler(async (req, res) => {
  const { enqueue } = await import('../utils/queue.js');
  const job = await enqueue('reports', 'archive-old-data', {}, { priority: 2 });
  res.json({ success: true, message: 'Archival dijadwalkan', jobId: job?.id });
}));

export default router;

/**
 * SIMRS ZEN - HR (SDM) Routes
 * Manages employees, attendance, payroll, leave, and training
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { requireRole, ROLES } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();


// ============================================
// EMPLOYEES
// ============================================

/**
 * GET /api/hr/employees
 */
router.get('/employees',
  requireRole([ROLES.HRD, ROLES.MANAJEMEN]),
  asyncHandler(async (req, res) => {
    const { departmentId, status, search, page = 1, limit = 50 } = req.query;

    const where = {};
    if (departmentId) where.department_id = departmentId;
    if (status) where.employment_status = status;
    if (search) {
      where.OR = [
        { full_name: { contains: search, mode: 'insensitive' } },
        { employee_number: { contains: search } },
        { nik: { contains: search } }
      ];
    }

    const [employees, total] = await Promise.all([
      prisma.employees.findMany({
        where,
        include: {
          departments: { select: { id: true, department_name: true } },
          profiles: { select: { email: true, avatar_url: true } }
        },
        orderBy: { full_name: 'asc' },
        skip: (page - 1) * limit,
        take: parseInt(limit)
      }),
      prisma.employees.count({ where })
    ]);

    res.json({ success: true, data: employees, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  })
);

/**
 * POST /api/hr/employees
 */
router.post('/employees',
  requireRole([ROLES.HRD]),
  asyncHandler(async (req, res) => {
    const employee = await prisma.employees.create({
      data: {
        ...req.body,
        created_by: req.user.id
      }
    });

    res.status(201).json({ success: true, data: employee });
  })
);

// ============================================
// ATTENDANCE
// ============================================

/**
 * GET /api/hr/attendance
 */
router.get('/attendance',
  requireRole([ROLES.HRD, ROLES.MANAJEMEN]),
  asyncHandler(async (req, res) => {
    const { employeeId, startDate, endDate, status } = req.query;

    const where = {};
    if (employeeId) where.employee_id = employeeId;
    if (status) where.status = status;
    if (startDate && endDate) {
      where.attendance_date = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: { employees: { select: { full_name: true, employee_number: true } } },
      orderBy: { attendance_date: 'desc' }
    });

    res.json({ success: true, data: attendance });
  })
);

/**
 * POST /api/hr/attendance/checkin
 */
router.post('/attendance/checkin',
  asyncHandler(async (req, res) => {
    const { location } = req.body;

    // Find employee by user
    const employee = await prisma.employees.findFirst({
      where: { user_id: req.user.id }
    });

    if (!employee) throw new ApiError(404, 'Employee tidak ditemukan');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.attendance.findFirst({
      where: { employee_id: employee.id, attendance_date: today }
    });

    if (existing) throw new ApiError(409, 'Sudah check-in hari ini');

    const attendance = await prisma.attendance.create({
      data: {
        employee_id: employee.id,
        attendance_date: today,
        check_in: new Date(),
        location_in: location,
        status: 'PRESENT'
      }
    });

    res.status(201).json({ success: true, data: attendance });
  })
);

/**
 * POST /api/hr/attendance/checkout
 */
router.post('/attendance/checkout',
  asyncHandler(async (req, res) => {
    const { location } = req.body;

    const employee = await prisma.employees.findFirst({
      where: { user_id: req.user.id }
    });

    if (!employee) throw new ApiError(404, 'Employee tidak ditemukan');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findFirst({
      where: { employee_id: employee.id, attendance_date: today }
    });

    if (!attendance) throw new ApiError(404, 'Belum check-in hari ini');
    if (attendance.check_out) throw new ApiError(409, 'Sudah check-out');

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: { check_out: new Date(), location_out: location }
    });

    res.json({ success: true, data: updated });
  })
);

// ============================================
// LEAVE REQUESTS
// ============================================

/**
 * GET /api/hr/leave-requests
 */
router.get('/leave-requests',
  requireRole([ROLES.HRD, ROLES.MANAJEMEN]),
  asyncHandler(async (req, res) => {
    const { status, employeeId } = req.query;

    const where = {};
    if (status) where.status = status;
    if (employeeId) where.employee_id = employeeId;

    const requests = await prisma.leave_requests.findMany({
      where,
      include: { employees: { select: { full_name: true, department_id: true } } },
      orderBy: { created_at: 'desc' }
    });

    res.json({ success: true, data: requests });
  })
);

/**
 * POST /api/hr/leave-requests
 */
router.post('/leave-requests',
  asyncHandler(async (req, res) => {
    const { leaveType, startDate, endDate, reason } = req.body;

    const employee = await prisma.employees.findFirst({
      where: { user_id: req.user.id }
    });

    if (!employee) throw new ApiError(404, 'Employee tidak ditemukan');

    const request = await prisma.leave_requests.create({
      data: {
        employee_id: employee.id,
        leave_type: leaveType,
        start_date: new Date(startDate),
        end_date: new Date(endDate),
        reason,
        status: 'PENDING'
      }
    });

    res.status(201).json({ success: true, data: request });
  })
);

/**
 * PUT /api/hr/leave-requests/:id/approve
 */
router.put('/leave-requests/:id/approve',
  requireRole([ROLES.HRD, ROLES.MANAJEMEN]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { approved, notes } = req.body;

    const request = await prisma.leave_requests.update({
      where: { id },
      data: {
        status: approved ? 'APPROVED' : 'REJECTED',
        approved_by: req.user.id,
        approved_at: new Date(),
        approval_notes: notes
      }
    });

    res.json({ success: true, data: request });
  })
);

// ============================================
// PAYROLL
// ============================================

/**
 * GET /api/hr/payroll
 */
router.get('/payroll',
  requireRole([ROLES.HRD, ROLES.KEUANGAN]),
  asyncHandler(async (req, res) => {
    const { month, year, departmentId } = req.query;

    const where = {};
    if (month && year) {
      where.period_month = parseInt(month);
      where.period_year = parseInt(year);
    }
    if (departmentId) where.employees = { department_id: departmentId };

    const payroll = await prisma.payroll.findMany({
      where,
      include: { employees: { select: { full_name: true, employee_number: true } } },
      orderBy: { employees: { full_name: 'asc' } }
    });

    res.json({ success: true, data: payroll });
  })
);

/**
 * POST /api/hr/payroll/generate
 */
router.post('/payroll/generate',
  requireRole([ROLES.HRD]),
  asyncHandler(async (req, res) => {
    const { month, year, departmentId } = req.body;

    // Get all active employees
    const where = { employment_status: 'ACTIVE' };
    if (departmentId) where.department_id = departmentId;

    const employees = await prisma.employees.findMany({ where });

    const payrollRecords = await Promise.all(
      employees.map(async (emp) => {
        // Calculate based on attendance, overtime, deductions
        const baseSalary = emp.base_salary || 0;
        const allowances = emp.allowances || 0;
        const deductions = 0; // Calculate from attendance
        const netSalary = baseSalary + allowances - deductions;

        return prisma.payroll.upsert({
          where: {
            employee_id_period_month_period_year: {
              employee_id: emp.id,
              period_month: month,
              period_year: year
            }
          },
          create: {
            employee_id: emp.id,
            period_month: month,
            period_year: year,
            base_salary: baseSalary,
            allowances,
            deductions,
            net_salary: netSalary,
            status: 'DRAFT'
          },
          update: {
            base_salary: baseSalary,
            allowances,
            deductions,
            net_salary: netSalary
          }
        });
      })
    );

    res.json({ success: true, data: { generated: payrollRecords.length } });
  })
);

// ============================================
// TRAINING
// ============================================

/**
 * GET /api/hr/trainings
 */
router.get('/trainings',
  requireRole([ROLES.HRD]),
  asyncHandler(async (req, res) => {
    const trainings = await prisma.trainings.findMany({
      include: { _count: { select: { training_participants: true } } },
      orderBy: { start_date: 'desc' }
    });

    res.json({ success: true, data: trainings });
  })
);

/**
 * POST /api/hr/trainings
 */
router.post('/trainings',
  requireRole([ROLES.HRD]),
  asyncHandler(async (req, res) => {
    const training = await prisma.trainings.create({
      data: { ...req.body, created_by: req.user.id }
    });

    res.status(201).json({ success: true, data: training });
  })
);

// ============================================
// DOCTOR SCHEDULES
// ============================================

/**
 * GET /api/hr/schedules
 */
router.get('/schedules', asyncHandler(async (req, res) => {
  const { doctor_id, department_id, day_of_week, is_active } = req.query;

  const where = {};
  if (doctor_id) where.doctor_id = doctor_id;
  if (department_id) where.department_id = department_id;
  if (day_of_week !== undefined) where.day_of_week = parseInt(day_of_week);
  if (is_active !== undefined) where.is_active = is_active === 'true';

  const schedules = await prisma.doctor_schedules.findMany({
    where,
    include: {
      doctor: { select: { id: true, full_name: true, specialization: true } },
      department: { select: { id: true, department_name: true } },
    },
    orderBy: [{ day_of_week: 'asc' }, { start_time: 'asc' }],
  });

  res.json({ success: true, data: schedules });
}));

/**
 * POST /api/hr/schedules
 */
router.post('/schedules', requireRole([ROLES.HRD, ROLES.ADMIN]), asyncHandler(async (req, res) => {
  const schedule = await prisma.doctor_schedules.create({ data: req.body });
  res.status(201).json({ success: true, data: schedule });
}));

/**
 * PUT /api/hr/schedules/:id
 */
router.put('/schedules/:id', requireRole([ROLES.HRD, ROLES.ADMIN]), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schedule = await prisma.doctor_schedules.update({ where: { id }, data: req.body });
  res.json({ success: true, data: schedule });
}));

/**
 * DELETE /api/hr/schedules/:id
 */
router.delete('/schedules/:id', requireRole([ROLES.HRD, ROLES.ADMIN]), asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.doctor_schedules.delete({ where: { id } });
  res.json({ success: true, message: 'Schedule deleted' });
}));

// ============================================
// WORK SHIFTS
// ============================================

/**
 * GET /api/hr/shifts
 */
router.get('/shifts', asyncHandler(async (req, res) => {
  const { department_id, is_active } = req.query;

  const where = {};
  if (department_id) where.department_id = department_id;
  if (is_active !== undefined) where.is_active = is_active === 'true';

  const shifts = await prisma.work_shifts.findMany({
    where,
    include: {
      department: { select: { id: true, department_name: true } },
    },
    orderBy: { shift_code: 'asc' },
  });

  res.json({ success: true, data: shifts });
}));

/**
 * POST /api/hr/shifts
 */
router.post('/shifts', requireRole([ROLES.HRD, ROLES.ADMIN]), asyncHandler(async (req, res) => {
  const shift = await prisma.work_shifts.create({ data: req.body });
  res.status(201).json({ success: true, data: shift });
}));

/**
 * PUT /api/hr/shifts/:id
 */
router.put('/shifts/:id', requireRole([ROLES.HRD, ROLES.ADMIN]), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const shift = await prisma.work_shifts.update({ where: { id }, data: req.body });
  res.json({ success: true, data: shift });
}));

export default router;

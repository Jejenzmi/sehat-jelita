/**
 * SIMRS ZEN - Executive Dashboard Routes
 * KPIs, revenue, visits trend, department stats, payment distribution, bed occupancy
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { requireRole } from '../middleware/role.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { startOfDay, startOfWeek, startOfMonth, subDays } from 'date-fns';

const router = Router();

// Require management/admin role for all executive dashboard routes
router.use(requireRole(['admin', 'manajemen']));

// ============================================
// KPIs
// ============================================

/**
 * GET /api/executive-dashboard/kpis
 * Get key performance indicators
 */
router.get('/kpis', asyncHandler(async (req: Request, res: Response) => {
  const today = startOfDay(new Date());
  const weekStart = startOfWeek(today);
  const monthStart = startOfMonth(today);

  const [
    totalVisitsToday,
    totalVisitsWeek,
    totalVisitsMonth,
    totalPatients,
    activeInpatients,
    bedOccupancyRate,
    revenueToday,
    revenueMonth,
    pendingClaims,
    approvedClaims
  ] = await Promise.all([
    prisma.visits.count({ where: { visit_date: { gte: today } } }),
    prisma.visits.count({ where: { visit_date: { gte: weekStart } } }),
    prisma.visits.count({ where: { visit_date: { gte: monthStart } } }),
    prisma.patients.count({ where: { is_active: true } }),
    prisma.inpatient_admissions.count({ where: { status: 'active' } }),
    prisma.beds.count({ where: { status: 'occupied' } }),
    prisma.billings.aggregate({
      where: { billing_date: { gte: today }, status: 'paid' },
      _sum: { total: true }
    }),
    prisma.billings.aggregate({
      where: { billing_date: { gte: monthStart }, status: 'paid' },
      _sum: { total: true }
    }),
    prisma.bpjs_claims.count({ where: { status: 'submitted' } }),
    prisma.bpjs_claims.count({ where: { status: 'approved' } })
  ]);

  const totalBeds = await prisma.beds.count({ where: { status: { not: 'maintenance' } } });
  const bor = totalBeds > 0 ? ((bedOccupancyRate / totalBeds) * 100).toFixed(1) : '0';

  res.json({
    success: true,
    data: [
      { label: 'Kunjungan Hari Ini', value: totalVisitsToday, change: 5, trend: 'up' },
      { label: 'Kunjungan Minggu Ini', value: totalVisitsWeek, change: 3, trend: 'up' },
      { label: 'Kunjungan Bulan Ini', value: totalVisitsMonth, change: -2, trend: 'down' },
      { label: 'Total Pasien Aktif', value: totalPatients, change: 8, trend: 'up' },
      { label: 'Rawat Inap Aktif', value: activeInpatients, change: 2, trend: 'up' },
      { label: 'BOR (%)', value: parseFloat(bor), change: 1.5, trend: 'up' },
      { label: 'Pendapatan Hari Ini', value: revenueToday._sum.total || 0, change: 10, trend: 'up' },
      { label: 'Pendapatan Bulan Ini', value: revenueMonth._sum.total || 0, change: 7, trend: 'up' },
      { label: 'Klaim BPJS Pending', value: pendingClaims, change: -3, trend: 'down' },
      { label: 'Klaim BPJS Disetujui', value: approvedClaims, change: 5, trend: 'up' }
    ]
  });
}));

// ============================================
// REVENUE
// ============================================

/**
 * GET /api/executive-dashboard/revenue
 * Get revenue trend (last 30 days)
 */
router.get('/revenue', asyncHandler(async (req: Request, res: Response) => {
  const thirtyDaysAgo = subDays(startOfDay(new Date()), 30);

  const revenueByDay = await prisma.billings.groupBy({
    by: ['billing_date'],
    where: { billing_date: { gte: thirtyDaysAgo }, status: 'paid' },
    _sum: { total: true },
    orderBy: { billing_date: 'asc' }
  });

  const data = revenueByDay.map(r => ({
    date: r.billing_date.toISOString().split('T')[0],
    revenue: r._sum.total || 0
  }));

  res.json({ success: true, data });
}));

// ============================================
// VISITS TREND
// ============================================

/**
 * GET /api/executive-dashboard/visits-trend
 * Get visits trend (last 30 days)
 */
router.get('/visits-trend', asyncHandler(async (req: Request, res: Response) => {
  const thirtyDaysAgo = subDays(startOfDay(new Date()), 30);

  const visitsByDay = await prisma.visits.groupBy({
    by: ['visit_date', 'visit_type'],
    where: { visit_date: { gte: thirtyDaysAgo } },
    _count: { id: true }
  });

  // Group by date and type
  const trendMap = new Map<string, { date: string; rawatJalan: number; igd: number; rawatInap: number }>();

  visitsByDay.forEach(v => {
    const date = v.visit_date.toISOString().split('T')[0];
    if (!trendMap.has(date)) {
      trendMap.set(date, { date, rawatJalan: 0, igd: 0, rawatInap: 0 });
    }
    const entry = trendMap.get(date)!;
    if (v.visit_type === 'rawat_jalan') entry.rawatJalan = v._count.id;
    else if (v.visit_type === 'igd') entry.igd = v._count.id;
    else if (v.visit_type === 'rawat_inap') entry.rawatInap = v._count.id;
  });

  const data = Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  res.json({ success: true, data });
}));

// ============================================
// DEPARTMENT STATS
// ============================================

/**
 * GET /api/executive-dashboard/departments
 * Get department statistics
 */
router.get('/departments', asyncHandler(async (req: Request, res: Response) => {
  const departments = await prisma.departments.findMany({
    where: { is_active: true },
    include: {
      _count: {
        select: {
          visits: true,
          inpatient_admissions: true,
          emergency_visits: true
        }
      }
    }
  });

  const data = departments.map(d => ({
    id: d.id,
    name: d.department_name,
    code: d.department_code,
    visits: d._count.visits,
    admissions: d._count.inpatient_admissions,
    emergencies: d._count.emergency_visits
  }));

  res.json({ success: true, data });
}));

// ============================================
// PAYMENT DISTRIBUTION
// ============================================

/**
 * GET /api/executive-dashboard/payment-distribution
 * Get payment type distribution
 */
router.get('/payment-distribution', asyncHandler(async (req: Request, res: Response) => {
  const monthStart = startOfMonth(new Date());

  const paymentByType = await prisma.billings.groupBy({
    by: ['payment_type'],
    where: { billing_date: { gte: monthStart } },
    _count: { id: true },
    _sum: { total: true }
  });

  const data = paymentByType.map(p => ({
    type: p.payment_type,
    count: p._count.id,
    total: p._sum.total || 0
  }));

  res.json({ success: true, data });
}));

// ============================================
// BED OCCUPANCY
// ============================================

/**
 * GET /api/executive-dashboard/bed-occupancy
 * Get bed occupancy by room/department
 */
router.get('/bed-occupancy', asyncHandler(async (req: Request, res: Response) => {
  const rooms = await prisma.rooms.findMany({
    where: { is_active: true },
    include: {
      beds: {
        select: {
          status: true,
          _count: true
        }
      },
      _count: {
        select: { beds: true }
      }
    }
  });

  const data = rooms.map(r => {
    const occupied = r.beds.filter(b => b.status === 'occupied').length;
    const available = r.beds.filter(b => b.status === 'available').length;
    const maintenance = r.beds.filter(b => b.status === 'maintenance').length;
    const total = r._count.beds;
    const bor = total > 0 ? ((occupied / total) * 100).toFixed(1) : '0';

    return {
      id: r.id,
      name: r.room_name || r.room_number,
      type: r.room_type,
      total,
      occupied,
      available,
      maintenance,
      bor: parseFloat(bor)
    };
  });

  res.json({ success: true, data });
}));

export default router;

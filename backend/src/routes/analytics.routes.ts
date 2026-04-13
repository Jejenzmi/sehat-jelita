/**
 * SIMRS ZEN - Analytics & KPI Engine
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { requireRole } from '../middleware/role.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as cache from '../services/cache.service.js';
import { analyticsRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(requireRole(['admin', 'manajemen', 'keuangan', 'it']));
router.use(analyticsRateLimiter);

interface RangeQuery {
  from?: string;
  to?: string;
}

interface RevenueQuery extends RangeQuery {
  group_by?: string;
}

function parseRange(from?: string, to?: string) {
  const start = from ? new Date(from) : (() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; })();
  const end = to ? new Date(to) : new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function daysInRange(start: Date, end: Date) {
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
}

// 1. Hospital KPIs
router.get('/kpi', asyncHandler(async (req: Request<Record<string, string>, any, any, RangeQuery>, res: Response) => {
  const { from, to } = req.query;
  const { start, end } = parseRange(from, to);
  const days = daysInRange(start, end);
  const cacheKey = `analytics:kpi:${start.toISOString().split('T')[0]}:${end.toISOString().split('T')[0]}`;

  const { data } = await cache.cacheAside(cacheKey, async () => {
    const [totalBeds, admissions] = await Promise.all([
      prisma.beds.count({ where: { status: { not: 'maintenance' } } }),
      prisma.inpatient_admissions.findMany({
        where: { admission_date: { gte: start, lte: end } },
        select: { admission_date: true, discharge_date: true }
      }),
    ]);

    // TODO: Add discharge_status field to inpatient_admissions schema to enable death counts
    const deaths48h = 0;
    const deaths = 0;

    const discharged = (admissions as Array<{ admission_date: Date; discharge_date: Date | null }>).filter(a => a.discharge_date);
    const totalPatientDays = (admissions as Array<{ admission_date: Date; discharge_date: Date | null }>).reduce((sum: number, a) => {
      const d = a.discharge_date ? new Date(a.discharge_date) : end;
      return sum + Math.max(1, Math.ceil((d.getTime() - new Date(a.admission_date).getTime()) / 86400000));
    }, 0);

    const BOR = totalBeds ? (totalPatientDays / (totalBeds * days) * 100).toFixed(2) : 0;
    const ALOS = discharged.length
      ? (discharged.reduce((s: number, a) => {
        return s + Math.max(1, Math.ceil((new Date(a.discharge_date!).getTime() - new Date(a.admission_date).getTime()) / 86400000));
      }, 0) / discharged.length).toFixed(2)
      : 0;
    const BTO = totalBeds ? (discharged.length / totalBeds).toFixed(2) : 0;
    const TOI = (discharged.length && totalBeds)
      ? (((totalBeds * days - totalPatientDays) / discharged.length)).toFixed(2)
      : 0;
    const NDR = (admissions as Array<unknown>).length >= 48 ? ((deaths / (admissions as Array<unknown>).length) * 1000).toFixed(2) : 0;
    const GDR = (admissions as Array<unknown>).length ? ((deaths / (admissions as Array<unknown>).length) * 1000).toFixed(2) : 0;

    return {
      period: { from: start, to: end, days },
      beds: { total: totalBeds },
      inpatient: {
        admissions: (admissions as Array<unknown>).length,
        discharges: discharged.length,
        total_patient_days: totalPatientDays,
        deaths,
      },
      kpis: {
        BOR: { value: Number(BOR), label: 'Bed Occupancy Rate', unit: '%', benchmark: '75-85%' },
        ALOS: { value: Number(ALOS), label: 'Avg Length of Stay', unit: 'hari', benchmark: '≤ 6 hari' },
        BTO: { value: Number(BTO), label: 'Bed Turn Over', unit: 'kali', benchmark: '40-50 kali' },
        TOI: { value: Number(TOI), label: 'Turn Over Interval', unit: 'hari', benchmark: '1-3 hari' },
        NDR: { value: Number(NDR), label: 'Net Death Rate', unit: '‰', benchmark: '< 25‰' },
        GDR: { value: Number(GDR), label: 'Gross Death Rate', unit: '‰', benchmark: '< 45‰' },
      }
    };
  }, 5 * 60);

  res.json({ success: true, data });
}));

// 2. Revenue Analytics
router.get('/revenue', asyncHandler(async (req: Request<Record<string, string>, any, any, RevenueQuery>, res: Response) => {
  const { from, to, group_by = 'day' } = req.query;
  const { start, end } = parseRange(from, to);
  const cacheKey = `analytics:revenue:${start.toISOString().split('T')[0]}:${end.toISOString().split('T')[0]}:${group_by}`;

  const { data } = await cache.cacheAside(cacheKey, async () => {
    const [byPaymentType, totals, byDepartment] = await Promise.all([
      prisma.billings.groupBy({
        by: ['payment_type'],
        where: { payment_date: { gte: start, lte: end }, status: 'paid' },
        _sum: { paid_amount: true }, _count: true
      }),
      prisma.billings.aggregate({
        where: { payment_date: { gte: start, lte: end }, status: 'paid' },
        _sum: { paid_amount: true, total: true, discount: true, tax: true },
        _count: true
      }),
      prisma.billings.groupBy({
        by: ['payment_type'],
        where: { billing_date: { gte: start, lte: end } },
        _sum: { total: true }, _count: true
      }),
    ]);

    const dailyTrend = await prisma.$queryRaw`
      SELECT
        DATE(payment_date)          AS date,
        SUM(paid_amount)            AS revenue,
        COUNT(*)                    AS transactions
      FROM billings
      WHERE payment_date BETWEEN ${start} AND ${end}
        AND status = 'paid'
      GROUP BY DATE(payment_date)
      ORDER BY date
    ` as Array<Record<string, unknown>>;

    return {
      period: { from: start, to: end },
      summary: {
        total_revenue: Number((totals as { _sum: { paid_amount: { toNumber: () => number } | null } })._sum.paid_amount?.toNumber() || 0),
        total_billed: Number((totals as { _sum: { total: { toNumber: () => number } | null } })._sum.total?.toNumber() || 0),
        total_discount: Number((totals as { _sum: { discount: { toNumber: () => number } | null } })._sum.discount?.toNumber() || 0),
        total_tax: Number((totals as { _sum: { tax: { toNumber: () => number } | null } })._sum.tax?.toNumber() || 0),
        transaction_count: (totals as { _count: number })._count,
      },
      by_payment_type: (byPaymentType as Array<{ payment_type: string; _sum: { paid_amount: { toNumber: () => number } | null }; _count: number }>).map(r => ({
        type: r.payment_type,
        revenue: Number(r._sum.paid_amount?.toNumber() || 0),
        count: r._count,
      })),
      daily_trend: dailyTrend.map(r => ({
        date: r.date,
        revenue: Number(r.revenue || 0),
        transactions: Number(r.transactions || 0),
      })),
    };
  }, 5 * 60);

  res.json({ success: true, data });
}));

// 3. Patient Flow Analytics
router.get('/patient-flow', asyncHandler(async (req: Request<Record<string, string>, any, any, RangeQuery>, res: Response) => {
  const { from, to } = req.query;
  const { start, end } = parseRange(from, to);
  const cacheKey = `analytics:patientflow:${start.toISOString().split('T')[0]}:${end.toISOString().split('T')[0]}`;

  const { data } = await cache.cacheAside(cacheKey, async () => {
    const [
      newPatients, totalVisits, byVisitType, byPaymentType,
      admissions, emergencies, referralsOut
    ] = await Promise.all([
      prisma.patients.count({ where: { created_at: { gte: start, lte: end }, is_active: true } }),
      prisma.visits.count({ where: { visit_date: { gte: start, lte: end } } }),
      prisma.visits.groupBy({
        by: ['visit_type'],
        where: { visit_date: { gte: start, lte: end } },
        _count: true
      }),
      prisma.visits.groupBy({
        by: ['payment_type'],
        where: { visit_date: { gte: start, lte: end } },
        _count: true
      }),
      prisma.inpatient_admissions.count({ where: { admission_date: { gte: start, lte: end } } }),
      prisma.emergency_visits.count({ where: { arrival_time: { gte: start, lte: end } } }).catch(() => 0),
      prisma.sisrute_referrals.count({ where: { created_at: { gte: start, lte: end } } }).catch(() => 0),
    ]);

    const dailyRegistrations = await prisma.$queryRaw`
      SELECT DATE(created_at) AS date, COUNT(*) AS count
      FROM patients
      WHERE created_at BETWEEN ${start} AND ${end} AND is_active = true
      GROUP BY DATE(created_at)
      ORDER BY date
    ` as Array<Record<string, unknown>>;

    const visitFunnel = {
      registered: newPatients,
      visited: totalVisits,
      admitted: admissions,
      emergency: emergencies,
      referrals_out: referralsOut,
    };

    return {
      period: { from: start, to: end },
      summary: {
        new_patients: newPatients,
        total_visits: totalVisits,
        admissions,
        emergencies,
      },
      by_visit_type: (byVisitType as Array<{ visit_type: string; _count: number }>).map(r => ({ type: r.visit_type, count: r._count })),
      by_payment_type: (byPaymentType as Array<{ payment_type: string; _count: number }>).map(r => ({ type: r.payment_type, count: r._count })),
      daily_registrations: dailyRegistrations.map(r => ({ date: r.date, count: Number(r.count) })),
      funnel: visitFunnel,
    };
  }, 5 * 60);

  res.json({ success: true, data });
}));

// 4. Department Performance
router.get('/department-performance', asyncHandler(async (req: Request<Record<string, string>, any, any, RangeQuery>, res: Response) => {
  const { from, to } = req.query;
  const { start, end } = parseRange(from, to);
  const cacheKey = `analytics:deptperf:${start.toISOString().split('T')[0]}:${end.toISOString().split('T')[0]}`;

  const { data } = await cache.cacheAside(cacheKey, async () => {
    const [visitsByDept, departments] = await Promise.all([
      prisma.visits.groupBy({
        by: ['department_id'],
        where: { visit_date: { gte: start, lte: end }, department_id: { not: null } },
        _count: true
      }),
      prisma.departments.findMany({
        select: { id: true, department_name: true, department_type: true }
      })
    ]);

    const deptMap = Object.fromEntries((departments as Array<{ id: string; department_name: string; department_type: string }>).map(d => [d.id, d]));

    const performance = (visitsByDept as Array<{ department_id: string; _count: number }>)
      .map(r => ({
        department_id: r.department_id,
        department_name: (deptMap as Record<string, { department_name: string }>)[r.department_id]?.department_name || 'Unknown',
        department_type: (deptMap as Record<string, { department_type: string }>)[r.department_id]?.department_type || '-',
        visit_count: r._count,
      }))
      .sort((a, b) => b.visit_count - a.visit_count);

    return {
      period: { from: start, to: end },
      departments: performance,
      top_3: performance.slice(0, 3),
    };
  }, 5 * 60);

  res.json({ success: true, data });
}));

// 5. Lab Analytics
router.get('/lab', asyncHandler(async (req: Request<Record<string, string>, any, any, RangeQuery>, res: Response) => {
  const { from, to } = req.query;
  const { start, end } = parseRange(from, to);
  const cacheKey = `analytics:lab:${start.toISOString().split('T')[0]}:${end.toISOString().split('T')[0]}`;

  const { data } = await cache.cacheAside(cacheKey, async () => {
    const [totalOrders, byStatus, criticalCount, testVolume] = await Promise.all([
      prisma.lab_orders.count({ where: { created_at: { gte: start, lte: end } } }),
      prisma.lab_orders.groupBy({
        by: ['status'],
        where: { created_at: { gte: start, lte: end } },
        _count: true
      }),
      prisma.lab_results.count({
        where: {
          result_date: { gte: start, lte: end },
          critical_alerted: true
        }
      }).catch(() => 0),
      prisma.lab_results.groupBy({
        by: ['test_code'],
        where: { result_date: { gte: start, lte: end } },
        _count: true,
        orderBy: { _count: { test_code: 'desc' } },
      }).catch(() => []),
    ]);

    // TODO: Add lab_order_items model to Prisma schema to re-enable TAT calculation
    // const tat = await prisma.$queryRaw`
    //   SELECT
    //     AVG(EXTRACT(EPOCH FROM (lr.result_date - lo.created_at)) / 3600)::NUMERIC(10,2) AS avg_tat_hours,
    //     MIN(EXTRACT(EPOCH FROM (lr.result_date - lo.created_at)) / 3600)::NUMERIC(10,2) AS min_tat_hours,
    //     MAX(EXTRACT(EPOCH FROM (lr.result_date - lo.created_at)) / 3600)::NUMERIC(10,2) AS max_tat_hours
    //   FROM lab_results lr
    //   JOIN lab_order_items loi ON loi.id = lr.lab_order_item_id
    //   JOIN lab_orders lo ON lo.id = loi.lab_order_id
    //   WHERE lr.result_date BETWEEN ${start} AND ${end}
    // `.catch(() => [{ avg_tat_hours: 0, min_tat_hours: 0, max_tat_hours: 0 }]) as Array<Record<string, unknown>>;
    const tat = [{ avg_tat_hours: 0, min_tat_hours: 0, max_tat_hours: 0 }] as Array<Record<string, unknown>>;

    const verified = (byStatus as Array<{ status: string; _count: number }>).find(s => s.status === 'verified')?._count || 0;
    const criticalRate = totalOrders ? ((criticalCount / totalOrders) * 100).toFixed(2) : '0';

    return {
      period: { from: start, to: end },
      summary: {
        total_orders: totalOrders,
        verified,
        critical_alerts: criticalCount,
        critical_rate: parseFloat(criticalRate),
      },
      tat: {
        avg_hours: Number((tat as Array<Record<string, unknown>>)[0]?.avg_tat_hours) || 0,
        min_hours: Number((tat as Array<Record<string, unknown>>)[0]?.min_tat_hours) || 0,
        max_hours: Number((tat as Array<Record<string, unknown>>)[0]?.max_tat_hours) || 0,
      },
      by_status: (byStatus as Array<{ status: string; _count: number }>).map(r => ({ status: r.status, count: r._count })),
      top_tests: (testVolume as Array<{ test_code: string; _count: number }>).slice(0, 10).map(r => ({ test_code: r.test_code, count: r._count })),
    };
  }, 5 * 60);

  res.json({ success: true, data });
}));

// 6. Pharmacy Analytics
router.get('/pharmacy', asyncHandler(async (req: Request<Record<string, string>, any, any, RangeQuery>, res: Response) => {
  const { from, to } = req.query;
  const { start, end } = parseRange(from, to);
  const cacheKey = `analytics:pharmacy:${start.toISOString().split('T')[0]}:${end.toISOString().split('T')[0]}`;

  const { data } = await cache.cacheAside(cacheKey, async () => {
    const [rxStats, byStatus, topMeds, lowStock] = await Promise.all([
      prisma.prescriptions.aggregate({
        where: { created_at: { gte: start, lte: end } },
        _count: true
      }),
      prisma.prescriptions.groupBy({
        by: ['status'],
        where: { created_at: { gte: start, lte: end } },
        _count: true
      }),
      prisma.prescription_items.groupBy({
        by: ['medicine_id'],
        where: { prescriptions: { created_at: { gte: start, lte: end } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
      }).catch(() => []),
      prisma.$queryRaw`
        SELECT medicine_id, SUM(quantity) as total_qty
        FROM medicine_batches
        WHERE is_active = true
        GROUP BY medicine_id
        HAVING SUM(quantity) < 10
      `.catch(() => []) as Promise<Array<{ medicine_id: string; total_qty: number }>>,
    ]);

    const dispensed = (byStatus as Array<{ status: string; _count: number }>).find(s => s.status === 'dispensed')?._count || 0;
    const dispRate = (rxStats as { _count: number })._count ? ((dispensed / (rxStats as { _count: number })._count) * 100).toFixed(1) : '0';

    const medicineIds = (topMeds as Array<{ medicine_id: string; _sum: { quantity: number | null } }>).slice(0, 10).map(m => m.medicine_id).filter(Boolean);
    const medicines = medicineIds.length
      ? await prisma.medicines.findMany({ where: { id: { in: medicineIds } }, select: { id: true, medicine_name: true } })
      : [];
    const medMap = Object.fromEntries(medicines.map(m => [m.id, m.medicine_name]));

    return {
      period: { from: start, to: end },
      summary: {
        total_prescriptions: (rxStats as { _count: number })._count,
        dispensed,
        dispensing_rate: parseFloat(dispRate),
        low_stock_medicines: (lowStock as Array<{ medicine_id: string; total_qty: number }>).length,
      },
      by_status: (byStatus as Array<{ status: string; _count: number }>).map(r => ({ status: r.status, count: r._count })),
      top_medicines: (topMeds as Array<{ medicine_id: string; _sum: { quantity: { toNumber: () => number } | null } }>).slice(0, 10).map(r => ({
        medicine_id: r.medicine_id,
        medicine_name: (medMap as Record<string, string>)[r.medicine_id] || 'Unknown',
        total_qty: Number(r._sum.quantity?.toNumber() || 0),
      })),
    };
  }, 5 * 60);

  res.json({ success: true, data });
}));

// 7. Executive Dashboard Summary
router.get('/executive', asyncHandler(async (req: Request, res: Response) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const cacheKey = `analytics:executive:${today.toISOString().split('T')[0]}`;

  const { data } = await cache.cacheAside(cacheKey, async () => {
    const [
      todayVisits, todayRevenue, todayAdmissions,
      mtdRevenue, mtdVisits, activeInpatients,
      pendingLab, pendingPharmacy,
      beds,
    ] = await Promise.all([
      prisma.visits.count({ where: { visit_date: { gte: today } } }),
      prisma.billings.aggregate({
        where: { payment_date: { gte: today }, status: 'paid' },
        _sum: { paid_amount: true }
      }),
      prisma.inpatient_admissions.count({ where: { admission_date: { gte: today } } }),
      prisma.billings.aggregate({
        where: { payment_date: { gte: monthStart }, status: 'paid' },
        _sum: { paid_amount: true }
      }),
      prisma.visits.count({ where: { visit_date: { gte: monthStart } } }),
      prisma.inpatient_admissions.count({ where: { discharge_date: null } }),
      prisma.lab_orders.count({ where: { status: { in: ['pending', 'processing'] } } }),
      prisma.prescriptions.count({ where: { status: { in: ['pending', 'verified'] } } }),
      prisma.beds.groupBy({ by: ['status'], _count: true }),
    ]);

    const bedMap = Object.fromEntries((beds as Array<{ status: string; _count: number }>).map(b => [b.status, b._count]));
    const totalBeds = Object.values(bedMap as Record<string, number>).reduce((s: number, v) => s + v, 0);
    const occupiedBeds = (bedMap as Record<string, number>).occupied || 0;

    return {
      as_of: new Date().toISOString(),
      today: {
        visits: todayVisits,
        revenue: Number((todayRevenue as { _sum: { paid_amount: { toNumber: () => number } | null } })._sum.paid_amount?.toNumber() || 0),
        admissions: todayAdmissions,
      },
      mtd: {
        revenue: Number((mtdRevenue as { _sum: { paid_amount: { toNumber: () => number } | null } })._sum.paid_amount?.toNumber() || 0),
        visits: mtdVisits,
      },
      realtime: {
        active_inpatients: activeInpatients,
        bed_occupancy_pct: totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
        beds: { total: totalBeds, occupied: occupiedBeds, available: (bedMap as Record<string, number>).available || 0 },
        pending_lab: pendingLab,
        pending_pharmacy: pendingPharmacy,
      }
    };
  }, 60);

  res.json({ success: true, data });
}));

// 8. Snapshots
router.get('/snapshots', asyncHandler(async (req: Request<Record<string, string>, any, any, { type?: string; limit?: string }>, res: Response) => {
  const { type = 'daily_kpi', limit = 30 } = req.query;

  const snapshots = await prisma.analytics_snapshots.findMany({
    where: { snapshot_type: type },
    orderBy: { snapshot_date: 'desc' },
    take: parseInt(limit)
  });

  res.json({ success: true, data: snapshots });
}));

router.get('/scheduled-reports', asyncHandler(async (req: Request<Record<string, string>, any, any, { type?: string; period?: string; limit?: string }>, res: Response) => {
  const { type, period, limit = 20 } = req.query;
  const reports = await prisma.scheduled_reports.findMany({
    where: {
      ...(type && { report_type: type }),
      ...(period && { report_period: period }),
    },
    orderBy: { created_at: 'desc' },
    take: parseInt(limit)
  });
  res.json({ success: true, data: reports });
}));

export default router;

/**
 * SIMRS ZEN - Analytics & KPI Engine
 *
 * Provides real-time and pre-computed KPIs for:
 *   - Hospital-level metrics (BOR, ALOS, BTO, TOI, NDR, GDR)
 *   - Revenue analytics (daily, monthly, by payment type / department)
 *   - Patient flow (registrations, visit trends, admission funnel)
 *   - Department performance (visits, avg wait, throughput)
 *   - Lab analytics (TAT, critical value rate)
 *   - Pharmacy analytics (dispensing rate, top medicines)
 */

import { Router } from 'express';
import { prisma } from '../config/database.js';
import { requireRole } from '../middleware/role.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as cache from '../services/cache.service.js';
import { analyticsRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// All analytics endpoints require at least manajemen role + rate limit (heavy queries)
router.use(requireRole(['admin', 'manajemen', 'keuangan', 'it']));
router.use(analyticsRateLimiter);

// ── Date helpers ──────────────────────────────────────────────────────────────

function parseRange(from, to) {
  const start = from ? new Date(from) : (() => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d; })();
  const end   = to   ? new Date(to)   : new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function daysInRange(start, end) {
  return Math.max(1, Math.ceil((end - start) / 86400000));
}

// ── 1. Hospital KPIs ─────────────────────────────────────────────────────────

/**
 * GET /api/analytics/kpi
 * Core hospital KPIs: BOR, ALOS, BTO, TOI, NDR, GDR
 */
router.get('/kpi', asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const { start, end } = parseRange(from, to);
  const days = daysInRange(start, end);
  const cacheKey = `analytics:kpi:${start.toISOString().split('T')[0]}:${end.toISOString().split('T')[0]}`;

  const { data } = await cache.cacheAside(cacheKey, async () => {
    const [totalBeds, admissions, deaths48h, deaths] = await Promise.all([
      prisma.beds.count({ where: { status: { not: 'maintenance' } } }),
      prisma.inpatient_admissions.findMany({
        where: { admission_date: { gte: start, lte: end } },
        select: { admission_date: true, discharge_date: true, discharge_status: true }
      }),
      prisma.inpatient_admissions.count({
        where: {
          admission_date: { gte: start, lte: end },
          discharge_status: 'meninggal',
          // < 48 hours (GDR includes all deaths, NDR excludes early deaths)
        }
      }).catch(() => 0),
      prisma.inpatient_admissions.count({
        where: { discharge_date: { gte: start, lte: end }, discharge_status: 'meninggal' }
      }).catch(() => 0),
    ]);

    const discharged = admissions.filter(a => a.discharge_date);
    const totalPatientDays = admissions.reduce((sum, a) => {
      const d = a.discharge_date ? new Date(a.discharge_date) : end;
      return sum + Math.max(1, Math.ceil((d - new Date(a.admission_date)) / 86400000));
    }, 0);

    const BOR = totalBeds ? (totalPatientDays / (totalBeds * days) * 100).toFixed(2) : 0;
    const ALOS = discharged.length
      ? (discharged.reduce((s, a) => {
          return s + Math.max(1, Math.ceil((new Date(a.discharge_date) - new Date(a.admission_date)) / 86400000));
        }, 0) / discharged.length).toFixed(2)
      : 0;
    const BTO  = totalBeds ? (discharged.length / totalBeds).toFixed(2) : 0;
    const TOI  = (discharged.length && totalBeds)
      ? (((totalBeds * days - totalPatientDays) / discharged.length)).toFixed(2)
      : 0;
    const NDR  = admissions.length >= 48 ? ((deaths / admissions.length) * 1000).toFixed(2) : 0;
    const GDR  = admissions.length ? ((deaths / admissions.length) * 1000).toFixed(2) : 0;

    return {
      period: { from: start, to: end, days },
      beds:   { total: totalBeds },
      inpatient: {
        admissions:         admissions.length,
        discharges:         discharged.length,
        total_patient_days: totalPatientDays,
        deaths,
      },
      kpis: {
        BOR:  { value: parseFloat(BOR),  label: 'Bed Occupancy Rate', unit: '%',   benchmark: '75-85%' },
        ALOS: { value: parseFloat(ALOS), label: 'Avg Length of Stay',  unit: 'hari', benchmark: '≤ 6 hari' },
        BTO:  { value: parseFloat(BTO),  label: 'Bed Turn Over',       unit: 'kali', benchmark: '40-50 kali' },
        TOI:  { value: parseFloat(TOI),  label: 'Turn Over Interval',  unit: 'hari', benchmark: '1-3 hari' },
        NDR:  { value: parseFloat(NDR),  label: 'Net Death Rate',      unit: '‰',    benchmark: '< 25‰' },
        GDR:  { value: parseFloat(GDR),  label: 'Gross Death Rate',    unit: '‰',    benchmark: '< 45‰' },
      }
    };
  }, 5 * 60); // cache 5 min

  res.json({ success: true, data });
}));

// ── 2. Revenue Analytics ─────────────────────────────────────────────────────

/**
 * GET /api/analytics/revenue
 * Revenue breakdown by period, payment type, department
 */
router.get('/revenue', asyncHandler(async (req, res) => {
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

    // Daily trend using raw query for flexibility
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
    `;

    return {
      period:   { from: start, to: end },
      summary: {
        total_revenue:     Number(totals._sum.paid_amount || 0),
        total_billed:      Number(totals._sum.total || 0),
        total_discount:    Number(totals._sum.discount || 0),
        total_tax:         Number(totals._sum.tax || 0),
        transaction_count: totals._count,
      },
      by_payment_type: byPaymentType.map(r => ({
        type:       r.payment_type,
        revenue:    Number(r._sum.paid_amount || 0),
        count:      r._count,
      })),
      daily_trend: dailyTrend.map(r => ({
        date:         r.date,
        revenue:      Number(r.revenue || 0),
        transactions: Number(r.transactions || 0),
      })),
    };
  }, 5 * 60);

  res.json({ success: true, data });
}));

// ── 3. Patient Flow Analytics ─────────────────────────────────────────────────

/**
 * GET /api/analytics/patient-flow
 * Registration trend, visit funnel, admission rates
 */
router.get('/patient-flow', asyncHandler(async (req, res) => {
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
    `;

    const visitFunnel = {
      registered:    newPatients,
      visited:       totalVisits,
      admitted:      admissions,
      emergency:     emergencies,
      referrals_out: referralsOut,
    };

    return {
      period: { from: start, to: end },
      summary: {
        new_patients:  newPatients,
        total_visits:  totalVisits,
        admissions,
        emergencies,
      },
      by_visit_type:    byVisitType.map(r => ({ type: r.visit_type, count: r._count })),
      by_payment_type:  byPaymentType.map(r => ({ type: r.payment_type, count: r._count })),
      daily_registrations: dailyRegistrations.map(r => ({ date: r.date, count: Number(r.count) })),
      funnel: visitFunnel,
    };
  }, 5 * 60);

  res.json({ success: true, data });
}));

// ── 4. Department Performance ─────────────────────────────────────────────────

/**
 * GET /api/analytics/department-performance
 * Visits, throughput, revenue per department
 */
router.get('/department-performance', asyncHandler(async (req, res) => {
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

    const deptMap = Object.fromEntries(departments.map(d => [d.id, d]));

    const performance = visitsByDept
      .map(r => ({
        department_id:   r.department_id,
        department_name: deptMap[r.department_id]?.department_name || 'Unknown',
        department_type: deptMap[r.department_id]?.department_type || '-',
        visit_count:     r._count,
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

// ── 5. Lab Analytics ─────────────────────────────────────────────────────────

/**
 * GET /api/analytics/lab
 * Turnaround time, test volume, critical value rate
 */
router.get('/lab', asyncHandler(async (req, res) => {
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

    // TAT: average hours from order to result
    const tat = await prisma.$queryRaw`
      SELECT
        AVG(EXTRACT(EPOCH FROM (lr.result_date - lo.created_at)) / 3600)::NUMERIC(10,2) AS avg_tat_hours,
        MIN(EXTRACT(EPOCH FROM (lr.result_date - lo.created_at)) / 3600)::NUMERIC(10,2) AS min_tat_hours,
        MAX(EXTRACT(EPOCH FROM (lr.result_date - lo.created_at)) / 3600)::NUMERIC(10,2) AS max_tat_hours
      FROM lab_results lr
      JOIN lab_order_items loi ON loi.id = lr.lab_order_item_id
      JOIN lab_orders lo ON lo.id = loi.lab_order_id
      WHERE lr.result_date BETWEEN ${start} AND ${end}
    `.catch(() => [{ avg_tat_hours: 0, min_tat_hours: 0, max_tat_hours: 0 }]);

    const verified = byStatus.find(s => s.status === 'verified')?._count || 0;
    const criticalRate = totalOrders ? ((criticalCount / totalOrders) * 100).toFixed(2) : 0;

    return {
      period: { from: start, to: end },
      summary: {
        total_orders:   totalOrders,
        verified,
        critical_alerts: criticalCount,
        critical_rate:  parseFloat(criticalRate),
      },
      tat: {
        avg_hours: parseFloat(tat[0]?.avg_tat_hours || 0),
        min_hours: parseFloat(tat[0]?.min_tat_hours || 0),
        max_hours: parseFloat(tat[0]?.max_tat_hours || 0),
      },
      by_status:    byStatus.map(r => ({ status: r.status, count: r._count })),
      top_tests:    testVolume.slice(0, 10).map(r => ({ test_code: r.test_code, count: r._count })),
    };
  }, 5 * 60);

  res.json({ success: true, data });
}));

// ── 6. Pharmacy Analytics ─────────────────────────────────────────────────────

/**
 * GET /api/analytics/pharmacy
 * Dispensing rates, top medicines, stock alerts
 */
router.get('/pharmacy', asyncHandler(async (req, res) => {
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
      prisma.medicine_batches.groupBy({
        by: ['medicine_id'],
        where: { is_active: true },
        _sum: { quantity: true },
        having: { quantity: { _sum: { lt: 10 } } },
      }).catch(() => []),
    ]);

    const dispensed  = byStatus.find(s => s.status === 'dispensed')?._count || 0;
    const dispRate   = rxStats._count ? ((dispensed / rxStats._count) * 100).toFixed(1) : 0;

    // Get medicine names for top meds
    const medicineIds = topMeds.slice(0, 10).map(m => m.medicine_id).filter(Boolean);
    const medicines   = medicineIds.length
      ? await prisma.medicines.findMany({ where: { id: { in: medicineIds } }, select: { id: true, name: true } })
      : [];
    const medMap = Object.fromEntries(medicines.map(m => [m.id, m.name]));

    return {
      period: { from: start, to: end },
      summary: {
        total_prescriptions:  rxStats._count,
        dispensed,
        dispensing_rate:      parseFloat(dispRate),
        low_stock_medicines:  lowStock.length,
      },
      by_status:   byStatus.map(r => ({ status: r.status, count: r._count })),
      top_medicines: topMeds.slice(0, 10).map(r => ({
        medicine_id:   r.medicine_id,
        medicine_name: medMap[r.medicine_id] || 'Unknown',
        total_qty:     Number(r._sum.quantity || 0),
      })),
    };
  }, 5 * 60);

  res.json({ success: true, data });
}));

// ── 7. Executive Dashboard Summary ───────────────────────────────────────────

/**
 * GET /api/analytics/executive
 * All-in-one summary for the executive dashboard (today + MTD)
 */
router.get('/executive', asyncHandler(async (req, res) => {
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

    const bedMap = Object.fromEntries(beds.map(b => [b.status, b._count]));
    const totalBeds    = Object.values(bedMap).reduce((s, v) => s + v, 0);
    const occupiedBeds = bedMap.occupied || 0;

    return {
      as_of: new Date().toISOString(),
      today: {
        visits:      todayVisits,
        revenue:     Number(todayRevenue._sum.paid_amount || 0),
        admissions:  todayAdmissions,
      },
      mtd: {
        revenue: Number(mtdRevenue._sum.paid_amount || 0),
        visits:  mtdVisits,
      },
      realtime: {
        active_inpatients: activeInpatients,
        bed_occupancy_pct: totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
        beds: { total: totalBeds, occupied: occupiedBeds, available: bedMap.available || 0 },
        pending_lab:      pendingLab,
        pending_pharmacy: pendingPharmacy,
      }
    };
  }, 60); // short cache: 1 min (near real-time)

  res.json({ success: true, data });
}));

// ── 8. Snapshots (pre-computed history) ──────────────────────────────────────

/**
 * GET /api/analytics/snapshots
 * Historical KPI snapshots stored by scheduler
 */
router.get('/snapshots', asyncHandler(async (req, res) => {
  const { type = 'daily_kpi', limit = 30 } = req.query;

  const snapshots = await prisma.analytics_snapshots.findMany({
    where: { snapshot_type: type },
    orderBy: { snapshot_date: 'desc' },
    take: parseInt(limit)
  });

  res.json({ success: true, data: snapshots });
}));

/**
 * GET /api/analytics/scheduled-reports
 * List generated scheduled reports
 */
router.get('/scheduled-reports', asyncHandler(async (req, res) => {
  const { type, period, limit = 20 } = req.query;
  const reports = await prisma.scheduled_reports.findMany({
    where: {
      ...(type   && { report_type:   type }),
      ...(period && { report_period: period }),
    },
    orderBy: { created_at: 'desc' },
    take: parseInt(limit)
  });
  res.json({ success: true, data: reports });
}));

export default router;

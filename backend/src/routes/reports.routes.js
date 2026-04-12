/**
 * SIMRS ZEN - RL Reports Routes
 * Laporan Rumah Sakit (RL 1-6) ke Kemenkes RI
 * Semua data dihitung dari tabel operasional existing
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { reportRateLimiter } from '../middleware/rateLimiter.js';
import { prisma } from '../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();
// All RL reports contain sensitive hospital data — require authentication
router.use(authenticateToken);
// Only admin & pelaporan roles can access report data
router.use(requireRole(['admin', 'pelaporan', 'direktur']));
// Heavy aggregate queries — limit to 5 per hour per user
router.use(reportRateLimiter);

// ─── Helper ───────────────────────────────────────────────────────────────────

function periodWhere(month, year) {
  if (!month || !year) return {};
  const start = new Date(parseInt(year), parseInt(month) - 1, 1);
  const end   = new Date(parseInt(year), parseInt(month), 1);
  return { gte: start, lt: end };
}

// ─── RL1 — Data Dasar RS ──────────────────────────────────────────────────────

router.get('/rl1', asyncHandler(async (_req, res) => {
  const [profileSetting, hpProfile, totalDoctors, totalNurses, totalBeds, totalRooms] = await Promise.all([
    prisma.system_settings.findUnique({ where: { setting_key: 'hospital_info' } }),
    prisma.system_settings.findUnique({ where: { setting_key: 'hospital_profile' } }).catch(() => null),
    prisma.doctors.count({ where: { is_active: true } }),
    prisma.employees.count({ where: { employment_type: 'aktif', position: { contains: 'perawat', mode: 'insensitive' } } }).catch(() => 0),
    prisma.beds.count(),
    prisma.rooms.count({ where: { is_active: true } }),
  ]);

  const info = profileSetting?.setting_value ? JSON.parse(JSON.stringify(profileSetting.setting_value)) : {};
  const hp   = hpProfile?.setting_value     ? JSON.parse(JSON.stringify(hpProfile.setting_value))     : {};

  res.json({
    success: true,
    data: {
      hospital_name:         info.name              || hp.name              || '-',
      hospital_code:         info.code              || hp.hospital_code     || '-',
      hospital_address:      info.address           || hp.address           || '-',
      hospital_phone:        info.phone             || hp.phone             || '-',
      hospital_email:        info.email             || hp.email             || '-',
      director_name:         info.director          || hp.director          || '-',
      hospital_type:         hp.hospital_type       || info.type            || '-',
      accreditation_status:  hp.accreditation       || info.accreditation   || '-',
      bed_count_total:       totalBeds,
      is_teaching_hospital:  hp.is_teaching_hospital || false,
      total_doctors:         totalDoctors,
      total_nurses:          totalNurses,
      total_rooms:           totalRooms,
    },
  });
}));

// ─── RL2 — Data Ketenagaan ────────────────────────────────────────────────────

router.get('/rl2', asyncHandler(async (_req, res) => {
  const [doctors, employees] = await Promise.all([
    prisma.doctors.groupBy({ by: ['specialization'], _count: { id: true }, where: { is_active: true } }),
    prisma.employees.groupBy({ by: ['position'], _count: { id: true }, where: { employment_type: 'aktif' } }),
  ]);

  res.json({
    success: true,
    data: {
      by_specialization: doctors.map(d => ({ specialization: d.specialization || 'Umum', count: d._count.id })),
      by_position:      employees.map(e => ({ position: e.position || '-', count: e._count.id })),
      total_doctors:     doctors.reduce((s, d) => s + d._count.id, 0),
      total_employees:   employees.reduce((s, e) => s + e._count.id, 0),
    },
  });
}));

// ─── RL3 — Kegiatan Pelayanan ─────────────────────────────────────────────────

router.get('/rl3', asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const dateRange = periodWhere(month, year);
  const visitWhere = Object.keys(dateRange).length ? { visit_date: dateRange } : {};

  const [
    totalOutpatient,
    totalInpatient,
    totalEmergency,
    totalSurgeries,
    totalLabOrders,
    totalRadiology,
    byDepartment,
  ] = await Promise.all([
    prisma.visits.count({ where: { ...visitWhere, visit_type: 'outpatient' } }),
    prisma.visits.count({ where: { ...visitWhere, visit_type: 'inpatient' } }),
    prisma.emergency_visits.count({ where: Object.keys(dateRange).length ? { arrival_time: dateRange } : {} }),
    prisma.surgeries.count({ where: Object.keys(dateRange).length ? { scheduled_date: dateRange } : {} }),
    prisma.lab_orders.count({ where: Object.keys(dateRange).length ? { order_date: dateRange } : {} }),
    prisma.radiology_orders.count({ where: Object.keys(dateRange).length ? { created_at: dateRange } : {} }),
    prisma.visits.groupBy({
      by: ['department_id'],
      _count: { id: true },
      where: visitWhere,
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
  ]);

  // Enrich department names
  const deptIds = byDepartment.map(d => d.department_id).filter(Boolean);
  const depts = deptIds.length > 0
    ? await prisma.departments.findMany({ where: { id: { in: deptIds } }, select: { id: true, department_name: true } })
    : [];
  const deptMap = Object.fromEntries(depts.map(d => [d.id, d.department_name]));

  res.json({
    success: true,
    data: {
      total_outpatient:  totalOutpatient,
      total_inpatient:   totalInpatient,
      total_emergency:   totalEmergency,
      total_surgeries:   totalSurgeries,
      total_lab_orders:  totalLabOrders,
      total_radiology:   totalRadiology,
      by_department:     byDepartment.map(d => ({
        department_id:   d.department_id,
        department_name: deptMap[d.department_id] || 'Unknown',
        total_visits:    d._count.id,
      })),
    },
  });
}));

// ─── RL4 — Morbiditas & Mortalitas ────────────────────────────────────────────

router.get('/rl4', asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const dateRange = periodWhere(month, year);
  const diagWhere = Object.keys(dateRange).length ? { created_at: dateRange } : {};

  const [topDiagnoses, totalMortality] = await Promise.all([
    prisma.diagnoses.groupBy({
      by: ['icd11_code', 'icd11_title_id', 'icd10_code'],
      _count: { id: true },
      where: { ...diagWhere, icd11_code: { not: null } },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    }),
    // Proxy mortality via visit discharge summaries containing "meninggal"
    prisma.visits.count({
      where: {
        ...(Object.keys(dateRange).length ? { discharge_date: dateRange } : {}),
        discharge_summary: { contains: 'meninggal', mode: 'insensitive' },
      },
    }),
  ]);

  res.json({
    success: true,
    data: {
      top_diagnoses: topDiagnoses.map(d => ({
        icd11_code:  d.icd11_code,
        icd10_code:  d.icd10_code,
        diagnosis:   d.icd11_title_id || d.icd11_code,
        case_count:  d._count.id,
      })),
      total_mortality: totalMortality,
    },
  });
}));

// ─── RL5 — Pengunjung & Kunjungan ─────────────────────────────────────────────

router.get('/rl5', asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const dateRange = periodWhere(month, year);
  const visitWhere = Object.keys(dateRange).length ? { visit_date: dateRange } : {};

  const [byPaymentType, newPatients, returnPatients] = await Promise.all([
    prisma.visits.groupBy({
      by: ['payment_type'],
      _count: { id: true },
      where: visitWhere,
    }),
    // New patients — first visit ever
    prisma.patients.count({
      where: Object.keys(dateRange).length ? { created_at: dateRange } : {},
    }),
    prisma.visits.count({ where: visitWhere }),
  ]);

  res.json({
    success: true,
    data: {
      by_payment_type: byPaymentType.map(p => ({
        payment_type: p.payment_type || 'unknown',
        count: p._count.id,
      })),
      new_patients:    newPatients,
      total_visits:    returnPatients,
    },
  });
}));

// ─── RL6 — Indikator Pelayanan (BOR, ALOS, BTO, TOI, NDR, GDR) ───────────────

router.get('/rl6', asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const dateRange = periodWhere(month, year);

  const y = parseInt(year) || new Date().getFullYear();
  const m = parseInt(month) || new Date().getMonth() + 1;
  const daysInMonth = new Date(y, m, 0).getDate();

  const admWhere = Object.keys(dateRange).length ? { admission_date: dateRange } : {};

  const [totalBeds, admissions, discharges] = await Promise.all([
    prisma.beds.count(),
    prisma.inpatient_admissions.count({ where: admWhere }),
    prisma.inpatient_admissions.findMany({
      where: { ...admWhere, discharge_date: { not: null } },
      select: { admission_date: true, discharge_date: true },
    }),
  ]);

  const totalLOS = discharges.reduce((sum, a) => {
    if (!a.discharge_date) return sum;
    const los = Math.max(1, Math.ceil((new Date(a.discharge_date) - new Date(a.admission_date)) / 86400000));
    return sum + los;
  }, 0);

  const avgCensus = totalBeds > 0 ? (totalLOS / daysInMonth) : 0;
  const bor  = totalBeds > 0 ? ((avgCensus / totalBeds) * 100).toFixed(1) : 0;
  const alos = discharges.length > 0 ? (totalLOS / discharges.length).toFixed(1) : 0;
  const bto  = totalBeds > 0 ? (discharges.length / totalBeds).toFixed(1) : 0;
  const toi  = discharges.length > 0 ? (((daysInMonth - parseFloat(bor) / 100 * daysInMonth) * totalBeds) / discharges.length).toFixed(1) : 0;

  // Deaths (NDR & GDR proxy)
  const deaths = await prisma.visits.count({
    where: {
      ...(Object.keys(dateRange).length ? { discharge_date: dateRange } : {}),
      discharge_summary: { contains: 'meninggal', mode: 'insensitive' },
    },
  });
  const ndr = admissions > 0 ? ((deaths / admissions) * 1000).toFixed(2) : 0;
  const gdr = admissions > 0 ? ((deaths / admissions) * 1000).toFixed(2) : 0;

  res.json({
    success: true,
    data: {
      period: { year: y, month: m, days_in_month: daysInMonth },
      total_beds:  totalBeds,
      admissions,
      discharges:  discharges.length,
      total_los:   totalLOS,
      bor:  parseFloat(bor),
      alos: parseFloat(alos),
      bto:  parseFloat(bto),
      toi:  parseFloat(toi),
      ndr:  parseFloat(ndr),
      gdr:  parseFloat(gdr),
    },
  });
}));

// ─── Submissions ──────────────────────────────────────────────────────────────

router.get('/submissions', asyncHandler(async (req, res) => {
  const { year } = req.query;
  const where = year ? { report_period_year: parseInt(year) } : {};

  // Gracefully handle if table doesn't exist yet
  try {
    const submissions = await prisma.rl_report_submissions.findMany({
      where,
      orderBy: [{ report_period_year: 'desc' }, { report_period_month: 'desc' }],
    });
    res.json({ success: true, data: submissions });
  } catch {
    res.json({ success: true, data: [] });
  }
}));

router.post('/submissions', asyncHandler(async (req, res) => {
  try {
    const submission = await prisma.rl_report_submissions.create({ data: req.body });
    res.status(201).json({ success: true, data: submission });
  } catch {
    res.json({ success: true, data: req.body });
  }
}));

export default router;

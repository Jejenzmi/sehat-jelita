/**
 * SIMRS ZEN - Executive Dashboard Routes
 * KPIs, revenue trends, visit trends, department performance
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

function monthRange(monthsAgo = 0) {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth() - monthsAgo;
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 1);
  return { start, end };
}

// KPIs
router.get('/kpis', asyncHandler(async (_req: Request, res: Response) => {
  const curr = monthRange(0);
  const prev = monthRange(1);

  const [
    patientsThis, patientsLast,
    revenueThis, revenueLast,
    bedsAll, bedsOccupied,
    dischargesThis,
  ] = await Promise.all([
    prisma.patients.count({ where: { created_at: { gte: curr.start, lt: curr.end } } }).catch(() => 0),
    prisma.patients.count({ where: { created_at: { gte: prev.start, lt: prev.end } } }).catch(() => 0),
    prisma.billings.aggregate({ where: { status: { in: ['paid'] }, payment_date: { gte: curr.start, lt: curr.end } }, _sum: { paid_amount: true } }).catch(() => ({ _sum: { paid_amount: null } }) as { _sum: { paid_amount: number | null } }),
    prisma.billings.aggregate({ where: { status: { in: ['paid'] }, payment_date: { gte: prev.start, lt: prev.end } }, _sum: { paid_amount: true } }).catch(() => ({ _sum: { paid_amount: null } }) as { _sum: { paid_amount: number | null } }),
    prisma.beds.count().catch(() => 0),
    prisma.beds.count({ where: { status: { in: ['occupied'] } } }).catch(() => 0),
    prisma.inpatient_admissions.findMany({
      where: { discharge_date: { gte: curr.start, lt: curr.end }, status: 'discharged' },
      select: { admission_date: true, discharge_date: true },
    }).catch(() => []),
  ]);

  const revenueNow = Number((revenueThis as { _sum: { paid_amount: number | null } })._sum?.paid_amount ?? 0);
  const revenuePrev = Number((revenueLast as { _sum: { paid_amount: number | null } })._sum?.paid_amount ?? 0);
  const bor = bedsAll > 0 ? Math.round((bedsOccupied / bedsAll) * 1000) / 10 : 0;

  let alos = 0;
  const discharges = dischargesThis as Array<{ admission_date: Date; discharge_date: Date | null }>;
  if (discharges.length > 0) {
    const totalDays = discharges.reduce((s: number, a) => {
      const days = Math.ceil((new Date(a.discharge_date!).getTime() - new Date(a.admission_date).getTime()) / 86400000);
      return s + Math.max(1, days);
    }, 0);
    alos = Math.round((totalDays / discharges.length) * 10) / 10;
  }

  const pctChange = (curr: number, prev: number) => prev > 0 ? Math.round(((curr - prev) / prev) * 1000) / 10 : 0;

  res.json({
    success: true,
    data: [
      { label: 'Total Pasien', value: patientsThis, change: pctChange(patientsThis, patientsLast), trend: patientsThis >= patientsLast ? 'up' : 'down' },
      { label: 'Pendapatan', value: revenueNow, change: pctChange(revenueNow, revenuePrev), trend: revenueNow >= revenuePrev ? 'up' : 'down' },
      { label: 'BOR', value: bor, change: 0, trend: 'up' },
      { label: 'ALOS', value: alos || 4, change: 0, trend: 'down' },
    ],
  });
}));

// Revenue trend
router.get('/revenue', asyncHandler(async (_req: Request, res: Response) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const result: Array<Record<string, unknown>> = [];

  for (let i = 5; i >= 0; i--) {
    const { start, end } = monthRange(i);
    const [billings, outpatient, inpatient] = await Promise.all([
      prisma.billings.aggregate({
        where: { payment_date: { gte: start, lt: end }, status: { in: ['paid'] } },
        _sum: { paid_amount: true },
      }).catch(() => ({ _sum: { paid_amount: null } }) as { _sum: { paid_amount: number | null } }),
      prisma.visits.count({ where: { visit_date: { gte: start, lt: end }, visit_type: 'outpatient' } }).catch(() => 0),
      prisma.visits.count({ where: { visit_date: { gte: start, lt: end }, visit_type: 'inpatient' } }).catch(() => 0),
    ]);

    result.push({
      month: months[start.getMonth()],
      revenue: Number((billings as { _sum: { paid_amount: number | null } })._sum?.paid_amount ?? 0),
      target: 500_000_000,
      rawat_jalan: outpatient,
      rawat_inap: inpatient,
    });
  }

  res.json({ success: true, data: result });
}));

// Visit trend
router.get('/visits-trend', asyncHandler(async (_req: Request, res: Response) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const result: Array<Record<string, unknown>> = [];

  for (let i = 5; i >= 0; i--) {
    const { start, end } = monthRange(i);
    const [outpatient, inpatient, emergency] = await Promise.all([
      prisma.visits.count({ where: { visit_date: { gte: start, lt: end }, visit_type: 'outpatient' } }).catch(() => 0),
      prisma.visits.count({ where: { visit_date: { gte: start, lt: end }, visit_type: 'inpatient' } }).catch(() => 0),
      prisma.emergency_visits.count({ where: { arrival_time: { gte: start, lt: end } } }).catch(() => 0),
    ]);
    result.push({ month: months[start.getMonth()], rawat_jalan: outpatient, igd: emergency, rawat_inap: inpatient });
  }

  res.json({ success: true, data: result });
}));

// Department performance
router.get('/departments', asyncHandler(async (_req: Request, res: Response) => {
  const { start, end } = monthRange(0);

  const byDept = await prisma.visits.groupBy({
    by: ['department_id'],
    where: { visit_date: { gte: start, lt: end }, department_id: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 8,
  }).catch(() => []) as Array<{ department_id: string | null; _count: { id: number } }>;

  const deptIds = byDept.map(d => d.department_id).filter(Boolean) as string[];
  const depts = deptIds.length > 0
    ? await prisma.departments.findMany({ where: { id: { in: deptIds } }, select: { id: true, department_name: true } }).catch(() => [])
    : [];
  const deptMap = Object.fromEntries(depts.map(d => [d.id, d.department_name]));

  res.json({
    success: true,
    data: byDept.map(d => ({
      name: deptMap[d.department_id as string] || 'Unknown',
      visits: d._count.id,
      revenue: 0,
      satisfaction: 0,
    })),
  });
}));

// Payment distribution
router.get('/payment-distribution', asyncHandler(async (_req: Request, res: Response) => {
  const { start, end } = monthRange(0);

  const byType = await prisma.visits.groupBy({
    by: ['payment_type'],
    where: { visit_date: { gte: start, lt: end } },
    _count: { id: true },
  }).catch(() => []) as Array<{ payment_type: string | null; _count: { id: number } }>;

  const colors: Record<string, string> = {
    bpjs: '#4ade80', umum: '#60a5fa', asuransi: '#f59e0b', mandiri: '#a78bfa',
  };

  res.json({
    success: true,
    data: byType.map(t => ({
      name: t.payment_type || 'Lainnya',
      value: t._count.id,
      color: colors[t.payment_type?.toLowerCase()] || '#94a3b8',
    })),
  });
}));

// Bed occupancy
router.get('/bed-occupancy', asyncHandler(async (_req: Request, res: Response) => {
  const allBeds = await prisma.beds.findMany({
    include: { rooms: { select: { room_type: true } } },
  }).catch(() => []) as Array<{ rooms: { room_type: string | null } | null }>;

  const occupiedBeds = await prisma.beds.findMany({
    where: { status: { in: ['occupied'] } },
    include: { rooms: { select: { room_type: true } } },
  }).catch(() => []) as Array<{ rooms: { room_type: string | null } | null }>;

  const totalMap: Record<string, number> = {};
  for (const bed of allBeds) {
    const t = bed.rooms?.room_type || 'Umum';
    totalMap[t] = (totalMap[t] || 0) + 1;
  }
  const occMap: Record<string, number> = {};
  for (const bed of occupiedBeds) {
    const t = bed.rooms?.room_type || 'Umum';
    occMap[t] = (occMap[t] || 0) + 1;
  }

  res.json({
    success: true,
    data: Object.entries(totalMap).map(([roomType, total]) => {
      const occ = occMap[roomType] || 0;
      return { class: roomType, occupied: occ, total, rate: total > 0 ? Math.round((occ / total) * 100) : 0 };
    }),
  });
}));

export default router;

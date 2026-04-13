/**
 * SIMRS ZEN - PACS / DICOM Integration Routes
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { requireRole } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import * as cache from '../services/cache.service.js';

const router = Router();

router.use(requireRole(['admin', 'radiologi', 'dokter', 'it']));

interface WorklistQuery {
  date?: string;
  modality?: string;
  status?: string;
  patient_id?: string;
}

interface StudiesQuery {
  patient_id?: string;
  order_id?: string;
  modality?: string;
  status?: string;
  page?: string;
  limit?: string;
}

async function generateAccessionNumber() {
  const prefix = `ACC${new Date().toISOString().split('T')[0].replace(/-/g, '')}`;
  const last = await prisma.dicom_worklist.findFirst({
    where: { accession_number: { startsWith: prefix } },
    orderBy: { accession_number: 'desc' }
  });
  const seq = last ? parseInt(last.accession_number.slice(-4), 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

async function getActivePacs() {
  return prisma.pacs_configs.findFirst({ where: { is_active: true } });
}

// PACS Config
router.get('/config', requireRole(['admin', 'it']), asyncHandler(async (_req: Request, res: Response) => {
  const config = await prisma.pacs_configs.findMany({ orderBy: { is_active: 'desc' as const } });
  res.json({ success: true, data: config });
}));

router.put('/config/:id', requireRole(['admin', 'it']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const { aet_title, host, port, wado_rs_url, stow_rs_url, qido_rs_url, wado_uri_url,
    auth_type, description, is_active } = req.body;

  const config = await prisma.pacs_configs.update({
    where: { id },
    data: {
      ...(aet_title !== undefined && { aet_title }),
      ...(host !== undefined && { host }),
      ...(port !== undefined && { port: parseInt(port) }),
      ...(wado_rs_url !== undefined && { wado_rs_url }),
      ...(stow_rs_url !== undefined && { stow_rs_url }),
      ...(qido_rs_url !== undefined && { qido_rs_url }),
      ...(wado_uri_url !== undefined && { wado_uri_url }),
      ...(auth_type !== undefined && { auth_type }),
      ...(description !== undefined && { description }),
      ...(is_active !== undefined && { is_active }),
    }
  });

  await cache.del('pacs:config');
  res.json({ success: true, message: 'PACS config berhasil diperbarui', data: config });
}));

// Modality Worklist
router.get('/worklist', asyncHandler(async (req: Request<Record<string, string>, any, any, WorklistQuery>, res: Response) => {
  const { date, modality, status = 'scheduled', patient_id } = req.query;

  const targetDate = date ? new Date(date) : new Date();
  targetDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const worklist = await prisma.dicom_worklist.findMany({
    where: {
      worklist_status: status,
      ...(modality && { scheduled_modality: modality }),
      ...(patient_id && { patient_id }),
      ...(date && {
        scheduled_datetime: { gte: targetDate, lt: nextDay }
      }),
    },
    include: {
      patients: {
        select: {
          id: true, medical_record_number: true, full_name: true,
          birth_date: true, gender: true, nik: true
        }
      }
    },
    orderBy: { scheduled_datetime: 'asc' as const },
    take: 100
  });

  res.json({ success: true, data: worklist, count: worklist.length });
}));

router.post('/worklist', asyncHandler(async (req: Request, res: Response) => {
  const schema = z.object({
    radiology_order_id: z.string().uuid(),
    patient_id: z.string().uuid(),
    scheduled_modality: z.string().max(20),
    scheduled_station: z.string().optional(),
    scheduled_datetime: z.string().datetime().optional(),
    procedure_code: z.string().optional(),
    procedure_desc: z.string().optional(),
    requested_physician: z.string().optional(),
  });

  const data = schema.parse(req.body);
  const accession_number = await generateAccessionNumber();

  const entry = await prisma.dicom_worklist.create({
    data: {
      ...data,
      accession_number,
      scheduled_datetime: data.scheduled_datetime ? new Date(data.scheduled_datetime) : new Date(),
    }
  });

  res.status(201).json({
    success: true,
    message: 'Worklist entry berhasil dibuat',
    data: entry
  });
}));

router.patch('/worklist/:id/status', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const VALID = ['scheduled', 'in_progress', 'completed', 'cancelled'];
  if (!VALID.includes(status)) throw new ApiError(400, `Status tidak valid. Pilih: ${VALID.join(', ')}`);

  const entry = await prisma.dicom_worklist.update({
    where: { id },
    data: { worklist_status: status }
  });

  res.json({ success: true, data: entry });
}));

router.post('/worklist/from-order/:orderId', asyncHandler(async (req: Request<{ orderId: string }>, res: Response) => {
  const { orderId } = req.params;

  const order = await prisma.radiology_orders.findUnique({
    where: { id: orderId },
    include: {
      patients: { select: { id: true, full_name: true } }
    }
  });

  if (!order) throw new ApiError(404, 'Radiology order tidak ditemukan');

  const accession_number = await generateAccessionNumber();

  const existing = await prisma.dicom_worklist.findFirst({ where: { radiology_order_id: orderId } });
  if (existing) throw new ApiError(409, 'Worklist sudah ada untuk order ini');

  const entry = await prisma.dicom_worklist.create({
    data: {
      radiology_order_id: orderId,
      patient_id: order.patient_id,
      accession_number,
      scheduled_modality: order.modality || req.body.modality || 'CR',
      procedure_code: null,
      procedure_desc: null,
      scheduled_datetime: new Date(),
    }
  });

  res.status(201).json({ success: true, data: entry });
}));

// DICOM Studies
router.get('/studies', asyncHandler(async (req: Request<Record<string, string>, any, any, StudiesQuery>, res: Response) => {
  const { patient_id, order_id, modality, status, page = '1', limit = '20' } = req.query;

  const where: Record<string, unknown> = {
    ...(patient_id && { patient_id }),
    ...(order_id && { radiology_order_id: order_id }),
    ...(modality && { modality }),
    ...(status && { status }),
  };

  const [studies, total] = await Promise.all([
    prisma.dicom_studies.findMany({
      where,
      include: {
        patients: { select: { id: true, medical_record_number: true, full_name: true } },
        dicom_series: { select: { id: true, series_instance_uid: true, modality: true, num_instances: true } },
        pacs_configs: { select: { aet_title: true, wado_rs_url: true } },
      },
      orderBy: { study_date: 'desc' as const },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    }),
    prisma.dicom_studies.count({ where })
  ]);

  const pacsConfig = await getActivePacs();
  const studiesWithUrl = studies.map(s => ({
    ...s,
    viewer_url: pacsConfig?.wado_rs_url
      ? `${pacsConfig.wado_rs_url}/studies/${s.study_instance_uid}`
      : null
  }));

  res.json({
    success: true,
    data: studiesWithUrl,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, total_pages: Math.ceil(total / parseInt(limit)) }
  });
}));

router.get('/studies/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const study = await prisma.dicom_studies.findUnique({
    where: { id: req.params.id },
    include: {
      patients: { select: { id: true, medical_record_number: true, full_name: true, birth_date: true, gender: true } },
      pacs_configs: { select: { aet_title: true, wado_rs_url: true, wado_uri_url: true } },
      dicom_series: {
        include: {
          dicom_instances: {
            orderBy: { instance_number: 'asc' },
            take: 50
          }
        },
        orderBy: { series_number: 'asc' }
      }
    }
  });

  if (!study) throw new ApiError(404, 'Study tidak ditemukan');

  const pacsConfig = study.pacs_configs;
  const base = pacsConfig?.wado_rs_url || null;
  const studyWithUrls = {
    ...study,
    wado_rs_url: base ? `${base}/studies/${study.study_instance_uid}` : null,
    wado_uri_url: pacsConfig?.wado_uri_url
      ? `${pacsConfig.wado_uri_url}?requestType=WADO&studyUID=${study.study_instance_uid}`
      : null,
  };

  res.json({ success: true, data: studyWithUrls });
}));

router.post('/studies', asyncHandler(async (req: Request, res: Response) => {
  const schema = z.object({
    study_instance_uid: z.string().min(1),
    patient_id: z.string().uuid().optional(),
    radiology_order_id: z.string().uuid().optional(),
    accession_number: z.string().optional(),
    study_date: z.string().optional(),
    study_description: z.string().optional(),
    modality: z.string().optional(),
    referring_physician: z.string().optional(),
    institution_name: z.string().optional(),
    pacs_config_id: z.string().uuid().optional(),
  });

  const data = schema.parse(req.body);
  const pacsConfig = data.pacs_config_id ? null : await getActivePacs();

  const study = await prisma.dicom_studies.upsert({
    where: { study_instance_uid: data.study_instance_uid },
    update: {
      ...(data.patient_id !== undefined && { patient_id: data.patient_id }),
      ...(data.radiology_order_id !== undefined && { radiology_order_id: data.radiology_order_id }),
      ...(data.accession_number !== undefined && { accession_number: data.accession_number }),
      ...(data.study_date !== undefined && { study_date: new Date(data.study_date) }),
      ...(data.study_description !== undefined && { study_description: data.study_description }),
      ...(data.modality !== undefined && { modality: data.modality }),
      ...(data.referring_physician !== undefined && { referring_physician: data.referring_physician }),
      ...(data.institution_name !== undefined && { institution_name: data.institution_name }),
      ...(data.pacs_config_id !== undefined && { pacs_config_id: data.pacs_config_id }),
      updated_at: new Date()
    },
    create: {
      study_instance_uid: data.study_instance_uid,
      patient_id: data.patient_id || null,
      radiology_order_id: data.radiology_order_id || null,
      accession_number: data.accession_number || null,
      study_date: data.study_date ? new Date(data.study_date) : null,
      study_description: data.study_description || null,
      modality: data.modality || null,
      referring_physician: data.referring_physician || null,
      institution_name: data.institution_name || null,
      pacs_config_id: data.pacs_config_id || pacsConfig?.id || null,
      status: 'received'
    }
  });

  if (data.accession_number) {
    await prisma.dicom_worklist.updateMany({
      where: { accession_number: data.accession_number, worklist_status: 'in_progress' },
      data: { worklist_status: 'completed' }
    }).catch(() => { });
  }

  res.status(201).json({ success: true, data: study });
}));

router.post('/studies/:studyId/series', asyncHandler(async (req: Request<{ studyId: string }>, res: Response) => {
  const { studyId } = req.params;

  const schema = z.object({
    series_instance_uid: z.string().min(1),
    series_number: z.number().int().optional(),
    series_description: z.string().optional(),
    modality: z.string().optional(),
    body_part_examined: z.string().optional(),
    num_instances: z.number().int().optional().default(0),
  });

  const data = schema.parse(req.body);

  const series = await prisma.dicom_series.upsert({
    where: { series_instance_uid: data.series_instance_uid },
    update: {
      ...(data.series_number !== undefined && { series_number: data.series_number }),
      ...(data.series_description !== undefined && { series_description: data.series_description }),
      ...(data.modality !== undefined && { modality: data.modality }),
      ...(data.body_part_examined !== undefined && { body_part_examined: data.body_part_examined }),
      ...(data.num_instances !== undefined && { num_instances: data.num_instances }),
    },
    create: {
      series_instance_uid: data.series_instance_uid,
      series_number: data.series_number || null,
      series_description: data.series_description || null,
      modality: data.modality || null,
      body_part_examined: data.body_part_examined || null,
      num_instances: data.num_instances,
      study_id: studyId
    }
  });

  const seriesCount = await prisma.dicom_series.count({ where: { study_id: studyId } });
  await prisma.dicom_studies.update({
    where: { id: studyId },
    data: { num_series: seriesCount, updated_at: new Date() }
  }).catch(() => { });

  res.status(201).json({ success: true, data: series });
}));

router.get('/viewer-url/:studyId', asyncHandler(async (req: Request<{ studyId: string }>, res: Response) => {
  const study = await prisma.dicom_studies.findUnique({
    where: { id: req.params.studyId },
    select: { study_instance_uid: true, pacs_config_id: true }
  });
  if (!study) throw new ApiError(404, 'Study tidak ditemukan');

  const pacs = study.pacs_config_id
    ? await prisma.pacs_configs.findUnique({ where: { id: study.pacs_config_id } })
    : await getActivePacs();

  const wadoRs = pacs?.wado_rs_url;
  const wadoUri = pacs?.wado_uri_url;

  res.json({
    success: true,
    data: {
      study_instance_uid: study.study_instance_uid,
      wado_rs: wadoRs ? `${wadoRs}/studies/${study.study_instance_uid}` : null,
      wado_uri: wadoUri ? `${wadoUri}?requestType=WADO&studyUID=${study.study_instance_uid}&contentType=application/dicom` : null,
      ohif_url: wadoRs ? `/viewer?StudyInstanceUIDs=${study.study_instance_uid}` : null,
    }
  });
}));

// PACS Stats
router.get('/stats', asyncHandler(async (_req: Request, res: Response) => {
  const cacheKey = 'pacs:stats';
  const { data } = await cache.cacheAside(cacheKey, async () => {
    const [totalStudies, byModality, byStatus, recentStudies, worklist] = await Promise.all([
      prisma.dicom_studies.count(),
      prisma.dicom_studies.groupBy({ by: ['modality'], _count: true }),
      prisma.dicom_studies.groupBy({ by: ['status'], _count: true }),
      prisma.dicom_studies.count({ where: { study_date: { gte: new Date(Date.now() - 7 * 86400000) } } }),
      prisma.dicom_worklist.groupBy({ by: ['worklist_status'], _count: true }),
    ]);

    return {
      total_studies: totalStudies,
      studies_7d: recentStudies,
      by_modality: (byModality as Array<{ modality: string | null; _count: number }>).map(r => ({ modality: r.modality || 'Unknown', count: r._count })),
      by_status: (byStatus as Array<{ status: string | null; _count: number }>).map(r => ({ status: r.status, count: r._count })),
      worklist_status: (worklist as Array<{ worklist_status: string | null; _count: number }>).map(r => ({ status: r.worklist_status, count: r._count })),
    };
  }, 5 * 60);

  res.json({ success: true, data });
}));

export default router;

/**
 * SIMRS ZEN - PACS / DICOM Integration Routes
 *
 * Provides:
 *   - Modality Worklist management (from radiology orders)
 *   - DICOM study/series/instance registry (populated by PACS push/webhook)
 *   - WADO URL generation for viewer links
 *   - PACS server configuration
 *
 * NOTE: Actual DICOM network communication (C-FIND, C-MOVE, C-STORE) requires
 * a separate DICOM gateway (e.g. Orthanc, DCM4CHEE). This module manages the
 * metadata and worklist; binary DICOM data stays in the PACS server.
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { requireRole } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import * as cache from '../services/cache.service.js';

const router = Router();

// All PACS routes require at minimum 'radiologi' role
router.use(requireRole(['admin', 'radiologi', 'dokter', 'it']));

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Generate a unique accession number: ACC-YYYYMMDD-NNNN */
async function generateAccessionNumber() {
  const prefix = `ACC${new Date().toISOString().split('T')[0].replace(/-/g, '')}`;
  const last = await prisma.dicom_worklist.findFirst({
    where:   { accession_number: { startsWith: prefix } },
    orderBy: { accession_number: 'desc' }
  });
  const seq = last ? parseInt(last.accession_number.slice(-4), 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

/** Get active PACS config */
async function getActivePacs() {
  return prisma.pacs_configs.findFirst({ where: { is_active: true } });
}

/** Build WADO-RS URL for a study */
function buildWadoUrl(pacsConfig, studyUid) {
  if (!pacsConfig?.wado_rs_url) return null;
  return `${pacsConfig.wado_rs_url}/studies/${studyUid}`;
}

// ── PACS Configuration ─────────────────────────────────────────────────────

/**
 * GET /api/pacs/config
 * Get PACS server configuration
 */
router.get('/config', requireRole(['admin', 'it']), asyncHandler(async (req, res) => {
  const config = await prisma.pacs_configs.findMany({ orderBy: { is_active: 'desc' } });
  res.json({ success: true, data: config });
}));

/**
 * PUT /api/pacs/config/:id
 * Update PACS server configuration
 */
router.put('/config/:id', requireRole(['admin', 'it']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { aet_title, host, port, wado_rs_url, stow_rs_url, qido_rs_url, wado_uri_url,
          auth_type, description, is_active } = req.body;

  const config = await prisma.pacs_configs.update({
    where: { id },
    data: {
      ...(aet_title    !== undefined && { aet_title }),
      ...(host         !== undefined && { host }),
      ...(port         !== undefined && { port: parseInt(port) }),
      ...(wado_rs_url  !== undefined && { wado_rs_url }),
      ...(stow_rs_url  !== undefined && { stow_rs_url }),
      ...(qido_rs_url  !== undefined && { qido_rs_url }),
      ...(wado_uri_url !== undefined && { wado_uri_url }),
      ...(auth_type    !== undefined && { auth_type }),
      ...(description  !== undefined && { description }),
      ...(is_active    !== undefined && { is_active }),
    }
  });

  await cache.del('pacs:config');
  res.json({ success: true, message: 'PACS config berhasil diperbarui', data: config });
}));

// ── Modality Worklist ──────────────────────────────────────────────────────

/**
 * GET /api/pacs/worklist
 * Query modality worklist (scheduled procedures)
 * This is what DICOM modalities (CT, MR, etc.) poll to get work orders.
 */
router.get('/worklist', asyncHandler(async (req, res) => {
  const { date, modality, status = 'scheduled', patient_id } = req.query;

  const targetDate = date ? new Date(date) : new Date();
  targetDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const worklist = await prisma.dicom_worklist.findMany({
    where: {
      worklist_status: status,
      ...(modality   && { scheduled_modality: modality }),
      ...(patient_id && { patient_id }),
      ...(date       && {
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
    orderBy: { scheduled_datetime: 'asc' },
    take: 100
  });

  res.json({ success: true, data: worklist, count: worklist.length });
}));

/**
 * POST /api/pacs/worklist
 * Create a worklist entry from a radiology order
 */
router.post('/worklist', asyncHandler(async (req, res) => {
  const schema = z.object({
    radiology_order_id:  z.string().uuid(),
    patient_id:          z.string().uuid(),
    scheduled_modality:  z.string().max(20),
    scheduled_station:   z.string().optional(),
    scheduled_datetime:  z.string().datetime().optional(),
    procedure_code:      z.string().optional(),
    procedure_desc:      z.string().optional(),
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

/**
 * PATCH /api/pacs/worklist/:id/status
 * Update worklist item status (scheduled → in_progress → completed)
 */
router.patch('/worklist/:id/status', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const VALID = ['scheduled', 'in_progress', 'completed', 'cancelled'];
  if (!VALID.includes(status)) throw new ApiError(400, `Status tidak valid. Pilih: ${VALID.join(', ')}`);

  const entry = await prisma.dicom_worklist.update({
    where: { id },
    data:  { worklist_status: status }
  });

  res.json({ success: true, data: entry });
}));

/**
 * POST /api/pacs/worklist/from-order/:orderId
 * Auto-create worklist from an existing radiology order
 */
router.post('/worklist/from-order/:orderId', asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await prisma.radiology_orders.findUnique({
    where: { id: orderId },
    include: {
      patients: { select: { id: true, full_name: true } },
      radiology_order_items: {
        take: 1,
        include: { radiology_procedures: { select: { procedure_name: true, procedure_code: true, modality: true } } }
      }
    }
  });

  if (!order) throw new ApiError(404, 'Radiology order tidak ditemukan');

  const proc = order.radiology_order_items?.[0]?.radiology_procedures;
  const accession_number = await generateAccessionNumber();

  // Check if worklist already exists for this order
  const existing = await prisma.dicom_worklist.findFirst({ where: { radiology_order_id: orderId } });
  if (existing) throw new ApiError(409, 'Worklist sudah ada untuk order ini');

  const entry = await prisma.dicom_worklist.create({
    data: {
      radiology_order_id:   orderId,
      patient_id:           order.patient_id,
      accession_number,
      scheduled_modality:   proc?.modality || req.body.modality || 'CR',
      procedure_code:       proc?.procedure_code || null,
      procedure_desc:       proc?.procedure_name || null,
      scheduled_datetime:   new Date(),
    }
  });

  res.status(201).json({ success: true, data: entry });
}));

// ── DICOM Studies ──────────────────────────────────────────────────────────

/**
 * GET /api/pacs/studies
 * List DICOM studies with optional patient/order filter
 */
router.get('/studies', asyncHandler(async (req, res) => {
  const { patient_id, order_id, modality, status, page = 1, limit = 20 } = req.query;

  const where = {
    ...(patient_id && { patient_id }),
    ...(order_id   && { radiology_order_id: order_id }),
    ...(modality   && { modality }),
    ...(status     && { status }),
  };

  const [studies, total] = await Promise.all([
    prisma.dicom_studies.findMany({
      where,
      include: {
        patients:     { select: { id: true, medical_record_number: true, full_name: true } },
        dicom_series: { select: { id: true, series_instance_uid: true, modality: true, num_instances: true } },
        pacs_configs: { select: { aet_title: true, wado_rs_url: true } },
      },
      orderBy: { study_date: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    }),
    prisma.dicom_studies.count({ where })
  ]);

  // Append viewer URL
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

/**
 * GET /api/pacs/studies/:id
 * Get study with series and instances
 */
router.get('/studies/:id', asyncHandler(async (req, res) => {
  const study = await prisma.dicom_studies.findUnique({
    where: { id: req.params.id },
    include: {
      patients:      { select: { id: true, medical_record_number: true, full_name: true, birth_date: true, gender: true } },
      pacs_configs:  { select: { aet_title: true, wado_rs_url: true, wado_uri_url: true } },
      dicom_series: {
        include: {
          dicom_instances: {
            orderBy: { instance_number: 'asc' },
            take: 50  // limit instances in response to avoid huge payloads
          }
        },
        orderBy: { series_number: 'asc' }
      }
    }
  });

  if (!study) throw new ApiError(404, 'Study tidak ditemukan');

  // Build WADO URLs
  const base = study.pacs_configs?.wado_rs_url;
  const studyWithUrls = {
    ...study,
    wado_rs_url:   base ? `${base}/studies/${study.study_instance_uid}` : null,
    wado_uri_url:  study.pacs_configs?.wado_uri_url
      ? `${study.pacs_configs.wado_uri_url}?requestType=WADO&studyUID=${study.study_instance_uid}`
      : null,
  };

  res.json({ success: true, data: studyWithUrls });
}));

/**
 * POST /api/pacs/studies
 * Register a DICOM study (called by PACS gateway on C-STORE / STOW-RS)
 */
router.post('/studies', asyncHandler(async (req, res) => {
  const schema = z.object({
    study_instance_uid:  z.string().min(1),
    patient_id:          z.string().uuid().optional(),
    radiology_order_id:  z.string().uuid().optional(),
    accession_number:    z.string().optional(),
    study_date:          z.string().optional(),
    study_description:   z.string().optional(),
    modality:            z.string().optional(),
    referring_physician: z.string().optional(),
    institution_name:    z.string().optional(),
    pacs_config_id:      z.string().uuid().optional(),
  });

  const data = schema.parse(req.body);
  const pacsConfig = data.pacs_config_id ? null : await getActivePacs();

  const study = await prisma.dicom_studies.upsert({
    where:  { study_instance_uid: data.study_instance_uid },
    update: { ...data, updated_at: new Date() },
    create: {
      ...data,
      study_date:    data.study_date ? new Date(data.study_date) : null,
      pacs_config_id: data.pacs_config_id || pacsConfig?.id || null,
      status: 'received'
    }
  });

  // Auto-update worklist if accession number matches
  if (data.accession_number) {
    await prisma.dicom_worklist.updateMany({
      where: { accession_number: data.accession_number, worklist_status: 'in_progress' },
      data:  { worklist_status: 'completed' }
    }).catch(() => {});
  }

  res.status(201).json({ success: true, data: study });
}));

/**
 * POST /api/pacs/studies/:studyId/series
 * Register a DICOM series within a study
 */
router.post('/studies/:studyId/series', asyncHandler(async (req, res) => {
  const { studyId } = req.params;

  const schema = z.object({
    series_instance_uid: z.string().min(1),
    series_number:       z.number().int().optional(),
    series_description:  z.string().optional(),
    modality:            z.string().optional(),
    body_part_examined:  z.string().optional(),
    num_instances:       z.number().int().optional().default(0),
  });

  const data = schema.parse(req.body);

  const series = await prisma.dicom_series.upsert({
    where:  { series_instance_uid: data.series_instance_uid },
    update: { ...data },
    create: { ...data, study_id: studyId }
  });

  // Update series count in parent study
  const seriesCount = await prisma.dicom_series.count({ where: { study_id: studyId } });
  await prisma.dicom_studies.update({
    where: { id: studyId },
    data:  { num_series: seriesCount, updated_at: new Date() }
  }).catch(() => {});

  res.status(201).json({ success: true, data: series });
}));

/**
 * GET /api/pacs/viewer-url/:studyId
 * Get OHIF/Weasis/WADO viewer URL for a study
 */
router.get('/viewer-url/:studyId', asyncHandler(async (req, res) => {
  const study = await prisma.dicom_studies.findUnique({
    where: { id: req.params.studyId },
    select: { study_instance_uid: true, pacs_config_id: true }
  });
  if (!study) throw new ApiError(404, 'Study tidak ditemukan');

  const pacs = study.pacs_config_id
    ? await prisma.pacs_configs.findUnique({ where: { id: study.pacs_config_id } })
    : await getActivePacs();

  const wadoRs  = pacs?.wado_rs_url;
  const wadoUri = pacs?.wado_uri_url;

  res.json({
    success: true,
    data: {
      study_instance_uid: study.study_instance_uid,
      wado_rs:   wadoRs  ? `${wadoRs}/studies/${study.study_instance_uid}` : null,
      wado_uri:  wadoUri ? `${wadoUri}?requestType=WADO&studyUID=${study.study_instance_uid}&contentType=application/dicom` : null,
      // OHIF viewer format (if deployed)
      ohif_url:  wadoRs  ? `/viewer?StudyInstanceUIDs=${study.study_instance_uid}` : null,
    }
  });
}));

/**
 * GET /api/pacs/stats
 * PACS usage statistics
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const cacheKey = 'pacs:stats';
  const { data } = await cache.cacheAside(cacheKey, async () => {
    const [totalStudies, byModality, byStatus, recentStudies, worklist] = await Promise.all([
      prisma.dicom_studies.count(),
      prisma.dicom_studies.groupBy({ by: ['modality'], _count: true, orderBy: { _count: { modality: 'desc' } } }),
      prisma.dicom_studies.groupBy({ by: ['status'], _count: true }),
      prisma.dicom_studies.count({ where: { study_date: { gte: new Date(Date.now() - 7 * 86400000) } } }),
      prisma.dicom_worklist.groupBy({ by: ['worklist_status'], _count: true }),
    ]);

    return {
      total_studies:   totalStudies,
      studies_7d:      recentStudies,
      by_modality:     byModality.map(r => ({ modality: r.modality || 'Unknown', count: r._count })),
      by_status:       byStatus.map(r => ({ status: r.status, count: r._count })),
      worklist_status: worklist.map(r => ({ status: r.worklist_status, count: r._count })),
    };
  }, 5 * 60);

  res.json({ success: true, data });
}));

export default router;

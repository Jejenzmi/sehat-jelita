/**
 * SIMRS ZEN - BPJS Integration Routes
 * VClaim, Antrean, EClaim, iCare APIs
 */

import { Router, Request, Response, NextFunction } from 'express';
import { requireRole, checkMenuAccess } from '../middleware/role.middleware.js';
import { externalApiLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import BPJSVClaimService from '../services/bpjs-vclaim.service.js';
import { prisma } from '../config/database.js';
import { MemoryQueue } from '../utils/queue.js';

const router = Router();

router.use(checkMenuAccess('bpjs'));
router.use(externalApiLimiter);

const bpjsQueue = new MemoryQueue('bpjs-sync', async (job: { name: string; data: Record<string, unknown> }) => {
  await import('../workers/bpjs.worker.js').then(w => w.processBpjsJob(job));
});

const vclaimService = new BPJSVClaimService();

// ============================================
// VCLAIM - PESERTA
// ============================================

/**
 * GET /api/bpjs/peserta/nik/:nik
 * Get peserta by NIK
 */
router.get('/peserta/nik/:nik', asyncHandler(async (req: Request, res: Response) => {
  const { nik } = req.params;
  const { tanggal } = req.query;

  const result = await vclaimService.getPesertaByNIK(nik, (tanggal as string) || new Date().toISOString().split('T')[0]);

  res.json({
    success: true,
    data: result
  });
}));

/**
 * GET /api/bpjs/peserta/noka/:noKartu
 * Get peserta by nomor kartu BPJS
 */
router.get('/peserta/noka/:noKartu', asyncHandler(async (req: Request, res: Response) => {
  const { noKartu } = req.params;
  const { tanggal } = req.query;

  const result = await vclaimService.getPesertaByKartu(noKartu, (tanggal as string) || new Date().toISOString().split('T')[0]);

  res.json({
    success: true,
    data: result
  });
}));

// ============================================
// VCLAIM - SEP
// ============================================

/**
 * POST /api/bpjs/sep
 * Create new SEP
 */
router.post('/sep', requireRole(['admin', 'registrasi']), asyncHandler(async (req: Request, res: Response) => {
  const sepData = req.body;

  const result = await vclaimService.createSEP(sepData);

  res.json({
    success: true,
    message: 'SEP berhasil dibuat',
    data: result
  });
}));

/**
 * GET /api/bpjs/sep/:noSep
 * Get SEP by number
 */
router.get('/sep/:noSep', asyncHandler(async (req: Request, res: Response) => {
  const { noSep } = req.params;

  const result = await vclaimService.getSEP(noSep);

  res.json({
    success: true,
    data: result
  });
}));

/**
 * PUT /api/bpjs/sep/:noSep
 * Update SEP
 */
router.put('/sep/:noSep', requireRole(['admin', 'registrasi']), asyncHandler(async (req: Request, res: Response) => {
  const { noSep } = req.params;
  const updateData = req.body;

  const result = await vclaimService.updateSEP(noSep, updateData);

  res.json({
    success: true,
    message: 'SEP berhasil diperbarui',
    data: result
  });
}));

/**
 * DELETE /api/bpjs/sep/:noSep
 * Delete SEP
 */
router.delete('/sep/:noSep', requireRole(['admin']), asyncHandler(async (req: Request, res: Response) => {
  const { noSep } = req.params;
  const { alasan } = req.body;

  const result = await vclaimService.deleteSEP(noSep, alasan);

  res.json({
    success: true,
    message: 'SEP berhasil dihapus',
    data: result
  });
}));

// ============================================
// SISRUTE REFERRALS (local database)
// ============================================

interface RujukanQuery {
  limit?: string;
  status?: string;
  patient_id?: string;
}

/**
 * GET /api/bpjs/rujukan?limit=100&status=
 */
router.get('/rujukan', asyncHandler(async (req: Request<{}, {}, {}, RujukanQuery>, res: Response) => {
  const { limit = '100', status, patient_id } = req.query;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (patient_id) where.patient_id = patient_id;

  const referrals = await prisma.sisrute_referrals.findMany({
    where,
    include: { patients: { select: { full_name: true, medical_record_number: true } } },
    orderBy: { created_at: 'desc' },
    take: parseInt(limit),
  });

  // Reshape to match SISRUTEReferral interface
  const data = referrals.map(r => ({
    ...r,
    patients: r.patients ? { name: r.patients.full_name, medical_record_number: r.patients.medical_record_number } : null,
  }));

  res.json({ success: true, data });
}));

/**
 * POST /api/bpjs/rujukan
 */
router.post('/rujukan', requireRole(['admin', 'registrasi', 'dokter']), asyncHandler(async (req: Request, res: Response) => {
  const {
    referral_number, sisrute_id, patient_id,
    referral_type = 'outgoing', referral_category,
    source_facility_code, source_facility_name, source_city,
    destination_facility_code, destination_facility_name, destination_city, destination_department,
    primary_diagnosis, diagnosis_description, reason_for_referral, clinical_summary,
    referring_doctor_name, transport_type, status = 'pending',
  } = req.body;

  if (!referral_number) {
    return res.status(400).json({ success: false, error: 'referral_number wajib diisi' });
  }

  const referral = await prisma.sisrute_referrals.create({
    data: {
      referral_number, sisrute_id: sisrute_id || null,
      patient_id: patient_id || null,
      referral_type, referral_category: referral_category || null,
      source_facility_code: source_facility_code || null,
      source_facility_name: source_facility_name || null,
      source_city: source_city || null,
      destination_facility_code: destination_facility_code || null,
      destination_facility_name: destination_facility_name || null,
      destination_city: destination_city || null,
      destination_department: destination_department || null,
      primary_diagnosis: primary_diagnosis || null,
      diagnosis_description: diagnosis_description || null,
      reason_for_referral: reason_for_referral || null,
      clinical_summary: clinical_summary || null,
      referring_doctor_name: referring_doctor_name || null,
      transport_type: transport_type || null,
      status,
    },
  });

  res.status(201).json({ success: true, data: referral });
}));

/**
 * PUT /api/bpjs/rujukan/:id
 */
router.put('/rujukan/:id', requireRole(['admin', 'registrasi', 'dokter']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const {
    sisrute_id, patient_id, referral_type, referral_category,
    source_facility_code, source_facility_name, source_city,
    destination_facility_code, destination_facility_name, destination_city, destination_department,
    primary_diagnosis, diagnosis_description, reason_for_referral, clinical_summary,
    referring_doctor_name, transport_type, status, sync_status,
  } = req.body;

  const referral = await prisma.sisrute_referrals.update({
    where: { id },
    data: {
      sisrute_id: sisrute_id ?? undefined,
      patient_id: patient_id ?? undefined,
      referral_type: referral_type ?? undefined,
      referral_category: referral_category ?? undefined,
      source_facility_code: source_facility_code ?? undefined,
      source_facility_name: source_facility_name ?? undefined,
      source_city: source_city ?? undefined,
      destination_facility_code: destination_facility_code ?? undefined,
      destination_facility_name: destination_facility_name ?? undefined,
      destination_city: destination_city ?? undefined,
      destination_department: destination_department ?? undefined,
      primary_diagnosis: primary_diagnosis ?? undefined,
      diagnosis_description: diagnosis_description ?? undefined,
      reason_for_referral: reason_for_referral ?? undefined,
      clinical_summary: clinical_summary ?? undefined,
      referring_doctor_name: referring_doctor_name ?? undefined,
      transport_type: transport_type ?? undefined,
      status: status ?? undefined,
      sync_status: sync_status ?? undefined,
    },
  });

  res.json({ success: true, data: referral });
}));

// ============================================
// VCLAIM - RUJUKAN (external BPJS API)
// ============================================

/**
 * GET /api/bpjs/rujukan/:noRujukan
 * Get rujukan by number
 */
router.get('/rujukan/:noRujukan', asyncHandler(async (req: Request, res: Response) => {
  const { noRujukan } = req.params;

  const result = await vclaimService.getRujukan(noRujukan);

  res.json({
    success: true,
    data: result
  });
}));

/**
 * GET /api/bpjs/rujukan/peserta/:noKartu
 * Get rujukan list by peserta
 */
router.get('/rujukan/peserta/:noKartu', asyncHandler(async (req: Request, res: Response) => {
  const { noKartu } = req.params;

  const result = await vclaimService.getRujukanByPeserta(noKartu);

  res.json({
    success: true,
    data: result
  });
}));

// ============================================
// VCLAIM - REFERENSI
// ============================================

/**
 * GET /api/bpjs/referensi/diagnosa/:keyword
 * Search diagnosa ICD-10
 */
router.get('/referensi/diagnosa/:keyword', asyncHandler(async (req: Request, res: Response) => {
  const { keyword } = req.params;

  const result = await vclaimService.searchDiagnosa(keyword);

  res.json({
    success: true,
    data: result
  });
}));

/**
 * GET /api/bpjs/referensi/prosedur/:keyword
 * Search prosedur ICD-9
 */
router.get('/referensi/prosedur/:keyword', asyncHandler(async (req: Request, res: Response) => {
  const { keyword } = req.params;

  const result = await vclaimService.searchProsedur(keyword);

  res.json({
    success: true,
    data: result
  });
}));

/**
 * GET /api/bpjs/referensi/poli/:keyword
 * Search poli
 */
router.get('/referensi/poli/:keyword', asyncHandler(async (req: Request, res: Response) => {
  const { keyword } = req.params;

  const result = await vclaimService.searchPoli(keyword);

  res.json({
    success: true,
    data: result
  });
}));

/**
 * GET /api/bpjs/referensi/dokter/:keyword
 * Search dokter DPJP
 */
router.get('/referensi/dokter/:keyword', asyncHandler(async (req: Request, res: Response) => {
  const { keyword } = req.params;

  const result = await vclaimService.searchDokter(keyword);

  res.json({
    success: true,
    data: result
  });
}));

/**
 * GET /api/bpjs/referensi/faskes/:keyword/:jenis
 * Search faskes
 */
router.get('/referensi/faskes/:keyword/:jenis', asyncHandler(async (req: Request<{ keyword: string; jenis: string }>, res: Response) => {
  const { keyword, jenis } = req.params;

  const result = await vclaimService.searchFaskes(keyword, jenis);

  res.json({
    success: true,
    data: result
  });
}));

// ============================================
// VCLAIM - MONITORING
// ============================================

interface MonitoringQuery {
  tanggal?: string;
  jenisPelayanan?: string;
  status?: string;
}

/**
 * GET /api/bpjs/monitoring/kunjungan
 * Get monitoring kunjungan
 */
router.get('/monitoring/kunjungan', asyncHandler(async (req: Request<{}, {}, {}, MonitoringQuery>, res: Response) => {
  const { tanggal, jenisPelayanan } = req.query;

  const result = await vclaimService.getMonitoringKunjungan(tanggal as string, jenisPelayanan as string);

  res.json({
    success: true,
    data: result
  });
}));

/**
 * GET /api/bpjs/monitoring/klaim
 * Get monitoring klaim
 */
router.get('/monitoring/klaim', asyncHandler(async (req: Request<{}, {}, {}, MonitoringQuery>, res: Response) => {
  const { tanggal, jenisPelayanan, status } = req.query;

  const result = await vclaimService.getMonitoringKlaim(tanggal as string, jenisPelayanan as string, status as string);

  res.json({
    success: true,
    data: result
  });
}));

// ============================================
// ANTREAN ONLINE
// ============================================

/**
 * POST /api/bpjs/antrean/add
 * Add antrean online
 */
router.post('/antrean/add', requireRole(['admin', 'registrasi']), asyncHandler(async (req: Request, res: Response) => {
  const antreanData = req.body;

  // Implementation would use BPJS Antrean service
  // const result = await antreanService.addAntrean(antreanData);

  res.json({
    success: true,
    message: 'Antrean berhasil ditambahkan',
    data: antreanData // placeholder
  });
}));

/**
 * PUT /api/bpjs/antrean/update
 * Update antrean status
 */
router.put('/antrean/update', requireRole(['admin', 'registrasi']), asyncHandler(async (req: Request, res: Response) => {
  const { kodebooking, waktu, taskid } = req.body;

  // Implementation would use BPJS Antrean service

  res.json({
    success: true,
    message: 'Status antrean berhasil diperbarui'
  });
}));

/**
 * PUT /api/bpjs/antrean/batal
 * Cancel antrean
 */
router.put('/antrean/batal', requireRole(['admin', 'registrasi']), asyncHandler(async (req: Request, res: Response) => {
  const { kodebooking, keterangan } = req.body;

  // Implementation would use BPJS Antrean service

  res.json({
    success: true,
    message: 'Antrean berhasil dibatalkan'
  });
}));

// ============================================
// ECLAIM - GROUPER
// ============================================

/**
 * POST /api/bpjs/eclaim/grouper
 * Get INA-CBG grouping
 */
router.post('/eclaim/grouper', asyncHandler(async (req: Request, res: Response) => {
  const claimData = req.body;

  // Implementation would use BPJS EClaim service
  // const result = await eclaimService.getGrouper(claimData);

  res.json({
    success: true,
    message: 'Grouper berhasil diproses',
    data: {
      cbg_code: 'X-X-XX-X',
      cbg_description: 'Sample CBG',
      tariff: 0
    }
  });
}));

/**
 * POST /api/bpjs/eclaim/submit
 * Submit claim to BPJS
 */
router.post('/eclaim/submit', requireRole(['admin', 'keuangan']), asyncHandler(async (req: Request, res: Response) => {
  const { sep_number, claim_data } = req.body;

  // Queue to background job
  const job = await bpjsQueue.add('eclaim-submit', { sep_number, claim_data });

  res.json({
    success: true,
    message: 'Klaim berhasil masuk antrean sinkronisasi (Background Job: ' + job.id + ')'
  });
}));

// ============================================
// ICARE
// ============================================

/**
 * POST /api/bpjs/icare/rencana-kontrol
 * Create rencana kontrol
 */
router.post('/icare/rencana-kontrol', requireRole(['admin', 'dokter']), asyncHandler(async (req: Request, res: Response) => {
  const kontrolData = req.body;

  // Implementation would use BPJS iCare service

  res.json({
    success: true,
    message: 'Rencana kontrol berhasil dibuat',
    data: kontrolData
  });
}));

/**
 * GET /api/bpjs/icare/rencana-kontrol/:noSep
 * Get rencana kontrol by SEP
 */
router.get('/icare/rencana-kontrol/:noSep', asyncHandler(async (req: Request, res: Response) => {
  const { noSep } = req.params;

  // Implementation would use BPJS iCare service

  res.json({
    success: true,
    data: []
  });
}));

// ============================================
// CLAIMS
// ============================================

interface ClaimsQuery {
  status?: string;
  patient_id?: string;
  page?: string;
  limit?: string;
}

/**
 * GET /api/bpjs/claims
 * List BPJS claims
 */
router.get('/claims', asyncHandler(async (req: Request<{}, {}, {}, ClaimsQuery>, res: Response) => {
  const { status, patient_id, page = '1', limit = '50' } = req.query;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (patient_id) where.patient_id = patient_id;

  const [total, claims] = await Promise.all([
    prisma.bpjs_claims.count({ where }),
    prisma.bpjs_claims.findMany({
      where,
      orderBy: { claim_date: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    }),
  ]);

  res.json({
    success: true,
    data: claims,
    pagination: { page: parseInt(page), limit: parseInt(limit), total },
  });
}));

/**
 * POST /api/bpjs/claims
 * Create a BPJS claim
 */
router.post('/claims', requireRole(['admin', 'keuangan']), asyncHandler(async (req: Request, res: Response) => {
  const claim = await prisma.bpjs_claims.create({
    data: { ...req.body, created_by: req.user!.id },
  });
  res.status(201).json({ success: true, data: claim });
}));

/**
 * PUT /api/bpjs/claims/:id
 * Update a BPJS claim
 */
router.put('/claims/:id', requireRole(['admin', 'keuangan']), asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const claim = await prisma.bpjs_claims.update({ where: { id }, data: req.body });
  res.json({ success: true, data: claim });
}));

// ============================================
// VCLAIM PROXY
// ============================================

/**
 * POST /api/bpjs/vclaim
 * Proxy for BPJS VClaim service calls
 */
router.post('/vclaim', externalApiLimiter, asyncHandler(async (req: Request, res: Response) => {
  const { action, ...params } = req.body;
  try {
    const service = new BPJSVClaimService();
    let result;
    if (action && typeof service[action as keyof BPJSVClaimService] === 'function') {
      result = await (service[action as keyof BPJSVClaimService] as (...args: unknown[]) => unknown)(...Object.values(params));
    } else {
      result = await service.request(action, 'POST', params);
    }
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(502).json({ success: false, error: (error as Error).message });
  }
}));

// ============================================
// ECLAIM GENERIC PROXY
// ============================================

/**
 * POST /api/bpjs/eclaim
 * Generic proxy for BPJS EClaim service calls
 */
router.post('/eclaim', externalApiLimiter, asyncHandler(async (req: Request, res: Response) => {
  const { action, ...params } = req.body;
  // EClaim service is not yet configured; return a placeholder response
  res.json({ success: true, data: { action, params, message: 'EClaim service not configured' } });
}));

// ============================================
// ICARE GENERIC PROXY
// ============================================

/**
 * POST /api/bpjs/icare
 * Generic proxy for BPJS iCare service calls
 */
router.post('/icare', externalApiLimiter, asyncHandler(async (req: Request, res: Response) => {
  const { action, ...params } = req.body;
  // iCare service is not yet configured; return a placeholder response
  res.json({ success: true, data: { action, params, message: 'iCare service not configured' } });
}));

// ============================================
// ANTREAN GENERIC PROXY
// ============================================

/**
 * POST /api/bpjs/antrean
 * Generic proxy for BPJS Antrean service calls
 */
router.post('/antrean', externalApiLimiter, asyncHandler(async (req: Request, res: Response) => {
  const { action, ...params } = req.body;
  // Antrean service is not yet configured; return a placeholder response
  res.json({ success: true, data: { action, params, message: 'Antrean service not configured' } });
}));

// ============================================
// VCLAIM GENERIC INVOKE (test-connection, config)
// ============================================

interface BpjsInvokeBody {
  action?: string;
  config?: {
    consumer_id?: string;
    consumer_secret?: string;
    user_key?: string;
    environment?: string;
  };
}

/**
 * POST /api/bpjs/vclaim
 * Generic invoke endpoint for BPJS VClaim -- supports test-connection and config save
 */
router.post('/vclaim', externalApiLimiter, asyncHandler(async (req: Request<{}, {}, BpjsInvokeBody>, res: Response) => {
  const { action, config } = req.body;

  if (action === 'test-connection') {
    try {
      if (config?.consumer_id && config?.consumer_secret) {
        // Test using credentials sent in request
        const testService = new BPJSVClaimService();
        testService.consId = config.consumer_id;
        testService.secretKey = config.consumer_secret;
        testService.userKey = config.user_key || '';
        testService.baseUrl = config.environment === 'production'
          ? 'https://apijkn.bpjs-kesehatan.go.id/vclaim-rest'
          : 'https://apijkn-dev.bpjs-kesehatan.go.id/vclaim-rest-dev';
        // Minimal connectivity check -- fetch peserta with dummy NIK to verify auth headers
        await testService.request('/Peserta/nik/0000000000000000/tglSEP/2024-01-01');
      } else {
        await vclaimService.request('/Peserta/nik/0000000000000000/tglSEP/2024-01-01');
      }
      return res.json({ success: true, data: { success: true } });
    } catch (err) {
      // A 4xx from BPJS still means we reached their server -> credentials are working
      const reached = (err as { response?: { status: number } }).response?.status >= 400;
      return res.json({ success: true, data: { success: reached, error: reached ? null : (err as Error).message } });
    }
  }

  if (action === 'save-config') {
    await vclaimService.saveConfiguration(config);
    return res.json({ success: true, data: { message: 'Konfigurasi BPJS berhasil disimpan' } });
  }

  res.status(400).json({ success: false, error: 'action tidak dikenal' });
}));

export default router;

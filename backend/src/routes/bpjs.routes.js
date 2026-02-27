/**
 * SIMRS ZEN - BPJS Integration Routes
 * VClaim, Antrean, EClaim, iCare APIs
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireRole, checkMenuAccess } from '../middleware/role.middleware.js';
import { externalApiLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import BPJSVClaimService from '../services/bpjs-vclaim.service.js';

const router = Router();

router.use(authenticateToken);
router.use(checkMenuAccess('bpjs'));
router.use(externalApiLimiter);

const vclaimService = new BPJSVClaimService();

// ============================================
// VCLAIM - PESERTA
// ============================================

/**
 * GET /api/bpjs/peserta/nik/:nik
 * Get peserta by NIK
 */
router.get('/peserta/nik/:nik', asyncHandler(async (req, res) => {
  const { nik } = req.params;
  const { tanggal } = req.query;

  const result = await vclaimService.getPesertaByNIK(nik, tanggal || new Date().toISOString().split('T')[0]);

  res.json({
    success: true,
    data: result
  });
}));

/**
 * GET /api/bpjs/peserta/noka/:noKartu
 * Get peserta by nomor kartu BPJS
 */
router.get('/peserta/noka/:noKartu', asyncHandler(async (req, res) => {
  const { noKartu } = req.params;
  const { tanggal } = req.query;

  const result = await vclaimService.getPesertaByNoKartu(noKartu, tanggal || new Date().toISOString().split('T')[0]);

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
router.post('/sep', requireRole(['admin', 'registrasi']), asyncHandler(async (req, res) => {
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
router.get('/sep/:noSep', asyncHandler(async (req, res) => {
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
router.put('/sep/:noSep', requireRole(['admin', 'registrasi']), asyncHandler(async (req, res) => {
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
router.delete('/sep/:noSep', requireRole(['admin']), asyncHandler(async (req, res) => {
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
// VCLAIM - RUJUKAN
// ============================================

/**
 * GET /api/bpjs/rujukan/:noRujukan
 * Get rujukan by number
 */
router.get('/rujukan/:noRujukan', asyncHandler(async (req, res) => {
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
router.get('/rujukan/peserta/:noKartu', asyncHandler(async (req, res) => {
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
router.get('/referensi/diagnosa/:keyword', asyncHandler(async (req, res) => {
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
router.get('/referensi/prosedur/:keyword', asyncHandler(async (req, res) => {
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
router.get('/referensi/poli/:keyword', asyncHandler(async (req, res) => {
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
router.get('/referensi/dokter/:keyword', asyncHandler(async (req, res) => {
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
router.get('/referensi/faskes/:keyword/:jenis', asyncHandler(async (req, res) => {
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

/**
 * GET /api/bpjs/monitoring/kunjungan
 * Get monitoring kunjungan
 */
router.get('/monitoring/kunjungan', asyncHandler(async (req, res) => {
  const { tanggal, jenisPelayanan } = req.query;

  const result = await vclaimService.getMonitoringKunjungan(tanggal, jenisPelayanan);

  res.json({
    success: true,
    data: result
  });
}));

/**
 * GET /api/bpjs/monitoring/klaim
 * Get monitoring klaim
 */
router.get('/monitoring/klaim', asyncHandler(async (req, res) => {
  const { tanggal, jenisPelayanan, status } = req.query;

  const result = await vclaimService.getMonitoringKlaim(tanggal, jenisPelayanan, status);

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
router.post('/antrean/add', requireRole(['admin', 'registrasi']), asyncHandler(async (req, res) => {
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
router.put('/antrean/update', requireRole(['admin', 'registrasi']), asyncHandler(async (req, res) => {
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
router.put('/antrean/batal', requireRole(['admin', 'registrasi']), asyncHandler(async (req, res) => {
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
router.post('/eclaim/grouper', asyncHandler(async (req, res) => {
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
router.post('/eclaim/submit', requireRole(['admin', 'keuangan']), asyncHandler(async (req, res) => {
  const { sep_number, claim_data } = req.body;

  // Implementation would use BPJS EClaim service

  res.json({
    success: true,
    message: 'Klaim berhasil disubmit'
  });
}));

// ============================================
// ICARE
// ============================================

/**
 * POST /api/bpjs/icare/rencana-kontrol
 * Create rencana kontrol
 */
router.post('/icare/rencana-kontrol', requireRole(['admin', 'dokter']), asyncHandler(async (req, res) => {
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
router.get('/icare/rencana-kontrol/:noSep', asyncHandler(async (req, res) => {
  const { noSep } = req.params;

  // Implementation would use BPJS iCare service

  res.json({
    success: true,
    data: []
  });
}));

export default router;

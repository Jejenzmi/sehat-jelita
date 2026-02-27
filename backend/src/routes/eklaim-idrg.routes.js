/**
 * SIMRS ZEN - E-Klaim IDRG Routes
 * Full bridging for all 31 E-Klaim IDRG API endpoints
 * 
 * E-Klaim IDRG routes
 */

import { Router } from 'express';
import { requireRole, checkMenuAccess } from '../middleware/role.middleware.js';
import { externalApiLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import EklaimIDRGService from '../services/eklaim-idrg.service.js';

const router = Router();

router.use(checkMenuAccess('bpjs'));
router.use(externalApiLimiter);

const eklaimService = new EklaimIDRGService();

// ============================================
// CLAIM MANAGEMENT
// ============================================

/** POST /api/eklaim/new-claim - #00 NEW CLAIM */
router.post('/new-claim', requireRole(['admin', 'registrasi']), asyncHandler(async (req, res) => {
  const result = await eklaimService.send('new_claim', req.body);
  res.json({ success: true, data: result });
}));

/** POST /api/eklaim/set-claim-data - #01 SET CLAIM DATA */
router.post('/set-claim-data', requireRole(['admin', 'registrasi', 'keuangan']), asyncHandler(async (req, res) => {
  const result = await eklaimService.send('set_claim_data', req.body);
  res.json({ success: true, data: result });
}));

/** POST /api/eklaim/get-claim-data - #21 GET CLAIM DATA */
router.post('/get-claim-data', asyncHandler(async (req, res) => {
  const result = await eklaimService.send('get_claim_data', req.body);
  res.json({ success: true, data: result });
}));

/** POST /api/eklaim/update-patient - UTILS: UPDATE PATIENT */
router.post('/update-patient', requireRole(['admin', 'registrasi']), asyncHandler(async (req, res) => {
  const result = await eklaimService.send('update_patient', req.body);
  res.json({ success: true, data: result });
}));

/** DELETE /api/eklaim/delete-patient - UTILS: DELETE PATIENT */
router.post('/delete-patient', requireRole(['admin']), asyncHandler(async (req, res) => {
  const result = await eklaimService.send('delete_patient', req.body);
  res.json({ success: true, data: result });
}));

/** DELETE /api/eklaim/delete-claim-data - UTILS: DELETE CLAIM DATA */
router.post('/delete-claim-data', requireRole(['admin']), asyncHandler(async (req, res) => {
  const result = await eklaimService.send('delete_claim_data', req.body);
  res.json({ success: true, data: result });
}));

// ============================================
// IDRG ENDPOINTS (#02 - #09)
// ============================================

/** POST /api/eklaim/idrg/diagnosa/set - #02 IDRG DIAGNOSA SET */
router.post('/idrg/diagnosa/set', requireRole(['admin', 'dokter', 'koder']), asyncHandler(async (req, res) => {
  const result = await eklaimService.send('set_diagnosa_idrg', req.body);
  res.json({ success: true, data: result });
}));

/** POST /api/eklaim/idrg/diagnosa/get - #03 IDRG DIAGNOSA GET */
router.post('/idrg/diagnosa/get', asyncHandler(async (req, res) => {
  const result = await eklaimService.send('get_diagnosa_idrg', req.body);
  res.json({ success: true, data: result });
}));

/** POST /api/eklaim/idrg/procedure/set - #04 IDRG PROCEDURE SET */
router.post('/idrg/procedure/set', requireRole(['admin', 'dokter', 'koder']), asyncHandler(async (req, res) => {
  const result = await eklaimService.send('set_procedure_idrg', req.body);
  res.json({ success: true, data: result });
}));

/** POST /api/eklaim/idrg/procedure/get - #05 IDRG PROCEDURE GET */
router.post('/idrg/procedure/get', asyncHandler(async (req, res) => {
  const result = await eklaimService.send('get_procedure_idrg', req.body);
  res.json({ success: true, data: result });
}));

/** POST /api/eklaim/idrg/grouper - #06 GROUPING IDRG */
router.post('/idrg/grouper', requireRole(['admin', 'koder', 'keuangan']), asyncHandler(async (req, res) => {
  const result = await eklaimService.send('grouper_idrg', req.body);
  res.json({ success: true, data: result });
}));

/** POST /api/eklaim/idrg/final - #07 FINAL IDRG */
router.post('/idrg/final', requireRole(['admin', 'koder']), asyncHandler(async (req, res) => {
  const result = await eklaimService.send('final_idrg', req.body);
  res.json({ success: true, data: result });
}));

/** POST /api/eklaim/idrg/reedit - #08 RE-EDIT IDRG */
router.post('/idrg/reedit', requireRole(['admin', 'koder']), asyncHandler(async (req, res) => {
  const result = await eklaimService.send('reedit_idrg', req.body);
  res.json({ success: true, data: result });
}));

/** POST /api/eklaim/idrg/to-inacbg - #09 IDRG TO INACBG IMPORT */
router.post('/idrg/to-inacbg', requireRole(['admin', 'koder']), asyncHandler(async (req, res) => {
  const result = await eklaimService.send('idrg_to_inacbg', req.body);
  res.json({ success: true, data: result });
}));

// ============================================
// INACBG ENDPOINTS (#10 - #17)
// ============================================

/** POST /api/eklaim/inacbg/diagnosa/set - #10 INACBG DIAGNOSA SET */
router.post('/inacbg/diagnosa/set', requireRole(['admin', 'dokter', 'koder']), asyncHandler(async (req, res) => {
  const result = await eklaimService.send('set_diagnosa', req.body);
  res.json({ success: true, data: result });
}));

/** POST /api/eklaim/inacbg/diagnosa/get - #11 INACBG DIAGNOSA GET */
router.post('/inacbg/diagnosa/get', asyncHandler(async (req, res) => {
  const result = await eklaimService.send('get_diagnosa', req.body);
  res.json({ success: true, data: result });
}));

/** POST /api/eklaim/inacbg/procedure/set - #12 INACBG PROCEDURE SET */
router.post('/inacbg/procedure/set', requireRole(['admin', 'dokter', 'koder']), asyncHandler(async (req, res) => {
  const result = await eklaimService.send('set_procedure', req.body);
  res.json({ success: true, data: result });
}));

/** POST /api/eklaim/inacbg/procedure/get - #13 INACBG PROCEDURE GET */
router.post('/inacbg/procedure/get', asyncHandler(async (req, res) => {
  const result = await eklaimService.send('get_procedure', req.body);
  res.json({ success: true, data: result });
}));

/** POST /api/eklaim/inacbg/grouper - #14 GROUPING INACBG STAGE 1 */
router.post('/inacbg/grouper', requireRole(['admin', 'koder', 'keuangan']), asyncHandler(async (req, res) => {
  const result = await eklaimService.send('grouper', req.body);
  res.json({ success: true, data: result });
}));

/** POST /api/eklaim/inacbg/grouper-stage2 - #15 GROUPING INACBG STAGE 2 */
router.post('/inacbg/grouper-stage2', requireRole(['admin', 'koder', 'keuangan']), asyncHandler(async (req, res) => {
  const result = await eklaimService.send('grouper_stage2', req.body);
  res.json({ success: true, data: result });
}));

/** POST /api/eklaim/inacbg/final - #16 FINAL INACBG */
router.post('/inacbg/final', requireRole(['admin', 'koder']), asyncHandler(async (req, res) => {
  const result = await eklaimService.send('final', req.body);
  res.json({ success: true, data: result });
}));

/** POST /api/eklaim/inacbg/reedit - #17 RE-EDIT INACBG */
router.post('/inacbg/reedit', requireRole(['admin', 'koder']), asyncHandler(async (req, res) => {
  const result = await eklaimService.send('reedit', req.body);
  res.json({ success: true, data: result });
}));

// ============================================
// CLAIM FINALIZATION (#18 - #20)
// ============================================

/** POST /api/eklaim/claim/final - #18 CLAIM FINAL */
router.post('/claim/final', requireRole(['admin', 'koder']), asyncHandler(async (req, res) => {
  const result = await eklaimService.send('claim_final', req.body);
  res.json({ success: true, data: result });
}));

/** POST /api/eklaim/claim/reedit - #19 CLAIM RE-EDIT */
router.post('/claim/reedit', requireRole(['admin', 'koder']), asyncHandler(async (req, res) => {
  const result = await eklaimService.send('claim_reedit', req.body);
  res.json({ success: true, data: result });
}));

/** POST /api/eklaim/claim/send - #20 CLAIM SEND */
router.post('/claim/send', requireRole(['admin', 'koder', 'keuangan']), asyncHandler(async (req, res) => {
  const result = await eklaimService.send('claim_send', req.body);
  res.json({ success: true, data: result });
}));

/** POST /api/eklaim/claim/cetak - #26 CETAK KLAIM */
router.post('/claim/cetak', asyncHandler(async (req, res) => {
  const result = await eklaimService.send('cetak_klaim', req.body);
  res.json({ success: true, data: result });
}));

// ============================================
// SEARCH ENDPOINTS (#22 - #25)
// ============================================

/** POST /api/eklaim/search/diagnosa-idrg - #22 IDRG SEARCH DIAGNOSA */
router.post('/search/diagnosa-idrg', asyncHandler(async (req, res) => {
  const result = await eklaimService.send('search_diagnosa_idrg', req.body);
  res.json({ success: true, data: result });
}));

/** POST /api/eklaim/search/procedure-idrg - #23 IDRG SEARCH PROCEDURES */
router.post('/search/procedure-idrg', asyncHandler(async (req, res) => {
  const result = await eklaimService.send('search_procedure_idrg', req.body);
  res.json({ success: true, data: result });
}));

/** POST /api/eklaim/search/diagnosa-inacbg - #24 INACBG SEARCH DIAGNOSA */
router.post('/search/diagnosa-inacbg', asyncHandler(async (req, res) => {
  const result = await eklaimService.send('search_diagnosa', req.body);
  res.json({ success: true, data: result });
}));

/** POST /api/eklaim/search/procedure-inacbg - #25 INACBG SEARCH PROCEDURES */
router.post('/search/procedure-inacbg', asyncHandler(async (req, res) => {
  const result = await eklaimService.send('search_procedure', req.body);
  res.json({ success: true, data: result });
}));

// ============================================
// ENCOUNTER RME
// ============================================

/** POST /api/eklaim/encounter-rme - SET ENCOUNTER RME */
router.post('/encounter-rme', requireRole(['admin', 'dokter', 'registrasi']), asyncHandler(async (req, res) => {
  const result = await eklaimService.send('set_encounter_rme', req.body);
  res.json({ success: true, data: result });
}));

export default router;

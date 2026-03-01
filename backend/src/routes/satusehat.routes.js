/**
 * SIMRS ZEN - SATU SEHAT Integration Routes
 * FHIR R4 compliant healthcare data exchange
 */

import { Router } from 'express';
import { requireRole, checkMenuAccess } from '../middleware/role.middleware.js';
import { externalApiLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import SatuSehatService from '../services/satusehat.service.js';

const router = Router();

router.use(checkMenuAccess('satusehat'));
router.use(externalApiLimiter);

const satusehatService = new SatuSehatService();

// ============================================
// CONFIGURATION
// ============================================

/**
 * POST /api/satusehat/config
 * Save/Update SATU SEHAT configuration
 */
router.post('/config', requireRole(['admin']), asyncHandler(async (req, res) => {
  const { org_id, environment, client_id, client_secret } = req.body;

  const validEnvironments = ['sandbox', 'staging', 'production'];
  if (environment !== undefined && !validEnvironments.includes(environment)) {
    throw new ApiError(400, `Environment tidak valid. Pilihan: ${validEnvironments.join(', ')}`, 'INVALID_ENVIRONMENT');
  }

  if (!org_id && !environment && !client_id && !client_secret) {
    throw new ApiError(400, 'Minimal satu field harus diisi', 'MISSING_FIELDS');
  }

  satusehatService.saveConfiguration({ org_id, environment, client_id, client_secret });

  res.json({
    success: true,
    message: 'Konfigurasi SATU SEHAT berhasil disimpan'
  });
}));

/**
 * GET /api/satusehat/config
 * Get current SATU SEHAT configuration
 */
router.get('/config', requireRole(['admin']), asyncHandler(async (req, res) => {
  const config = satusehatService.getConfiguration();

  res.json({
    success: true,
    data: config
  });
}));

// ============================================
// AUTHENTICATION
// ============================================

/**
 * GET /api/satusehat/token
 * Get or refresh access token
 */
router.get('/token', asyncHandler(async (req, res) => {
  const token = await satusehatService.getAccessToken();

  res.json({
    success: true,
    data: {
      access_token: token,
      expires_in: 3600
    }
  });
}));

// ============================================
// PATIENT
// ============================================

/**
 * GET /api/satusehat/patient/nik/:nik
 * Get patient by NIK
 */
router.get('/patient/nik/:nik', asyncHandler(async (req, res) => {
  const { nik } = req.params;

  const result = await satusehatService.getPatientByNIK(nik);

  res.json({
    success: true,
    data: result
  });
}));

/**
 * GET /api/satusehat/patient/:id
 * Get patient by SATU SEHAT ID
 */
router.get('/patient/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await satusehatService.getPatientById(id);

  res.json({
    success: true,
    data: result
  });
}));

// ============================================
// PRACTITIONER
// ============================================

/**
 * GET /api/satusehat/practitioner/nik/:nik
 * Get practitioner by NIK
 */
router.get('/practitioner/nik/:nik', asyncHandler(async (req, res) => {
  const { nik } = req.params;

  const result = await satusehatService.getPractitionerByNIK(nik);

  res.json({
    success: true,
    data: result
  });
}));

// ============================================
// ORGANIZATION
// ============================================

/**
 * GET /api/satusehat/organization/:id
 * Get organization by ID
 */
router.get('/organization/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await satusehatService.getOrganizationById(id);

  res.json({
    success: true,
    data: result
  });
}));

// ============================================
// LOCATION
// ============================================

/**
 * GET /api/satusehat/location/:id
 * Get location by ID
 */
router.get('/location/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await satusehatService.getLocationById(id);

  res.json({
    success: true,
    data: result
  });
}));

/**
 * POST /api/satusehat/location
 * Create/Update location
 */
router.post('/location', requireRole(['admin']), asyncHandler(async (req, res) => {
  const locationData = req.body;

  const result = await satusehatService.createLocation(locationData);

  res.json({
    success: true,
    message: 'Location berhasil disimpan',
    data: result
  });
}));

// ============================================
// ENCOUNTER
// ============================================

/**
 * POST /api/satusehat/encounter
 * Create encounter (kunjungan)
 */
router.post('/encounter', requireRole(['admin', 'registrasi', 'dokter']), asyncHandler(async (req, res) => {
  const encounterData = req.body;

  const result = await satusehatService.createEncounter(encounterData);

  res.json({
    success: true,
    message: 'Encounter berhasil dikirim',
    data: result
  });
}));

/**
 * PUT /api/satusehat/encounter/:id
 * Update encounter status
 */
router.put('/encounter/:id', requireRole(['admin', 'dokter']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const result = await satusehatService.updateEncounter(id, updateData);

  res.json({
    success: true,
    message: 'Encounter berhasil diperbarui',
    data: result
  });
}));

/**
 * GET /api/satusehat/encounter/:id
 * Get encounter by ID
 */
router.get('/encounter/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await satusehatService.getEncounterById(id);

  res.json({
    success: true,
    data: result
  });
}));

// ============================================
// CONDITION (DIAGNOSA)
// ============================================

/**
 * POST /api/satusehat/condition
 * Create condition (diagnosa)
 */
router.post('/condition', requireRole(['admin', 'dokter']), asyncHandler(async (req, res) => {
  const conditionData = req.body;

  const result = await satusehatService.createCondition(conditionData);

  res.json({
    success: true,
    message: 'Condition berhasil dikirim',
    data: result
  });
}));

// ============================================
// OBSERVATION
// ============================================

/**
 * POST /api/satusehat/observation
 * Create observation (vital signs, lab results, etc.)
 */
router.post('/observation', requireRole(['admin', 'dokter', 'perawat', 'laboratorium']), asyncHandler(async (req, res) => {
  const observationData = req.body;

  const result = await satusehatService.createObservation(observationData);

  res.json({
    success: true,
    message: 'Observation berhasil dikirim',
    data: result
  });
}));

// ============================================
// PROCEDURE
// ============================================

/**
 * POST /api/satusehat/procedure
 * Create procedure (tindakan)
 */
router.post('/procedure', requireRole(['admin', 'dokter']), asyncHandler(async (req, res) => {
  const procedureData = req.body;

  const result = await satusehatService.createProcedure(procedureData);

  res.json({
    success: true,
    message: 'Procedure berhasil dikirim',
    data: result
  });
}));

// ============================================
// MEDICATION
// ============================================

/**
 * POST /api/satusehat/medication-request
 * Create medication request (resep)
 */
router.post('/medication-request', requireRole(['admin', 'dokter']), asyncHandler(async (req, res) => {
  const medicationData = req.body;

  const result = await satusehatService.createMedicationRequest(medicationData);

  res.json({
    success: true,
    message: 'Medication request berhasil dikirim',
    data: result
  });
}));

/**
 * POST /api/satusehat/medication-dispense
 * Create medication dispense
 */
router.post('/medication-dispense', requireRole(['admin', 'farmasi']), asyncHandler(async (req, res) => {
  const dispenseData = req.body;

  const result = await satusehatService.createMedicationDispense(dispenseData);

  res.json({
    success: true,
    message: 'Medication dispense berhasil dikirim',
    data: result
  });
}));

// ============================================
// COMPOSITION
// ============================================

/**
 * POST /api/satusehat/composition
 * Create composition (resume medis)
 */
router.post('/composition', requireRole(['admin', 'dokter']), asyncHandler(async (req, res) => {
  const compositionData = req.body;

  const result = await satusehatService.createComposition(compositionData);

  res.json({
    success: true,
    message: 'Composition berhasil dikirim',
    data: result
  });
}));

// ============================================
// ALLERGY INTOLERANCE
// ============================================

/**
 * POST /api/satusehat/allergy-intolerance
 * Create allergy record
 */
router.post('/allergy-intolerance', requireRole(['admin', 'dokter', 'perawat']), asyncHandler(async (req, res) => {
  const allergyData = req.body;

  const result = await satusehatService.createAllergyIntolerance(allergyData);

  res.json({
    success: true,
    message: 'Allergy record berhasil dikirim',
    data: result
  });
}));

// ============================================
// SERVICE REQUEST
// ============================================

/**
 * POST /api/satusehat/service-request
 * Create service request (order lab/radiologi)
 */
router.post('/service-request', requireRole(['admin', 'dokter']), asyncHandler(async (req, res) => {
  const serviceData = req.body;

  const result = await satusehatService.createServiceRequest(serviceData);

  res.json({
    success: true,
    message: 'Service request berhasil dikirim',
    data: result
  });
}));

// ============================================
// SPECIMEN
// ============================================

/**
 * POST /api/satusehat/specimen
 * Create specimen (sampel lab)
 */
router.post('/specimen', requireRole(['admin', 'laboratorium']), asyncHandler(async (req, res) => {
  const specimenData = req.body;

  const result = await satusehatService.createSpecimen(specimenData);

  res.json({
    success: true,
    message: 'Specimen berhasil dikirim',
    data: result
  });
}));

// ============================================
// DIAGNOSTIC REPORT
// ============================================

/**
 * POST /api/satusehat/diagnostic-report
 * Create diagnostic report (hasil lab/radiologi)
 */
router.post('/diagnostic-report', requireRole(['admin', 'laboratorium', 'radiologi']), asyncHandler(async (req, res) => {
  const reportData = req.body;

  const result = await satusehatService.createDiagnosticReport(reportData);

  res.json({
    success: true,
    message: 'Diagnostic report berhasil dikirim',
    data: result
  });
}));

// ============================================
// SYNC UTILITIES
// ============================================

/**
 * POST /api/satusehat/sync/visit/:visitId
 * Sync complete visit data to SATU SEHAT
 */
router.post('/sync/visit/:visitId', requireRole(['admin']), asyncHandler(async (req, res) => {
  const { visitId } = req.params;

  // Get visit data with all related records
  const visit = await prisma.visits.findUnique({
    where: { id: visitId },
    include: {
      patients: true,
      doctors: true,
      departments: true,
      medical_records: true,
      prescriptions: { include: { prescription_items: true } },
      lab_orders: { include: { lab_results: true } }
    }
  });

  if (!visit) {
    throw new ApiError(404, 'Kunjungan tidak ditemukan', 'VISIT_NOT_FOUND');
  }

  // Sync encounter
  const encounterResult = await satusehatService.createEncounter({
    // Map visit data to FHIR Encounter
    patient_ihs_id: visit.patients.satusehat_id,
    practitioner_ihs_id: visit.doctors?.satusehat_id,
    organization_id: process.env.SATU_SEHAT_ORG_ID,
    period_start: visit.visit_date,
    period_end: visit.discharge_date
  });

  // Sync conditions (diagnoses)
  const conditionResults = [];
  if (visit.diagnosis) {
    const conditionResult = await satusehatService.createCondition({
      encounter_id: encounterResult.id,
      patient_ihs_id: visit.patients.satusehat_id,
      code: visit.icd10_code,
      display: visit.diagnosis
    });
    conditionResults.push(conditionResult);
  }

  // Sync observations (vital signs from medical records)
  const observationResults = [];
  for (const record of visit.medical_records) {
    if (record.vital_signs) {
      // Create observations for each vital sign
      // Implementation details...
    }
  }

  res.json({
    success: true,
    message: 'Data kunjungan berhasil disinkronkan',
    data: {
      encounter: encounterResult,
      conditions: conditionResults,
      observations: observationResults
    }
  });
}));

/**
 * GET /api/satusehat/sync/status
 * Get sync status overview
 */
router.get('/sync/status', asyncHandler(async (req, res) => {
  // Get counts of synced vs unsynced records
  const [
    totalVisits,
    syncedVisits,
    pendingVisits
  ] = await Promise.all([
    prisma.visits.count(),
    prisma.visits.count({ where: { satusehat_encounter_id: { not: null } } }),
    prisma.visits.count({ where: { satusehat_encounter_id: null, status: 'discharged' } })
  ]);

  res.json({
    success: true,
    data: {
      total_visits: totalVisits,
      synced_visits: syncedVisits,
      pending_visits: pendingVisits,
      sync_percentage: totalVisits > 0 ? Math.round((syncedVisits / totalVisits) * 100) : 0
    }
  });
}));

export default router;

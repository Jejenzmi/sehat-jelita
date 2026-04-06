/**
 * SIMRS ZEN - Clinical Decision Support Routes
 * Real-time drug safety checking for prescriptions
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { searchRateLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { checkPrescription, checkSingleDrug } from '../services/cds.service.js';

const router = Router();
router.use(authenticateToken);
// CDS checks query the drug interaction DB on every keystroke — limit to 60/min per user
router.use(searchRateLimiter);

/**
 * POST /api/v1/cds/check-prescription
 * Full prescription validation
 * Body: { patient_id, items: [{medicine_id, medicine_name, dosage, frequency, quantity}], diagnosis_codes: [] }
 */
router.post('/check-prescription', asyncHandler(async (req, res) => {
  const { patient_id, items, diagnosis_codes } = req.body;

  if (!patient_id || !Array.isArray(items)) {
    return res.status(400).json({ success: false, error: 'patient_id dan items wajib diisi' });
  }

  const result = await checkPrescription({ patient_id, items, diagnosis_codes });

  res.json({ success: true, data: result });
}));

/**
 * POST /api/v1/cds/check-drug
 * Single drug check (for real-time as doctor types)
 * Body: { patient_id, medicine_id, medicine_name, dosage, existing_medicine_ids: [] }
 */
router.post('/check-drug', asyncHandler(async (req, res) => {
  const { patient_id, medicine_id, medicine_name, dosage, existing_medicine_ids } = req.body;

  if (!patient_id || !medicine_id) {
    return res.status(400).json({ success: false, error: 'patient_id dan medicine_id wajib diisi' });
  }

  const result = await checkSingleDrug({ 
    patient_id, medicine_id, medicine_name, dosage, 
    existing_medicine_ids: existing_medicine_ids || [] 
  });

  res.json({ success: true, data: result });
}));

export default router;

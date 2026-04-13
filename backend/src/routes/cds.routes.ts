/**
 * SIMRS ZEN - Clinical Decision Support Routes
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { searchRateLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { checkPrescription, checkSingleDrug } from '../services/cds.service.js';

const router = Router();
router.use(authenticateToken);
router.use(searchRateLimiter);

interface CheckPrescriptionBody {
  patient_id?: string;
  items?: Array<Record<string, unknown>>;
  diagnosis_codes?: string[];
}

interface CheckDrugBody {
  patient_id?: string;
  medicine_id?: string;
  medicine_name?: string;
  dosage?: string;
  existing_medicine_ids?: string[];
}

// POST /api/v1/cds/check-prescription
router.post('/check-prescription', asyncHandler(async (req: Request<Record<string, string>, any, CheckPrescriptionBody>, res: Response) => {
  const { patient_id, items, diagnosis_codes } = req.body;

  if (!patient_id || !Array.isArray(items)) {
    return res.status(400).json({ success: false, error: 'patient_id dan items wajib diisi' });
  }

  const result = await checkPrescription({ patient_id, items, diagnosis_codes });

  res.json({ success: true, data: result });
}));

// POST /api/v1/cds/check-drug
router.post('/check-drug', asyncHandler(async (req: Request<Record<string, string>, any, CheckDrugBody>, res: Response) => {
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

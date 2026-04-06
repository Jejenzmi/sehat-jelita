/**
 * SIMRS ZEN — ICD-11 & Diagnoses Routes
 *
 * GET  /api/icd11/search?q=&lang=              → autocomplete search
 * GET  /api/icd11/entity/:id                   → entity detail
 * GET  /api/icd11/code/:code                   → code info
 * POST /api/icd11/save-config                  → save credentials to DB
 * POST /api/icd11/test-connection              → ping WHO API
 *
 * --- Diagnoses (linked to medical_records) ---
 * GET  /api/icd11/diagnoses?medical_record_id= → list diagnoses for a record
 * POST /api/icd11/diagnoses                    → add diagnosis
 * PUT  /api/icd11/diagnoses/:id               → update diagnosis
 * DELETE /api/icd11/diagnoses/:id             → remove diagnosis
 *
 * --- Medical Records ---
 * GET  /api/icd11/medical-records?patient_id=&visit_id=   → list records
 * POST /api/icd11/medical-records                          → create record (+ diagnoses)
 * GET  /api/icd11/medical-records/:id                     → get single record with diagnoses
 * PUT  /api/icd11/medical-records/:id                     → update record
 */

import { Router } from 'express';
import { prisma } from '../config/database.js';
import { requireRole } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { searchRateLimiter } from '../middleware/rateLimiter.js';
import * as icd11 from '../services/icd11.service.js';

const router = Router();

// Load saved credentials on first request (lazy init)
let _credentialsLoaded = false;
async function ensureCredentials() {
  if (!_credentialsLoaded) {
    await icd11.loadConfiguration();
    _credentialsLoaded = true;
  }
}

// ============================================================
// ICD-11 API proxy endpoints
// ============================================================

/**
 * GET /api/icd11/search?q=diabetes&lang=id&limit=20
 */
router.get('/search', searchRateLimiter, asyncHandler(async (req, res) => {
  await ensureCredentials();
  const { q, lang = 'id', limit = '20' } = req.query;

  if (!q || q.trim().length < 2) {
    return res.json({ success: true, data: [] });
  }

  const results = await icd11.search(q, lang, parseInt(limit));
  res.json({ success: true, data: results });
}));

/**
 * GET /api/icd11/entity/:id  (id can be URL-encoded WHO URI or numeric)
 */
router.get('/entity/:id(*)', asyncHandler(async (req, res) => {
  await ensureCredentials();
  const entityId = decodeURIComponent(req.params.id);
  const { lang = 'id' } = req.query;
  const data = await icd11.getEntity(entityId, lang);
  res.json({ success: true, data });
}));

/**
 * GET /api/icd11/code/:code
 */
router.get('/code/:code(*)', asyncHandler(async (req, res) => {
  await ensureCredentials();
  const code = decodeURIComponent(req.params.code);
  const { lang = 'id' } = req.query;
  const data = await icd11.getCodeInfo(code, lang);
  res.json({ success: true, data });
}));

/**
 * POST /api/icd11/test-connection  { client_id?, client_secret? }
 * Tests connectivity without persisting or mutating server state.
 * If no credentials are provided, uses the currently configured credentials.
 */
router.post('/test-connection',
  requireRole(['admin']),
  asyncHandler(async (req, res) => {
    const { client_id, client_secret } = req.body;

    // Validate: if one is provided both must be provided
    if ((client_id && !client_secret) || (!client_id && client_secret)) {
      throw new ApiError(400, 'Harus menyertakan client_id dan client_secret sekaligus');
    }
    // Validate type — prevent injection via non-string values
    if (client_id && typeof client_id !== 'string') throw new ApiError(400, 'client_id harus berupa string');
    if (client_secret && typeof client_secret !== 'string') throw new ApiError(400, 'client_secret harus berupa string');

    if (client_id && client_secret) {
      // Test with provided credentials WITHOUT mutating server state
      await icd11.testConnection(client_id, client_secret);
    } else {
      await ensureCredentials();
      await icd11.testConnection();
    }
    res.json({ success: true, data: { message: 'Koneksi ICD-11 berhasil' } });
  })
);

/**
 * POST /api/icd11/save-config  { client_id, client_secret }
 */
router.post('/save-config',
  requireRole(['admin']),
  asyncHandler(async (req, res) => {
    const { client_id, client_secret } = req.body;
    if (!client_id || !client_secret) throw new ApiError(400, 'client_id dan client_secret wajib diisi');
    await icd11.saveConfiguration(client_id, client_secret);
    res.json({ success: true, data: { message: 'Konfigurasi ICD-11 berhasil disimpan' } });
  })
);

// ============================================================
// ICD CODES (for INACBGGrouper and other pickers)
// Returns diagnoses rows mapped to { id, code, description_id }
// ============================================================

/**
 * GET /api/icd11/codes?search=&limit=100
 */
router.get('/codes', searchRateLimiter, asyncHandler(async (req, res) => {
  const { search, limit = '100' } = req.query;
  const where = {};
  if (search) {
    where.OR = [
      { icd10_code:  { contains: search, mode: 'insensitive' } },
      { icd11_code:  { contains: search, mode: 'insensitive' } },
      { icd10_title: { contains: search, mode: 'insensitive' } },
      { icd11_title_id: { contains: search, mode: 'insensitive' } },
    ];
  }

  const rows = await prisma.diagnoses.findMany({
    where,
    select: { id: true, icd10_code: true, icd11_code: true, icd10_title: true, icd11_title_id: true },
    orderBy: { icd10_code: 'asc' },
    take: parseInt(limit),
    distinct: ['icd10_code'],
  });

  const data = rows
    .filter(r => r.icd10_code || r.icd11_code)
    .map(r => ({
      id: r.id,
      code: r.icd10_code || r.icd11_code || '',
      description_id: r.icd10_title || r.icd11_title_id || '',
    }));

  res.json({ success: true, data });
}));

// ============================================================
// DIAGNOSES CRUD
// ============================================================

/**
 * GET /api/icd11/diagnoses?medical_record_id=&visit_id=
 */
router.get('/diagnoses', asyncHandler(async (req, res) => {
  const { medical_record_id, visit_id, patient_id } = req.query;
  const where = {};
  if (medical_record_id) where.medical_record_id = medical_record_id;
  if (visit_id)          where.visit_id          = visit_id;
  if (patient_id)        where.patient_id        = patient_id;

  const diagnoses = await prisma.diagnoses.findMany({
    where,
    orderBy: [{ diagnosis_type: 'asc' }, { created_at: 'asc' }],
  });
  res.json({ success: true, data: diagnoses });
}));

/**
 * POST /api/icd11/diagnoses
 */
router.post('/diagnoses', asyncHandler(async (req, res) => {
  const {
    medical_record_id, visit_id, patient_id,
    icd11_code, icd11_entity_id, icd11_title_en, icd11_title_id,
    icd10_code, icd10_title,
    diagnosis_type = 'primer', is_confirmed = true, notes,
  } = req.body;

  const diagnosis = await prisma.diagnoses.create({
    data: {
      medical_record_id: medical_record_id || null,
      visit_id:          visit_id          || null,
      patient_id:        patient_id        || null,
      icd11_code, icd11_entity_id, icd11_title_en, icd11_title_id,
      icd10_code,  icd10_title,
      diagnosis_type, is_confirmed,
      notes: notes || null,
      created_by: req.user?.id || null,
    },
  });

  // Also write icd11_code + icd10_code back to the visits / medical_records row
  // for compatibility with existing fields
  if (visit_id && (icd11_code || icd10_code)) {
    await prisma.visits.update({
      where: { id: visit_id },
      data: {
        ...(icd11_code ? { diagnosis: icd11_title_id || icd11_title_en || icd11_code } : {}),
        ...(icd10_code ? { icd10_code } : {}),
      },
    }).catch(() => {});
  }

  res.status(201).json({ success: true, data: diagnosis });
}));

/**
 * PUT /api/icd11/diagnoses/:id
 */
router.put('/diagnoses/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const allowed = [
    'icd11_code','icd11_entity_id','icd11_title_en','icd11_title_id',
    'icd10_code','icd10_title','diagnosis_type','is_confirmed','notes',
  ];
  const data = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) data[k] = req.body[k]; });

  const diagnosis = await prisma.diagnoses.update({ where: { id }, data });
  res.json({ success: true, data: diagnosis });
}));

/**
 * DELETE /api/icd11/diagnoses/:id
 */
router.delete('/diagnoses/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.diagnoses.delete({ where: { id } });
  res.json({ success: true });
}));

// ============================================================
// MEDICAL RECORDS (with diagnoses)
// ============================================================

/**
 * GET /api/icd11/medical-records?patient_id=&visit_id=&limit=50
 */
router.get('/medical-records', asyncHandler(async (req, res) => {
  const { patient_id, visit_id, limit = '50', page = '1' } = req.query;
  const where = {};
  if (patient_id) where.patient_id = patient_id;
  if (visit_id)   where.visit_id   = visit_id;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [records, total] = await Promise.all([
    prisma.medical_records.findMany({
      where,
      include: {
        patients:  { select: { full_name: true, medical_record_number: true, gender: true, birth_date: true } },
        doctors:   { select: { full_name: true, specialization: true } },
        diagnoses: { orderBy: [{ diagnosis_type: 'asc' }, { created_at: 'asc' }] },
      },
      orderBy: { record_date: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.medical_records.count({ where }),
  ]);

  res.json({ success: true, data: records, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
}));

/**
 * GET /api/icd11/medical-records/:id
 */
router.get('/medical-records/:id', asyncHandler(async (req, res) => {
  const record = await prisma.medical_records.findUnique({
    where: { id: req.params.id },
    include: {
      patients:  { select: { full_name: true, medical_record_number: true, gender: true, birth_date: true } },
      doctors:   { select: { full_name: true, specialization: true } },
      diagnoses: { orderBy: [{ diagnosis_type: 'asc' }, { created_at: 'asc' }] },
    },
  });
  if (!record) throw new ApiError(404, 'Rekam medis tidak ditemukan');
  res.json({ success: true, data: record });
}));

/**
 * POST /api/icd11/medical-records
 * Body: { patient_id, visit_id, doctor_id, subjective, objective, assessment, plan,
 *         vital_signs, physical_exam, diagnoses: [...] }
 */
router.post('/medical-records', asyncHandler(async (req, res) => {
  const {
    patient_id, visit_id, doctor_id,
    subjective, objective, assessment, plan,
    vital_signs, physical_exam,
    diagnoses: diagnosesInput = [],
  } = req.body;

  if (!patient_id) throw new ApiError(400, 'patient_id wajib diisi');

  const record = await prisma.$transaction(async (tx) => {
    const mr = await tx.medical_records.create({
      data: {
        patient_id, visit_id: visit_id || null, doctor_id: doctor_id || null,
        subjective, objective, assessment, plan,
        vital_signs: vital_signs || null,
        physical_exam: physical_exam || null,
        created_by: req.user?.id || null,
      },
    });

    if (diagnosesInput.length > 0) {
      await tx.diagnoses.createMany({
        data: diagnosesInput.map(d => ({
          medical_record_id: mr.id,
          visit_id:          visit_id || null,
          patient_id:        patient_id,
          icd11_code:        d.icd11_code        || null,
          icd11_entity_id:   d.icd11_entity_id   || null,
          icd11_title_en:    d.icd11_title_en     || null,
          icd11_title_id:    d.icd11_title_id     || null,
          icd10_code:        d.icd10_code         || null,
          icd10_title:       d.icd10_title        || null,
          diagnosis_type:    d.diagnosis_type || 'primer',
          is_confirmed:      d.is_confirmed   ?? true,
          notes:             d.notes          || null,
          created_by:        req.user?.id     || null,
        })),
      });
    }

    return tx.medical_records.findUnique({
      where: { id: mr.id },
      include: {
        patients:  { select: { full_name: true, medical_record_number: true, gender: true, birth_date: true } },
        doctors:   { select: { full_name: true, specialization: true } },
        diagnoses: true,
      },
    });
  });

  // Update visit primary diagnosis if provided
  if (visit_id && diagnosesInput.length > 0) {
    const primary = diagnosesInput.find(d => d.diagnosis_type === 'primer') || diagnosesInput[0];
    await prisma.visits.update({
      where: { id: visit_id },
      data: {
        diagnosis: primary.icd11_title_id || primary.icd11_title_en || primary.icd10_title || null,
        icd10_code: primary.icd10_code || null,
      },
    }).catch(() => {});
  }

  res.status(201).json({ success: true, data: record });
}));

/**
 * PUT /api/icd11/medical-records/:id
 */
router.put('/medical-records/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const allowed = ['subjective','objective','assessment','plan','vital_signs','physical_exam','doctor_id'];
  const data = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) data[k] = req.body[k]; });

  const record = await prisma.medical_records.update({
    where: { id },
    data,
    include: {
      patients:  { select: { full_name: true, medical_record_number: true } },
      diagnoses: true,
    },
  });
  res.json({ success: true, data: record });
}));

export default router;

/**
 * e-Consent Digital Routes
 */
import { Router } from 'express';
import { createHash } from 'crypto';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { prisma } from '../config/database.js';

const router = Router();
router.use(authenticateToken);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDefaultConsentText(consent_type) {
  const templates = {
    general_treatment:  'Saya yang bertanda tangan di bawah ini menyetujui untuk menerima tindakan perawatan umum yang diperlukan oleh tim medis fasilitas kesehatan ini sesuai indikasi klinis.',
    surgical:           'Saya menyetujui dilaksanakannya tindakan pembedahan yang telah dijelaskan oleh dokter operator, termasuk risiko, manfaat, dan alternatif yang ada.',
    anesthesia:         'Saya menyetujui pemberian anestesi (pembiusan) yang diperlukan untuk tindakan operasi/prosedur invasif, dan telah memahami risiko yang mungkin terjadi.',
    blood_transfusion:  'Saya menyetujui tindakan transfusi darah sesuai indikasi medis dan telah mendapatkan penjelasan mengenai risiko serta manfaatnya.',
    telemedicine:       'Saya menyetujui layanan telemedicine dan memahami keterbatasan konsultasi jarak jauh dibanding pemeriksaan tatap muka.',
    photography:        'Saya mengizinkan pengambilan foto/video untuk keperluan medis (dokumentasi klinis) dan penggunaan sesuai ketentuan yang berlaku.',
    data_sharing:       'Saya menyetujui data medis saya dibagikan dengan pihak yang berwenang (BPJS, Satu Sehat, rujukan) sesuai kebutuhan pelayanan.',
    research:           'Saya bersedia berpartisipasi dalam penelitian klinis yang telah dijelaskan dan memahami hak untuk mengundurkan diri kapan saja.',
  };
  return templates[consent_type] || `Saya menyetujui tindakan ${consent_type} yang diperlukan sesuai indikasi medis.`;
}

// ─── GET /api/consents ────────────────────────────────────────────────────────

router.get('/', asyncHandler(async (req, res) => {
  const { patient_id, visit_id, status, consent_type } = req.query;
  const where = {};
  if (patient_id)   where.patient_id   = patient_id;
  if (visit_id)     where.visit_id     = visit_id;
  if (status)       where.status       = status;
  if (consent_type) where.consent_type = consent_type;

  const consents = await prisma.patient_consents.findMany({
    where,
    orderBy: { created_at: 'desc' },
    include: {
      patients: { select: { full_name: true, medical_record_number: true } },
    },
  });

  res.json({ success: true, data: consents });
}));

// ─── GET /api/consents/templates/:type ───────────────────────────────────────

router.get('/templates/:type', asyncHandler(async (req, res) => {
  const text = getDefaultConsentText(req.params.type);
  res.json({ success: true, data: { consent_type: req.params.type, text } });
}));

// ─── GET /api/consents/:id ────────────────────────────────────────────────────

router.get('/:id', asyncHandler(async (req, res) => {
  const consent = await prisma.patient_consents.findUnique({
    where: { id: req.params.id },
    include: { patients: { select: { full_name: true, medical_record_number: true } } },
  });
  if (!consent) throw new ApiError('Consent tidak ditemukan', 404);

  // Mask signature_data — never expose raw signature over the API
  const { signature_data: _, ...safeConsent } = consent;
  if (consent.signature_data) safeConsent.signature_data = '[ENCRYPTED]';

  res.json({ success: true, data: safeConsent });
}));

// ─── POST /api/consents ───────────────────────────────────────────────────────

router.post('/', asyncHandler(async (req, res) => {
  const {
    patient_id, visit_id, consent_type, consent_text, language, valid_days,
    witness_name, witness_role,
  } = req.body;

  if (!patient_id || !consent_type) {
    throw new ApiError('patient_id dan consent_type wajib diisi', 400);
  }

  const valid_until = valid_days
    ? new Date(Date.now() + Number(valid_days) * 86_400_000)
    : new Date(Date.now() + 365 * 86_400_000);

  const consent = await prisma.patient_consents.create({
    data: {
      patient_id,
      visit_id,
      consent_type,
      consent_text: consent_text || getDefaultConsentText(consent_type),
      language:     language || 'id',
      status:       'pending',
      witness_name,
      witness_role,
      valid_until,
      created_by:   req.user.id,   // fixed: was req.user.userId
    },
  });

  res.status(201).json({ success: true, data: consent });
}));

// ─── POST /api/consents/:id/sign ─────────────────────────────────────────────

router.post('/:id/sign', asyncHandler(async (req, res) => {
  const { signed_by_name, signed_by_relation, signature_data } = req.body;

  if (!signed_by_name || !signature_data) {
    throw new ApiError('Nama penandatangan dan tanda tangan wajib diisi', 400);
  }

  // Verify consent is still pending
  const existing = await prisma.patient_consents.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError('Consent tidak ditemukan', 404);
  if (existing.status !== 'pending') {
    throw new ApiError(`Consent sudah berstatus '${existing.status}', tidak dapat ditandatangani`, 409);
  }

  const signature_hash = createHash('sha256')
    .update(signature_data + req.params.id + new Date().toISOString())
    .digest('hex');

  const consent = await prisma.patient_consents.update({
    where: { id: req.params.id },
    data: {
      status:             'signed',
      signed_by_name,
      signed_by_relation: signed_by_relation || 'self',
      signed_at:          new Date(),
      signed_ip:          req.ip,
      signature_hash,
      signature_data,    // encrypted at rest via DB-level encryption
      updated_at:        new Date(),
    },
  });

  const { signature_data: __, ...safeConsent } = consent;
  res.json({ success: true, data: safeConsent });
}));

// ─── POST /api/consents/:id/decline ──────────────────────────────────────────

router.post('/:id/decline', asyncHandler(async (req, res) => {
  const consent = await prisma.patient_consents.update({
    where: { id: req.params.id },
    data: { status: 'declined', updated_at: new Date() },
  });
  res.json({ success: true, data: consent });
}));

// ─── POST /api/consents/:id/revoke ───────────────────────────────────────────

router.post('/:id/revoke', asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const consent = await prisma.patient_consents.update({
    where: { id: req.params.id },
    data: {
      status:         'revoked',
      revoked_at:     new Date(),
      revoked_reason: reason,
      updated_at:     new Date(),
    },
  });
  res.json({ success: true, data: consent });
}));

export default router;

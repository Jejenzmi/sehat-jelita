/**
 * File Upload Routes — multer-based, stores to disk under /uploads
 * Supported: patient photos, consent documents, lab attachments
 */
import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();
router.use(authenticateToken);

// ── Storage config ────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.resolve(__dirname, '../../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_TYPES = {
  image:    ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  document: ['application/pdf', 'image/jpeg', 'image/png', 'application/msword',
             'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

const MAX_SIZE = {
  image:    5  * 1024 * 1024,  // 5 MB
  document: 20 * 1024 * 1024,  // 20 MB
};

function createStorage(subdir) {
  const dest = path.join(UPLOAD_DIR, subdir);
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dest),
    filename: (_req, file, cb) => {
      const ext  = path.extname(file.originalname).toLowerCase();
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
      cb(null, name);
    },
  });
}

function makeUpload(subdir, allowedMimes, maxBytes) {
  return multer({
    storage: createStorage(subdir),
    limits: { fileSize: maxBytes },
    fileFilter: (_req, file, cb) => {
      if (allowedMimes.includes(file.mimetype)) return cb(null, true);
      cb(new ApiError(`Tipe file tidak diizinkan: ${file.mimetype}`, 415));
    },
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fileResponse(req, file, subdir) {
  const relativePath = `/uploads/${subdir}/${file.filename}`;
  return {
    filename:      file.filename,
    original_name: file.originalname,
    mime_type:     file.mimetype,
    size_bytes:    file.size,
    url:           relativePath,
  };
}

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * POST /api/upload/photo
 * Patient or staff photo upload (jpg/png/webp, max 5 MB)
 */
router.post(
  '/photo',
  makeUpload('photos', ALLOWED_TYPES.image, MAX_SIZE.image).single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError('File tidak ditemukan', 400);
    res.status(201).json({ success: true, data: fileResponse(req, req.file, 'photos') });
  })
);

/**
 * POST /api/upload/document
 * Consent forms, lab attachments, medical reports (pdf/doc, max 20 MB)
 */
router.post(
  '/document',
  makeUpload('documents', ALLOWED_TYPES.document, MAX_SIZE.document).single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError('File tidak ditemukan', 400);
    res.status(201).json({ success: true, data: fileResponse(req, req.file, 'documents') });
  })
);

/**
 * DELETE /api/upload/:subdir/:filename
 * Delete a previously uploaded file (admin only)
 */
router.delete('/:subdir/:filename', asyncHandler(async (req, res) => {
  const { subdir, filename } = req.params;

  // Guard against path traversal
  if (!/^[a-z]+$/.test(subdir) || /[/\\]/.test(filename)) {
    throw new ApiError('Path tidak valid', 400);
  }

  const filePath = path.join(UPLOAD_DIR, subdir, filename);
  if (!fs.existsSync(filePath)) throw new ApiError('File tidak ditemukan', 404);

  fs.unlinkSync(filePath);
  res.json({ success: true, message: 'File dihapus' });
}));

// Multer error handler
router.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, error: 'File terlalu besar' });
    }
    return res.status(400).json({ success: false, error: err.message });
  }
  next(err);
});

export default router;

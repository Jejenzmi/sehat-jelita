/**
 * File Upload Routes — multer-based, stores to disk under /uploads
 */
import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();
router.use(authenticateToken);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.resolve(__dirname, '../../../uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  document: ['application/pdf', 'image/jpeg', 'image/png', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

const MAX_SIZE: Record<string, number> = {
  image: 5 * 1024 * 1024,
  document: 20 * 1024 * 1024,
};

function createStorage(subdir: string) {
  const dest = path.join(UPLOAD_DIR, subdir);
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dest),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
      cb(null, name);
    },
  });
}

function makeUpload(subdir: string, allowedMimes: string[], maxBytes: number) {
  return multer({
    storage: createStorage(subdir),
    limits: { fileSize: maxBytes },
    fileFilter: (_req, file, cb) => {
      if (allowedMimes.includes(file.mimetype)) return cb(null, true);
      cb(new ApiError(415, `Tipe file tidak diizinkan: ${file.mimetype}`));
    },
  });
}

function fileResponse(req: Request, file: import('multer').File, subdir: string) {
  const relativePath = `/uploads/${subdir}/${file.filename}`;
  return {
    filename: file.filename,
    original_name: file.originalname,
    mime_type: file.mimetype,
    size_bytes: file.size,
    url: relativePath,
  };
}

// POST /api/upload/photo
router.post(
  '/photo',
  makeUpload('photos', ALLOWED_TYPES.image, MAX_SIZE.image).single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw new ApiError(400, 'File tidak ditemukan');
    res.status(201).json({ success: true, data: fileResponse(req, req.file, 'photos') });
  })
);

// POST /api/upload/document
router.post(
  '/document',
  makeUpload('documents', ALLOWED_TYPES.document, MAX_SIZE.document).single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw new ApiError(400, 'File tidak ditemukan');
    res.status(201).json({ success: true, data: fileResponse(req, req.file, 'documents') });
  })
);

// DELETE /api/upload/:subdir/:filename
router.delete('/:subdir/:filename', asyncHandler(async (req: Request<{ subdir: string; filename: string }>, res: Response) => {
  const { subdir, filename } = req.params;

  if (!/^[a-z]+$/.test(subdir) || /[/\\]/.test(filename)) {
    throw new ApiError(400, 'Path tidak valid');
  }

  const filePath = path.join(UPLOAD_DIR, subdir, filename);
  if (!fs.existsSync(filePath)) throw new ApiError(404, 'File tidak ditemukan');

  fs.unlinkSync(filePath);
  res.json({ success: true, message: 'File dihapus' });
}));

// Multer error handler
router.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if ((err as any).code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, error: 'File terlalu besar' });
    }
    return res.status(400).json({ success: false, error: err.message });
  }
  next(err);
});

export default router;

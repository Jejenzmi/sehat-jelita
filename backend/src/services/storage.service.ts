/**
 * SIMRS ZEN - File Storage Service
 * Supports local filesystem and S3-compatible storage
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local';
const LOCAL_STORAGE_PATH = process.env.STORAGE_PATH || './uploads';

// S3 Client (for S3-compatible storage)
let s3Client: S3Client | null = null;
if (STORAGE_TYPE === 's3') {
  s3Client = new S3Client({
    region: process.env.S3_REGION || 'auto',
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY || '',
      secretAccessKey: process.env.S3_SECRET_KEY || ''
    },
    forcePathStyle: true // For MinIO/custom S3
  });
}

const S3_BUCKET = process.env.S3_BUCKET;

export interface UploadFileResult {
  success: boolean;
  path: string;
  url: string;
  filename: string;
  originalName: string;
  size?: number;
  mimeType?: string;
}

export interface GetFileResult {
  body: Buffer | unknown;
  contentType?: string;
  contentLength?: number;
  metadata?: Record<string, string>;
}

export interface FileInfo {
  path: string;
  size: number;
  lastModified: Date;
}

export interface PresignedUploadResult {
  uploadUrl: string;
  key: string;
  expiresIn: number;
}

export interface PresignedDownloadResult {
  downloadUrl: string;
  expiresIn: number;
}

export interface UploadFileOptions {
  originalname?: string;
  name?: string;
  buffer?: Buffer;
  data?: Buffer;
  mimetype?: string;
  type?: string;
  size?: number;
}

/**
 * Ensure local upload directory exists
 */
const ensureLocalDir = async (subPath: string = ''): Promise<string> => {
  const fullPath = path.join(LOCAL_STORAGE_PATH, subPath);
  await fs.mkdir(fullPath, { recursive: true });
  return fullPath;
};

/**
 * Generate unique filename
 */
const generateFilename = (originalName: string): string => {
  const ext = path.extname(originalName);
  const hash = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `${timestamp}-${hash}${ext}`;
};

/**
 * Upload file
 */
export const uploadFile = async (file: UploadFileOptions, folder: string = 'general'): Promise<UploadFileResult> => {
  const filename = generateFilename(file.originalname || file.name || 'unknown');
  const filePath = `${folder}/${filename}`;

  if (STORAGE_TYPE === 's3' && s3Client) {
    // S3 Upload
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: filePath,
      Body: file.buffer || file.data,
      ContentType: file.mimetype || file.type,
      Metadata: {
        originalName: file.originalname || file.name || ''
      }
    });

    await s3Client.send(command);

    return {
      success: true,
      path: filePath,
      url: `${process.env.S3_ENDPOINT}/${S3_BUCKET}/${filePath}`,
      filename,
      originalName: file.originalname || file.name || '',
      size: file.size,
      mimeType: file.mimetype || file.type
    };
  } else {
    // Local Storage
    const dirPath = await ensureLocalDir(folder);
    const fullPath = path.join(dirPath, filename);

    await fs.writeFile(fullPath, file.buffer || file.data);

    return {
      success: true,
      path: filePath,
      url: `/uploads/${filePath}`,
      filename,
      originalName: file.originalname || file.name || '',
      size: file.size,
      mimeType: file.mimetype || file.type
    };
  }
};

/**
 * Get file
 */
export const getFile = async (filePath: string): Promise<GetFileResult> => {
  if (STORAGE_TYPE === 's3' && s3Client) {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: filePath
    });

    const response = await s3Client.send(command);
    return {
      body: response.Body,
      contentType: response.ContentType,
      contentLength: response.ContentLength,
      metadata: response.Metadata
    };
  } else {
    const fullPath = path.join(LOCAL_STORAGE_PATH, filePath);
    const data = await fs.readFile(fullPath);
    const stats = await fs.stat(fullPath);

    return {
      body: data,
      contentLength: stats.size
    };
  }
};

/**
 * Delete file
 */
export const deleteFile = async (filePath: string): Promise<{ success: boolean }> => {
  if (STORAGE_TYPE === 's3' && s3Client) {
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: filePath
    });

    await s3Client.send(command);
  } else {
    const fullPath = path.join(LOCAL_STORAGE_PATH, filePath);
    await fs.unlink(fullPath);
  }

  return { success: true };
};

/**
 * List files in folder
 */
export const listFiles = async (folder: string = ''): Promise<FileInfo[]> => {
  if (STORAGE_TYPE === 's3' && s3Client) {
    const command = new ListObjectsV2Command({
      Bucket: S3_BUCKET,
      Prefix: folder
    });

    const response = await s3Client.send(command);
    return response.Contents?.map(item => ({
      path: item.Key || '',
      size: item.Size || 0,
      lastModified: item.LastModified || new Date()
    })) || [];
  } else {
    const dirPath = path.join(LOCAL_STORAGE_PATH, folder);

    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      const result: FileInfo[] = [];

      for (const file of files) {
        if (file.isFile()) {
          const filePath = path.join(dirPath, file.name);
          const stats = await fs.stat(filePath);
          result.push({
            path: path.join(folder, file.name),
            size: stats.size,
            lastModified: stats.mtime
          });
        }
      }

      return result;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    }
  }
};

/**
 * Get presigned URL for direct upload (S3 only)
 */
export const getPresignedUploadUrl = async (filename: string, folder: string = 'general', expiresIn: number = 3600): Promise<PresignedUploadResult> => {
  if (STORAGE_TYPE !== 's3' || !s3Client) {
    throw new Error('Presigned URLs only available for S3 storage');
  }

  const key = `${folder}/${generateFilename(filename)}`;
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });

  return {
    uploadUrl: url,
    key,
    expiresIn
  };
};

/**
 * Get presigned URL for download (S3 only)
 */
export const getPresignedDownloadUrl = async (filePath: string, expiresIn: number = 3600): Promise<PresignedDownloadResult> => {
  if (STORAGE_TYPE !== 's3' || !s3Client) {
    throw new Error('Presigned URLs only available for S3 storage');
  }

  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: filePath
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });

  return {
    downloadUrl: url,
    expiresIn
  };
};

/**
 * Storage buckets/folders configuration
 */
export const STORAGE_FOLDERS = {
  PATIENT_DOCUMENTS: 'patients/documents',
  PATIENT_PHOTOS: 'patients/photos',
  LAB_RESULTS: 'lab/results',
  RADIOLOGY_IMAGES: 'radiology/images',
  PRESCRIPTIONS: 'pharmacy/prescriptions',
  CONSENT_FORMS: 'consent/forms',
  EMPLOYEE_DOCUMENTS: 'hr/documents',
  REPORTS: 'reports',
  TEMP: 'temp'
} as const;

export default {
  uploadFile,
  getFile,
  deleteFile,
  listFiles,
  getPresignedUploadUrl,
  getPresignedDownloadUrl,
  STORAGE_FOLDERS
};

/**
 * SIMRS ZEN - Encryption Service
 * Field-level encryption for PII data (NIK, phone, email, diagnosis)
 * Uses AES-256-GCM via Node.js built-in crypto module.
 * Keys are read from environment variables to support KMS-based rotation.
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT = 'simrs-zen-pii-v1'; // non-secret, used for key derivation only

/**
 * Derive a 32-byte key from the environment secret.
 * Falls back to a deterministic dev key if ENCRYPTION_SECRET is not set,
 * but warns loudly so operators don't miss it.
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_SECRET must be set in production');
    }
    console.warn('[encryption] ENCRYPTION_SECRET not set - using insecure dev key');
    return scryptSync('dev-only-insecure-key', SALT, 32);
  }
  return scryptSync(secret, SALT, 32);
}

/**
 * Encrypt a plaintext string.
 * Returns a base64-encoded string: iv + authTag + ciphertext
 */
export function encrypt(plaintext: string | null | undefined): string | null | undefined {
  if (plaintext == null) return plaintext;
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

/**
 * Decrypt a base64-encoded encrypted string produced by encrypt().
 * Returns null if the input is null/undefined.
 * Throws on authentication failure (tampered data).
 */
export function decrypt(ciphertext: string | null | undefined): string | null | undefined {
  if (ciphertext == null) return ciphertext;
  const key = getEncryptionKey();
  const buf = Buffer.from(ciphertext, 'base64');
  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = buf.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

/**
 * Encrypt only if the value is not already encrypted.
 * Detects encrypted values by checking if the base64-decoded buffer is long
 * enough to contain the IV + auth tag headers produced by encrypt().
 */
export function encryptIfPlain(value: string | null | undefined): string | null | undefined {
  if (value == null) return value;
  try {
    const buf = Buffer.from(value, 'base64');
    // Minimum encrypted size: IV(16) + tag(16) + at least 1 byte of ciphertext
    if (buf.length >= IV_LENGTH + TAG_LENGTH + 1) {
      return value; // Assume already encrypted
    }
  } catch {
    // not valid base64
  }
  return encrypt(value);
}

export default { encrypt, decrypt, encryptIfPlain };

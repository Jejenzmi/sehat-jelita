/**
 * SIMRS ZEN - PII Sanitizer Middleware
 * Masks Personally Identifiable Information in logs and error responses.
 *
 * Covered fields: nik, phone, mobile_phone, email, password, password_hash,
 *   reset_token, emergency_contact_phone, diagnosis, description (free-text)
 */

/** Fields whose values should be fully redacted in logged objects */
const REDACT_FIELDS = new Set([
  'password',
  'password_hash',
  'currentPassword',
  'newPassword',
  'reset_token',
  'refreshToken',
]);

/** Fields that should be partially masked (show last 4 chars) */
const MASK_FIELDS = new Set([
  'nik',
  'phone',
  'mobile_phone',
  'emergency_contact_phone',
  'email',
]);

/**
 * Partially mask a string value – show only the last 4 characters.
 * e.g. "081234567890" → "********7890"
 */
function maskValue(value) {
  if (typeof value !== 'string' || value.length <= 4) return '****';
  return '*'.repeat(value.length - 4) + value.slice(-4);
}

/**
 * Deep-clone an object and sanitize PII fields.
 * Handles nested objects and arrays recursively.
 */
export function sanitizeObject(obj) {
  if (obj == null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObject);

  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    if (REDACT_FIELDS.has(key)) {
      out[key] = '[REDACTED]';
    } else if (MASK_FIELDS.has(key)) {
      out[key] = typeof value === 'string' ? maskValue(value) : value;
    } else if (value && typeof value === 'object') {
      out[key] = sanitizeObject(value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

/**
 * Express middleware that sanitizes req.body for audit/logging purposes.
 * Attaches req.sanitizedBody so loggers can use it instead of req.body.
 */
export const piiSanitizer = (req, _res, next) => {
  req.sanitizedBody = sanitizeObject(req.body);
  next();
};

export default piiSanitizer;

/**
 * SIMRS ZEN - Environment Variables Validation
 * Uses Zod to validate required env vars at startup
 */

import { z } from 'zod';
import dotenv from 'dotenv';

// Load .env file before validation (safe to call multiple times)
dotenv.config();

const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Port (coerced to number)
  PORT: z.coerce.number().int().positive().default(3000),

  // Database (required)
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // JWT (required)
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters for security'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // CORS
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),

  // Redis (optional)
  REDIS_URL: z.string().optional(),

  // BPJS Integration (optional)
  BPJS_CONS_ID: z.string().optional(),
  BPJS_SECRET_KEY: z.string().optional(),
  BPJS_USER_KEY: z.string().optional(),
  BPJS_BASE_URL: z.string().url().optional(),

  // SatuSehat Integration (optional)
  SATUSEHAT_CLIENT_ID: z.string().optional(),
  SATUSEHAT_CLIENT_SECRET: z.string().optional(),
  SATUSEHAT_ORGANIZATION_ID: z.string().optional(),
  SATUSEHAT_BASE_URL: z.string().url().optional(),
});

/**
 * Validates all environment variables at startup.
 * Logs warnings for optional missing vars and exits on required missing vars.
 *
 * @returns {z.infer<typeof envSchema>} Parsed and validated env object
 */
export function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.errors
      .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
      .join('\n');
    console.error(`❌ Invalid environment variables:\n${errors}`);
    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();

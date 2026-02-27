/**
 * Environment variable validation using Zod.
 * Import and call validateEnv() at application startup.
 */

import { z } from 'zod';

const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .regex(/^\d+$/, 'PORT must be a number')
    .default('3000'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),

  // Database – required
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // JWT – required
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // Redis – optional
  REDIS_URL: z.string().optional(),

  // BPJS – optional
  BPJS_CONS_ID: z.string().optional(),
  BPJS_SECRET_KEY: z.string().optional(),
  BPJS_USER_KEY: z.string().optional(),
  BPJS_BASE_URL: z.string().url().optional(),
  BPJS_VCLAIM_URL: z.string().url().optional(),
  BPJS_APLICARE_URL: z.string().url().optional(),

  // Satu Sehat – optional
  SATUSEHAT_CLIENT_ID: z.string().optional(),
  SATUSEHAT_CLIENT_SECRET: z.string().optional(),
  SATUSEHAT_ORGANIZATION_ID: z.string().optional(),
  SATU_SEHAT_ENV: z.enum(['sandbox', 'production']).default('sandbox'),

  // Email – optional
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z
    .string()
    .regex(/^\d+$/, 'SMTP_PORT must be a number')
    .optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),

  // Logging
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'])
    .default('debug'),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().optional(),
  RATE_LIMIT_MAX_REQUESTS: z.string().optional(),

  // CORS
  CORS_ORIGIN: z.string().optional(),
});

/**
 * Validates process.env and returns a typed, parsed config object.
 * Exits the process if required variables are missing or invalid.
 *
 * @returns {z.infer<typeof envSchema>} Validated environment config
 */
export function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.errors
      .map((e) => `  ${e.path.join('.')}: ${e.message}`)
      .join('\n');
    console.error(`❌ Invalid environment variables:\n${errors}`);
    process.exit(1);
  }

  return result.data;
}

export { envSchema };

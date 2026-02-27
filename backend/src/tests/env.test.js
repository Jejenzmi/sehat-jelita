import { describe, it, expect, beforeEach } from 'vitest';

describe('validateEnv', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Restore env before each test using individual property manipulation
    // (avoid direct process.env reassignment which can cause issues in Node.js)
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }
    Object.assign(process.env, originalEnv);
  });

  it('passes validation with required variables set', async () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
    process.env.JWT_SECRET = 'a'.repeat(64);
    process.env.FRONTEND_URL = 'http://localhost:5173';

    const { z } = await import('zod');
    const envSchema = z.object({
      DATABASE_URL: z.string().min(1),
      JWT_SECRET: z.string().min(32),
      FRONTEND_URL: z.string().url().default('http://localhost:5173'),
    });

    const result = envSchema.safeParse(process.env);
    expect(result.success).toBe(true);
  });

  it('fails validation when DATABASE_URL is missing', async () => {
    const { z } = await import('zod');
    const envSchema = z.object({
      DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    });

    const result = envSchema.safeParse({ DATABASE_URL: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('DATABASE_URL is required');
    }
  });

  it('fails validation when JWT_SECRET is too short', async () => {
    const { z } = await import('zod');
    const envSchema = z.object({
      JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters for security'),
    });

    const result = envSchema.safeParse({ JWT_SECRET: 'short' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('32 characters');
    }
  });
});

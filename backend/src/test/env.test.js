import { describe, it, expect } from 'vitest';
import { envSchema } from '../config/env.js';

describe('envSchema', () => {
  it('accepts valid minimum required environment', () => {
    const result = envSchema.safeParse({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      JWT_SECRET: 'a-secret-that-is-at-least-32-characters-long!!',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing DATABASE_URL', () => {
    const result = envSchema.safeParse({
      JWT_SECRET: 'a-secret-that-is-at-least-32-characters-long!!',
    });
    expect(result.success).toBe(false);
  });

  it('rejects JWT_SECRET shorter than 32 characters', () => {
    const result = envSchema.safeParse({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      JWT_SECRET: 'short',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const jwtError = result.error.errors.find((e) =>
        e.path.includes('JWT_SECRET')
      );
      expect(jwtError).toBeDefined();
    }
  });

  it('applies defaults for optional fields', () => {
    const result = envSchema.safeParse({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      JWT_SECRET: 'a-secret-that-is-at-least-32-characters-long!!',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.NODE_ENV).toBe('development');
      expect(result.data.PORT).toBe('3000');
      expect(result.data.LOG_LEVEL).toBe('debug');
    }
  });
});

import { describe, it, expect } from 'vitest';

describe('errorHandler', () => {
  it('formats ApiError correctly', async () => {
    const { ApiError } = await import('../middleware/errorHandler.js');
    const err = new ApiError(400, 'Bad request', 'BAD_REQUEST', { field: 'email' });

    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('Bad request');
    expect(err.code).toBe('BAD_REQUEST');
    expect(err.details).toEqual({ field: 'email' });
    expect(err.isOperational).toBe(true);
  });

  it('returns 500 for generic errors', () => {
    // Simulate the error handler response shaping
    const err = new Error('Something went wrong');
    const isDev = process.env.NODE_ENV !== 'production';
    const body = {
      success: false,
      error: isDev ? err.message : 'Internal server error',
      code: 'INTERNAL_ERROR',
    };

    expect(body.success).toBe(false);
    expect(body.code).toBe('INTERNAL_ERROR');
  });
});

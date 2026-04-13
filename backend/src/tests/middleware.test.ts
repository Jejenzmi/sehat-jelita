import { describe, it, expect, vi } from 'vitest';
import type { Request } from 'express';
import { paginate, paginatedResponse } from '../middleware/pagination.js';
import { validate } from '../middleware/validation.js';
import { z } from 'zod';

// Extend Request type to include pagination
interface PaginatedRequest extends Request {
  pagination: { skip: number; take: number; page: number; limit: number };
}

// ============================================================
// paginate middleware
// ============================================================

describe('paginate middleware', () => {
  function buildReq(query: Record<string, string | undefined>): Pick<PaginatedRequest, 'query' | 'pagination'> {
    return { query, pagination: {} as PaginatedRequest['pagination'] };
  }

  function runPaginate(query: Record<string, string | undefined>) {
    const req = buildReq(query) as PaginatedRequest;
    const next = vi.fn();
    paginate(req as unknown as Request, {}, next);
    return { req, next };
  }

  it('uses default page=1 and limit=20', () => {
    const { req, next } = runPaginate({});
    expect(req.pagination).toEqual({ skip: 0, take: 20, page: 1, limit: 20 });
    expect(next).toHaveBeenCalledOnce();
  });

  it('calculates skip correctly', () => {
    const { req } = runPaginate({ page: '3', limit: '10' });
    expect(req.pagination).toEqual({ skip: 20, take: 10, page: 3, limit: 10 });
  });

  it('clamps limit to a maximum of 100', () => {
    const { req } = runPaginate({ limit: '500' });
    expect(req.pagination.limit).toBe(100);
    expect(req.pagination.take).toBe(100);
  });

  it('falls back to default limit of 20 when limit is 0 or invalid', () => {
    const { req } = runPaginate({ limit: '0' });
    // parseInt('0') is falsy so the || 20 default kicks in
    expect(req.pagination.limit).toBe(20);
  });

  it('clamps page to a minimum of 1', () => {
    const { req } = runPaginate({ page: '-5' });
    expect(req.pagination.page).toBe(1);
    expect(req.pagination.skip).toBe(0);
  });
});

// ============================================================
// paginatedResponse helper
// ============================================================

describe('paginatedResponse', () => {
  it('builds the response envelope correctly', () => {
    const pagination = { page: 2, limit: 10 };
    const result = paginatedResponse(['a', 'b'], 25, pagination);

    expect(result).toEqual({
      success: true,
      data: ['a', 'b'],
      pagination: { page: 2, limit: 10, total: 25, total_pages: 3 },
    });
  });

  it('calculates total_pages=1 when total <= limit', () => {
    const result = paginatedResponse([], 5, { page: 1, limit: 20 });
    expect(result.pagination.total_pages).toBe(1);
  });

  it('calculates total_pages=0 when total is 0', () => {
    const result = paginatedResponse([], 0, { page: 1, limit: 20 });
    expect(result.pagination.total_pages).toBe(0);
  });
});

// ============================================================
// validate middleware
// ============================================================

describe('validate middleware', () => {
  const schema = z.object({
    name: z.string().min(1),
    age: z.number().int().positive(),
  });

  it('calls next() and replaces req.body on success', () => {
    const req = { body: { name: 'Alice', age: 30 } };
    const next = vi.fn();
    validate(schema)(req as Request, {}, next);

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith(); // no error
    expect(req.body).toEqual({ name: 'Alice', age: 30 });
  });

  it('calls next(error) with a ZodError on validation failure', () => {
    const req = { body: { name: '', age: -1 } };
    const next = vi.fn();
    validate(schema)(req as Request, {}, next);

    expect(next).toHaveBeenCalledOnce();
    const error = next.mock.calls[0][0];
    expect(error).toBeDefined();
    expect(error.name).toBe('ZodError');
  });

  it('calls next(error) when required fields are missing', () => {
    const req = { body: {} };
    const next = vi.fn();
    validate(schema)(req as Request, {}, next);

    const error = next.mock.calls[0][0];
    expect(error.name).toBe('ZodError');
    expect(error.errors.length).toBeGreaterThan(0);
  });
});

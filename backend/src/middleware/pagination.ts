/**
 * SIMRS ZEN - Pagination Middleware
 * Extracts and validates pagination parameters from query string
 */

import type { Request, Response, NextFunction } from 'express';

export interface PaginationParams {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

interface PaginationQuery {
  page?: string | number;
  limit?: string | number;
}

/**
 * Pagination middleware
 * Parses `page` and `limit` from req.query and attaches
 * `req.pagination = { skip, take, page, limit }` for use in route handlers.
 *
 * Defaults: page=1, limit=20
 * Maximum limit: 100
 */
export const paginate = (req: Request, _res: Response, next: NextFunction) => {
  const query = req.query as PaginationQuery;
  const page = Math.max(1, parseInt(String(query.page)) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit)) || 20));

  req.pagination = {
    skip: (page - 1) * limit,
    take: limit,
    page,
    limit,
  };

  next();
};

/**
 * Build a standard paginated response envelope.
 *
 * @param data - Array of records for the current page
 * @param total - Total number of matching records
 * @param pagination - Pagination params from req.pagination
 */
export const paginatedResponse = <T>(
  data: T[],
  total: number,
  pagination: PaginationParams,
): PaginatedResponse<T> => ({
  success: true,
  data,
  pagination: {
    page: pagination.page,
    limit: pagination.limit,
    total,
    total_pages: Math.ceil(total / pagination.limit),
  },
});

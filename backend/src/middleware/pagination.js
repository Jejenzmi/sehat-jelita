/**
 * SIMRS ZEN - Pagination Middleware
 * Extracts and validates pagination parameters from query string
 */

/**
 * Pagination middleware
 * Parses `page` and `limit` from req.query and attaches
 * `req.pagination = { skip, take, page, limit }` for use in route handlers.
 *
 * Defaults: page=1, limit=20
 * Maximum limit: 100
 */
export const paginate = (req, _res, next) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

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
 * @param {Array}  data  - Array of records for the current page
 * @param {number} total - Total number of matching records
 * @param {object} pagination - Pagination params from req.pagination
 */
export const paginatedResponse = (data, total, pagination) => ({
  success: true,
  data,
  pagination: {
    page: pagination.page,
    limit: pagination.limit,
    total,
    total_pages: Math.ceil(total / pagination.limit),
  },
});

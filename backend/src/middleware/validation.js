/**
 * SIMRS ZEN - Validation Middleware
 * Provides Zod schema validation for request bodies
 */

/**
 * Returns an Express middleware that validates req.body against a Zod schema.
 * On success the parsed (and potentially transformed) value replaces req.body
 * so downstream handlers receive validated data.
 * On failure the ZodError is forwarded to the global error handler, which
 * translates it to a 400 response.
 *
 * @param {import('zod').ZodTypeAny} schema - Zod schema to validate against
 */
export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return next(result.error);
  }
  req.body = result.data;
  next();
};

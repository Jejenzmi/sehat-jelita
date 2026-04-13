import { JwtUser } from '../middleware/auth.middleware.js';

declare global {
  namespace Express {
    interface Request {
      user?: JwtUser | null;
      requestId?: string;
      _rawToken?: string;
      pagination?: {
        skip: number;
        take: number;
        page: number;
        limit: number;
      };
      sanitizedBody?: Record<string, unknown>;
    }
  }
}

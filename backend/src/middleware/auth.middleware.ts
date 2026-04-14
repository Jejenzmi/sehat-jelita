/**
 * SIMRS ZEN - Authentication Middleware
 * JWT Token Verification, Refresh Token Rotation, JWT Blacklist
 */

import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import * as cache from '../services/cache.service.js';
import { env } from '../config/Env.js';

const JWT_SECRET = env.JWT_SECRET;
const ACCESS_TOKEN_TTL = env.JWT_EXPIRES_IN;
const REFRESH_TOKEN_TTL = env.JWT_REFRESH_EXPIRES_IN;
const REFRESH_TTL_SECONDS = 30 * 24 * 3600; // 30 days in seconds

// -- Types --

export interface JwtUser {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
}

export interface TokenMeta {
  userAgent?: string;
  ipAddress?: string;
}

interface TokenPayload {
  sub: string;
  email: string;
  roles: string[];
  exp?: number;
}

interface GeneratedTokens {
  accessToken: string;
  refreshToken: string;
}

interface RefreshTokenRecord {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  revoked_reason: string | null;
  user_agent: string | null;
  ip_address: string | null;
}

interface AuthErrorResponse {
  success: boolean;
  error: string;
  code?: string;
}

// -- helpers --

/** SHA-256 hex of raw token string -- used as DB key */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Remaining lifetime of a JWT in seconds (0 if expired) */
function jwtRemainingSeconds(token: string): number {
  try {
    const decoded = jwt.decode(token) as TokenPayload | null;
    if (!decoded?.exp) return 0;
    return Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
  } catch {
    return 0;
  }
}

// -- token generation --

/**
 * Generate a short-lived access token + long-lived opaque refresh token.
 * The refresh token is stored (hashed) in the DB.
 */
export const generateTokens = async (user: { id: string; email: string; roles: string[] }, meta: TokenMeta = {}): Promise<GeneratedTokens> => {
  const accessToken = jwt.sign(
    { sub: user.id, email: user.email, roles: user.roles },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );

  // Opaque random refresh token (256-bit)
  const rawRefresh = randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawRefresh);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000);

  await prisma.refresh_tokens.create({
    data: {
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
      user_agent: meta.userAgent || null,
      ip_address: meta.ipAddress || null,
    }
  });

  return { accessToken, refreshToken: rawRefresh };
};

// -- verify & blacklist --

/** Check Redis blacklist for access token (set on logout) */
async function isBlacklisted(token: string): Promise<boolean> {
  const key = `blacklist:${hashToken(token)}`;
  return (await cache.exists(key)) === 1;
}

/**
 * Middleware: verify Bearer access token + blacklist check.
 * Attaches req.user on success.
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Accept token from: 1) httpOnly cookie (preferred), 2) Authorization header (backward-compat)
    let token = req.cookies?.accessToken;
    if (!token) {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Token tidak ditemukan', code: 'NO_TOKEN' } satisfies AuthErrorResponse);
      }
      token = authHeader.replace('Bearer ', '');
    }
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

    // Blacklist check (for logged-out tokens)
    if (await isBlacklisted(token)) {
      return res.status(401).json({ success: false, error: 'Token sudah dicabut', code: 'TOKEN_REVOKED' } satisfies AuthErrorResponse);
    }

    // Fetch live user (ensures account still active & roles are current)
    const user = await prisma.profiles.findUnique({
      where: { user_id: decoded.sub },
      include: { user_roles: true }
    });

    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, error: 'Akun tidak ditemukan atau tidak aktif', code: 'USER_NOT_FOUND' } satisfies AuthErrorResponse);
    }

    req.user = {
      id: user.user_id,
      email: user.email,
      fullName: user.full_name,
      roles: user.user_roles.map(r => r.role)
    };
    req._rawToken = token; // used by logout to blacklist

    next();
  } catch (err) {
    if ((err as Error).name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token sudah kadaluarsa', code: 'TOKEN_EXPIRED' } satisfies AuthErrorResponse);
    }
    if ((err as Error).name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: 'Token tidak valid', code: 'INVALID_TOKEN' } satisfies AuthErrorResponse);
    }
    console.error('Auth middleware error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' } satisfies AuthErrorResponse);
  }
};

/** Optional auth -- never rejects, attaches req.user if token is valid */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) { req.user = null; return next(); }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    if (await isBlacklisted(token)) { req.user = null; return next(); }

    const user = await prisma.profiles.findUnique({
      where: { user_id: decoded.sub },
      include: { user_roles: true }
    });

    req.user = user
      ? { id: user.user_id, email: user.email, fullName: user.full_name, roles: user.user_roles.map(r => r.role) }
      : null;
  } catch {
    req.user = null;
  }
  next();
};

// -- refresh token rotation --

/**
 * Validate a raw refresh token, rotate it (delete old -> create new),
 * and return a fresh token pair.
 */
export const refreshAccessToken = async (rawRefreshToken: string | undefined, meta: TokenMeta = {}): Promise<GeneratedTokens> => {
  if (!rawRefreshToken) throw new Error('Refresh token diperlukan');

  const tokenHash = hashToken(rawRefreshToken);

  const stored = await prisma.refresh_tokens.findUnique({ where: { token_hash: tokenHash } }) as RefreshTokenRecord | null;

  if (!stored) throw new Error('Refresh token tidak valid');
  if (stored.revoked_at) throw new Error('Refresh token sudah dicabut (kemungkinan token theft)');
  if (new Date() > stored.expires_at) throw new Error('Refresh token sudah kadaluarsa');

  const user = await prisma.profiles.findUnique({
    where: { user_id: stored.user_id },
    include: { user_roles: true }
  });

  if (!user || !user.is_active) throw new Error('Akun tidak ditemukan atau tidak aktif');

  // Rotate: revoke old, issue new
  await prisma.refresh_tokens.update({
    where: { id: stored.id },
    data: { revoked_at: new Date(), revoked_reason: 'rotated' }
  });

  const tokens = await generateTokens(
    { id: user.user_id, email: user.email, roles: user.user_roles.map(r => r.role) },
    meta
  );

  // Update last_login
  await prisma.profiles.update({
    where: { user_id: user.user_id },
    data: { last_login: new Date() }
  }).catch(() => { });

  return tokens;
};

// -- logout / revoke --

/**
 * Blacklist the current access token and revoke the refresh token.
 * Called from the logout route.
 */
export const revokeTokens = async (accessToken: string | undefined, rawRefreshToken: string | undefined): Promise<void> => {
  // 1. Blacklist access token until its natural expiry
  if (accessToken) {
    const ttl = jwtRemainingSeconds(accessToken);
    if (ttl > 0) {
      const key = `blacklist:${hashToken(accessToken)}`;
      await cache.set(key, '1', ttl);
    }
  }

  // 2. Revoke refresh token in DB
  if (rawRefreshToken) {
    const tokenHash = hashToken(rawRefreshToken);
    await prisma.refresh_tokens.updateMany({
      where: { token_hash: tokenHash, revoked_at: null },
      data: { revoked_at: new Date(), revoked_reason: 'logout' }
    }).catch(() => { });
  }
};

/**
 * Revoke ALL refresh tokens for a user (force logout everywhere).
 * Useful for password change or security incidents.
 */
export const revokeAllUserTokens = async (userId: string): Promise<void> => {
  await prisma.refresh_tokens.updateMany({
    where: { user_id: userId, revoked_at: null },
    data: { revoked_at: new Date(), revoked_reason: 'force_logout' }
  });
};

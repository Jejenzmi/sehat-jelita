/**
 * SIMRS ZEN - Authentication Routes
 * Handles login, logout, token refresh, password reset
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { generateTokens, refreshAccessToken, authenticateToken } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();

// In-memory store for failed login attempts: email -> { count, lockedUntil }
// NOTE: This resets on server restart and does not work across multiple
// instances in a load-balanced deployment. For production, replace with a
// shared Redis-backed store (e.g. rate-limiter-flexible with Redis).
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().trim().min(1, 'Password diperlukan')
});

const passwordStrengthSchema = z.string()
  .min(12, 'Password minimal 12 karakter')
  .regex(/[A-Z]/, 'Password harus mengandung huruf besar')
  .regex(/[a-z]/, 'Password harus mengandung huruf kecil')
  .regex(/[0-9]/, 'Password harus mengandung angka')
  .regex(/[^A-Za-z0-9]/, 'Password harus mengandung karakter simbol');

const registerSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: passwordStrengthSchema,
  fullName: z.string().min(2, 'Nama minimal 2 karakter')
});

/**
 * POST /api/auth/login
 * User login with email/password
 */
router.post('/login', authRateLimiter, asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  // Check account lockout
  const attempt = loginAttempts.get(email);
  if (attempt?.lockedUntil && attempt.lockedUntil > Date.now()) {
    const waitMinutes = Math.ceil((attempt.lockedUntil - Date.now()) / 60000);
    throw new ApiError(429, `Akun dikunci. Coba lagi dalam ${waitMinutes} menit.`, 'ACCOUNT_LOCKED');
  }

  // Find user by email
  const profile = await prisma.profiles.findUnique({
    where: { email },
    include: { user_roles: true }
  });

  if (!profile) {
    throw new ApiError(401, 'Email atau password salah', 'INVALID_CREDENTIALS');
  }

  // Verify password (stored in separate auth table or profile)
  // Note: In production, use a proper auth table with hashed passwords
  const isValidPassword = await bcrypt.compare(password, profile.password_hash);

  if (!isValidPassword) {
    // Track failed attempt
    const prev = loginAttempts.get(email) || { count: 0 };
    const count = prev.count + 1;
    const lockedUntil = count >= MAX_LOGIN_ATTEMPTS ? Date.now() + LOCKOUT_DURATION_MS : null;
    loginAttempts.set(email, { count, lockedUntil });
    throw new ApiError(401, 'Email atau password salah', 'INVALID_CREDENTIALS');
  }

  // Reset failed attempts on successful login
  loginAttempts.delete(email);

  // Generate tokens
  const tokens = generateTokens({
    id: profile.user_id,
    email: profile.email,
    roles: profile.user_roles.map(r => r.role)
  });

  // Log audit
  await prisma.audit_logs.create({
    data: {
      table_name: 'auth',
      action: 'LOGIN',
      user_id: profile.user_id,
      new_data: { email, loginTime: new Date().toISOString() }
    }
  });

  res.json({
    success: true,
    data: {
      user: {
        id: profile.user_id,
        email: profile.email,
        fullName: profile.full_name,
        roles: profile.user_roles.map(r => r.role)
      },
      ...tokens
    }
  });
}));

/**
 * POST /api/auth/register
 * New user registration (if enabled)
 */
router.post('/register', authRateLimiter, asyncHandler(async (req, res) => {
  // Check if registration is allowed
  const settings = await prisma.system_settings.findFirst({
    where: { setting_key: 'allow_registration' }
  });

  if (settings?.setting_value !== 'true') {
    throw new ApiError(403, 'Registrasi tidak diizinkan', 'REGISTRATION_DISABLED');
  }

  const { email, password, fullName } = registerSchema.parse(req.body);

  // Check if email exists
  const existing = await prisma.profiles.findUnique({ where: { email } });
  if (existing) {
    throw new ApiError(409, 'Email sudah terdaftar', 'EMAIL_EXISTS');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user profile
  const profile = await prisma.profiles.create({
    data: {
      user_id: crypto.randomUUID(),
      email,
      full_name: fullName,
      password_hash: passwordHash
    }
  });

  // Assign default role
  await prisma.user_roles.create({
    data: {
      user_id: profile.user_id,
      role: 'guest'
    }
  });

  res.status(201).json({
    success: true,
    message: 'Registrasi berhasil. Silakan login.'
  });
}));

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ApiError(400, 'Refresh token diperlukan', 'MISSING_TOKEN');
  }

  const tokens = await refreshAccessToken(refreshToken);

  res.json({
    success: true,
    data: tokens
  });
}));

/**
 * POST /api/auth/logout
 * User logout (invalidate token on client side)
 */
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  // Log audit
  await prisma.audit_logs.create({
    data: {
      table_name: 'auth',
      action: 'LOGOUT',
      user_id: req.user.id,
      new_data: { logoutTime: new Date().toISOString() }
    }
  });

  res.json({
    success: true,
    message: 'Logout berhasil'
  });
}));

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  const profile = await prisma.profiles.findUnique({
    where: { user_id: req.user.id },
    include: {
      user_roles: true,
      employees: true
    }
  });

  if (!profile) {
    throw new ApiError(404, 'Profil tidak ditemukan', 'PROFILE_NOT_FOUND');
  }

  res.json({
    success: true,
    data: {
      id: profile.user_id,
      email: profile.email,
      fullName: profile.full_name,
      phone: profile.phone,
      avatarUrl: profile.avatar_url,
      roles: profile.user_roles.map(r => r.role),
      employee: profile.employees?.[0] || null
    }
  });
}));

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post('/change-password', authenticateToken, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Password lama dan baru diperlukan');
  }

  const strengthResult = passwordStrengthSchema.safeParse(newPassword);
  if (!strengthResult.success) {
    throw new ApiError(400, strengthResult.error.errors[0]?.message || 'Password tidak memenuhi syarat keamanan');
  }

  const profile = await prisma.profiles.findUnique({
    where: { user_id: req.user.id }
  });

  const isValid = await bcrypt.compare(currentPassword, profile.password_hash);
  if (!isValid) {
    throw new ApiError(401, 'Password lama tidak sesuai');
  }

  const newHash = await bcrypt.hash(newPassword, 12);

  await prisma.profiles.update({
    where: { user_id: req.user.id },
    data: { password_hash: newHash }
  });

  res.json({
    success: true,
    message: 'Password berhasil diubah'
  });
}));

/**
 * POST /api/auth/forgot-password
 * Request password reset link
 */
router.post('/forgot-password', authRateLimiter, asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email || !z.string().email().safeParse(email).success) {
    throw new ApiError(400, 'Email tidak valid', 'INVALID_EMAIL');
  }

  const profile = await prisma.profiles.findUnique({ where: { email } });

  if (profile) {
    const resetToken = randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.profiles.update({
      where: { user_id: profile.user_id },
      data: {
        reset_token: resetToken,
        reset_token_expires: resetExpires
      }
    });

    // TODO: Send email with reset link
    // await emailService.sendPasswordResetEmail(email, resetToken);
  }

  // Always return success to prevent email enumeration
  res.json({
    success: true,
    message: 'Jika email terdaftar, link reset password akan dikirim'
  });
}));

/**
 * POST /api/auth/reset-password
 * Reset password using token
 */
router.post('/reset-password', authRateLimiter, asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    throw new ApiError(400, 'Token dan password baru diperlukan');
  }

  const strengthResult = passwordStrengthSchema.safeParse(newPassword);
  if (!strengthResult.success) {
    throw new ApiError(400, strengthResult.error.errors[0]?.message || 'Password tidak memenuhi syarat keamanan');
  }

  const profile = await prisma.profiles.findFirst({
    where: {
      reset_token: token,
      reset_token_expires: { gt: new Date() }
    }
  });

  if (!profile) {
    throw new ApiError(400, 'Token tidak valid atau sudah kadaluarsa', 'INVALID_TOKEN');
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.profiles.update({
    where: { user_id: profile.user_id },
    data: {
      password_hash: passwordHash,
      reset_token: null,
      reset_token_expires: null
    }
  });

  res.json({
    success: true,
    message: 'Password berhasil direset. Silakan login.'
  });
}));

export default router;

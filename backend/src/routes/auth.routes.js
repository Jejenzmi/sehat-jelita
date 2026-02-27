/**
 * SIMRS ZEN - Authentication Routes
 * Handles login, logout, token refresh, password reset
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { generateTokens, refreshAccessToken, authenticateToken } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter')
});

const registerSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  fullName: z.string().min(2, 'Nama minimal 2 karakter')
});

/**
 * POST /api/auth/login
 * User login with email/password
 */
router.post('/login', authRateLimiter, asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

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
    throw new ApiError(401, 'Email atau password salah', 'INVALID_CREDENTIALS');
  }

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

  if (newPassword.length < 8) {
    throw new ApiError(400, 'Password baru minimal 8 karakter');
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

export default router;

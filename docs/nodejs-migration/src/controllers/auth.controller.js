/**
 * SIMRS ZEN - Authentication Controller
 * Handles all authentication business logic
 */

import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { generateTokens, refreshAccessToken } from '../middleware/auth.middleware.js';
import { ApiError } from '../middleware/errorHandler.js';

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

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password lama diperlukan'),
  newPassword: z.string().min(8, 'Password baru minimal 8 karakter')
});

/**
 * User login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user by email
    const profile = await prisma.profiles.findUnique({
      where: { email },
      include: { user_roles: true }
    });

    if (!profile) {
      throw new ApiError(401, 'Email atau password salah', 'INVALID_CREDENTIALS');
    }

    // Verify password
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
  } catch (error) {
    next(error);
  }
};

/**
 * User registration
 */
export const register = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 */
export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ApiError(400, 'Refresh token diperlukan', 'MISSING_TOKEN');
    }

    const tokens = await refreshAccessToken(refreshToken);

    res.json({
      success: true,
      data: tokens
    });
  } catch (error) {
    next(error);
  }
};

/**
 * User logout
 */
export const logout = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user
 */
export const getCurrentUser = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

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
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password request
 */
export const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    const profile = await prisma.profiles.findUnique({ where: { email } });
    
    if (profile) {
      // Generate reset token
      const resetToken = crypto.randomUUID();
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
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

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
  } catch (error) {
    next(error);
  }
};

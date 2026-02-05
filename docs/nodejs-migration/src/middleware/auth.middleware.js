/**
 * SIMRS ZEN - Authentication Middleware
 * JWT Token Verification & Session Handling
 */

import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Verify JWT Token Middleware
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token tidak ditemukan',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user from database
    const user = await prisma.profiles.findUnique({
      where: { user_id: decoded.sub },
      include: {
        user_roles: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User tidak ditemukan',
        code: 'USER_NOT_FOUND'
      });
    }

    // Attach user to request
    req.user = {
      id: user.user_id,
      email: user.email,
      fullName: user.full_name,
      roles: user.user_roles.map(r => r.role)
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token sudah kadaluarsa',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token tidak valid',
        code: 'INVALID_TOKEN'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Optional Authentication - doesn't fail if no token
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await prisma.profiles.findUnique({
      where: { user_id: decoded.sub },
      include: { user_roles: true }
    });

    req.user = user ? {
      id: user.user_id,
      email: user.email,
      fullName: user.full_name,
      roles: user.user_roles.map(r => r.role)
    } : null;

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

/**
 * Generate JWT Tokens
 */
export const generateTokens = (user) => {
  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      roles: user.roles
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { sub: user.id, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );

  return { accessToken, refreshToken };
};

/**
 * Refresh Token Handler
 */
export const refreshAccessToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    const user = await prisma.profiles.findUnique({
      where: { user_id: decoded.sub },
      include: { user_roles: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return generateTokens({
      id: user.user_id,
      email: user.email,
      roles: user.user_roles.map(r => r.role)
    });
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

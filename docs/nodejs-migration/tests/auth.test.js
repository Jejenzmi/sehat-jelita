/**
 * SIMRS ZEN - Auth Routes Tests
 * Unit tests for authentication endpoints
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/database.js';
import bcrypt from 'bcryptjs';

// Mock Prisma
vi.mock('../src/config/database.js', () => ({
  prisma: {
    profiles: {
      findUnique: vi.fn(),
      create: vi.fn()
    },
    user_roles: {
      create: vi.fn()
    },
    audit_logs: {
      create: vi.fn()
    },
    system_settings: {
      findFirst: vi.fn()
    }
  }
}));

describe('Auth Routes', () => {
  describe('POST /api/auth/login', () => {
    it('should return 401 for invalid credentials', async () => {
      prisma.profiles.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return tokens for valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 12);
      
      prisma.profiles.findUnique.mockResolvedValue({
        user_id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
        password_hash: hashedPassword,
        user_roles: [{ role: 'admin' }]
      });
      prisma.audit_logs.create.mockResolvedValue({});

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'correctpassword'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for short password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: '12345'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should return 403 when registration is disabled', async () => {
      prisma.system_settings.findFirst.mockResolvedValue({ setting_value: 'false' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'new@example.com',
          password: 'password123',
          fullName: 'New User'
        });

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('REGISTRATION_DISABLED');
    });

    it('should return 409 for existing email', async () => {
      prisma.system_settings.findFirst.mockResolvedValue({ setting_value: 'true' });
      prisma.profiles.findUnique.mockResolvedValue({ email: 'existing@example.com' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'password123',
          fullName: 'New User'
        });

      expect(response.status).toBe(409);
      expect(response.body.code).toBe('EMAIL_EXISTS');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should return 400 when refresh token is missing', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('MISSING_TOKEN');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('NO_TOKEN');
    });
  });
});

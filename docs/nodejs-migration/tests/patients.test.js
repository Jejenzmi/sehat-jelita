/**
 * SIMRS ZEN - Patients Routes Tests
 * Unit tests for patient management endpoints
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/database.js';
import jwt from 'jsonwebtoken';

// Mock Prisma
vi.mock('../src/config/database.js', () => ({
  prisma: {
    patients: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn()
    },
    profiles: {
      findUnique: vi.fn()
    },
    audit_logs: {
      create: vi.fn()
    }
  }
}));

// Helper to generate auth token
const generateTestToken = (roles = ['admin']) => {
  return jwt.sign(
    { sub: 'test-user-id', email: 'test@example.com', roles },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

describe('Patients Routes', () => {
  const authToken = generateTestToken(['admin']);

  beforeEach(() => {
    // Mock user lookup for auth middleware
    prisma.profiles.findUnique.mockResolvedValue({
      user_id: 'test-user-id',
      email: 'test@example.com',
      full_name: 'Test Admin',
      user_roles: [{ role: 'admin' }]
    });
  });

  describe('GET /api/patients', () => {
    it('should return paginated patients list', async () => {
      const mockPatients = [
        {
          id: 'patient-1',
          medical_record_number: 'MR001',
          full_name: 'John Doe',
          date_of_birth: new Date('1990-01-15'),
          gender: 'male'
        },
        {
          id: 'patient-2',
          medical_record_number: 'MR002',
          full_name: 'Jane Doe',
          date_of_birth: new Date('1985-05-20'),
          gender: 'female'
        }
      ];

      prisma.patients.findMany.mockResolvedValue(mockPatients);
      prisma.patients.count.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/patients')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBe(2);
    });

    it('should filter patients by search query', async () => {
      prisma.patients.findMany.mockResolvedValue([
        { id: 'patient-1', full_name: 'John Doe', medical_record_number: 'MR001' }
      ]);
      prisma.patients.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/patients?search=John')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].full_name).toBe('John Doe');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/patients');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/patients/:id', () => {
    it('should return patient details', async () => {
      const mockPatient = {
        id: 'patient-1',
        medical_record_number: 'MR001',
        full_name: 'John Doe',
        date_of_birth: new Date('1990-01-15'),
        gender: 'male',
        visits: [],
        billings: []
      };

      prisma.patients.findUnique.mockResolvedValue(mockPatient);

      const response = await request(app)
        .get('/api/patients/patient-1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('patient-1');
    });

    it('should return 404 for non-existent patient', async () => {
      prisma.patients.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/patients/non-existent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/patients', () => {
    it('should create new patient', async () => {
      const newPatient = {
        fullName: 'New Patient',
        dateOfBirth: '1995-03-20',
        gender: 'female',
        nik: '3201234567890001',
        phone: '08123456789'
      };

      prisma.patients.create.mockResolvedValue({
        id: 'new-patient-id',
        medical_record_number: 'MR003',
        full_name: 'New Patient',
        ...newPatient
      });
      prisma.audit_logs.create.mockResolvedValue({});

      const response = await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newPatient);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.full_name).toBe('New Patient');
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: '', // Empty name
          dateOfBirth: 'invalid-date'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Role-based access', () => {
    it('should allow pendaftaran role to access patients', async () => {
      const pendaftaranToken = generateTestToken(['pendaftaran']);
      
      prisma.profiles.findUnique.mockResolvedValue({
        user_id: 'pendaftaran-user',
        email: 'pendaftaran@example.com',
        full_name: 'Pendaftaran Staff',
        user_roles: [{ role: 'pendaftaran' }]
      });
      prisma.patients.findMany.mockResolvedValue([]);
      prisma.patients.count.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/patients')
        .set('Authorization', `Bearer ${pendaftaranToken}`);

      expect(response.status).toBe(200);
    });

    it('should deny guest role from accessing patients', async () => {
      const guestToken = generateTestToken(['guest']);
      
      prisma.profiles.findUnique.mockResolvedValue({
        user_id: 'guest-user',
        email: 'guest@example.com',
        full_name: 'Guest User',
        user_roles: [{ role: 'guest' }]
      });

      const response = await request(app)
        .get('/api/patients')
        .set('Authorization', `Bearer ${guestToken}`);

      expect(response.status).toBe(403);
    });
  });
});

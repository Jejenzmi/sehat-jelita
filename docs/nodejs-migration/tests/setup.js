/**
 * SIMRS ZEN - Test Setup
 * Global test configuration and mocks
 */

import { vi } from 'vitest';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.JWT_EXPIRES_IN = '1h';

// Mock console to reduce noise
// vi.spyOn(console, 'log').mockImplementation(() => {});
// vi.spyOn(console, 'error').mockImplementation(() => {});

// Global test utilities
global.testUtils = {
  generateMockUser: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    fullName: 'Test User',
    roles: ['admin'],
    ...overrides
  }),

  generateMockPatient: (overrides = {}) => ({
    id: 'test-patient-id',
    medical_record_number: 'MR-TEST-001',
    full_name: 'Test Patient',
    date_of_birth: new Date('1990-01-15'),
    gender: 'male',
    nik: '3201234567890001',
    ...overrides
  }),

  generateMockVisit: (overrides = {}) => ({
    id: 'test-visit-id',
    visit_number: 'VIS-TEST-001',
    patient_id: 'test-patient-id',
    visit_type: 'OUTPATIENT',
    status: 'WAITING',
    ...overrides
  })
};

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
});

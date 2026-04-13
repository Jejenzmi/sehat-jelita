/**
 * SIMRS ZEN - OpenAPI 3.0 Specification
 *
 * Mounted at GET /api/docs (Swagger UI) and GET /api/docs/json (raw spec).
 * Add JSDoc @openapi blocks to route files to auto-generate endpoint docs.
 *
 * Install dependencies:
 *   npm install swagger-ui-express swagger-jsdoc
 */

import type { Express } from 'express';

interface SwaggerSpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
    contact: { name: string; email: string };
    license: { name: string };
  };
  servers: { url: string; description: string }[];
  tags: { name: string; description: string }[];
  components: {
    securitySchemes: Record<string, { type: string; scheme: string; bearerFormat: string; description: string }>;
    schemas: Record<string, Record<string, unknown>>;
    responses: Record<string, { description: string; content?: Record<string, { schema: Record<string, unknown> }> }>;
    parameters: Record<string, Record<string, unknown>>;
  };
  security: Record<string, unknown>[];
  paths: Record<string, Record<string, unknown>>;
}

export const swaggerSpec: SwaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'SIMRS ZEN API',
    version: '1.0.0',
    description: `
## SIMRS ZEN — Hospital Information System API

Full REST API for the SIMRS ZEN Hospital Information System.
Covers patient management, clinical workflows, billing, BPJS integration,
SATU SEHAT, lab, pharmacy, radiology (PACS/DICOM), analytics, and more.

### Authentication
All protected endpoints require a **Bearer JWT** access token:
\`\`\`
Authorization: Bearer <accessToken>
\`\`\`
Tokens are obtained via \`POST /api/auth/login\`.
Access tokens expire in 15 minutes; refresh via \`POST /api/auth/refresh\`.

### Pagination
List endpoints support two pagination modes:
- **Offset**: \`?page=1&limit=20\` → returns \`pagination.total\` + \`total_pages\`
- **Cursor**: \`?cursor=<lastId>&limit=20\` → returns \`pagination.nextCursor\` (faster for large tables)

### Error Format
\`\`\`json
{ "success": false, "error": "Human-readable message", "code": "ERROR_CODE" }
\`\`\`
    `,
    contact: { name: 'SIMRS ZEN Team', email: 'it@simrszen.id' },
    license: { name: 'Proprietary' },
  },
  servers: [
    { url: '/api',        description: 'Production / Current server' },
    { url: 'http://localhost:3000/api', description: 'Local development' },
  ],
  tags: [
    { name: 'Auth',        description: 'Authentication & session management' },
    { name: 'Patients',    description: 'Patient registration & data management' },
    { name: 'Visits',      description: 'Outpatient, inpatient & emergency visits' },
    { name: 'Billing',     description: 'Billing, payments & rule engine' },
    { name: 'Pharmacy',    description: 'Prescriptions & dispensing workflow' },
    { name: 'Lab',         description: 'Laboratory orders, results & critical alerts' },
    { name: 'Radiology',   description: 'Radiology orders & PACS/DICOM integration' },
    { name: 'PACS',        description: 'DICOM studies, worklist & viewer URLs' },
    { name: 'BPJS',        description: 'BPJS Kesehatan VClaim & SATU SEHAT integration' },
    { name: 'Analytics',   description: 'KPI engine, dashboards & scheduled reports' },
    { name: 'Jobs',        description: 'Background job queue management' },
    { name: 'Admin',       description: 'RBAC, user management & system settings' },
    { name: 'Inventory',   description: 'Stock management & auto-reorder' },
    { name: 'HR',          description: 'Staff, shifts & schedules' },
    { name: 'Accounting',  description: 'General ledger & financial reports' },
    { name: 'Reports',     description: 'Kemenkes RL1-RL6 statutory reports' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token from POST /api/auth/login'
      }
    },
    schemas: {
      // ── Core schemas ──────────────────────────────────────────────
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data:    { type: 'object' }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error:   { type: 'string', example: 'Resource tidak ditemukan' },
          code:    { type: 'string', example: 'NOT_FOUND' }
        }
      },
      Pagination: {
        type: 'object',
        properties: {
          page:        { type: 'integer' },
          limit:       { type: 'integer' },
          total:       { type: 'integer' },
          total_pages: { type: 'integer' },
          nextCursor:  { type: 'string', nullable: true, description: 'Set when using cursor pagination' }
        }
      },
      // ── Patient ───────────────────────────────────────────────────
      Patient: {
        type: 'object',
        properties: {
          id:                     { type: 'string', format: 'uuid' },
          medical_record_number:  { type: 'string', example: 'RM250400001' },
          full_name:              { type: 'string', example: 'Budi Santoso' },
          nik:                    { type: 'string', example: '3201234567890001', description: 'Decrypted on read' },
          bpjs_number:            { type: 'string', nullable: true },
          birth_date:             { type: 'string', format: 'date', nullable: true },
          gender:                 { type: 'string', enum: ['male', 'female'] },
          blood_type:             { type: 'string', nullable: true },
          address:                { type: 'string', nullable: true },
          phone:                  { type: 'string', nullable: true },
          mobile_phone:           { type: 'string', nullable: true },
          email:                  { type: 'string', format: 'email', nullable: true },
          is_active:              { type: 'boolean' },
          created_at:             { type: 'string', format: 'date-time' }
        }
      },
      // ── Visit ─────────────────────────────────────────────────────
      Visit: {
        type: 'object',
        properties: {
          id:              { type: 'string', format: 'uuid' },
          visit_number:    { type: 'string' },
          patient_id:      { type: 'string', format: 'uuid' },
          visit_type:      { type: 'string', enum: ['outpatient', 'inpatient', 'emergency'] },
          visit_date:      { type: 'string', format: 'date-time' },
          payment_type:    { type: 'string', enum: ['cash', 'bpjs', 'insurance', 'corporate'] },
          status:          { type: 'string' },
          chief_complaint: { type: 'string', nullable: true }
        }
      },
      // ── Billing ───────────────────────────────────────────────────
      Billing: {
        type: 'object',
        properties: {
          id:             { type: 'string', format: 'uuid' },
          invoice_number: { type: 'string', example: 'INV202504050001' },
          patient_id:     { type: 'string', format: 'uuid' },
          visit_id:       { type: 'string', format: 'uuid', nullable: true },
          payment_type:   { type: 'string' },
          subtotal:       { type: 'number' },
          discount:       { type: 'number' },
          tax:            { type: 'number' },
          total:          { type: 'number' },
          paid_amount:    { type: 'number' },
          status:         { type: 'string', enum: ['pending','partial','paid','cancelled','refunded'] },
          billing_date:   { type: 'string', format: 'date-time' }
        }
      },
      // ── Analytics KPI ─────────────────────────────────────────────
      HospitalKPI: {
        type: 'object',
        properties: {
          BOR:  { type: 'object', properties: { value: { type: 'number' }, label: { type: 'string' }, unit: { type: 'string' }, benchmark: { type: 'string' } } },
          ALOS: { type: 'object', properties: { value: { type: 'number' }, label: { type: 'string' }, unit: { type: 'string' }, benchmark: { type: 'string' } } },
          BTO:  { type: 'object', properties: { value: { type: 'number' }, label: { type: 'string' }, unit: { type: 'string' }, benchmark: { type: 'string' } } },
          TOI:  { type: 'object', properties: { value: { type: 'number' }, label: { type: 'string' }, unit: { type: 'string' }, benchmark: { type: 'string' } } },
          NDR:  { type: 'object', properties: { value: { type: 'number' }, label: { type: 'string' }, unit: { type: 'string' }, benchmark: { type: 'string' } } },
          GDR:  { type: 'object', properties: { value: { type: 'number' }, label: { type: 'string' }, unit: { type: 'string' }, benchmark: { type: 'string' } } },
        }
      },
      // ── Background Job ────────────────────────────────────────────
      BackgroundJob: {
        type: 'object',
        properties: {
          id:           { type: 'string', format: 'uuid' },
          queue_name:   { type: 'string' },
          job_name:     { type: 'string' },
          status:       { type: 'string', enum: ['pending','running','completed','failed','cancelled'] },
          payload:      { type: 'object' },
          result:       { type: 'object', nullable: true },
          error_message:{ type: 'string', nullable: true },
          attempts:     { type: 'integer' },
          priority:     { type: 'integer', minimum: 1, maximum: 10 },
          scheduled_at: { type: 'string', format: 'date-time' },
          completed_at: { type: 'string', format: 'date-time', nullable: true },
          created_at:   { type: 'string', format: 'date-time' }
        }
      },
      // ── DICOM Study ───────────────────────────────────────────────
      DicomStudy: {
        type: 'object',
        properties: {
          id:                 { type: 'string', format: 'uuid' },
          study_instance_uid: { type: 'string' },
          accession_number:   { type: 'string', nullable: true },
          study_date:         { type: 'string', format: 'date', nullable: true },
          study_description:  { type: 'string', nullable: true },
          modality:           { type: 'string', example: 'CT' },
          num_series:         { type: 'integer' },
          num_instances:      { type: 'integer' },
          status:             { type: 'string', enum: ['pending','received','verified','archived'] },
          viewer_url:         { type: 'string', nullable: true },
        }
      }
    },
    responses: {
      NotFound: {
        description: 'Resource tidak ditemukan',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
      },
      Unauthorized: {
        description: 'Token tidak valid atau sudah kadaluarsa',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
      },
      Forbidden: {
        description: 'Tidak memiliki hak akses',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
      },
      ValidationError: {
        description: 'Data tidak valid',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
      }
    },
    parameters: {
      pageParam: {
        name: 'page', in: 'query', schema: { type: 'integer', default: 1 },
        description: 'Page number for offset pagination'
      },
      limitParam: {
        name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 },
        description: 'Items per page'
      },
      cursorParam: {
        name: 'cursor', in: 'query', schema: { type: 'string' },
        description: 'Last item ID for cursor-based pagination (faster than offset for large datasets)'
      },
      fromParam: {
        name: 'from', in: 'query', schema: { type: 'string', format: 'date' },
        description: 'Start date filter (YYYY-MM-DD)'
      },
      toParam: {
        name: 'to', in: 'query', schema: { type: 'string', format: 'date' },
        description: 'End date filter (YYYY-MM-DD)'
      }
    }
  },
  security: [{ BearerAuth: [] }],
  paths: {
    // ── Auth ──────────────────────────────────────────────────────────────────
    '/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Login',
        description: 'Authenticate with email/password. Returns access token (15min) + refresh token (30d).',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': {
            schema: { type: 'object', required: ['email','password'],
              properties: {
                email:    { type: 'string', format: 'email' },
                password: { type: 'string', minLength: 1 }
              }
            }
          }}
        },
        responses: {
          200: {
            description: 'Login berhasil',
            content: { 'application/json': { schema: {
              type: 'object',
              properties: {
                success:      { type: 'boolean' },
                data: { type: 'object', properties: {
                  user:         { type: 'object' },
                  accessToken:  { type: 'string' },
                  refreshToken: { type: 'string' }
                }}
              }
            }}}
          },
          401: { $ref: '#/components/responses/Unauthorized' }
        }
      }
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'], summary: 'Refresh access token', security: [],
        requestBody: {
          required: true,
          content: { 'application/json': {
            schema: { type: 'object', required: ['refreshToken'],
              properties: { refreshToken: { type: 'string' } }
            }
          }}
        },
        responses: {
          200: { description: 'Tokens baru berhasil dibuat' },
          401: { $ref: '#/components/responses/Unauthorized' }
        }
      }
    },
    '/auth/logout': {
      post: { tags: ['Auth'], summary: 'Logout (revoke current session)',
        responses: { 200: { description: 'Logout berhasil' } }
      }
    },
    '/auth/logout-all': {
      post: { tags: ['Auth'], summary: 'Force logout all devices',
        responses: { 200: { description: 'Semua sesi berhasil dicabut' } }
      }
    },
    '/auth/me': {
      get: { tags: ['Auth'], summary: 'Get current user profile',
        responses: { 200: { description: 'Profil pengguna' } }
      }
    },
    // ── Patients ──────────────────────────────────────────────────────────────
    '/patients': {
      get: {
        tags: ['Patients'], summary: 'List patients',
        parameters: [
          { $ref: '#/components/parameters/pageParam' },
          { $ref: '#/components/parameters/limitParam' },
          { $ref: '#/components/parameters/cursorParam' },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by name, MRN, or NIK hash' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active','inactive'], default: 'active' } }
        ],
        responses: {
          200: { description: 'List pasien',
            content: { 'application/json': { schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                data:    { type: 'array', items: { $ref: '#/components/schemas/Patient' } },
                pagination: { $ref: '#/components/schemas/Pagination' }
              }
            }}}
          }
        }
      },
      post: {
        tags: ['Patients'], summary: 'Create patient',
        description: 'NIK, mobile_phone, and email are encrypted at rest. NIK stored as AES-256-GCM ciphertext; search uses SHA-256 hash index.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object', required: ['full_name'],
            properties: {
              full_name:    { type: 'string' },
              nik:          { type: 'string', minLength: 16, maxLength: 16 },
              bpjs_number:  { type: 'string' },
              birth_date:   { type: 'string', format: 'date' },
              gender:       { type: 'string', enum: ['male','female'] },
              address:      { type: 'string' },
              mobile_phone: { type: 'string' },
              email:        { type: 'string', format: 'email' }
            }
          }}}
        },
        responses: {
          201: { description: 'Pasien berhasil didaftarkan' },
          409: { description: 'NIK sudah terdaftar' }
        }
      }
    },
    '/patients/{id}': {
      get: {
        tags: ['Patients'], summary: 'Get patient by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Data pasien (PII fields decrypted)',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Patient' } } }
          },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      put: {
        tags: ['Patients'], summary: 'Update patient',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Patient' } } } },
        responses: { 200: { description: 'Data berhasil diperbarui' }, 404: { $ref: '#/components/responses/NotFound' } }
      }
    },
    // ── Analytics ─────────────────────────────────────────────────────────────
    '/analytics/kpi': {
      get: {
        tags: ['Analytics'], summary: 'Hospital KPIs (BOR, ALOS, BTO, TOI, NDR, GDR)',
        parameters: [
          { $ref: '#/components/parameters/fromParam' },
          { $ref: '#/components/parameters/toParam' }
        ],
        responses: {
          200: { description: 'KPI rumah sakit',
            content: { 'application/json': { schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                data:    { type: 'object', properties: {
                  kpis:     { $ref: '#/components/schemas/HospitalKPI' },
                  beds:     { type: 'object' },
                  inpatient:{ type: 'object' }
                }}
              }
            }}}
          }
        }
      }
    },
    '/analytics/revenue': {
      get: {
        tags: ['Analytics'], summary: 'Revenue analytics by period and payment type',
        parameters: [
          { $ref: '#/components/parameters/fromParam' },
          { $ref: '#/components/parameters/toParam' },
          { name: 'group_by', in: 'query', schema: { type: 'string', enum: ['day','week','month'], default: 'day' } }
        ],
        responses: { 200: { description: 'Revenue analytics' } }
      }
    },
    '/analytics/executive': {
      get: {
        tags: ['Analytics'], summary: 'Executive dashboard — today + MTD summary',
        responses: { 200: { description: 'Executive summary (cached 1 min)' } }
      }
    },
    // ── Jobs ──────────────────────────────────────────────────────────────────
    '/jobs': {
      get: {
        tags: ['Jobs'], summary: 'List background jobs',
        parameters: [
          { name: 'queue_name', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending','running','completed','failed','cancelled'] } },
          { $ref: '#/components/parameters/pageParam' },
          { $ref: '#/components/parameters/limitParam' },
        ],
        responses: { 200: { description: 'List jobs' } }
      },
      post: {
        tags: ['Jobs'], summary: 'Submit a background job',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object', required: ['queue_name','job_name'],
            properties: {
              queue_name:   { type: 'string', example: 'reports' },
              job_name:     { type: 'string', example: 'daily-revenue' },
              payload:      { type: 'object' },
              priority:     { type: 'integer', minimum: 1, maximum: 10, default: 5 },
              max_attempts: { type: 'integer', default: 3 },
              scheduled_at: { type: 'string', format: 'date-time' }
            }
          }}}
        },
        responses: { 202: { description: 'Job diterima',
          content: { 'application/json': { schema: {
            type: 'object',
            properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/BackgroundJob' } }
          }}}
        }}
      }
    },
    // ── PACS ──────────────────────────────────────────────────────────────────
    '/pacs/worklist': {
      get: {
        tags: ['PACS'], summary: 'Query modality worklist',
        description: 'Returns scheduled procedures for the day. DICOM modalities poll this endpoint.',
        parameters: [
          { name: 'date',     in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'modality', in: 'query', schema: { type: 'string', example: 'CT' } },
          { name: 'status',   in: 'query', schema: { type: 'string', enum: ['scheduled','in_progress','completed'], default: 'scheduled' } }
        ],
        responses: { 200: { description: 'Worklist entries' } }
      }
    },
    '/pacs/studies': {
      get: {
        tags: ['PACS'], summary: 'List DICOM studies',
        parameters: [
          { name: 'patient_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'modality',   in: 'query', schema: { type: 'string' } },
          { $ref: '#/components/parameters/pageParam' },
          { $ref: '#/components/parameters/limitParam' },
        ],
        responses: { 200: { description: 'DICOM studies',
          content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              data: { type: 'array', items: { $ref: '#/components/schemas/DicomStudy' } }
            }
          }}}
        }}
      },
      post: {
        tags: ['PACS'], summary: 'Register a DICOM study (PACS gateway webhook)',
        description: 'Called by PACS gateway when a study is received via C-STORE or STOW-RS.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object', required: ['study_instance_uid'],
            properties: {
              study_instance_uid: { type: 'string' },
              accession_number:   { type: 'string' },
              study_date:         { type: 'string', format: 'date' },
              modality:           { type: 'string' },
              study_description:  { type: 'string' },
              patient_id:         { type: 'string', format: 'uuid' }
            }
          }}}
        },
        responses: { 201: { description: 'Study berhasil didaftarkan' } }
      }
    },
    '/pacs/viewer-url/{studyId}': {
      get: {
        tags: ['PACS'], summary: 'Get viewer URLs for a study (WADO-RS, WADO-URI, OHIF)',
        parameters: [{ name: 'studyId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Viewer URLs' } }
      }
    },
    '/billing/generate/{visitId}': {
      post: {
        tags: ['Billing'], summary: 'Auto-generate billing from visit',
        description: 'Collects all services (prescriptions, lab, radiology) and applies billing rules (tariff, discount, tax).',
        parameters: [{ name: 'visitId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          201: { description: 'Billing berhasil dibuat otomatis' },
          409: { description: 'Billing sudah ada untuk kunjungan ini' }
        }
      }
    },
  }
};

/**
 * Mount Swagger UI.
 * Called from app.js:
 *   import { mountSwagger } from './config/swagger.js';
 *   mountSwagger(app);
 */
export async function mountSwagger(app: Express): Promise<void> {
  try {
    const swaggerUi = await import('swagger-ui-express').then(m => m.default || m);
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'SIMRS ZEN API Docs',
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        tagsSorter: 'alpha',
      }
    }));
    app.get('/api/docs/json', (req, res) => res.json(swaggerSpec));
    console.log('[swagger] API docs available at /api/docs');
  } catch (err) {
    // swagger-ui-express not installed → skip gracefully
    console.warn('[swagger] swagger-ui-express not installed, skipping docs mount. Run: npm install swagger-ui-express');
    app.get('/api/docs', (req, res) => res.json({ message: 'Install swagger-ui-express to enable docs', spec: swaggerSpec }));
    app.get('/api/docs/json', (req, res) => res.json(swaggerSpec));
  }
}

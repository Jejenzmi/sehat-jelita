/**
 * SIMRS ZEN - Visits Routes
 * CRUD operations for patient visits (outpatient, inpatient, emergency)
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { requireRole, checkMenuAccess } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();

// Authentication applied globally in routes/index.js
// Validation schemas
const visitSchema = z.object({
  patient_id: z.string().uuid(),
  visit_type: z.enum(['outpatient', 'inpatient', 'emergency']),
  department_id: z.string().uuid().optional(),
  doctor_id: z.string().uuid().optional(),
  bed_id: z.string().uuid().optional().nullable(),
  chief_complaint: z.string().optional(),
  payment_type: z.enum(['cash', 'bpjs', 'insurance', 'corporate']),
  bpjs_sep_number: z.string().optional().nullable(),
  insurance_policy_number: z.string().optional().nullable(),
  notes: z.string().optional()
});

/**
 * GET /api/visits
 * Get all visits with filters
 */
router.get('/', checkMenuAccess('rawat_jalan'), asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    cursor,          // cursor-based: last seen visit ID
    visit_type,
    status = 'active',
    date_from,
    date_to,
    department_id,
    doctor_id,
    search
  } = req.query;

  const limitInt = Math.min(parseInt(limit) || 20, 100);
  const useCursor = !!cursor;

  const include = {
    patients: {
      select: { id: true, medical_record_number: true, full_name: true, birth_date: true, gender: true }
    },
    doctors: { select: { id: true, full_name: true, specialization: true } },
    departments: { select: { id: true, department_name: true } },
    beds: {
      select: { id: true, bed_number: true, rooms: { select: { room_number: true, room_name: true } } }
    }
  };

  const where = {
    ...(visit_type && { visit_type }),
    ...(status && { status }),
    ...(department_id && { department_id }),
    ...(doctor_id && { doctor_id }),
    ...(date_from && date_to && { visit_date: { gte: new Date(date_from), lte: new Date(date_to) } }),
    ...(search && {
      OR: [
        { visit_number: { contains: search, mode: 'insensitive' } },
        { patients: { full_name: { contains: search, mode: 'insensitive' } } },
        { patients: { medical_record_number: { contains: search, mode: 'insensitive' } } }
      ]
    })
  };

  if (useCursor) {
    const visits = await prisma.visits.findMany({
      where, take: limitInt + 1, cursor: { id: cursor }, skip: 1,
      orderBy: { visit_date: 'desc' }, include
    });
    const hasMore = visits.length > limitInt;
    const items = hasMore ? visits.slice(0, limitInt) : visits;
    return res.json({
      success: true, data: items,
      pagination: { limit: limitInt, nextCursor: hasMore ? items[items.length - 1].id : null, hasMore }
    });
  }

  const pageInt = parseInt(page);
  const skip = (pageInt - 1) * limitInt;
  const [visits, total] = await Promise.all([
    prisma.visits.findMany({ where, skip, take: limitInt, orderBy: { visit_date: 'desc' }, include }),
    prisma.visits.count({ where })
  ]);

  res.json({
    success: true,
    data: visits,
    pagination: { page: pageInt, limit: limitInt, total, total_pages: Math.ceil(total / limitInt) }
  });
}));

/**
 * GET /api/visits/today
 * Get today's visits
 */
router.get('/today', asyncHandler(async (req, res) => {
  const { visit_type, department_id } = req.query;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const visits = await prisma.visits.findMany({
    where: {
      visit_date: {
        gte: today,
        lt: tomorrow
      },
      ...(visit_type && { visit_type }),
      ...(department_id && { department_id })
    },
    orderBy: { visit_date: 'asc' },
    include: {
      patients: {
        select: {
          id: true,
          medical_record_number: true,
          full_name: true,
          birth_date: true,
          gender: true
        }
      },
      doctors: { select: { id: true, full_name: true, specialization: true } },
      departments: { select: { id: true, department_name: true } }
    }
  });

  res.json({
    success: true,
    data: visits
  });
}));

/**
 * GET /api/visits/inpatient
 * Get current inpatients
 */
router.get('/inpatient', checkMenuAccess('rawat_inap'), asyncHandler(async (req, res) => {
  const { department_id } = req.query;

  const visits = await prisma.visits.findMany({
    where: {
      visit_type: 'inpatient',
      status: 'active',
      discharge_date: null,
      ...(department_id && { department_id })
    },
    orderBy: { admission_date: 'desc' },
    include: {
      patients: {
        select: {
          id: true,
          medical_record_number: true,
          full_name: true,
          birth_date: true,
          gender: true,
          blood_type: true
        }
      },
      doctors: { select: { id: true, full_name: true, specialization: true } },
      departments: { select: { id: true, department_name: true } },
      beds: {
        select: {
          id: true,
          bed_number: true,
          rooms: { select: { room_number: true, room_name: true } }
        }
      }
    }
  });

  res.json({
    success: true,
    data: visits
  });
}));

/**
 * GET /api/visits/:id
 * Get visit details
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const visit = await prisma.visits.findUnique({
    where: { id },
    include: {
      patients: true,
      doctors: { select: { id: true, full_name: true, specialization: true } },
      departments: true,
      beds: {
        select: {
          id: true, bed_number: true, bed_class: true,
          rooms: { select: { id: true, room_number: true, room_name: true } }
        }
      },
      medical_records: {
        orderBy: { record_date: 'desc' }
      },
      prescriptions: {
        include: { prescription_items: true }
      },
      lab_orders: {
        include: { lab_results: true }
      },
      billings: {
        include: { billing_items: true }
      }
    }
  });

  if (!visit) {
    throw new ApiError(404, 'Kunjungan tidak ditemukan', 'VISIT_NOT_FOUND');
  }

  res.json({
    success: true,
    data: visit
  });
}));

/**
 * POST /api/visits
 * Create new visit (registration)
 */
router.post('/', requireRole(['admin', 'registrasi']), asyncHandler(async (req, res) => {
  const data = visitSchema.parse(req.body);

  // Verify patient exists
  const patient = await prisma.patients.findUnique({ 
    where: { id: data.patient_id } 
  });
  if (!patient) {
    throw new ApiError(404, 'Pasien tidak ditemukan', 'PATIENT_NOT_FOUND');
  }

  // Generate visit number
  const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const typePrefix = data.visit_type === 'outpatient' ? 'RJ' : 
                     data.visit_type === 'inpatient' ? 'RI' : 'IGD';
  
  const lastVisit = await prisma.visits.findFirst({
    where: { visit_number: { startsWith: typePrefix + datePrefix } },
    orderBy: { visit_number: 'desc' }
  });
  
  const seq = lastVisit 
    ? parseInt(lastVisit.visit_number.slice(-4)) + 1 
    : 1;
  
  const visit_number = `${typePrefix}${datePrefix}${seq.toString().padStart(4, '0')}`;

  // Wrap bed reservation and visit creation in a transaction so a failure
  // in either step doesn't leave the database in an inconsistent state.
  const visit = await prisma.$transaction(async (tx) => {
    // If inpatient, atomically reserve the bed to prevent race conditions.
    // updateMany with a status filter ensures we only succeed when the bed is
    // still 'available', preventing two concurrent requests from double-booking.
    if (data.visit_type === 'inpatient' && data.bed_id) {
      const updated = await tx.beds.updateMany({
        where: { id: data.bed_id, status: 'available' },
        data: { status: 'occupied', current_patient_id: data.patient_id }
      });

      if (updated.count === 0) {
        throw new ApiError(400, 'Tempat tidur tidak tersedia', 'BED_NOT_AVAILABLE');
      }
    }

    return tx.visits.create({
      data: {
        ...data,
        visit_number,
        visit_date: new Date(),
        admission_date: data.visit_type === 'inpatient' ? new Date() : null,
        status: 'active',
        created_by: req.user.id
      },
      include: {
        patients: { select: { full_name: true, medical_record_number: true } },
        departments: { select: { department_name: true } }
      }
    });
  });

  // Audit log (outside transaction – non-critical)
  await prisma.audit_logs.create({
    data: {
      table_name: 'visits',
      record_id: visit.id,
      action: 'INSERT',
      user_id: req.user.id,
      new_data: visit
    }
  }).catch(err => console.error('Audit log failed:', err));

  // Emit socket event for queue update
  const io = req.app.get('io');
  io?.to('queue').emit('visit:created', {
    visit_id: visit.id,
    visit_number: visit.visit_number,
    patient_name: visit.patients.full_name,
    department: visit.departments?.department_name
  });

  res.status(201).json({
    success: true,
    message: 'Kunjungan berhasil didaftarkan',
    data: visit
  });
}));

/**
 * PUT /api/visits/:id
 * Update visit
 */
router.put('/:id', requireRole(['admin', 'dokter', 'perawat']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = visitSchema.partial().parse(req.body);

  const existing = await prisma.visits.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, 'Kunjungan tidak ditemukan', 'VISIT_NOT_FOUND');
  }

  const visit = await prisma.visits.update({
    where: { id },
    data
  });

  // Audit log
  await prisma.audit_logs.create({
    data: {
      table_name: 'visits',
      record_id: id,
      action: 'UPDATE',
      user_id: req.user.id,
      old_data: existing,
      new_data: visit
    }
  });

  res.json({
    success: true,
    message: 'Kunjungan berhasil diperbarui',
    data: visit
  });
}));

/**
 * POST /api/visits/:id/discharge
 * Discharge patient (for inpatient)
 */
router.post('/:id/discharge', requireRole(['admin', 'dokter']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { discharge_summary } = req.body;

  const visit = await prisma.visits.findUnique({
    where: { id },
    include: { beds: true }
  });

  if (!visit) {
    throw new ApiError(404, 'Kunjungan tidak ditemukan', 'VISIT_NOT_FOUND');
  }

  if (visit.visit_type !== 'inpatient') {
    throw new ApiError(400, 'Hanya untuk rawat inap', 'INVALID_VISIT_TYPE');
  }

  // Release bed
  if (visit.bed_id) {
    await prisma.beds.update({
      where: { id: visit.bed_id },
      data: { status: 'available', current_patient_id: null }
    });
  }

  const updatedVisit = await prisma.visits.update({
    where: { id },
    data: {
      status: 'discharged',
      discharge_date: new Date(),
      discharge_summary
    }
  });

  res.json({
    success: true,
    message: 'Pasien berhasil dipulangkan',
    data: updatedVisit
  });
}));

/**
 * POST /api/visits/:id/transfer
 * Transfer patient to another department/bed
 */
router.post('/:id/transfer', requireRole(['admin', 'dokter', 'perawat']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { new_department_id, new_bed_id, reason } = req.body;

  const visit = await prisma.visits.findUnique({ where: { id } });
  if (!visit) {
    throw new ApiError(404, 'Kunjungan tidak ditemukan', 'VISIT_NOT_FOUND');
  }

  // Atomically release old bed and reserve new bed inside a single transaction
  // to prevent race conditions where another request grabs the target bed
  // between our availability check and our update.
  const updatedVisit = await prisma.$transaction(async (tx) => {
    // Atomically reserve the new bed if one is requested
    if (new_bed_id) {
      const reserved = await tx.beds.updateMany({
        where: { id: new_bed_id, status: 'available' },
        data: { status: 'occupied', current_patient_id: visit.patient_id }
      });
      if (reserved.count === 0) {
        throw new ApiError(400, 'Tempat tidur tujuan tidak tersedia', 'BED_NOT_AVAILABLE');
      }
    }

    // Release the old bed
    if (visit.bed_id) {
      await tx.beds.update({
        where: { id: visit.bed_id },
        data: { status: 'available', current_patient_id: null }
      });
    }

    return tx.visits.update({
      where: { id },
      data: {
        department_id: new_department_id || visit.department_id,
        bed_id: new_bed_id || visit.bed_id
      }
    });
  });

  // Log transfer
  await prisma.audit_logs.create({
    data: {
      table_name: 'visits',
      record_id: id,
      action: 'TRANSFER',
      user_id: req.user.id,
      old_data: visit,
      new_data: { ...updatedVisit, transfer_reason: reason }
    }
  });

  res.json({
    success: true,
    message: 'Pasien berhasil dipindahkan',
    data: updatedVisit
  });
}));

/**
 * GET /api/visits/stats/summary
 * Get visit statistics
 */
router.get('/stats/summary', asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    todayOutpatient,
    todayInpatient,
    todayEmergency,
    currentInpatients
  ] = await Promise.all([
    prisma.visits.count({
      where: {
        visit_type: 'outpatient',
        visit_date: { gte: today }
      }
    }),
    prisma.visits.count({
      where: {
        visit_type: 'inpatient',
        admission_date: { gte: today }
      }
    }),
    prisma.visits.count({
      where: {
        visit_type: 'emergency',
        visit_date: { gte: today }
      }
    }),
    prisma.visits.count({
      where: {
        visit_type: 'inpatient',
        status: 'active',
        discharge_date: null
      }
    })
  ]);

  res.json({
    success: true,
    data: {
      today: {
        outpatient: todayOutpatient,
        inpatient: todayInpatient,
        emergency: todayEmergency
      },
      current_inpatients: currentInpatients
    }
  });
}));

/**
 * GET /api/visits/queue/today
 * Today's outpatient queue with full patient and doctor info
 */
router.get('/queue/today', asyncHandler(async (req, res) => {
  const { department_id } = req.query;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const visits = await prisma.visits.findMany({
    where: {
      visit_type: 'outpatient',
      visit_date: { gte: today, lt: tomorrow },
      ...(department_id && { department_id })
    },
    orderBy: { queue_number: 'asc' },
    include: {
      patients: {
        select: { id: true, medical_record_number: true, nik: true, full_name: true, gender: true, birth_date: true, phone: true, bpjs_number: true }
      },
      departments: { select: { id: true, department_name: true } },
      doctors: { select: { id: true, full_name: true } }
    }
  });

  res.json({ success: true, data: visits });
}));

/**
 * GET /api/visits/queue/stats
 * Today's queue statistics
 */
router.get('/queue/stats', asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [total, served, waiting, newPatients] = await Promise.all([
    prisma.visits.count({ where: { visit_type: 'outpatient', visit_date: { gte: today, lt: tomorrow } } }),
    prisma.visits.count({ where: { visit_type: 'outpatient', visit_date: { gte: today, lt: tomorrow }, status: { in: ['completed', 'serving'] } } }),
    prisma.visits.count({ where: { visit_type: 'outpatient', visit_date: { gte: today, lt: tomorrow }, status: { in: ['waiting', 'called'] } } }),
    prisma.patients.count({ where: { created_at: { gte: startOfMonth } } }),
  ]);

  res.json({ success: true, data: { total, served, waiting, newPatients } });
}));

/**
 * PATCH /api/visits/:id/status
 * Update visit status (for queue management)
 */
router.patch('/:id/status', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ success: false, error: 'status diperlukan' });

  const visit = await prisma.visits.update({ where: { id }, data: { status } });
  res.json({ success: true, data: visit });
}));

export default router;

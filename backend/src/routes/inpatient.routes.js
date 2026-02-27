/**
 * SIMRS ZEN - Inpatient (Rawat Inap) Routes
 * Manages ward admissions, bed management, and nursing care
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { requireRole, ROLES } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();


// Validation schemas
const admissionSchema = z.object({
  patientId: z.string().uuid(),
  visitId: z.string().uuid(),
  roomId: z.string().uuid(),
  bedId: z.string().uuid(),
  admissionType: z.enum(['PLANNED', 'EMERGENCY', 'TRANSFER']),
  attendingDoctorId: z.string().uuid(),
  admissionDiagnosis: z.string(),
  paymentType: z.enum(['UMUM', 'BPJS', 'ASURANSI', 'PERUSAHAAN']),
  insuranceInfo: z.object({
    insuranceId: z.string().optional(),
    policyNumber: z.string().optional(),
    sepNumber: z.string().optional()
  }).optional(),
  notes: z.string().optional()
});

/**
 * GET /api/inpatient/admissions
 * List current inpatients
 */
router.get('/admissions',
  requireRole([ROLES.DOKTER, ROLES.PERAWAT, ROLES.PENDAFTARAN]),
  asyncHandler(async (req, res) => {
    const { wardId, status, doctorId, page = 1, limit = 50 } = req.query;

    const where = { discharge_date: null };
    if (wardId) where.rooms = { ward_id: wardId };
    if (status) where.status = status;
    if (doctorId) where.attending_doctor_id = doctorId;

    const [admissions, total] = await Promise.all([
      prisma.inpatient_admissions.findMany({
        where,
        include: {
          patients: {
            select: {
              id: true,
              medical_record_number: true,
              full_name: true,
              date_of_birth: true,
              gender: true,
              blood_type: true,
              allergies: true
            }
          },
          beds: {
            include: {
              rooms: { select: { room_name: true, room_type: true, ward_id: true } }
            }
          },
          doctors: { select: { id: true, full_name: true, specialization: true } }
        },
        orderBy: { admission_date: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit)
      }),
      prisma.inpatient_admissions.count({ where })
    ]);

    res.json({
      success: true,
      data: admissions,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  })
);

/**
 * POST /api/inpatient/admissions
 * Admit patient to ward
 */
router.post('/admissions',
  requireRole([ROLES.PENDAFTARAN, ROLES.PERAWAT]),
  asyncHandler(async (req, res) => {
    const data = admissionSchema.parse(req.body);

    // Check bed availability
    const bed = await prisma.beds.findUnique({
      where: { id: data.bedId },
      include: { rooms: true }
    });

    if (!bed || bed.status !== 'AVAILABLE') {
      throw new ApiError(409, 'Bed tidak tersedia');
    }

    const admission = await prisma.$transaction(async (tx) => {
      // Create admission
      const inpatient = await tx.inpatient_admissions.create({
        data: {
          patient_id: data.patientId,
          visit_id: data.visitId,
          room_id: data.roomId,
          bed_id: data.bedId,
          admission_date: new Date(),
          admission_type: data.admissionType,
          attending_doctor_id: data.attendingDoctorId,
          admission_diagnosis: data.admissionDiagnosis,
          payment_type: data.paymentType,
          insurance_info: data.insuranceInfo,
          notes: data.notes,
          status: 'ADMITTED',
          admitted_by: req.user.id
        }
      });

      // Update bed status
      await tx.beds.update({
        where: { id: data.bedId },
        data: {
          status: 'OCCUPIED',
          current_patient_id: data.patientId
        }
      });

      // Update visit type
      await tx.visits.update({
        where: { id: data.visitId },
        data: { visit_type: 'INPATIENT' }
      });

      return inpatient;
    });

    res.status(201).json({
      success: true,
      data: admission
    });
  })
);

/**
 * POST /api/inpatient/admissions/:id/nursing-notes
 * Add nursing notes/observations
 */
router.post('/admissions/:id/nursing-notes',
  requireRole([ROLES.PERAWAT]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { 
      noteType, 
      content, 
      vitalSigns,
      painScore,
      fallRiskScore,
      pressureUlcerRisk
    } = req.body;

    const note = await prisma.nursing_notes.create({
      data: {
        admission_id: id,
        nurse_id: req.user.id,
        note_type: noteType, // 'OBSERVATION', 'INTERVENTION', 'ASSESSMENT', 'HANDOVER'
        content,
        vital_signs: vitalSigns,
        pain_score: painScore,
        fall_risk_score: fallRiskScore,
        pressure_ulcer_risk: pressureUlcerRisk,
        recorded_at: new Date()
      }
    });

    res.status(201).json({
      success: true,
      data: note
    });
  })
);

/**
 * PUT /api/inpatient/admissions/:id/transfer
 * Transfer patient to different bed/room
 */
router.put('/admissions/:id/transfer',
  requireRole([ROLES.PERAWAT, ROLES.PENDAFTARAN]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { newBedId, reason } = req.body;

    // Check new bed availability
    const newBed = await prisma.beds.findUnique({
      where: { id: newBedId }
    });

    if (!newBed || newBed.status !== 'AVAILABLE') {
      throw new ApiError(409, 'Bed tujuan tidak tersedia');
    }

    const admission = await prisma.$transaction(async (tx) => {
      const current = await tx.inpatient_admissions.findUnique({
        where: { id }
      });

      // Free old bed
      await tx.beds.update({
        where: { id: current.bed_id },
        data: { status: 'CLEANING', current_patient_id: null }
      });

      // Occupy new bed
      await tx.beds.update({
        where: { id: newBedId },
        data: { status: 'OCCUPIED', current_patient_id: current.patient_id }
      });

      // Log transfer
      await tx.bed_transfers.create({
        data: {
          admission_id: id,
          from_bed_id: current.bed_id,
          to_bed_id: newBedId,
          transfer_reason: reason,
          transferred_by: req.user.id,
          transferred_at: new Date()
        }
      });

      // Update admission
      return tx.inpatient_admissions.update({
        where: { id },
        data: { bed_id: newBedId }
      });
    });

    res.json({
      success: true,
      data: admission
    });
  })
);

/**
 * PUT /api/inpatient/admissions/:id/discharge
 * Discharge patient
 */
router.put('/admissions/:id/discharge',
  requireRole([ROLES.DOKTER, ROLES.PERAWAT]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      dischargeType,
      dischargeDiagnosis,
      dischargeCondition,
      dischargeMedications,
      followUpInstructions,
      followUpDate,
      referralInfo
    } = req.body;

    const admission = await prisma.$transaction(async (tx) => {
      const current = await tx.inpatient_admissions.findUnique({
        where: { id }
      });

      // Calculate LOS
      const admissionDate = new Date(current.admission_date);
      const dischargeDate = new Date();
      const losMs = dischargeDate - admissionDate;
      const losDays = Math.ceil(losMs / (1000 * 60 * 60 * 24));

      // Update admission
      const updated = await tx.inpatient_admissions.update({
        where: { id },
        data: {
          discharge_date: dischargeDate,
          discharge_type: dischargeType, // 'RECOVERED', 'IMPROVED', 'APS', 'REFERRED', 'DECEASED'
          discharge_diagnosis: dischargeDiagnosis,
          discharge_condition: dischargeCondition,
          discharge_medications: dischargeMedications,
          follow_up_instructions: followUpInstructions,
          follow_up_date: followUpDate,
          referral_info: referralInfo,
          length_of_stay_days: losDays,
          status: 'DISCHARGED',
          discharged_by: req.user.id
        }
      });

      // Free bed
      await tx.beds.update({
        where: { id: current.bed_id },
        data: { status: 'CLEANING', current_patient_id: null }
      });

      // Update visit
      await tx.visits.update({
        where: { id: current.visit_id },
        data: { 
          status: 'COMPLETED',
          checkout_time: dischargeDate
        }
      });

      return updated;
    });

    res.json({
      success: true,
      data: admission
    });
  })
);

/**
 * GET /api/inpatient/beds
 * Get bed occupancy status
 */
router.get('/beds',
  requireRole([ROLES.PERAWAT, ROLES.PENDAFTARAN, ROLES.MANAJEMEN]),
  asyncHandler(async (req, res) => {
    const { wardId, roomType } = req.query;

    const where = {};
    if (wardId) where.rooms = { ward_id: wardId };
    if (roomType) where.rooms = { ...where.rooms, room_type: roomType };

    const beds = await prisma.beds.findMany({
      where,
      include: {
        rooms: {
          select: {
            id: true,
            room_name: true,
            room_type: true,
            room_class: true,
            daily_rate: true
          }
        },
        patients: {
          select: {
            id: true,
            medical_record_number: true,
            full_name: true
          }
        }
      },
      orderBy: [
        { rooms: { room_name: 'asc' } },
        { bed_number: 'asc' }
      ]
    });

    // Summary by status
    const summary = beds.reduce((acc, bed) => {
      acc[bed.status] = (acc[bed.status] || 0) + 1;
      return acc;
    }, { total: beds.length });

    res.json({
      success: true,
      data: { beds, summary }
    });
  })
);

/**
 * GET /api/inpatient/census
 * Daily census report
 */
router.get('/census',
  requireRole([ROLES.PERAWAT, ROLES.MANAJEMEN]),
  asyncHandler(async (req, res) => {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const [
      previousDayPatients,
      admissions,
      discharges,
      transfers
    ] = await Promise.all([
      // Patients from previous day
      prisma.inpatient_admissions.count({
        where: {
          admission_date: { lt: targetDate },
          OR: [
            { discharge_date: null },
            { discharge_date: { gte: targetDate } }
          ]
        }
      }),
      // New admissions
      prisma.inpatient_admissions.count({
        where: {
          admission_date: {
            gte: targetDate,
            lt: nextDate
          }
        }
      }),
      // Discharges
      prisma.inpatient_admissions.count({
        where: {
          discharge_date: {
            gte: targetDate,
            lt: nextDate
          }
        }
      }),
      // Transfers
      prisma.bed_transfers.count({
        where: {
          transferred_at: {
            gte: targetDate,
            lt: nextDate
          }
        }
      })
    ]);

    const currentPatients = previousDayPatients + admissions - discharges;

    res.json({
      success: true,
      data: {
        date: targetDate.toISOString().split('T')[0],
        previousDay: previousDayPatients,
        admissions,
        discharges,
        transfers,
        currentPatients
      }
    });
  })
);

export default router;

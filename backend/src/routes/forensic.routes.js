/**
 * SIMRS ZEN - Forensic Medicine Routes
 * Handles mortuary, autopsy, visum, and death certificates
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { requireRole, ROLES } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();


// ============================================
// MORTUARY CASES
// ============================================

/**
 * GET /api/forensic/cases
 * List mortuary cases
 */
router.get('/cases',
  requireRole([ROLES.FORENSIK, ROLES.DOKTER, ROLES.ADMIN]),
  asyncHandler(async (req, res) => {
    const { status, case_type, date_from, date_to } = req.query;

    const where = {};
    if (status) where.status = status;
    if (case_type) where.case_type = case_type;
    if (date_from && date_to) {
      where.admission_date = {
        gte: date_from,
        lte: date_to
      };
    }

    const cases = await prisma.mortuary_cases.findMany({
      where,
      include: {
        patients: true
      },
      orderBy: { admission_date: 'desc' }
    });

    res.json({
      success: true,
      data: cases
    });
  })
);

/**
 * POST /api/forensic/cases
 * Register mortuary case
 */
router.post('/cases',
  requireRole([ROLES.FORENSIK, ROLES.DOKTER]),
  asyncHandler(async (req, res) => {
    const { 
      patientId, caseType, admissionDate, timeOfDeath, placeOfDeath,
      causeOfDeathPreliminary, mannerOfDeath, policeReportNumber,
      informantName, informantRelation, informantPhone, refrigeratorNumber, notes
    } = req.body;

    // Generate case number
    const year = new Date().getFullYear();
    const count = await prisma.mortuary_cases.count({
      where: {
        case_number: { startsWith: `MOR-${year}` }
      }
    });
    const caseNumber = `MOR-${year}-${String(count + 1).padStart(4, '0')}`;

    const mortCase = await prisma.mortuary_cases.create({
      data: {
        case_number: caseNumber,
        patient_id: patientId,
        case_type: caseType, // natural, unnatural, unknown
        admission_date: admissionDate,
        time_of_death: timeOfDeath,
        place_of_death: placeOfDeath,
        cause_of_death_preliminary: causeOfDeathPreliminary,
        manner_of_death: mannerOfDeath,
        police_report_number: policeReportNumber,
        informant_name: informantName,
        informant_relation: informantRelation,
        informant_phone: informantPhone,
        refrigerator_number: refrigeratorNumber,
        status: 'admitted',
        notes,
        admitted_by: req.user.id
      },
      include: { patients: true }
    });

    res.status(201).json({
      success: true,
      data: mortCase
    });
  })
);

/**
 * PATCH /api/forensic/cases/:id/release
 * Release body from mortuary
 */
router.patch('/cases/:id/release',
  requireRole([ROLES.FORENSIK]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { releaseDate, releasedTo, relationToDeceased, idNumber, notes } = req.body;

    const mortCase = await prisma.mortuary_cases.update({
      where: { id },
      data: {
        status: 'released',
        release_date: releaseDate,
        released_to: releasedTo,
        released_to_relation: relationToDeceased,
        released_to_id: idNumber,
        release_notes: notes,
        released_by: req.user.id
      }
    });

    res.json({
      success: true,
      data: mortCase
    });
  })
);

// ============================================
// AUTOPSY RECORDS
// ============================================

/**
 * GET /api/forensic/autopsies
 * List autopsy records
 */
router.get('/autopsies',
  requireRole([ROLES.FORENSIK, ROLES.DOKTER]),
  asyncHandler(async (req, res) => {
    const { status, case_id } = req.query;

    const where = {};
    if (status) where.status = status;
    if (case_id) where.case_id = case_id;

    const autopsies = await prisma.autopsy_records.findMany({
      where,
      include: {
        mortuary_cases: {
          include: { patients: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json({
      success: true,
      data: autopsies
    });
  })
);

/**
 * POST /api/forensic/autopsies
 * Create autopsy record
 */
router.post('/autopsies',
  requireRole([ROLES.FORENSIK]),
  asyncHandler(async (req, res) => {
    const { 
      caseId, autopsyType, requestDate, requestedBy,
      pathologistId, pathologistName, assistantNames, notes
    } = req.body;

    // Generate autopsy number
    const year = new Date().getFullYear();
    const count = await prisma.autopsy_records.count({
      where: { autopsy_number: { startsWith: `AUT-${year}` } }
    });
    const autopsyNumber = `AUT-${year}-${String(count + 1).padStart(4, '0')}`;

    const autopsy = await prisma.autopsy_records.create({
      data: {
        autopsy_number: autopsyNumber,
        case_id: caseId,
        autopsy_type: autopsyType, // clinical, medicolegal, partial
        request_date: requestDate,
        requested_by: requestedBy,
        pathologist_id: pathologistId,
        pathologist_name: pathologistName,
        assistant_names: assistantNames,
        status: 'requested',
        notes
      }
    });

    res.status(201).json({
      success: true,
      data: autopsy
    });
  })
);

/**
 * PATCH /api/forensic/autopsies/:id/findings
 * Record autopsy findings
 */
router.patch('/autopsies/:id/findings',
  requireRole([ROLES.FORENSIK]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      autopsyDate, externalExamination, internalExamination,
      organWeights, microscopicFindings, toxicologyResults,
      causeOfDeathPrimary, causeOfDeathSecondary, contributingFactors,
      mannerOfDeath, opinion, notes
    } = req.body;

    const autopsy = await prisma.autopsy_records.update({
      where: { id },
      data: {
        autopsy_date: autopsyDate,
        external_examination: externalExamination,
        internal_examination: internalExamination,
        organ_weights: organWeights,
        microscopic_findings: microscopicFindings,
        toxicology_results: toxicologyResults,
        cause_of_death_primary: causeOfDeathPrimary,
        cause_of_death_secondary: causeOfDeathSecondary,
        contributing_factors: contributingFactors,
        manner_of_death: mannerOfDeath,
        opinion,
        status: 'completed',
        completed_date: new Date(),
        notes
      }
    });

    res.json({
      success: true,
      data: autopsy
    });
  })
);

// ============================================
// VISUM ET REPERTUM
// ============================================

/**
 * GET /api/forensic/visum
 * List visum reports
 */
router.get('/visum',
  requireRole([ROLES.FORENSIK, ROLES.DOKTER]),
  asyncHandler(async (req, res) => {
    const { status, visum_type } = req.query;

    const where = {};
    if (status) where.status = status;
    if (visum_type) where.visum_type = visum_type;

    const visumReports = await prisma.visum_reports.findMany({
      where,
      include: { patients: true },
      orderBy: { created_at: 'desc' }
    });

    res.json({
      success: true,
      data: visumReports
    });
  })
);

/**
 * POST /api/forensic/visum
 * Create visum et repertum
 */
router.post('/visum',
  requireRole([ROLES.FORENSIK, ROLES.DOKTER]),
  asyncHandler(async (req, res) => {
    const {
      patientId, visumType, policeRequestNumber, policeRequestDate,
      requestingUnit, caseDescription, examinationDate,
      physicalFindings, injuries, conclusions, opinion, notes
    } = req.body;

    // Generate visum number
    const year = new Date().getFullYear();
    const count = await prisma.visum_reports.count({
      where: { visum_number: { startsWith: `VER-${year}` } }
    });
    const visumNumber = `VER-${year}-${String(count + 1).padStart(4, '0')}`;

    const visum = await prisma.visum_reports.create({
      data: {
        visum_number: visumNumber,
        patient_id: patientId,
        visum_type: visumType, // hidup, mati, psikiatri, etc
        police_request_number: policeRequestNumber,
        police_request_date: policeRequestDate,
        requesting_unit: requestingUnit,
        case_description: caseDescription,
        examination_date: examinationDate,
        physical_findings: physicalFindings,
        injuries,
        conclusions,
        opinion,
        status: 'draft',
        examining_doctor_id: req.user.id,
        notes
      }
    });

    res.status(201).json({
      success: true,
      data: visum
    });
  })
);

// ============================================
// DEATH CERTIFICATES
// ============================================

/**
 * POST /api/forensic/death-certificates
 * Issue death certificate
 */
router.post('/death-certificates',
  requireRole([ROLES.FORENSIK, ROLES.DOKTER]),
  asyncHandler(async (req, res) => {
    const {
      caseId, patientId, timeOfDeath, placeOfDeath,
      causeOfDeathImmediate, causeOfDeathAntecedent, causeOfDeathUnderlying,
      otherSignificantConditions, mannerOfDeath, autopsyPerformed, notes
    } = req.body;

    // Generate certificate number
    const year = new Date().getFullYear();
    const count = await prisma.death_certificates.count({
      where: { certificate_number: { startsWith: `SKM-${year}` } }
    });
    const certNumber = `SKM-${year}-${String(count + 1).padStart(5, '0')}`;

    const certificate = await prisma.death_certificates.create({
      data: {
        certificate_number: certNumber,
        case_id: caseId,
        patient_id: patientId,
        time_of_death: timeOfDeath,
        place_of_death: placeOfDeath,
        cause_immediate: causeOfDeathImmediate,
        cause_antecedent: causeOfDeathAntecedent,
        cause_underlying: causeOfDeathUnderlying,
        other_conditions: otherSignificantConditions,
        manner_of_death: mannerOfDeath,
        autopsy_performed: autopsyPerformed,
        issuing_doctor_id: req.user.id,
        issue_date: new Date(),
        status: 'issued',
        notes
      }
    });

    res.status(201).json({
      success: true,
      data: certificate
    });
  })
);

export default router;

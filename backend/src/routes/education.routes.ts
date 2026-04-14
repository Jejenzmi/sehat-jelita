/**
 * SIMRS ZEN - Education Routes
 * CRUD operations for education programs, trainees, rotations, activities, and research
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { requireRole } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();

// Require admin/education roles for all education routes
router.use(requireRole(['admin', 'pendidikan']));

// Validation schemas
const createProgramSchema = z.object({
  program_name: z.string().min(2, 'Nama program minimal 2 karakter'),
  program_type: z.string().min(2, 'Tipe program minimal 2 karakter'),
  description: z.string().optional(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime().optional(),
  max_participants: z.number().int().positive().optional(),
  is_active: z.boolean().default(true)
});

const updateProgramSchema = createProgramSchema.partial();

const createTraineeSchema = z.object({
  full_name: z.string().min(2, 'Nama lengkap minimal 2 karakter'),
  student_id: z.string().min(2, 'Student ID minimal 2 karakter'),
  program_id: z.string().uuid('Program ID tidak valid'),
  institution: z.string().optional(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime().optional(),
  status: z.string().default('active'),
  notes: z.string().optional()
});

const updateTraineeSchema = createTraineeSchema.partial();

// ============================================
// EDUCATION PROGRAMS CRUD
// ============================================

/**
 * GET /api/education/programs
 * Get all education programs
 */
router.get('/programs', asyncHandler(async (req: Request, res: Response) => {
  const { program_type, is_active } = req.query;

  const where: Record<string, unknown> = {};
  if (program_type) where.program_type = program_type;
  if (is_active !== undefined) where.is_active = is_active === 'true';

  const programs = await prisma.education_programs.findMany({
    where,
    orderBy: { start_date: 'desc' }
  });

  res.json({ success: true, data: programs });
}));

/**
 * POST /api/education/programs
 * Create new program
 */
router.post('/programs', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createProgramSchema.parse(req.body);

  const program = await prisma.education_programs.create({
    data: {
      ...validatedData,
      start_date: new Date(validatedData.start_date),
      end_date: validatedData.end_date ? new Date(validatedData.end_date) : null
    }
  });

  res.status(201).json({ success: true, data: program });
}));

/**
 * PUT /api/education/programs/:id
 * Update program
 */
router.put('/programs/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const validatedData = updateProgramSchema.parse(req.body);

  const program = await prisma.education_programs.findUnique({ where: { id } });
  if (!program) {
    throw new ApiError(404, 'Program tidak ditemukan', 'PROGRAM_NOT_FOUND');
  }

  const updated = await prisma.education_programs.update({
    where: { id },
    data: {
      ...validatedData,
      start_date: validatedData.start_date ? new Date(validatedData.start_date) : undefined,
      end_date: validatedData.end_date ? new Date(validatedData.end_date) : undefined
    }
  });

  res.json({ success: true, data: updated });
}));

/**
 * DELETE /api/education/programs/:id
 * Delete program
 */
router.delete('/programs/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const program = await prisma.education_programs.findUnique({ where: { id } });
  if (!program) {
    throw new ApiError(404, 'Program tidak ditemukan', 'PROGRAM_NOT_FOUND');
  }

  await prisma.education_programs.delete({ where: { id } });

  res.json({ success: true, message: 'Program berhasil dihapus' });
}));

// ============================================
// MEDICAL TRAINEES CRUD
// ============================================

/**
 * GET /api/education/trainees
 * Get all medical trainees
 */
router.get('/trainees', asyncHandler(async (req: Request, res: Response) => {
  const { program_id, status } = req.query;

  const where: Record<string, unknown> = {};
  if (program_id) where.program_id = program_id;
  if (status) where.status = status;

  const trainees = await prisma.medical_trainees.findMany({
    where,
    include: {
      education_programs: {
        select: {
          id: true,
          program_name: true,
          program_type: true
        }
      }
    },
    orderBy: { start_date: 'desc' }
  });

  res.json({ success: true, data: trainees });
}));

/**
 * POST /api/education/trainees
 * Create new trainee
 */
router.post('/trainees', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createTraineeSchema.parse(req.body);

  const trainee = await prisma.medical_trainees.create({
    data: {
      ...validatedData,
      start_date: new Date(validatedData.start_date),
      end_date: validatedData.end_date ? new Date(validatedData.end_date) : null
    }
  });

  res.status(201).json({ success: true, data: trainee });
}));

/**
 * PUT /api/education/trainees/:id
 * Update trainee
 */
router.put('/trainees/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const validatedData = updateTraineeSchema.parse(req.body);

  const trainee = await prisma.medical_trainees.findUnique({ where: { id } });
  if (!trainee) {
    throw new ApiError(404, 'Trainee tidak ditemukan', 'TRAINEE_NOT_FOUND');
  }

  const updated = await prisma.medical_trainees.update({
    where: { id },
    data: {
      ...validatedData,
      start_date: validatedData.start_date ? new Date(validatedData.start_date) : undefined,
      end_date: validatedData.end_date ? new Date(validatedData.end_date) : undefined
    }
  });

  res.json({ success: true, data: updated });
}));

/**
 * DELETE /api/education/trainees/:id
 * Delete trainee
 */
router.delete('/trainees/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const trainee = await prisma.medical_trainees.findUnique({ where: { id } });
  if (!trainee) {
    throw new ApiError(404, 'Trainee tidak ditemukan', 'TRAINEE_NOT_FOUND');
  }

  await prisma.medical_trainees.delete({ where: { id } });

  res.json({ success: true, message: 'Trainee berhasil dihapus' });
}));

// ============================================
// CLINICAL ROTATIONS CRUD
// ============================================

/**
 * GET /api/education/rotations
 * Get all clinical rotations
 */
router.get('/rotations', asyncHandler(async (req: Request, res: Response) => {
  const { trainee_id, department_id } = req.query;

  const where: Record<string, unknown> = {};
  if (trainee_id) where.trainee_id = trainee_id;
  if (department_id) where.department_id = department_id;

  const rotations = await prisma.clinical_rotations.findMany({
    where,
    include: {
      medical_trainees: {
        select: {
          id: true,
          full_name: true,
          student_id: true
        }
      },
      departments: {
        select: {
          id: true,
          department_name: true
        }
      }
    },
    orderBy: { start_date: 'desc' }
  });

  res.json({ success: true, data: rotations });
}));

/**
 * POST /api/education/rotations
 * Create new rotation
 */
router.post('/rotations', asyncHandler(async (req: Request, res: Response) => {
  const rotationData = req.body;

  const rotation = await prisma.clinical_rotations.create({
    data: rotationData
  });

  res.status(201).json({ success: true, data: rotation });
}));

/**
 * PUT /api/education/rotations/:id
 * Update rotation
 */
router.put('/rotations/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const rotationData = req.body;

  const rotation = await prisma.clinical_rotations.findUnique({ where: { id } });
  if (!rotation) {
    throw new ApiError(404, 'Rotasi tidak ditemukan', 'ROTATION_NOT_FOUND');
  }

  const updated = await prisma.clinical_rotations.update({
    where: { id },
    data: rotationData
  });

  res.json({ success: true, data: updated });
}));

/**
 * DELETE /api/education/rotations/:id
 * Delete rotation
 */
router.delete('/rotations/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const rotation = await prisma.clinical_rotations.findUnique({ where: { id } });
  if (!rotation) {
    throw new ApiError(404, 'Rotasi tidak ditemukan', 'ROTATION_NOT_FOUND');
  }

  await prisma.clinical_rotations.delete({ where: { id } });

  res.json({ success: true, message: 'Rotasi berhasil dihapus' });
}));

// ============================================
// ACADEMIC ACTIVITIES CRUD
// ============================================

/**
 * GET /api/education/activities
 * Get all academic activities
 */
router.get('/activities', asyncHandler(async (req: Request, res: Response) => {
  const { activity_type, trainee_id } = req.query;

  const where: Record<string, unknown> = {};
  if (activity_type) where.activity_type = activity_type;
  if (trainee_id) where.trainee_id = trainee_id;

  const activities = await prisma.academic_activities.findMany({
    where,
    include: {
      medical_trainees: {
        select: {
          id: true,
          full_name: true,
          student_id: true
        }
      }
    },
    orderBy: { activity_date: 'desc' }
  });

  res.json({ success: true, data: activities });
}));

/**
 * POST /api/education/activities
 * Create new activity
 */
router.post('/activities', asyncHandler(async (req: Request, res: Response) => {
  const activityData = req.body;

  const activity = await prisma.academic_activities.create({
    data: activityData
  });

  res.status(201).json({ success: true, data: activity });
}));

/**
 * DELETE /api/education/activities/:id
 * Delete activity
 */
router.delete('/activities/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const activity = await prisma.academic_activities.findUnique({ where: { id } });
  if (!activity) {
    throw new ApiError(404, 'Aktivitas tidak ditemukan', 'ACTIVITY_NOT_FOUND');
  }

  await prisma.academic_activities.delete({ where: { id } });

  res.json({ success: true, message: 'Aktivitas berhasil dihapus' });
}));

// ============================================
// RESEARCH PROJECTS CRUD
// ============================================

/**
 * GET /api/education/research
 * Get all research projects
 */
router.get('/research', asyncHandler(async (req: Request, res: Response) => {
  const { trainee_id, status } = req.query;

  const where: Record<string, unknown> = {};
  if (trainee_id) where.trainee_id = trainee_id;
  if (status) where.status = status;

  const research = await prisma.research_projects.findMany({
    where,
    include: {
      medical_trainees: {
        select: {
          id: true,
          full_name: true,
          student_id: true
        }
      }
    },
    orderBy: { start_date: 'desc' }
  });

  res.json({ success: true, data: research });
}));

/**
 * POST /api/education/research
 * Create new research project
 */
router.post('/research', asyncHandler(async (req: Request, res: Response) => {
  const researchData = req.body;

  const research = await prisma.research_projects.create({
    data: researchData
  });

  res.status(201).json({ success: true, data: research });
}));

/**
 * PUT /api/education/research/:id
 * Update research project
 */
router.put('/research/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const researchData = req.body;

  const research = await prisma.research_projects.findUnique({ where: { id } });
  if (!research) {
    throw new ApiError(404, 'Penelitian tidak ditemukan', 'RESEARCH_NOT_FOUND');
  }

  const updated = await prisma.research_projects.update({
    where: { id },
    data: researchData
  });

  res.json({ success: true, data: updated });
}));

/**
 * DELETE /api/education/research/:id
 * Delete research project
 */
router.delete('/research/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const research = await prisma.research_projects.findUnique({ where: { id } });
  if (!research) {
    throw new ApiError(404, 'Penelitian tidak ditemukan', 'RESEARCH_NOT_FOUND');
  }

  await prisma.research_projects.delete({ where: { id } });

  res.json({ success: true, message: 'Penelitian berhasil dihapus' });
}));

export default router;

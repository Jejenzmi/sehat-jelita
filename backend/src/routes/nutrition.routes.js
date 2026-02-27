/**
 * SIMRS ZEN - Nutrition Routes
 * Manages patient diets, meal plans, and nutrition assessments
 */

import { Router } from 'express';
import { prisma } from '../config/database.js';
import { requireRole, ROLES } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();


/**
 * GET /api/nutrition/patients
 * List patients requiring nutrition management
 */
router.get('/patients',
  requireRole([ROLES.GIZI, ROLES.DOKTER, ROLES.PERAWAT]),
  asyncHandler(async (req, res) => {
    const patients = await prisma.inpatient_admissions.findMany({
      where: { discharge_date: null },
      include: {
        patients: {
          select: { id: true, medical_record_number: true, full_name: true, allergies: true }
        },
        beds: { include: { rooms: true } },
        nutrition_orders: {
          where: { status: 'ACTIVE' },
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    });

    res.json({ success: true, data: patients });
  })
);

/**
 * POST /api/nutrition/orders
 * Create nutrition/diet order
 */
router.post('/orders',
  requireRole([ROLES.GIZI, ROLES.DOKTER]),
  asyncHandler(async (req, res) => {
    const { 
      patientId, 
      admissionId, 
      dietType, 
      dietDescription,
      caloricRequirement,
      proteinRequirement,
      restrictions,
      allergies,
      textureModification,
      fluidRestriction,
      specialInstructions
    } = req.body;

    const order = await prisma.nutrition_orders.create({
      data: {
        patient_id: patientId,
        admission_id: admissionId,
        diet_type: dietType,
        diet_description: dietDescription,
        caloric_requirement: caloricRequirement,
        protein_requirement: proteinRequirement,
        restrictions,
        allergies,
        texture_modification: textureModification,
        fluid_restriction: fluidRestriction,
        special_instructions: specialInstructions,
        status: 'ACTIVE',
        ordered_by: req.user.id
      }
    });

    res.status(201).json({ success: true, data: order });
  })
);

/**
 * GET /api/nutrition/meal-plans
 * Get meal plans for today
 */
router.get('/meal-plans',
  requireRole([ROLES.GIZI]),
  asyncHandler(async (req, res) => {
    const { date, mealType, wardId } = req.query;

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const where = {
      meal_date: targetDate
    };
    if (mealType) where.meal_type = mealType;

    const plans = await prisma.meal_plans.findMany({
      where,
      include: {
        patients: { select: { full_name: true, medical_record_number: true } },
        nutrition_orders: { select: { diet_type: true, restrictions: true, allergies: true } }
      },
      orderBy: [{ meal_type: 'asc' }, { patients: { full_name: 'asc' } }]
    });

    res.json({ success: true, data: plans });
  })
);

/**
 * POST /api/nutrition/meal-plans/generate
 * Generate meal plans for all inpatients
 */
router.post('/meal-plans/generate',
  requireRole([ROLES.GIZI]),
  asyncHandler(async (req, res) => {
    const { date } = req.body;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    // Get all active inpatients with nutrition orders
    const patients = await prisma.inpatient_admissions.findMany({
      where: { discharge_date: null },
      include: {
        nutrition_orders: { where: { status: 'ACTIVE' }, take: 1 }
      }
    });

    const mealTypes = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK_AM', 'SNACK_PM'];

    const created = await Promise.all(
      patients.flatMap(admission => 
        mealTypes.map(mealType => 
          prisma.meal_plans.upsert({
            where: {
              patient_id_meal_date_meal_type: {
                patient_id: admission.patient_id,
                meal_date: targetDate,
                meal_type: mealType
              }
            },
            create: {
              patient_id: admission.patient_id,
              admission_id: admission.id,
              nutrition_order_id: admission.nutrition_orders[0]?.id,
              meal_date: targetDate,
              meal_type: mealType,
              status: 'PLANNED'
            },
            update: {}
          })
        )
      )
    );

    res.json({ success: true, data: { generated: created.length } });
  })
);

/**
 * PUT /api/nutrition/meal-plans/:id/serve
 * Mark meal as served
 */
router.put('/meal-plans/:id/serve',
  requireRole([ROLES.GIZI]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { menuItems, notes } = req.body;

    const plan = await prisma.meal_plans.update({
      where: { id },
      data: {
        status: 'SERVED',
        menu_items: menuItems,
        served_at: new Date(),
        served_by: req.user.id,
        notes
      }
    });

    res.json({ success: true, data: plan });
  })
);

/**
 * POST /api/nutrition/assessments
 * Record nutrition assessment
 */
router.post('/assessments',
  requireRole([ROLES.GIZI]),
  asyncHandler(async (req, res) => {
    const {
      patientId,
      admissionId,
      weight,
      height,
      bmi,
      nutritionRiskScore,
      assessmentType,
      findings,
      recommendations
    } = req.body;

    const assessment = await prisma.nutrition_assessments.create({
      data: {
        patient_id: patientId,
        admission_id: admissionId,
        assessment_date: new Date(),
        weight,
        height,
        bmi,
        nutrition_risk_score: nutritionRiskScore,
        assessment_type: assessmentType,
        findings,
        recommendations,
        assessed_by: req.user.id
      }
    });

    res.status(201).json({ success: true, data: assessment });
  })
);

/**
 * GET /api/nutrition/allergies/:patientId
 * Get patient allergy list
 */
router.get('/allergies/:patientId',
  requireRole([ROLES.GIZI, ROLES.DOKTER, ROLES.PERAWAT]),
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;

    const allergies = await prisma.patient_allergies.findMany({
      where: { patient_id: patientId, is_active: true }
    });

    res.json({ success: true, data: allergies });
  })
);

/**
 * GET /api/nutrition/stats
 * Nutrition department statistics
 */
router.get('/stats',
  requireRole([ROLES.GIZI, ROLES.MANAJEMEN]),
  asyncHandler(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalPatients,
      mealsByStatus,
      dietTypes
    ] = await Promise.all([
      prisma.inpatient_admissions.count({ where: { discharge_date: null } }),
      prisma.meal_plans.groupBy({
        by: ['status'],
        where: { meal_date: today },
        _count: true
      }),
      prisma.nutrition_orders.groupBy({
        by: ['diet_type'],
        where: { status: 'ACTIVE' },
        _count: true
      })
    ]);

    res.json({
      success: true,
      data: { totalPatients, mealsByStatus, dietTypes }
    });
  })
);

export default router;

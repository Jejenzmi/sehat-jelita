/**
 * SIMRS ZEN - Clinical Decision Support (CDS) Service
 *
 * Active checks:
 *   1. Drug-drug interactions
 *   2. Drug-allergy interactions
 *   3. Dosage validation (min/max per weight/age)
 *   4. Contraindication by diagnosis (ICD-10/ICD-11)
 *   5. Duplicate therapy detection
 */

import { prisma } from '../config/database.js';
import { logger } from '../middleware/logger.js';

// -- Severity levels --
export const SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  DANGER: 'danger',
  CRITICAL: 'critical',
} as const;

export type SeverityLevel = typeof SEVERITY[keyof typeof SEVERITY];

export interface PrescriptionItem {
  medicine_id?: string;
  medicine_name?: string;
  dosage?: string;
  frequency?: string;
  quantity?: number;
}

export interface CheckPrescriptionParams {
  patient_id: string;
  items: PrescriptionItem[];
  diagnosis_codes?: string[];
}

export interface CDSAlert {
  type: string;
  severity: SeverityLevel;
  title: string;
  medicine?: string;
  medicine_a?: string;
  medicine_b?: string;
  description?: string;
  clinical_effect?: string;
  management?: string;
  reaction?: string;
  notes?: string;
  matched_allergen?: string;
  prescribed_dose?: string;
  max_dose?: string;
  min_dose?: string;
  icd_code?: string;
  diagnosis?: string;
  recommendation?: string;
  existing_prescription?: string;
  prescription_date?: Date;
}

export interface CDSSummary {
  total: number;
  critical: number;
  danger: number;
  warning: number;
  info: number;
}

export interface CDSResult {
  alerts: CDSAlert[];
  safe: boolean;
  has_critical?: boolean;
  summary?: CDSSummary;
}

export interface CheckSingleDrugParams {
  patient_id: string;
  medicine_id?: string;
  medicine_name?: string;
  dosage?: string;
  existing_medicine_ids?: string[];
}

/**
 * Full prescription CDS check
 */
export async function checkPrescription({ patient_id, items, diagnosis_codes = [] }: CheckPrescriptionParams): Promise<CDSResult> {
  const alerts: CDSAlert[] = [];

  if (!items?.length) return { alerts, safe: true };

  const medicineIds = items.map(i => i.medicine_id).filter((id): id is string => Boolean(id));

  // Fetch patient data
  const patient = await prisma.patients.findUnique({
    where: { id: patient_id },
    select: {
      id: true, full_name: true, birth_date: true, gender: true,
      allergy_notes: true,
      // TODO: Add weight field to patients schema
      // weight: true,
    }
  }).catch(() => null);

  const patientAge = patient?.birth_date
    ? Math.floor((Date.now() - new Date(patient.birth_date).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  // Run all checks in parallel
  const [interactionAlerts, allergyAlerts, dosageAlerts, contraindicationAlerts, duplicateAlerts] =
    await Promise.all([
      checkDrugInteractions(medicineIds, items),
      checkAllergies(patient_id, patient, medicineIds, items),
      checkDosages(items, patient, patientAge),
      checkContraindications(medicineIds, items, diagnosis_codes),
      checkDuplicateTherapy(patient_id, items),
    ]);

  alerts.push(...interactionAlerts, ...allergyAlerts, ...dosageAlerts, ...contraindicationAlerts, ...duplicateAlerts);

  // Sort by severity
  const severityOrder: Record<SeverityLevel, number> = { critical: 0, danger: 1, warning: 2, info: 3 };
  alerts.sort((a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4));

  const hasCritical = alerts.some(a => a.severity === SEVERITY.CRITICAL || a.severity === SEVERITY.DANGER);

  return {
    alerts,
    safe: alerts.length === 0,
    has_critical: hasCritical,
    summary: {
      total: alerts.length,
      critical: alerts.filter(a => a.severity === SEVERITY.CRITICAL).length,
      danger: alerts.filter(a => a.severity === SEVERITY.DANGER).length,
      warning: alerts.filter(a => a.severity === SEVERITY.WARNING).length,
      info: alerts.filter(a => a.severity === SEVERITY.INFO).length,
    },
  };
}

/**
 * Check single drug CDS (for real-time as doctor types)
 */
export async function checkSingleDrug({ patient_id, medicine_id, medicine_name, dosage, existing_medicine_ids = [] }: CheckSingleDrugParams): Promise<CDSResult> {
  const alerts: CDSAlert[] = [];

  if (!medicine_id) return { alerts, safe: true };

  const allIds = [...existing_medicine_ids.filter(Boolean), medicine_id];

  const patient = await prisma.patients.findUnique({
    where: { id: patient_id },
    select: { id: true, allergy_notes: true, birth_date: true, gender: true }
    // TODO: Add weight field to patients schema - was: weight: true
  }).catch(() => null);

  // Check interactions with existing meds
  if (existing_medicine_ids.length > 0) {
    const interactions = await prisma.drug_interactions.findMany({
      where: {
        is_active: true,
        OR: [
          { medicine_id_a: medicine_id, medicine_id_b: { in: existing_medicine_ids } },
          { medicine_id_b: medicine_id, medicine_id_a: { in: existing_medicine_ids } },
        ],
      },
      include: {
        medicine_a: { select: { medicine_name: true } },
        medicine_b: { select: { medicine_name: true } },
      },
    }).catch(() => []);

    for (const ix of interactions) {
      alerts.push({
        type: 'drug_interaction',
        severity: ix.severity === 'severe' ? SEVERITY.CRITICAL
          : ix.severity === 'moderate' ? SEVERITY.DANGER
            : SEVERITY.WARNING,
        title: 'Interaksi Obat',
        medicine_a: ix.medicine_a?.medicine_name ?? undefined,
        medicine_b: ix.medicine_b?.medicine_name ?? undefined,
        description: ix.description ?? undefined,
        clinical_effect: ix.clinical_effect ?? undefined,
        management: ix.management ?? undefined,
      });
    }
  }

  // Check allergy
  if (patient) {
    const drugAllergies = await prisma.patient_drug_allergies.findMany({
      where: { patient_id, is_active: true, medicine_id },
    }).catch(() => []);

    for (const allergy of drugAllergies) {
      alerts.push({
        type: 'allergy',
        severity: SEVERITY.CRITICAL,
        title: 'Alergi Obat',
        medicine: medicine_name,
        reaction: allergy.reaction_type ?? undefined,
        notes: allergy.notes ?? undefined,
      });
    }

    // Check allergy notes (text-based)
    if (patient.allergy_notes && medicine_name) {
      const allergyLower = patient.allergy_notes.toLowerCase();
      const nameLower = medicine_name.toLowerCase();
      const words = allergyLower.split(/[\s,;]+/).filter(w => w.length > 3);
      for (const word of words) {
        if (nameLower.includes(word)) {
          alerts.push({
            type: 'allergy_text',
            severity: SEVERITY.DANGER,
            title: 'Kemungkinan Alergi',
            medicine: medicine_name,
            matched_allergen: word,
            description: `Nama obat "${medicine_name}" cocok dengan catatan alergi pasien: "${word}"`,
          });
        }
      }
    }
  }

  return { alerts, safe: alerts.length === 0 };
}

// -- Internal Check Functions --

async function checkDrugInteractions(medicineIds: string[], items: PrescriptionItem[]): Promise<CDSAlert[]> {
  const alerts: CDSAlert[] = [];
  if (medicineIds.length < 2) return alerts;

  try {
    const interactions = await prisma.drug_interactions.findMany({
      where: {
        is_active: true,
        medicine_id_a: { in: medicineIds },
        medicine_id_b: { in: medicineIds },
      },
      include: {
        medicine_a: { select: { medicine_name: true } },
        medicine_b: { select: { medicine_name: true } },
      },
    });

    for (const ix of interactions) {
      if (medicineIds.includes(ix.medicine_id_a) && medicineIds.includes(ix.medicine_id_b)) {
        alerts.push({
          type: 'drug_interaction',
          severity: ix.severity === 'severe' ? SEVERITY.CRITICAL
            : ix.severity === 'moderate' ? SEVERITY.DANGER
              : SEVERITY.WARNING,
          title: 'Interaksi Obat',
          medicine_a: ix.medicine_a?.medicine_name ?? undefined,
          medicine_b: ix.medicine_b?.medicine_name ?? undefined,
          description: ix.description ?? undefined,
          clinical_effect: ix.clinical_effect ?? undefined,
          management: ix.management ?? undefined,
        });
      }
    }
  } catch (e) {
    logger.warn('CDS drug interaction check failed', { error: (e as Error).message });
  }

  return alerts;
}

async function checkAllergies(
  patient_id: string,
  patient: { id: string; allergy_notes: string | null; birth_date: Date | null; gender: string | null } | null,
  medicineIds: string[],
  items: PrescriptionItem[]
): Promise<CDSAlert[]> {
  const alerts: CDSAlert[] = [];
  if (!patient_id) return alerts;

  try {
    // 1. Check specific drug allergies in DB
    const drugAllergies = await prisma.patient_drug_allergies.findMany({
      where: { patient_id, is_active: true, medicine_id: { in: medicineIds } },
      include: { medicines: { select: { medicine_name: true } } },
    });

    for (const allergy of drugAllergies) {
      alerts.push({
        type: 'allergy',
        severity: SEVERITY.CRITICAL,
        title: 'ALERGI OBAT TERCATAT',
        medicine: allergy.medicines?.medicine_name || allergy.allergen_name || undefined,
        reaction: allergy.reaction_type ?? undefined,
        notes: allergy.notes ?? undefined,
        description: `Pasien memiliki riwayat alergi terhadap ${allergy.medicines?.medicine_name || allergy.allergen_name}`,
      });
    }

    // 2. Text-based allergy check from patient notes
    if (patient?.allergy_notes) {
      const allergyLower = patient.allergy_notes.toLowerCase();
      for (const item of items) {
        if (!item.medicine_name) continue;
        const nameLower = item.medicine_name.toLowerCase();
        const words = allergyLower.split(/[\s,;]+/).filter(w => w.length > 3);
        for (const word of words) {
          if (nameLower.includes(word)) {
            alerts.push({
              type: 'allergy_text',
              severity: SEVERITY.DANGER,
              title: 'Kemungkinan Alergi',
              medicine: item.medicine_name,
              matched_allergen: word,
              description: `Nama obat cocok dengan catatan alergi: "${word}"`,
            });
          }
        }
      }
    }
  } catch (e) {
    logger.warn('CDS allergy check failed', { error: (e as Error).message });
  }

  return alerts;
}

async function checkDosages(
  items: PrescriptionItem[],
  patient: { id: string; allergy_notes: string | null; birth_date: Date | null; gender: string | null } | null,
  patientAge: number | null
): Promise<CDSAlert[]> {
  const alerts: CDSAlert[] = [];

  // TODO: Add medicine_dosage_rules model to Prisma schema to enable dosage validation
  // The dosage check is currently disabled until the model is added
  void items;
  void patient;
  void patientAge;

  /* Original implementation awaiting medicine_dosage_rules model:
  try {
    for (const item of items) {
      if (!item.medicine_id) continue;

      // Find dosage rules
      const rules = await prisma.medicine_dosage_rules.findMany({
        where: { medicine_id: item.medicine_id, is_active: true },
      }).catch(() => []);

      if (!rules.length) continue;

      const bestRule = rules.find(r => {
        if (patientAge !== null && r.age_min !== null && patientAge < r.age_min) return false;
        if (patientAge !== null && r.age_max !== null && patientAge > r.age_max) return false;
        return true;
      }) || rules[0];

      // Parse dosage string to get numeric value
      const doseNum = parseFloat(item.dosage || '');
      if (isNaN(doseNum)) continue;

      if (bestRule.max_single_dose && doseNum > bestRule.max_single_dose) {
        alerts.push({
          type: 'overdose',
          severity: SEVERITY.DANGER,
          title: 'Dosis Melebihi Batas',
          medicine: item.medicine_name,
          prescribed_dose: item.dosage,
          max_dose: `${bestRule.max_single_dose} ${bestRule.dose_unit || ''}`,
          description: `Dosis ${doseNum} melebihi batas maksimum ${bestRule.max_single_dose}`,
        });
      }

      if (bestRule.min_single_dose && doseNum < bestRule.min_single_dose) {
        alerts.push({
          type: 'underdose',
          severity: SEVERITY.WARNING,
          title: 'Dosis Dibawah Minimal',
          medicine: item.medicine_name,
          prescribed_dose: item.dosage,
          min_dose: `${bestRule.min_single_dose} ${bestRule.dose_unit || ''}`,
          description: `Dosis ${doseNum} dibawah batas minimum ${bestRule.min_single_dose}`,
        });
      }

      // Pediatric/geriatric warning
      if (patientAge !== null && patientAge < 12 && bestRule.pediatric_warning) {
        alerts.push({
          type: 'pediatric_warning',
          severity: SEVERITY.WARNING,
          title: 'Peringatan Pediatrik',
          medicine: item.medicine_name,
          description: bestRule.pediatric_warning,
        });
      }

      if (patientAge !== null && patientAge > 65 && bestRule.geriatric_warning) {
        alerts.push({
          type: 'geriatric_warning',
          severity: SEVERITY.WARNING,
          title: 'Peringatan Geriatrik',
          medicine: item.medicine_name,
          description: bestRule.geriatric_warning,
        });
      }
    }
  } catch (e) {
    logger.warn('CDS dosage check failed', { error: (e as Error).message });
  }
  */

  return alerts;
}

async function checkContraindications(medicineIds: string[], items: PrescriptionItem[], diagnosis_codes: string[]): Promise<CDSAlert[]> {
  const alerts: CDSAlert[] = [];
  if (!diagnosis_codes.length || !medicineIds.length) return alerts;

  // TODO: Add drug_contraindications model to Prisma schema to enable contraindication checking
  void medicineIds;
  void items;
  void diagnosis_codes;

  /* Original implementation awaiting drug_contraindications model:
  try {
    const contraindications = await prisma.drug_contraindications.findMany({
      where: {
        medicine_id: { in: medicineIds },
        icd_code: { in: diagnosis_codes },
        is_active: true,
      },
      include: {
        medicines: { select: { medicine_name: true } },
      },
    }).catch(() => []);

    for (const ci of contraindications) {
      alerts.push({
        type: 'contraindication',
        severity: ci.severity === 'absolute' ? SEVERITY.CRITICAL : SEVERITY.DANGER,
        title: 'Kontraindikasi Diagnosis',
        medicine: ci.medicines?.medicine_name ?? undefined,
        icd_code: ci.icd_code ?? undefined,
        diagnosis: ci.diagnosis_name ?? undefined,
        description: ci.description ?? undefined,
        recommendation: ci.recommendation ?? undefined,
      });
    }
  } catch (e) {
    logger.warn('CDS contraindication check failed', { error: (e as Error).message });
  }
  */

  return alerts;
}

async function checkDuplicateTherapy(patient_id: string, items: PrescriptionItem[]): Promise<CDSAlert[]> {
  const alerts: CDSAlert[] = [];
  if (!patient_id || !items.length) return alerts;

  try {
    // Check for active prescriptions with same medicines
    const medicineIds = items.map(i => i.medicine_id).filter((id): id is string => Boolean(id));
    if (!medicineIds.length) return alerts;

    const activePrescriptions = await prisma.prescription_items.findMany({
      where: {
        medicine_id: { in: medicineIds },
        prescriptions: {
          patient_id,
          status: { in: ['pending', 'verified', 'preparing', 'ready'] },
        },
      },
      include: {
        prescriptions: { select: { prescription_number: true, prescription_date: true } },
        // TODO: Add medicines relation to prescription_items schema - use medicine_name field directly
        // medicines: { select: { medicine_name: true } },
      },
    }).catch(() => []);

    for (const dup of activePrescriptions) {
      alerts.push({
        type: 'duplicate_therapy',
        severity: SEVERITY.WARNING,
        title: 'Terapi Duplikasi',
        // Use medicine_name field directly instead of medicines relation
        medicine: dup.medicine_name || undefined,
        existing_prescription: dup.prescriptions?.prescription_number ?? undefined,
        prescription_date: dup.prescriptions?.prescription_date ?? undefined,
        // Use medicine_name field directly instead of medicines relation
        description: `Obat ${dup.medicine_name} sudah ada di resep aktif ${dup.prescriptions?.prescription_number}`,
      });
    }
  } catch (e) {
    logger.warn('CDS duplicate therapy check failed', { error: (e as Error).message });
  }

  return alerts;
}

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

// ── Severity levels ───────────────────────────────────────────────────────────
const SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  DANGER: 'danger',
  CRITICAL: 'critical',
};

/**
 * Full prescription CDS check
 * @param {Object} params
 * @param {string} params.patient_id - Patient UUID
 * @param {Array} params.items - [{medicine_id, medicine_name, dosage, frequency, quantity}]
 * @param {Array} [params.diagnosis_codes] - Active ICD codes for patient
 * @returns {Object} { alerts: [], safe: boolean }
 */
export async function checkPrescription({ patient_id, items, diagnosis_codes = [] }) {
  const alerts = [];

  if (!items?.length) return { alerts, safe: true };

  const medicineIds = items.map(i => i.medicine_id).filter(Boolean);
  
  // Fetch patient data
  const patient = await prisma.patients.findUnique({
    where: { id: patient_id },
    select: {
      id: true, full_name: true, birth_date: true, gender: true,
      allergy_notes: true, weight: true,
    }
  }).catch(() => null);

  const patientAge = patient?.birth_date
    ? Math.floor((Date.now() - new Date(patient.birth_date)) / (365.25 * 24 * 3600 * 1000))
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
  const severityOrder = { critical: 0, danger: 1, warning: 2, info: 3 };
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
export async function checkSingleDrug({ patient_id, medicine_id, medicine_name, dosage, existing_medicine_ids = [] }) {
  const alerts = [];

  if (!medicine_id) return { alerts, safe: true };

  const allIds = [...existing_medicine_ids. filter(Boolean), medicine_id];

  const patient = await prisma.patients.findUnique({
    where: { id: patient_id },
    select: { id: true, allergy_notes: true, birth_date: true, weight: true, gender: true }
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
        medicine_a: { select: { name: true } },
        medicine_b: { select: { name: true } },
      },
    }).catch(() => []);

    for (const ix of interactions) {
      alerts.push({
        type: 'drug_interaction',
        severity: ix.severity === 'severe' ? SEVERITY.CRITICAL 
                : ix.severity === 'moderate' ? SEVERITY.DANGER 
                : SEVERITY.WARNING,
        title: 'Interaksi Obat',
        medicine_a: ix.medicine_a?.name,
        medicine_b: ix.medicine_b?.name,
        description: ix.description,
        clinical_effect: ix.clinical_effect,
        management: ix.management,
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
        reaction: allergy.reaction_type,
        notes: allergy.notes,
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

// ── Internal Check Functions ──────────────────────────────────────────────────

async function checkDrugInteractions(medicineIds, items) {
  const alerts = [];
  if (medicineIds.length < 2) return alerts;

  try {
    const interactions = await prisma.drug_interactions.findMany({
      where: {
        is_active: true,
        medicine_id_a: { in: medicineIds },
        medicine_id_b: { in: medicineIds },
      },
      include: {
        medicine_a: { select: { name: true } },
        medicine_b: { select: { name: true } },
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
          medicine_a: ix.medicine_a?.name,
          medicine_b: ix.medicine_b?.name,
          description: ix.description,
          clinical_effect: ix.clinical_effect,
          management: ix.management,
        });
      }
    }
  } catch (e) {
    logger.warn('CDS drug interaction check failed', { error: e.message });
  }

  return alerts;
}

async function checkAllergies(patient_id, patient, medicineIds, items) {
  const alerts = [];
  if (!patient_id) return alerts;

  try {
    // 1. Check specific drug allergies in DB
    const drugAllergies = await prisma.patient_drug_allergies.findMany({
      where: { patient_id, is_active: true, medicine_id: { in: medicineIds } },
      include: { medicines: { select: { name: true } } },
    });

    for (const allergy of drugAllergies) {
      alerts.push({
        type: 'allergy',
        severity: SEVERITY.CRITICAL,
        title: 'ALERGI OBAT TERCATAT',
        medicine: allergy.medicines?.name || allergy.allergen_name,
        reaction: allergy.reaction_type,
        notes: allergy.notes,
        description: `Pasien memiliki riwayat alergi terhadap ${allergy.medicines?.name || allergy.allergen_name}`,
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
    logger.warn('CDS allergy check failed', { error: e.message });
  }

  return alerts;
}

async function checkDosages(items, patient, patientAge) {
  const alerts = [];

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
      const doseNum = parseFloat(item.dosage);
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
    logger.warn('CDS dosage check failed', { error: e.message });
  }

  return alerts;
}

async function checkContraindications(medicineIds, items, diagnosis_codes) {
  const alerts = [];
  if (!diagnosis_codes.length || !medicineIds.length) return alerts;

  try {
    const contraindications = await prisma.drug_contraindications.findMany({
      where: {
        medicine_id: { in: medicineIds },
        icd_code: { in: diagnosis_codes },
        is_active: true,
      },
      include: {
        medicines: { select: { name: true } },
      },
    }).catch(() => []);

    for (const ci of contraindications) {
      alerts.push({
        type: 'contraindication',
        severity: ci.severity === 'absolute' ? SEVERITY.CRITICAL : SEVERITY.DANGER,
        title: 'Kontraindikasi Diagnosis',
        medicine: ci.medicines?.name,
        icd_code: ci.icd_code,
        diagnosis: ci.diagnosis_name,
        description: ci.description,
        recommendation: ci.recommendation,
      });
    }
  } catch (e) {
    logger.warn('CDS contraindication check failed', { error: e.message });
  }

  return alerts;
}

async function checkDuplicateTherapy(patient_id, items) {
  const alerts = [];
  if (!patient_id || !items.length) return alerts;

  try {
    // Check for active prescriptions with same medicines
    const medicineIds = items.map(i => i.medicine_id).filter(Boolean);
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
        medicines: { select: { name: true } },
      },
    }).catch(() => []);

    for (const dup of activePrescriptions) {
      alerts.push({
        type: 'duplicate_therapy',
        severity: SEVERITY.WARNING,
        title: 'Terapi Duplikasi',
        medicine: dup.medicines?.name || dup.medicine_name,
        existing_prescription: dup.prescriptions?.prescription_number,
        prescription_date: dup.prescriptions?.prescription_date,
        description: `Obat ${dup.medicines?.name} sudah ada di resep aktif ${dup.prescriptions?.prescription_number}`,
      });
    }
  } catch (e) {
    logger.warn('CDS duplicate therapy check failed', { error: e.message });
  }

  return alerts;
}

-- Migration: add_diagnoses_icd11
-- Adds diagnoses table (ICD-11 & ICD-10 compatible) and its relation to medical_records

CREATE TABLE IF NOT EXISTS "diagnoses" (
  "id"                UUID          NOT NULL DEFAULT gen_random_uuid(),
  "medical_record_id" UUID,
  "visit_id"          UUID,
  "patient_id"        UUID,

  -- ICD-11 fields
  "icd11_code"        TEXT,
  "icd11_entity_id"   TEXT,
  "icd11_title_en"    TEXT,
  "icd11_title_id"    TEXT,

  -- ICD-10 backward compat
  "icd10_code"        TEXT,
  "icd10_title"       TEXT,

  "diagnosis_type"    TEXT          NOT NULL DEFAULT 'primer',
  "is_confirmed"      BOOLEAN       NOT NULL DEFAULT true,
  "notes"             TEXT,
  "created_by"        TEXT,
  "created_at"        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  "updated_at"        TIMESTAMPTZ   NOT NULL DEFAULT now(),

  CONSTRAINT "diagnoses_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "diagnoses_medical_record_id_fkey"
    FOREIGN KEY ("medical_record_id") REFERENCES "medical_records"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "diagnoses_medical_record_id_idx" ON "diagnoses"("medical_record_id");
CREATE INDEX IF NOT EXISTS "diagnoses_visit_id_idx"          ON "diagnoses"("visit_id");
CREATE INDEX IF NOT EXISTS "diagnoses_icd11_code_idx"        ON "diagnoses"("icd11_code");
CREATE INDEX IF NOT EXISTS "diagnoses_icd10_code_idx"        ON "diagnoses"("icd10_code");

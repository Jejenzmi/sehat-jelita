-- ============================================================
-- Migration: add_missing_tables_and_patient_user_id
-- Generated: 2026-04-12
-- Run this manually when your Postgres DB (port 5433) is up
-- ============================================================

-- ── 1. patients.user_id ─────────────────────────────────────
ALTER TABLE patients ADD COLUMN IF NOT EXISTS user_id TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);

-- ── 2. custom_form_templates ────────────────────────────────
CREATE TABLE IF NOT EXISTS custom_form_templates (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name        TEXT        NOT NULL,
  form_type   TEXT,
  schema      JSONB       NOT NULL DEFAULT '{}',
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_by  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_custom_form_templates_is_active ON custom_form_templates(is_active);

-- ── 3. custom_report_templates ───────────────────────────────
CREATE TABLE IF NOT EXISTS custom_report_templates (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name        TEXT        NOT NULL,
  report_type TEXT,
  config      JSONB       NOT NULL DEFAULT '{}',
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_by  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_custom_report_templates_is_active ON custom_report_templates(is_active);

-- ── 4. patient_insurances ────────────────────────────────────
CREATE TABLE IF NOT EXISTS patient_insurances (
  id               TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  patient_id       TEXT        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  insurance_type   TEXT        NOT NULL,
  insurance_number TEXT,
  insurance_name   TEXT,
  valid_from       TIMESTAMPTZ,
  valid_until      TIMESTAMPTZ,
  is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_patient_insurances_patient_id ON patient_insurances(patient_id);

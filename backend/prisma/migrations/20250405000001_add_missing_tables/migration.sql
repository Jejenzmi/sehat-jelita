-- ============================================================
-- Migration: Add Missing Tables
-- sisrute_referrals, inventory_reorder_settings,
-- inacbg_calculation_history, drg_codes
-- ============================================================

-- SISRUTE Referrals
CREATE TABLE IF NOT EXISTS sisrute_referrals (
  id                       UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_number          VARCHAR(50)  UNIQUE NOT NULL,
  sisrute_id               VARCHAR(100),
  patient_id               UUID    REFERENCES patients(id) ON DELETE SET NULL,
  referral_type            VARCHAR(20)  NOT NULL DEFAULT 'outgoing',
  referral_category        VARCHAR(50),
  source_facility_code     VARCHAR(50),
  source_facility_name     VARCHAR(255),
  source_city              VARCHAR(100),
  destination_facility_code VARCHAR(50),
  destination_facility_name VARCHAR(255),
  destination_city         VARCHAR(100),
  destination_department   VARCHAR(100),
  primary_diagnosis        VARCHAR(20),
  diagnosis_description    TEXT,
  reason_for_referral      TEXT,
  clinical_summary         TEXT,
  referring_doctor_name    VARCHAR(255),
  transport_type           VARCHAR(50),
  status                   VARCHAR(30)  NOT NULL DEFAULT 'pending',
  sync_status              VARCHAR(30)  NOT NULL DEFAULT 'pending',
  created_at               TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sisrute_referrals_patient ON sisrute_referrals(patient_id);
CREATE INDEX IF NOT EXISTS idx_sisrute_referrals_status  ON sisrute_referrals(status);

-- Inventory Reorder Settings (per medicine or per inventory_item)
CREATE TABLE IF NOT EXISTS inventory_reorder_settings (
  id                    UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_id           UUID    REFERENCES medicines(id) ON DELETE CASCADE,
  inventory_item_id     UUID    REFERENCES inventory_items(id) ON DELETE CASCADE,
  auto_reorder_enabled  BOOLEAN NOT NULL DEFAULT true,
  reorder_point         INTEGER NOT NULL DEFAULT 10,
  reorder_quantity      INTEGER NOT NULL DEFAULT 100,
  max_stock             INTEGER,
  preferred_supplier    VARCHAR(255),
  lead_time_days        INTEGER NOT NULL DEFAULT 7,
  created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_reorder_medicine  ON inventory_reorder_settings(medicine_id);
CREATE INDEX IF NOT EXISTS idx_inv_reorder_item      ON inventory_reorder_settings(inventory_item_id);

-- INACBG Calculation History
CREATE TABLE IF NOT EXISTS inacbg_calculation_history (
  id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  drg_code            VARCHAR(20),
  drg_description     TEXT,
  severity_level      INTEGER NOT NULL DEFAULT 1,
  los_actual          INTEGER,
  los_grouper         INTEGER,
  primary_diagnosis   VARCHAR(20),
  secondary_diagnoses JSONB   NOT NULL DEFAULT '[]',
  procedures          JSONB   NOT NULL DEFAULT '[]',
  base_tariff         DECIMAL(15,2),
  adjustment_factor   DECIMAL(8,4),
  final_tariff        DECIMAL(15,2),
  hospital_cost       DECIMAL(15,2),
  variance            DECIMAL(15,2),
  calculated_by       VARCHAR(255),
  calculated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- DRG Codes (INADRG / INACBG reference)
CREATE TABLE IF NOT EXISTS drg_codes (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  drg_code        VARCHAR(20)  UNIQUE NOT NULL,
  drg_name        VARCHAR(500) NOT NULL,
  severity_level  INTEGER NOT NULL DEFAULT 1,
  national_tariff DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Seed a minimal set of common DRG codes for initial use
INSERT INTO drg_codes (drg_code, drg_name, severity_level, national_tariff) VALUES
  ('I-1-10-I', 'Penyakit Jantung Iskemik – Tingkat Keparahan 1', 1, 7500000),
  ('I-1-10-II', 'Penyakit Jantung Iskemik – Tingkat Keparahan 2', 2, 12000000),
  ('I-1-10-III', 'Penyakit Jantung Iskemik – Tingkat Keparahan 3', 3, 18000000),
  ('I-6-13-I', 'Stroke – Tingkat Keparahan 1', 1, 9000000),
  ('I-6-13-II', 'Stroke – Tingkat Keparahan 2', 2, 14000000),
  ('I-6-13-III', 'Stroke – Tingkat Keparahan 3', 3, 22000000),
  ('J-4-30-I', 'Pneumonia – Tingkat Keparahan 1', 1, 5000000),
  ('J-4-30-II', 'Pneumonia – Tingkat Keparahan 2', 2, 8000000),
  ('K-6-12-I', 'Appendisitis – Tingkat Keparahan 1', 1, 6000000),
  ('K-6-12-II', 'Appendisitis – Tingkat Keparahan 2', 2, 9500000),
  ('N-1-10-I', 'Nefrolithiasis – Tingkat Keparahan 1', 1, 4500000),
  ('N-1-10-II', 'Nefrolithiasis – Tingkat Keparahan 2', 2, 7000000),
  ('Z-6-11-I', 'Persalinan Normal – Tingkat Keparahan 1', 1, 3500000),
  ('Z-6-11-II', 'SC – Tingkat Keparahan 1', 1, 7800000),
  ('A-1-10-I', 'Demam Berdarah – Tingkat Keparahan 1', 1, 3000000),
  ('A-1-10-II', 'Demam Berdarah – Tingkat Keparahan 2', 2, 5500000),
  ('E-4-11-I', 'Diabetes Mellitus – Tingkat Keparahan 1', 1, 4000000),
  ('E-4-11-II', 'Diabetes Mellitus – Tingkat Keparahan 2', 2, 7500000),
  ('C-6-10-I', 'Tumor Ganas – Tingkat Keparahan 1', 1, 15000000),
  ('C-6-10-II', 'Tumor Ganas – Tingkat Keparahan 2', 2, 25000000)
ON CONFLICT (drg_code) DO NOTHING;

-- ============================================================
-- Migration: Pharmacy Dispensing Workflow + Lab Critical Value
-- FASE 1 — Stabilitas
-- ============================================================

-- ============================================================
-- PHARMACY — Add full workflow tracking to prescriptions
-- ============================================================
ALTER TABLE prescriptions
  ADD COLUMN IF NOT EXISTS verified_by       VARCHAR(255),
  ADD COLUMN IF NOT EXISTS verified_at       TIMESTAMP,
  ADD COLUMN IF NOT EXISTS prepared_by       VARCHAR(255),
  ADD COLUMN IF NOT EXISTS prepared_at       TIMESTAMP,
  ADD COLUMN IF NOT EXISTS dispensed_by      VARCHAR(255),
  ADD COLUMN IF NOT EXISTS dispensed_at      TIMESTAMP,
  ADD COLUMN IF NOT EXISTS returned_by       VARCHAR(255),
  ADD COLUMN IF NOT EXISTS returned_at       TIMESTAMP,
  ADD COLUMN IF NOT EXISTS rejection_reason  VARCHAR(500),
  ADD COLUMN IF NOT EXISTS allergy_checked   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS allergy_warnings  JSONB   NOT NULL DEFAULT '[]';

-- Add dispensing detail to prescription_items
ALTER TABLE prescription_items
  ADD COLUMN IF NOT EXISTS dispensed_quantity     INT,
  ADD COLUMN IF NOT EXISTS dispensed_from_batches JSONB NOT NULL DEFAULT '[]';

-- ============================================================
-- LAB — Critical value tracking on results
-- ============================================================
ALTER TABLE lab_results
  ADD COLUMN IF NOT EXISTS critical_alerted  BOOLEAN   NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS critical_alert_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS critical_alert_to VARCHAR(255),
  ADD COLUMN IF NOT EXISTS verified_at       TIMESTAMP,
  ADD COLUMN IF NOT EXISTS delta_flag        BOOLEAN   NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS previous_value    VARCHAR(50);

-- ============================================================
-- LAB REFERENCE RANGES
-- Common test normal and critical ranges
-- ============================================================
CREATE TABLE IF NOT EXISTS lab_reference_ranges (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  test_code     VARCHAR(50)  NOT NULL,
  test_name     VARCHAR(200) NOT NULL,
  gender        VARCHAR(10)  DEFAULT 'all',  -- male | female | all
  age_min       INT,                          -- years, NULL = no lower bound
  age_max       INT,                          -- years, NULL = no upper bound
  normal_min    DECIMAL(15,4),
  normal_max    DECIMAL(15,4),
  critical_low  DECIMAL(15,4),
  critical_high DECIMAL(15,4),
  unit          VARCHAR(50),
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
  UNIQUE (test_code, gender, age_min, age_max)
);

CREATE INDEX IF NOT EXISTS idx_lab_ref_range_code
  ON lab_reference_ranges (test_code, gender);

-- Seed common Indonesian hospital reference ranges
INSERT INTO lab_reference_ranges
  (test_code, test_name, gender, normal_min, normal_max, critical_low, critical_high, unit)
VALUES
  -- Darah Lengkap (CBC)
  ('HGB',    'Hemoglobin',        'male',   13.5, 17.5, 7.0,  20.0,  'g/dL'),
  ('HGB',    'Hemoglobin',        'female', 12.0, 16.0, 7.0,  20.0,  'g/dL'),
  ('WBC',    'Leukosit',          'all',     4.5, 11.0, 2.0,  30.0,  '10³/µL'),
  ('PLT',    'Trombosit',         'all',     150,  400,  50,  1000,  '10³/µL'),
  ('HCT',    'Hematokrit',        'male',    40,   52,   20,   65,   '%'),
  ('HCT',    'Hematokrit',        'female',  36,   47,   20,   65,   '%'),
  ('RBC',    'Eritrosit',         'male',   4.5,  5.9,  2.0,   8.0,  'juta/µL'),
  ('RBC',    'Eritrosit',         'female', 4.0,  5.4,  2.0,   8.0,  'juta/µL'),
  ('MCV',    'MCV',               'all',     80,   96, NULL,  NULL,  'fL'),
  ('MCH',    'MCH',               'all',     27,   33, NULL,  NULL,  'pg'),
  ('MCHC',   'MCHC',              'all',     32,   36, NULL,  NULL,  'g/dL'),
  -- Kimia Darah — Gula
  ('GLUC',   'Glukosa Sewaktu',   'all',     70,  200,   40,   500,  'mg/dL'),
  ('GLUC_P', 'Glukosa Puasa',     'all',     70,  100,   40,   500,  'mg/dL'),
  ('GLUC_PP','Glukosa 2 Jam PP',  'all',     70,  140,   40,   500,  'mg/dL'),
  ('HBA1C',  'HbA1c',             'all',    NULL,  5.7, NULL,  NULL,  '%'),
  -- Kimia Darah — Fungsi Ginjal
  ('CREAT',  'Kreatinin',         'male',   0.7,  1.3, NULL,  10.0,  'mg/dL'),
  ('CREAT',  'Kreatinin',         'female', 0.5,  1.1, NULL,  10.0,  'mg/dL'),
  ('UREA',   'Ureum',             'all',     15,   45, NULL,  200,   'mg/dL'),
  ('BUN',    'Blood Urea Nitrogen','all',     7,   20, NULL,  100,   'mg/dL'),
  ('UA',     'Asam Urat',         'male',   3.5,  7.2, NULL,  NULL,  'mg/dL'),
  ('UA',     'Asam Urat',         'female', 2.5,  6.0, NULL,  NULL,  'mg/dL'),
  -- Kimia Darah — Fungsi Hati
  ('SGOT',   'SGOT/AST',          'male',     0,   40, NULL,  1000,  'U/L'),
  ('SGOT',   'SGOT/AST',          'female',   0,   32, NULL,  1000,  'U/L'),
  ('SGPT',   'SGPT/ALT',          'male',     0,   41, NULL,  1000,  'U/L'),
  ('SGPT',   'SGPT/ALT',          'female',   0,   31, NULL,  1000,  'U/L'),
  ('TBIL',   'Bilirubin Total',   'all',      0,  1.2, NULL,  15.0,  'mg/dL'),
  ('DBIL',   'Bilirubin Direk',   'all',      0,  0.3, NULL,  NULL,  'mg/dL'),
  ('ALB',    'Albumin',           'all',      3.5, 5.0, 2.0,  NULL,  'g/dL'),
  ('TP',     'Total Protein',     'all',      6.4, 8.3, NULL,  NULL,  'g/dL'),
  -- Kimia Darah — Elektrolit
  ('NA',     'Natrium',           'all',      136, 145, 120,  160,   'mmol/L'),
  ('K',      'Kalium',            'all',      3.5, 5.0, 2.5,  6.5,   'mmol/L'),
  ('CL',     'Klorida',           'all',       98, 106,  80,  120,   'mmol/L'),
  ('CA',     'Kalsium',           'all',       8.5,10.5, 6.5,  13.0,  'mg/dL'),
  ('MG',     'Magnesium',         'all',       1.7, 2.2, 1.2,  NULL,  'mg/dL'),
  -- Lemak Darah
  ('CHOL',   'Kolesterol Total',  'all',      NULL, 200, NULL,  NULL,  'mg/dL'),
  ('TG',     'Trigliserida',      'all',      NULL, 150, NULL,  NULL,  'mg/dL'),
  ('HDL',    'HDL Kolesterol',    'male',      40, NULL, NULL,  NULL,  'mg/dL'),
  ('HDL',    'HDL Kolesterol',    'female',    50, NULL, NULL,  NULL,  'mg/dL'),
  ('LDL',    'LDL Kolesterol',    'all',      NULL, 130, NULL,  NULL,  'mg/dL'),
  -- Jantung
  ('TROP',   'Troponin I',        'all',      NULL, 0.04,NULL,  NULL,  'ng/mL'),
  ('CK',     'CK Total',          'male',       0,  171, NULL,  NULL,  'U/L'),
  ('CK',     'CK Total',          'female',     0,  145, NULL,  NULL,  'U/L'),
  ('CKMB',   'CK-MB',             'all',        0,   25, NULL,  NULL,  'U/L'),
  -- Analisa Gas Darah
  ('PH',     'pH Darah',          'all',       7.35, 7.45, 7.2,  7.6,   NULL),
  ('PCO2',   'pCO2',              'all',        35,   45,  20,   70,   'mmHg'),
  ('PO2',    'pO2',               'all',        80,  100,  40,  NULL,  'mmHg'),
  ('HCO3',   'HCO3',              'all',        22,   26,  10,   40,   'mmol/L'),
  -- Koagulasi
  ('PT',     'Prothrombin Time',  'all',        11,   14, NULL,  30,   'detik'),
  ('APTT',   'APTT',              'all',        25,   35, NULL,  100,  'detik'),
  ('INR',    'INR',               'all',       0.9,  1.1, NULL,  4.0,   NULL),
  -- Infeksi
  ('CRP',    'CRP Kuantitatif',   'all',        0,    5,  NULL,  NULL,  'mg/L'),
  ('ESR',    'LED/ESR',           'male',       0,   15,  NULL,  NULL,  'mm/jam'),
  ('ESR',    'LED/ESR',           'female',     0,   20,  NULL,  NULL,  'mm/jam'),
  ('PCT',    'Prokalsitonin',     'all',        0, 0.05,  NULL,  NULL,  'ng/mL'),
  -- Urinalisa
  ('GLUC_U', 'Glukosa Urin',      'all',       NULL,NULL, NULL,  NULL,  NULL),
  ('PROT_U', 'Protein Urin',      'all',       NULL,NULL, NULL,  NULL,  NULL),
  ('WBCU',   'Leukosit Urin',     'all',         0,   5,  NULL,  NULL,  '/LPB'),
  ('RBCU',   'Eritrosit Urin',    'all',         0,   2,  NULL,  NULL,  '/LPB')
ON CONFLICT (test_code, gender, age_min, age_max) DO NOTHING;

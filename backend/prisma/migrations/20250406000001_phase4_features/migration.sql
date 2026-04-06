-- ============================================================
-- Migration: Phase 4 — Fitur Klinis Tambahan
-- Drug Interactions, STR/SIP Tracking, ASPAK, IKP, e-Consent
-- ============================================================

-- ============================================================
-- 1. DRUG INTERACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS drug_interactions (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_id_a   UUID         NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  medicine_id_b   UUID         NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  severity        VARCHAR(20)  NOT NULL DEFAULT 'moderate',
  -- contraindicated | major | moderate | minor
  description     TEXT         NOT NULL,
  mechanism       TEXT,
  clinical_effect TEXT,
  management      TEXT,
  source          VARCHAR(255),
  is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_drug_interaction_severity
    CHECK (severity IN ('contraindicated','major','moderate','minor')),
  CONSTRAINT uq_drug_interaction UNIQUE (medicine_id_a, medicine_id_b)
);
CREATE INDEX IF NOT EXISTS idx_drug_interactions_a ON drug_interactions (medicine_id_a) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_drug_interactions_b ON drug_interactions (medicine_id_b) WHERE is_active;

-- Drug allergy contraindications (per patient)
CREATE TABLE IF NOT EXISTS patient_drug_allergies (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    UUID         NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  medicine_id   UUID         REFERENCES medicines(id) ON DELETE SET NULL,
  allergen_name VARCHAR(255) NOT NULL,
  reaction_type VARCHAR(50),  -- anaphylaxis | rash | angioedema | other
  severity      VARCHAR(20)  DEFAULT 'moderate',
  notes         TEXT,
  reported_by   VARCHAR(255),
  reported_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_patient_drug_allergies_patient ON patient_drug_allergies (patient_id) WHERE is_active;

-- ============================================================
-- 2. STR / SIP TRACKING (Tenaga Medis)
-- ============================================================
CREATE TABLE IF NOT EXISTS staff_certifications (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id       UUID         REFERENCES employees(id) ON DELETE CASCADE,
  user_id           VARCHAR(255), -- jika belum linked ke employee
  cert_type         VARCHAR(50)  NOT NULL,
  -- STR | SIP | SIK | SIPB | SIA | STRA | SIPA | pelatihan
  cert_number       VARCHAR(100) NOT NULL,
  issuer            VARCHAR(255),
  issue_date        DATE,
  expiry_date       DATE         NOT NULL,
  status            VARCHAR(20)  NOT NULL DEFAULT 'active',
  -- active | expired | revoked | suspended
  document_url      TEXT,
  notes             TEXT,
  alert_sent_30d    BOOLEAN      NOT NULL DEFAULT FALSE,
  alert_sent_7d     BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_staff_certs_expiry
  ON staff_certifications (expiry_date, status)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_staff_certs_employee ON staff_certifications (employee_id);

-- ============================================================
-- 3. ASPAK — Aset & Peralatan RS
-- ============================================================
CREATE TABLE IF NOT EXISTS aspak_assets (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_code          VARCHAR(100) UNIQUE,
  asset_name          VARCHAR(255) NOT NULL,
  asset_category      VARCHAR(100),
  -- medis | non_medis | laboratorium | radiologi | farmasi
  asset_type          VARCHAR(100),
  brand               VARCHAR(100),
  model               VARCHAR(100),
  serial_number       VARCHAR(100),
  year_of_purchase    INT,
  purchase_price      NUMERIC(15,2),
  current_condition   VARCHAR(20)  DEFAULT 'baik',
  -- baik | rusak_ringan | rusak_berat | tidak_berfungsi
  department_id       UUID         REFERENCES departments(id) ON DELETE SET NULL,
  room_location       VARCHAR(255),
  quantity            INT          NOT NULL DEFAULT 1,
  unit                VARCHAR(50)  DEFAULT 'unit',
  last_maintenance_at DATE,
  next_maintenance_at DATE,
  kemenkes_code       VARCHAR(100), -- kode ASPAK Kemenkes
  is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
  notes               TEXT,
  created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aspak_assets_dept      ON aspak_assets (department_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_aspak_assets_category  ON aspak_assets (asset_category) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_aspak_assets_maintenance
  ON aspak_assets (next_maintenance_at)
  WHERE is_active AND next_maintenance_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS aspak_reports (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  report_period    VARCHAR(10)  NOT NULL, -- YYYY-MM
  report_type      VARCHAR(50)  NOT NULL DEFAULT 'monthly',
  status           VARCHAR(20)  NOT NULL DEFAULT 'draft',
  -- draft | submitted | accepted | rejected
  submitted_at     TIMESTAMP,
  submitted_by     VARCHAR(255),
  kemenkes_ref     VARCHAR(100),
  data_snapshot    JSONB,
  notes            TEXT,
  created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. INSIDEN KESELAMATAN PASIEN (IKP)
-- ============================================================
CREATE TABLE IF NOT EXISTS patient_incidents (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_code       VARCHAR(50)  UNIQUE,
  patient_id          UUID         REFERENCES patients(id) ON DELETE SET NULL,
  visit_id            UUID         REFERENCES visits(id) ON DELETE SET NULL,
  department_id       UUID         REFERENCES departments(id) ON DELETE SET NULL,
  incident_date       TIMESTAMP    NOT NULL,
  incident_type       VARCHAR(100) NOT NULL,
  -- KTD | KNC | KTC | KPCS | sentinel
  incident_category   VARCHAR(100),
  -- medication_error | fall | procedure | diagnosis | equipment | other
  description         TEXT         NOT NULL,
  immediate_action    TEXT,
  contributing_factors TEXT,
  severity_grade      VARCHAR(20)  DEFAULT '2',
  -- 1=minimal | 2=minor | 3=moderate | 4=major | 5=sentinel
  harm_to_patient     VARCHAR(20)  DEFAULT 'tidak_ada',
  -- tidak_ada | ringan | sedang | berat | kematian
  status              VARCHAR(30)  NOT NULL DEFAULT 'draft',
  -- draft | reported | under_investigation | closed | escalated
  reported_by         VARCHAR(255),
  reporter_role       VARCHAR(100),
  investigator_id     VARCHAR(255),
  investigation_notes TEXT,
  corrective_action   TEXT,
  prevention_plan     TEXT,
  closed_at           TIMESTAMP,
  created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_incidents_date     ON patient_incidents (incident_date DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_dept     ON patient_incidents (department_id, incident_date DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_status   ON patient_incidents (status) WHERE status NOT IN ('closed');
CREATE INDEX IF NOT EXISTS idx_incidents_patient  ON patient_incidents (patient_id) WHERE patient_id IS NOT NULL;

-- Auto-generate incident code
CREATE OR REPLACE FUNCTION generate_incident_code()
RETURNS TEXT AS $$
DECLARE
  prefix TEXT;
  last_num INT;
  new_num  TEXT;
BEGIN
  prefix := 'IKP' || TO_CHAR(NOW(), 'YYYYMM');
  SELECT COALESCE(MAX(CAST(SUBSTRING(incident_code FROM 10) AS INT)), 0)
    INTO last_num
  FROM patient_incidents
  WHERE incident_code LIKE prefix || '%';
  new_num := LPAD((last_num + 1)::TEXT, 4, '0');
  RETURN prefix || new_num;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 5. E-CONSENT DIGITAL
-- ============================================================
CREATE TABLE IF NOT EXISTS patient_consents (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        UUID         NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  visit_id          UUID         REFERENCES visits(id) ON DELETE SET NULL,
  consent_type      VARCHAR(100) NOT NULL,
  -- general_treatment | surgical | anesthesia | blood_transfusion
  -- research | telemedicine | photography | data_sharing
  consent_text      TEXT         NOT NULL,
  language          VARCHAR(10)  DEFAULT 'id',
  status            VARCHAR(20)  NOT NULL DEFAULT 'pending',
  -- pending | signed | declined | revoked | expired
  signed_by_name    VARCHAR(255),
  signed_by_relation VARCHAR(100), -- self | parent | guardian | spouse
  signed_at         TIMESTAMP,
  signed_ip         INET,
  signature_hash    TEXT,  -- SHA-256 hash of signature data
  signature_data    TEXT,  -- base64 encoded signature image (encrypted)
  witness_name      VARCHAR(255),
  witness_role      VARCHAR(100),
  valid_until       TIMESTAMP,
  document_url      TEXT,  -- PDF version if generated
  revoked_at        TIMESTAMP,
  revoked_reason    TEXT,
  created_by        VARCHAR(255),
  created_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_consents_patient  ON patient_consents (patient_id, consent_type);
CREATE INDEX IF NOT EXISTS idx_consents_visit    ON patient_consents (visit_id) WHERE visit_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consents_status   ON patient_consents (status, valid_until)
  WHERE status IN ('pending','signed');

-- ============================================================
-- 6. NOTIFICATION CHANNELS (WhatsApp / SMS / Email)
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_channels (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID         REFERENCES patients(id) ON DELETE CASCADE,
  employee_id     UUID         REFERENCES employees(id) ON DELETE CASCADE,
  channel_type    VARCHAR(20)  NOT NULL,  -- whatsapp | sms | email | push
  address         VARCHAR(255) NOT NULL,  -- phone number or email (encrypted)
  address_hash    VARCHAR(64),            -- SHA-256 for lookup
  is_verified     BOOLEAN      NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
  opt_in_at       TIMESTAMP,
  opt_out_at      TIMESTAMP,
  created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notif_channels_patient  ON notification_channels (patient_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_notif_channels_hash     ON notification_channels (address_hash);

CREATE TABLE IF NOT EXISTS notification_logs (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_type    VARCHAR(20)  NOT NULL,
  recipient       VARCHAR(255) NOT NULL,  -- encrypted
  template_type   VARCHAR(100) NOT NULL,
  -- appointment_reminder | lab_ready | prescription_ready
  -- cert_expiry | incident_alert | billing_due
  payload         JSONB        NOT NULL DEFAULT '{}',
  status          VARCHAR(20)  NOT NULL DEFAULT 'pending',
  -- pending | sent | delivered | failed | bounced
  provider        VARCHAR(50),  -- fonnte | twilio | sendgrid
  provider_msg_id VARCHAR(255),
  error_message   TEXT,
  sent_at         TIMESTAMP,
  created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notif_logs_status ON notification_logs (status, created_at DESC)
  WHERE status IN ('pending','failed');

-- ============================================================
-- 7. VITAL SIGNS TRENDING (structured time-series per visit)
-- ============================================================
CREATE TABLE IF NOT EXISTS vital_signs (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        UUID         NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  visit_id          UUID         REFERENCES visits(id) ON DELETE CASCADE,
  recorded_by       VARCHAR(255),
  recorded_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
  -- Hemodynamics
  systolic_bp       INT,          -- mmHg
  diastolic_bp      INT,          -- mmHg
  heart_rate        INT,          -- bpm
  -- Respiratory
  respiratory_rate  INT,          -- /min
  spo2              NUMERIC(5,2), -- %
  -- Temperature
  temperature       NUMERIC(5,2), -- °C
  temp_route        VARCHAR(20),  -- axillary | oral | rectal | tympanic
  -- Other
  weight_kg         NUMERIC(6,2),
  height_cm         NUMERIC(6,2),
  bmi               NUMERIC(5,2),
  pain_score        INT,          -- 0-10 VAS
  gcs_total         INT,          -- 3-15
  gcs_eye           INT,
  gcs_verbal        INT,
  gcs_motor         INT,
  blood_glucose     NUMERIC(6,2), -- mg/dL
  notes             TEXT,
  source            VARCHAR(50)   DEFAULT 'manual'
  -- manual | monitor_import | hl7_feed
);
CREATE INDEX IF NOT EXISTS idx_vitals_patient_time ON vital_signs (patient_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_vitals_visit        ON vital_signs (visit_id, recorded_at DESC)
  WHERE visit_id IS NOT NULL;

-- ============================================================
-- 8. SEED: sample drug interactions (common pairs)
-- ============================================================
-- Note: Seed via application seed script; can't use medicine UUIDs here without knowing them.
-- The pharmacy routes will query dynamically.

-- ============================================================
-- 9. Indexes for SIRS reporting queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_visits_payment_type_date
  ON visits (payment_type, visit_date DESC);

CREATE INDEX IF NOT EXISTS idx_billings_payment_date_type
  ON billings (payment_date, payment_type) WHERE status = 'paid';

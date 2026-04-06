-- ============================================================
-- Migration: Add Support Modules (CSSD, Linen, Waste, Maintenance)
-- ============================================================

-- CSSD (Central Sterile Supply Department)
CREATE TABLE IF NOT EXISTS cssd_batches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number    VARCHAR(50) UNIQUE NOT NULL,
  batch_date      TIMESTAMP NOT NULL DEFAULT NOW(),
  sterilization_method VARCHAR(50) NOT NULL DEFAULT 'autoclave', -- autoclave | ethylene_oxide | dry_heat | plasma
  item_count      INTEGER NOT NULL DEFAULT 0,
  status          VARCHAR(30) NOT NULL DEFAULT 'pending', -- pending | in_process | completed | failed | quarantine
  operator_id     VARCHAR(255),
  operator_name   VARCHAR(255),
  temperature     DECIMAL(5,2),
  pressure        DECIMAL(5,2),
  duration_minutes INTEGER,
  biological_indicator_result VARCHAR(30), -- pass | fail | pending
  chemical_indicator_result   VARCHAR(30),
  notes           TEXT,
  completed_at    TIMESTAMP,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cssd_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id        UUID NOT NULL REFERENCES cssd_batches(id) ON DELETE CASCADE,
  item_name       VARCHAR(255) NOT NULL,
  item_code       VARCHAR(100),
  quantity        INTEGER NOT NULL DEFAULT 1,
  department_origin VARCHAR(255),
  expiry_date     TIMESTAMP,
  status          VARCHAR(30) NOT NULL DEFAULT 'received', -- received | cleaned | packaged | sterilized | distributed | expired
  notes           TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Linen & Laundry Management
CREATE TABLE IF NOT EXISTS linen_categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name   VARCHAR(100) NOT NULL,
  description     TEXT,
  initial_stock   INTEGER NOT NULL DEFAULT 0,
  minimum_stock   INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS linen_inventory (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     UUID REFERENCES linen_categories(id),
  item_name       VARCHAR(255) NOT NULL,
  item_code       VARCHAR(100),
  total_qty       INTEGER NOT NULL DEFAULT 0,
  clean_qty       INTEGER NOT NULL DEFAULT 0,
  in_laundry_qty  INTEGER NOT NULL DEFAULT 0,
  dirty_qty       INTEGER NOT NULL DEFAULT 0,
  damaged_qty     INTEGER NOT NULL DEFAULT 0,
  department_id   VARCHAR(255),
  department_name VARCHAR(255),
  last_updated    TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS linen_batches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number    VARCHAR(50) UNIQUE NOT NULL,
  batch_date      TIMESTAMP NOT NULL DEFAULT NOW(),
  department_origin VARCHAR(255),
  status          VARCHAR(30) NOT NULL DEFAULT 'collected', -- collected | in_laundry | clean | distributed
  total_items     INTEGER NOT NULL DEFAULT 0,
  weight_kg       DECIMAL(8,2),
  operator_id     VARCHAR(255),
  operator_name   VARCHAR(255),
  completed_at    TIMESTAMP,
  notes           TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Waste Management
CREATE TABLE IF NOT EXISTS waste_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_date     TIMESTAMP NOT NULL DEFAULT NOW(),
  waste_type      VARCHAR(50) NOT NULL, -- medical | b3 | domestic | sharps | pharmaceutical | pathological
  waste_category  VARCHAR(50), -- infectious | non_infectious | radioactive
  source_department VARCHAR(255),
  weight_kg       DECIMAL(8,3) NOT NULL DEFAULT 0,
  volume_liter    DECIMAL(8,3),
  container_type  VARCHAR(100), -- yellow_bag | red_bag | sharps_container | etc
  disposal_method VARCHAR(100), -- incineration | autoclave | landfill | third_party
  disposal_vendor VARCHAR(255),
  manifest_number VARCHAR(100),
  status          VARCHAR(30) NOT NULL DEFAULT 'collected', -- collected | stored | transported | disposed
  officer_id      VARCHAR(255),
  officer_name    VARCHAR(255),
  notes           TEXT,
  disposed_at     TIMESTAMP,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Maintenance / Asset Management
CREATE TABLE IF NOT EXISTS maintenance_assets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_code      VARCHAR(100) UNIQUE NOT NULL,
  asset_name      VARCHAR(255) NOT NULL,
  asset_category  VARCHAR(100), -- medical_equipment | facility | vehicle | IT | furniture
  brand           VARCHAR(100),
  model           VARCHAR(100),
  serial_number   VARCHAR(255),
  department_id   VARCHAR(255),
  department_name VARCHAR(255),
  location        VARCHAR(255),
  purchase_date   DATE,
  purchase_price  DECIMAL(15,2),
  warranty_expiry DATE,
  last_service_date DATE,
  next_service_date DATE,
  status          VARCHAR(30) NOT NULL DEFAULT 'operational', -- operational | maintenance | repair | retired
  condition       VARCHAR(30) NOT NULL DEFAULT 'good', -- good | fair | poor | critical
  notes           TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number  VARCHAR(50) UNIQUE NOT NULL,
  asset_id        UUID REFERENCES maintenance_assets(id),
  request_type    VARCHAR(50) NOT NULL DEFAULT 'corrective', -- corrective | preventive | calibration | inspection
  priority        VARCHAR(30) NOT NULL DEFAULT 'normal', -- low | normal | high | critical
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  reported_by     VARCHAR(255),
  department_id   VARCHAR(255),
  department_name VARCHAR(255),
  assigned_to     VARCHAR(255),
  technician_name VARCHAR(255),
  status          VARCHAR(30) NOT NULL DEFAULT 'open', -- open | in_progress | completed | cancelled
  scheduled_date  TIMESTAMP,
  started_at      TIMESTAMP,
  completed_at    TIMESTAMP,
  cost            DECIMAL(12,2),
  parts_used      TEXT,
  resolution_notes TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cssd_batches_date ON cssd_batches(batch_date);
CREATE INDEX IF NOT EXISTS idx_cssd_batches_status ON cssd_batches(status);
CREATE INDEX IF NOT EXISTS idx_cssd_items_batch ON cssd_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_linen_batches_date ON linen_batches(batch_date);
CREATE INDEX IF NOT EXISTS idx_linen_batches_status ON linen_batches(status);
CREATE INDEX IF NOT EXISTS idx_waste_records_date ON waste_records(record_date);
CREATE INDEX IF NOT EXISTS idx_waste_records_type ON waste_records(waste_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status ON maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_asset ON maintenance_requests(asset_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_assets_status ON maintenance_assets(status);

-- RL Report Submissions
CREATE TABLE IF NOT EXISTS rl_report_submissions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type          VARCHAR(10) NOT NULL,
  report_period_month  INT NOT NULL,
  report_period_year   INT NOT NULL,
  status               VARCHAR(20) NOT NULL DEFAULT 'draft',
  submitted_at         TIMESTAMP,
  submitted_by         VARCHAR(255),
  notes                TEXT,
  created_at           TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rl_submissions_period ON rl_report_submissions(report_period_year, report_period_month);
CREATE INDEX IF NOT EXISTS idx_rl_submissions_type   ON rl_report_submissions(report_type);

-- Vendor / Supplier Management
CREATE TABLE IF NOT EXISTS vendors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_code     VARCHAR(50) UNIQUE,
  vendor_name     VARCHAR(255) NOT NULL,
  category        VARCHAR(100),
  contact_person  VARCHAR(255),
  phone           VARCHAR(50),
  email           VARCHAR(255),
  address         TEXT,
  npwp            VARCHAR(30),
  rating          DECIMAL(3,1),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  notes           TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendor_contracts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id        UUID NOT NULL REFERENCES vendors(id),
  contract_number  VARCHAR(100) UNIQUE NOT NULL,
  contract_type    VARCHAR(100),
  start_date       TIMESTAMP NOT NULL,
  end_date         TIMESTAMP NOT NULL,
  contract_value   DECIMAL(15,2),
  status           VARCHAR(20) NOT NULL DEFAULT 'active',
  document_url     TEXT,
  notes            TEXT,
  created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendors_category  ON vendors(category);
CREATE INDEX IF NOT EXISTS idx_vendors_active    ON vendors(is_active);
CREATE INDEX IF NOT EXISTS idx_vc_vendor_id      ON vendor_contracts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vc_status         ON vendor_contracts(status);
CREATE INDEX IF NOT EXISTS idx_vc_end_date       ON vendor_contracts(end_date);

-- Telemedicine Sessions
CREATE TABLE IF NOT EXISTS telemedicine_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id    UUID REFERENCES appointments(id),
  patient_id        UUID NOT NULL REFERENCES patients(id),
  doctor_id         UUID NOT NULL REFERENCES doctors(id),
  room_name         VARCHAR(255) UNIQUE NOT NULL,
  session_token     VARCHAR(500),
  status            VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  scheduled_start   TIMESTAMP NOT NULL,
  actual_start      TIMESTAMP,
  actual_end        TIMESTAMP,
  duration_minutes  INT,
  patient_joined_at TIMESTAMP,
  doctor_joined_at  TIMESTAMP,
  recording_url     TEXT,
  notes             TEXT,
  technical_issues  TEXT,
  created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webrtc_signals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID NOT NULL REFERENCES telemedicine_sessions(id) ON DELETE CASCADE,
  sender_id    VARCHAR(255) NOT NULL,
  signal_type  VARCHAR(50) NOT NULL,
  signal_data  JSONB NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tele_patient   ON telemedicine_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_tele_doctor    ON telemedicine_sessions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_tele_scheduled ON telemedicine_sessions(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_tele_status    ON telemedicine_sessions(status);
CREATE INDEX IF NOT EXISTS idx_webrtc_session ON webrtc_signals(session_id, created_at);

-- Smart Display
CREATE TABLE IF NOT EXISTS smart_display_config (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_type           VARCHAR(50) UNIQUE NOT NULL,
  running_text           TEXT,
  running_text_enabled   BOOLEAN NOT NULL DEFAULT TRUE,
  slideshow_enabled      BOOLEAN NOT NULL DEFAULT TRUE,
  slideshow_interval     INT NOT NULL DEFAULT 5,
  video_enabled          BOOLEAN NOT NULL DEFAULT FALSE,
  video_auto_play        BOOLEAN NOT NULL DEFAULT TRUE,
  auto_refresh           BOOLEAN NOT NULL DEFAULT TRUE,
  auto_refresh_interval  INT NOT NULL DEFAULT 30,
  custom_config          JSONB,
  created_at             TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS smart_display_devices (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_code      VARCHAR(50) UNIQUE NOT NULL,
  device_name      VARCHAR(255) NOT NULL,
  location         VARCHAR(255) NOT NULL,
  description      TEXT,
  enabled_modules  JSONB NOT NULL DEFAULT '[]',
  display_type     VARCHAR(50) NOT NULL DEFAULT 'lobby',
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  auto_rotate      BOOLEAN NOT NULL DEFAULT TRUE,
  rotate_interval  INT NOT NULL DEFAULT 30,
  department_id    UUID,
  created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS smart_display_media (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_type  VARCHAR(50) NOT NULL,
  media_type    VARCHAR(20) NOT NULL,
  file_url      TEXT NOT NULL,
  file_name     VARCHAR(255) NOT NULL,
  title         VARCHAR(255),
  display_order INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sdc_type   ON smart_display_config(display_type);
CREATE INDEX IF NOT EXISTS idx_sdd_active ON smart_display_devices(is_active);
CREATE INDEX IF NOT EXISTS idx_sdm_type   ON smart_display_media(display_type, media_type);

-- Seed default configs for each display type
INSERT INTO smart_display_config (display_type) VALUES ('lobby'), ('ward'), ('pharmacy'), ('schedule')
  ON CONFLICT (display_type) DO NOTHING;

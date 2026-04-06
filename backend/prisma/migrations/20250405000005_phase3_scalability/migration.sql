-- ============================================================
-- Migration: Phase 3 — Scalability
-- Background Jobs, PACS/DICOM, Scheduled Reports
-- ============================================================

-- ============================================================
-- 1. BACKGROUND JOBS — Persistent job queue with retry
-- ============================================================
CREATE TABLE IF NOT EXISTS background_jobs (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_name    VARCHAR(100) NOT NULL,
  job_name      VARCHAR(200) NOT NULL,
  status        VARCHAR(20)  NOT NULL DEFAULT 'pending',  -- pending | running | completed | failed | cancelled
  payload       JSONB        NOT NULL DEFAULT '{}',
  result        JSONB,
  error_message TEXT,
  attempts      INT          NOT NULL DEFAULT 0,
  max_attempts  INT          NOT NULL DEFAULT 3,
  priority      INT          NOT NULL DEFAULT 5,          -- 1=highest 10=lowest
  scheduled_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
  started_at    TIMESTAMP,
  completed_at  TIMESTAMP,
  created_by    VARCHAR(255),
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_job_status CHECK (status IN ('pending','running','completed','failed','cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_jobs_queue_status    ON background_jobs (queue_name, status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_jobs_status_priority ON background_jobs (status, priority, scheduled_at)
  WHERE status IN ('pending','running');
CREATE INDEX IF NOT EXISTS idx_jobs_created_by      ON background_jobs (created_by);

-- ============================================================
-- 2. SCHEDULED REPORTS — Cron-generated report outputs
-- ============================================================
CREATE TABLE IF NOT EXISTS scheduled_reports (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type   VARCHAR(100) NOT NULL,  -- daily_revenue | monthly_rl1 | bed_occupancy | kpi_snapshot
  report_period VARCHAR(20)  NOT NULL,  -- YYYY-MM | YYYY-MM-DD
  status        VARCHAR(20)  NOT NULL DEFAULT 'pending',
  data          JSONB,                  -- computed report payload
  file_url      TEXT,                   -- S3/local path if PDF was generated
  generated_at  TIMESTAMP,
  error_message TEXT,
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_reports_type_period
  ON scheduled_reports (report_type, report_period);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_status
  ON scheduled_reports (status) WHERE status != 'completed';

-- ============================================================
-- 3. ANALYTICS SNAPSHOTS — Pre-computed KPI cache
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_type VARCHAR(100) NOT NULL,  -- daily_kpi | monthly_kpi | department_performance
  snapshot_date DATE         NOT NULL,
  department_id UUID         REFERENCES departments(id) ON DELETE CASCADE,
  data          JSONB        NOT NULL,
  computed_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
  UNIQUE (snapshot_type, snapshot_date, department_id)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_type_date
  ON analytics_snapshots (snapshot_type, snapshot_date DESC);

-- ============================================================
-- 4. PACS/DICOM — Radiology imaging integration
-- ============================================================

-- PACS server configuration (one active per hospital)
CREATE TABLE IF NOT EXISTS pacs_configs (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  aet_title        VARCHAR(64)  NOT NULL,           -- Application Entity Title
  host             VARCHAR(255) NOT NULL,
  port             INT          NOT NULL DEFAULT 11112,
  wado_rs_url      TEXT,                            -- DICOMweb WADO-RS base URL
  stow_rs_url      TEXT,                            -- DICOMweb STOW-RS base URL
  qido_rs_url      TEXT,                            -- DICOMweb QIDO-RS base URL
  wado_uri_url     TEXT,                            -- WADO-URI (legacy) base URL
  auth_type        VARCHAR(20)  DEFAULT 'none',     -- none | basic | oauth2
  auth_credentials JSONB,                           -- encrypted credentials
  is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
  description      TEXT,
  created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- DICOM studies (linked to radiology orders)
CREATE TABLE IF NOT EXISTS dicom_studies (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  study_instance_uid  VARCHAR(255) NOT NULL UNIQUE,  -- DICOM UID
  radiology_order_id  UUID         REFERENCES radiology_orders(id) ON DELETE SET NULL,
  patient_id          UUID         REFERENCES patients(id) ON DELETE CASCADE,
  accession_number    VARCHAR(64),
  study_date          DATE,
  study_time          TIME,
  study_description   TEXT,
  modality            VARCHAR(20),                   -- CR | CT | MR | US | DX | NM | PT | XA
  referring_physician VARCHAR(255),
  institution_name    VARCHAR(255),
  num_series          INT          DEFAULT 0,
  num_instances       INT          DEFAULT 0,
  total_size_bytes    BIGINT       DEFAULT 0,
  retrieve_url        TEXT,                          -- WADO-RS URL for this study
  status              VARCHAR(20)  DEFAULT 'pending', -- pending | received | verified | archived
  pacs_config_id      UUID         REFERENCES pacs_configs(id) ON DELETE SET NULL,
  created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dicom_studies_patient    ON dicom_studies (patient_id, study_date DESC);
CREATE INDEX IF NOT EXISTS idx_dicom_studies_order      ON dicom_studies (radiology_order_id);
CREATE INDEX IF NOT EXISTS idx_dicom_studies_accession  ON dicom_studies (accession_number)
  WHERE accession_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dicom_studies_uid        ON dicom_studies (study_instance_uid);

-- DICOM series within a study
CREATE TABLE IF NOT EXISTS dicom_series (
  id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id             UUID         NOT NULL REFERENCES dicom_studies(id) ON DELETE CASCADE,
  series_instance_uid  VARCHAR(255) NOT NULL UNIQUE,
  series_number        INT,
  series_description   TEXT,
  modality             VARCHAR(20),
  body_part_examined   VARCHAR(64),
  num_instances        INT          DEFAULT 0,
  retrieve_url         TEXT,
  created_at           TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dicom_series_study ON dicom_series (study_id);

-- DICOM instances (individual images)
CREATE TABLE IF NOT EXISTS dicom_instances (
  id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id             UUID         NOT NULL REFERENCES dicom_series(id) ON DELETE CASCADE,
  sop_instance_uid      VARCHAR(255) NOT NULL UNIQUE,
  sop_class_uid         VARCHAR(255),
  instance_number       INT,
  rows                  INT,
  columns               INT,
  bits_allocated        INT,
  retrieve_url          TEXT,
  thumbnail_url         TEXT,
  created_at            TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dicom_instances_series ON dicom_instances (series_id);

-- HL7 Modality Worklist entries (populated from radiology orders)
CREATE TABLE IF NOT EXISTS dicom_worklist (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  radiology_order_id  UUID         REFERENCES radiology_orders(id) ON DELETE CASCADE,
  patient_id          UUID         REFERENCES patients(id) ON DELETE CASCADE,
  accession_number    VARCHAR(64)  NOT NULL UNIQUE,
  scheduled_station   VARCHAR(64),
  scheduled_modality  VARCHAR(20),
  scheduled_datetime  TIMESTAMP,
  procedure_code      VARCHAR(64),
  procedure_desc      TEXT,
  requested_physician VARCHAR(255),
  worklist_status     VARCHAR(20)  DEFAULT 'scheduled',  -- scheduled | in_progress | completed | cancelled
  created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_worklist_status_dt
  ON dicom_worklist (worklist_status, scheduled_datetime)
  WHERE worklist_status IN ('scheduled','in_progress');
CREATE INDEX IF NOT EXISTS idx_worklist_patient ON dicom_worklist (patient_id);

-- ============================================================
-- 5. SEED: Default PACS config (placeholder, update via settings)
-- ============================================================
INSERT INTO pacs_configs (aet_title, host, port, wado_rs_url, stow_rs_url, qido_rs_url, description)
VALUES (
  'SIMRSZEN_SCU',
  'localhost',
  11112,
  'http://localhost:8080/wado/rs',
  'http://localhost:8080/stow/rs',
  'http://localhost:8080/qido/rs',
  'Default PACS configuration — update with actual server details'
)
ON CONFLICT DO NOTHING;

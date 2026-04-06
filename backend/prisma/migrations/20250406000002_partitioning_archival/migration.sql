-- ============================================================
-- Migration: Big Data Hardening
-- Table Partitioning + pg_trgm indexes + Archival tables
-- ============================================================

-- ============================================================
-- 1. pg_trgm EXTENSION (for fast full-text ILIKE search)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram indexes for patient search (if not already created in Phase 1)
CREATE INDEX IF NOT EXISTS idx_patients_full_name_trgm
  ON patients USING GIN (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_patients_nik_trgm
  ON patients USING GIN (nik gin_trgm_ops) WHERE nik IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_medicines_name_trgm
  ON medicines USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_employees_full_name_trgm
  ON employees USING GIN (full_name gin_trgm_ops);

-- ============================================================
-- 2. PARTIAL INDEXES for common filtered queries
-- ============================================================

-- Active patients only
CREATE INDEX IF NOT EXISTS idx_patients_active
  ON patients (created_at DESC) WHERE is_active = TRUE;

-- Open visits
CREATE INDEX IF NOT EXISTS idx_visits_open
  ON visits (visit_date DESC, patient_id) WHERE status = 'active';

-- Pending prescriptions
CREATE INDEX IF NOT EXISTS idx_prescriptions_pending
  ON prescriptions (prescription_date DESC) WHERE status IN ('pending', 'verified', 'preparing');

-- Pending lab orders
CREATE INDEX IF NOT EXISTS idx_lab_orders_pending
  ON lab_orders (created_at DESC) WHERE status IN ('pending', 'processing');

-- Unpaid billings
CREATE INDEX IF NOT EXISTS idx_billings_unpaid
  ON billings (created_at DESC) WHERE status NOT IN ('paid', 'cancelled');

-- ============================================================
-- 3. AUDIT_LOGS — Partitioning by YEAR
-- ============================================================
-- NOTE: PostgreSQL requires converting existing table to partitioned.
-- Safe approach: create partitioned table alongside existing,
-- use trigger to dual-write, then migrate data in background job.
-- Here we create the partitioned structure for NEW data going forward.

CREATE TABLE IF NOT EXISTS audit_logs_partitioned (
  id          UUID         NOT NULL DEFAULT gen_random_uuid(),
  table_name  VARCHAR(100) NOT NULL,
  action      VARCHAR(50)  NOT NULL,
  record_id   UUID,
  user_id     VARCHAR(255),
  old_data    JSONB,
  new_data    JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create yearly partitions (2024-2027)
CREATE TABLE IF NOT EXISTS audit_logs_2024
  PARTITION OF audit_logs_partitioned
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE IF NOT EXISTS audit_logs_2025
  PARTITION OF audit_logs_partitioned
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE IF NOT EXISTS audit_logs_2026
  PARTITION OF audit_logs_partitioned
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

CREATE TABLE IF NOT EXISTS audit_logs_2027
  PARTITION OF audit_logs_partitioned
  FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');

-- Default partition catches anything outside defined ranges
CREATE TABLE IF NOT EXISTS audit_logs_default
  PARTITION OF audit_logs_partitioned DEFAULT;

-- Indexes on partitioned table (propagate to all partitions)
CREATE INDEX IF NOT EXISTS idx_audit_logs_part_created
  ON audit_logs_partitioned (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_part_user
  ON audit_logs_partitioned (user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_part_table
  ON audit_logs_partitioned (table_name, action, created_at DESC);

-- ============================================================
-- 4. QUEUE_ENTRIES — Partitioning by MONTH (high-volume)
-- ============================================================

CREATE TABLE IF NOT EXISTS queue_entries_partitioned (
  id              UUID         NOT NULL DEFAULT gen_random_uuid(),
  queue_number    VARCHAR(20),
  patient_id      UUID,
  department_id   UUID,
  doctor_id       UUID,
  service_type    VARCHAR(50),
  status          VARCHAR(20)  NOT NULL DEFAULT 'waiting',
  priority        INT          NOT NULL DEFAULT 0,
  called_at       TIMESTAMP,
  served_at       TIMESTAMP,
  estimated_wait  INT,
  notes           TEXT,
  created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Monthly partitions for 2025
DO $$
DECLARE
  m INT;
  start_date DATE;
  end_date   DATE;
BEGIN
  FOR m IN 1..12 LOOP
    start_date := DATE(FORMAT('2025-%s-01', LPAD(m::TEXT, 2, '0')));
    end_date   := start_date + INTERVAL '1 month';
    EXECUTE FORMAT(
      'CREATE TABLE IF NOT EXISTS queue_entries_2025_%s
       PARTITION OF queue_entries_partitioned
       FOR VALUES FROM (%L) TO (%L)',
      LPAD(m::TEXT, 2, '0'), start_date, end_date
    );
  END LOOP;
END $$;

-- 2026 partitions
DO $$
DECLARE
  m INT;
  start_date DATE;
  end_date   DATE;
BEGIN
  FOR m IN 1..12 LOOP
    start_date := DATE(FORMAT('2026-%s-01', LPAD(m::TEXT, 2, '0')));
    end_date   := start_date + INTERVAL '1 month';
    EXECUTE FORMAT(
      'CREATE TABLE IF NOT EXISTS queue_entries_2026_%s
       PARTITION OF queue_entries_partitioned
       FOR VALUES FROM (%L) TO (%L)',
      LPAD(m::TEXT, 2, '0'), start_date, end_date
    );
  END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS queue_entries_default
  PARTITION OF queue_entries_partitioned DEFAULT;

CREATE INDEX IF NOT EXISTS idx_queue_part_created
  ON queue_entries_partitioned (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_queue_part_status
  ON queue_entries_partitioned (status, created_at DESC) WHERE status IN ('waiting', 'called');
CREATE INDEX IF NOT EXISTS idx_queue_part_dept
  ON queue_entries_partitioned (department_id, created_at DESC);

-- ============================================================
-- 5. ARCHIVE TABLES (for data > 2 years old)
-- ============================================================

CREATE TABLE IF NOT EXISTS archive_lab_results (
  LIKE lab_results INCLUDING ALL,
  archived_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS archive_audit_logs (
  id          UUID         NOT NULL DEFAULT gen_random_uuid(),
  table_name  VARCHAR(100) NOT NULL,
  action      VARCHAR(50)  NOT NULL,
  record_id   UUID,
  user_id     VARCHAR(255),
  old_data    JSONB,
  new_data    JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMP    NOT NULL,
  archived_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS archive_notification_logs (
  LIKE notification_logs INCLUDING ALL,
  archived_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for archive tables (read-only, no write indexes needed)
CREATE INDEX IF NOT EXISTS idx_archive_audit_created  ON archive_audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_archive_audit_user     ON archive_audit_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_archive_notif_created  ON archive_notification_logs (created_at DESC);

-- ============================================================
-- 6. FUNCTION: auto-create future partitions
-- ============================================================

CREATE OR REPLACE FUNCTION create_monthly_partition(
  p_table TEXT,
  p_year INT,
  p_month INT
) RETURNS TEXT AS $$
DECLARE
  partition_name TEXT;
  start_date     DATE;
  end_date       DATE;
BEGIN
  partition_name := FORMAT('%s_%s_%s', p_table, p_year, LPAD(p_month::TEXT, 2, '0'));
  start_date     := DATE(FORMAT('%s-%s-01', p_year, LPAD(p_month::TEXT, 2, '0')));
  end_date       := start_date + INTERVAL '1 month';

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE tablename = partition_name
  ) THEN
    EXECUTE FORMAT(
      'CREATE TABLE %I PARTITION OF %I_partitioned FOR VALUES FROM (%L) TO (%L)',
      partition_name, p_table, start_date, end_date
    );
    RETURN FORMAT('Created partition: %s', partition_name);
  END IF;

  RETURN FORMAT('Partition already exists: %s', partition_name);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 7. ADDITIONAL PERFORMANCE INDEXES
-- ============================================================

-- Composite indexes for common join patterns
CREATE INDEX IF NOT EXISTS idx_visits_patient_date_status
  ON visits (patient_id, visit_date DESC, status);

CREATE INDEX IF NOT EXISTS idx_lab_orders_visit_status
  ON lab_orders (visit_id, status) WHERE visit_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_status
  ON prescriptions (patient_id, status, prescription_date DESC);

-- billing payment queries (SIRS reports)
CREATE INDEX IF NOT EXISTS idx_billings_payment_month
  ON billings (DATE_TRUNC('month', payment_date), payment_type)
  WHERE status = 'paid' AND payment_date IS NOT NULL;

-- notification_logs cleanup queries
CREATE INDEX IF NOT EXISTS idx_notif_logs_created_status
  ON notification_logs (created_at, status);

-- vital_signs bulk query
CREATE INDEX IF NOT EXISTS idx_vital_signs_visit_time
  ON vital_signs (visit_id, recorded_at DESC) WHERE visit_id IS NOT NULL;

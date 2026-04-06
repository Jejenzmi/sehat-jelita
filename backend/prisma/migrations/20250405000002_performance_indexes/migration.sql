-- ============================================================
-- Migration: Performance Indexes + pg_trgm
-- FASE 1 — Stabilitas (Big Data)
-- ============================================================

-- Enable pg_trgm for full-text fuzzy search on patient names
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- PATIENTS — most-queried table
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_patients_fullname_trgm
  ON patients USING GIN (full_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_patients_mrn
  ON patients (medical_record_number);

CREATE INDEX IF NOT EXISTS idx_patients_nik
  ON patients (nik) WHERE nik IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_patients_bpjs
  ON patients (bpjs_number) WHERE bpjs_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_patients_active_created
  ON patients (is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_patients_phone
  ON patients (mobile_phone) WHERE mobile_phone IS NOT NULL;

-- ============================================================
-- VISITS — high-volume transactional table
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_visits_date_status
  ON visits (visit_date DESC, status);

CREATE INDEX IF NOT EXISTS idx_visits_patient_date
  ON visits (patient_id, visit_date DESC);

CREATE INDEX IF NOT EXISTS idx_visits_department_date
  ON visits (department_id, visit_date DESC);

CREATE INDEX IF NOT EXISTS idx_visits_doctor_date
  ON visits (doctor_id, visit_date DESC);

CREATE INDEX IF NOT EXISTS idx_visits_type_date
  ON visits (visit_type, visit_date DESC);

-- Partial index for active (non-completed) visits — very fast for worklist
CREATE INDEX IF NOT EXISTS idx_visits_active
  ON visits (visit_date DESC, department_id)
  WHERE status NOT IN ('completed', 'cancelled');

-- ============================================================
-- QUEUE ENTRIES — daily high-frequency
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_queue_dept_date
  ON queue_entries (department_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_queue_status_date
  ON queue_entries (status, created_at DESC);

-- Partial index for today's waiting queue
CREATE INDEX IF NOT EXISTS idx_queue_waiting
  ON queue_entries (department_id, queue_number)
  WHERE status IN ('waiting', 'called', 'serving');

-- ============================================================
-- BILLINGS — financial queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_billings_date_status
  ON billings (billing_date DESC, status);

CREATE INDEX IF NOT EXISTS idx_billings_patient_date
  ON billings (patient_id, billing_date DESC);

CREATE INDEX IF NOT EXISTS idx_billings_status
  ON billings (status) WHERE status NOT IN ('paid', 'cancelled');

CREATE INDEX IF NOT EXISTS idx_billings_payment_type
  ON billings (payment_type, billing_date DESC);

-- ============================================================
-- PRESCRIPTIONS — pharmacy queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_prescriptions_status_date
  ON prescriptions (status, prescription_date DESC);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_status
  ON prescriptions (patient_id, status, prescription_date DESC);

-- Partial index for pending (pharmacy worklist)
CREATE INDEX IF NOT EXISTS idx_prescriptions_pending
  ON prescriptions (prescription_date ASC)
  WHERE status IN ('pending', 'verified', 'preparing', 'ready');

-- ============================================================
-- PRESCRIPTION ITEMS — dispensing queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_presc_items_prescription
  ON prescription_items (prescription_id);

CREATE INDEX IF NOT EXISTS idx_presc_items_medicine
  ON prescription_items (medicine_id) WHERE medicine_id IS NOT NULL;

-- ============================================================
-- MEDICINE BATCHES — FEFO dispensing
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_med_batches_medicine_status
  ON medicine_batches (medicine_id, status, expiry_date ASC);

-- Partial index for available stock (most common query)
CREATE INDEX IF NOT EXISTS idx_med_batches_available
  ON medicine_batches (medicine_id, expiry_date ASC)
  WHERE status = 'available' AND quantity > 0;

-- ============================================================
-- LAB ORDERS — laboratory worklist
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_lab_orders_status_priority
  ON lab_orders (status, priority DESC, order_date ASC);

CREATE INDEX IF NOT EXISTS idx_lab_orders_patient_date
  ON lab_orders (patient_id, order_date DESC);

CREATE INDEX IF NOT EXISTS idx_lab_orders_date
  ON lab_orders (order_date DESC);

-- Partial index for active lab orders
CREATE INDEX IF NOT EXISTS idx_lab_orders_active
  ON lab_orders (priority DESC, order_date ASC)
  WHERE status IN ('pending', 'in_progress');

-- ============================================================
-- LAB RESULTS
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_lab_results_order
  ON lab_results (order_id);

CREATE INDEX IF NOT EXISTS idx_lab_results_flag
  ON lab_results (flag)
  WHERE flag IN ('critical', 'high', 'low');

-- ============================================================
-- DOCTORS — scheduling queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_doctors_active
  ON doctors (is_active, specialization);

CREATE INDEX IF NOT EXISTS idx_doctors_dept
  ON doctors (department_id) WHERE department_id IS NOT NULL;

-- ============================================================
-- DOCTOR SCHEDULES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_day
  ON doctor_schedules (day_of_week, doctor_id, is_active);

-- ============================================================
-- APPOINTMENTS
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_appointments_patient_date
  ON appointments (patient_id, appointment_date DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date
  ON appointments (doctor_id, appointment_date DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_status_date
  ON appointments (status, appointment_date DESC);

-- ============================================================
-- AUDIT LOGS — compliance reporting
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_date
  ON audit_logs (table_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_date
  ON audit_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action
  ON audit_logs (action, created_at DESC);

-- ============================================================
-- INPATIENT ADMISSIONS
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_inpatient_patient
  ON inpatient_admissions (patient_id, admission_date DESC);

CREATE INDEX IF NOT EXISTS idx_inpatient_status
  ON inpatient_admissions (status)
  WHERE status = 'admitted';

-- ============================================================
-- MEDICAL RECORDS
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_date
  ON medical_records (patient_id, record_date DESC);

CREATE INDEX IF NOT EXISTS idx_medical_records_visit
  ON medical_records (visit_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON notifications (user_id, is_read, created_at DESC);

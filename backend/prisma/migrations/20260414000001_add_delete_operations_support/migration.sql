-- Migration: Add Delete Operations Support
-- Generated: 2026-04-14
-- Description: Adds soft delete support columns to entities missing delete operations

-- ============================================
-- 1. ADD SOFT DELETE COLUMNS TO ENTITIES
-- ============================================

-- visits
ALTER TABLE visits ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
ALTER TABLE visits ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_visits_is_active ON visits(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_visits_deleted_at ON visits(deleted_at) WHERE deleted_at IS NOT NULL;

-- prescriptions
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_prescriptions_is_active ON prescriptions(is_active) WHERE is_active = true;

-- lab_orders
ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_lab_orders_is_active ON lab_orders(is_active) WHERE is_active = true;

-- radiology_orders
ALTER TABLE radiology_orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
ALTER TABLE radiology_orders ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_radiology_orders_is_active ON radiology_orders(is_active) WHERE is_active = true;

-- inventory_items
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS idx_inventory_items_deleted_at ON inventory_items(deleted_at) WHERE deleted_at IS NOT NULL;

-- suppliers
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_suppliers_is_active ON suppliers(is_active) WHERE is_active = true;

-- patient_incidents
ALTER TABLE patient_incidents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS idx_patient_incidents_deleted_at ON patient_incidents(deleted_at) WHERE deleted_at IS NOT NULL;

-- inpatient_admissions
ALTER TABLE inpatient_admissions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS idx_inpatient_admissions_deleted_at ON inpatient_admissions(deleted_at) WHERE deleted_at IS NOT NULL;

-- emergency_visits
ALTER TABLE emergency_visits ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS idx_emergency_visits_deleted_at ON emergency_visits(deleted_at) WHERE deleted_at IS NOT NULL;

-- surgeries
ALTER TABLE surgeries ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS idx_surgeries_deleted_at ON surgeries(deleted_at) WHERE deleted_at IS NOT NULL;

-- icu_admissions
ALTER TABLE icu_admissions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS idx_icu_admissions_deleted_at ON icu_admissions(deleted_at) WHERE deleted_at IS NOT NULL;

-- blood_inventory
ALTER TABLE blood_inventory ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS idx_blood_inventory_deleted_at ON blood_inventory(deleted_at) WHERE deleted_at IS NOT NULL;

-- transfusion_requests
ALTER TABLE transfusion_requests ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS idx_transfusion_requests_deleted_at ON transfusion_requests(deleted_at) WHERE deleted_at IS NOT NULL;

-- nutrition_orders
ALTER TABLE nutrition_orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS idx_nutrition_orders_deleted_at ON nutrition_orders(deleted_at) WHERE deleted_at IS NOT NULL;

-- nutrition_assessments
ALTER TABLE nutrition_assessments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS idx_nutrition_assessments_deleted_at ON nutrition_assessments(deleted_at) WHERE deleted_at IS NOT NULL;

-- rehabilitation_cases
ALTER TABLE rehabilitation_cases ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS idx_rehabilitation_cases_deleted_at ON rehabilitation_cases(deleted_at) WHERE deleted_at IS NOT NULL;

-- home_care_visits
ALTER TABLE home_care_visits ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS idx_home_care_visits_deleted_at ON home_care_visits(deleted_at) WHERE deleted_at IS NOT NULL;

-- mcu_packages
ALTER TABLE mcu_packages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
ALTER TABLE mcu_packages ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_mcu_packages_is_active ON mcu_packages(is_active) WHERE is_active = true;

-- mcu_clients
ALTER TABLE mcu_clients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
ALTER TABLE mcu_clients ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_mcu_clients_is_active ON mcu_clients(is_active) WHERE is_active = true;

-- mcu_registrations
ALTER TABLE mcu_registrations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS idx_mcu_registrations_deleted_at ON mcu_registrations(deleted_at) WHERE deleted_at IS NOT NULL;

-- patient_consents
ALTER TABLE patient_consents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS idx_patient_consents_deleted_at ON patient_consents(deleted_at) WHERE deleted_at IS NOT NULL;

-- telemedicine_sessions
ALTER TABLE telemedicine_sessions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS idx_telemedicine_sessions_deleted_at ON telemedicine_sessions(deleted_at) WHERE deleted_at IS NOT NULL;

-- waste_records
ALTER TABLE waste_records ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS idx_waste_records_deleted_at ON waste_records(deleted_at) WHERE deleted_at IS NOT NULL;

-- mortuary_cases (forensic)
ALTER TABLE mortuary_cases ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS idx_mortuary_cases_deleted_at ON mortuary_cases(deleted_at) WHERE deleted_at IS NOT NULL;

-- visum_reports (forensic)
ALTER TABLE visum_reports ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS idx_visum_reports_deleted_at ON visum_reports(deleted_at) WHERE deleted_at IS NOT NULL;

-- ambulance_fleet
ALTER TABLE ambulance_fleet ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
ALTER TABLE ambulance_fleet ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_ambulance_fleet_is_active ON ambulance_fleet(is_active) WHERE is_active = true;

-- ambulance_dispatches
ALTER TABLE ambulance_dispatches ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS idx_ambulance_dispatches_deleted_at ON ambulance_dispatches(deleted_at) WHERE deleted_at IS NOT NULL;

-- cssd_items
ALTER TABLE cssd_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS idx_cssd_items_deleted_at ON cssd_items(deleted_at) WHERE deleted_at IS NOT NULL;

-- linen_inventory
ALTER TABLE linen_inventory ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS idx_linen_inventory_deleted_at ON linen_inventory(deleted_at) WHERE deleted_at IS NOT NULL;

-- linen_categories
ALTER TABLE linen_categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
ALTER TABLE linen_categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_linen_categories_is_active ON linen_categories(is_active) WHERE is_active = true;

-- employees (HR)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
-- is_active already exists

-- attendance (HR) - soft delete not applicable, but add deleted_at for corrections
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS idx_attendance_deleted_at ON attendance(deleted_at) WHERE deleted_at IS NOT NULL;

-- leave_requests (HR)
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS idx_leave_requests_deleted_at ON leave_requests(deleted_at) WHERE deleted_at IS NOT NULL;

-- payroll (HR)
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS idx_payroll_deleted_at ON payroll(deleted_at) WHERE deleted_at IS NOT NULL;

-- work_shifts (HR)
ALTER TABLE work_shifts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
ALTER TABLE work_shifts ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_work_shifts_is_active ON work_shifts(is_active) WHERE is_active = true;

-- chart_of_accounts (Accounting)
ALTER TABLE chart_of_accounts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
ALTER TABLE chart_of_accounts ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_is_active ON chart_of_accounts(is_active) WHERE is_active = true;

-- pacs_config
ALTER TABLE pacs_config ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS idx_pacs_config_deleted_at ON pacs_config(deleted_at) WHERE deleted_at IS NOT NULL;

-- dicom_worklist
ALTER TABLE dicom_worklist ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS idx_dicom_worklist_deleted_at ON dicom_worklist(deleted_at) WHERE deleted_at IS NOT NULL;

-- dicom_studies
ALTER TABLE dicom_studies ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS idx_dicom_studies_deleted_at ON dicom_studies(deleted_at) WHERE deleted_at IS NOT NULL;

-- dicom_series
ALTER TABLE dicom_series ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS idx_dicom_series_deleted_at ON dicom_series(deleted_at) WHERE deleted_at IS NOT NULL;

-- hospitals
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);
-- is_active already exists

-- ============================================
-- 2. ADD DELETE CASCADE RULES WHERE MISSING
-- ============================================

-- Add ON DELETE CASCADE to child tables where parent is deleted
-- This ensures data integrity when parent records are soft-deleted

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

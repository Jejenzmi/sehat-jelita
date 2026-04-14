-- Migration: Add @updatedAt and fix decimal precision
-- Generated: 2026-04-14
-- Description: Adds updated_at column and fixes decimal precision for all mutable models

-- ============================================
-- 1. ADD updated_at TO MODELS MISSING IT
-- ============================================

-- prescription_items
ALTER TABLE prescription_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- lab_reference_ranges
ALTER TABLE lab_reference_ranges ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- icu_vital_signs
ALTER TABLE icu_vital_signs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- icu_intake_output
ALTER TABLE icu_intake_output ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- icu_ventilator_records
ALTER TABLE icu_ventilator_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- nursing_notes
ALTER TABLE nursing_notes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- bed_transfers
ALTER TABLE bed_transfers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- emergency_treatments
ALTER TABLE emergency_treatments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- inventory_batches
ALTER TABLE inventory_batches ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- nutrition_assessments
ALTER TABLE nutrition_assessments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- patient_allergies
ALTER TABLE patient_allergies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- meal_plans
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- rehabilitation_cases
ALTER TABLE rehabilitation_cases ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- therapy_types
ALTER TABLE therapy_types ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- cssd_items
ALTER TABLE cssd_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- linen_categories
ALTER TABLE linen_categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- linen_inventory
ALTER TABLE linen_inventory ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- notification_channels
ALTER TABLE notification_channels ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- notification_logs
ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- scheduled_reports
ALTER TABLE scheduled_reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- dicom_series
ALTER TABLE dicom_series ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- dicom_instances
ALTER TABLE dicom_instances ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- aspak_reports
ALTER TABLE aspak_reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- custom_form_templates
ALTER TABLE custom_form_templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- custom_report_templates
ALTER TABLE custom_report_templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ============================================
-- 2. FIX DECIMAL PRECISION FOR CURRENCY FIELDS
-- ============================================

-- rooms
ALTER TABLE rooms ALTER COLUMN rate_per_day TYPE DECIMAL(15,2);

-- doctors
ALTER TABLE doctors ALTER COLUMN consultation_fee TYPE DECIMAL(15,2);

-- medicine_batches
ALTER TABLE medicine_batches ALTER COLUMN purchase_price TYPE DECIMAL(15,2);

-- billing_items
ALTER TABLE billing_items ALTER COLUMN unit_price TYPE DECIMAL(15,2);
ALTER TABLE billing_items ALTER COLUMN total_price TYPE DECIMAL(15,2);

-- employees
ALTER TABLE employees ALTER COLUMN salary TYPE DECIMAL(15,2);

-- payroll
ALTER TABLE payroll ALTER COLUMN base_salary TYPE DECIMAL(15,2);
ALTER TABLE payroll ALTER COLUMN allowances TYPE DECIMAL(15,2);
ALTER TABLE payroll ALTER COLUMN deductions TYPE DECIMAL(15,2);
ALTER TABLE payroll ALTER COLUMN overtime TYPE DECIMAL(15,2);
ALTER TABLE payroll ALTER COLUMN net_salary TYPE DECIMAL(15,2);

-- lab_reference_ranges
ALTER TABLE lab_reference_ranges ALTER COLUMN normal_min TYPE DECIMAL(8,2);
ALTER TABLE lab_reference_ranges ALTER COLUMN normal_max TYPE DECIMAL(8,2);
ALTER TABLE lab_reference_ranges ALTER COLUMN critical_low TYPE DECIMAL(8,2);
ALTER TABLE lab_reference_ranges ALTER COLUMN critical_high TYPE DECIMAL(8,2);

-- icu_vital_signs
ALTER TABLE icu_vital_signs ALTER COLUMN temperature TYPE DECIMAL(5,2);
ALTER TABLE icu_vital_signs ALTER COLUMN spo2 TYPE DECIMAL(5,2);
ALTER TABLE icu_vital_signs ALTER COLUMN fio2 TYPE DECIMAL(5,2);

-- icu_intake_output
ALTER TABLE icu_intake_output ALTER COLUMN amount TYPE DECIMAL(10,2);

-- inventory_items
ALTER TABLE inventory_items ALTER COLUMN unit_price TYPE DECIMAL(15,2);

-- purchase_requests
ALTER TABLE purchase_requests ALTER COLUMN total_estimated TYPE DECIMAL(15,2);

-- journal_entry_lines
ALTER TABLE journal_entry_lines ALTER COLUMN debit TYPE DECIMAL(15,2);
ALTER TABLE journal_entry_lines ALTER COLUMN credit TYPE DECIMAL(15,2);

-- dialysis_schedules
ALTER TABLE dialysis_schedules ALTER COLUMN dry_weight TYPE DECIMAL(8,2);

-- dialysis_sessions
ALTER TABLE dialysis_sessions ALTER COLUMN pre_weight TYPE DECIMAL(8,2);
ALTER TABLE dialysis_sessions ALTER COLUMN post_weight TYPE DECIMAL(8,2);
ALTER TABLE dialysis_sessions ALTER COLUMN pre_temp TYPE DECIMAL(5,2);
ALTER TABLE dialysis_sessions ALTER COLUMN post_temp TYPE DECIMAL(5,2);
ALTER TABLE dialysis_sessions ALTER COLUMN uf_goal TYPE DECIMAL(8,2);
ALTER TABLE dialysis_sessions ALTER COLUMN uf_achieved TYPE DECIMAL(8,2);
ALTER TABLE dialysis_sessions ALTER COLUMN kt_v TYPE DECIMAL(5,2);

-- dialysis_vitals
ALTER TABLE dialysis_vitals ALTER COLUMN temp TYPE DECIMAL(5,2);
ALTER TABLE dialysis_vitals ALTER COLUMN uf_rate TYPE DECIMAL(8,2);

-- corporate_clients
ALTER TABLE corporate_clients ALTER COLUMN discount_percentage TYPE DECIMAL(5,2);

-- mcu_packages
ALTER TABLE mcu_packages ALTER COLUMN base_price TYPE DECIMAL(15,2);

-- mcu_registrations
ALTER TABLE mcu_registrations ALTER COLUMN total_price TYPE DECIMAL(15,2);

-- nutrition_assessments
ALTER TABLE nutrition_assessments ALTER COLUMN weight TYPE DECIMAL(8,2);
ALTER TABLE nutrition_assessments ALTER COLUMN height TYPE DECIMAL(8,2);
ALTER TABLE nutrition_assessments ALTER COLUMN bmi TYPE DECIMAL(5,2);

-- nutrition_orders
ALTER TABLE nutrition_orders ALTER COLUMN protein_requirement TYPE DECIMAL(8,2);

-- meal_plans
ALTER TABLE meal_plans ALTER COLUMN protein TYPE DECIMAL(8,2);
ALTER TABLE meal_plans ALTER COLUMN carbohydrates TYPE DECIMAL(8,2);
ALTER TABLE meal_plans ALTER COLUMN fat TYPE DECIMAL(8,2);
ALTER TABLE meal_plans ALTER COLUMN fiber TYPE DECIMAL(8,2);

-- clinical_rotations
ALTER TABLE clinical_rotations ALTER COLUMN performance_score TYPE DECIMAL(5,2);

-- academic_activities
ALTER TABLE academic_activities ALTER COLUMN skp_points TYPE DECIMAL(5,2);

-- research_projects
ALTER TABLE research_projects ALTER COLUMN budget TYPE DECIMAL(15,2);

-- trainings
ALTER TABLE trainings ALTER COLUMN cost TYPE DECIMAL(15,2);

-- inacbg_calculation_history
ALTER TABLE inacbg_calculation_history ALTER COLUMN base_tariff TYPE DECIMAL(15,2);
ALTER TABLE inacbg_calculation_history ALTER COLUMN adjustment_factor TYPE DECIMAL(10,4);
ALTER TABLE inacbg_calculation_history ALTER COLUMN final_tariff TYPE DECIMAL(15,2);
ALTER TABLE inacbg_calculation_history ALTER COLUMN hospital_cost TYPE DECIMAL(15,2);
ALTER TABLE inacbg_calculation_history ALTER COLUMN variance TYPE DECIMAL(15,2);

-- drg_codes
ALTER TABLE drg_codes ALTER COLUMN national_tariff TYPE DECIMAL(15,2);

-- ============================================
-- 3. CREATE INDEXES FOR FREQUENTLY QUERIED FIELDS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_revoked_at ON refresh_tokens(revoked_at) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_staff_certifications_alert_30d ON staff_certifications(alert_sent_30d) WHERE alert_sent_30d = false;
CREATE INDEX IF NOT EXISTS idx_staff_certifications_alert_7d ON staff_certifications(alert_sent_7d) WHERE alert_sent_7d = false;
CREATE INDEX IF NOT EXISTS idx_dialysis_sessions_status ON dialysis_sessions(status);
CREATE INDEX IF NOT EXISTS idx_radiology_orders_priority ON radiology_orders(priority);
CREATE INDEX IF NOT EXISTS idx_medicines_category ON medicines(category);
CREATE INDEX IF NOT EXISTS idx_medicines_is_active ON medicines(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_lab_results_critical_alerted ON lab_results(critical_alerted) WHERE critical_alerted = false;
CREATE INDEX IF NOT EXISTS idx_lab_results_delta_flag ON lab_results(delta_flag) WHERE delta_flag = true;

-- ============================================
-- 4. ADD MISSING UNIQUE CONSTRAINTS
-- ============================================

ALTER TABLE notification_channels ADD CONSTRAINT uq_notification_channels_patient_channel UNIQUE NULLS NOT DISTINCT (patient_id, channel_type, address_hash);
ALTER TABLE meal_plans ADD CONSTRAINT uq_meal_plans_patient_date_type UNIQUE (patient_id, meal_date, meal_type);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

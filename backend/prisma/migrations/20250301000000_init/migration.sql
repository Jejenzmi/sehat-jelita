-- CreateEnum
CREATE TYPE "BedStatus" AS ENUM ('available', 'occupied', 'maintenance', 'reserved');

-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('pending', 'partial', 'paid', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('cash', 'bpjs', 'insurance', 'corporate', 'credit_card', 'debit_card');

-- CreateEnum
CREATE TYPE "BloodType" AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('draft', 'submitted', 'verified', 'approved', 'rejected', 'paid');

-- CreateEnum
CREATE TYPE "BloodProductType" AS ENUM ('whole_blood', 'packed_red_cells', 'fresh_frozen_plasma', 'platelets', 'cryoprecipitate');

-- CreateEnum
CREATE TYPE "BloodStatus" AS ENUM ('available', 'reserved', 'issued', 'expired', 'discarded', 'quarantine');

-- CreateEnum
CREATE TYPE "CrossmatchResult" AS ENUM ('compatible', 'incompatible', 'pending');

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT,
    "phone" TEXT,
    "avatar_url" TEXT,
    "password_hash" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "reset_token" TEXT,
    "reset_token_expires" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" TEXT,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_access" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "menu_path" TEXT NOT NULL,
    "can_view" BOOLEAN NOT NULL DEFAULT false,
    "can_create" BOOLEAN NOT NULL DEFAULT false,
    "can_edit" BOOLEAN NOT NULL DEFAULT false,
    "can_delete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "department_code" TEXT NOT NULL,
    "department_name" TEXT NOT NULL,
    "department_type" TEXT,
    "head_doctor_id" TEXT,
    "phone" TEXT,
    "location" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "room_number" TEXT NOT NULL,
    "room_name" TEXT,
    "department_id" TEXT,
    "room_type" TEXT,
    "floor" INTEGER,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "rate_per_day" DECIMAL(65,30),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beds" (
    "id" TEXT NOT NULL,
    "bed_number" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "status" "BedStatus" NOT NULL DEFAULT 'available',
    "current_patient_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctors" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT,
    "user_id" TEXT,
    "doctor_code" TEXT NOT NULL,
    "sip_number" TEXT,
    "str_number" TEXT,
    "full_name" TEXT,
    "specialization" TEXT,
    "department_id" TEXT,
    "consultation_fee" DECIMAL(65,30),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "schedule" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "medical_record_number" TEXT NOT NULL,
    "nik" TEXT,
    "bpjs_number" TEXT,
    "full_name" TEXT NOT NULL,
    "birth_date" TIMESTAMP(3),
    "birth_place" TEXT,
    "gender" TEXT,
    "blood_type" TEXT,
    "religion" TEXT,
    "marital_status" TEXT,
    "education" TEXT,
    "occupation" TEXT,
    "address" TEXT,
    "rt" TEXT,
    "rw" TEXT,
    "kelurahan" TEXT,
    "kecamatan" TEXT,
    "city" TEXT,
    "province" TEXT,
    "postal_code" TEXT,
    "phone" TEXT,
    "mobile_phone" TEXT,
    "email" TEXT,
    "emergency_contact_name" TEXT,
    "emergency_contact_phone" TEXT,
    "emergency_contact_relation" TEXT,
    "allergy_notes" TEXT,
    "chronic_conditions" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "photo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visits" (
    "id" TEXT NOT NULL,
    "visit_number" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "visit_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visit_type" TEXT NOT NULL,
    "department_id" TEXT,
    "doctor_id" TEXT,
    "bed_id" TEXT,
    "admission_date" TIMESTAMP(3),
    "discharge_date" TIMESTAMP(3),
    "chief_complaint" TEXT,
    "diagnosis" TEXT,
    "icd10_code" TEXT,
    "treatment_plan" TEXT,
    "discharge_summary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "payment_type" "PaymentType",
    "bpjs_sep_number" TEXT,
    "insurance_policy_number" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_records" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "visit_id" TEXT,
    "record_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "record_type" TEXT,
    "subjective" TEXT,
    "objective" TEXT,
    "assessment" TEXT,
    "plan" TEXT,
    "vital_signs" JSONB,
    "physical_exam" JSONB,
    "doctor_id" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicines" (
    "id" TEXT NOT NULL,
    "medicine_code" TEXT NOT NULL,
    "medicine_name" TEXT NOT NULL,
    "generic_name" TEXT,
    "category" TEXT,
    "form" TEXT,
    "strength" TEXT,
    "unit" TEXT NOT NULL,
    "manufacturer" TEXT,
    "selling_price" DECIMAL(65,30) NOT NULL,
    "purchase_price" DECIMAL(65,30),
    "min_stock" INTEGER NOT NULL DEFAULT 10,
    "max_stock" INTEGER NOT NULL DEFAULT 1000,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "requires_prescription" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medicines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicine_batches" (
    "id" TEXT NOT NULL,
    "medicine_id" TEXT NOT NULL,
    "batch_number" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "purchase_date" TIMESTAMP(3),
    "purchase_price" DECIMAL(65,30),
    "supplier_id" TEXT,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'available',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medicine_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" TEXT NOT NULL,
    "prescription_number" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "visit_id" TEXT,
    "doctor_id" TEXT,
    "prescription_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescription_items" (
    "id" TEXT NOT NULL,
    "prescription_id" TEXT NOT NULL,
    "medicine_id" TEXT,
    "medicine_name" TEXT NOT NULL,
    "dosage" TEXT,
    "frequency" TEXT,
    "duration" TEXT,
    "quantity" INTEGER,
    "unit" TEXT,
    "instructions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prescription_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_orders" (
    "id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "visit_id" TEXT,
    "doctor_id" TEXT,
    "order_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_results" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "test_code" TEXT NOT NULL,
    "test_name" TEXT NOT NULL,
    "result_value" TEXT,
    "unit" TEXT,
    "reference_range" TEXT,
    "flag" TEXT,
    "performed_by" TEXT,
    "verified_by" TEXT,
    "result_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billings" (
    "id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "visit_id" TEXT NOT NULL,
    "billing_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payment_type" "PaymentType" NOT NULL,
    "subtotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discount" DECIMAL(65,30),
    "tax" DECIMAL(65,30),
    "total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "paid_amount" DECIMAL(65,30),
    "status" "BillingStatus" NOT NULL DEFAULT 'pending',
    "payment_method" TEXT,
    "payment_date" TIMESTAMP(3),
    "paid_by" TEXT,
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_items" (
    "id" TEXT NOT NULL,
    "billing_id" TEXT NOT NULL,
    "item_type" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(65,30) NOT NULL,
    "total_price" DECIMAL(65,30) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bpjs_claims" (
    "id" TEXT NOT NULL,
    "claim_number" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "visit_id" TEXT NOT NULL,
    "sep_number" TEXT NOT NULL,
    "claim_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claim_amount" DECIMAL(65,30) NOT NULL,
    "approved_amount" DECIMAL(65,30),
    "status" "ClaimStatus" NOT NULL DEFAULT 'draft',
    "inacbg_code" TEXT,
    "inacbg_description" TEXT,
    "submission_date" TIMESTAMP(3),
    "verification_date" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bpjs_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "supplier_code" TEXT NOT NULL,
    "supplier_name" TEXT NOT NULL,
    "contact_person" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "npwp" TEXT,
    "payment_terms" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL,
    "po_number" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "order_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expected_delivery" TIMESTAMP(3),
    "total_amount" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "submitted_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "received_at" TIMESTAMP(3),
    "received_by" TEXT,
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "id" TEXT NOT NULL,
    "purchase_order_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(65,30) NOT NULL,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "received_quantity" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "employee_code" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "nik" TEXT,
    "birth_date" TIMESTAMP(3),
    "gender" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "department_id" TEXT,
    "position" TEXT,
    "employment_type" TEXT,
    "join_date" TIMESTAMP(3),
    "resign_date" TIMESTAMP(3),
    "salary" DECIMAL(65,30),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "attendance_date" DATE NOT NULL,
    "check_in" TIMESTAMP(3),
    "check_out" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'present',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_requests" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "leave_type" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "approval_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "period_month" INTEGER NOT NULL,
    "period_year" INTEGER NOT NULL,
    "base_salary" DECIMAL(65,30) NOT NULL,
    "allowances" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "deductions" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "overtime" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "net_salary" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "department_id" TEXT,
    "appointment_date" DATE NOT NULL,
    "appointment_time" TEXT NOT NULL,
    "end_time" TEXT,
    "appointment_type" TEXT NOT NULL DEFAULT 'consultation',
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "chief_complaint" TEXT,
    "notes" TEXT,
    "booking_source" TEXT,
    "reminder_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "queue_entries" (
    "id" TEXT NOT NULL,
    "visit_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "queue_number" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "called_at" TIMESTAMP(3),
    "served_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "queue_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "table_name" TEXT NOT NULL,
    "record_id" TEXT,
    "action" TEXT NOT NULL,
    "old_data" JSONB,
    "new_data" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "setting_key" TEXT NOT NULL,
    "setting_value" TEXT,
    "setting_type" TEXT,
    "description" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "type" TEXT,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_rooms" (
    "id" TEXT NOT NULL,
    "room_name" TEXT,
    "room_type" TEXT NOT NULL DEFAULT 'direct',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_participants" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_read_at" TIMESTAMP(3),

    CONSTRAINT "chat_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "sender_id" TEXT,
    "content" TEXT NOT NULL,
    "message_type" TEXT NOT NULL DEFAULT 'text',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "radiology_orders" (
    "id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "visit_id" TEXT,
    "doctor_id" TEXT,
    "modality" TEXT,
    "body_part" TEXT,
    "clinical_info" TEXT,
    "order_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "radiology_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "radiology_results" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "findings" TEXT,
    "impression" TEXT,
    "recommendation" TEXT,
    "radiologist_id" TEXT,
    "report_date" TIMESTAMP(3),
    "image_urls" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "radiology_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surgeries" (
    "id" TEXT NOT NULL,
    "surgery_number" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "visit_id" TEXT,
    "operating_room_id" TEXT,
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "scheduled_time" TEXT,
    "actual_start_time" TIMESTAMP(3),
    "actual_end_time" TIMESTAMP(3),
    "procedure_name" TEXT NOT NULL,
    "procedure_code" TEXT,
    "surgery_type" TEXT,
    "surgeon_id" TEXT,
    "anesthesiologist_id" TEXT,
    "anesthesia_type" TEXT,
    "pre_diagnosis" TEXT,
    "post_diagnosis" TEXT,
    "operative_findings" TEXT,
    "procedure_notes" TEXT,
    "complications" TEXT,
    "blood_loss" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "priority" TEXT NOT NULL DEFAULT 'elective',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "surgeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blood_inventory" (
    "id" TEXT NOT NULL,
    "bag_number" TEXT NOT NULL,
    "blood_type" "BloodType" NOT NULL,
    "product_type" "BloodProductType" NOT NULL,
    "volume" INTEGER,
    "collection_date" TIMESTAMP(3) NOT NULL,
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "donor_id" TEXT,
    "status" "BloodStatus" NOT NULL DEFAULT 'available',
    "storage_location" TEXT,
    "screening_date" TIMESTAMP(3),
    "hiv_status" TEXT,
    "hbsag_status" TEXT,
    "hcv_status" TEXT,
    "vdrl_status" TEXT,
    "malaria_status" TEXT,
    "screened_by" TEXT,
    "reserved_for_patient_id" TEXT,
    "issued_date" TIMESTAMP(3),
    "issued_by" TEXT,
    "issued_to_department" TEXT,
    "source_blood_bank" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blood_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfusion_requests" (
    "id" TEXT NOT NULL,
    "request_number" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "visit_id" TEXT,
    "requesting_doctor_id" TEXT,
    "blood_type" "BloodType" NOT NULL,
    "product_type" "BloodProductType" NOT NULL,
    "units_requested" INTEGER NOT NULL,
    "units_issued" INTEGER NOT NULL DEFAULT 0,
    "urgency" TEXT NOT NULL DEFAULT 'routine',
    "indication" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "request_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_by" TEXT,
    "approved_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfusion_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crossmatch_tests" (
    "id" TEXT NOT NULL,
    "request_id" TEXT,
    "patient_id" TEXT NOT NULL,
    "blood_bag_id" TEXT NOT NULL,
    "test_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "major_crossmatch" "CrossmatchResult",
    "minor_crossmatch" "CrossmatchResult",
    "is_compatible" BOOLEAN,
    "antibody_screen" TEXT,
    "dat_result" TEXT,
    "iat_result" TEXT,
    "tested_by" TEXT,
    "valid_until" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crossmatch_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inpatient_admissions" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "visit_id" TEXT,
    "room_id" TEXT,
    "bed_id" TEXT,
    "admission_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "discharge_date" TIMESTAMP(3),
    "admission_type" TEXT,
    "attending_doctor_id" TEXT,
    "admission_diagnosis" TEXT,
    "discharge_diagnosis" TEXT,
    "payment_type" TEXT,
    "insurance_info" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ADMITTED',
    "notes" TEXT,
    "admitted_by" TEXT,
    "discharged_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inpatient_admissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nursing_notes" (
    "id" TEXT NOT NULL,
    "admission_id" TEXT NOT NULL,
    "nurse_id" TEXT,
    "note_type" TEXT,
    "content" TEXT NOT NULL,
    "vital_signs" JSONB,
    "pain_score" INTEGER,
    "fall_risk_score" INTEGER,
    "pressure_ulcer_risk" INTEGER,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nursing_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bed_transfers" (
    "id" TEXT NOT NULL,
    "admission_id" TEXT NOT NULL,
    "from_bed_id" TEXT,
    "to_bed_id" TEXT,
    "transfer_reason" TEXT,
    "transferred_by" TEXT,
    "transferred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bed_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_visits" (
    "id" TEXT NOT NULL,
    "visit_id" TEXT,
    "patient_id" TEXT NOT NULL,
    "arrival_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "arrival_mode" TEXT,
    "chief_complaint" TEXT,
    "triage_level" TEXT,
    "triage_time" TIMESTAMP(3),
    "triaged_by" TEXT,
    "vital_signs" JSONB,
    "allergies" TEXT,
    "current_medications" TEXT,
    "accompanying_person" JSONB,
    "diagnosis" TEXT,
    "discharge_medications" TEXT,
    "disposition" TEXT,
    "disposition_time" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'TRIAGED',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_treatments" (
    "id" TEXT NOT NULL,
    "emergency_visit_id" TEXT NOT NULL,
    "treatment_type" TEXT,
    "description" TEXT,
    "medications" JSONB,
    "procedures" JSONB,
    "performed_by" TEXT,
    "performed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emergency_treatments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "icu_admissions" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "visit_id" TEXT,
    "bed_id" TEXT,
    "admission_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "discharge_date" TIMESTAMP(3),
    "admission_reason" TEXT,
    "admission_source" TEXT,
    "diagnosis_on_admission" TEXT,
    "apache_score" INTEGER,
    "sofa_score" INTEGER,
    "ventilator_required" BOOLEAN NOT NULL DEFAULT false,
    "isolation_required" BOOLEAN NOT NULL DEFAULT false,
    "attending_physician_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ADMITTED',
    "admitted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "icu_admissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "icu_vital_signs" (
    "id" TEXT NOT NULL,
    "admission_id" TEXT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by" TEXT,
    "heart_rate" INTEGER,
    "systolic_bp" INTEGER,
    "diastolic_bp" INTEGER,
    "mean_arterial_pressure" INTEGER,
    "respiratory_rate" INTEGER,
    "temperature" DECIMAL(65,30),
    "spo2" DECIMAL(65,30),
    "fio2" DECIMAL(65,30),
    "gcs_eye" INTEGER,
    "gcs_verbal" INTEGER,
    "gcs_motor" INTEGER,
    "gcs_total" INTEGER,
    "pupil_left" TEXT,
    "pupil_right" TEXT,
    "cvp" INTEGER,
    "urine_output" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "icu_vital_signs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "icu_intake_output" (
    "id" TEXT NOT NULL,
    "admission_id" TEXT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by" TEXT,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "amount" DECIMAL(65,30),
    "route" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "icu_intake_output_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "icu_ventilator_records" (
    "id" TEXT NOT NULL,
    "admission_id" TEXT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by" TEXT,
    "mode" TEXT,
    "fio2" DECIMAL(65,30),
    "peep" DECIMAL(65,30),
    "tidal_volume" INTEGER,
    "respiratory_rate_set" INTEGER,
    "respiratory_rate_actual" INTEGER,
    "pip" DECIMAL(65,30),
    "plateau_pressure" DECIMAL(65,30),
    "ie_ratio" TEXT,
    "minute_volume" DECIMAL(65,30),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "icu_ventilator_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operating_rooms" (
    "id" TEXT NOT NULL,
    "room_code" TEXT NOT NULL,
    "room_name" TEXT NOT NULL,
    "room_type" TEXT,
    "status" TEXT NOT NULL DEFAULT 'available',
    "floor" INTEGER,
    "capacity" INTEGER,
    "equipment" JSONB,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operating_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anesthesia_records" (
    "id" TEXT NOT NULL,
    "surgery_id" TEXT NOT NULL,
    "anesthesiologist_name" TEXT,
    "anesthesiologist_id" TEXT,
    "pre_anesthesia_assessment" TEXT,
    "airway_assessment" TEXT,
    "npo_status" BOOLEAN,
    "premedication" TEXT,
    "induction_agents" TEXT,
    "maintenance_agents" TEXT,
    "airway_device" TEXT,
    "ett_size" TEXT,
    "intubation_grade" TEXT,
    "iv_fluids" JSONB,
    "blood_products" JSONB,
    "vital_signs_timeline" JSONB,
    "estimated_blood_loss" INTEGER,
    "urine_output" INTEGER,
    "emergence_time" TIMESTAMP(3),
    "extubation_time" TIMESTAMP(3),
    "complications" TEXT,
    "post_anesthesia_score" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anesthesia_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "item_code" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "category" TEXT,
    "unit" TEXT,
    "current_stock" INTEGER NOT NULL DEFAULT 0,
    "minimum_stock" INTEGER NOT NULL DEFAULT 0,
    "maximum_stock" INTEGER,
    "reorder_point" INTEGER,
    "unit_price" DECIMAL(65,30),
    "storage_location" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_batches" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "batch_number" TEXT,
    "expiry_date" TIMESTAMP(3),
    "initial_quantity" INTEGER NOT NULL,
    "remaining_quantity" INTEGER NOT NULL,
    "purchase_order_id" TEXT,
    "received_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_requests" (
    "id" TEXT NOT NULL,
    "pr_number" TEXT NOT NULL,
    "requested_by" TEXT,
    "department_id" TEXT,
    "request_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "needed_by" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "total_estimated" DECIMAL(65,30),
    "notes" TEXT,
    "approved_by" TEXT,
    "approved_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chart_of_accounts" (
    "id" TEXT NOT NULL,
    "account_code" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "account_type" TEXT NOT NULL,
    "account_category" TEXT,
    "parent_id" TEXT,
    "normal_balance" TEXT NOT NULL DEFAULT 'DEBIT',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chart_of_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "entry_number" TEXT NOT NULL,
    "entry_date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "total_debit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_credit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_by" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "posted_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entry_lines" (
    "id" TEXT NOT NULL,
    "entry_id" TEXT NOT NULL,
    "line_number" INTEGER NOT NULL,
    "account_id" TEXT NOT NULL,
    "description" TEXT,
    "debit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "credit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_entry_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dialysis_machines" (
    "id" TEXT NOT NULL,
    "machine_code" TEXT NOT NULL,
    "machine_name" TEXT NOT NULL,
    "manufacturer" TEXT,
    "model_number" TEXT,
    "serial_number" TEXT,
    "status" TEXT NOT NULL DEFAULT 'available',
    "last_maintenance" TIMESTAMP(3),
    "next_maintenance" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dialysis_machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dialysis_schedules" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "machine_id" TEXT,
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "scheduled_time" TEXT,
    "duration_minutes" INTEGER NOT NULL DEFAULT 240,
    "frequency" TEXT,
    "dry_weight" DECIMAL(65,30),
    "vascular_access" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dialysis_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dialysis_sessions" (
    "id" TEXT NOT NULL,
    "schedule_id" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_time" TIMESTAMP(3),
    "pre_weight" DECIMAL(65,30),
    "post_weight" DECIMAL(65,30),
    "pre_bp" TEXT,
    "post_bp" TEXT,
    "pre_pulse" INTEGER,
    "post_pulse" INTEGER,
    "pre_temp" DECIMAL(65,30),
    "post_temp" DECIMAL(65,30),
    "access_condition" TEXT,
    "dialysate_solution" TEXT,
    "heparin_dose" INTEGER,
    "blood_flow_rate" INTEGER,
    "dialysate_flow_rate" INTEGER,
    "uf_goal" DECIMAL(65,30),
    "uf_achieved" DECIMAL(65,30),
    "kt_v" DECIMAL(65,30),
    "complications" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ongoing',
    "notes" TEXT,
    "nurse_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dialysis_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dialysis_vitals" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bp" TEXT,
    "pulse" INTEGER,
    "temp" DECIMAL(65,30),
    "blood_flow_rate" INTEGER,
    "venous_pressure" INTEGER,
    "tmp" INTEGER,
    "uf_rate" DECIMAL(65,30),
    "notes" TEXT,
    "recorded_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dialysis_vitals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corporate_clients" (
    "id" TEXT NOT NULL,
    "company_code" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "pic_name" TEXT,
    "pic_phone" TEXT,
    "discount_percentage" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "contract_start" TIMESTAMP(3),
    "contract_end" TIMESTAMP(3),
    "payment_terms" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "corporate_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mcu_packages" (
    "id" TEXT NOT NULL,
    "package_code" TEXT NOT NULL,
    "package_name" TEXT NOT NULL,
    "description" TEXT,
    "base_price" DECIMAL(65,30),
    "components" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mcu_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mcu_registrations" (
    "id" TEXT NOT NULL,
    "registration_number" TEXT,
    "patient_id" TEXT NOT NULL,
    "package_id" TEXT,
    "corporate_client_id" TEXT,
    "registration_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_price" DECIMAL(65,30),
    "status" TEXT NOT NULL DEFAULT 'registered',
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mcu_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mcu_results" (
    "id" TEXT NOT NULL,
    "registration_id" TEXT NOT NULL,
    "component_name" TEXT NOT NULL,
    "component_type" TEXT,
    "result_value" TEXT,
    "unit" TEXT,
    "reference_range" TEXT,
    "status" TEXT,
    "examined_by" TEXT,
    "examined_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mcu_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrition_assessments" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "admission_id" TEXT,
    "assessment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weight" DECIMAL(65,30),
    "height" DECIMAL(65,30),
    "bmi" DECIMAL(65,30),
    "nutrition_risk_score" INTEGER,
    "assessment_type" TEXT,
    "findings" TEXT,
    "recommendations" TEXT,
    "assessed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nutrition_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_allergies" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "allergen" TEXT NOT NULL,
    "allergen_type" TEXT,
    "severity" TEXT,
    "reaction" TEXT,
    "reported_date" TIMESTAMP(3),
    "noted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_allergies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrition_orders" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "admission_id" TEXT,
    "diet_type" TEXT,
    "diet_description" TEXT,
    "caloric_requirement" INTEGER,
    "protein_requirement" DECIMAL(65,30),
    "restrictions" TEXT,
    "allergies" TEXT,
    "texture_modification" TEXT,
    "fluid_restriction" BOOLEAN NOT NULL DEFAULT false,
    "special_instructions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "ordered_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nutrition_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_plans" (
    "id" TEXT NOT NULL,
    "order_id" TEXT,
    "patient_id" TEXT NOT NULL,
    "meal_date" TIMESTAMP(3) NOT NULL,
    "meal_type" TEXT,
    "menu_description" TEXT,
    "calories" INTEGER,
    "protein" DECIMAL(65,30),
    "carbohydrates" DECIMAL(65,30),
    "fat" DECIMAL(65,30),
    "fiber" DECIMAL(65,30),
    "served_at" TIMESTAMP(3),
    "consumed_percentage" INTEGER,
    "notes" TEXT,
    "prepared_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meal_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "therapy_types" (
    "id" TEXT NOT NULL,
    "type_code" TEXT NOT NULL,
    "type_name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "default_duration" INTEGER NOT NULL DEFAULT 60,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "therapy_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rehabilitation_cases" (
    "id" TEXT NOT NULL,
    "case_number" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "visit_id" TEXT,
    "referring_doctor_id" TEXT,
    "diagnosis" TEXT,
    "therapy_type" TEXT,
    "goals" TEXT,
    "estimated_sessions" INTEGER,
    "frequency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rehabilitation_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rehabilitation_sessions" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "therapist_id" TEXT,
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "scheduled_time" TEXT,
    "actual_start" TIMESTAMP(3),
    "actual_end" TIMESTAMP(3),
    "duration_minutes" INTEGER,
    "session_type" TEXT,
    "interventions" JSONB,
    "patient_response" TEXT,
    "functional_status" TEXT,
    "home_program" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rehabilitation_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mortuary_cases" (
    "id" TEXT NOT NULL,
    "case_number" TEXT NOT NULL,
    "patient_id" TEXT,
    "case_type" TEXT,
    "admission_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "time_of_death" TIMESTAMP(3),
    "place_of_death" TEXT,
    "cause_of_death_preliminary" TEXT,
    "manner_of_death" TEXT,
    "police_report_number" TEXT,
    "informant_name" TEXT,
    "informant_relation" TEXT,
    "informant_phone" TEXT,
    "refrigerator_number" TEXT,
    "release_date" TIMESTAMP(3),
    "released_to" TEXT,
    "status" TEXT NOT NULL DEFAULT 'admitted',
    "notes" TEXT,
    "admitted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mortuary_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autopsy_records" (
    "id" TEXT NOT NULL,
    "autopsy_number" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "autopsy_type" TEXT,
    "request_date" TIMESTAMP(3),
    "requested_by" TEXT,
    "pathologist_id" TEXT,
    "pathologist_name" TEXT,
    "assistant_names" TEXT,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "external_examination" TEXT,
    "internal_examination" TEXT,
    "organ_weights" JSONB,
    "histology_samples" JSONB,
    "toxicology_requested" BOOLEAN NOT NULL DEFAULT false,
    "cause_of_death" TEXT,
    "manner_of_death" TEXT,
    "summary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "autopsy_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "death_certificates" (
    "id" TEXT NOT NULL,
    "certificate_number" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "patient_id" TEXT,
    "death_date" TIMESTAMP(3) NOT NULL,
    "death_time" TEXT,
    "place_of_death" TEXT,
    "cause_of_death_1a" TEXT,
    "cause_of_death_1b" TEXT,
    "cause_of_death_1c" TEXT,
    "contributing_conditions" TEXT,
    "manner_of_death" TEXT,
    "certifying_doctor_id" TEXT,
    "certifying_doctor_name" TEXT,
    "certificate_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issued_to" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "death_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visum_reports" (
    "id" TEXT NOT NULL,
    "visum_number" TEXT NOT NULL,
    "patient_id" TEXT,
    "visum_type" TEXT,
    "police_request_number" TEXT,
    "police_request_date" TIMESTAMP(3),
    "requesting_unit" TEXT,
    "case_description" TEXT,
    "examination_date" TIMESTAMP(3),
    "physical_findings" TEXT,
    "injuries" JSONB,
    "conclusions" TEXT,
    "opinion" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "examining_doctor_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visum_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_trainees" (
    "id" TEXT NOT NULL,
    "trainee_code" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "trainee_type" TEXT,
    "institution" TEXT,
    "program" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "primary_supervisor_id" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_trainees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_rotations" (
    "id" TEXT NOT NULL,
    "trainee_id" TEXT NOT NULL,
    "department_id" TEXT,
    "supervisor_id" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "rotation_type" TEXT,
    "objectives" TEXT,
    "performance_score" DECIMAL(65,30),
    "evaluation_notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinical_rotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_activities" (
    "id" TEXT NOT NULL,
    "activity_code" TEXT NOT NULL,
    "activity_type" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "activity_date" TIMESTAMP(3),
    "start_time" TEXT,
    "end_time" TEXT,
    "location" TEXT,
    "department_id" TEXT,
    "speaker_names" TEXT,
    "max_participants" INTEGER,
    "registered_count" INTEGER NOT NULL DEFAULT 0,
    "skp_points" DECIMAL(65,30),
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "organizer_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_registrations" (
    "id" TEXT NOT NULL,
    "activity_id" TEXT NOT NULL,
    "trainee_id" TEXT,
    "employee_id" TEXT,
    "registration_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attendance_status" TEXT NOT NULL DEFAULT 'registered',
    "certificate_issued" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_projects" (
    "id" TEXT NOT NULL,
    "project_code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "principal_investigator" TEXT,
    "co_investigators" JSONB,
    "department_id" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "funding_source" TEXT,
    "budget" DECIMAL(65,30),
    "ethics_approval_number" TEXT,
    "ethics_approval_date" TIMESTAMP(3),
    "abstract" TEXT,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "publication_title" TEXT,
    "publication_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainings" (
    "id" TEXT NOT NULL,
    "training_code" TEXT,
    "training_name" TEXT NOT NULL,
    "training_type" TEXT,
    "provider" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "location" TEXT,
    "max_participants" INTEGER,
    "cost" DECIMAL(65,30),
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trainings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE INDEX "user_roles_user_id_idx" ON "user_roles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_key" ON "user_roles"("user_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "menu_access_role_menu_path_key" ON "menu_access"("role", "menu_path");

-- CreateIndex
CREATE UNIQUE INDEX "departments_department_code_key" ON "departments"("department_code");

-- CreateIndex
CREATE INDEX "rooms_department_id_idx" ON "rooms"("department_id");

-- CreateIndex
CREATE INDEX "beds_room_id_idx" ON "beds"("room_id");

-- CreateIndex
CREATE UNIQUE INDEX "beds_room_id_bed_number_key" ON "beds"("room_id", "bed_number");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_doctor_code_key" ON "doctors"("doctor_code");

-- CreateIndex
CREATE INDEX "doctors_department_id_idx" ON "doctors"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "patients_medical_record_number_key" ON "patients"("medical_record_number");

-- CreateIndex
CREATE UNIQUE INDEX "patients_nik_key" ON "patients"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "visits_visit_number_key" ON "visits"("visit_number");

-- CreateIndex
CREATE INDEX "visits_patient_id_idx" ON "visits"("patient_id");

-- CreateIndex
CREATE INDEX "visits_visit_date_idx" ON "visits"("visit_date");

-- CreateIndex
CREATE INDEX "visits_department_id_idx" ON "visits"("department_id");

-- CreateIndex
CREATE INDEX "visits_doctor_id_idx" ON "visits"("doctor_id");

-- CreateIndex
CREATE INDEX "visits_bed_id_idx" ON "visits"("bed_id");

-- CreateIndex
CREATE INDEX "medical_records_patient_id_idx" ON "medical_records"("patient_id");

-- CreateIndex
CREATE INDEX "medical_records_visit_id_idx" ON "medical_records"("visit_id");

-- CreateIndex
CREATE UNIQUE INDEX "medicines_medicine_code_key" ON "medicines"("medicine_code");

-- CreateIndex
CREATE INDEX "medicine_batches_medicine_id_idx" ON "medicine_batches"("medicine_id");

-- CreateIndex
CREATE UNIQUE INDEX "prescriptions_prescription_number_key" ON "prescriptions"("prescription_number");

-- CreateIndex
CREATE INDEX "prescriptions_patient_id_idx" ON "prescriptions"("patient_id");

-- CreateIndex
CREATE INDEX "prescriptions_visit_id_idx" ON "prescriptions"("visit_id");

-- CreateIndex
CREATE INDEX "prescription_items_prescription_id_idx" ON "prescription_items"("prescription_id");

-- CreateIndex
CREATE UNIQUE INDEX "lab_orders_order_number_key" ON "lab_orders"("order_number");

-- CreateIndex
CREATE INDEX "lab_orders_patient_id_idx" ON "lab_orders"("patient_id");

-- CreateIndex
CREATE INDEX "lab_orders_visit_id_idx" ON "lab_orders"("visit_id");

-- CreateIndex
CREATE INDEX "lab_results_order_id_idx" ON "lab_results"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "lab_results_order_id_test_code_key" ON "lab_results"("order_id", "test_code");

-- CreateIndex
CREATE UNIQUE INDEX "billings_invoice_number_key" ON "billings"("invoice_number");

-- CreateIndex
CREATE INDEX "billings_patient_id_idx" ON "billings"("patient_id");

-- CreateIndex
CREATE INDEX "billings_visit_id_idx" ON "billings"("visit_id");

-- CreateIndex
CREATE INDEX "billing_items_billing_id_idx" ON "billing_items"("billing_id");

-- CreateIndex
CREATE UNIQUE INDEX "bpjs_claims_claim_number_key" ON "bpjs_claims"("claim_number");

-- CreateIndex
CREATE INDEX "bpjs_claims_patient_id_idx" ON "bpjs_claims"("patient_id");

-- CreateIndex
CREATE INDEX "bpjs_claims_visit_id_idx" ON "bpjs_claims"("visit_id");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_supplier_code_key" ON "suppliers"("supplier_code");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_po_number_key" ON "purchase_orders"("po_number");

-- CreateIndex
CREATE INDEX "purchase_orders_supplier_id_idx" ON "purchase_orders"("supplier_id");

-- CreateIndex
CREATE INDEX "purchase_order_items_purchase_order_id_idx" ON "purchase_order_items"("purchase_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employee_code_key" ON "employees"("employee_code");

-- CreateIndex
CREATE INDEX "employees_user_id_idx" ON "employees"("user_id");

-- CreateIndex
CREATE INDEX "employees_department_id_idx" ON "employees"("department_id");

-- CreateIndex
CREATE INDEX "attendance_employee_id_idx" ON "attendance"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_employee_id_attendance_date_key" ON "attendance"("employee_id", "attendance_date");

-- CreateIndex
CREATE INDEX "leave_requests_employee_id_idx" ON "leave_requests"("employee_id");

-- CreateIndex
CREATE INDEX "payroll_employee_id_idx" ON "payroll"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_employee_id_period_month_period_year_key" ON "payroll"("employee_id", "period_month", "period_year");

-- CreateIndex
CREATE INDEX "appointments_patient_id_idx" ON "appointments"("patient_id");

-- CreateIndex
CREATE INDEX "appointments_doctor_id_idx" ON "appointments"("doctor_id");

-- CreateIndex
CREATE INDEX "appointments_appointment_date_idx" ON "appointments"("appointment_date");

-- CreateIndex
CREATE INDEX "queue_entries_department_id_idx" ON "queue_entries"("department_id");

-- CreateIndex
CREATE INDEX "queue_entries_visit_id_idx" ON "queue_entries"("visit_id");

-- CreateIndex
CREATE INDEX "audit_logs_table_name_created_at_idx" ON "audit_logs"("table_name", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_setting_key_key" ON "system_settings"("setting_key");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "chat_participants_room_id_idx" ON "chat_participants"("room_id");

-- CreateIndex
CREATE INDEX "chat_participants_user_id_idx" ON "chat_participants"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "chat_participants_room_id_user_id_key" ON "chat_participants"("room_id", "user_id");

-- CreateIndex
CREATE INDEX "chat_messages_room_id_idx" ON "chat_messages"("room_id");

-- CreateIndex
CREATE INDEX "chat_messages_sender_id_idx" ON "chat_messages"("sender_id");

-- CreateIndex
CREATE UNIQUE INDEX "radiology_orders_order_number_key" ON "radiology_orders"("order_number");

-- CreateIndex
CREATE INDEX "radiology_orders_patient_id_idx" ON "radiology_orders"("patient_id");

-- CreateIndex
CREATE INDEX "radiology_orders_visit_id_idx" ON "radiology_orders"("visit_id");

-- CreateIndex
CREATE UNIQUE INDEX "radiology_results_order_id_key" ON "radiology_results"("order_id");

-- CreateIndex
CREATE INDEX "radiology_results_order_id_idx" ON "radiology_results"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "surgeries_surgery_number_key" ON "surgeries"("surgery_number");

-- CreateIndex
CREATE INDEX "surgeries_patient_id_idx" ON "surgeries"("patient_id");

-- CreateIndex
CREATE INDEX "surgeries_visit_id_idx" ON "surgeries"("visit_id");

-- CreateIndex
CREATE INDEX "surgeries_scheduled_date_idx" ON "surgeries"("scheduled_date");

-- CreateIndex
CREATE UNIQUE INDEX "blood_inventory_bag_number_key" ON "blood_inventory"("bag_number");

-- CreateIndex
CREATE INDEX "blood_inventory_blood_type_idx" ON "blood_inventory"("blood_type");

-- CreateIndex
CREATE INDEX "blood_inventory_status_idx" ON "blood_inventory"("status");

-- CreateIndex
CREATE INDEX "blood_inventory_expiry_date_idx" ON "blood_inventory"("expiry_date");

-- CreateIndex
CREATE UNIQUE INDEX "transfusion_requests_request_number_key" ON "transfusion_requests"("request_number");

-- CreateIndex
CREATE INDEX "transfusion_requests_patient_id_idx" ON "transfusion_requests"("patient_id");

-- CreateIndex
CREATE INDEX "transfusion_requests_status_idx" ON "transfusion_requests"("status");

-- CreateIndex
CREATE INDEX "crossmatch_tests_patient_id_idx" ON "crossmatch_tests"("patient_id");

-- CreateIndex
CREATE INDEX "crossmatch_tests_blood_bag_id_idx" ON "crossmatch_tests"("blood_bag_id");

-- CreateIndex
CREATE INDEX "inpatient_admissions_patient_id_idx" ON "inpatient_admissions"("patient_id");

-- CreateIndex
CREATE INDEX "inpatient_admissions_visit_id_idx" ON "inpatient_admissions"("visit_id");

-- CreateIndex
CREATE INDEX "inpatient_admissions_status_idx" ON "inpatient_admissions"("status");

-- CreateIndex
CREATE INDEX "nursing_notes_admission_id_idx" ON "nursing_notes"("admission_id");

-- CreateIndex
CREATE INDEX "bed_transfers_admission_id_idx" ON "bed_transfers"("admission_id");

-- CreateIndex
CREATE INDEX "emergency_visits_patient_id_idx" ON "emergency_visits"("patient_id");

-- CreateIndex
CREATE INDEX "emergency_visits_visit_id_idx" ON "emergency_visits"("visit_id");

-- CreateIndex
CREATE INDEX "emergency_visits_status_idx" ON "emergency_visits"("status");

-- CreateIndex
CREATE INDEX "emergency_treatments_emergency_visit_id_idx" ON "emergency_treatments"("emergency_visit_id");

-- CreateIndex
CREATE INDEX "icu_admissions_patient_id_idx" ON "icu_admissions"("patient_id");

-- CreateIndex
CREATE INDEX "icu_admissions_status_idx" ON "icu_admissions"("status");

-- CreateIndex
CREATE INDEX "icu_vital_signs_admission_id_idx" ON "icu_vital_signs"("admission_id");

-- CreateIndex
CREATE INDEX "icu_vital_signs_recorded_at_idx" ON "icu_vital_signs"("recorded_at");

-- CreateIndex
CREATE INDEX "icu_intake_output_admission_id_idx" ON "icu_intake_output"("admission_id");

-- CreateIndex
CREATE INDEX "icu_ventilator_records_admission_id_idx" ON "icu_ventilator_records"("admission_id");

-- CreateIndex
CREATE UNIQUE INDEX "operating_rooms_room_code_key" ON "operating_rooms"("room_code");

-- CreateIndex
CREATE INDEX "operating_rooms_status_idx" ON "operating_rooms"("status");

-- CreateIndex
CREATE UNIQUE INDEX "anesthesia_records_surgery_id_key" ON "anesthesia_records"("surgery_id");

-- CreateIndex
CREATE INDEX "anesthesia_records_surgery_id_idx" ON "anesthesia_records"("surgery_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_item_code_key" ON "inventory_items"("item_code");

-- CreateIndex
CREATE INDEX "inventory_items_category_idx" ON "inventory_items"("category");

-- CreateIndex
CREATE INDEX "inventory_batches_item_id_idx" ON "inventory_batches"("item_id");

-- CreateIndex
CREATE INDEX "inventory_batches_expiry_date_idx" ON "inventory_batches"("expiry_date");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_requests_pr_number_key" ON "purchase_requests"("pr_number");

-- CreateIndex
CREATE INDEX "purchase_requests_status_idx" ON "purchase_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "chart_of_accounts_account_code_key" ON "chart_of_accounts"("account_code");

-- CreateIndex
CREATE INDEX "chart_of_accounts_account_type_idx" ON "chart_of_accounts"("account_type");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_entry_number_key" ON "journal_entries"("entry_number");

-- CreateIndex
CREATE INDEX "journal_entries_entry_date_idx" ON "journal_entries"("entry_date");

-- CreateIndex
CREATE INDEX "journal_entries_status_idx" ON "journal_entries"("status");

-- CreateIndex
CREATE INDEX "journal_entry_lines_entry_id_idx" ON "journal_entry_lines"("entry_id");

-- CreateIndex
CREATE INDEX "journal_entry_lines_account_id_idx" ON "journal_entry_lines"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "dialysis_machines_machine_code_key" ON "dialysis_machines"("machine_code");

-- CreateIndex
CREATE INDEX "dialysis_machines_status_idx" ON "dialysis_machines"("status");

-- CreateIndex
CREATE INDEX "dialysis_schedules_patient_id_idx" ON "dialysis_schedules"("patient_id");

-- CreateIndex
CREATE INDEX "dialysis_schedules_scheduled_date_idx" ON "dialysis_schedules"("scheduled_date");

-- CreateIndex
CREATE INDEX "dialysis_sessions_schedule_id_idx" ON "dialysis_sessions"("schedule_id");

-- CreateIndex
CREATE INDEX "dialysis_vitals_session_id_idx" ON "dialysis_vitals"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "corporate_clients_company_code_key" ON "corporate_clients"("company_code");

-- CreateIndex
CREATE UNIQUE INDEX "mcu_packages_package_code_key" ON "mcu_packages"("package_code");

-- CreateIndex
CREATE UNIQUE INDEX "mcu_registrations_registration_number_key" ON "mcu_registrations"("registration_number");

-- CreateIndex
CREATE INDEX "mcu_registrations_patient_id_idx" ON "mcu_registrations"("patient_id");

-- CreateIndex
CREATE INDEX "mcu_registrations_status_idx" ON "mcu_registrations"("status");

-- CreateIndex
CREATE INDEX "mcu_results_registration_id_idx" ON "mcu_results"("registration_id");

-- CreateIndex
CREATE INDEX "nutrition_assessments_patient_id_idx" ON "nutrition_assessments"("patient_id");

-- CreateIndex
CREATE INDEX "patient_allergies_patient_id_idx" ON "patient_allergies"("patient_id");

-- CreateIndex
CREATE INDEX "nutrition_orders_patient_id_idx" ON "nutrition_orders"("patient_id");

-- CreateIndex
CREATE INDEX "nutrition_orders_status_idx" ON "nutrition_orders"("status");

-- CreateIndex
CREATE INDEX "meal_plans_patient_id_idx" ON "meal_plans"("patient_id");

-- CreateIndex
CREATE INDEX "meal_plans_meal_date_idx" ON "meal_plans"("meal_date");

-- CreateIndex
CREATE UNIQUE INDEX "therapy_types_type_code_key" ON "therapy_types"("type_code");

-- CreateIndex
CREATE UNIQUE INDEX "rehabilitation_cases_case_number_key" ON "rehabilitation_cases"("case_number");

-- CreateIndex
CREATE INDEX "rehabilitation_cases_patient_id_idx" ON "rehabilitation_cases"("patient_id");

-- CreateIndex
CREATE INDEX "rehabilitation_sessions_case_id_idx" ON "rehabilitation_sessions"("case_id");

-- CreateIndex
CREATE INDEX "rehabilitation_sessions_scheduled_date_idx" ON "rehabilitation_sessions"("scheduled_date");

-- CreateIndex
CREATE UNIQUE INDEX "mortuary_cases_case_number_key" ON "mortuary_cases"("case_number");

-- CreateIndex
CREATE INDEX "mortuary_cases_status_idx" ON "mortuary_cases"("status");

-- CreateIndex
CREATE UNIQUE INDEX "autopsy_records_autopsy_number_key" ON "autopsy_records"("autopsy_number");

-- CreateIndex
CREATE INDEX "autopsy_records_case_id_idx" ON "autopsy_records"("case_id");

-- CreateIndex
CREATE UNIQUE INDEX "death_certificates_certificate_number_key" ON "death_certificates"("certificate_number");

-- CreateIndex
CREATE INDEX "death_certificates_case_id_idx" ON "death_certificates"("case_id");

-- CreateIndex
CREATE UNIQUE INDEX "visum_reports_visum_number_key" ON "visum_reports"("visum_number");

-- CreateIndex
CREATE INDEX "visum_reports_status_idx" ON "visum_reports"("status");

-- CreateIndex
CREATE UNIQUE INDEX "medical_trainees_trainee_code_key" ON "medical_trainees"("trainee_code");

-- CreateIndex
CREATE INDEX "clinical_rotations_trainee_id_idx" ON "clinical_rotations"("trainee_id");

-- CreateIndex
CREATE UNIQUE INDEX "academic_activities_activity_code_key" ON "academic_activities"("activity_code");

-- CreateIndex
CREATE INDEX "activity_registrations_activity_id_idx" ON "activity_registrations"("activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "research_projects_project_code_key" ON "research_projects"("project_code");

-- CreateIndex
CREATE UNIQUE INDEX "trainings_training_code_key" ON "trainings"("training_code");

___BEGIN___COMMAND_DONE_MARKER___0

-- ============================================
-- SIMRS ZEN - PostgreSQL Database Schema
-- Export dari Lovable Cloud untuk migrasi VPS
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE bed_status AS ENUM ('available', 'occupied', 'maintenance', 'reserved');
CREATE TYPE billing_status AS ENUM ('pending', 'partial', 'paid', 'cancelled', 'refunded');
CREATE TYPE payment_type AS ENUM ('cash', 'bpjs', 'insurance', 'corporate', 'credit_card', 'debit_card');
CREATE TYPE blood_type AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');
CREATE TYPE blood_product_type AS ENUM ('whole_blood', 'packed_red_cells', 'fresh_frozen_plasma', 'platelets', 'cryoprecipitate');
CREATE TYPE blood_status AS ENUM ('available', 'reserved', 'issued', 'expired', 'discarded', 'quarantine');
CREATE TYPE crossmatch_result AS ENUM ('compatible', 'incompatible', 'pending');
CREATE TYPE claim_status AS ENUM ('draft', 'submitted', 'verified', 'approved', 'rejected', 'paid');

-- ============================================
-- CORE TABLES
-- ============================================

-- Departments
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_code VARCHAR(20) UNIQUE NOT NULL,
    department_name VARCHAR(100) NOT NULL,
    department_type VARCHAR(50),
    head_doctor_id UUID,
    phone VARCHAR(20),
    location VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rooms
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_number VARCHAR(20) NOT NULL,
    room_name VARCHAR(100),
    department_id UUID REFERENCES departments(id),
    room_type VARCHAR(50),
    floor INTEGER,
    capacity INTEGER DEFAULT 1,
    rate_per_day DECIMAL(12,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Beds
CREATE TABLE beds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bed_number VARCHAR(20) NOT NULL,
    room_id UUID REFERENCES rooms(id) NOT NULL,
    status bed_status DEFAULT 'available',
    current_patient_id UUID,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patients
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medical_record_number VARCHAR(20) UNIQUE NOT NULL,
    nik VARCHAR(16) UNIQUE,
    bpjs_number VARCHAR(20),
    full_name VARCHAR(100) NOT NULL,
    birth_date DATE,
    birth_place VARCHAR(100),
    gender VARCHAR(10),
    blood_type blood_type,
    religion VARCHAR(20),
    marital_status VARCHAR(20),
    education VARCHAR(50),
    occupation VARCHAR(100),
    address TEXT,
    rt VARCHAR(5),
    rw VARCHAR(5),
    kelurahan VARCHAR(100),
    kecamatan VARCHAR(100),
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(10),
    phone VARCHAR(20),
    mobile_phone VARCHAR(20),
    email VARCHAR(100),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relation VARCHAR(50),
    allergy_notes TEXT,
    chronic_conditions TEXT,
    is_active BOOLEAN DEFAULT true,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Doctors
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID,
    user_id UUID,
    doctor_code VARCHAR(20) UNIQUE NOT NULL,
    sip_number VARCHAR(50),
    str_number VARCHAR(50),
    full_name VARCHAR(100),
    specialization VARCHAR(100),
    department_id UUID REFERENCES departments(id),
    consultation_fee DECIMAL(12,2),
    is_active BOOLEAN DEFAULT true,
    schedule JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    employee_code VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    nik VARCHAR(16),
    birth_date DATE,
    gender VARCHAR(10),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    department_id UUID REFERENCES departments(id),
    position VARCHAR(100),
    employment_type VARCHAR(50),
    join_date DATE,
    resign_date DATE,
    salary DECIMAL(12,2),
    bank_name VARCHAR(50),
    bank_account VARCHAR(30),
    is_active BOOLEAN DEFAULT true,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Profiles (untuk autentikasi)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url TEXT,
    password_hash VARCHAR(255), -- Untuk Node.js auth
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Roles
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID,
    UNIQUE(user_id, role)
);

-- ============================================
-- VISITS & MEDICAL RECORDS
-- ============================================

-- Visits
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_number VARCHAR(20) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id) NOT NULL,
    visit_date TIMESTAMPTZ DEFAULT NOW(),
    visit_type VARCHAR(50) NOT NULL, -- outpatient, inpatient, emergency
    department_id UUID REFERENCES departments(id),
    doctor_id UUID REFERENCES doctors(id),
    bed_id UUID REFERENCES beds(id),
    admission_date TIMESTAMPTZ,
    discharge_date TIMESTAMPTZ,
    chief_complaint TEXT,
    diagnosis TEXT,
    icd10_code VARCHAR(20),
    treatment_plan TEXT,
    discharge_summary TEXT,
    status VARCHAR(20) DEFAULT 'active',
    payment_type payment_type,
    bpjs_sep_number VARCHAR(50),
    insurance_policy_number VARCHAR(50),
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medical Records
CREATE TABLE medical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) NOT NULL,
    visit_id UUID REFERENCES visits(id),
    record_date TIMESTAMPTZ DEFAULT NOW(),
    record_type VARCHAR(50),
    subjective TEXT,
    objective TEXT,
    assessment TEXT,
    plan TEXT,
    vital_signs JSONB,
    physical_exam JSONB,
    doctor_id UUID REFERENCES doctors(id),
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prescriptions
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_number VARCHAR(20) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id) NOT NULL,
    visit_id UUID REFERENCES visits(id),
    doctor_id UUID REFERENCES doctors(id),
    prescription_date TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prescription Items
CREATE TABLE prescription_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID REFERENCES prescriptions(id) NOT NULL,
    medicine_id UUID,
    medicine_name VARCHAR(200) NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    duration VARCHAR(50),
    quantity INTEGER,
    unit VARCHAR(20),
    instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PHARMACY & INVENTORY
-- ============================================

-- Medicines
CREATE TABLE medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medicine_code VARCHAR(20) UNIQUE NOT NULL,
    medicine_name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200),
    category VARCHAR(100),
    form VARCHAR(50), -- tablet, capsule, syrup, injection
    strength VARCHAR(50),
    unit VARCHAR(20),
    manufacturer VARCHAR(100),
    selling_price DECIMAL(12,2),
    purchase_price DECIMAL(12,2),
    min_stock INTEGER DEFAULT 10,
    max_stock INTEGER DEFAULT 1000,
    is_active BOOLEAN DEFAULT true,
    requires_prescription BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medicine Batches
CREATE TABLE medicine_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medicine_id UUID REFERENCES medicines(id) NOT NULL,
    batch_number VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    expiry_date DATE NOT NULL,
    purchase_date DATE,
    purchase_price DECIMAL(12,2),
    supplier_id UUID,
    location VARCHAR(50),
    status VARCHAR(20) DEFAULT 'available',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_code VARCHAR(20) UNIQUE NOT NULL,
    supplier_name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    npwp VARCHAR(30),
    payment_terms VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LABORATORY
-- ============================================

-- Lab Orders
CREATE TABLE lab_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(20) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id) NOT NULL,
    visit_id UUID REFERENCES visits(id),
    doctor_id UUID REFERENCES doctors(id),
    order_date TIMESTAMPTZ DEFAULT NOW(),
    priority VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lab Results
CREATE TABLE lab_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES lab_orders(id) NOT NULL,
    test_code VARCHAR(20) NOT NULL,
    test_name VARCHAR(100) NOT NULL,
    result_value VARCHAR(100),
    unit VARCHAR(20),
    reference_range VARCHAR(50),
    flag VARCHAR(10), -- normal, high, low, critical
    performed_by UUID,
    verified_by UUID,
    result_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RADIOLOGY
-- ============================================

-- Radiology Orders
CREATE TABLE radiology_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(20) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id) NOT NULL,
    visit_id UUID REFERENCES visits(id),
    doctor_id UUID REFERENCES doctors(id),
    modality VARCHAR(50), -- X-Ray, CT, MRI, USG
    body_part VARCHAR(100),
    clinical_info TEXT,
    order_date TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'normal',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Radiology Results
CREATE TABLE radiology_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES radiology_orders(id) NOT NULL,
    findings TEXT,
    impression TEXT,
    recommendation TEXT,
    radiologist_id UUID REFERENCES doctors(id),
    report_date TIMESTAMPTZ,
    image_urls TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BILLING
-- ============================================

-- Billings
CREATE TABLE billings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(20) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id) NOT NULL,
    visit_id UUID REFERENCES visits(id) NOT NULL,
    billing_date TIMESTAMPTZ DEFAULT NOW(),
    payment_type payment_type NOT NULL,
    subtotal DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    tax DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    status billing_status DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_date TIMESTAMPTZ,
    paid_by VARCHAR(100),
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Billing Items
CREATE TABLE billing_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    billing_id UUID REFERENCES billings(id) NOT NULL,
    item_type VARCHAR(50) NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BPJS INTEGRATION
-- ============================================

-- BPJS Claims
CREATE TABLE bpjs_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_number VARCHAR(20) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id) NOT NULL,
    visit_id UUID REFERENCES visits(id) NOT NULL,
    sep_number VARCHAR(50) NOT NULL,
    claim_date TIMESTAMPTZ DEFAULT NOW(),
    claim_amount DECIMAL(12,2) NOT NULL,
    approved_amount DECIMAL(12,2),
    status claim_status DEFAULT 'draft',
    inacbg_code VARCHAR(20),
    inacbg_description TEXT,
    submission_date TIMESTAMPTZ,
    verification_date TIMESTAMPTZ,
    rejection_reason TEXT,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- APPOINTMENTS
-- ============================================

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) NOT NULL,
    doctor_id UUID REFERENCES doctors(id) NOT NULL,
    department_id UUID REFERENCES departments(id),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    end_time TIME,
    appointment_type VARCHAR(50) DEFAULT 'consultation',
    status VARCHAR(20) DEFAULT 'scheduled',
    chief_complaint TEXT,
    notes TEXT,
    booking_source VARCHAR(50),
    reminder_sent BOOLEAN DEFAULT false,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BLOOD BANK
-- ============================================

-- Blood Inventory
CREATE TABLE blood_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bag_number VARCHAR(50) UNIQUE NOT NULL,
    blood_type blood_type NOT NULL,
    product_type blood_product_type NOT NULL,
    volume INTEGER,
    collection_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    donor_id UUID,
    status blood_status DEFAULT 'available',
    storage_location VARCHAR(50),
    screening_date DATE,
    hiv_status VARCHAR(20),
    hbsag_status VARCHAR(20),
    hcv_status VARCHAR(20),
    vdrl_status VARCHAR(20),
    malaria_status VARCHAR(20),
    screened_by UUID,
    reserved_for_patient_id UUID REFERENCES patients(id),
    issued_date TIMESTAMPTZ,
    issued_by UUID,
    issued_to_department VARCHAR(100),
    source_blood_bank VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transfusion Requests
CREATE TABLE transfusion_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_number VARCHAR(20) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id) NOT NULL,
    visit_id UUID REFERENCES visits(id),
    requesting_doctor_id UUID REFERENCES doctors(id),
    blood_type blood_type NOT NULL,
    product_type blood_product_type NOT NULL,
    units_requested INTEGER NOT NULL,
    units_issued INTEGER DEFAULT 0,
    urgency VARCHAR(20) DEFAULT 'routine',
    indication TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    request_date TIMESTAMPTZ DEFAULT NOW(),
    approved_by UUID,
    approved_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crossmatch Tests
CREATE TABLE crossmatch_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES transfusion_requests(id),
    patient_id UUID REFERENCES patients(id) NOT NULL,
    blood_bag_id UUID REFERENCES blood_inventory(id) NOT NULL,
    test_date TIMESTAMPTZ DEFAULT NOW(),
    major_crossmatch crossmatch_result,
    minor_crossmatch crossmatch_result,
    is_compatible BOOLEAN,
    antibody_screen VARCHAR(50),
    dat_result VARCHAR(50),
    iat_result VARCHAR(50),
    tested_by UUID,
    valid_until TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SURGERY
-- ============================================

CREATE TABLE surgeries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    surgery_number VARCHAR(20) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id) NOT NULL,
    visit_id UUID REFERENCES visits(id),
    operating_room_id UUID,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    actual_start_time TIMESTAMPTZ,
    actual_end_time TIMESTAMPTZ,
    procedure_name VARCHAR(200) NOT NULL,
    procedure_code VARCHAR(20),
    surgery_type VARCHAR(50),
    surgeon_id UUID REFERENCES doctors(id),
    assistant_surgeon_ids UUID[],
    anesthesiologist_id UUID REFERENCES doctors(id),
    anesthesia_type VARCHAR(50),
    pre_diagnosis TEXT,
    post_diagnosis TEXT,
    operative_findings TEXT,
    procedure_notes TEXT,
    complications TEXT,
    blood_loss INTEGER,
    status VARCHAR(20) DEFAULT 'scheduled',
    priority VARCHAR(20) DEFAULT 'elective',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT LOGS
-- ============================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    action VARCHAR(20) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SYSTEM SETTINGS
-- ============================================

CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(20),
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    type VARCHAR(50),
    reference_type VARCHAR(50),
    reference_id UUID,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CHAT
-- ============================================

CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_name VARCHAR(100),
    room_type VARCHAR(20) DEFAULT 'direct',
    department_id UUID REFERENCES departments(id),
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES chat_rooms(id) NOT NULL,
    user_id UUID NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_read_at TIMESTAMPTZ,
    UNIQUE(room_id, user_id)
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES chat_rooms(id) NOT NULL,
    sender_id UUID NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    file_url TEXT,
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MENU ACCESS
-- ============================================

CREATE TABLE menu_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role VARCHAR(50) NOT NULL,
    menu_path VARCHAR(200) NOT NULL,
    can_view BOOLEAN DEFAULT false,
    can_create BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role, menu_path)
);

-- ============================================
-- QUEUE MANAGEMENT
-- ============================================

CREATE TABLE queue_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID REFERENCES visits(id) NOT NULL,
    department_id UUID REFERENCES departments(id) NOT NULL,
    queue_number INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'waiting',
    called_at TIMESTAMPTZ,
    served_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PURCHASE ORDERS
-- ============================================

CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_number VARCHAR(20) UNIQUE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id) NOT NULL,
    order_date TIMESTAMPTZ DEFAULT NOW(),
    expected_delivery TIMESTAMPTZ,
    total_amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',
    submitted_at TIMESTAMPTZ,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    received_by UUID,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID REFERENCES purchase_orders(id) NOT NULL,
    item_id UUID NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    received_quantity INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HR - ATTENDANCE, LEAVE, PAYROLL
-- ============================================

CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) NOT NULL,
    attendance_date DATE NOT NULL,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'present',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, attendance_date)
);

CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) NOT NULL,
    leave_type VARCHAR(50) NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    approval_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) NOT NULL,
    period_month INTEGER NOT NULL,
    period_year INTEGER NOT NULL,
    base_salary DECIMAL(12,2) NOT NULL,
    allowances DECIMAL(12,2) DEFAULT 0,
    deductions DECIMAL(12,2) DEFAULT 0,
    overtime DECIMAL(12,2) DEFAULT 0,
    net_salary DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, period_month, period_year)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_patients_mrn ON patients(medical_record_number);
CREATE INDEX idx_patients_nik ON patients(nik);
CREATE INDEX idx_patients_bpjs ON patients(bpjs_number);
CREATE INDEX idx_visits_patient ON visits(patient_id);
CREATE INDEX idx_visits_date ON visits(visit_date);
CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_lab_orders_patient ON lab_orders(patient_id);
CREATE INDEX idx_billings_patient ON billings(patient_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_chat_messages_room ON chat_messages(room_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Generate MRN
CREATE OR REPLACE FUNCTION generate_mrn()
RETURNS TEXT AS $$
DECLARE
    new_mrn TEXT;
    year_prefix TEXT;
    seq_num INTEGER;
BEGIN
    year_prefix := TO_CHAR(NOW(), 'YY');
    SELECT COALESCE(MAX(CAST(SUBSTRING(medical_record_number FROM 3) AS INTEGER)), 0) + 1
    INTO seq_num
    FROM patients
    WHERE medical_record_number LIKE year_prefix || '%';
    
    new_mrn := year_prefix || LPAD(seq_num::TEXT, 6, '0');
    RETURN new_mrn;
END;
$$ LANGUAGE plpgsql;

-- Generate Invoice Number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    new_inv TEXT;
    date_prefix TEXT;
    seq_num INTEGER;
BEGIN
    date_prefix := 'INV' || TO_CHAR(NOW(), 'YYYYMMDD');
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 12) AS INTEGER)), 0) + 1
    INTO seq_num
    FROM billings
    WHERE invoice_number LIKE date_prefix || '%';
    
    new_inv := date_prefix || LPAD(seq_num::TEXT, 4, '0');
    RETURN new_inv;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON visits FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_medicines_updated_at BEFORE UPDATE ON medicines FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_billings_updated_at BEFORE UPDATE ON billings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- INITIAL DATA
-- ============================================

-- System Settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('hospital_name', 'SIMRS ZEN Hospital', 'string', 'Nama Rumah Sakit'),
('hospital_code', 'ZEN001', 'string', 'Kode Rumah Sakit'),
('hospital_address', 'Jl. Kesehatan No. 1', 'string', 'Alamat RS'),
('hospital_phone', '021-12345678', 'string', 'Telepon RS'),
('allow_registration', 'false', 'boolean', 'Izinkan registrasi user baru'),
('bpjs_enabled', 'true', 'boolean', 'Aktifkan integrasi BPJS'),
('satusehat_enabled', 'true', 'boolean', 'Aktifkan integrasi SATU SEHAT');

-- ============================================
-- DEFAULT ADMIN USER
-- Email: multimediazen@gmail.com
-- Password: admin123  (bcrypt hash, rounds=12)
-- Run `npm run db:seed` from backend/ to seed via Node.js instead
-- ============================================
DO $$
DECLARE
  v_user_id UUID := gen_random_uuid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'multimediazen@gmail.com') THEN
    INSERT INTO profiles (id, user_id, email, full_name, password_hash, is_active)
    VALUES (
      gen_random_uuid(),
      v_user_id,
      'multimediazen@gmail.com',
      'Administrator',
      '$2a$12$FuRUdKaUMpDfcE4arzCmWO9/LPttkcmijYWRfqUq2ienI1lxhieWG',
      true
    );
    INSERT INTO user_roles (id, user_id, role)
    VALUES (gen_random_uuid(), v_user_id, 'admin');
  END IF;
END $$;

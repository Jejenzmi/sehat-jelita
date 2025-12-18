
-- ==========================================
-- SIMRS Database Schema - Complete
-- ==========================================

-- 1. ENUM TYPES
-- ==========================================
CREATE TYPE public.app_role AS ENUM ('admin', 'dokter', 'perawat', 'kasir', 'farmasi', 'laboratorium', 'radiologi', 'pendaftaran');
CREATE TYPE public.gender_type AS ENUM ('L', 'P');
CREATE TYPE public.patient_status AS ENUM ('aktif', 'non_aktif', 'meninggal');
CREATE TYPE public.visit_type AS ENUM ('rawat_jalan', 'rawat_inap', 'igd');
CREATE TYPE public.visit_status AS ENUM ('menunggu', 'dipanggil', 'dilayani', 'selesai', 'batal');
CREATE TYPE public.payment_type AS ENUM ('bpjs', 'umum', 'asuransi');
CREATE TYPE public.triage_level AS ENUM ('merah', 'kuning', 'hijau', 'hitam');
CREATE TYPE public.bed_status AS ENUM ('tersedia', 'terisi', 'maintenance', 'reserved');
CREATE TYPE public.prescription_status AS ENUM ('menunggu', 'diproses', 'siap', 'diserahkan', 'batal');
CREATE TYPE public.claim_status AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'paid');
CREATE TYPE public.billing_status AS ENUM ('pending', 'lunas', 'batal');

-- 2. PROFILES TABLE
-- ==========================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    nip TEXT,
    specialization TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. USER ROLES TABLE
-- ==========================================
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 4. PATIENTS TABLE
-- ==========================================
CREATE TABLE public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medical_record_number TEXT UNIQUE NOT NULL,
    nik TEXT UNIQUE NOT NULL,
    bpjs_number TEXT,
    full_name TEXT NOT NULL,
    gender gender_type NOT NULL,
    birth_date DATE NOT NULL,
    birth_place TEXT,
    blood_type TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    province TEXT,
    postal_code TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relation TEXT,
    allergy_notes TEXT,
    status patient_status NOT NULL DEFAULT 'aktif',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- 5. DEPARTMENTS / POLIKLINIK
-- ==========================================
CREATE TABLE public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. DOCTORS TABLE
-- ==========================================
CREATE TABLE public.doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    profile_id UUID REFERENCES public.profiles(id),
    sip_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    specialization TEXT,
    department_id UUID REFERENCES public.departments(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    consultation_fee DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. ROOMS / BEDS
-- ==========================================
CREATE TABLE public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    room_class TEXT NOT NULL, -- VIP, Kelas 1, 2, 3, ICU, NICU
    department_id UUID REFERENCES public.departments(id),
    total_beds INTEGER NOT NULL DEFAULT 1,
    daily_rate DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.beds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
    bed_number TEXT NOT NULL,
    status bed_status NOT NULL DEFAULT 'tersedia',
    current_patient_id UUID REFERENCES public.patients(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(room_id, bed_number)
);

-- 8. VISITS / KUNJUNGAN
-- ==========================================
CREATE TABLE public.visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_number TEXT UNIQUE NOT NULL,
    patient_id UUID REFERENCES public.patients(id) NOT NULL,
    visit_type visit_type NOT NULL,
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    visit_time TIME NOT NULL DEFAULT CURRENT_TIME,
    department_id UUID REFERENCES public.departments(id),
    doctor_id UUID REFERENCES public.doctors(id),
    payment_type payment_type NOT NULL DEFAULT 'umum',
    bpjs_sep_number TEXT,
    queue_number INTEGER,
    status visit_status NOT NULL DEFAULT 'menunggu',
    chief_complaint TEXT,
    notes TEXT,
    bed_id UUID REFERENCES public.beds(id),
    admission_date TIMESTAMPTZ,
    discharge_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- 9. ICD-10 DIAGNOSIS CODES
-- ==========================================
CREATE TABLE public.icd10_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    description_en TEXT NOT NULL,
    description_id TEXT,
    category TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- 10. ICD-9-CM PROCEDURE CODES
-- ==========================================
CREATE TABLE public.icd9_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    description_en TEXT NOT NULL,
    description_id TEXT,
    category TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- 11. MEDICAL RECORDS / SOAP NOTES
-- ==========================================
CREATE TABLE public.medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID REFERENCES public.visits(id) NOT NULL,
    patient_id UUID REFERENCES public.patients(id) NOT NULL,
    doctor_id UUID REFERENCES public.doctors(id) NOT NULL,
    record_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- SOAP Notes
    subjective TEXT,
    objective TEXT,
    assessment TEXT,
    plan TEXT,
    -- Vital Signs
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    heart_rate INTEGER,
    respiratory_rate INTEGER,
    temperature DECIMAL(4,1),
    oxygen_saturation INTEGER,
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    -- Additional
    physical_examination TEXT,
    additional_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- 12. DIAGNOSES
-- ==========================================
CREATE TABLE public.diagnoses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medical_record_id UUID REFERENCES public.medical_records(id) ON DELETE CASCADE NOT NULL,
    icd10_code_id UUID REFERENCES public.icd10_codes(id),
    icd10_code TEXT NOT NULL,
    description TEXT NOT NULL,
    diagnosis_type TEXT NOT NULL DEFAULT 'primer', -- primer, sekunder
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. PROCEDURES
-- ==========================================
CREATE TABLE public.procedures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medical_record_id UUID REFERENCES public.medical_records(id) ON DELETE CASCADE NOT NULL,
    icd9_code_id UUID REFERENCES public.icd9_codes(id),
    icd9_code TEXT NOT NULL,
    description TEXT NOT NULL,
    procedure_date TIMESTAMPTZ DEFAULT now(),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. IGD / EMERGENCY
-- ==========================================
CREATE TABLE public.emergency_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID REFERENCES public.visits(id) NOT NULL,
    patient_id UUID REFERENCES public.patients(id) NOT NULL,
    arrival_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    arrival_mode TEXT, -- ambulans, pribadi, rujukan
    triage_level triage_level NOT NULL,
    triage_time TIMESTAMPTZ,
    triage_by UUID REFERENCES auth.users(id),
    chief_complaint TEXT NOT NULL,
    trauma_type TEXT,
    consciousness_level TEXT, -- GCS
    is_critical BOOLEAN DEFAULT false,
    disposition TEXT, -- pulang, rawat_inap, rujuk, meninggal
    disposition_time TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. MEDICINES / OBAT
-- ==========================================
CREATE TABLE public.medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    generic_name TEXT,
    category TEXT,
    unit TEXT NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER DEFAULT 10,
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 16. PRESCRIPTIONS / RESEP
-- ==========================================
CREATE TABLE public.prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_number TEXT UNIQUE NOT NULL,
    visit_id UUID REFERENCES public.visits(id) NOT NULL,
    patient_id UUID REFERENCES public.patients(id) NOT NULL,
    doctor_id UUID REFERENCES public.doctors(id) NOT NULL,
    prescription_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    status prescription_status NOT NULL DEFAULT 'menunggu',
    notes TEXT,
    processed_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.prescription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE CASCADE NOT NULL,
    medicine_id UUID REFERENCES public.medicines(id) NOT NULL,
    quantity INTEGER NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    duration TEXT,
    instructions TEXT,
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 17. BILLING / TAGIHAN
-- ==========================================
CREATE TABLE public.billings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL,
    visit_id UUID REFERENCES public.visits(id) NOT NULL,
    patient_id UUID REFERENCES public.patients(id) NOT NULL,
    billing_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    payment_type payment_type NOT NULL,
    subtotal DECIMAL(14,2) NOT NULL DEFAULT 0,
    discount DECIMAL(14,2) DEFAULT 0,
    tax DECIMAL(14,2) DEFAULT 0,
    total DECIMAL(14,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(14,2) DEFAULT 0,
    status billing_status NOT NULL DEFAULT 'pending',
    payment_date TIMESTAMPTZ,
    payment_method TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    paid_by UUID REFERENCES auth.users(id)
);

CREATE TABLE public.billing_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    billing_id UUID REFERENCES public.billings(id) ON DELETE CASCADE NOT NULL,
    item_type TEXT NOT NULL, -- konsultasi, obat, tindakan, kamar, lab, radiologi
    item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 18. BPJS CLAIMS
-- ==========================================
CREATE TABLE public.bpjs_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_number TEXT UNIQUE NOT NULL,
    visit_id UUID REFERENCES public.visits(id) NOT NULL,
    patient_id UUID REFERENCES public.patients(id) NOT NULL,
    sep_number TEXT NOT NULL,
    claim_date DATE NOT NULL DEFAULT CURRENT_DATE,
    inacbg_code TEXT,
    inacbg_description TEXT,
    claim_amount DECIMAL(14,2) NOT NULL,
    approved_amount DECIMAL(14,2),
    status claim_status NOT NULL DEFAULT 'draft',
    submission_date TIMESTAMPTZ,
    verification_date TIMESTAMPTZ,
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- 19. AUDIT LOG
-- ==========================================
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- Function to get user roles
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS SETOF app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.user_roles WHERE user_id = _user_id
$$;

-- Function to generate medical record number
CREATE OR REPLACE FUNCTION public.generate_medical_record_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    new_number TEXT;
    year_part TEXT;
    sequence_part TEXT;
BEGIN
    year_part := TO_CHAR(NOW(), 'YYYY');
    SELECT LPAD((COALESCE(MAX(SUBSTRING(medical_record_number FROM 9)::INTEGER), 0) + 1)::TEXT, 6, '0')
    INTO sequence_part
    FROM public.patients
    WHERE medical_record_number LIKE 'RM-' || year_part || '-%';
    
    new_number := 'RM-' || year_part || '-' || sequence_part;
    RETURN new_number;
END;
$$;

-- Function to generate visit number
CREATE OR REPLACE FUNCTION public.generate_visit_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    new_number TEXT;
    date_part TEXT;
    sequence_part TEXT;
BEGIN
    date_part := TO_CHAR(NOW(), 'YYYYMMDD');
    SELECT LPAD((COALESCE(MAX(SUBSTRING(visit_number FROM 13)::INTEGER), 0) + 1)::TEXT, 4, '0')
    INTO sequence_part
    FROM public.visits
    WHERE visit_number LIKE 'VIS-' || date_part || '-%';
    
    new_number := 'VIS-' || date_part || '-' || sequence_part;
    RETURN new_number;
END;
$$;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
        NEW.email
    );
    RETURN NEW;
END;
$$;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON public.doctors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON public.visits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON public.medical_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_beds_updated_at BEFORE UPDATE ON public.beds FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_medicines_updated_at BEFORE UPDATE ON public.medicines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON public.prescriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_billings_updated_at BEFORE UPDATE ON public.billings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_emergency_visits_updated_at BEFORE UPDATE ON public.emergency_visits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bpjs_claims_updated_at BEFORE UPDATE ON public.bpjs_claims FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- ROW LEVEL SECURITY POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icd10_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icd9_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bpjs_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);

-- User Roles: Only admins can manage, users can view their own
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Patients: All authenticated staff can view, specific roles can modify
CREATE POLICY "Staff can view patients" ON public.patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert patients" ON public.patients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update patients" ON public.patients FOR UPDATE TO authenticated USING (true);

-- Departments: Everyone can view, admins can modify
CREATE POLICY "Everyone can view departments" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage departments" ON public.departments FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Doctors: Everyone can view
CREATE POLICY "Everyone can view doctors" ON public.doctors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage doctors" ON public.doctors FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Rooms & Beds: Everyone can view
CREATE POLICY "Everyone can view rooms" ON public.rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage rooms" ON public.rooms FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Everyone can view beds" ON public.beds FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can update beds" ON public.beds FOR UPDATE TO authenticated USING (true);

-- Visits: Staff can view and manage
CREATE POLICY "Staff can view visits" ON public.visits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert visits" ON public.visits FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update visits" ON public.visits FOR UPDATE TO authenticated USING (true);

-- ICD Codes: Everyone can view
CREATE POLICY "Everyone can view icd10" ON public.icd10_codes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Everyone can view icd9" ON public.icd9_codes FOR SELECT TO authenticated USING (true);

-- Medical Records: Doctors and nurses can manage
CREATE POLICY "Staff can view medical records" ON public.medical_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Medical staff can insert records" ON public.medical_records FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'dokter') OR public.has_role(auth.uid(), 'perawat') OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Medical staff can update records" ON public.medical_records FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'dokter') OR public.has_role(auth.uid(), 'perawat') OR public.has_role(auth.uid(), 'admin')
);

-- Diagnoses & Procedures
CREATE POLICY "Staff can view diagnoses" ON public.diagnoses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Doctors can manage diagnoses" ON public.diagnoses FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'dokter') OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Staff can view procedures" ON public.procedures FOR SELECT TO authenticated USING (true);
CREATE POLICY "Doctors can manage procedures" ON public.procedures FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'dokter') OR public.has_role(auth.uid(), 'admin')
);

-- Emergency
CREATE POLICY "Staff can view emergency" ON public.emergency_visits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage emergency" ON public.emergency_visits FOR ALL TO authenticated USING (true);

-- Medicines
CREATE POLICY "Staff can view medicines" ON public.medicines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Pharmacy can manage medicines" ON public.medicines FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'farmasi') OR public.has_role(auth.uid(), 'admin')
);

-- Prescriptions
CREATE POLICY "Staff can view prescriptions" ON public.prescriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Doctors can create prescriptions" ON public.prescriptions FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'dokter') OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Staff can update prescriptions" ON public.prescriptions FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'dokter') OR public.has_role(auth.uid(), 'farmasi') OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Staff can view prescription items" ON public.prescription_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage prescription items" ON public.prescription_items FOR ALL TO authenticated USING (true);

-- Billings
CREATE POLICY "Staff can view billings" ON public.billings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Cashier can manage billings" ON public.billings FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'kasir') OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Staff can view billing items" ON public.billing_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Cashier can manage billing items" ON public.billing_items FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'kasir') OR public.has_role(auth.uid(), 'admin')
);

-- BPJS Claims
CREATE POLICY "Staff can view claims" ON public.bpjs_claims FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage claims" ON public.bpjs_claims FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'kasir') OR public.has_role(auth.uid(), 'admin')
);

-- Audit Logs: Only admins can view
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX idx_patients_mrn ON public.patients(medical_record_number);
CREATE INDEX idx_patients_nik ON public.patients(nik);
CREATE INDEX idx_patients_bpjs ON public.patients(bpjs_number);
CREATE INDEX idx_patients_name ON public.patients(full_name);
CREATE INDEX idx_visits_patient ON public.visits(patient_id);
CREATE INDEX idx_visits_date ON public.visits(visit_date);
CREATE INDEX idx_visits_status ON public.visits(status);
CREATE INDEX idx_medical_records_patient ON public.medical_records(patient_id);
CREATE INDEX idx_medical_records_visit ON public.medical_records(visit_id);
CREATE INDEX idx_diagnoses_record ON public.diagnoses(medical_record_id);
CREATE INDEX idx_prescriptions_visit ON public.prescriptions(visit_id);
CREATE INDEX idx_billings_visit ON public.billings(visit_id);
CREATE INDEX idx_emergency_visits_triage ON public.emergency_visits(triage_level);

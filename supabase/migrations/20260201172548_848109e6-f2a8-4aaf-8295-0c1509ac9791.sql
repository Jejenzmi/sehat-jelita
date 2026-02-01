
-- =====================================================
-- MODUL GIZI/DIETARY
-- =====================================================

-- Enum for diet types
CREATE TYPE public.diet_category AS ENUM ('regular', 'diabetes', 'renal', 'cardiac', 'low_sodium', 'high_protein', 'soft', 'liquid', 'enteral', 'parenteral', 'other');

-- Diet types master table
CREATE TABLE public.diet_types (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category diet_category NOT NULL DEFAULT 'regular',
    description TEXT,
    calories_target INTEGER,
    protein_target NUMERIC(5,1),
    carbs_target NUMERIC(5,1),
    fat_target NUMERIC(5,1),
    restrictions TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Patient food allergies
CREATE TABLE public.food_allergies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    allergen TEXT NOT NULL,
    severity TEXT DEFAULT 'moderate', -- mild, moderate, severe
    reaction_description TEXT,
    diagnosed_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Patient diet assignments
CREATE TABLE public.patient_diets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES public.visits(id),
    diet_type_id UUID REFERENCES public.diet_types(id),
    diet_name TEXT NOT NULL,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    special_instructions TEXT,
    texture_modification TEXT, -- normal, minced, pureed
    fluid_restriction INTEGER, -- ml per day
    prescribed_by UUID,
    status TEXT DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Meal plans
CREATE TABLE public.meal_plans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_diet_id UUID REFERENCES public.patient_diets(id) ON DELETE CASCADE,
    meal_date DATE NOT NULL,
    meal_type TEXT NOT NULL, -- breakfast, lunch, dinner, snack
    menu_items JSONB, -- array of food items
    calories_planned INTEGER,
    protein_planned NUMERIC(5,1),
    carbs_planned NUMERIC(5,1),
    fat_planned NUMERIC(5,1),
    prepared_by TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Meal records (actual consumption)
CREATE TABLE public.meal_records (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    meal_plan_id UUID REFERENCES public.meal_plans(id),
    patient_id UUID NOT NULL REFERENCES public.patients(id),
    meal_date DATE NOT NULL,
    meal_type TEXT NOT NULL,
    items_consumed JSONB,
    calories_consumed INTEGER,
    consumption_percentage INTEGER, -- 0-100
    appetite_level TEXT, -- poor, fair, good, excellent
    assistance_needed BOOLEAN DEFAULT false,
    recorded_by TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- MODUL REHABILITASI MEDIK
-- =====================================================

-- Enum for therapy types
CREATE TYPE public.therapy_type AS ENUM ('physiotherapy', 'occupational_therapy', 'speech_therapy', 'hydrotherapy', 'other');

-- Therapy types master
CREATE TABLE public.therapy_types (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type therapy_type NOT NULL,
    description TEXT,
    duration_minutes INTEGER DEFAULT 30,
    unit_price NUMERIC(12,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Rehabilitation assessments
CREATE TABLE public.rehabilitation_assessments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES public.visits(id),
    assessment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    therapist_id UUID REFERENCES public.doctors(id),
    therapist_name TEXT,
    diagnosis TEXT,
    functional_status TEXT,
    pain_scale INTEGER, -- 0-10
    mobility_score INTEGER,
    strength_assessment JSONB,
    range_of_motion JSONB,
    balance_assessment TEXT,
    adl_score INTEGER, -- Activities of Daily Living
    goals TEXT[],
    treatment_plan TEXT,
    estimated_sessions INTEGER,
    precautions TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Therapy sessions
CREATE TABLE public.therapy_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_number TEXT NOT NULL,
    assessment_id UUID REFERENCES public.rehabilitation_assessments(id),
    patient_id UUID NOT NULL REFERENCES public.patients(id),
    therapy_type_id UUID REFERENCES public.therapy_types(id),
    therapy_name TEXT NOT NULL,
    therapist_id UUID REFERENCES public.doctors(id),
    therapist_name TEXT,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    status TEXT DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled, no_show
    treatment_given TEXT,
    patient_response TEXT,
    pain_before INTEGER,
    pain_after INTEGER,
    progress_notes TEXT,
    home_exercise_program TEXT,
    next_session_plan TEXT,
    billing_status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Rehabilitation goals tracking
CREATE TABLE public.rehabilitation_goals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    assessment_id UUID REFERENCES public.rehabilitation_assessments(id) ON DELETE CASCADE,
    goal_type TEXT, -- short_term, long_term
    goal_description TEXT NOT NULL,
    target_date DATE,
    baseline_measurement TEXT,
    current_measurement TEXT,
    target_measurement TEXT,
    status TEXT DEFAULT 'in_progress', -- in_progress, achieved, modified, discontinued
    achievement_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- MODUL MEDICAL CHECK UP (MCU)
-- =====================================================

-- Corporate clients
CREATE TABLE public.corporate_clients (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name TEXT NOT NULL,
    company_code TEXT UNIQUE,
    address TEXT,
    phone TEXT,
    email TEXT,
    pic_name TEXT, -- Person in charge
    pic_phone TEXT,
    contract_start DATE,
    contract_end DATE,
    discount_percentage NUMERIC(5,2) DEFAULT 0,
    payment_terms TEXT,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- MCU packages
CREATE TABLE public.mcu_packages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    package_code TEXT NOT NULL UNIQUE,
    package_name TEXT NOT NULL,
    description TEXT,
    category TEXT, -- basic, standard, executive, comprehensive
    target_gender TEXT, -- male, female, all
    target_age_min INTEGER,
    target_age_max INTEGER,
    base_price NUMERIC(12,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- MCU package items
CREATE TABLE public.mcu_package_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    package_id UUID NOT NULL REFERENCES public.mcu_packages(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    item_type TEXT, -- lab, radiology, consultation, procedure
    item_code TEXT,
    description TEXT,
    is_mandatory BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- MCU registrations
CREATE TABLE public.mcu_registrations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    registration_number TEXT NOT NULL UNIQUE,
    patient_id UUID NOT NULL REFERENCES public.patients(id),
    package_id UUID NOT NULL REFERENCES public.mcu_packages(id),
    corporate_client_id UUID REFERENCES public.corporate_clients(id),
    registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
    examination_date DATE,
    payment_type TEXT, -- personal, corporate, insurance
    total_price NUMERIC(12,2),
    discount NUMERIC(12,2) DEFAULT 0,
    final_price NUMERIC(12,2),
    status TEXT DEFAULT 'registered', -- registered, in_progress, completed, cancelled
    registered_by UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- MCU results
CREATE TABLE public.mcu_results (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    registration_id UUID NOT NULL REFERENCES public.mcu_registrations(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    item_type TEXT,
    result_value TEXT,
    result_unit TEXT,
    normal_range TEXT,
    interpretation TEXT, -- normal, abnormal, critical
    performed_by TEXT,
    performed_date TIMESTAMP WITH TIME ZONE,
    verified_by TEXT,
    verified_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- MCU summary reports
CREATE TABLE public.mcu_summary_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    registration_id UUID NOT NULL REFERENCES public.mcu_registrations(id) ON DELETE CASCADE,
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    doctor_id UUID REFERENCES public.doctors(id),
    doctor_name TEXT,
    overall_health_status TEXT, -- excellent, good, fair, poor
    bmi NUMERIC(4,1),
    blood_pressure_status TEXT,
    cardiovascular_status TEXT,
    metabolic_status TEXT,
    key_findings TEXT[],
    recommendations TEXT[],
    follow_up_needed BOOLEAN DEFAULT false,
    follow_up_notes TEXT,
    fitness_for_work TEXT, -- fit, fit_with_conditions, temporarily_unfit, unfit
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- MODUL FORENSIK & KAMAR JENAZAH
-- =====================================================

-- Enum for case types
CREATE TYPE public.mortuary_case_type AS ENUM ('natural', 'accident', 'suicide', 'homicide', 'undetermined', 'pending');

-- Mortuary cases
CREATE TABLE public.mortuary_cases (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    case_number TEXT NOT NULL UNIQUE,
    deceased_name TEXT NOT NULL,
    deceased_id UUID REFERENCES public.patients(id),
    gender TEXT,
    age INTEGER,
    date_of_birth DATE,
    date_of_death TIMESTAMP WITH TIME ZONE,
    time_of_death_estimated BOOLEAN DEFAULT false,
    place_of_death TEXT,
    brought_from TEXT, -- ward, ED, external, DOA
    brought_by TEXT,
    admission_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    case_type mortuary_case_type DEFAULT 'pending',
    cause_of_death TEXT,
    manner_of_death TEXT,
    storage_location TEXT, -- refrigerator number
    body_condition TEXT,
    personal_belongings JSONB,
    family_contact_name TEXT,
    family_contact_phone TEXT,
    family_notified BOOLEAN DEFAULT false,
    notification_time TIMESTAMP WITH TIME ZONE,
    police_case BOOLEAN DEFAULT false,
    police_report_number TEXT,
    autopsy_required BOOLEAN DEFAULT false,
    release_authorized BOOLEAN DEFAULT false,
    release_date TIMESTAMP WITH TIME ZONE,
    released_to TEXT,
    released_by TEXT,
    status TEXT DEFAULT 'admitted', -- admitted, autopsy_pending, autopsy_complete, released
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Autopsy records
CREATE TABLE public.autopsy_records (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES public.mortuary_cases(id) ON DELETE CASCADE,
    autopsy_number TEXT NOT NULL UNIQUE,
    autopsy_date TIMESTAMP WITH TIME ZONE,
    autopsy_type TEXT, -- full, limited, external_only
    requested_by TEXT,
    request_date TIMESTAMP WITH TIME ZONE,
    pathologist_id UUID REFERENCES public.doctors(id),
    pathologist_name TEXT,
    assistant_names TEXT[],
    external_examination JSONB,
    internal_examination JSONB,
    organ_weights JSONB,
    microscopic_findings TEXT,
    toxicology_results TEXT,
    cause_of_death_primary TEXT,
    cause_of_death_secondary TEXT,
    contributing_factors TEXT[],
    manner_of_death TEXT,
    opinion TEXT,
    status TEXT DEFAULT 'pending', -- pending, in_progress, completed
    completed_date TIMESTAMP WITH TIME ZONE,
    report_finalized BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Visum et Repertum reports
CREATE TABLE public.visum_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    visum_number TEXT NOT NULL UNIQUE,
    patient_id UUID REFERENCES public.patients(id),
    case_id UUID REFERENCES public.mortuary_cases(id),
    visum_type TEXT NOT NULL, -- living, corpse
    request_number TEXT,
    requesting_authority TEXT,
    request_date TIMESTAMP WITH TIME ZONE,
    examination_date TIMESTAMP WITH TIME ZONE,
    examiner_id UUID REFERENCES public.doctors(id),
    examiner_name TEXT NOT NULL,
    pro_justitia TEXT, -- formal opening statement
    pendahuluan TEXT, -- introduction/background
    pemberitaan TEXT, -- findings/observations
    kesimpulan TEXT, -- conclusion
    victim_identity JSONB,
    injury_description JSONB,
    cause_of_injury TEXT,
    age_of_injury TEXT,
    weapon_type TEXT,
    status TEXT DEFAULT 'draft', -- draft, finalized, submitted
    finalized_date TIMESTAMP WITH TIME ZONE,
    submitted_to TEXT,
    submitted_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Death certificates
CREATE TABLE public.death_certificates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    certificate_number TEXT NOT NULL UNIQUE,
    case_id UUID REFERENCES public.mortuary_cases(id),
    patient_id UUID REFERENCES public.patients(id),
    deceased_name TEXT NOT NULL,
    gender TEXT,
    date_of_birth DATE,
    place_of_birth TEXT,
    date_of_death TIMESTAMP WITH TIME ZONE NOT NULL,
    place_of_death TEXT,
    address TEXT,
    occupation TEXT,
    marital_status TEXT,
    religion TEXT,
    nationality TEXT,
    nik TEXT,
    immediate_cause TEXT, -- Ia
    antecedent_cause TEXT, -- Ib
    underlying_cause TEXT, -- Ic
    contributing_conditions TEXT, -- II
    manner_of_death TEXT,
    autopsy_performed BOOLEAN DEFAULT false,
    certifying_doctor_id UUID REFERENCES public.doctors(id),
    certifying_doctor_name TEXT NOT NULL,
    certification_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    burial_permit_issued BOOLEAN DEFAULT false,
    burial_permit_number TEXT,
    status TEXT DEFAULT 'draft', -- draft, issued, cancelled
    issued_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Generate therapy session number
CREATE OR REPLACE FUNCTION public.generate_therapy_session_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_number TEXT;
    date_part TEXT;
    sequence_part TEXT;
BEGIN
    date_part := TO_CHAR(NOW(), 'YYYYMMDD');
    SELECT LPAD((COALESCE(MAX(SUBSTRING(session_number FROM 11)::INTEGER), 0) + 1)::TEXT, 4, '0')
    INTO sequence_part
    FROM public.therapy_sessions
    WHERE session_number LIKE 'RH-' || date_part || '-%';
    
    new_number := 'RH-' || date_part || '-' || sequence_part;
    RETURN new_number;
END;
$$;

-- Generate MCU registration number
CREATE OR REPLACE FUNCTION public.generate_mcu_registration_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_number TEXT;
    date_part TEXT;
    sequence_part TEXT;
BEGIN
    date_part := TO_CHAR(NOW(), 'YYYYMMDD');
    SELECT LPAD((COALESCE(MAX(SUBSTRING(registration_number FROM 12)::INTEGER), 0) + 1)::TEXT, 4, '0')
    INTO sequence_part
    FROM public.mcu_registrations
    WHERE registration_number LIKE 'MCU-' || date_part || '-%';
    
    new_number := 'MCU-' || date_part || '-' || sequence_part;
    RETURN new_number;
END;
$$;

-- Generate mortuary case number
CREATE OR REPLACE FUNCTION public.generate_mortuary_case_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_number TEXT;
    date_part TEXT;
    sequence_part TEXT;
BEGIN
    date_part := TO_CHAR(NOW(), 'YYYYMMDD');
    SELECT LPAD((COALESCE(MAX(SUBSTRING(case_number FROM 12)::INTEGER), 0) + 1)::TEXT, 4, '0')
    INTO sequence_part
    FROM public.mortuary_cases
    WHERE case_number LIKE 'MRT-' || date_part || '-%';
    
    new_number := 'MRT-' || date_part || '-' || sequence_part;
    RETURN new_number;
END;
$$;

-- Generate visum number
CREATE OR REPLACE FUNCTION public.generate_visum_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_number TEXT;
    date_part TEXT;
    sequence_part TEXT;
BEGIN
    date_part := TO_CHAR(NOW(), 'YYYYMMDD');
    SELECT LPAD((COALESCE(MAX(SUBSTRING(visum_number FROM 12)::INTEGER), 0) + 1)::TEXT, 4, '0')
    INTO sequence_part
    FROM public.visum_reports
    WHERE visum_number LIKE 'VER-' || date_part || '-%';
    
    new_number := 'VER-' || date_part || '-' || sequence_part;
    RETURN new_number;
END;
$$;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.diet_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_diets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapy_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rehabilitation_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rehabilitation_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcu_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcu_package_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcu_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcu_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcu_summary_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mortuary_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autopsy_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visum_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.death_certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated users
CREATE POLICY "Authenticated users can manage diet_types" ON public.diet_types FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage food_allergies" ON public.food_allergies FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage patient_diets" ON public.patient_diets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage meal_plans" ON public.meal_plans FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage meal_records" ON public.meal_records FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage therapy_types" ON public.therapy_types FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage rehabilitation_assessments" ON public.rehabilitation_assessments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage therapy_sessions" ON public.therapy_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage rehabilitation_goals" ON public.rehabilitation_goals FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage corporate_clients" ON public.corporate_clients FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage mcu_packages" ON public.mcu_packages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage mcu_package_items" ON public.mcu_package_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage mcu_registrations" ON public.mcu_registrations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage mcu_results" ON public.mcu_results FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage mcu_summary_reports" ON public.mcu_summary_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage mortuary_cases" ON public.mortuary_cases FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage autopsy_records" ON public.autopsy_records FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage visum_reports" ON public.visum_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage death_certificates" ON public.death_certificates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================
-- SEED DATA
-- =====================================================

-- Diet types
INSERT INTO public.diet_types (name, category, description, calories_target) VALUES
('Diet Biasa', 'regular', 'Diet normal tanpa pembatasan khusus', 2000),
('Diet DM', 'diabetes', 'Diet untuk pasien diabetes mellitus', 1800),
('Diet Rendah Garam', 'low_sodium', 'Diet rendah sodium untuk hipertensi', 1800),
('Diet TKTP', 'high_protein', 'Tinggi Kalori Tinggi Protein', 2500),
('Diet Ginjal', 'renal', 'Diet untuk pasien gagal ginjal', 1600),
('Diet Jantung', 'cardiac', 'Diet untuk pasien jantung', 1800),
('Diet Lunak', 'soft', 'Makanan lunak untuk gangguan menelan', 1800),
('Diet Cair', 'liquid', 'Diet cair penuh', 1500);

-- Therapy types
INSERT INTO public.therapy_types (name, type, description, duration_minutes, unit_price) VALUES
('Fisioterapi Umum', 'physiotherapy', 'Terapi fisik untuk pemulihan fungsi gerak', 30, 150000),
('Fisioterapi Stroke', 'physiotherapy', 'Terapi khusus pasien pasca stroke', 45, 200000),
('Terapi Okupasi', 'occupational_therapy', 'Terapi untuk aktivitas sehari-hari', 45, 175000),
('Terapi Wicara', 'speech_therapy', 'Terapi untuk gangguan bicara dan menelan', 30, 150000),
('Hidroterapi', 'hydrotherapy', 'Terapi dengan media air', 45, 250000);

-- MCU packages
INSERT INTO public.mcu_packages (package_code, package_name, description, category, base_price) VALUES
('MCU-BASIC', 'Paket Basic', 'Pemeriksaan kesehatan dasar', 'basic', 500000),
('MCU-STANDARD', 'Paket Standard', 'Pemeriksaan kesehatan standar', 'standard', 1500000),
('MCU-EXECUTIVE', 'Paket Executive', 'Pemeriksaan kesehatan lengkap eksekutif', 'executive', 3500000),
('MCU-COMPREHENSIVE', 'Paket Comprehensive', 'Pemeriksaan kesehatan menyeluruh', 'comprehensive', 7500000);

-- MCU package items for basic package
INSERT INTO public.mcu_package_items (package_id, item_name, item_type, is_mandatory, sort_order)
SELECT id, 'Pemeriksaan Fisik', 'consultation', true, 1 FROM public.mcu_packages WHERE package_code = 'MCU-BASIC'
UNION ALL
SELECT id, 'Darah Lengkap', 'lab', true, 2 FROM public.mcu_packages WHERE package_code = 'MCU-BASIC'
UNION ALL
SELECT id, 'Gula Darah Puasa', 'lab', true, 3 FROM public.mcu_packages WHERE package_code = 'MCU-BASIC'
UNION ALL
SELECT id, 'Urine Lengkap', 'lab', true, 4 FROM public.mcu_packages WHERE package_code = 'MCU-BASIC';


-- =============================================
-- ICU/NICU/PICU MODULE
-- =============================================

-- ICU Types
CREATE TYPE public.icu_type AS ENUM ('icu', 'nicu', 'picu', 'iccu', 'hcu');
CREATE TYPE public.icu_admission_status AS ENUM ('active', 'transferred', 'discharged', 'deceased');
CREATE TYPE public.ventilator_mode AS ENUM ('CMV', 'SIMV', 'PSV', 'CPAP', 'BiPAP', 'APRV', 'HFOV');

-- ICU Beds
CREATE TABLE public.icu_beds (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    bed_number TEXT NOT NULL,
    icu_type public.icu_type NOT NULL,
    is_available BOOLEAN DEFAULT true,
    has_ventilator BOOLEAN DEFAULT false,
    has_monitor BOOLEAN DEFAULT true,
    equipment_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ICU Admissions
CREATE TABLE public.icu_admissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    admission_number TEXT NOT NULL UNIQUE,
    patient_id UUID NOT NULL REFERENCES public.patients(id),
    visit_id UUID NOT NULL REFERENCES public.visits(id),
    icu_bed_id UUID REFERENCES public.icu_beds(id),
    icu_type public.icu_type NOT NULL,
    admission_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    admission_reason TEXT NOT NULL,
    admission_diagnosis TEXT,
    attending_doctor_id UUID REFERENCES public.doctors(id),
    status public.icu_admission_status DEFAULT 'active',
    apache_ii_score INTEGER,
    sofa_score INTEGER,
    discharge_date TIMESTAMP WITH TIME ZONE,
    discharge_reason TEXT,
    discharge_destination TEXT,
    total_icu_days INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ICU Monitoring (Vital Signs)
CREATE TABLE public.icu_monitoring (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    admission_id UUID NOT NULL REFERENCES public.icu_admissions(id) ON DELETE CASCADE,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    recorded_by UUID,
    heart_rate INTEGER,
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    map INTEGER, -- Mean Arterial Pressure
    temperature DECIMAL(4,1),
    respiratory_rate INTEGER,
    spo2 INTEGER,
    etco2 INTEGER,
    cvp DECIMAL(4,1), -- Central Venous Pressure
    cardiac_output DECIMAL(4,2),
    gcs_eye INTEGER,
    gcs_verbal INTEGER,
    gcs_motor INTEGER,
    gcs_total INTEGER,
    pupil_left TEXT,
    pupil_right TEXT,
    pain_score INTEGER,
    sedation_score INTEGER, -- RASS
    urine_output INTEGER, -- ml/hr
    intake_total INTEGER, -- ml
    output_total INTEGER, -- ml
    fluid_balance INTEGER,
    blood_glucose DECIMAL(5,1),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ventilator Settings
CREATE TABLE public.ventilator_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    admission_id UUID NOT NULL REFERENCES public.icu_admissions(id) ON DELETE CASCADE,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    recorded_by UUID,
    ventilator_mode public.ventilator_mode,
    fio2 INTEGER, -- %
    peep INTEGER, -- cmH2O
    tidal_volume INTEGER, -- ml
    respiratory_rate_set INTEGER,
    respiratory_rate_actual INTEGER,
    minute_volume DECIMAL(4,1),
    pip INTEGER, -- Peak Inspiratory Pressure
    plateau_pressure INTEGER,
    i_e_ratio TEXT, -- e.g., "1:2"
    pressure_support INTEGER,
    trigger_sensitivity DECIMAL(3,1),
    pao2 DECIMAL(5,1),
    paco2 DECIMAL(4,1),
    ph DECIMAL(4,2),
    hco3 DECIMAL(4,1),
    base_excess DECIMAL(4,1),
    p_f_ratio DECIMAL(5,1), -- PaO2/FiO2
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ICU Scores (APACHE, SOFA, etc.)
CREATE TABLE public.icu_scores (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    admission_id UUID NOT NULL REFERENCES public.icu_admissions(id) ON DELETE CASCADE,
    score_type TEXT NOT NULL, -- 'APACHE_II', 'SOFA', 'SAPS_II', 'APACHE_IV'
    score_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_score INTEGER NOT NULL,
    predicted_mortality DECIMAL(5,2),
    score_components JSONB,
    calculated_by UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ICU Nursing Chart
CREATE TABLE public.icu_nursing_charts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    admission_id UUID NOT NULL REFERENCES public.icu_admissions(id) ON DELETE CASCADE,
    chart_date DATE NOT NULL DEFAULT CURRENT_DATE,
    shift TEXT NOT NULL, -- 'pagi', 'siang', 'malam'
    nurse_id UUID,
    assessment TEXT,
    interventions JSONB,
    medications_given JSONB,
    lines_and_tubes JSONB, -- ETT, NGT, Foley, CVC, etc.
    wounds_care JSONB,
    patient_response TEXT,
    handover_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- HEMODIALYSIS MODULE
-- =============================================

CREATE TYPE public.dialysis_type AS ENUM ('hemodialysis', 'peritoneal', 'crrt', 'sled');
CREATE TYPE public.vascular_access_type AS ENUM ('av_fistula', 'av_graft', 'tunneled_catheter', 'non_tunneled_catheter', 'peritoneal_catheter');
CREATE TYPE public.session_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'missed');

-- Dialysis Machines
CREATE TABLE public.dialysis_machines (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    machine_number TEXT NOT NULL UNIQUE,
    brand TEXT,
    model TEXT,
    serial_number TEXT,
    is_available BOOLEAN DEFAULT true,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Vascular Access
CREATE TABLE public.vascular_access (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id),
    access_type public.vascular_access_type NOT NULL,
    location TEXT, -- e.g., "Left forearm", "Right IJV"
    creation_date DATE,
    maturation_date DATE,
    is_active BOOLEAN DEFAULT true,
    last_assessment_date DATE,
    assessment_notes TEXT,
    complications JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Dialysis Sessions
CREATE TABLE public.dialysis_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_number TEXT NOT NULL,
    patient_id UUID NOT NULL REFERENCES public.patients(id),
    visit_id UUID REFERENCES public.visits(id),
    machine_id UUID REFERENCES public.dialysis_machines(id),
    vascular_access_id UUID REFERENCES public.vascular_access(id),
    dialysis_type public.dialysis_type DEFAULT 'hemodialysis',
    session_date DATE NOT NULL,
    scheduled_time TIME,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    duration_planned INTEGER, -- minutes
    duration_actual INTEGER,
    status public.session_status DEFAULT 'scheduled',
    attending_doctor_id UUID REFERENCES public.doctors(id),
    nurse_id UUID,
    
    -- Pre-dialysis
    pre_weight DECIMAL(5,2), -- kg
    dry_weight DECIMAL(5,2),
    target_uf DECIMAL(6,0), -- ml
    pre_bp_systolic INTEGER,
    pre_bp_diastolic INTEGER,
    pre_heart_rate INTEGER,
    pre_temperature DECIMAL(4,1),
    
    -- Dialysis Parameters
    blood_flow_rate INTEGER, -- ml/min
    dialysate_flow_rate INTEGER,
    dialyzer_type TEXT,
    dialysate_composition TEXT,
    heparin_dose TEXT,
    sodium_profile TEXT,
    uf_profile TEXT,
    
    -- Post-dialysis
    post_weight DECIMAL(5,2),
    actual_uf DECIMAL(6,0),
    post_bp_systolic INTEGER,
    post_bp_diastolic INTEGER,
    post_heart_rate INTEGER,
    kt_v DECIMAL(4,2), -- Dialysis adequacy
    urr DECIMAL(5,2), -- Urea Reduction Ratio %
    
    -- Complications
    intradialytic_complications JSONB,
    interventions TEXT,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Dialysis Monitoring (Intradialytic)
CREATE TABLE public.dialysis_monitoring (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.dialysis_sessions(id) ON DELETE CASCADE,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    time_elapsed INTEGER, -- minutes from start
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    heart_rate INTEGER,
    temperature DECIMAL(4,1),
    blood_flow_rate INTEGER,
    venous_pressure INTEGER,
    arterial_pressure INTEGER,
    tmp INTEGER, -- Transmembrane Pressure
    uf_rate INTEGER, -- ml/hr
    uf_total INTEGER, -- ml
    conductivity DECIMAL(4,1),
    symptoms TEXT,
    interventions TEXT,
    recorded_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- BLOOD BANK MODULE
-- =============================================

CREATE TYPE public.blood_type AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');
CREATE TYPE public.blood_product_type AS ENUM ('whole_blood', 'prc', 'ffp', 'tc', 'cryoprecipitate', 'platelets');
CREATE TYPE public.blood_status AS ENUM ('available', 'reserved', 'crossmatched', 'issued', 'transfused', 'expired', 'discarded');
CREATE TYPE public.crossmatch_result AS ENUM ('compatible', 'incompatible', 'pending');
CREATE TYPE public.transfusion_reaction_severity AS ENUM ('mild', 'moderate', 'severe', 'fatal');

-- Blood Inventory
CREATE TABLE public.blood_inventory (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    bag_number TEXT NOT NULL UNIQUE,
    blood_type public.blood_type NOT NULL,
    product_type public.blood_product_type NOT NULL,
    volume INTEGER, -- ml
    collection_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    donor_id TEXT,
    source_blood_bank TEXT,
    status public.blood_status DEFAULT 'available',
    storage_location TEXT,
    
    -- Screening Results
    hiv_status TEXT DEFAULT 'negative',
    hbsag_status TEXT DEFAULT 'negative',
    hcv_status TEXT DEFAULT 'negative',
    vdrl_status TEXT DEFAULT 'negative',
    malaria_status TEXT DEFAULT 'negative',
    screening_date DATE,
    screened_by UUID,
    
    -- Usage Info
    reserved_for_patient_id UUID REFERENCES public.patients(id),
    issued_date TIMESTAMP WITH TIME ZONE,
    issued_by UUID,
    issued_to_department TEXT,
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Transfusion Requests
CREATE TABLE public.transfusion_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    request_number TEXT NOT NULL UNIQUE,
    patient_id UUID NOT NULL REFERENCES public.patients(id),
    visit_id UUID REFERENCES public.visits(id),
    requesting_doctor_id UUID REFERENCES public.doctors(id),
    department TEXT,
    request_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    urgency TEXT DEFAULT 'routine', -- routine, urgent, emergency
    
    -- Request Details
    product_type public.blood_product_type NOT NULL,
    units_requested INTEGER NOT NULL,
    indication TEXT NOT NULL,
    patient_blood_type public.blood_type,
    patient_hemoglobin DECIMAL(4,1),
    patient_platelet_count INTEGER,
    
    -- Status
    status TEXT DEFAULT 'pending', -- pending, processing, ready, issued, cancelled
    approved_by UUID,
    approved_date TIMESTAMP WITH TIME ZONE,
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crossmatch Tests
CREATE TABLE public.crossmatch_tests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID REFERENCES public.transfusion_requests(id),
    patient_id UUID NOT NULL REFERENCES public.patients(id),
    blood_bag_id UUID NOT NULL REFERENCES public.blood_inventory(id),
    test_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    tested_by UUID,
    
    -- Test Results
    major_crossmatch public.crossmatch_result DEFAULT 'pending',
    minor_crossmatch public.crossmatch_result DEFAULT 'pending',
    antibody_screen TEXT,
    dat_result TEXT, -- Direct Antiglobulin Test
    iat_result TEXT, -- Indirect Antiglobulin Test
    
    is_compatible BOOLEAN,
    valid_until TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Transfusion Records
CREATE TABLE public.transfusion_records (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID REFERENCES public.transfusion_requests(id),
    patient_id UUID NOT NULL REFERENCES public.patients(id),
    blood_bag_id UUID NOT NULL REFERENCES public.blood_inventory(id),
    crossmatch_id UUID REFERENCES public.crossmatch_tests(id),
    
    transfusion_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    administered_by UUID,
    supervised_by UUID,
    
    -- Pre-transfusion
    pre_vital_signs JSONB,
    patient_consent BOOLEAN DEFAULT false,
    blood_verified_by JSONB, -- Two person verification
    
    -- During Transfusion
    flow_rate TEXT,
    total_volume_transfused INTEGER,
    
    -- Post-transfusion
    post_vital_signs JSONB,
    patient_condition TEXT,
    
    -- Reaction
    had_reaction BOOLEAN DEFAULT false,
    reaction_id UUID,
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Transfusion Reactions
CREATE TABLE public.transfusion_reactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    transfusion_id UUID NOT NULL REFERENCES public.transfusion_records(id),
    patient_id UUID NOT NULL REFERENCES public.patients(id),
    blood_bag_id UUID NOT NULL REFERENCES public.blood_inventory(id),
    
    reaction_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    reaction_type TEXT NOT NULL, -- Febrile, Allergic, Hemolytic, TACO, TRALI, etc.
    severity public.transfusion_reaction_severity NOT NULL,
    
    symptoms JSONB,
    vital_signs_at_reaction JSONB,
    
    -- Actions Taken
    transfusion_stopped BOOLEAN DEFAULT true,
    interventions JSONB,
    medications_given JSONB,
    
    -- Investigation
    investigation_status TEXT DEFAULT 'pending',
    investigation_findings TEXT,
    blood_bank_notified BOOLEAN DEFAULT false,
    
    outcome TEXT,
    reported_by UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Generate ICU Admission Number
CREATE OR REPLACE FUNCTION public.generate_icu_admission_number()
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
    SELECT LPAD((COALESCE(MAX(SUBSTRING(admission_number FROM 12)::INTEGER), 0) + 1)::TEXT, 4, '0')
    INTO sequence_part
    FROM public.icu_admissions
    WHERE admission_number LIKE 'ICU-' || date_part || '-%';
    
    new_number := 'ICU-' || date_part || '-' || sequence_part;
    RETURN new_number;
END;
$$;

-- Generate Dialysis Session Number
CREATE OR REPLACE FUNCTION public.generate_dialysis_session_number()
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
    FROM public.dialysis_sessions
    WHERE session_number LIKE 'HD-' || date_part || '-%';
    
    new_number := 'HD-' || date_part || '-' || sequence_part;
    RETURN new_number;
END;
$$;

-- Generate Transfusion Request Number
CREATE OR REPLACE FUNCTION public.generate_transfusion_request_number()
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
    SELECT LPAD((COALESCE(MAX(SUBSTRING(request_number FROM 11)::INTEGER), 0) + 1)::TEXT, 4, '0')
    INTO sequence_part
    FROM public.transfusion_requests
    WHERE request_number LIKE 'TR-' || date_part || '-%';
    
    new_number := 'TR-' || date_part || '-' || sequence_part;
    RETURN new_number;
END;
$$;

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE public.icu_beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icu_admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icu_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventilator_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icu_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icu_nursing_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dialysis_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vascular_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dialysis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dialysis_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfusion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crossmatch_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfusion_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfusion_reactions ENABLE ROW LEVEL SECURITY;

-- ICU Policies
CREATE POLICY "Staff can view ICU beds" ON public.icu_beds FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage ICU beds" ON public.icu_beds FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Staff can view ICU admissions" ON public.icu_admissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage ICU admissions" ON public.icu_admissions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Staff can view ICU monitoring" ON public.icu_monitoring FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage ICU monitoring" ON public.icu_monitoring FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Staff can view ventilator settings" ON public.ventilator_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage ventilator settings" ON public.ventilator_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Staff can view ICU scores" ON public.icu_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage ICU scores" ON public.icu_scores FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Staff can view ICU nursing charts" ON public.icu_nursing_charts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage ICU nursing charts" ON public.icu_nursing_charts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Dialysis Policies
CREATE POLICY "Staff can view dialysis machines" ON public.dialysis_machines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage dialysis machines" ON public.dialysis_machines FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Staff can view vascular access" ON public.vascular_access FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage vascular access" ON public.vascular_access FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Staff can view dialysis sessions" ON public.dialysis_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage dialysis sessions" ON public.dialysis_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Staff can view dialysis monitoring" ON public.dialysis_monitoring FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage dialysis monitoring" ON public.dialysis_monitoring FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Blood Bank Policies
CREATE POLICY "Staff can view blood inventory" ON public.blood_inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage blood inventory" ON public.blood_inventory FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Staff can view transfusion requests" ON public.transfusion_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage transfusion requests" ON public.transfusion_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Staff can view crossmatch tests" ON public.crossmatch_tests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage crossmatch tests" ON public.crossmatch_tests FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Staff can view transfusion records" ON public.transfusion_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage transfusion records" ON public.transfusion_records FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Staff can view transfusion reactions" ON public.transfusion_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage transfusion reactions" ON public.transfusion_reactions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- SEED DATA
-- =============================================

-- ICU Beds
INSERT INTO public.icu_beds (bed_number, icu_type, has_ventilator, has_monitor) VALUES
('ICU-01', 'icu', true, true),
('ICU-02', 'icu', true, true),
('ICU-03', 'icu', true, true),
('ICU-04', 'icu', false, true),
('ICCU-01', 'iccu', true, true),
('ICCU-02', 'iccu', true, true),
('NICU-01', 'nicu', true, true),
('NICU-02', 'nicu', true, true),
('PICU-01', 'picu', true, true),
('PICU-02', 'picu', false, true),
('HCU-01', 'hcu', false, true),
('HCU-02', 'hcu', false, true);

-- Dialysis Machines
INSERT INTO public.dialysis_machines (machine_number, brand, model, is_available) VALUES
('HD-01', 'Fresenius', '5008S CorDiax', true),
('HD-02', 'Fresenius', '5008S CorDiax', true),
('HD-03', 'B. Braun', 'Dialog+', true),
('HD-04', 'B. Braun', 'Dialog+', true),
('HD-05', 'Nipro', 'Surdial X', true),
('HD-06', 'Nipro', 'Surdial X', true),
('CRRT-01', 'Fresenius', 'MultiFiltrate', true),
('CRRT-02', 'Baxter', 'PrisMax', true);

-- Blood Inventory (Sample)
INSERT INTO public.blood_inventory (bag_number, blood_type, product_type, volume, collection_date, expiry_date, source_blood_bank, storage_location) VALUES
('BB-20260201-001', 'O+', 'prc', 280, '2026-01-25', '2026-03-10', 'PMI Jakarta', 'Refrigerator A'),
('BB-20260201-002', 'O-', 'prc', 260, '2026-01-26', '2026-03-11', 'PMI Jakarta', 'Refrigerator A'),
('BB-20260201-003', 'A+', 'prc', 290, '2026-01-27', '2026-03-12', 'PMI Jakarta', 'Refrigerator A'),
('BB-20260201-004', 'B+', 'prc', 275, '2026-01-28', '2026-03-13', 'PMI Jakarta', 'Refrigerator B'),
('BB-20260201-005', 'AB+', 'ffp', 200, '2026-01-20', '2027-01-20', 'PMI Jakarta', 'Freezer A'),
('BB-20260201-006', 'O+', 'tc', 50, '2026-01-30', '2026-02-04', 'PMI Jakarta', 'Platelet Agitator'),
('BB-20260201-007', 'A-', 'prc', 270, '2026-01-29', '2026-03-14', 'PMI Jakarta', 'Refrigerator B'),
('BB-20260201-008', 'O+', 'whole_blood', 450, '2026-01-31', '2026-03-02', 'PMI Jakarta', 'Refrigerator A');

-- Update Triggers
CREATE TRIGGER update_icu_beds_updated_at BEFORE UPDATE ON public.icu_beds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_icu_admissions_updated_at BEFORE UPDATE ON public.icu_admissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_icu_nursing_charts_updated_at BEFORE UPDATE ON public.icu_nursing_charts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dialysis_machines_updated_at BEFORE UPDATE ON public.dialysis_machines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vascular_access_updated_at BEFORE UPDATE ON public.vascular_access FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dialysis_sessions_updated_at BEFORE UPDATE ON public.dialysis_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blood_inventory_updated_at BEFORE UPDATE ON public.blood_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transfusion_requests_updated_at BEFORE UPDATE ON public.transfusion_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transfusion_records_updated_at BEFORE UPDATE ON public.transfusion_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transfusion_reactions_updated_at BEFORE UPDATE ON public.transfusion_reactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

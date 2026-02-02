-- =====================================================
-- PELAPORAN KEMENKES (RL 1-6) & ASPAK INTEGRATION
-- Modul pelaporan statistik RS sesuai regulasi Kemenkes
-- =====================================================

-- Hospital Profile for RL 1 (Data Dasar RS)
CREATE TABLE public.hospital_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_code VARCHAR(20) NOT NULL,
    hospital_name VARCHAR(255) NOT NULL,
    hospital_type VARCHAR(50), -- A, B, C, D, or specific types
    ownership VARCHAR(100), -- Pemerintah, Swasta, BUMN, etc.
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(10),
    phone VARCHAR(50),
    fax VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    director_name VARCHAR(255),
    director_nip VARCHAR(50),
    operational_permit_number VARCHAR(100),
    operational_permit_date DATE,
    operational_permit_expiry DATE,
    accreditation_status VARCHAR(100),
    accreditation_date DATE,
    accreditation_expiry DATE,
    bed_count_total INTEGER DEFAULT 0,
    bed_count_vip INTEGER DEFAULT 0,
    bed_count_class1 INTEGER DEFAULT 0,
    bed_count_class2 INTEGER DEFAULT 0,
    bed_count_class3 INTEGER DEFAULT 0,
    bed_count_icu INTEGER DEFAULT 0,
    bed_count_nicu INTEGER DEFAULT 0,
    bed_count_picu INTEGER DEFAULT 0,
    services_available JSONB DEFAULT '[]',
    is_teaching_hospital BOOLEAN DEFAULT false,
    teaching_affiliation VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RL Report Submissions tracking
CREATE TABLE public.rl_report_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type VARCHAR(10) NOT NULL, -- RL1, RL2, RL3, RL4.1, RL4.2, RL4.3, RL5, RL6
    report_period_month INTEGER,
    report_period_year INTEGER NOT NULL,
    report_period_quarter INTEGER, -- For quarterly reports
    submission_date TIMESTAMPTZ,
    submitted_by UUID REFERENCES auth.users(id),
    status VARCHAR(50) DEFAULT 'draft', -- draft, submitted, verified, rejected
    verification_date TIMESTAMPTZ,
    verified_by VARCHAR(255),
    rejection_reason TEXT,
    report_data JSONB, -- Stores the actual report data
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RL 3.1 - Service Statistics (Rawat Jalan)
CREATE TABLE public.rl3_outpatient_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_month INTEGER NOT NULL,
    period_year INTEGER NOT NULL,
    department_id UUID REFERENCES departments(id),
    specialty_name VARCHAR(255),
    new_patients INTEGER DEFAULT 0,
    returning_patients INTEGER DEFAULT 0,
    total_visits INTEGER DEFAULT 0,
    bpjs_patients INTEGER DEFAULT 0,
    general_patients INTEGER DEFAULT 0,
    insurance_patients INTEGER DEFAULT 0,
    male_patients INTEGER DEFAULT 0,
    female_patients INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(period_month, period_year, department_id)
);

-- RL 3.2 - Inpatient Statistics
CREATE TABLE public.rl3_inpatient_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_month INTEGER NOT NULL,
    period_year INTEGER NOT NULL,
    ward_class VARCHAR(50), -- VIP, Kelas 1, Kelas 2, Kelas 3, ICU, etc.
    admissions INTEGER DEFAULT 0,
    discharges INTEGER DEFAULT 0,
    patient_days INTEGER DEFAULT 0,
    deaths_less_48h INTEGER DEFAULT 0,
    deaths_more_48h INTEGER DEFAULT 0,
    referrals_out INTEGER DEFAULT 0,
    bed_count INTEGER DEFAULT 0,
    bor DECIMAL(5,2) DEFAULT 0, -- Bed Occupancy Rate
    los DECIMAL(5,2) DEFAULT 0, -- Length of Stay
    toi DECIMAL(5,2) DEFAULT 0, -- Turn Over Interval
    bto DECIMAL(5,2) DEFAULT 0, -- Bed Turn Over
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(period_month, period_year, ward_class)
);

-- RL 4.1 - Top 10 Diseases (Morbidity)
CREATE TABLE public.rl4_morbidity_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_month INTEGER,
    period_year INTEGER NOT NULL,
    patient_type VARCHAR(50), -- rawat_jalan, rawat_inap, igd
    icd10_code VARCHAR(20),
    disease_name VARCHAR(255),
    case_count INTEGER DEFAULT 0,
    male_count INTEGER DEFAULT 0,
    female_count INTEGER DEFAULT 0,
    age_0_7d INTEGER DEFAULT 0,
    age_8_28d INTEGER DEFAULT 0,
    age_1_12m INTEGER DEFAULT 0,
    age_1_4y INTEGER DEFAULT 0,
    age_5_14y INTEGER DEFAULT 0,
    age_15_24y INTEGER DEFAULT 0,
    age_25_44y INTEGER DEFAULT 0,
    age_45_64y INTEGER DEFAULT 0,
    age_65_plus INTEGER DEFAULT 0,
    death_count INTEGER DEFAULT 0,
    ranking INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RL 4.2 - Mortality Statistics
CREATE TABLE public.rl4_mortality_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_month INTEGER,
    period_year INTEGER NOT NULL,
    icd10_code VARCHAR(20),
    cause_of_death VARCHAR(255),
    death_count INTEGER DEFAULT 0,
    male_count INTEGER DEFAULT 0,
    female_count INTEGER DEFAULT 0,
    age_0_7d INTEGER DEFAULT 0,
    age_8_28d INTEGER DEFAULT 0,
    age_1_12m INTEGER DEFAULT 0,
    age_1_4y INTEGER DEFAULT 0,
    age_5_14y INTEGER DEFAULT 0,
    age_15_24y INTEGER DEFAULT 0,
    age_25_44y INTEGER DEFAULT 0,
    age_45_64y INTEGER DEFAULT 0,
    age_65_plus INTEGER DEFAULT 0,
    deaths_less_48h INTEGER DEFAULT 0,
    deaths_more_48h INTEGER DEFAULT 0,
    ranking INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RL 5 - Visitor Statistics by Region
CREATE TABLE public.rl5_visitor_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_month INTEGER NOT NULL,
    period_year INTEGER NOT NULL,
    patient_type VARCHAR(50), -- rawat_jalan, rawat_inap
    origin_province VARCHAR(100),
    origin_city VARCHAR(100),
    visit_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(period_month, period_year, patient_type, origin_province, origin_city)
);

-- RL 6 - Hospital Performance Indicators
CREATE TABLE public.rl6_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_month INTEGER NOT NULL,
    period_year INTEGER NOT NULL,
    -- Bed Indicators
    total_beds INTEGER DEFAULT 0,
    bor DECIMAL(5,2) DEFAULT 0, -- Bed Occupancy Rate (%)
    alos DECIMAL(5,2) DEFAULT 0, -- Average Length of Stay (days)
    toi DECIMAL(5,2) DEFAULT 0, -- Turn Over Interval (days)
    bto DECIMAL(5,2) DEFAULT 0, -- Bed Turn Over (times)
    -- Mortality Indicators
    ndr DECIMAL(5,2) DEFAULT 0, -- Net Death Rate (%)
    gdr DECIMAL(5,2) DEFAULT 0, -- Gross Death Rate (%)
    -- Service Indicators
    total_outpatient_visits INTEGER DEFAULT 0,
    total_inpatient_admissions INTEGER DEFAULT 0,
    total_igd_visits INTEGER DEFAULT 0,
    total_surgeries INTEGER DEFAULT 0,
    total_deliveries INTEGER DEFAULT 0,
    -- Lab & Radiology
    total_lab_tests INTEGER DEFAULT 0,
    total_radiology_exams INTEGER DEFAULT 0,
    -- Financial (optional)
    total_revenue DECIMAL(18,2) DEFAULT 0,
    -- Calculated
    calculated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(period_month, period_year)
);

-- =====================================================
-- ASPAK (Aplikasi Sarana Prasarana Kesehatan)
-- Manajemen aset dan peralatan medis
-- =====================================================

-- Medical Equipment Registry
CREATE TABLE public.medical_equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_code VARCHAR(50) UNIQUE NOT NULL,
    equipment_name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    category VARCHAR(100), -- Diagnostik, Terapi, Life Support, Lab, etc.
    subcategory VARCHAR(100),
    risk_class VARCHAR(50), -- Kelas A, B, C (based on Permenkes)
    department_id UUID REFERENCES departments(id),
    location VARCHAR(255),
    purchase_date DATE,
    purchase_price DECIMAL(18,2),
    vendor_id UUID REFERENCES vendors(id),
    warranty_expiry DATE,
    expected_lifespan_years INTEGER,
    status VARCHAR(50) DEFAULT 'operational', -- operational, maintenance, broken, disposed
    condition VARCHAR(50) DEFAULT 'good', -- excellent, good, fair, poor
    aspak_code VARCHAR(100), -- Code from national ASPAK system
    aspak_sync_status VARCHAR(50) DEFAULT 'pending', -- pending, synced, error
    aspak_last_sync TIMESTAMPTZ,
    calibration_required BOOLEAN DEFAULT false,
    calibration_interval_months INTEGER,
    last_calibration_date DATE,
    next_calibration_date DATE,
    maintenance_interval_months INTEGER,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    manual_document_url TEXT,
    photo_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Equipment Calibration Records
CREATE TABLE public.equipment_calibrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID REFERENCES medical_equipment(id) ON DELETE CASCADE,
    calibration_number VARCHAR(50),
    calibration_date DATE NOT NULL,
    calibration_result VARCHAR(50), -- passed, failed, conditional
    calibrator_name VARCHAR(255),
    calibrator_institution VARCHAR(255),
    calibrator_accreditation VARCHAR(100),
    certificate_number VARCHAR(100),
    certificate_expiry DATE,
    certificate_url TEXT,
    deviation_found TEXT,
    corrective_action TEXT,
    next_calibration_date DATE,
    cost DECIMAL(12,2),
    notes TEXT,
    performed_by UUID REFERENCES employees(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Equipment Maintenance Records
CREATE TABLE public.equipment_maintenance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID REFERENCES medical_equipment(id) ON DELETE CASCADE,
    maintenance_number VARCHAR(50),
    maintenance_type VARCHAR(50), -- preventive, corrective, emergency
    maintenance_date DATE NOT NULL,
    description TEXT,
    findings TEXT,
    actions_taken TEXT,
    parts_replaced JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'completed', -- scheduled, in_progress, completed, cancelled
    technician_name VARCHAR(255),
    technician_institution VARCHAR(255), -- Internal or external vendor
    downtime_hours DECIMAL(6,2),
    cost DECIMAL(12,2),
    next_maintenance_date DATE,
    notes TEXT,
    performed_by UUID REFERENCES employees(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ASPAK Sync Logs
CREATE TABLE public.aspak_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_type VARCHAR(50), -- full, incremental, equipment, facility
    sync_direction VARCHAR(20), -- upload, download
    sync_status VARCHAR(50), -- pending, in_progress, completed, failed
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    total_records INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    error_details JSONB,
    initiated_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Equipment Categories Master Data
CREATE TABLE public.equipment_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_code VARCHAR(20) UNIQUE NOT NULL,
    category_name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES equipment_categories(id),
    risk_class VARCHAR(50),
    calibration_required BOOLEAN DEFAULT false,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hospital_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rl_report_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rl3_outpatient_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rl3_inpatient_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rl4_morbidity_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rl4_mortality_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rl5_visitor_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rl6_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_calibrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aspak_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated users
CREATE POLICY "Authenticated users can view hospital_profile" ON public.hospital_profile FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage hospital_profile" ON public.hospital_profile FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view rl_report_submissions" ON public.rl_report_submissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage rl_report_submissions" ON public.rl_report_submissions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view rl3_outpatient_stats" ON public.rl3_outpatient_stats FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage rl3_outpatient_stats" ON public.rl3_outpatient_stats FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view rl3_inpatient_stats" ON public.rl3_inpatient_stats FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage rl3_inpatient_stats" ON public.rl3_inpatient_stats FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view rl4_morbidity_stats" ON public.rl4_morbidity_stats FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage rl4_morbidity_stats" ON public.rl4_morbidity_stats FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view rl4_mortality_stats" ON public.rl4_mortality_stats FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage rl4_mortality_stats" ON public.rl4_mortality_stats FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view rl5_visitor_stats" ON public.rl5_visitor_stats FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage rl5_visitor_stats" ON public.rl5_visitor_stats FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view rl6_indicators" ON public.rl6_indicators FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage rl6_indicators" ON public.rl6_indicators FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view medical_equipment" ON public.medical_equipment FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage medical_equipment" ON public.medical_equipment FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view equipment_calibrations" ON public.equipment_calibrations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage equipment_calibrations" ON public.equipment_calibrations FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view equipment_maintenance" ON public.equipment_maintenance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage equipment_maintenance" ON public.equipment_maintenance FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view aspak_sync_logs" ON public.aspak_sync_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage aspak_sync_logs" ON public.aspak_sync_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view equipment_categories" ON public.equipment_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage equipment_categories" ON public.equipment_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Function to calculate RL6 indicators
CREATE OR REPLACE FUNCTION public.calculate_rl6_indicators(p_month INTEGER, p_year INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_total_beds INTEGER;
    v_patient_days INTEGER;
    v_admissions INTEGER;
    v_discharges INTEGER;
    v_deaths_less_48h INTEGER;
    v_deaths_more_48h INTEGER;
    v_days_in_month INTEGER;
    v_bor DECIMAL(5,2);
    v_alos DECIMAL(5,2);
    v_toi DECIMAL(5,2);
    v_bto DECIMAL(5,2);
    v_ndr DECIMAL(5,2);
    v_gdr DECIMAL(5,2);
BEGIN
    -- Get days in month
    v_days_in_month := EXTRACT(DAY FROM (DATE_TRUNC('month', MAKE_DATE(p_year, p_month, 1)) + INTERVAL '1 month - 1 day'));
    
    -- Get bed count
    SELECT COUNT(*) INTO v_total_beds FROM beds WHERE status != 'maintenance';
    
    -- Get inpatient statistics from rl3_inpatient_stats or calculate from visits
    SELECT 
        COALESCE(SUM(patient_days), 0),
        COALESCE(SUM(admissions), 0),
        COALESCE(SUM(discharges), 0),
        COALESCE(SUM(deaths_less_48h), 0),
        COALESCE(SUM(deaths_more_48h), 0)
    INTO v_patient_days, v_admissions, v_discharges, v_deaths_less_48h, v_deaths_more_48h
    FROM rl3_inpatient_stats
    WHERE period_month = p_month AND period_year = p_year;
    
    -- Calculate indicators
    IF v_total_beds > 0 AND v_days_in_month > 0 THEN
        v_bor := (v_patient_days::DECIMAL / (v_total_beds * v_days_in_month)) * 100;
    ELSE
        v_bor := 0;
    END IF;
    
    IF v_discharges > 0 THEN
        v_alos := v_patient_days::DECIMAL / v_discharges;
        v_bto := v_discharges::DECIMAL / NULLIF(v_total_beds, 0);
        v_ndr := (v_deaths_more_48h::DECIMAL / v_discharges) * 100;
        v_gdr := ((v_deaths_less_48h + v_deaths_more_48h)::DECIMAL / v_discharges) * 100;
    ELSE
        v_alos := 0;
        v_bto := 0;
        v_ndr := 0;
        v_gdr := 0;
    END IF;
    
    IF v_bto > 0 THEN
        v_toi := (v_total_beds * v_days_in_month - v_patient_days)::DECIMAL / v_discharges;
    ELSE
        v_toi := 0;
    END IF;
    
    -- Upsert RL6 indicators
    INSERT INTO rl6_indicators (
        period_month, period_year, total_beds, bor, alos, toi, bto, ndr, gdr, calculated_at
    ) VALUES (
        p_month, p_year, v_total_beds, v_bor, v_alos, v_toi, v_bto, v_ndr, v_gdr, now()
    )
    ON CONFLICT (period_month, period_year) 
    DO UPDATE SET
        total_beds = EXCLUDED.total_beds,
        bor = EXCLUDED.bor,
        alos = EXCLUDED.alos,
        toi = EXCLUDED.toi,
        bto = EXCLUDED.bto,
        ndr = EXCLUDED.ndr,
        gdr = EXCLUDED.gdr,
        calculated_at = now(),
        updated_at = now();
END;
$$;

-- Seed equipment categories
INSERT INTO public.equipment_categories (category_code, category_name, risk_class, calibration_required, description) VALUES
('DIAG', 'Diagnostik', 'B', true, 'Peralatan untuk diagnosis penyakit'),
('THER', 'Terapi', 'C', true, 'Peralatan untuk terapi/pengobatan'),
('LIFE', 'Life Support', 'C', true, 'Peralatan pendukung kehidupan'),
('LAB', 'Laboratorium', 'B', true, 'Peralatan laboratorium'),
('RAD', 'Radiologi', 'C', true, 'Peralatan radiologi dan pencitraan'),
('SURG', 'Bedah', 'C', false, 'Instrumen dan peralatan bedah'),
('STER', 'Sterilisasi', 'B', true, 'Peralatan sterilisasi'),
('ELEC', 'Elektromedik', 'B', true, 'Peralatan elektromedik umum'),
('FURN', 'Furnitur Medis', 'A', false, 'Tempat tidur, brankar, dll'),
('UTIL', 'Utilitas', 'A', false, 'Gas medis, vacuum, dll');

-- Enable realtime for sync status monitoring
ALTER PUBLICATION supabase_realtime ADD TABLE public.aspak_sync_logs;
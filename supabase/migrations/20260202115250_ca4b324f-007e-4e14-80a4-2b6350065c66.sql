
-- =====================================================
-- 1. INA-CBG/INA-DRG TARIFF SYSTEM
-- =====================================================

-- Tarif INA-CBG berdasarkan kelas RS dan regional
CREATE TABLE public.inacbg_tariffs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  drg_id UUID REFERENCES public.inadrg_codes(id),
  hospital_class VARCHAR(10) NOT NULL CHECK (hospital_class IN ('A', 'B', 'C', 'D')),
  regional_code VARCHAR(5) NOT NULL DEFAULT '1',
  tariff_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(drg_id, hospital_class, regional_code, effective_date)
);

-- Riwayat kalkulasi INA-CBG per kunjungan
CREATE TABLE public.inacbg_calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id UUID REFERENCES public.visits(id),
  patient_id UUID REFERENCES public.patients(id),
  billing_id UUID REFERENCES public.billings(id),
  drg_code VARCHAR(20) NOT NULL,
  drg_description TEXT,
  severity_level INTEGER DEFAULT 1 CHECK (severity_level BETWEEN 1 AND 3),
  los_actual INTEGER,
  los_grouper INTEGER,
  primary_diagnosis VARCHAR(10),
  secondary_diagnoses TEXT[],
  procedures TEXT[],
  base_tariff DECIMAL(15,2) DEFAULT 0,
  adjustment_factor DECIMAL(5,4) DEFAULT 1.0000,
  final_tariff DECIMAL(15,2) DEFAULT 0,
  hospital_cost DECIMAL(15,2) DEFAULT 0,
  variance DECIMAL(15,2) DEFAULT 0,
  grouper_version VARCHAR(20) DEFAULT '6.0',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  calculated_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 2. SUBSPECIALTY SYSTEM
-- =====================================================

-- Master data subspesialistik (standalone)
CREATE TABLE public.subspecialties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  specialty_code VARCHAR(20),
  specialty_name VARCHAR(100),
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tambah kolom subspecialty ke doctors
ALTER TABLE public.doctors 
ADD COLUMN IF NOT EXISTS subspecialty_id UUID REFERENCES public.subspecialties(id),
ADD COLUMN IF NOT EXISTS is_subspecialist BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS academic_title VARCHAR(50);

-- =====================================================
-- 3. PENDIDIKAN & PENELITIAN (EDUCATION & RESEARCH)
-- =====================================================

-- Program pendidikan
CREATE TABLE public.education_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_code VARCHAR(20) NOT NULL UNIQUE,
  program_name VARCHAR(200) NOT NULL,
  program_type VARCHAR(50) NOT NULL,
  affiliated_university VARCHAR(200),
  accreditation_status VARCHAR(50),
  max_students INTEGER,
  duration_months INTEGER,
  department_id UUID REFERENCES public.departments(id),
  coordinator_id UUID REFERENCES public.doctors(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Peserta didik / Residen
CREATE TABLE public.medical_trainees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainee_code VARCHAR(30) NOT NULL UNIQUE,
  full_name VARCHAR(200) NOT NULL,
  nik VARCHAR(16),
  program_id UUID REFERENCES public.education_programs(id),
  university VARCHAR(200),
  enrollment_date DATE NOT NULL,
  expected_graduation DATE,
  current_rotation_id UUID,
  supervisor_id UUID REFERENCES public.doctors(id),
  status VARCHAR(30) DEFAULT 'active',
  photo_url TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Rotasi klinik
CREATE TABLE public.clinical_rotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainee_id UUID REFERENCES public.medical_trainees(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id),
  supervisor_id UUID REFERENCES public.doctors(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rotation_type VARCHAR(50),
  status VARCHAR(30) DEFAULT 'scheduled',
  evaluation_score DECIMAL(5,2),
  evaluation_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Proyek penelitian
CREATE TABLE public.research_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_code VARCHAR(30) NOT NULL UNIQUE,
  title VARCHAR(500) NOT NULL,
  principal_investigator_id UUID REFERENCES public.doctors(id),
  co_investigators TEXT[],
  department_id UUID REFERENCES public.departments(id),
  research_type VARCHAR(50),
  ethics_approval_number VARCHAR(100),
  ethics_approval_date DATE,
  start_date DATE,
  end_date DATE,
  funding_source VARCHAR(200),
  budget DECIMAL(15,2),
  status VARCHAR(30) DEFAULT 'proposed',
  abstract TEXT,
  keywords TEXT[],
  publication_status VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Kegiatan akademik (CME, Seminar, Workshop)
CREATE TABLE public.academic_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_code VARCHAR(30) NOT NULL UNIQUE,
  title VARCHAR(300) NOT NULL,
  activity_type VARCHAR(50) NOT NULL,
  department_id UUID REFERENCES public.departments(id),
  organizer_id UUID REFERENCES public.doctors(id),
  activity_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location VARCHAR(200),
  skp_points DECIMAL(4,2),
  max_participants INTEGER,
  registered_count INTEGER DEFAULT 0,
  description TEXT,
  speaker_names TEXT[],
  status VARCHAR(30) DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 4. SISRUTE (Sistem Rujukan Terintegrasi)
-- =====================================================

CREATE TABLE public.sisrute_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_number VARCHAR(50) NOT NULL UNIQUE,
  sisrute_id VARCHAR(100),
  patient_id UUID REFERENCES public.patients(id),
  visit_id UUID REFERENCES public.visits(id),
  referral_type VARCHAR(20) NOT NULL,
  referral_category VARCHAR(50),
  source_facility_code VARCHAR(20),
  source_facility_name VARCHAR(200),
  source_facility_type VARCHAR(20),
  source_province VARCHAR(100),
  source_city VARCHAR(100),
  destination_facility_code VARCHAR(20),
  destination_facility_name VARCHAR(200),
  destination_facility_type VARCHAR(20),
  destination_province VARCHAR(100),
  destination_city VARCHAR(100),
  destination_department VARCHAR(100),
  primary_diagnosis VARCHAR(10),
  diagnosis_description TEXT,
  reason_for_referral TEXT,
  clinical_summary TEXT,
  vital_signs JSONB,
  treatment_given TEXT,
  referring_doctor_id UUID REFERENCES public.doctors(id),
  referring_doctor_name VARCHAR(200),
  referring_doctor_sip VARCHAR(50),
  transport_type VARCHAR(50),
  transport_status VARCHAR(30),
  departure_time TIMESTAMPTZ,
  arrival_time TIMESTAMPTZ,
  status VARCHAR(30) DEFAULT 'pending',
  response_notes TEXT,
  responded_at TIMESTAMPTZ,
  responded_by VARCHAR(200),
  sync_status VARCHAR(20) DEFAULT 'pending',
  last_sync_at TIMESTAMPTZ,
  sync_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- Enable RLS
-- =====================================================
ALTER TABLE public.inacbg_tariffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inacbg_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subspecialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_trainees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_rotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sisrute_referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "inacbg_tariffs_select" ON public.inacbg_tariffs FOR SELECT TO authenticated USING (true);
CREATE POLICY "inacbg_tariffs_all" ON public.inacbg_tariffs FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "inacbg_calculations_select" ON public.inacbg_calculations FOR SELECT TO authenticated USING (true);
CREATE POLICY "inacbg_calculations_all" ON public.inacbg_calculations FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "subspecialties_select" ON public.subspecialties FOR SELECT TO authenticated USING (true);
CREATE POLICY "subspecialties_all" ON public.subspecialties FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "education_programs_select" ON public.education_programs FOR SELECT TO authenticated USING (true);
CREATE POLICY "education_programs_all" ON public.education_programs FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "medical_trainees_select" ON public.medical_trainees FOR SELECT TO authenticated USING (true);
CREATE POLICY "medical_trainees_all" ON public.medical_trainees FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "clinical_rotations_select" ON public.clinical_rotations FOR SELECT TO authenticated USING (true);
CREATE POLICY "clinical_rotations_all" ON public.clinical_rotations FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "research_projects_select" ON public.research_projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "research_projects_all" ON public.research_projects FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "academic_activities_select" ON public.academic_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "academic_activities_all" ON public.academic_activities FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "sisrute_referrals_select" ON public.sisrute_referrals FOR SELECT TO authenticated USING (true);
CREATE POLICY "sisrute_referrals_all" ON public.sisrute_referrals FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX idx_inacbg_calculations_visit ON public.inacbg_calculations(visit_id);
CREATE INDEX idx_inacbg_calculations_patient ON public.inacbg_calculations(patient_id);
CREATE INDEX idx_medical_trainees_program ON public.medical_trainees(program_id);
CREATE INDEX idx_clinical_rotations_trainee ON public.clinical_rotations(trainee_id);
CREATE INDEX idx_sisrute_referrals_patient ON public.sisrute_referrals(patient_id);
CREATE INDEX idx_sisrute_referrals_status ON public.sisrute_referrals(status);


-- ===========================================
-- MODUL KAMAR OPERASI (OPERATING ROOM)
-- ===========================================

-- Enum untuk status operasi
CREATE TYPE public.surgery_status AS ENUM (
  'scheduled',
  'preparation',
  'in_progress',
  'completed',
  'cancelled',
  'postponed'
);

-- Enum untuk tipe anestesi
CREATE TYPE public.anesthesia_type AS ENUM (
  'general',
  'regional',
  'local',
  'sedation',
  'combined'
);

-- Enum untuk klasifikasi ASA
CREATE TYPE public.asa_classification AS ENUM (
  'ASA_I',
  'ASA_II',
  'ASA_III',
  'ASA_IV',
  'ASA_V',
  'ASA_VI'
);

-- Tabel Ruang Operasi
CREATE TABLE public.operating_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_number VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  room_type VARCHAR(50) DEFAULT 'general', -- general, cardiac, neuro, ortho, ophthalmic, etc
  equipment JSONB DEFAULT '[]',
  is_available BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabel Jadwal Operasi (Surgery Schedule)
CREATE TABLE public.surgeries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  surgery_number VARCHAR(50) NOT NULL UNIQUE,
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  visit_id UUID REFERENCES public.visits(id),
  operating_room_id UUID REFERENCES public.operating_rooms(id),
  
  -- Jadwal
  scheduled_date DATE NOT NULL,
  scheduled_start_time TIME NOT NULL,
  scheduled_end_time TIME,
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  
  -- Diagnosis & Prosedur
  preoperative_diagnosis TEXT NOT NULL,
  postoperative_diagnosis TEXT,
  procedure_name TEXT NOT NULL,
  procedure_code VARCHAR(20), -- ICD-9 CM
  procedure_type VARCHAR(50) DEFAULT 'elective', -- elective, emergency, urgent
  wound_class VARCHAR(20) DEFAULT 'clean', -- clean, clean_contaminated, contaminated, dirty
  
  -- Status
  status public.surgery_status DEFAULT 'scheduled',
  cancellation_reason TEXT,
  
  -- Anestesi
  anesthesia_type public.anesthesia_type,
  asa_classification public.asa_classification,
  
  -- Catatan
  preoperative_notes TEXT,
  operative_notes TEXT,
  postoperative_notes TEXT,
  complications TEXT,
  blood_loss_ml INTEGER,
  
  -- Informed Consent
  consent_signed BOOLEAN DEFAULT false,
  consent_signed_at TIMESTAMP WITH TIME ZONE,
  consent_signed_by VARCHAR(200),
  
  -- Metadata
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabel Tim Operasi
CREATE TABLE public.surgery_teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  surgery_id UUID NOT NULL REFERENCES public.surgeries(id) ON DELETE CASCADE,
  staff_id UUID, -- Reference to employees or doctors
  staff_name VARCHAR(200) NOT NULL,
  role VARCHAR(50) NOT NULL, -- surgeon, assistant_surgeon, anesthesiologist, scrub_nurse, circulating_nurse
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabel Instrumen Operasi
CREATE TABLE public.surgery_instruments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  surgery_id UUID NOT NULL REFERENCES public.surgeries(id) ON DELETE CASCADE,
  instrument_name VARCHAR(200) NOT NULL,
  quantity INTEGER DEFAULT 1,
  count_before INTEGER,
  count_after INTEGER,
  is_verified BOOLEAN DEFAULT false,
  verified_by VARCHAR(200),
  verified_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabel Catatan Anestesi
CREATE TABLE public.anesthesia_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  surgery_id UUID NOT NULL REFERENCES public.surgeries(id) ON DELETE CASCADE,
  anesthesiologist_id UUID,
  anesthesiologist_name VARCHAR(200) NOT NULL,
  
  -- Pre-anesthesia
  pre_anesthesia_assessment TEXT,
  npo_status VARCHAR(50), -- NPO since when
  airway_assessment JSONB,
  allergies TEXT,
  
  -- Medications
  premedication JSONB DEFAULT '[]',
  induction_agents JSONB DEFAULT '[]',
  maintenance_agents JSONB DEFAULT '[]',
  
  -- Vital Signs Timeline
  vital_signs_timeline JSONB DEFAULT '[]', -- Array of {time, hr, bp, spo2, etco2, temp}
  
  -- Fluids & Blood
  iv_fluids JSONB DEFAULT '[]',
  blood_products JSONB DEFAULT '[]',
  estimated_blood_loss INTEGER,
  urine_output INTEGER,
  
  -- Airway Management
  airway_device VARCHAR(100), -- ETT, LMA, etc
  ett_size VARCHAR(20),
  intubation_grade VARCHAR(20), -- Cormack-Lehane
  
  -- Recovery
  emergence_time TIMESTAMP WITH TIME ZONE,
  extubation_time TIMESTAMP WITH TIME ZONE,
  pacu_admission_time TIMESTAMP WITH TIME ZONE,
  aldrete_score_admission INTEGER,
  aldrete_score_discharge INTEGER,
  
  -- Complications
  anesthesia_complications TEXT,
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabel Checklist Surgical Safety (WHO)
CREATE TABLE public.surgical_safety_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  surgery_id UUID NOT NULL REFERENCES public.surgeries(id) ON DELETE CASCADE,
  
  -- Sign In (Before Induction)
  sign_in_completed BOOLEAN DEFAULT false,
  sign_in_time TIMESTAMP WITH TIME ZONE,
  sign_in_by VARCHAR(200),
  patient_identity_confirmed BOOLEAN DEFAULT false,
  site_marked BOOLEAN DEFAULT false,
  consent_confirmed BOOLEAN DEFAULT false,
  anesthesia_check_completed BOOLEAN DEFAULT false,
  pulse_oximeter_functioning BOOLEAN DEFAULT false,
  allergies_known BOOLEAN DEFAULT false,
  difficult_airway_risk BOOLEAN DEFAULT false,
  aspiration_risk BOOLEAN DEFAULT false,
  blood_loss_risk BOOLEAN DEFAULT false,
  
  -- Time Out (Before Skin Incision)
  time_out_completed BOOLEAN DEFAULT false,
  time_out_time TIMESTAMP WITH TIME ZONE,
  time_out_by VARCHAR(200),
  team_members_introduced BOOLEAN DEFAULT false,
  patient_name_procedure_site_confirmed BOOLEAN DEFAULT false,
  antibiotic_prophylaxis_given BOOLEAN DEFAULT false,
  anticipated_critical_events_discussed BOOLEAN DEFAULT false,
  essential_imaging_displayed BOOLEAN DEFAULT false,
  
  -- Sign Out (Before Patient Leaves OR)
  sign_out_completed BOOLEAN DEFAULT false,
  sign_out_time TIMESTAMP WITH TIME ZONE,
  sign_out_by VARCHAR(200),
  procedure_recorded BOOLEAN DEFAULT false,
  instrument_count_correct BOOLEAN DEFAULT false,
  sponge_count_correct BOOLEAN DEFAULT false,
  specimens_labeled BOOLEAN DEFAULT false,
  equipment_problems_addressed BOOLEAN DEFAULT false,
  recovery_concerns_reviewed BOOLEAN DEFAULT false,
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.operating_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surgeries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surgery_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surgery_instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anesthesia_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surgical_safety_checklists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for operating_rooms
CREATE POLICY "Staff can view operating rooms" ON public.operating_rooms
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can manage operating rooms" ON public.operating_rooms
  FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for surgeries
CREATE POLICY "Staff can view surgeries" ON public.surgeries
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can manage surgeries" ON public.surgeries
  FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for surgery_teams
CREATE POLICY "Staff can view surgery teams" ON public.surgery_teams
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can manage surgery teams" ON public.surgery_teams
  FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for surgery_instruments
CREATE POLICY "Staff can view surgery instruments" ON public.surgery_instruments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can manage surgery instruments" ON public.surgery_instruments
  FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for anesthesia_records
CREATE POLICY "Staff can view anesthesia records" ON public.anesthesia_records
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can manage anesthesia records" ON public.anesthesia_records
  FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for surgical_safety_checklists
CREATE POLICY "Staff can view safety checklists" ON public.surgical_safety_checklists
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can manage safety checklists" ON public.surgical_safety_checklists
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Function to generate surgery number
CREATE OR REPLACE FUNCTION public.generate_surgery_number()
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
    SELECT LPAD((COALESCE(MAX(SUBSTRING(surgery_number FROM 12)::INTEGER), 0) + 1)::TEXT, 4, '0')
    INTO sequence_part
    FROM public.surgeries
    WHERE surgery_number LIKE 'SRG-' || date_part || '-%';
    
    new_number := 'SRG-' || date_part || '-' || sequence_part;
    RETURN new_number;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_operating_rooms_updated_at
    BEFORE UPDATE ON public.operating_rooms
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_surgeries_updated_at
    BEFORE UPDATE ON public.surgeries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_anesthesia_records_updated_at
    BEFORE UPDATE ON public.anesthesia_records
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_surgical_safety_checklists_updated_at
    BEFORE UPDATE ON public.surgical_safety_checklists
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_surgeries_patient_id ON public.surgeries(patient_id);
CREATE INDEX idx_surgeries_scheduled_date ON public.surgeries(scheduled_date);
CREATE INDEX idx_surgeries_status ON public.surgeries(status);
CREATE INDEX idx_surgeries_operating_room_id ON public.surgeries(operating_room_id);
CREATE INDEX idx_surgery_teams_surgery_id ON public.surgery_teams(surgery_id);
CREATE INDEX idx_surgery_instruments_surgery_id ON public.surgery_instruments(surgery_id);
CREATE INDEX idx_anesthesia_records_surgery_id ON public.anesthesia_records(surgery_id);

-- Insert default operating rooms
INSERT INTO public.operating_rooms (room_number, name, room_type, equipment) VALUES
  ('OK-01', 'Kamar Operasi 1 - Umum', 'general', '["Meja Operasi", "Lampu Operasi", "ESU", "Suction", "Monitor Pasien"]'),
  ('OK-02', 'Kamar Operasi 2 - Ortopedi', 'ortho', '["Meja Operasi Ortopedi", "C-Arm", "Drill Tulang", "Lampu Operasi"]'),
  ('OK-03', 'Kamar Operasi 3 - Bedah Saraf', 'neuro', '["Meja Operasi", "Mikroskop Operasi", "Neuronavigasi", "Drill Kraniotomi"]'),
  ('OK-04', 'Kamar Operasi 4 - Minor', 'minor', '["Meja Operasi Minor", "Lampu Operasi", "Set Instrumen Minor"]');

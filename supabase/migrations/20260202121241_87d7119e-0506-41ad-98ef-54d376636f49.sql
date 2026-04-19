-- Add setup tracking and module configuration

-- Add setup_completed flag to hospital_profile if not exists
ALTER TABLE public.hospital_profile 
ADD COLUMN IF NOT EXISTS setup_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS setup_completed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS setup_completed_by uuid REFERENCES auth.users(id);

-- Create hospital type enum
DO $$ BEGIN
  CREATE TYPE public.hospital_type_enum AS ENUM ('A', 'B', 'C', 'D', 'FKTP');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add hospital_type_enum column
ALTER TABLE public.hospital_profile 
ADD COLUMN IF NOT EXISTS facility_level hospital_type_enum;

-- Create module_configurations table to define which modules are available for each hospital type
CREATE TABLE IF NOT EXISTS public.module_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_code text NOT NULL,
  module_name text NOT NULL,
  module_category text NOT NULL, -- 'clinical', 'support', 'admin', 'integration', 'reporting'
  module_path text NOT NULL,
  module_icon text,
  display_order integer DEFAULT 0,
  -- Which hospital types can access this module
  available_for_type_a boolean DEFAULT true,
  available_for_type_b boolean DEFAULT true,
  available_for_type_c boolean DEFAULT true,
  available_for_type_d boolean DEFAULT false,
  available_for_fktp boolean DEFAULT false,
  -- Is this a core module that's always enabled?
  is_core_module boolean DEFAULT false,
  is_active boolean DEFAULT true,
  description text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create hospital_enabled_modules to track which modules are enabled for this specific hospital
CREATE TABLE IF NOT EXISTS public.hospital_enabled_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES public.module_configurations(id) ON DELETE CASCADE,
  is_enabled boolean DEFAULT true,
  enabled_at timestamp with time zone DEFAULT now(),
  enabled_by uuid REFERENCES auth.users(id),
  UNIQUE(module_id)
);

-- Enable RLS
ALTER TABLE public.module_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_enabled_modules ENABLE ROW LEVEL SECURITY;

-- RLS Policies - readable by all authenticated, writable by admin
CREATE POLICY "Module configs readable by authenticated" ON public.module_configurations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Hospital modules readable by authenticated" ON public.hospital_enabled_modules
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Hospital modules writable by admin" ON public.hospital_enabled_modules
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Seed default module configurations
INSERT INTO public.module_configurations (module_code, module_name, module_category, module_path, display_order, available_for_type_a, available_for_type_b, available_for_type_c, available_for_type_d, available_for_fktp, is_core_module, description) VALUES
-- Core modules (always available)
('dashboard', 'Dashboard', 'core', '/dashboard', 1, true, true, true, true, true, true, 'Dashboard utama'),
('pendaftaran', 'Pendaftaran', 'core', '/pendaftaran', 2, true, true, true, true, true, true, 'Registrasi pasien'),
('pasien', 'Data Pasien', 'core', '/pasien', 3, true, true, true, true, true, true, 'Manajemen data pasien'),
('rekam-medis', 'Rekam Medis', 'core', '/rekam-medis', 4, true, true, true, true, true, true, 'Rekam medis elektronik'),
('billing', 'Billing & Kasir', 'core', '/billing', 5, true, true, true, true, true, true, 'Pembayaran dan kasir'),

-- Clinical modules
('rawat-jalan', 'Rawat Jalan', 'clinical', '/rawat-jalan', 10, true, true, true, true, true, false, 'Pelayanan rawat jalan'),
('rawat-inap', 'Rawat Inap', 'clinical', '/rawat-inap', 11, true, true, true, true, false, false, 'Pelayanan rawat inap'),
('igd', 'IGD', 'clinical', '/igd', 12, true, true, true, true, false, false, 'Instalasi Gawat Darurat'),
('icu', 'ICU/NICU/PICU', 'clinical', '/icu', 13, true, true, true, false, false, false, 'Intensive Care Unit'),
('kamar-operasi', 'Kamar Operasi', 'clinical', '/kamar-operasi', 14, true, true, true, false, false, false, 'Manajemen bedah dan anestesi'),
('hemodialisa', 'Hemodialisa', 'clinical', '/hemodialisa', 15, true, true, false, false, false, false, 'Unit hemodialisa'),

-- Support modules
('farmasi', 'Farmasi', 'support', '/farmasi', 20, true, true, true, true, true, false, 'Apotek dan farmasi'),
('laboratorium', 'Laboratorium', 'support', '/laboratorium', 21, true, true, true, true, true, false, 'Lab patologi klinik'),
('radiologi', 'Radiologi', 'support', '/radiologi', 22, true, true, true, false, false, false, 'Pencitraan medis'),
('bank-darah', 'Bank Darah', 'support', '/bank-darah', 23, true, true, false, false, false, false, 'BDRS dan transfusi'),
('gizi', 'Gizi', 'support', '/gizi', 24, true, true, true, false, false, false, 'Instalasi gizi'),
('rehabilitasi', 'Rehabilitasi Medik', 'support', '/rehabilitasi', 25, true, true, false, false, false, false, 'Fisioterapi'),
('forensik', 'Forensik', 'support', '/forensik', 26, true, false, false, false, false, false, 'Kedokteran forensik'),

-- Admin modules
('inventory', 'Inventory', 'admin', '/inventory', 30, true, true, true, true, true, false, 'Manajemen stok'),
('sdm', 'SDM & Payroll', 'admin', '/sdm', 31, true, true, true, true, true, false, 'Kepegawaian'),
('akuntansi', 'Akuntansi', 'admin', '/akuntansi', 32, true, true, true, true, false, false, 'Laporan keuangan'),
('manajemen-user', 'Manajemen User', 'admin', '/manajemen-user', 33, true, true, true, true, true, true, 'Pengaturan pengguna'),
('pengaturan', 'Pengaturan', 'admin', '/pengaturan', 34, true, true, true, true, true, true, 'Konfigurasi sistem'),

-- Integration modules
('bpjs', 'BPJS Kesehatan', 'integration', '/bpjs', 40, true, true, true, true, true, false, 'VClaim/PCare'),
('satu-sehat', 'SATU SEHAT', 'integration', '/satu-sehat', 41, true, true, true, true, true, false, 'Integrasi FHIR'),

-- Reporting modules
('laporan', 'Laporan', 'reporting', '/laporan', 50, true, true, true, true, true, false, 'Laporan operasional'),
('laporan-kemenkes', 'Kemenkes RL & ASPAK', 'reporting', '/laporan-kemenkes', 51, true, true, true, true, false, false, 'Pelaporan Kemenkes'),
('dashboard-executive', 'Dashboard Eksekutif', 'reporting', '/dashboard-executive', 52, true, true, true, false, false, false, 'KPI management'),

-- Education (Type A only)
('pendidikan', 'Pendidikan & Riset', 'education', '/pendidikan', 60, true, false, false, false, false, false, 'PPDS, Koas, Penelitian'),

-- Quality modules
('mutu', 'Mutu & Akreditasi', 'quality', '/mutu', 70, true, true, true, false, false, false, 'SNARS, SISMADAK'),

-- MCU
('mcu', 'Medical Check Up', 'support', '/mcu', 27, true, true, true, true, true, false, 'Pemeriksaan kesehatan')

ON CONFLICT DO NOTHING;

-- Function to get available modules based on hospital type
CREATE OR REPLACE FUNCTION public.get_available_modules(p_hospital_type text)
RETURNS TABLE (
  module_code text,
  module_name text,
  module_category text,
  module_path text,
  module_icon text,
  display_order integer,
  is_core_module boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mc.module_code,
    mc.module_name,
    mc.module_category,
    mc.module_path,
    mc.module_icon,
    mc.display_order,
    mc.is_core_module
  FROM module_configurations mc
  LEFT JOIN hospital_enabled_modules hem ON hem.module_id = mc.id
  WHERE mc.is_active = true
    AND (
      mc.is_core_module = true
      OR (
        CASE p_hospital_type
          WHEN 'A' THEN mc.available_for_type_a
          WHEN 'B' THEN mc.available_for_type_b
          WHEN 'C' THEN mc.available_for_type_c
          WHEN 'D' THEN mc.available_for_type_d
          WHEN 'FKTP' THEN mc.available_for_fktp
          ELSE false
        END = true
        AND (hem.id IS NULL OR hem.is_enabled = true)
      )
    )
  ORDER BY mc.display_order;
END;
$$;

-- Function to check if setup is completed
CREATE OR REPLACE FUNCTION public.is_setup_completed()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT setup_completed FROM hospital_profile LIMIT 1),
    false
  );
$$;
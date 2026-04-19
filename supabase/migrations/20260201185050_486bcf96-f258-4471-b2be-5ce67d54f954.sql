-- Add standardized fields to patients table for Kemenkes/BPJS/Satu Sehat compliance
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS religion TEXT,
ADD COLUMN IF NOT EXISTS occupation TEXT,
ADD COLUMN IF NOT EXISTS education_level TEXT,
ADD COLUMN IF NOT EXISTS marital_status TEXT,
ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT 'Indonesia',
ADD COLUMN IF NOT EXISTS mother_name TEXT,
ADD COLUMN IF NOT EXISTS rt TEXT,
ADD COLUMN IF NOT EXISTS rw TEXT,
ADD COLUMN IF NOT EXISTS kelurahan TEXT,
ADD COLUMN IF NOT EXISTS kecamatan TEXT,
ADD COLUMN IF NOT EXISTS kabupaten TEXT;

-- Add professional credentials fields to employees table for healthcare personnel standards
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS str_number TEXT,
ADD COLUMN IF NOT EXISTS str_expiry_date DATE,
ADD COLUMN IF NOT EXISTS sip_number TEXT,
ADD COLUMN IF NOT EXISTS sip_expiry_date DATE,
ADD COLUMN IF NOT EXISTS specialization TEXT,
ADD COLUMN IF NOT EXISTS academic_title TEXT,
ADD COLUMN IF NOT EXISTS satusehat_practitioner_id TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS ktp_url TEXT,
ADD COLUMN IF NOT EXISTS str_url TEXT,
ADD COLUMN IF NOT EXISTS sip_url TEXT,
ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT 'Indonesia';

-- Create menu_access_templates table to define default menu access per role
CREATE TABLE IF NOT EXISTS public.menu_access_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role public.app_role NOT NULL,
  menu_path TEXT NOT NULL,
  can_view BOOLEAN NOT NULL DEFAULT false,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role, menu_path)
);

-- Insert default menu access templates for each role
INSERT INTO public.menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
-- Admin gets full access to everything
('admin', '/', true, true, true, true),
('admin', '/pendaftaran', true, true, true, true),
('admin', '/pasien', true, true, true, true),
('admin', '/rawat-jalan', true, true, true, true),
('admin', '/rawat-inap', true, true, true, true),
('admin', '/igd', true, true, true, true),
('admin', '/rekam-medis', true, true, true, true),
('admin', '/farmasi', true, true, true, true),
('admin', '/laboratorium', true, true, true, true),
('admin', '/radiologi', true, true, true, true),
('admin', '/billing', true, true, true, true),
('admin', '/bpjs', true, true, true, true),
('admin', '/satu-sehat', true, true, true, true),
('admin', '/inventory', true, true, true, true),
('admin', '/sdm', true, true, true, true),
('admin', '/laporan', true, true, true, true),
('admin', '/master-data', true, true, true, true),
('admin', '/pengaturan', true, true, true, true),
('admin', '/manajemen-user', true, true, true, true),

-- Dokter access
('dokter', '/', true, false, false, false),
('dokter', '/rawat-jalan', true, true, true, false),
('dokter', '/rawat-inap', true, true, true, false),
('dokter', '/igd', true, true, true, false),
('dokter', '/rekam-medis', true, true, true, false),
('dokter', '/telemedicine', true, true, true, false),
('dokter', '/kamar-operasi', true, true, true, false),

-- Perawat access
('perawat', '/', true, false, false, false),
('perawat', '/rawat-jalan', true, true, true, false),
('perawat', '/rawat-inap', true, true, true, false),
('perawat', '/igd', true, true, true, false),
('perawat', '/rekam-medis', true, false, false, false),

-- Kasir access
('kasir', '/', true, false, false, false),
('kasir', '/billing', true, true, true, false),
('kasir', '/laporan', true, false, false, false),

-- Farmasi access
('farmasi', '/', true, false, false, false),
('farmasi', '/farmasi', true, true, true, true),
('farmasi', '/inventory', true, true, true, false),

-- Laboratorium access
('laboratorium', '/', true, false, false, false),
('laboratorium', '/laboratorium', true, true, true, true),

-- Radiologi access
('radiologi', '/', true, false, false, false),
('radiologi', '/radiologi', true, true, true, true),

-- Pendaftaran access
('pendaftaran', '/', true, false, false, false),
('pendaftaran', '/pendaftaran', true, true, true, false),
('pendaftaran', '/pasien', true, true, true, false),
('pendaftaran', '/antrian', true, true, true, false),
('pendaftaran', '/jadwal-dokter', true, false, false, false)
ON CONFLICT (role, menu_path) DO NOTHING;

-- Enable RLS on menu_access_templates
ALTER TABLE public.menu_access_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read menu templates
CREATE POLICY "Menu templates are readable by authenticated users"
ON public.menu_access_templates
FOR SELECT
TO authenticated
USING (true);

-- Function to copy menu access from templates when assigning role
CREATE OR REPLACE FUNCTION public.apply_role_menu_access(_user_id UUID, _role public.app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert menu access from template for the given role
  INSERT INTO public.menu_access (user_id, menu_path, can_view, can_create, can_edit, can_delete)
  SELECT _user_id, mat.menu_path, mat.can_view, mat.can_create, mat.can_edit, mat.can_delete
  FROM public.menu_access_templates mat
  WHERE mat.role = _role
  ON CONFLICT (user_id, menu_path) DO UPDATE SET
    can_view = EXCLUDED.can_view OR menu_access.can_view,
    can_create = EXCLUDED.can_create OR menu_access.can_create,
    can_edit = EXCLUDED.can_edit OR menu_access.can_edit,
    can_delete = EXCLUDED.can_delete OR menu_access.can_delete;
END;
$$;

-- Add updated_at trigger for menu_access_templates
CREATE TRIGGER update_menu_access_templates_updated_at
BEFORE UPDATE ON public.menu_access_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
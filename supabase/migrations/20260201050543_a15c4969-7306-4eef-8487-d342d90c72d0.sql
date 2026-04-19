-- =============================================
-- 1. AUDIT TRIGGER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, new_data, user_id)
    VALUES (TG_TABLE_NAME, NEW.id::text, 'INSERT', to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, user_id)
    VALUES (TG_TABLE_NAME, NEW.id::text, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, old_data, user_id)
    VALUES (TG_TABLE_NAME, OLD.id::text, 'DELETE', to_jsonb(OLD), auth.uid());
    RETURN OLD;
  END IF;
END;
$$;

-- =============================================
-- 2. ADD AUDIT TRIGGERS TO CRITICAL TABLES
-- =============================================
DROP TRIGGER IF EXISTS audit_patients ON public.patients;
CREATE TRIGGER audit_patients AFTER INSERT OR UPDATE OR DELETE ON public.patients
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

DROP TRIGGER IF EXISTS audit_visits ON public.visits;
CREATE TRIGGER audit_visits AFTER INSERT OR UPDATE OR DELETE ON public.visits
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

DROP TRIGGER IF EXISTS audit_medical_records ON public.medical_records;
CREATE TRIGGER audit_medical_records AFTER INSERT OR UPDATE OR DELETE ON public.medical_records
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

DROP TRIGGER IF EXISTS audit_billings ON public.billings;
CREATE TRIGGER audit_billings AFTER INSERT OR UPDATE OR DELETE ON public.billings
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

DROP TRIGGER IF EXISTS audit_prescriptions ON public.prescriptions;
CREATE TRIGGER audit_prescriptions AFTER INSERT OR UPDATE OR DELETE ON public.prescriptions
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

DROP TRIGGER IF EXISTS audit_bpjs_claims ON public.bpjs_claims;
CREATE TRIGGER audit_bpjs_claims AFTER INSERT OR UPDATE OR DELETE ON public.bpjs_claims
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

DROP TRIGGER IF EXISTS audit_insurance_claims ON public.insurance_claims;
CREATE TRIGGER audit_insurance_claims AFTER INSERT OR UPDATE OR DELETE ON public.insurance_claims
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

DROP TRIGGER IF EXISTS audit_inpatient_admissions ON public.inpatient_admissions;
CREATE TRIGGER audit_inpatient_admissions AFTER INSERT OR UPDATE OR DELETE ON public.inpatient_admissions
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

DROP TRIGGER IF EXISTS audit_emergency_visits ON public.emergency_visits;
CREATE TRIGGER audit_emergency_visits AFTER INSERT OR UPDATE OR DELETE ON public.emergency_visits
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

DROP TRIGGER IF EXISTS audit_medicines ON public.medicines;
CREATE TRIGGER audit_medicines AFTER INSERT OR UPDATE OR DELETE ON public.medicines
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- =============================================
-- 3. MENU ACCESS CONFIGURATION TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.menu_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  menu_path TEXT NOT NULL,
  can_view BOOLEAN DEFAULT true,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(role, menu_path)
);

ALTER TABLE public.menu_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read menu access" ON public.menu_access;
CREATE POLICY "Users can read menu access"
ON public.menu_access FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can manage menu access" ON public.menu_access;
CREATE POLICY "Admins can manage menu access"
ON public.menu_access FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 4. INSERT DEFAULT MENU ACCESS
-- =============================================
INSERT INTO public.menu_access (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
-- Admin has full access
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
('admin', '/asuransi', true, true, true, true),
('admin', '/satu-sehat', true, true, true, true),
('admin', '/inventory', true, true, true, true),
('admin', '/sdm', true, true, true, true),
('admin', '/laporan', true, true, true, true),
('admin', '/master-data', true, true, true, true),
('admin', '/pengaturan', true, true, true, true),
('admin', '/antrian', true, true, true, true),
('admin', '/jadwal-dokter', true, true, true, true),
('admin', '/telemedicine', true, true, true, true),
('admin', '/dashboard-executive', true, true, true, true),
-- Dokter
('dokter', '/', true, false, false, false),
('dokter', '/pasien', true, false, true, false),
('dokter', '/rawat-jalan', true, true, true, false),
('dokter', '/rawat-inap', true, true, true, false),
('dokter', '/igd', true, true, true, false),
('dokter', '/rekam-medis', true, true, true, false),
('dokter', '/telemedicine', true, true, true, false),
('dokter', '/jadwal-dokter', true, false, true, false),
('dokter', '/antrian', true, false, false, false),
-- Perawat
('perawat', '/', true, false, false, false),
('perawat', '/pasien', true, false, true, false),
('perawat', '/rawat-jalan', true, true, true, false),
('perawat', '/rawat-inap', true, true, true, false),
('perawat', '/igd', true, true, true, false),
('perawat', '/antrian', true, true, false, false),
-- Kasir
('kasir', '/', true, false, false, false),
('kasir', '/pendaftaran', true, true, true, false),
('kasir', '/billing', true, true, true, false),
('kasir', '/bpjs', true, true, true, false),
('kasir', '/asuransi', true, true, true, false),
('kasir', '/antrian', true, true, false, false),
-- Farmasi
('farmasi', '/', true, false, false, false),
('farmasi', '/farmasi', true, true, true, false),
('farmasi', '/inventory', true, true, true, false),
('farmasi', '/antrian', true, true, false, false),
-- Laboratorium
('laboratorium', '/', true, false, false, false),
('laboratorium', '/laboratorium', true, true, true, false),
('laboratorium', '/antrian', true, true, false, false),
-- Radiologi
('radiologi', '/', true, false, false, false),
('radiologi', '/radiologi', true, true, true, false),
('radiologi', '/antrian', true, true, false, false),
-- Pendaftaran
('pendaftaran', '/', true, false, false, false),
('pendaftaran', '/pendaftaran', true, true, true, false),
('pendaftaran', '/pasien', true, true, true, false),
('pendaftaran', '/jadwal-dokter', true, true, false, false),
('pendaftaran', '/antrian', true, true, true, false)
ON CONFLICT (role, menu_path) DO NOTHING;

-- =============================================
-- 5. FUNCTION TO GET USER MENU ACCESS
-- =============================================
CREATE OR REPLACE FUNCTION public.get_user_menu_access(_user_id uuid)
RETURNS TABLE (
  menu_path TEXT,
  can_view BOOLEAN,
  can_create BOOLEAN,
  can_edit BOOLEAN,
  can_delete BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT
    ma.menu_path,
    bool_or(ma.can_view) as can_view,
    bool_or(ma.can_create) as can_create,
    bool_or(ma.can_edit) as can_edit,
    bool_or(ma.can_delete) as can_delete
  FROM public.menu_access ma
  INNER JOIN public.user_roles ur ON ur.role = ma.role
  WHERE ur.user_id = _user_id
  GROUP BY ma.menu_path
$$;

-- =============================================
-- 6. INSERT DEFAULT SYSTEM SETTINGS (for existing table)
-- =============================================
INSERT INTO public.system_settings (setting_key, setting_type, setting_value, is_public, description)
VALUES 
  ('hospital_info', 'general', '{
    "name": "RS Sehat Jelita",
    "code": "RSJ-001",
    "address": "Jl. Kesehatan No. 123, Jakarta",
    "phone": "(021) 1234-5678",
    "email": "info@rssehatjelita.co.id",
    "website": "www.rssehatjelita.co.id",
    "npwp": "01.234.567.8-901.000",
    "director": "Dr. Andi Wijaya, Sp.PD"
  }'::jsonb, true, 'Informasi dasar rumah sakit'),
  ('notification_settings', 'notification', '{
    "emailNotifications": true,
    "smsNotifications": false,
    "lowStockAlert": true,
    "appointmentReminder": true,
    "billingReminder": true,
    "criticalPatientAlert": true
  }'::jsonb, false, 'Pengaturan notifikasi'),
  ('system_config', 'system', '{
    "autoLogout": 30,
    "sessionTimeout": 60,
    "maintenanceMode": false,
    "debugMode": false,
    "backupEnabled": true,
    "backupFrequency": "daily"
  }'::jsonb, false, 'Konfigurasi sistem'),
  ('integration_satusehat', 'integration', '{
    "org_id": "10000001",
    "environment": "sandbox",
    "enabled": true
  }'::jsonb, false, 'Konfigurasi SATU SEHAT'),
  ('integration_bpjs', 'integration', '{
    "provider_code": "",
    "enabled": true
  }'::jsonb, false, 'Konfigurasi BPJS')
ON CONFLICT (setting_key) DO NOTHING;
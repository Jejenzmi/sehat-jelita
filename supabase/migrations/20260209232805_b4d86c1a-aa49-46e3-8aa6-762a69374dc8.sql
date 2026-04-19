
-- ============================================
-- SIMRS ZEN - Security Hardening Migration
-- Comply with UU PDP No. 27/2022
-- ============================================

-- 1. Create helper function for multi-role checking
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = ANY(_roles)
  )
$$;

-- 2. Drop ALL existing RLS policies on critical tables
DO $$ 
DECLARE
  r RECORD;
  tables TEXT[] := ARRAY[
    'patients', 'medical_records', 'employees', 'payroll',
    'prescriptions', 'lab_results', 'billings', 'billing_items',
    'surgeries', 'anesthesia_records', 'icu_admissions',
    'blood_inventory', 'transfusion_records', 'transfusion_requests',
    'dialysis_sessions', 'mortuary_cases', 'autopsy_records',
    'death_certificates', 'visum_reports', 'vendors',
    'profiles', 'insurance_claims', 'bpjs_claims', 'corporate_clients',
    'user_roles', 'visits', 'appointments'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = t AND schemaname = 'public' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, t);
    END LOOP;
  END LOOP;
END $$;

-- 3. Ensure RLS enabled
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surgeries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anesthesia_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icu_admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfusion_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfusion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dialysis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mortuary_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autopsy_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.death_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visum_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bpjs_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. NEW ROLE-BASED POLICIES
-- Valid roles: admin, dokter, perawat, kasir, farmasi, laboratorium,
-- radiologi, pendaftaran, keuangan, gizi, icu, bedah, rehabilitasi,
-- mcu, forensik, cssd, manajemen, bank_darah, hemodialisa, hrd, procurement
-- ============================================

-- ======== PROFILES ========
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ======== USER_ROLES (prevent privilege escalation) ========
CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_roles_insert" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles_update" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles_delete" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ======== PATIENTS ========
CREATE POLICY "patients_select" ON public.patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "patients_insert" ON public.patients FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'pendaftaran', 'dokter', 'perawat']::app_role[]));
CREATE POLICY "patients_update" ON public.patients FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin', 'pendaftaran', 'dokter', 'perawat']::app_role[]));
CREATE POLICY "patients_delete" ON public.patients FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ======== VISITS ========
CREATE POLICY "visits_select" ON public.visits FOR SELECT TO authenticated USING (true);
CREATE POLICY "visits_insert" ON public.visits FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'pendaftaran', 'dokter', 'perawat']::app_role[]));
CREATE POLICY "visits_update" ON public.visits FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin', 'pendaftaran', 'dokter', 'perawat', 'kasir']::app_role[]));
CREATE POLICY "visits_delete" ON public.visits FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ======== APPOINTMENTS ========
CREATE POLICY "appointments_select" ON public.appointments FOR SELECT TO authenticated USING (true);
CREATE POLICY "appointments_insert" ON public.appointments FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'pendaftaran', 'dokter', 'perawat']::app_role[]));
CREATE POLICY "appointments_update" ON public.appointments FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin', 'pendaftaran', 'dokter', 'perawat']::app_role[]));
CREATE POLICY "appointments_delete" ON public.appointments FOR DELETE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin', 'pendaftaran']::app_role[]));

-- ======== MEDICAL_RECORDS ========
CREATE POLICY "medical_records_select" ON public.medical_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "medical_records_insert" ON public.medical_records FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'dokter', 'perawat']::app_role[]));
CREATE POLICY "medical_records_update" ON public.medical_records FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin', 'dokter', 'perawat']::app_role[]));
CREATE POLICY "medical_records_delete" ON public.medical_records FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ======== PRESCRIPTIONS ========
CREATE POLICY "prescriptions_select" ON public.prescriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "prescriptions_insert" ON public.prescriptions FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'dokter', 'farmasi']::app_role[]));
CREATE POLICY "prescriptions_update" ON public.prescriptions FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin', 'dokter', 'farmasi']::app_role[]));
CREATE POLICY "prescriptions_delete" ON public.prescriptions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ======== LAB_RESULTS ========
CREATE POLICY "lab_results_select" ON public.lab_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "lab_results_insert" ON public.lab_results FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'laboratorium', 'dokter']::app_role[]));
CREATE POLICY "lab_results_update" ON public.lab_results FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin', 'laboratorium', 'dokter']::app_role[]));
CREATE POLICY "lab_results_delete" ON public.lab_results FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ======== BILLINGS ========
CREATE POLICY "billings_select" ON public.billings FOR SELECT TO authenticated USING (true);
CREATE POLICY "billings_insert" ON public.billings FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'kasir', 'keuangan']::app_role[]));
CREATE POLICY "billings_update" ON public.billings FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin', 'kasir', 'keuangan']::app_role[]));
CREATE POLICY "billings_delete" ON public.billings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ======== BILLING_ITEMS ========
CREATE POLICY "billing_items_select" ON public.billing_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "billing_items_insert" ON public.billing_items FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'kasir', 'keuangan']::app_role[]));
CREATE POLICY "billing_items_update" ON public.billing_items FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin', 'kasir', 'keuangan']::app_role[]));
CREATE POLICY "billing_items_delete" ON public.billing_items FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ======== EMPLOYEES (RESTRICTED SELECT) ========
CREATE POLICY "employees_select" ON public.employees FOR SELECT TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin', 'hrd', 'manajemen', 'keuangan']::app_role[]));
CREATE POLICY "employees_insert" ON public.employees FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'hrd']::app_role[]));
CREATE POLICY "employees_update" ON public.employees FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin', 'hrd']::app_role[]));
CREATE POLICY "employees_delete" ON public.employees FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ======== PAYROLL (RESTRICTED SELECT) ========
CREATE POLICY "payroll_select" ON public.payroll FOR SELECT TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin', 'hrd', 'keuangan']::app_role[]));
CREATE POLICY "payroll_insert" ON public.payroll FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'hrd', 'keuangan']::app_role[]));
CREATE POLICY "payroll_update" ON public.payroll FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin', 'hrd', 'keuangan']::app_role[]));
CREATE POLICY "payroll_delete" ON public.payroll FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ======== SURGERIES ========
CREATE POLICY "surgeries_select" ON public.surgeries FOR SELECT TO authenticated USING (true);
CREATE POLICY "surgeries_insert" ON public.surgeries FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'bedah', 'dokter']::app_role[]));
CREATE POLICY "surgeries_update" ON public.surgeries FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin', 'bedah', 'dokter']::app_role[]));
CREATE POLICY "surgeries_delete" ON public.surgeries FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ======== ANESTHESIA_RECORDS ========
CREATE POLICY "anesthesia_records_select" ON public.anesthesia_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "anesthesia_records_insert" ON public.anesthesia_records FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'bedah', 'dokter']::app_role[]));
CREATE POLICY "anesthesia_records_update" ON public.anesthesia_records FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin', 'bedah', 'dokter']::app_role[]));
CREATE POLICY "anesthesia_records_delete" ON public.anesthesia_records FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ======== ICU_ADMISSIONS ========
CREATE POLICY "icu_admissions_select" ON public.icu_admissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "icu_admissions_insert" ON public.icu_admissions FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'icu', 'dokter', 'perawat']::app_role[]));
CREATE POLICY "icu_admissions_update" ON public.icu_admissions FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin', 'icu', 'dokter', 'perawat']::app_role[]));
CREATE POLICY "icu_admissions_delete" ON public.icu_admissions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ======== BLOOD_INVENTORY ========
CREATE POLICY "blood_inventory_select" ON public.blood_inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "blood_inventory_insert" ON public.blood_inventory FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'laboratorium', 'bank_darah']::app_role[]));
CREATE POLICY "blood_inventory_update" ON public.blood_inventory FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin', 'laboratorium', 'bank_darah']::app_role[]));
CREATE POLICY "blood_inventory_delete" ON public.blood_inventory FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ======== TRANSFUSION_RECORDS ========
CREATE POLICY "transfusion_records_select" ON public.transfusion_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "transfusion_records_insert" ON public.transfusion_records FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'laboratorium', 'bank_darah', 'dokter']::app_role[]));
CREATE POLICY "transfusion_records_update" ON public.transfusion_records FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin', 'laboratorium', 'bank_darah', 'dokter']::app_role[]));
CREATE POLICY "transfusion_records_delete" ON public.transfusion_records FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ======== TRANSFUSION_REQUESTS ========
CREATE POLICY "transfusion_requests_select" ON public.transfusion_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "transfusion_requests_insert" ON public.transfusion_requests FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'laboratorium', 'bank_darah', 'dokter', 'perawat']::app_role[]));
CREATE POLICY "transfusion_requests_update" ON public.transfusion_requests FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin', 'laboratorium', 'bank_darah', 'dokter']::app_role[]));
CREATE POLICY "transfusion_requests_delete" ON public.transfusion_requests FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ======== DIALYSIS_SESSIONS ========
CREATE POLICY "dialysis_sessions_select" ON public.dialysis_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "dialysis_sessions_insert" ON public.dialysis_sessions FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'hemodialisa', 'dokter', 'perawat']::app_role[]));
CREATE POLICY "dialysis_sessions_update" ON public.dialysis_sessions FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin', 'hemodialisa', 'dokter', 'perawat']::app_role[]));
CREATE POLICY "dialysis_sessions_delete" ON public.dialysis_sessions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ======== MORTUARY_CASES (RESTRICTED SELECT) ========
CREATE POLICY "mortuary_cases_select" ON public.mortuary_cases FOR SELECT TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin', 'forensik', 'dokter', 'pendaftaran']::app_role[]));
CREATE POLICY "mortuary_cases_insert" ON public.mortuary_cases FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'forensik', 'dokter']::app_role[]));
CREATE POLICY "mortuary_cases_update" ON public.mortuary_cases FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin', 'forensik', 'dokter']::app_role[]));
CREATE POLICY "mortuary_cases_delete" ON public.mortuary_cases FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ======== AUTOPSY_RECORDS (RESTRICTED SELECT) ========
CREATE POLICY "autopsy_records_select" ON public.autopsy_records FOR SELECT TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin', 'forensik', 'dokter']::app_role[]));
CREATE POLICY "autopsy_records_insert" ON public.autopsy_records FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'forensik', 'dokter']::app_role[]));
CREATE POLICY "autopsy_records_update" ON public.autopsy_records FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin', 'forensik', 'dokter']::app_role[]));
CREATE POLICY "autopsy_records_delete" ON public.autopsy_records FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ======== DEATH_CERTIFICATES (RESTRICTED SELECT) ========
CREATE POLICY "death_certificates_select" ON public.death_certificates FOR SELECT TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin', 'forensik', 'dokter', 'pendaftaran']::app_role[]));
CREATE POLICY "death_certificates_insert" ON public.death_certificates FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'forensik', 'dokter']::app_role[]));
CREATE POLICY "death_certificates_update" ON public.death_certificates FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin', 'forensik', 'dokter']::app_role[]));
CREATE POLICY "death_certificates_delete" ON public.death_certificates FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ======== VISUM_REPORTS (RESTRICTED SELECT) ========
CREATE POLICY "visum_reports_select" ON public.visum_reports FOR SELECT TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin', 'forensik', 'dokter']::app_role[]));
CREATE POLICY "visum_reports_insert" ON public.visum_reports FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'forensik', 'dokter']::app_role[]));
CREATE POLICY "visum_reports_update" ON public.visum_reports FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin', 'forensik', 'dokter']::app_role[]));
CREATE POLICY "visum_reports_delete" ON public.visum_reports FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ======== VENDORS (RESTRICTED SELECT) ========
CREATE POLICY "vendors_select" ON public.vendors FOR SELECT TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement', 'keuangan', 'farmasi']::app_role[]));
CREATE POLICY "vendors_insert" ON public.vendors FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement', 'keuangan']::app_role[]));
CREATE POLICY "vendors_update" ON public.vendors FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin', 'procurement', 'keuangan']::app_role[]));
CREATE POLICY "vendors_delete" ON public.vendors FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ======== CORPORATE_CLIENTS (RESTRICTED SELECT) ========
CREATE POLICY "corporate_clients_select" ON public.corporate_clients FOR SELECT TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin', 'manajemen', 'keuangan', 'kasir']::app_role[]));
CREATE POLICY "corporate_clients_insert" ON public.corporate_clients FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'manajemen', 'keuangan']::app_role[]));
CREATE POLICY "corporate_clients_update" ON public.corporate_clients FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin', 'manajemen', 'keuangan']::app_role[]));
CREATE POLICY "corporate_clients_delete" ON public.corporate_clients FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ======== INSURANCE_CLAIMS ========
CREATE POLICY "insurance_claims_select" ON public.insurance_claims FOR SELECT TO authenticated USING (true);
CREATE POLICY "insurance_claims_insert" ON public.insurance_claims FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'keuangan', 'kasir']::app_role[]));
CREATE POLICY "insurance_claims_update" ON public.insurance_claims FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin', 'keuangan', 'kasir']::app_role[]));
CREATE POLICY "insurance_claims_delete" ON public.insurance_claims FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ======== BPJS_CLAIMS ========
CREATE POLICY "bpjs_claims_select" ON public.bpjs_claims FOR SELECT TO authenticated USING (true);
CREATE POLICY "bpjs_claims_insert" ON public.bpjs_claims FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'keuangan', 'kasir']::app_role[]));
CREATE POLICY "bpjs_claims_update" ON public.bpjs_claims FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin', 'keuangan', 'kasir']::app_role[]));
CREATE POLICY "bpjs_claims_delete" ON public.bpjs_claims FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 5. Fix Security Definer View
ALTER VIEW IF EXISTS public.department_satisfaction_summary SET (security_invoker = on);

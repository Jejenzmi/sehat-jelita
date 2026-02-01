
-- =====================================================
-- MANAJEMEN PENUNJANG & KEPATUHAN/MUTU MODULES (CORRECTED)
-- =====================================================

-- =====================================================
-- ENUMS (Only create if not exists)
-- =====================================================

DO $$ BEGIN
    CREATE TYPE sterilization_status AS ENUM ('pending', 'in_progress', 'sterilized', 'failed', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE linen_status AS ENUM ('clean', 'dirty', 'in_laundry', 'damaged', 'disposed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE maintenance_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled', 'overdue');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE asset_status AS ENUM ('active', 'inactive', 'maintenance', 'disposed', 'lost');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE incident_severity AS ENUM ('near_miss', 'minor', 'moderate', 'major', 'sentinel');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE consent_status AS ENUM ('pending', 'signed', 'refused', 'revoked', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- CSSD (Central Sterile Supply Department)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.sterilization_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_code TEXT NOT NULL UNIQUE,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL,
  sterilization_method TEXT NOT NULL,
  cycle_life INTEGER DEFAULT 100,
  current_cycles INTEGER DEFAULT 0,
  storage_location TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sterilization_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_number TEXT NOT NULL UNIQUE,
  sterilizer_id TEXT,
  sterilization_method TEXT NOT NULL,
  operator_id UUID REFERENCES public.employees(id),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  temperature DECIMAL(5,2),
  pressure DECIMAL(5,2),
  exposure_time INTEGER,
  status sterilization_status DEFAULT 'pending',
  biological_indicator_result TEXT,
  chemical_indicator_result TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sterilization_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID REFERENCES public.sterilization_batches(id),
  item_id UUID REFERENCES public.sterilization_items(id),
  quantity INTEGER DEFAULT 1,
  expiry_date DATE,
  issued_to_department TEXT,
  issued_date TIMESTAMP WITH TIME ZONE,
  status sterilization_status DEFAULT 'sterilized',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- LINEN/LAUNDRY MANAGEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS public.linen_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  linen_code TEXT NOT NULL UNIQUE,
  linen_type TEXT NOT NULL,
  color TEXT,
  size TEXT,
  department_id UUID REFERENCES public.departments(id),
  status linen_status DEFAULT 'clean',
  purchase_date DATE,
  last_wash_date DATE,
  wash_count INTEGER DEFAULT 0,
  max_wash_cycles INTEGER DEFAULT 100,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.laundry_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_number TEXT NOT NULL UNIQUE,
  collection_date TIMESTAMP WITH TIME ZONE NOT NULL,
  completion_date TIMESTAMP WITH TIME ZONE,
  collected_by UUID REFERENCES public.employees(id),
  processed_by UUID REFERENCES public.employees(id),
  total_items INTEGER DEFAULT 0,
  total_weight DECIMAL(10,2),
  status TEXT DEFAULT 'collected',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.laundry_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID REFERENCES public.laundry_batches(id),
  linen_id UUID REFERENCES public.linen_inventory(id),
  condition_before TEXT,
  condition_after TEXT,
  is_damaged BOOLEAN DEFAULT false,
  damage_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- FACILITY MAINTENANCE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.maintenance_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_code TEXT NOT NULL UNIQUE,
  asset_name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  location TEXT,
  department_id UUID REFERENCES public.departments(id),
  purchase_date DATE,
  purchase_price DECIMAL(15,2),
  warranty_expiry DATE,
  status asset_status DEFAULT 'active',
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  maintenance_interval_days INTEGER,
  depreciation_rate DECIMAL(5,2),
  current_value DECIMAL(15,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.maintenance_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_number TEXT NOT NULL UNIQUE,
  asset_id UUID REFERENCES public.maintenance_assets(id),
  requested_by UUID REFERENCES public.employees(id),
  request_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  priority TEXT DEFAULT 'normal',
  maintenance_type TEXT NOT NULL,
  description TEXT NOT NULL,
  assigned_to UUID REFERENCES public.employees(id),
  scheduled_date DATE,
  completed_date TIMESTAMP WITH TIME ZONE,
  status maintenance_status DEFAULT 'pending',
  cost DECIMAL(15,2),
  vendor_id UUID,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.maintenance_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES public.maintenance_requests(id),
  asset_id UUID REFERENCES public.maintenance_assets(id),
  action_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  action_type TEXT NOT NULL,
  performed_by UUID REFERENCES public.employees(id),
  description TEXT,
  parts_used JSONB,
  labor_hours DECIMAL(5,2),
  cost DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- WASTE MANAGEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS public.waste_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  waste_type TEXT NOT NULL,
  color_code TEXT,
  handling_instructions TEXT,
  disposal_method TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.waste_collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_number TEXT NOT NULL UNIQUE,
  collection_date TIMESTAMP WITH TIME ZONE NOT NULL,
  department_id UUID REFERENCES public.departments(id),
  collected_by UUID REFERENCES public.employees(id),
  category_id UUID REFERENCES public.waste_categories(id),
  quantity DECIMAL(10,2),
  unit TEXT DEFAULT 'kg',
  container_count INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.waste_disposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  disposal_number TEXT NOT NULL UNIQUE,
  disposal_date TIMESTAMP WITH TIME ZONE NOT NULL,
  category_id UUID REFERENCES public.waste_categories(id),
  total_weight DECIMAL(10,2),
  disposal_method TEXT,
  vendor_name TEXT,
  manifest_number TEXT,
  transported_by TEXT,
  destination TEXT,
  cost DECIMAL(15,2),
  verified_by UUID REFERENCES public.employees(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- VENDOR/SUPPLIER MANAGEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_code TEXT NOT NULL UNIQUE,
  vendor_name TEXT NOT NULL,
  vendor_type TEXT NOT NULL,
  category TEXT[],
  address TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  npwp TEXT,
  bank_name TEXT,
  bank_account TEXT,
  payment_terms INTEGER DEFAULT 30,
  credit_limit DECIMAL(15,2),
  rating DECIMAL(3,2),
  is_active BOOLEAN DEFAULT true,
  blacklisted BOOLEAN DEFAULT false,
  blacklist_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vendor_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_number TEXT NOT NULL UNIQUE,
  vendor_id UUID REFERENCES public.vendors(id),
  contract_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  value DECIMAL(15,2),
  terms TEXT,
  attachments JSONB,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vendor_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES public.vendors(id),
  evaluation_date DATE NOT NULL,
  evaluator_id UUID REFERENCES public.employees(id),
  period_start DATE,
  period_end DATE,
  quality_score DECIMAL(3,2),
  delivery_score DECIMAL(3,2),
  price_score DECIMAL(3,2),
  service_score DECIMAL(3,2),
  overall_score DECIMAL(3,2),
  comments TEXT,
  recommendations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- ACCREDITATION TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS public.accreditation_standards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  standard_code TEXT NOT NULL UNIQUE,
  standard_name TEXT NOT NULL,
  accreditation_body TEXT NOT NULL,
  version TEXT,
  chapter TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.accreditation_elements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  standard_id UUID REFERENCES public.accreditation_standards(id),
  element_code TEXT NOT NULL,
  element_name TEXT NOT NULL,
  description TEXT,
  scoring_criteria TEXT,
  max_score INTEGER DEFAULT 10,
  weight DECIMAL(5,2) DEFAULT 1,
  document_requirements TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.accreditation_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_date DATE NOT NULL,
  element_id UUID REFERENCES public.accreditation_elements(id),
  assessor_id UUID REFERENCES public.employees(id),
  score INTEGER,
  findings TEXT,
  evidence TEXT[],
  status TEXT DEFAULT 'pending',
  action_required TEXT,
  due_date DATE,
  completed_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- QUALITY INDICATORS (SISMADAK)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.quality_indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  indicator_code TEXT NOT NULL UNIQUE,
  indicator_name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit_name TEXT NOT NULL,
  dimension TEXT,
  numerator_definition TEXT,
  denominator_definition TEXT,
  target_value DECIMAL(10,2),
  target_direction TEXT DEFAULT 'higher',
  frequency TEXT DEFAULT 'monthly',
  data_source TEXT,
  responsible_department UUID REFERENCES public.departments(id),
  is_national_indicator BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quality_measurements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  indicator_id UUID REFERENCES public.quality_indicators(id),
  measurement_period DATE NOT NULL,
  numerator INTEGER,
  denominator INTEGER,
  value DECIMAL(10,4),
  target_met BOOLEAN,
  department_id UUID REFERENCES public.departments(id),
  collected_by UUID REFERENCES public.employees(id),
  validated_by UUID REFERENCES public.employees(id),
  validation_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quality_improvement_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  measurement_id UUID REFERENCES public.quality_measurements(id),
  indicator_id UUID REFERENCES public.quality_indicators(id),
  action_type TEXT NOT NULL,
  description TEXT NOT NULL,
  root_cause TEXT,
  action_plan TEXT,
  responsible_person UUID REFERENCES public.employees(id),
  start_date DATE,
  target_date DATE,
  completed_date DATE,
  status TEXT DEFAULT 'planned',
  effectiveness_evaluation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- INCIDENT/SAFETY REPORTING
-- =====================================================

CREATE TABLE IF NOT EXISTS public.safety_incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_number TEXT NOT NULL UNIQUE,
  incident_date TIMESTAMP WITH TIME ZONE NOT NULL,
  reported_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reporter_id UUID REFERENCES public.employees(id),
  department_id UUID REFERENCES public.departments(id),
  location TEXT,
  incident_type TEXT NOT NULL,
  severity incident_severity NOT NULL,
  patient_id UUID REFERENCES public.patients(id),
  patient_involved BOOLEAN DEFAULT false,
  description TEXT NOT NULL,
  immediate_action TEXT,
  witnesses TEXT[],
  status TEXT DEFAULT 'reported',
  investigated_by UUID REFERENCES public.employees(id),
  investigation_date TIMESTAMP WITH TIME ZONE,
  root_cause TEXT,
  contributing_factors TEXT[],
  recommendations TEXT,
  corrective_actions JSONB,
  followup_date DATE,
  closed_date TIMESTAMP WITH TIME ZONE,
  closed_by UUID REFERENCES public.employees(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- INFORMED CONSENT
-- =====================================================

CREATE TABLE IF NOT EXISTS public.consent_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_code TEXT NOT NULL UNIQUE,
  template_name TEXT NOT NULL,
  category TEXT NOT NULL,
  content_template TEXT NOT NULL,
  risks_explanation TEXT,
  alternatives_explanation TEXT,
  language TEXT DEFAULT 'id',
  version TEXT DEFAULT '1.0',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.patient_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  consent_number TEXT NOT NULL UNIQUE,
  patient_id UUID REFERENCES public.patients(id) NOT NULL,
  visit_id UUID REFERENCES public.visits(id),
  template_id UUID REFERENCES public.consent_templates(id),
  consent_type TEXT NOT NULL,
  procedure_name TEXT,
  procedure_date TIMESTAMP WITH TIME ZONE,
  doctor_id UUID REFERENCES public.doctors(id),
  explanation_given_by UUID REFERENCES public.doctors(id),
  explanation_date TIMESTAMP WITH TIME ZONE,
  patient_questions TEXT,
  patient_understands BOOLEAN DEFAULT false,
  consent_given BOOLEAN,
  consent_date TIMESTAMP WITH TIME ZONE,
  signed_by TEXT,
  relationship_to_patient TEXT,
  witness_name TEXT,
  witness_signature_date TIMESTAMP WITH TIME ZONE,
  refusal_reason TEXT,
  status consent_status DEFAULT 'pending',
  digital_signature TEXT,
  signature_image_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- INA-DRG MAPPING
-- =====================================================

CREATE TABLE IF NOT EXISTS public.inadrg_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  drg_code TEXT NOT NULL UNIQUE,
  drg_name TEXT NOT NULL,
  severity_level INTEGER,
  mdc_code TEXT,
  mdc_name TEXT,
  hospital_class TEXT,
  regional_tariff DECIMAL(15,2),
  national_tariff DECIMAL(15,2),
  effective_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.diagnosis_drg_mapping (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  icd10_code TEXT NOT NULL,
  icd9cm_code TEXT,
  drg_id UUID REFERENCES public.inadrg_codes(id),
  los_min INTEGER,
  los_max INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- INSURANCE API INTEGRATION (Add columns if missing)
-- =====================================================

ALTER TABLE public.insurance_providers ADD COLUMN IF NOT EXISTS api_endpoint TEXT;
ALTER TABLE public.insurance_providers ADD COLUMN IF NOT EXISTS api_key_setting TEXT;
ALTER TABLE public.insurance_providers ADD COLUMN IF NOT EXISTS claim_submission_method TEXT;

CREATE TABLE IF NOT EXISTS public.insurance_api_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES public.insurance_providers(id),
  request_type TEXT NOT NULL,
  request_payload JSONB,
  response_payload JSONB,
  response_status INTEGER,
  error_message TEXT,
  claim_id UUID REFERENCES public.insurance_claims(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- SATU SEHAT ENHANCED MAPPINGS
-- =====================================================

ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS satusehat_location_id TEXT;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS satusehat_location_id TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS satusehat_practitioner_id TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS nik TEXT;

CREATE TABLE IF NOT EXISTS public.satusehat_organization_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id TEXT NOT NULL,
  role_code TEXT NOT NULL,
  role_display TEXT,
  part_of TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- INDEXES (only create if not exists)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_sterilization_batches_date ON public.sterilization_batches(start_time);
CREATE INDEX IF NOT EXISTS idx_laundry_batches_date ON public.laundry_batches(collection_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status ON public.maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_assets_status ON public.maintenance_assets(status);
CREATE INDEX IF NOT EXISTS idx_waste_collections_date ON public.waste_collections(collection_date);
CREATE INDEX IF NOT EXISTS idx_vendors_active ON public.vendors(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_safety_incidents_date ON public.safety_incidents(incident_date);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_severity ON public.safety_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_patient_consents_patient ON public.patient_consents(patient_id);
CREATE INDEX IF NOT EXISTS idx_quality_measurements_period ON public.quality_measurements(measurement_period);
CREATE INDEX IF NOT EXISTS idx_accreditation_assessments_status ON public.accreditation_assessments(status);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.sterilization_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sterilization_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sterilization_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linen_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laundry_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laundry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_disposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accreditation_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accreditation_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accreditation_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_improvement_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inadrg_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnosis_drg_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.satusehat_organization_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Staff can manage sterilization items" ON public.sterilization_items;
DROP POLICY IF EXISTS "Staff can manage sterilization batches" ON public.sterilization_batches;
DROP POLICY IF EXISTS "Staff can manage sterilization records" ON public.sterilization_records;
DROP POLICY IF EXISTS "Staff can manage linen" ON public.linen_inventory;
DROP POLICY IF EXISTS "Staff can manage laundry batches" ON public.laundry_batches;
DROP POLICY IF EXISTS "Staff can manage laundry items" ON public.laundry_items;
DROP POLICY IF EXISTS "Staff can manage assets" ON public.maintenance_assets;
DROP POLICY IF EXISTS "Staff can manage maintenance requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Staff can manage maintenance logs" ON public.maintenance_logs;
DROP POLICY IF EXISTS "Staff can manage waste categories" ON public.waste_categories;
DROP POLICY IF EXISTS "Staff can manage waste collections" ON public.waste_collections;
DROP POLICY IF EXISTS "Staff can manage waste disposals" ON public.waste_disposals;
DROP POLICY IF EXISTS "Staff can manage vendors" ON public.vendors;
DROP POLICY IF EXISTS "Staff can manage vendor contracts" ON public.vendor_contracts;
DROP POLICY IF EXISTS "Staff can manage vendor evaluations" ON public.vendor_evaluations;
DROP POLICY IF EXISTS "Staff can manage accreditation standards" ON public.accreditation_standards;
DROP POLICY IF EXISTS "Staff can manage accreditation elements" ON public.accreditation_elements;
DROP POLICY IF EXISTS "Staff can manage accreditation assessments" ON public.accreditation_assessments;
DROP POLICY IF EXISTS "Staff can manage quality indicators" ON public.quality_indicators;
DROP POLICY IF EXISTS "Staff can manage quality measurements" ON public.quality_measurements;
DROP POLICY IF EXISTS "Staff can manage quality improvement" ON public.quality_improvement_actions;
DROP POLICY IF EXISTS "Staff can manage safety incidents" ON public.safety_incidents;
DROP POLICY IF EXISTS "Staff can manage consent templates" ON public.consent_templates;
DROP POLICY IF EXISTS "Staff can manage patient consents" ON public.patient_consents;
DROP POLICY IF EXISTS "Staff can manage inadrg codes" ON public.inadrg_codes;
DROP POLICY IF EXISTS "Staff can manage diagnosis drg mapping" ON public.diagnosis_drg_mapping;
DROP POLICY IF EXISTS "Staff can manage insurance api logs" ON public.insurance_api_logs;
DROP POLICY IF EXISTS "Staff can manage satusehat org roles" ON public.satusehat_organization_roles;

CREATE POLICY "Staff can manage sterilization items" ON public.sterilization_items FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage sterilization batches" ON public.sterilization_batches FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage sterilization records" ON public.sterilization_records FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage linen" ON public.linen_inventory FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage laundry batches" ON public.laundry_batches FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage laundry items" ON public.laundry_items FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage assets" ON public.maintenance_assets FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage maintenance requests" ON public.maintenance_requests FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage maintenance logs" ON public.maintenance_logs FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage waste categories" ON public.waste_categories FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage waste collections" ON public.waste_collections FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage waste disposals" ON public.waste_disposals FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage vendors" ON public.vendors FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage vendor contracts" ON public.vendor_contracts FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage vendor evaluations" ON public.vendor_evaluations FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage accreditation standards" ON public.accreditation_standards FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage accreditation elements" ON public.accreditation_elements FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage accreditation assessments" ON public.accreditation_assessments FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage quality indicators" ON public.quality_indicators FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage quality measurements" ON public.quality_measurements FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage quality improvement" ON public.quality_improvement_actions FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage safety incidents" ON public.safety_incidents FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage consent templates" ON public.consent_templates FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage patient consents" ON public.patient_consents FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage inadrg codes" ON public.inadrg_codes FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage diagnosis drg mapping" ON public.diagnosis_drg_mapping FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage insurance api logs" ON public.insurance_api_logs FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage satusehat org roles" ON public.satusehat_organization_roles FOR ALL USING (auth.uid() IS NOT NULL);

-- =====================================================
-- TRIGGERS (only create if not exists)
-- =====================================================

DROP TRIGGER IF EXISTS update_sterilization_items_updated_at ON public.sterilization_items;
DROP TRIGGER IF EXISTS update_sterilization_batches_updated_at ON public.sterilization_batches;
DROP TRIGGER IF EXISTS update_linen_inventory_updated_at ON public.linen_inventory;
DROP TRIGGER IF EXISTS update_laundry_batches_updated_at ON public.laundry_batches;
DROP TRIGGER IF EXISTS update_maintenance_assets_updated_at ON public.maintenance_assets;
DROP TRIGGER IF EXISTS update_maintenance_requests_updated_at ON public.maintenance_requests;
DROP TRIGGER IF EXISTS update_vendors_updated_at ON public.vendors;
DROP TRIGGER IF EXISTS update_vendor_contracts_updated_at ON public.vendor_contracts;
DROP TRIGGER IF EXISTS update_accreditation_assessments_updated_at ON public.accreditation_assessments;
DROP TRIGGER IF EXISTS update_quality_indicators_updated_at ON public.quality_indicators;
DROP TRIGGER IF EXISTS update_quality_improvement_actions_updated_at ON public.quality_improvement_actions;
DROP TRIGGER IF EXISTS update_safety_incidents_updated_at ON public.safety_incidents;
DROP TRIGGER IF EXISTS update_consent_templates_updated_at ON public.consent_templates;
DROP TRIGGER IF EXISTS update_patient_consents_updated_at ON public.patient_consents;

CREATE TRIGGER update_sterilization_items_updated_at BEFORE UPDATE ON public.sterilization_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sterilization_batches_updated_at BEFORE UPDATE ON public.sterilization_batches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_linen_inventory_updated_at BEFORE UPDATE ON public.linen_inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_laundry_batches_updated_at BEFORE UPDATE ON public.laundry_batches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_maintenance_assets_updated_at BEFORE UPDATE ON public.maintenance_assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_maintenance_requests_updated_at BEFORE UPDATE ON public.maintenance_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vendor_contracts_updated_at BEFORE UPDATE ON public.vendor_contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_accreditation_assessments_updated_at BEFORE UPDATE ON public.accreditation_assessments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quality_indicators_updated_at BEFORE UPDATE ON public.quality_indicators FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quality_improvement_actions_updated_at BEFORE UPDATE ON public.quality_improvement_actions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_safety_incidents_updated_at BEFORE UPDATE ON public.safety_incidents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_consent_templates_updated_at BEFORE UPDATE ON public.consent_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_patient_consents_updated_at BEFORE UPDATE ON public.patient_consents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- NUMBER GENERATORS
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_incident_number()
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
    SELECT LPAD((COALESCE(MAX(SUBSTRING(incident_number FROM 12)::INTEGER), 0) + 1)::TEXT, 4, '0')
    INTO sequence_part
    FROM public.safety_incidents
    WHERE incident_number LIKE 'INC-' || date_part || '-%';
    
    new_number := 'INC-' || date_part || '-' || sequence_part;
    RETURN new_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_consent_number()
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
    SELECT LPAD((COALESCE(MAX(SUBSTRING(consent_number FROM 12)::INTEGER), 0) + 1)::TEXT, 4, '0')
    INTO sequence_part
    FROM public.patient_consents
    WHERE consent_number LIKE 'CNS-' || date_part || '-%';
    
    new_number := 'CNS-' || date_part || '-' || sequence_part;
    RETURN new_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_maintenance_request_number()
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
    FROM public.maintenance_requests
    WHERE request_number LIKE 'MR-' || date_part || '-%';
    
    new_number := 'MR-' || date_part || '-' || sequence_part;
    RETURN new_number;
END;
$$;

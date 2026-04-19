
-- ===========================================
-- HOME CARE VISITS
-- ===========================================
CREATE TABLE public.home_care_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_number TEXT NOT NULL UNIQUE,
  patient_id UUID REFERENCES public.patients(id),
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  address TEXT NOT NULL,
  nurse_id UUID REFERENCES public.employees(id),
  nurse_name TEXT NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id),
  doctor_name TEXT,
  visit_date DATE NOT NULL,
  visit_time TIME NOT NULL,
  service_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  completion_notes TEXT,
  completed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.home_care_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view home care visits" ON public.home_care_visits FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert home care visits" ON public.home_care_visits FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update home care visits" ON public.home_care_visits FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete home care visits" ON public.home_care_visits FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE TRIGGER update_home_care_visits_updated_at BEFORE UPDATE ON public.home_care_visits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Generate visit number
CREATE OR REPLACE FUNCTION public.generate_home_care_visit_number()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE new_number TEXT; date_part TEXT; sequence_part TEXT;
BEGIN
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  SELECT LPAD((COALESCE(MAX(SUBSTRING(visit_number FROM 12)::INTEGER), 0) + 1)::TEXT, 4, '0')
  INTO sequence_part FROM public.home_care_visits WHERE visit_number LIKE 'HC-' || date_part || '-%';
  new_number := 'HC-' || date_part || '-' || sequence_part;
  RETURN new_number;
END; $$;

-- ===========================================
-- AMBULANCE FLEET
-- ===========================================
CREATE TABLE public.ambulance_fleet (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ambulance_code TEXT NOT NULL UNIQUE,
  plate_number TEXT NOT NULL,
  ambulance_type TEXT NOT NULL DEFAULT 'BLS',
  status TEXT NOT NULL DEFAULT 'available',
  driver_name TEXT,
  crew_names TEXT,
  equipment_status TEXT DEFAULT 'Lengkap',
  last_service_date DATE,
  next_service_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ambulance_fleet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view ambulance fleet" ON public.ambulance_fleet FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert ambulance fleet" ON public.ambulance_fleet FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update ambulance fleet" ON public.ambulance_fleet FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete ambulance fleet" ON public.ambulance_fleet FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE TRIGGER update_ambulance_fleet_updated_at BEFORE UPDATE ON public.ambulance_fleet FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- AMBULANCE DISPATCHES
-- ===========================================
CREATE TABLE public.ambulance_dispatches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dispatch_number TEXT NOT NULL UNIQUE,
  ambulance_id UUID REFERENCES public.ambulance_fleet(id),
  patient_info TEXT NOT NULL,
  pickup_location TEXT NOT NULL,
  destination TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'pending',
  caller_name TEXT,
  caller_phone TEXT,
  request_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  dispatch_time TIMESTAMPTZ,
  arrival_time TIMESTAMPTZ,
  completion_time TIMESTAMPTZ,
  notes TEXT,
  dispatched_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ambulance_dispatches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view dispatches" ON public.ambulance_dispatches FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert dispatches" ON public.ambulance_dispatches FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update dispatches" ON public.ambulance_dispatches FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete dispatches" ON public.ambulance_dispatches FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE TRIGGER update_ambulance_dispatches_updated_at BEFORE UPDATE ON public.ambulance_dispatches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.generate_dispatch_number()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE new_number TEXT; date_part TEXT; sequence_part TEXT;
BEGIN
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  SELECT LPAD((COALESCE(MAX(SUBSTRING(dispatch_number FROM 13)::INTEGER), 0) + 1)::TEXT, 4, '0')
  INTO sequence_part FROM public.ambulance_dispatches WHERE dispatch_number LIKE 'DSP-' || date_part || '-%';
  new_number := 'DSP-' || date_part || '-' || sequence_part;
  RETURN new_number;
END; $$;

-- ===========================================
-- PURCHASE REQUESTS
-- ===========================================
CREATE TABLE public.purchase_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pr_number TEXT NOT NULL UNIQUE,
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  requester_id UUID,
  requester_name TEXT NOT NULL,
  department TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'pending_head',
  total_estimate DECIMAL(18,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view PRs" ON public.purchase_requests FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert PRs" ON public.purchase_requests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update PRs" ON public.purchase_requests FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete PRs" ON public.purchase_requests FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE TRIGGER update_purchase_requests_updated_at BEFORE UPDATE ON public.purchase_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.generate_pr_number()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE new_number TEXT; date_part TEXT; sequence_part TEXT;
BEGIN
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  SELECT LPAD((COALESCE(MAX(SUBSTRING(pr_number FROM 12)::INTEGER), 0) + 1)::TEXT, 4, '0')
  INTO sequence_part FROM public.purchase_requests WHERE pr_number LIKE 'PR-' || date_part || '-%';
  new_number := 'PR-' || date_part || '-' || sequence_part;
  RETURN new_number;
END; $$;

-- ===========================================
-- PURCHASE REQUEST ITEMS
-- ===========================================
CREATE TABLE public.purchase_request_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pr_id UUID NOT NULL REFERENCES public.purchase_requests(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'Pcs',
  estimated_price DECIMAL(18,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.purchase_request_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view PR items" ON public.purchase_request_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert PR items" ON public.purchase_request_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update PR items" ON public.purchase_request_items FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete PR items" ON public.purchase_request_items FOR DELETE USING (auth.uid() IS NOT NULL);

-- ===========================================
-- PURCHASE REQUEST APPROVALS
-- ===========================================
CREATE TABLE public.purchase_request_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pr_id UUID NOT NULL REFERENCES public.purchase_requests(id) ON DELETE CASCADE,
  approval_level INTEGER NOT NULL,
  role_name TEXT NOT NULL,
  approver_name TEXT,
  approver_id UUID,
  status TEXT NOT NULL DEFAULT 'waiting',
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.purchase_request_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view PR approvals" ON public.purchase_request_approvals FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert PR approvals" ON public.purchase_request_approvals FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update PR approvals" ON public.purchase_request_approvals FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete PR approvals" ON public.purchase_request_approvals FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE TRIGGER update_pr_approvals_updated_at BEFORE UPDATE ON public.purchase_request_approvals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

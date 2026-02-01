
-- Create enum for insurance types
CREATE TYPE insurance_type AS ENUM ('bpjs', 'jasa_raharja', 'private', 'corporate');

-- Create enum for insurance claim status
CREATE TYPE insurance_claim_status AS ENUM ('draft', 'submitted', 'verified', 'approved', 'partial', 'rejected', 'paid');

-- Table for insurance providers
CREATE TABLE public.insurance_providers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type insurance_type NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    pic_name VARCHAR(100),
    pic_phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for patient insurances (multiple per patient)
CREATE TABLE public.patient_insurances (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES public.insurance_providers(id),
    policy_number VARCHAR(50) NOT NULL,
    member_id VARCHAR(50),
    class VARCHAR(20),
    is_primary BOOLEAN DEFAULT false,
    valid_from DATE,
    valid_until DATE,
    coverage_percentage NUMERIC(5,2) DEFAULT 100,
    max_coverage NUMERIC(15,2),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(patient_id, provider_id, policy_number)
);

-- Table for insurance claims (flexible for all insurance types)
CREATE TABLE public.insurance_claims (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    claim_number VARCHAR(30) UNIQUE NOT NULL,
    patient_id UUID NOT NULL REFERENCES public.patients(id),
    visit_id UUID NOT NULL REFERENCES public.visits(id),
    patient_insurance_id UUID NOT NULL REFERENCES public.patient_insurances(id),
    claim_date DATE DEFAULT CURRENT_DATE,
    claim_amount NUMERIC(15,2) NOT NULL,
    approved_amount NUMERIC(15,2),
    paid_amount NUMERIC(15,2),
    patient_responsibility NUMERIC(15,2) DEFAULT 0,
    status insurance_claim_status DEFAULT 'draft',
    priority_order INTEGER DEFAULT 1,
    submission_date DATE,
    verification_date DATE,
    approval_date DATE,
    payment_date DATE,
    rejection_reason TEXT,
    sep_number VARCHAR(30),
    inacbg_code VARCHAR(20),
    inacbg_description TEXT,
    lp_number VARCHAR(30),
    accident_date DATE,
    accident_location TEXT,
    police_report_number VARCHAR(50),
    documents JSONB DEFAULT '[]',
    notes TEXT,
    created_by UUID,
    verified_by UUID,
    approved_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for better query performance
CREATE INDEX idx_patient_insurances_patient ON public.patient_insurances(patient_id);
CREATE INDEX idx_patient_insurances_provider ON public.patient_insurances(provider_id);
CREATE INDEX idx_insurance_claims_patient ON public.insurance_claims(patient_id);
CREATE INDEX idx_insurance_claims_visit ON public.insurance_claims(visit_id);
CREATE INDEX idx_insurance_claims_status ON public.insurance_claims(status);
CREATE INDEX idx_insurance_claims_date ON public.insurance_claims(claim_date);

-- Enable RLS
ALTER TABLE public.insurance_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_insurances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;

-- RLS Policies for insurance_providers (read by all authenticated, write by admin)
CREATE POLICY "Authenticated users can view insurance providers"
ON public.insurance_providers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin can manage insurance providers"
ON public.insurance_providers FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for patient_insurances
CREATE POLICY "Staff can view all patient insurances"
ON public.patient_insurances FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Staff can manage patient insurances"
ON public.patient_insurances FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- RLS Policies for insurance_claims
CREATE POLICY "Staff can view all insurance claims"
ON public.insurance_claims FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Staff can manage insurance claims"
ON public.insurance_claims FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Function to generate insurance claim number
CREATE OR REPLACE FUNCTION public.generate_insurance_claim_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    new_number TEXT;
    date_part TEXT;
    sequence_part TEXT;
BEGIN
    date_part := TO_CHAR(NOW(), 'YYYYMMDD');
    SELECT LPAD((COALESCE(MAX(SUBSTRING(claim_number FROM 13)::INTEGER), 0) + 1)::TEXT, 4, '0')
    INTO sequence_part
    FROM public.insurance_claims
    WHERE claim_number LIKE 'ICL-' || date_part || '-%';
    
    new_number := 'ICL-' || date_part || '-' || sequence_part;
    RETURN new_number;
END;
$function$;

-- Trigger for updated_at
CREATE TRIGGER update_insurance_providers_updated_at
    BEFORE UPDATE ON public.insurance_providers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patient_insurances_updated_at
    BEFORE UPDATE ON public.patient_insurances
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_insurance_claims_updated_at
    BEFORE UPDATE ON public.insurance_claims
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default insurance providers
INSERT INTO public.insurance_providers (code, name, type, is_active) VALUES
('BPJS-KES', 'BPJS Kesehatan', 'bpjs', true),
('JASA-RAHARJA', 'PT Jasa Raharja', 'jasa_raharja', true),
('PRUDENTIAL', 'Prudential Indonesia', 'private', true),
('AXA', 'AXA Mandiri', 'private', true),
('ALLIANZ', 'Allianz Indonesia', 'private', true),
('MANULIFE', 'Manulife Indonesia', 'private', true),
('ADMEDIKA', 'AdMedika', 'private', true);

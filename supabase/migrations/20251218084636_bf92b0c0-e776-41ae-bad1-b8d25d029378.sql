
-- Fix function search_path security warnings
CREATE OR REPLACE FUNCTION public.generate_medical_record_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_number TEXT;
    year_part TEXT;
    sequence_part TEXT;
BEGIN
    year_part := TO_CHAR(NOW(), 'YYYY');
    SELECT LPAD((COALESCE(MAX(SUBSTRING(medical_record_number FROM 9)::INTEGER), 0) + 1)::TEXT, 6, '0')
    INTO sequence_part
    FROM public.patients
    WHERE medical_record_number LIKE 'RM-' || year_part || '-%';
    
    new_number := 'RM-' || year_part || '-' || sequence_part;
    RETURN new_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_visit_number()
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
    SELECT LPAD((COALESCE(MAX(SUBSTRING(visit_number FROM 13)::INTEGER), 0) + 1)::TEXT, 4, '0')
    INTO sequence_part
    FROM public.visits
    WHERE visit_number LIKE 'VIS-' || date_part || '-%';
    
    new_number := 'VIS-' || date_part || '-' || sequence_part;
    RETURN new_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

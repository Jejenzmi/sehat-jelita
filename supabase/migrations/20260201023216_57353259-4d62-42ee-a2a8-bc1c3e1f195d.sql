-- Create employees table for SDM/HRD
CREATE TABLE public.employees (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    employee_number TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    nik TEXT,
    birth_date DATE,
    birth_place TEXT,
    gender TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    department_id UUID REFERENCES public.departments(id),
    position TEXT NOT NULL,
    employment_type TEXT NOT NULL DEFAULT 'permanent',
    join_date DATE NOT NULL,
    end_date DATE,
    salary NUMERIC(15,2),
    bank_name TEXT,
    bank_account TEXT,
    npwp TEXT,
    bpjs_kesehatan TEXT,
    bpjs_ketenagakerjaan TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create system_settings table
CREATE TABLE public.system_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    setting_type TEXT NOT NULL DEFAULT 'general',
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create queue_tickets table for Antrian
CREATE TABLE public.queue_tickets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_number TEXT NOT NULL,
    patient_id UUID REFERENCES public.patients(id),
    visit_id UUID REFERENCES public.visits(id),
    department_id UUID REFERENCES public.departments(id),
    doctor_id UUID REFERENCES public.doctors(id),
    service_type TEXT NOT NULL,
    queue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    called_at TIMESTAMP WITH TIME ZONE,
    served_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    counter_number TEXT,
    status TEXT NOT NULL DEFAULT 'waiting',
    priority INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint for queue per day per service
ALTER TABLE public.queue_tickets ADD CONSTRAINT queue_tickets_unique_daily 
    UNIQUE (ticket_number, queue_date, service_type);

-- Generate employee number function
CREATE OR REPLACE FUNCTION public.generate_employee_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    new_number TEXT;
    sequence_part TEXT;
BEGIN
    SELECT LPAD((COALESCE(MAX(SUBSTRING(employee_number FROM 5)::INTEGER), 0) + 1)::TEXT, 6, '0')
    INTO sequence_part
    FROM public.employees;
    
    new_number := 'EMP-' || sequence_part;
    RETURN new_number;
END;
$$;

-- Generate queue ticket number function
CREATE OR REPLACE FUNCTION public.generate_queue_number(p_service_type TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    new_number TEXT;
    prefix TEXT;
    sequence_part INTEGER;
BEGIN
    CASE p_service_type
        WHEN 'rawat_jalan' THEN prefix := 'A';
        WHEN 'farmasi' THEN prefix := 'F';
        WHEN 'laboratorium' THEN prefix := 'L';
        WHEN 'radiologi' THEN prefix := 'R';
        WHEN 'kasir' THEN prefix := 'K';
        ELSE prefix := 'Q';
    END CASE;
    
    SELECT COALESCE(MAX(SUBSTRING(ticket_number FROM 2)::INTEGER), 0) + 1
    INTO sequence_part
    FROM public.queue_tickets
    WHERE queue_date = CURRENT_DATE
    AND service_type = p_service_type;
    
    new_number := prefix || LPAD(sequence_part::TEXT, 3, '0');
    RETURN new_number;
END;
$$;

-- Generate billing invoice number function
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    new_number TEXT;
    date_part TEXT;
    sequence_part TEXT;
BEGIN
    date_part := TO_CHAR(NOW(), 'YYYYMMDD');
    SELECT LPAD((COALESCE(MAX(SUBSTRING(invoice_number FROM 13)::INTEGER), 0) + 1)::TEXT, 4, '0')
    INTO sequence_part
    FROM public.billings
    WHERE invoice_number LIKE 'INV-' || date_part || '-%';
    
    new_number := 'INV-' || date_part || '-' || sequence_part;
    RETURN new_number;
END;
$$;

-- Generate lab number function
CREATE OR REPLACE FUNCTION public.generate_lab_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    new_number TEXT;
    date_part TEXT;
    sequence_part TEXT;
BEGIN
    date_part := TO_CHAR(NOW(), 'YYYYMMDD');
    SELECT LPAD((COALESCE(MAX(SUBSTRING(lab_number FROM 12)::INTEGER), 0) + 1)::TEXT, 4, '0')
    INTO sequence_part
    FROM public.lab_results
    WHERE lab_number LIKE 'LAB-' || date_part || '-%';
    
    new_number := 'LAB-' || date_part || '-' || sequence_part;
    RETURN new_number;
END;
$$;

-- Generate BPJS claim number function
CREATE OR REPLACE FUNCTION public.generate_claim_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    new_number TEXT;
    date_part TEXT;
    sequence_part TEXT;
BEGIN
    date_part := TO_CHAR(NOW(), 'YYYYMMDD');
    SELECT LPAD((COALESCE(MAX(SUBSTRING(claim_number FROM 13)::INTEGER), 0) + 1)::TEXT, 4, '0')
    INTO sequence_part
    FROM public.bpjs_claims
    WHERE claim_number LIKE 'CLM-' || date_part || '-%';
    
    new_number := 'CLM-' || date_part || '-' || sequence_part;
    RETURN new_number;
END;
$$;

-- Enable RLS on new tables
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_tickets ENABLE ROW LEVEL SECURITY;

-- RLS policies for employees
CREATE POLICY "Staff can view employees"
ON public.employees FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin can insert employees"
ON public.employees FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Admin can update employees"
ON public.employees FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Admin can delete employees"
ON public.employees FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- RLS policies for system_settings
CREATE POLICY "Anyone can view public settings"
ON public.system_settings FOR SELECT
TO authenticated
USING (is_public = true OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Admin can insert settings"
ON public.system_settings FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Admin can update settings"
ON public.system_settings FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Admin can delete settings"
ON public.system_settings FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- RLS policies for queue_tickets
CREATE POLICY "Staff can view queue tickets"
ON public.queue_tickets FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Staff can insert queue tickets"
ON public.queue_tickets FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Staff can update queue tickets"
ON public.queue_tickets FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Staff can delete queue tickets"
ON public.queue_tickets FOR DELETE
TO authenticated
USING (true);

-- Create indexes for performance
CREATE INDEX idx_employees_department ON public.employees(department_id);
CREATE INDEX idx_employees_status ON public.employees(status);
CREATE INDEX idx_employees_user ON public.employees(user_id);

CREATE INDEX idx_queue_date ON public.queue_tickets(queue_date);
CREATE INDEX idx_queue_status ON public.queue_tickets(status);
CREATE INDEX idx_queue_service ON public.queue_tickets(service_type);

-- Enable realtime for queue updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_tickets;
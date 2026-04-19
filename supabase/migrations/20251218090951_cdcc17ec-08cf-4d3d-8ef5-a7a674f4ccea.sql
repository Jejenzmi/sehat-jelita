-- Create lab_templates table
CREATE TABLE public.lab_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT,
    parameters JSONB NOT NULL DEFAULT '[]',
    normal_values JSONB,
    price NUMERIC DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lab_results table
CREATE TABLE public.lab_results (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id),
    visit_id UUID NOT NULL REFERENCES public.visits(id),
    medical_record_id UUID REFERENCES public.medical_records(id),
    template_id UUID NOT NULL REFERENCES public.lab_templates(id),
    lab_number TEXT NOT NULL,
    request_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    sample_date TIMESTAMP WITH TIME ZONE,
    result_date TIMESTAMP WITH TIME ZONE,
    results JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sample_taken', 'processing', 'completed', 'cancelled')),
    notes TEXT,
    requested_by UUID,
    processed_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inpatient_admissions table for better tracking
CREATE TABLE public.inpatient_admissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id),
    visit_id UUID NOT NULL REFERENCES public.visits(id),
    bed_id UUID REFERENCES public.beds(id),
    room_id UUID NOT NULL REFERENCES public.rooms(id),
    admission_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    planned_discharge_date DATE,
    actual_discharge_date TIMESTAMP WITH TIME ZONE,
    discharge_type TEXT CHECK (discharge_type IN ('sembuh', 'rujuk', 'pulang_paksa', 'meninggal', 'lain')),
    discharge_summary TEXT,
    attending_doctor_id UUID REFERENCES public.doctors(id),
    nursing_notes TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'discharged', 'transferred')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table for real-time alerts
CREATE TABLE public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('low_stock', 'queue_update', 'lab_result', 'emergency', 'general')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    target_roles TEXT[],
    target_user_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lab_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inpatient_admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lab_templates
CREATE POLICY "Everyone can view lab templates"
ON public.lab_templates FOR SELECT
USING (true);

CREATE POLICY "Lab staff can manage templates"
ON public.lab_templates FOR ALL
USING (has_role(auth.uid(), 'laboratorium') OR has_role(auth.uid(), 'admin'));

-- RLS Policies for lab_results
CREATE POLICY "Staff can view lab results"
ON public.lab_results FOR SELECT
USING (true);

CREATE POLICY "Lab staff can manage results"
ON public.lab_results FOR ALL
USING (has_role(auth.uid(), 'laboratorium') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dokter'));

-- RLS Policies for inpatient_admissions
CREATE POLICY "Staff can view admissions"
ON public.inpatient_admissions FOR SELECT
USING (true);

CREATE POLICY "Staff can manage admissions"
ON public.inpatient_admissions FOR ALL
USING (has_role(auth.uid(), 'dokter') OR has_role(auth.uid(), 'perawat') OR has_role(auth.uid(), 'admin'));

-- RLS Policies for notifications
CREATE POLICY "Users can view their notifications"
ON public.notifications FOR SELECT
USING (target_user_id = auth.uid() OR target_user_id IS NULL);

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (target_user_id = auth.uid() OR target_user_id IS NULL);

-- Create indexes for performance
CREATE INDEX idx_lab_results_patient ON public.lab_results(patient_id);
CREATE INDEX idx_lab_results_visit ON public.lab_results(visit_id);
CREATE INDEX idx_lab_results_status ON public.lab_results(status);
CREATE INDEX idx_inpatient_admissions_patient ON public.inpatient_admissions(patient_id);
CREATE INDEX idx_inpatient_admissions_status ON public.inpatient_admissions(status);
CREATE INDEX idx_notifications_target_user ON public.notifications(target_user_id);
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

-- Create triggers for updated_at
CREATE TRIGGER update_lab_results_updated_at
BEFORE UPDATE ON public.lab_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inpatient_admissions_updated_at
BEFORE UPDATE ON public.inpatient_admissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for notifications, visits (queue), and medicines (stock)
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.visits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.medicines;
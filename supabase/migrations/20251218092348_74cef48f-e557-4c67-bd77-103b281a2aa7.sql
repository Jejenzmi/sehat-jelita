
-- Add user_id to patients table for patient self-service portal
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Create index for faster lookup
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON public.patients(user_id);

-- Add QR code token to prescriptions for pharmacy pickup
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS qr_token text UNIQUE;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS qr_generated_at timestamp with time zone;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS pickup_code text;

-- Create function to generate QR token
CREATE OR REPLACE FUNCTION public.generate_prescription_qr_token()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.qr_token := encode(gen_random_bytes(16), 'hex');
  NEW.qr_generated_at := now();
  NEW.pickup_code := upper(substring(encode(gen_random_bytes(3), 'hex') from 1 for 6));
  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate QR token
DROP TRIGGER IF EXISTS generate_prescription_qr ON public.prescriptions;
CREATE TRIGGER generate_prescription_qr
  BEFORE INSERT ON public.prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_prescription_qr_token();

-- RLS policy for patients to view their own lab results
CREATE POLICY "Patients can view own lab results"
ON public.lab_results
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = lab_results.patient_id
    AND p.user_id = auth.uid()
  )
);

-- RLS policy for patients to view their own medical records
CREATE POLICY "Patients can view own medical records"
ON public.medical_records
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = medical_records.patient_id
    AND p.user_id = auth.uid()
  )
);

-- RLS policy for patients to view their own prescriptions
CREATE POLICY "Patients can view own prescriptions"
ON public.prescriptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = prescriptions.patient_id
    AND p.user_id = auth.uid()
  )
);

-- RLS policy for patients to view their own appointments
CREATE POLICY "Patients can view own appointments"
ON public.appointments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = appointments.patient_id
    AND p.user_id = auth.uid()
  )
);

-- RLS policy for patients to create their own appointments
CREATE POLICY "Patients can create own appointments"
ON public.appointments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = patient_id
    AND p.user_id = auth.uid()
  )
);

-- RLS policy for patients to view their own visits
CREATE POLICY "Patients can view own visits"
ON public.visits
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = visits.patient_id
    AND p.user_id = auth.uid()
  )
);

-- RLS policy for patients to view their own patient data
CREATE POLICY "Patients can view own patient data"
ON public.patients
FOR SELECT
USING (user_id = auth.uid());

-- RLS policy for patients to update own patient data
CREATE POLICY "Patients can update own patient data"
ON public.patients
FOR UPDATE
USING (user_id = auth.uid());

-- Create patient_portal_sessions for tracking patient logins
CREATE TABLE IF NOT EXISTS public.patient_portal_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  login_at timestamp with time zone DEFAULT now(),
  ip_address text,
  user_agent text
);

ALTER TABLE public.patient_portal_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own sessions"
ON public.patient_portal_sessions
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "System can insert sessions"
ON public.patient_portal_sessions
FOR INSERT
WITH CHECK (true);

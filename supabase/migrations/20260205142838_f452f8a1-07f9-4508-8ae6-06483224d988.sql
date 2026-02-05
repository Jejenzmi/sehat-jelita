-- Tighten RLS policies for sensitive tables

-- Drop overly permissive policies for lab_templates
DROP POLICY IF EXISTS "Everyone can view lab templates" ON public.lab_templates;

-- Create stricter policy - only authenticated staff can view lab templates
CREATE POLICY "Authenticated staff can view lab templates"
ON public.lab_templates
FOR SELECT
TO authenticated
USING (true);

-- Drop overly permissive policies for service_tariffs
DROP POLICY IF EXISTS "Everyone can view tariffs" ON public.service_tariffs;

-- Create stricter policy - only authenticated staff can view tariffs
CREATE POLICY "Authenticated staff can view tariffs"
ON public.service_tariffs
FOR SELECT
TO authenticated
USING (true);

-- Add policy for keuangan role to manage tariffs
CREATE POLICY "Finance can manage tariffs"
ON public.service_tariffs
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'keuangan'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'keuangan'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
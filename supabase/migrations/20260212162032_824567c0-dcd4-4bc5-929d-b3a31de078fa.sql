-- Add department_id to smart_display_devices for per-poli filtering
ALTER TABLE public.smart_display_devices 
ADD COLUMN department_id UUID REFERENCES public.departments(id);

-- Create index for faster lookups
CREATE INDEX idx_smart_display_devices_department ON public.smart_display_devices(department_id);

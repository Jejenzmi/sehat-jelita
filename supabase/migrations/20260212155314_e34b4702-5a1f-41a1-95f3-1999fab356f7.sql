
-- Create table for registered display devices (TVs)
CREATE TABLE IF NOT EXISTS public.smart_display_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_code TEXT NOT NULL UNIQUE,
  device_name TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  enabled_modules TEXT[] NOT NULL DEFAULT ARRAY['lobby','ward','pharmacy','schedule'],
  display_type TEXT NOT NULL DEFAULT 'lobby',
  is_active BOOLEAN NOT NULL DEFAULT true,
  auto_rotate BOOLEAN NOT NULL DEFAULT false,
  rotate_interval INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.smart_display_devices ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view devices (display pages need to read)
CREATE POLICY "Authenticated users can view display devices"
ON public.smart_display_devices FOR SELECT TO authenticated
USING (true);

-- Only admin/manajemen can manage
CREATE POLICY "Admins can insert display devices"
ON public.smart_display_devices FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manajemen'));

CREATE POLICY "Admins can update display devices"
ON public.smart_display_devices FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manajemen'));

CREATE POLICY "Admins can delete display devices"
ON public.smart_display_devices FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manajemen'));

-- Link media to specific devices (optional, null = all devices)
ALTER TABLE public.smart_display_media ADD COLUMN IF NOT EXISTS device_id UUID REFERENCES public.smart_display_devices(id) ON DELETE SET NULL;

-- Seed some default devices
INSERT INTO public.smart_display_devices (device_code, device_name, location, enabled_modules, display_type) VALUES
  ('LOBBY-01', 'TV Lobby Utama', 'Lobby Lantai 1', ARRAY['lobby','schedule'], 'lobby'),
  ('FARMASI-01', 'TV Farmasi', 'Instalasi Farmasi', ARRAY['pharmacy'], 'pharmacy'),
  ('IGD-01', 'TV IGD', 'Instalasi Gawat Darurat', ARRAY['ward'], 'ward'),
  ('JADWAL-01', 'TV Jadwal Dokter', 'Koridor Poliklinik', ARRAY['schedule'], 'schedule');

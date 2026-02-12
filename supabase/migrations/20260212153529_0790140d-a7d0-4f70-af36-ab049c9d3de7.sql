-- Create smart_display_config table
CREATE TABLE public.smart_display_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_type VARCHAR(50) NOT NULL DEFAULT 'lobby',
  running_text TEXT,
  running_text_enabled BOOLEAN DEFAULT TRUE,
  slideshow_enabled BOOLEAN DEFAULT TRUE,
  slideshow_interval INT DEFAULT 5,
  video_enabled BOOLEAN DEFAULT TRUE,
  video_auto_play BOOLEAN DEFAULT TRUE,
  auto_refresh BOOLEAN DEFAULT TRUE,
  auto_refresh_interval INT DEFAULT 30,
  custom_config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.smart_display_config ENABLE ROW LEVEL SECURITY;

-- Admin/manajemen can manage
CREATE POLICY "Admin can manage smart display config"
ON public.smart_display_config
FOR ALL
TO authenticated
USING (
  public.has_any_role(auth.uid(), ARRAY['admin', 'manajemen']::app_role[])
);

-- Public can view (for display screens)
CREATE POLICY "Public can view smart display config"
ON public.smart_display_config
FOR SELECT
TO anon
USING (TRUE);

-- Authenticated can also view
CREATE POLICY "Authenticated can view smart display config"
ON public.smart_display_config
FOR SELECT
TO authenticated
USING (TRUE);

CREATE TRIGGER update_smart_display_config_updated_at
BEFORE UPDATE ON public.smart_display_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default config for lobby
INSERT INTO public.smart_display_config (display_type, running_text, running_text_enabled, slideshow_enabled, video_enabled)
VALUES ('lobby', 'Selamat datang di Rumah Sakit — Utamakan Kesehatan Anda', TRUE, TRUE, TRUE);
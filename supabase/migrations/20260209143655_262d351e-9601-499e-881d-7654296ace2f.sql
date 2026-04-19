
-- Table for Form Builder templates
CREATE TABLE public.custom_form_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'umum',
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for Report Builder templates
CREATE TABLE public.custom_report_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  data_source TEXT NOT NULL,
  columns JSONB NOT NULL DEFAULT '[]'::jsonb,
  filters JSONB NOT NULL DEFAULT '[]'::jsonb,
  chart_type TEXT NOT NULL DEFAULT 'table',
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for DICOM/PACS server configurations
CREATE TABLE public.dicom_server_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  server_name TEXT NOT NULL,
  server_type TEXT NOT NULL DEFAULT 'pacs', -- pacs, ris, lis
  host TEXT NOT NULL,
  port INTEGER NOT NULL DEFAULT 4242,
  ae_title TEXT,
  protocol TEXT DEFAULT 'DICOM',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_status TEXT DEFAULT 'disconnected',
  last_checked_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for Smart Display configurations
CREATE TABLE public.smart_display_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  display_name TEXT NOT NULL,
  display_type TEXT NOT NULL DEFAULT 'lobby', -- lobby, ward, pharmacy, schedule
  location TEXT,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  auto_refresh_seconds INTEGER NOT NULL DEFAULT 30,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dicom_server_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_display_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies - authenticated users can read all, create/update/delete own
CREATE POLICY "Authenticated users can view form templates" ON public.custom_form_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create form templates" ON public.custom_form_templates FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own form templates" ON public.custom_form_templates FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own form templates" ON public.custom_form_templates FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Authenticated users can view report templates" ON public.custom_report_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create report templates" ON public.custom_report_templates FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own report templates" ON public.custom_report_templates FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own report templates" ON public.custom_report_templates FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Authenticated users can view dicom configs" ON public.dicom_server_configs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage dicom configs" ON public.dicom_server_configs FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view display configs" ON public.smart_display_configs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage display configs" ON public.smart_display_configs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_custom_form_templates_updated_at BEFORE UPDATE ON public.custom_form_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_custom_report_templates_updated_at BEFORE UPDATE ON public.custom_report_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_dicom_server_configs_updated_at BEFORE UPDATE ON public.dicom_server_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_smart_display_configs_updated_at BEFORE UPDATE ON public.smart_display_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

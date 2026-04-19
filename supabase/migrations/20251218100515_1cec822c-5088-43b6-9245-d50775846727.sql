-- Create SATU SEHAT sync tracking tables

-- Table for tracking sync status per resource type
CREATE TABLE public.satusehat_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  local_table TEXT NOT NULL,
  satusehat_id TEXT,
  action TEXT NOT NULL, -- 'create', 'update', 'delete'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'synced', 'failed', 'validation_error'
  request_payload JSONB,
  response_payload JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for SATU SEHAT configuration
CREATE TABLE public.satusehat_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'staging', -- 'staging' or 'production'
  auto_sync_enabled BOOLEAN DEFAULT false,
  sync_interval_minutes INTEGER DEFAULT 30,
  last_token_refresh TIMESTAMP WITH TIME ZONE,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for SATU SEHAT resource mappings (local ID to SATU SEHAT ID)
CREATE TABLE public.satusehat_resource_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_type TEXT NOT NULL, -- 'Patient', 'Practitioner', 'Organization', 'Location', 'Encounter', etc.
  local_id UUID NOT NULL,
  satusehat_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(resource_type, local_id),
  UNIQUE(resource_type, satusehat_id)
);

-- Table for tracking daily sync statistics
CREATE TABLE public.satusehat_sync_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_date DATE NOT NULL DEFAULT CURRENT_DATE,
  resource_type TEXT NOT NULL,
  synced_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  pending_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sync_date, resource_type)
);

-- Enable RLS on all tables
ALTER TABLE public.satusehat_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.satusehat_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.satusehat_resource_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.satusehat_sync_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sync_logs
CREATE POLICY "Admins can manage sync logs"
  ON public.satusehat_sync_logs
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view sync logs"
  ON public.satusehat_sync_logs
  FOR SELECT
  USING (true);

-- RLS Policies for config
CREATE POLICY "Admins can manage config"
  ON public.satusehat_config
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view config"
  ON public.satusehat_config
  FOR SELECT
  USING (true);

-- RLS Policies for resource_mappings
CREATE POLICY "Admins can manage mappings"
  ON public.satusehat_resource_mappings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view mappings"
  ON public.satusehat_resource_mappings
  FOR SELECT
  USING (true);

-- RLS Policies for sync_stats
CREATE POLICY "Admins can manage sync stats"
  ON public.satusehat_sync_stats
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view sync stats"
  ON public.satusehat_sync_stats
  FOR SELECT
  USING (true);

-- Create indexes for better query performance
CREATE INDEX idx_sync_logs_resource_type ON public.satusehat_sync_logs(resource_type);
CREATE INDEX idx_sync_logs_status ON public.satusehat_sync_logs(status);
CREATE INDEX idx_sync_logs_created_at ON public.satusehat_sync_logs(created_at DESC);
CREATE INDEX idx_resource_mappings_type ON public.satusehat_resource_mappings(resource_type);
CREATE INDEX idx_resource_mappings_local_id ON public.satusehat_resource_mappings(local_id);
CREATE INDEX idx_sync_stats_date ON public.satusehat_sync_stats(sync_date DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_satusehat_sync_logs_updated_at
  BEFORE UPDATE ON public.satusehat_sync_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_satusehat_config_updated_at
  BEFORE UPDATE ON public.satusehat_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_satusehat_resource_mappings_updated_at
  BEFORE UPDATE ON public.satusehat_resource_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_satusehat_sync_stats_updated_at
  BEFORE UPDATE ON public.satusehat_sync_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
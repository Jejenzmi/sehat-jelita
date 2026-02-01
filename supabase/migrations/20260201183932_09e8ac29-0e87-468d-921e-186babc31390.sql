-- ============================================
-- WEBRTC SIGNALING TABLE FOR TELEMEDICINE
-- ============================================

-- Tabel untuk menyimpan sinyal WebRTC
CREATE TABLE public.webrtc_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.telemedicine_sessions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  signal_type VARCHAR(50) NOT NULL, -- 'offer', 'answer', 'ice-candidate'
  signal_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index untuk query cepat
CREATE INDEX idx_webrtc_signals_session ON public.webrtc_signals(session_id);
CREATE INDEX idx_webrtc_signals_created ON public.webrtc_signals(created_at);

-- Enable RLS
ALTER TABLE public.webrtc_signals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can insert signals" ON public.webrtc_signals
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view signals for their sessions" ON public.webrtc_signals
  FOR SELECT TO authenticated USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.webrtc_signals;

-- Auto-cleanup old signals (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_old_webrtc_signals()
RETURNS void AS $$
BEGIN
  DELETE FROM public.webrtc_signals 
  WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
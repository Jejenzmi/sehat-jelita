-- Create chat_rooms table for internal staff messaging
CREATE TABLE public.chat_rooms (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT,
    type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group', 'department')),
    department_id UUID REFERENCES public.departments(id),
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat_participants table
CREATE TABLE public.chat_participants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_read_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(room_id, user_id)
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    file_url TEXT,
    is_edited BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create radiology_templates table
CREATE TABLE public.radiology_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    modality TEXT NOT NULL CHECK (modality IN ('X-Ray', 'CT-Scan', 'MRI', 'USG', 'Mammography', 'Fluoroscopy')),
    body_part TEXT,
    protocol TEXT,
    price NUMERIC DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create radiology_results table
CREATE TABLE public.radiology_results (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id),
    visit_id UUID NOT NULL REFERENCES public.visits(id),
    medical_record_id UUID REFERENCES public.medical_records(id),
    template_id UUID NOT NULL REFERENCES public.radiology_templates(id),
    radiology_number TEXT NOT NULL,
    request_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    exam_date TIMESTAMP WITH TIME ZONE,
    result_date TIMESTAMP WITH TIME ZONE,
    findings TEXT,
    impression TEXT,
    recommendation TEXT,
    image_urls JSONB DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled')),
    contrast_used BOOLEAN DEFAULT false,
    contrast_type TEXT,
    radiation_dose TEXT,
    notes TEXT,
    requested_by UUID,
    performed_by UUID,
    reported_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create queue_display table for tracking queue state
CREATE TABLE public.queue_display (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    department_id UUID NOT NULL REFERENCES public.departments(id),
    current_number INTEGER DEFAULT 0,
    last_called_number INTEGER DEFAULT 0,
    counter_number INTEGER DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
    called_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radiology_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radiology_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_display ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_rooms
CREATE POLICY "Users can view rooms they participate in"
ON public.chat_rooms FOR SELECT
USING (EXISTS (SELECT 1 FROM public.chat_participants WHERE room_id = id AND user_id = auth.uid()));

CREATE POLICY "Authenticated users can create rooms"
ON public.chat_rooms FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for chat_participants
CREATE POLICY "Users can view participants in their rooms"
ON public.chat_participants FOR SELECT
USING (EXISTS (SELECT 1 FROM public.chat_participants cp WHERE cp.room_id = room_id AND cp.user_id = auth.uid()));

CREATE POLICY "Users can add participants"
ON public.chat_participants FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own participation"
ON public.chat_participants FOR UPDATE
USING (user_id = auth.uid());

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages in their rooms"
ON public.chat_messages FOR SELECT
USING (EXISTS (SELECT 1 FROM public.chat_participants WHERE room_id = chat_messages.room_id AND user_id = auth.uid()));

CREATE POLICY "Users can send messages to their rooms"
ON public.chat_messages FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.chat_participants WHERE room_id = chat_messages.room_id AND user_id = auth.uid()));

CREATE POLICY "Users can update own messages"
ON public.chat_messages FOR UPDATE
USING (sender_id = auth.uid());

-- RLS Policies for radiology_templates
CREATE POLICY "Everyone can view radiology templates"
ON public.radiology_templates FOR SELECT
USING (true);

CREATE POLICY "Radiology staff can manage templates"
ON public.radiology_templates FOR ALL
USING (has_role(auth.uid(), 'radiologi') OR has_role(auth.uid(), 'admin'));

-- RLS Policies for radiology_results
CREATE POLICY "Staff can view radiology results"
ON public.radiology_results FOR SELECT
USING (true);

CREATE POLICY "Radiology staff can manage results"
ON public.radiology_results FOR ALL
USING (has_role(auth.uid(), 'radiologi') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dokter'));

-- RLS Policies for queue_display
CREATE POLICY "Everyone can view queue display"
ON public.queue_display FOR SELECT
USING (true);

CREATE POLICY "Staff can manage queue"
ON public.queue_display FOR ALL
USING (has_role(auth.uid(), 'pendaftaran') OR has_role(auth.uid(), 'admin'));

-- Create indexes
CREATE INDEX idx_chat_messages_room ON public.chat_messages(room_id);
CREATE INDEX idx_chat_messages_created ON public.chat_messages(created_at DESC);
CREATE INDEX idx_chat_participants_user ON public.chat_participants(user_id);
CREATE INDEX idx_radiology_results_patient ON public.radiology_results(patient_id);
CREATE INDEX idx_radiology_results_status ON public.radiology_results(status);
CREATE INDEX idx_queue_display_department ON public.queue_display(department_id);

-- Create triggers
CREATE TRIGGER update_chat_rooms_updated_at
BEFORE UPDATE ON public.chat_rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at
BEFORE UPDATE ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_radiology_results_updated_at
BEFORE UPDATE ON public.radiology_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_queue_display_updated_at
BEFORE UPDATE ON public.queue_display
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for chat and queue
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_display;
-- Create appointments table for booking system
CREATE TABLE public.appointments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id),
    doctor_id UUID NOT NULL REFERENCES public.doctors(id),
    department_id UUID REFERENCES public.departments(id),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    end_time TIME,
    appointment_type TEXT NOT NULL DEFAULT 'regular' CHECK (appointment_type IN ('regular', 'telemedicine', 'follow_up', 'emergency')),
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    chief_complaint TEXT,
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT false,
    booking_source TEXT DEFAULT 'walk_in' CHECK (booking_source IN ('walk_in', 'online', 'phone', 'app')),
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create doctor_schedules table for calendar
CREATE TABLE public.doctor_schedules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id),
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration INTEGER NOT NULL DEFAULT 30,
    max_patients INTEGER DEFAULT 20,
    is_active BOOLEAN NOT NULL DEFAULT true,
    room_number TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create telemedicine_sessions table
CREATE TABLE public.telemedicine_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    appointment_id UUID NOT NULL REFERENCES public.appointments(id),
    patient_id UUID NOT NULL REFERENCES public.patients(id),
    doctor_id UUID NOT NULL REFERENCES public.doctors(id),
    session_token TEXT,
    room_name TEXT NOT NULL,
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'waiting', 'in_progress', 'completed', 'cancelled', 'failed')),
    patient_joined_at TIMESTAMP WITH TIME ZONE,
    doctor_joined_at TIMESTAMP WITH TIME ZONE,
    recording_url TEXT,
    notes TEXT,
    technical_issues TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create doctor_schedule_exceptions for holidays/leaves
CREATE TABLE public.doctor_schedule_exceptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id),
    exception_date DATE NOT NULL,
    exception_type TEXT NOT NULL CHECK (exception_type IN ('holiday', 'leave', 'training', 'emergency', 'other')),
    reason TEXT,
    is_available BOOLEAN NOT NULL DEFAULT false,
    alternative_start_time TIME,
    alternative_end_time TIME,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemedicine_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_schedule_exceptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for appointments
CREATE POLICY "Staff can view all appointments"
ON public.appointments FOR SELECT
USING (true);

CREATE POLICY "Staff can manage appointments"
ON public.appointments FOR ALL
USING (has_role(auth.uid(), 'pendaftaran') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dokter'));

-- RLS Policies for doctor_schedules
CREATE POLICY "Everyone can view schedules"
ON public.doctor_schedules FOR SELECT
USING (true);

CREATE POLICY "Admin can manage schedules"
ON public.doctor_schedules FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for telemedicine_sessions
CREATE POLICY "Staff can view telemedicine sessions"
ON public.telemedicine_sessions FOR SELECT
USING (true);

CREATE POLICY "Staff can manage telemedicine sessions"
ON public.telemedicine_sessions FOR ALL
USING (has_role(auth.uid(), 'dokter') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'pendaftaran'));

-- RLS Policies for doctor_schedule_exceptions
CREATE POLICY "Everyone can view exceptions"
ON public.doctor_schedule_exceptions FOR SELECT
USING (true);

CREATE POLICY "Admin and doctors can manage exceptions"
ON public.doctor_schedule_exceptions FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dokter'));

-- Create indexes
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON public.appointments(doctor_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_doctor_schedules_doctor ON public.doctor_schedules(doctor_id);
CREATE INDEX idx_telemedicine_sessions_appointment ON public.telemedicine_sessions(appointment_id);
CREATE INDEX idx_telemedicine_sessions_status ON public.telemedicine_sessions(status);

-- Create triggers
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_telemedicine_sessions_updated_at
BEFORE UPDATE ON public.telemedicine_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for appointments
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.telemedicine_sessions;
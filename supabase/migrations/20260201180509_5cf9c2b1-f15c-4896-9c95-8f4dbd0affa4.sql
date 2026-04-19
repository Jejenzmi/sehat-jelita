-- Tabel Komponen Gaji (Master)
CREATE TABLE IF NOT EXISTS public.salary_components (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    component_code TEXT NOT NULL UNIQUE,
    component_name TEXT NOT NULL,
    component_type TEXT NOT NULL CHECK (component_type IN ('allowance', 'deduction', 'benefit')),
    calculation_type TEXT NOT NULL CHECK (calculation_type IN ('fixed', 'percentage', 'formula')),
    base_amount NUMERIC DEFAULT 0,
    percentage NUMERIC DEFAULT 0,
    formula TEXT,
    is_taxable BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabel Grade/Golongan
CREATE TABLE IF NOT EXISTS public.employee_grades (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    grade_code TEXT NOT NULL UNIQUE,
    grade_name TEXT NOT NULL,
    level INTEGER NOT NULL,
    min_salary NUMERIC DEFAULT 0,
    max_salary NUMERIC DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabel Posisi/Jabatan dengan Remunerasi
CREATE TABLE IF NOT EXISTS public.positions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    position_code TEXT NOT NULL UNIQUE,
    position_name TEXT NOT NULL,
    department_id UUID REFERENCES public.departments(id),
    grade_id UUID REFERENCES public.employee_grades(id),
    base_salary NUMERIC DEFAULT 0,
    position_allowance NUMERIC DEFAULT 0,
    is_structural BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tambah kolom grade dan position_id ke employees
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS grade_id UUID REFERENCES public.employee_grades(id),
ADD COLUMN IF NOT EXISTS position_id UUID REFERENCES public.positions(id),
ADD COLUMN IF NOT EXISTS tax_status TEXT DEFAULT 'TK/0',
ADD COLUMN IF NOT EXISTS marital_status TEXT DEFAULT 'single',
ADD COLUMN IF NOT EXISTS education_level TEXT,
ADD COLUMN IF NOT EXISTS last_education TEXT,
ADD COLUMN IF NOT EXISTS religion TEXT,
ADD COLUMN IF NOT EXISTS blood_type TEXT;

-- Tabel Tunjangan Karyawan Individual
CREATE TABLE IF NOT EXISTS public.employee_allowances (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    component_id UUID NOT NULL REFERENCES public.salary_components(id),
    amount NUMERIC NOT NULL DEFAULT 0,
    effective_date DATE NOT NULL,
    end_date DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabel Potongan Karyawan Individual
CREATE TABLE IF NOT EXISTS public.employee_deductions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    component_id UUID NOT NULL REFERENCES public.salary_components(id),
    amount NUMERIC NOT NULL DEFAULT 0,
    effective_date DATE NOT NULL,
    end_date DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabel Lembur
CREATE TABLE IF NOT EXISTS public.overtime_records (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    overtime_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_hours NUMERIC NOT NULL,
    overtime_type TEXT NOT NULL CHECK (overtime_type IN ('weekday', 'weekend', 'holiday')),
    hourly_rate NUMERIC NOT NULL,
    total_amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
    approved_by UUID REFERENCES public.profiles(user_id),
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabel Performance Review
CREATE TABLE IF NOT EXISTS public.performance_reviews (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    review_period TEXT NOT NULL,
    review_year INTEGER NOT NULL,
    reviewer_id UUID REFERENCES public.employees(id),
    review_date DATE NOT NULL,
    kpi_score NUMERIC DEFAULT 0,
    competency_score NUMERIC DEFAULT 0,
    behavior_score NUMERIC DEFAULT 0,
    overall_score NUMERIC DEFAULT 0,
    rating TEXT CHECK (rating IN ('outstanding', 'exceeds_expectations', 'meets_expectations', 'needs_improvement', 'unsatisfactory')),
    strengths TEXT,
    areas_for_improvement TEXT,
    goals_next_period TEXT,
    employee_comments TEXT,
    reviewer_comments TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed', 'acknowledged', 'finalized')),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabel Training/Pelatihan
CREATE TABLE IF NOT EXISTS public.training_records (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    training_name TEXT NOT NULL,
    training_type TEXT NOT NULL CHECK (training_type IN ('internal', 'external', 'online', 'certification')),
    provider TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    duration_hours INTEGER,
    location TEXT,
    cost NUMERIC DEFAULT 0,
    certificate_number TEXT,
    certificate_expiry DATE,
    score NUMERIC,
    status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabel Dokumen Karyawan
CREATE TABLE IF NOT EXISTS public.employee_documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('ktp', 'kk', 'ijazah', 'sertifikat', 'str', 'sip', 'kontrak', 'sk', 'foto', 'npwp', 'bpjs', 'other')),
    document_name TEXT NOT NULL,
    document_number TEXT,
    issue_date DATE,
    expiry_date DATE,
    file_url TEXT,
    notes TEXT,
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES public.profiles(user_id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabel Saldo Cuti
CREATE TABLE IF NOT EXISTS public.leave_balances (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL,
    year INTEGER NOT NULL,
    initial_balance INTEGER NOT NULL DEFAULT 0,
    used INTEGER NOT NULL DEFAULT 0,
    remaining INTEGER NOT NULL DEFAULT 0,
    carried_over INTEGER DEFAULT 0,
    expired INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(employee_id, leave_type, year)
);

-- Tabel Shift Kerja
CREATE TABLE IF NOT EXISTS public.work_shifts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    shift_code TEXT NOT NULL UNIQUE,
    shift_name TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_duration INTEGER DEFAULT 60,
    is_night_shift BOOLEAN DEFAULT false,
    allowance_amount NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabel Schedule Karyawan
CREATE TABLE IF NOT EXISTS public.employee_schedules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    shift_id UUID NOT NULL REFERENCES public.work_shifts(id),
    schedule_date DATE NOT NULL,
    is_off_day BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(employee_id, schedule_date)
);

-- Tabel Payroll Periods
CREATE TABLE IF NOT EXISTS public.payroll_periods (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    period_name TEXT NOT NULL,
    period_month INTEGER NOT NULL,
    period_year INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    payment_date DATE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'approved', 'paid', 'closed')),
    total_employees INTEGER DEFAULT 0,
    total_gross NUMERIC DEFAULT 0,
    total_deductions NUMERIC DEFAULT 0,
    total_net NUMERIC DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(user_id),
    approved_by UUID REFERENCES public.profiles(user_id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(period_month, period_year)
);

-- Tabel Detail Payroll (Slip Gaji)
CREATE TABLE IF NOT EXISTS public.payroll_details (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    payroll_id UUID NOT NULL REFERENCES public.payroll(id) ON DELETE CASCADE,
    component_id UUID REFERENCES public.salary_components(id),
    component_name TEXT NOT NULL,
    component_type TEXT NOT NULL CHECK (component_type IN ('earning', 'deduction')),
    amount NUMERIC NOT NULL DEFAULT 0,
    is_taxable BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.salary_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_allowances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overtime_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_details ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated users (view)
CREATE POLICY "Authenticated users can view salary_components" ON public.salary_components FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view employee_grades" ON public.employee_grades FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view positions" ON public.positions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view work_shifts" ON public.work_shifts FOR SELECT TO authenticated USING (true);

-- RLS Policies for admins (full access)
CREATE POLICY "Admins can manage salary_components" ON public.salary_components FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can manage employee_grades" ON public.employee_grades FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can manage positions" ON public.positions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can manage employee_allowances" ON public.employee_allowances FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can manage employee_deductions" ON public.employee_deductions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can manage overtime_records" ON public.overtime_records FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can manage performance_reviews" ON public.performance_reviews FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can manage training_records" ON public.training_records FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can manage employee_documents" ON public.employee_documents FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can manage leave_balances" ON public.leave_balances FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can manage work_shifts" ON public.work_shifts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can manage employee_schedules" ON public.employee_schedules FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can manage payroll_periods" ON public.payroll_periods FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can manage payroll_details" ON public.payroll_details FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Employee can view their own records
CREATE POLICY "Employees can view own allowances" ON public.employee_allowances FOR SELECT TO authenticated USING (
    employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);
CREATE POLICY "Employees can view own deductions" ON public.employee_deductions FOR SELECT TO authenticated USING (
    employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);
CREATE POLICY "Employees can view own overtime" ON public.overtime_records FOR SELECT TO authenticated USING (
    employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);
CREATE POLICY "Employees can view own reviews" ON public.performance_reviews FOR SELECT TO authenticated USING (
    employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);
CREATE POLICY "Employees can view own training" ON public.training_records FOR SELECT TO authenticated USING (
    employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);
CREATE POLICY "Employees can view own documents" ON public.employee_documents FOR SELECT TO authenticated USING (
    employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);
CREATE POLICY "Employees can view own leave_balances" ON public.leave_balances FOR SELECT TO authenticated USING (
    employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);
CREATE POLICY "Employees can view own schedules" ON public.employee_schedules FOR SELECT TO authenticated USING (
    employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);
CREATE POLICY "Employees can view own payroll_details" ON public.payroll_details FOR SELECT TO authenticated USING (
    payroll_id IN (SELECT id FROM public.payroll WHERE employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()))
);

-- Triggers for updated_at
CREATE TRIGGER update_salary_components_updated_at BEFORE UPDATE ON public.salary_components FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employee_grades_updated_at BEFORE UPDATE ON public.employee_grades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON public.positions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employee_allowances_updated_at BEFORE UPDATE ON public.employee_allowances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employee_deductions_updated_at BEFORE UPDATE ON public.employee_deductions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_overtime_records_updated_at BEFORE UPDATE ON public.overtime_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_performance_reviews_updated_at BEFORE UPDATE ON public.performance_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_training_records_updated_at BEFORE UPDATE ON public.training_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employee_documents_updated_at BEFORE UPDATE ON public.employee_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leave_balances_updated_at BEFORE UPDATE ON public.leave_balances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_work_shifts_updated_at BEFORE UPDATE ON public.work_shifts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employee_schedules_updated_at BEFORE UPDATE ON public.employee_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payroll_periods_updated_at BEFORE UPDATE ON public.payroll_periods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default data
INSERT INTO public.salary_components (component_code, component_name, component_type, calculation_type, base_amount, is_taxable, description) VALUES
('TUNJ_JABATAN', 'Tunjangan Jabatan', 'allowance', 'fixed', 0, true, 'Tunjangan berdasarkan jabatan'),
('TUNJ_KELUARGA', 'Tunjangan Keluarga', 'allowance', 'percentage', 5, true, 'Tunjangan keluarga 5% dari gaji pokok'),
('TUNJ_TRANSPORT', 'Tunjangan Transportasi', 'allowance', 'fixed', 500000, false, 'Tunjangan transportasi bulanan'),
('TUNJ_MAKAN', 'Tunjangan Makan', 'allowance', 'fixed', 750000, false, 'Tunjangan makan bulanan'),
('TUNJ_KESEHATAN', 'Tunjangan Kesehatan', 'allowance', 'fixed', 300000, false, 'Tunjangan kesehatan tambahan'),
('TUNJ_SHIFT', 'Tunjangan Shift', 'allowance', 'fixed', 200000, true, 'Tunjangan shift malam'),
('BPJS_KES', 'BPJS Kesehatan', 'deduction', 'percentage', 4, false, 'Potongan BPJS Kesehatan 4%'),
('BPJS_TK_JHT', 'BPJS JHT', 'deduction', 'percentage', 2, false, 'Potongan BPJS JHT 2%'),
('BPJS_TK_JP', 'BPJS JP', 'deduction', 'percentage', 1, false, 'Potongan BPJS JP 1%'),
('PPH21', 'PPh 21', 'deduction', 'formula', 0, false, 'Potongan pajak penghasilan')
ON CONFLICT (component_code) DO NOTHING;

INSERT INTO public.employee_grades (grade_code, grade_name, level, min_salary, max_salary, description) VALUES
('G1', 'Grade 1 - Staff Junior', 1, 4500000, 6000000, 'Entry level'),
('G2', 'Grade 2 - Staff', 2, 5500000, 7500000, 'Staff level'),
('G3', 'Grade 3 - Staff Senior', 3, 7000000, 9500000, 'Senior staff'),
('G4', 'Grade 4 - Supervisor', 4, 9000000, 12000000, 'Supervisor level'),
('G5', 'Grade 5 - Manager', 5, 11000000, 16000000, 'Manager level'),
('G6', 'Grade 6 - Senior Manager', 6, 15000000, 22000000, 'Senior manager'),
('G7', 'Grade 7 - Director', 7, 20000000, 35000000, 'Director level'),
('D1', 'Dokter Umum', 10, 15000000, 25000000, 'Dokter umum'),
('D2', 'Dokter Spesialis', 11, 25000000, 50000000, 'Dokter spesialis'),
('N1', 'Perawat', 8, 5000000, 8000000, 'Perawat'),
('N2', 'Perawat Senior', 9, 7000000, 11000000, 'Perawat senior')
ON CONFLICT (grade_code) DO NOTHING;

INSERT INTO public.work_shifts (shift_code, shift_name, start_time, end_time, break_duration, is_night_shift, allowance_amount) VALUES
('PAGI', 'Shift Pagi', '07:00', '15:00', 60, false, 0),
('SIANG', 'Shift Siang', '14:00', '22:00', 60, false, 100000),
('MALAM', 'Shift Malam', '22:00', '07:00', 60, true, 200000),
('OFFICE', 'Office Hours', '08:00', '17:00', 60, false, 0)
ON CONFLICT (shift_code) DO NOTHING;
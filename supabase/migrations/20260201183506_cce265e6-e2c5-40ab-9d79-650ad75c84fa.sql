-- ============================================
-- MODUL SURVEI KEPUASAN PASIEN
-- ============================================

-- Tabel template survei
CREATE TABLE public.survey_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_code VARCHAR(50) NOT NULL UNIQUE,
  template_name VARCHAR(255) NOT NULL,
  description TEXT,
  survey_type VARCHAR(50) NOT NULL DEFAULT 'patient_satisfaction',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabel pertanyaan survei
CREATE TABLE public.survey_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.survey_templates(id) ON DELETE CASCADE,
  question_code VARCHAR(50) NOT NULL,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL DEFAULT 'rating',
  options JSONB,
  is_required BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 1,
  max_rating INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabel respon survei
CREATE TABLE public.survey_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.survey_templates(id),
  patient_id UUID REFERENCES public.patients(id),
  visit_id UUID REFERENCES public.visits(id),
  department_id UUID REFERENCES public.departments(id),
  doctor_id UUID REFERENCES public.doctors(id),
  response_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  overall_score DECIMAL(3,2),
  nps_score INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'completed',
  feedback_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabel jawaban per pertanyaan
CREATE TABLE public.survey_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  response_id UUID NOT NULL REFERENCES public.survey_responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.survey_questions(id),
  rating_value INTEGER,
  text_value TEXT,
  selected_options JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE public.survey_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Templates (authenticated users can view active templates)
CREATE POLICY "Authenticated users can view active survey templates" ON public.survey_templates
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Admin can manage survey templates" ON public.survey_templates
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- RLS Policies - Questions
CREATE POLICY "Authenticated users can view survey questions" ON public.survey_questions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin can manage survey questions" ON public.survey_questions
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- RLS Policies - Responses
CREATE POLICY "Authenticated users can submit survey responses" ON public.survey_responses
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can view survey responses" ON public.survey_responses
  FOR SELECT TO authenticated USING (true);

-- RLS Policies - Answers
CREATE POLICY "Authenticated users can submit survey answers" ON public.survey_answers
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can view survey answers" ON public.survey_answers
  FOR SELECT TO authenticated USING (true);

-- ============================================
-- SEED DATA: Template Survei Default
-- ============================================
INSERT INTO public.survey_templates (template_code, template_name, description, survey_type) VALUES
('SURV-RAWJAL', 'Survei Kepuasan Rawat Jalan', 'Survei untuk pasien rawat jalan setelah konsultasi', 'patient_satisfaction'),
('SURV-RAWAP', 'Survei Kepuasan Rawat Inap', 'Survei untuk pasien rawat inap saat pulang', 'patient_satisfaction'),
('SURV-IGD', 'Survei Kepuasan IGD', 'Survei untuk pasien IGD', 'patient_satisfaction'),
('SURV-NPS', 'Net Promoter Score', 'Survei NPS untuk mengukur loyalitas pasien', 'nps');

-- Pertanyaan untuk Survei Rawat Jalan
INSERT INTO public.survey_questions (template_id, question_code, question_text, question_type, display_order, max_rating)
SELECT 
  id,
  unnest(ARRAY['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6']),
  unnest(ARRAY[
    'Bagaimana kepuasan Anda terhadap waktu tunggu pendaftaran?',
    'Bagaimana kepuasan Anda terhadap keramahan petugas?',
    'Bagaimana kepuasan Anda terhadap pelayanan dokter?',
    'Bagaimana kepuasan Anda terhadap kebersihan ruangan?',
    'Bagaimana kepuasan Anda terhadap pelayanan farmasi?',
    'Apakah ada saran atau masukan untuk kami?'
  ]),
  unnest(ARRAY['rating', 'rating', 'rating', 'rating', 'rating', 'text']::varchar[]),
  unnest(ARRAY[1, 2, 3, 4, 5, 6]),
  unnest(ARRAY[5, 5, 5, 5, 5, NULL]::integer[])
FROM public.survey_templates WHERE template_code = 'SURV-RAWJAL';

-- Pertanyaan untuk Survei Rawat Inap
INSERT INTO public.survey_questions (template_id, question_code, question_text, question_type, display_order, max_rating)
SELECT 
  id,
  unnest(ARRAY['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8']),
  unnest(ARRAY[
    'Bagaimana kepuasan Anda terhadap proses admisi?',
    'Bagaimana kepuasan Anda terhadap kebersihan kamar?',
    'Bagaimana kepuasan Anda terhadap kualitas makanan?',
    'Bagaimana kepuasan Anda terhadap pelayanan perawat?',
    'Bagaimana kepuasan Anda terhadap pelayanan dokter?',
    'Bagaimana kepuasan Anda terhadap fasilitas kamar?',
    'Bagaimana kepuasan Anda terhadap proses administrasi pulang?',
    'Apakah ada saran atau masukan untuk kami?'
  ]),
  unnest(ARRAY['rating', 'rating', 'rating', 'rating', 'rating', 'rating', 'rating', 'text']::varchar[]),
  unnest(ARRAY[1, 2, 3, 4, 5, 6, 7, 8]),
  unnest(ARRAY[5, 5, 5, 5, 5, 5, 5, NULL]::integer[])
FROM public.survey_templates WHERE template_code = 'SURV-RAWAP';

-- Pertanyaan untuk Survei IGD
INSERT INTO public.survey_questions (template_id, question_code, question_text, question_type, display_order, max_rating)
SELECT 
  id,
  unnest(ARRAY['Q1', 'Q2', 'Q3', 'Q4', 'Q5']),
  unnest(ARRAY[
    'Bagaimana kepuasan Anda terhadap kecepatan penanganan?',
    'Bagaimana kepuasan Anda terhadap keramahan petugas?',
    'Bagaimana kepuasan Anda terhadap penjelasan dokter?',
    'Bagaimana kepuasan Anda terhadap kebersihan IGD?',
    'Apakah ada saran atau masukan untuk kami?'
  ]),
  unnest(ARRAY['rating', 'rating', 'rating', 'rating', 'text']::varchar[]),
  unnest(ARRAY[1, 2, 3, 4, 5]),
  unnest(ARRAY[5, 5, 5, 5, NULL]::integer[])
FROM public.survey_templates WHERE template_code = 'SURV-IGD';

-- Pertanyaan untuk NPS
INSERT INTO public.survey_questions (template_id, question_code, question_text, question_type, display_order, max_rating)
SELECT 
  id,
  unnest(ARRAY['NPS1', 'NPS2']),
  unnest(ARRAY[
    'Seberapa besar kemungkinan Anda merekomendasikan rumah sakit kami kepada keluarga atau teman? (0-10)',
    'Apa alasan utama Anda memberikan skor tersebut?'
  ]),
  unnest(ARRAY['nps', 'text']::varchar[]),
  unnest(ARRAY[1, 2]),
  unnest(ARRAY[10, NULL]::integer[])
FROM public.survey_templates WHERE template_code = 'SURV-NPS';

-- ============================================
-- FUNCTION: Hitung rata-rata kepuasan
-- ============================================
CREATE OR REPLACE FUNCTION public.calculate_satisfaction_score(
  p_department_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  avg_score DECIMAL(3,2),
  total_responses BIGINT,
  nps_score DECIMAL(5,2),
  promoters BIGINT,
  passives BIGINT,
  detractors BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(sr.overall_score), 0)::DECIMAL(3,2) as avg_score,
    COUNT(sr.id) as total_responses,
    COALESCE(
      (COUNT(CASE WHEN sr.nps_score >= 9 THEN 1 END) * 100.0 / NULLIF(COUNT(sr.id), 0)) -
      (COUNT(CASE WHEN sr.nps_score <= 6 THEN 1 END) * 100.0 / NULLIF(COUNT(sr.id), 0)),
      0
    )::DECIMAL(5,2) as nps_score,
    COUNT(CASE WHEN sr.nps_score >= 9 THEN 1 END) as promoters,
    COUNT(CASE WHEN sr.nps_score BETWEEN 7 AND 8 THEN 1 END) as passives,
    COUNT(CASE WHEN sr.nps_score <= 6 THEN 1 END) as detractors
  FROM public.survey_responses sr
  WHERE sr.status = 'completed'
    AND (p_department_id IS NULL OR sr.department_id = p_department_id)
    AND (p_start_date IS NULL OR sr.response_date::date >= p_start_date)
    AND (p_end_date IS NULL OR sr.response_date::date <= p_end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- VIEW: Ringkasan kepuasan per departemen
-- ============================================
CREATE OR REPLACE VIEW public.department_satisfaction_summary AS
SELECT 
  d.id as department_id,
  d.name as department_name,
  COUNT(sr.id) as total_responses,
  COALESCE(AVG(sr.overall_score), 0)::DECIMAL(3,2) as avg_satisfaction,
  COUNT(CASE WHEN sr.nps_score >= 9 THEN 1 END) as promoters,
  COUNT(CASE WHEN sr.nps_score BETWEEN 7 AND 8 THEN 1 END) as passives,
  COUNT(CASE WHEN sr.nps_score <= 6 THEN 1 END) as detractors,
  CASE 
    WHEN COUNT(sr.nps_score) > 0 THEN
      ((COUNT(CASE WHEN sr.nps_score >= 9 THEN 1 END) * 100.0 / COUNT(sr.nps_score)) -
       (COUNT(CASE WHEN sr.nps_score <= 6 THEN 1 END) * 100.0 / COUNT(sr.nps_score)))::DECIMAL(5,2)
    ELSE 0
  END as nps_score
FROM public.departments d
LEFT JOIN public.survey_responses sr ON sr.department_id = d.id AND sr.status = 'completed'
GROUP BY d.id, d.name;

-- Enable realtime for survey responses
ALTER PUBLICATION supabase_realtime ADD TABLE public.survey_responses;

-- Trigger untuk update timestamp
CREATE TRIGGER update_survey_templates_updated_at
  BEFORE UPDATE ON public.survey_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
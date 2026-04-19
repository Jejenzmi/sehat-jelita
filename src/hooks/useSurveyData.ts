import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Types
export interface SurveyTemplate {
  id: string;
  template_code: string;
  template_name: string;
  description: string | null;
  survey_type: string;
  is_active: boolean;
}

export interface SurveyQuestion {
  id: string;
  template_id: string;
  question_code: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
  is_required: boolean;
  display_order: number;
  max_rating: number | null;
}

export interface SurveyResponse {
  id: string;
  template_id: string;
  patient_id: string | null;
  visit_id: string | null;
  department_id: string | null;
  doctor_id: string | null;
  response_date: string;
  overall_score: number | null;
  nps_score: number | null;
  status: string;
  feedback_notes: string | null;
}

export interface SurveyAnswer {
  id?: string;
  response_id?: string;
  question_id: string;
  rating_value: number | null;
  text_value: string | null;
  selected_options: string[] | null;
}

export interface SatisfactionScore {
  avg_score: number;
  total_responses: number;
  nps_score: number;
  promoters: number;
  passives: number;
  detractors: number;
}

export interface DepartmentSatisfaction {
  department_id: string;
  department_name: string;
  total_responses: number;
  avg_satisfaction: number;
  promoters: number;
  passives: number;
  detractors: number;
  nps_score: number;
}

// ==================== SURVEY TEMPLATES ====================

export function useSurveyTemplates() {
  return useQuery({
    queryKey: ["survey-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("survey_templates")
        .select("*")
        .eq("is_active", true)
        .order("template_code");
      
      if (error) throw error;
      return data as SurveyTemplate[];
    },
  });
}

export function useSurveyQuestions(templateId: string | null) {
  return useQuery({
    queryKey: ["survey-questions", templateId],
    queryFn: async () => {
      if (!templateId) return [];
      
      const { data, error } = await supabase
        .from("survey_questions")
        .select("*")
        .eq("template_id", templateId)
        .order("display_order");
      
      if (error) throw error;
      return data as SurveyQuestion[];
    },
    enabled: !!templateId,
  });
}

// ==================== SURVEY RESPONSES ====================

export function useSurveyResponses(filters?: {
  departmentId?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ["survey-responses", filters],
    queryFn: async () => {
      let query = supabase
        .from("survey_responses")
        .select(`
          *,
          survey_templates (template_name, template_code),
          departments (name),
          doctors (name),
          patients (full_name)
        `)
        .eq("status", "completed")
        .order("response_date", { ascending: false });

      if (filters?.departmentId) {
        query = query.eq("department_id", filters.departmentId);
      }
      if (filters?.startDate) {
        query = query.gte("response_date", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("response_date", filters.endDate);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data;
    },
  });
}

export function useSubmitSurvey() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: {
      templateId: string;
      patientId?: string;
      visitId?: string;
      departmentId?: string;
      doctorId?: string;
      answers: SurveyAnswer[];
      npsScore?: number;
      feedbackNotes?: string;
    }) => {
      // Calculate overall score from rating answers
      const ratingAnswers = params.answers.filter(a => a.rating_value !== null);
      const overallScore = ratingAnswers.length > 0
        ? ratingAnswers.reduce((sum, a) => sum + (a.rating_value || 0), 0) / ratingAnswers.length
        : null;

      // Create survey response
      const { data: response, error: responseError } = await supabase
        .from("survey_responses")
        .insert({
          template_id: params.templateId,
          patient_id: params.patientId,
          visit_id: params.visitId,
          department_id: params.departmentId,
          doctor_id: params.doctorId,
          overall_score: overallScore,
          nps_score: params.npsScore,
          feedback_notes: params.feedbackNotes,
          status: "completed",
        })
        .select()
        .single();

      if (responseError) throw responseError;

      // Insert answers
      const answersToInsert = params.answers.map(a => ({
        response_id: response.id,
        question_id: a.question_id,
        rating_value: a.rating_value,
        text_value: a.text_value,
        selected_options: a.selected_options,
      }));

      const { error: answersError } = await supabase
        .from("survey_answers")
        .insert(answersToInsert);

      if (answersError) throw answersError;

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["survey-responses"] });
      queryClient.invalidateQueries({ queryKey: ["satisfaction-score"] });
      queryClient.invalidateQueries({ queryKey: ["department-satisfaction"] });
      toast({ title: "Terima kasih!", description: "Survei Anda telah berhasil dikirim" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Gagal mengirim survei", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });
}

// ==================== SATISFACTION SCORES ====================

export function useSatisfactionScore(filters?: {
  departmentId?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ["satisfaction-score", filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("calculate_satisfaction_score", {
          p_department_id: filters?.departmentId || null,
          p_start_date: filters?.startDate || null,
          p_end_date: filters?.endDate || null,
        });

      if (error) throw error;
      
      // RPC returns array, get first item
      const result = Array.isArray(data) ? data[0] : data;
      return result as SatisfactionScore;
    },
  });
}

export function useDepartmentSatisfaction() {
  return useQuery({
    queryKey: ["department-satisfaction"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("department_satisfaction_summary")
        .select("*")
        .order("avg_satisfaction", { ascending: false });

      if (error) throw error;
      return data as DepartmentSatisfaction[];
    },
  });
}

// ==================== RECENT FEEDBACK ====================

export function useRecentFeedback(limit: number = 10) {
  return useQuery({
    queryKey: ["recent-feedback", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("survey_responses")
        .select(`
          id,
          response_date,
          overall_score,
          nps_score,
          feedback_notes,
          departments (name),
          patients (full_name)
        `)
        .eq("status", "completed")
        .not("feedback_notes", "is", null)
        .order("response_date", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
  });
}

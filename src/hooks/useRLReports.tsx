import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

// Hospital Profile
export function useHospitalProfile() {
  return useQuery({
    queryKey: ["hospital-profile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hospital_profile")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

// RL Report Submissions
export function useRLReportSubmissions(year?: number) {
  return useQuery({
    queryKey: ["rl-report-submissions", year],
    queryFn: async () => {
      let query = supabase
        .from("rl_report_submissions")
        .select("*")
        .order("report_period_year", { ascending: false })
        .order("report_period_month", { ascending: false });
      
      if (year) {
        query = query.eq("report_period_year", year);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// RL3 Outpatient Stats
export function useRL3OutpatientStats(month?: number, year?: number) {
  return useQuery({
    queryKey: ["rl3-outpatient-stats", month, year],
    queryFn: async () => {
      let query = supabase
        .from("rl3_outpatient_stats")
        .select("*, department:departments(name)")
        .order("total_visits", { ascending: false });
      
      if (month && year) {
        query = query.eq("period_month", month).eq("period_year", year);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// RL3 Inpatient Stats
export function useRL3InpatientStats(month?: number, year?: number) {
  return useQuery({
    queryKey: ["rl3-inpatient-stats", month, year],
    queryFn: async () => {
      let query = supabase
        .from("rl3_inpatient_stats")
        .select("*")
        .order("ward_class");
      
      if (month && year) {
        query = query.eq("period_month", month).eq("period_year", year);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// RL4 Morbidity Stats
export function useRL4MorbidityStats(year?: number, patientType?: string) {
  return useQuery({
    queryKey: ["rl4-morbidity-stats", year, patientType],
    queryFn: async () => {
      let query = supabase
        .from("rl4_morbidity_stats")
        .select("*")
        .order("case_count", { ascending: false })
        .limit(20);
      
      if (year) {
        query = query.eq("period_year", year);
      }
      if (patientType) {
        query = query.eq("patient_type", patientType);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// RL4 Mortality Stats
export function useRL4MortalityStats(year?: number) {
  return useQuery({
    queryKey: ["rl4-mortality-stats", year],
    queryFn: async () => {
      let query = supabase
        .from("rl4_mortality_stats")
        .select("*")
        .order("death_count", { ascending: false })
        .limit(20);
      
      if (year) {
        query = query.eq("period_year", year);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// RL5 Visitor Stats
export function useRL5VisitorStats(month?: number, year?: number) {
  return useQuery({
    queryKey: ["rl5-visitor-stats", month, year],
    queryFn: async () => {
      let query = supabase
        .from("rl5_visitor_stats")
        .select("*")
        .order("visit_count", { ascending: false });
      
      if (month && year) {
        query = query.eq("period_month", month).eq("period_year", year);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// RL6 Indicators
export function useRL6Indicators(year?: number) {
  return useQuery({
    queryKey: ["rl6-indicators", year],
    queryFn: async () => {
      let query = supabase
        .from("rl6_indicators")
        .select("*")
        .order("period_year", { ascending: false })
        .order("period_month", { ascending: false });
      
      if (year) {
        query = query.eq("period_year", year);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// Calculate RL6 Indicators
export function useCalculateRL6() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ month, year }: { month: number; year: number }) => {
      const { error } = await supabase.rpc("calculate_rl6_indicators", {
        p_month: month,
        p_year: year,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rl6-indicators"] });
      toast({
        title: "Berhasil",
        description: "Indikator RL6 berhasil dihitung",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

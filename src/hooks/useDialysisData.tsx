import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type DialysisType = Database['public']['Enums']['dialysis_type'];
type SessionStatus = Database['public']['Enums']['session_status'];
type VascularAccessType = Database['public']['Enums']['vascular_access_type'];

// Types
export interface DialysisMachine {
  id: string;
  machine_number: string;
  brand: string | null;
  model: string | null;
  is_available: boolean | null;
  last_maintenance_date: string | null;
  next_maintenance_date: string | null;
  notes: string | null;
}

export interface VascularAccess {
  id: string;
  patient_id: string;
  access_type: VascularAccessType;
  location: string | null;
  creation_date: string | null;
  is_active: boolean | null;
}

export interface DialysisSession {
  id: string;
  session_number: string;
  patient_id: string;
  machine_id: string | null;
  vascular_access_id: string | null;
  dialysis_type: DialysisType | null;
  session_date: string;
  scheduled_time: string | null;
  actual_start_time: string | null;
  actual_end_time: string | null;
  duration_planned: number | null;
  duration_actual: number | null;
  status: SessionStatus | null;
  attending_doctor_id: string | null;
  
  // Pre-dialysis
  pre_weight: number | null;
  dry_weight: number | null;
  target_uf: number | null;
  pre_bp_systolic: number | null;
  pre_bp_diastolic: number | null;
  
  // Dialysis Parameters
  blood_flow_rate: number | null;
  dialyzer_type: string | null;
  
  // Post-dialysis
  post_weight: number | null;
  actual_uf: number | null;
  kt_v: number | null;
  urr: number | null;
  
  notes: string | null;
  
  patients?: { full_name: string; medical_record_number: string } | null;
  dialysis_machines?: { machine_number: string; brand: string | null; model: string | null } | null;
  doctors?: { full_name: string } | null;
}

export interface DialysisMonitoring {
  id: string;
  session_id: string;
  recorded_at: string;
  time_elapsed: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  heart_rate: number | null;
  blood_flow_rate: number | null;
  uf_total: number | null;
  symptoms: string | null;
}

// Dialysis Machines
export function useDialysisMachines() {
  return useQuery({
    queryKey: ["dialysis-machines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dialysis_machines")
        .select("*")
        .order("machine_number");

      if (error) throw error;
      return data as DialysisMachine[];
    },
  });
}

// Dialysis Sessions
export function useDialysisSessions(date?: string, status?: SessionStatus) {
  return useQuery({
    queryKey: ["dialysis-sessions", date, status],
    queryFn: async () => {
      let query = supabase
        .from("dialysis_sessions")
        .select(`
          *,
          patients(full_name, medical_record_number),
          dialysis_machines(machine_number, brand, model),
          doctors(full_name)
        `)
        .order("session_date", { ascending: false })
        .order("scheduled_time", { ascending: true });

      if (date) {
        query = query.eq("session_date", date);
      }

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data as unknown as DialysisSession[];
    },
  });
}

// Today's Sessions
export function useTodayDialysisSessions() {
  const today = new Date().toISOString().split('T')[0];
  return useDialysisSessions(today);
}

// Dialysis Monitoring
export function useDialysisMonitoring(sessionId: string) {
  return useQuery({
    queryKey: ["dialysis-monitoring", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dialysis_monitoring")
        .select("*")
        .eq("session_id", sessionId)
        .order("recorded_at", { ascending: true });

      if (error) throw error;
      return data as DialysisMonitoring[];
    },
    enabled: !!sessionId,
  });
}

// Dialysis Statistics
export function useDialysisStatistics() {
  return useQuery({
    queryKey: ["dialysis-statistics"],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Get machines
      const { data: machines } = await supabase.from("dialysis_machines").select("*");
      
      // Get today's sessions
      const { data: todaySessions } = await supabase
        .from("dialysis_sessions")
        .select("status")
        .eq("session_date", today);

      // Get this month's completed sessions
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const { data: monthSessions, count } = await supabase
        .from("dialysis_sessions")
        .select("*", { count: 'exact' })
        .gte("session_date", monthStart)
        .eq("status", "completed");

      const totalMachines = machines?.length || 0;
      const availableMachines = machines?.filter(m => m.is_available).length || 0;
      const inUseMachines = totalMachines - availableMachines;

      const todayScheduled = todaySessions?.filter(s => s.status === 'scheduled').length || 0;
      const todayCompleted = todaySessions?.filter(s => s.status === 'completed').length || 0;
      const todayInProgress = todaySessions?.filter(s => s.status === 'in_progress').length || 0;

      // Calculate average Kt/V from completed sessions
      const sessionsWithKtV = monthSessions?.filter(s => s.kt_v) || [];
      const avgKtV = sessionsWithKtV.length 
        ? sessionsWithKtV.reduce((sum, s) => sum + (s.kt_v || 0), 0) / sessionsWithKtV.length
        : 0;

      return {
        totalMachines,
        availableMachines,
        inUseMachines,
        todayScheduled,
        todayCompleted,
        todayInProgress,
        monthlyTotal: count || 0,
        avgKtV: avgKtV.toFixed(2),
      };
    },
  });
}

// Mutations
export function useUpdateDialysisSession() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Database['public']['Tables']['dialysis_sessions']['Update']) => {
      const { error } = await supabase.from("dialysis_sessions").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dialysis-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["dialysis-statistics"] });
      toast({ title: "Session updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error updating session", description: error.message, variant: "destructive" });
    },
  });
}

export function useAddDialysisMonitoring() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Database['public']['Tables']['dialysis_monitoring']['Insert']) => {
      const { error } = await supabase.from("dialysis_monitoring").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dialysis-monitoring"] });
      toast({ title: "Monitoring data recorded" });
    },
  });
}

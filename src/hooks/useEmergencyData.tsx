import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";

export type TriageLevel = "merah" | "kuning" | "hijau" | "hitam";

export interface EmergencyVisit {
  id: string;
  patient_id: string;
  visit_id: string;
  arrival_time: string;
  arrival_mode: string | null;
  chief_complaint: string;
  triage_level: TriageLevel;
  triage_time: string | null;
  triage_by: string | null;
  is_critical: boolean | null;
  consciousness_level: string | null;
  trauma_type: string | null;
  disposition: string | null;
  disposition_time: string | null;
  notes: string | null;
  patients?: {
    full_name: string;
    medical_record_number: string;
    gender: string;
    birth_date: string;
  };
  visits?: {
    status: string;
  };
}

export interface EmergencyStats {
  totalActive: number;
  triageCounts: Record<TriageLevel, number>;
  avgResponseTime: number;
  todayTotal: number;
}

export function useEmergencyVisits() {
  return useQuery({
    queryKey: ["emergency-visits"],
    queryFn: async (): Promise<EmergencyVisit[]> => {
      const { data, error } = await db
        .from("emergency_visits")
        .select(`
          *,
          patients (full_name, medical_record_number, gender, birth_date),
          visits (status)
        `)
        .is("disposition_time", null)
        .order("arrival_time", { ascending: false });

      if (error) throw error;
      return data as EmergencyVisit[];
    },
    refetchInterval: 10000, // Refresh every 10 seconds for real-time updates
  });
}

export function useEmergencyStats() {
  return useQuery({
    queryKey: ["emergency-stats"],
    queryFn: async (): Promise<EmergencyStats> => {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();

      // Get active emergency visits
      const { data: activeVisits, error } = await db
        .from("emergency_visits")
        .select("triage_level, arrival_time, triage_time")
        .is("disposition_time", null);

      if (error) throw error;

      // Get today's total
      const { count: todayTotal } = await db
        .from("emergency_visits")
        .select("*", { count: "exact", head: true })
        .gte("arrival_time", startOfDay);

      // Calculate triage counts
      const triageCounts: Record<TriageLevel, number> = {
        merah: 0,
        kuning: 0,
        hijau: 0,
        hitam: 0,
      };

      let totalResponseTime = 0;
      let responseCount = 0;

      activeVisits?.forEach((visit) => {
        const level = visit.triage_level as TriageLevel;
        if (triageCounts[level] !== undefined) {
          triageCounts[level]++;
        }

        // Calculate response time
        if (visit.triage_time && visit.arrival_time) {
          const arrival = new Date(visit.arrival_time);
          const triage = new Date(visit.triage_time);
          const diff = (triage.getTime() - arrival.getTime()) / 60000; // minutes
          totalResponseTime += diff;
          responseCount++;
        }
      });

      const avgResponseTime = responseCount > 0 
        ? Math.round(totalResponseTime / responseCount) 
        : 0;

      return {
        totalActive: activeVisits?.length || 0,
        triageCounts,
        avgResponseTime,
        todayTotal: todayTotal || 0,
      };
    },
    refetchInterval: 30000,
  });
}

export function useCreateEmergencyVisit() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      patient_id: string;
      arrival_mode: string;
      chief_complaint: string;
      triage_level: TriageLevel;
      is_critical?: boolean;
    }) => {
      // First create a visit - generate a visit number
      const visitNumber = `IGD-${Date.now()}`;
      const { data: visit, error: visitError } = await db
        .from("visits")
        .insert([{
          visit_number: visitNumber,
          patient_id: data.patient_id,
          visit_type: "igd" as const,
          status: "menunggu" as const,
          chief_complaint: data.chief_complaint,
        }])
        .select()
        .single();

      if (visitError) throw visitError;

      // Then create emergency visit
      const { data: emergencyVisit, error } = await db
        .from("emergency_visits")
        .insert({
          patient_id: data.patient_id,
          visit_id: visit.id,
          arrival_mode: data.arrival_mode,
          chief_complaint: data.chief_complaint,
          triage_level: data.triage_level,
          triage_time: new Date().toISOString(),
          is_critical: data.is_critical || data.triage_level === "merah",
        })
        .select()
        .single();

      if (error) throw error;
      return emergencyVisit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergency-visits"] });
      queryClient.invalidateQueries({ queryKey: ["emergency-stats"] });
      toast({
        title: "Berhasil",
        description: "Pasien IGD berhasil didaftarkan",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateEmergencyDisposition() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      disposition,
      notes 
    }: { 
      id: string; 
      disposition: string;
      notes?: string;
    }) => {
      const { error } = await db
        .from("emergency_visits")
        .update({
          disposition,
          disposition_time: new Date().toISOString(),
          notes,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergency-visits"] });
      queryClient.invalidateQueries({ queryKey: ["emergency-stats"] });
      toast({
        title: "Berhasil",
        description: "Status pasien diperbarui",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

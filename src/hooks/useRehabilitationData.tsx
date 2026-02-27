import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { Database } from "@/types/database";
import { toast } from "sonner";

type TherapyType = Database["public"]["Tables"]["therapy_types"]["Row"];
type RehabAssessment = Database["public"]["Tables"]["rehabilitation_assessments"]["Row"];
type TherapySession = Database["public"]["Tables"]["therapy_sessions"]["Row"];
type RehabGoal = Database["public"]["Tables"]["rehabilitation_goals"]["Row"];

export function useRehabilitationData() {
  const queryClient = useQueryClient();

  // Fetch therapy types
  const { data: therapyTypes, isLoading: loadingTherapyTypes } = useQuery({
    queryKey: ["therapy-types"],
    queryFn: async () => {
      const { data, error } = await db
        .from("therapy_types")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as TherapyType[];
    },
  });

  // Fetch rehabilitation assessments
  const { data: assessments, isLoading: loadingAssessments } = useQuery({
    queryKey: ["rehab-assessments"],
    queryFn: async () => {
      const { data, error } = await db
        .from("rehabilitation_assessments")
        .select(`
          *,
          patients:patient_id (full_name, medical_record_number),
          doctors:therapist_id (full_name)
        `)
        .order("assessment_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Fetch today's therapy sessions
  const { data: todaySessions, isLoading: loadingSessions } = useQuery({
    queryKey: ["today-therapy-sessions"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await db
        .from("therapy_sessions")
        .select(`
          *,
          patients:patient_id (full_name, medical_record_number),
          therapy_types:therapy_type_id (name, type, duration_minutes)
        `)
        .eq("scheduled_date", today)
        .order("scheduled_time");
      if (error) throw error;
      return data;
    },
  });

  // Fetch all therapy sessions for schedule view
  const { data: allSessions, isLoading: loadingAllSessions } = useQuery({
    queryKey: ["all-therapy-sessions"],
    queryFn: async () => {
      const { data, error } = await db
        .from("therapy_sessions")
        .select(`
          *,
          patients:patient_id (full_name, medical_record_number),
          therapy_types:therapy_type_id (name, type)
        `)
        .gte("scheduled_date", new Date().toISOString().split("T")[0])
        .order("scheduled_date")
        .order("scheduled_time")
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Fetch rehabilitation goals
  const { data: goals, isLoading: loadingGoals } = useQuery({
    queryKey: ["rehab-goals"],
    queryFn: async () => {
      const { data, error } = await db
        .from("rehabilitation_goals")
        .select(`
          *,
          rehabilitation_assessments:assessment_id (
            patient_id,
            patients:patient_id (full_name)
          )
        `)
        .eq("status", "in_progress")
        .order("target_date");
      if (error) throw error;
      return data;
    },
  });

  // Create assessment
  const createAssessment = useMutation({
    mutationFn: async (assessment: Database["public"]["Tables"]["rehabilitation_assessments"]["Insert"]) => {
      const { data, error } = await db
        .from("rehabilitation_assessments")
        .insert(assessment)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rehab-assessments"] });
      toast.success("Assessment rehabilitasi berhasil dibuat");
    },
    onError: (error) => {
      toast.error("Gagal membuat assessment: " + error.message);
    },
  });

  // Schedule therapy session
  const scheduleSession = useMutation({
    mutationFn: async (session: Database["public"]["Tables"]["therapy_sessions"]["Insert"]) => {
      const { data, error } = await db
        .from("therapy_sessions")
        .insert(session)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today-therapy-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["all-therapy-sessions"] });
      toast.success("Jadwal terapi berhasil dibuat");
    },
    onError: (error) => {
      toast.error("Gagal menjadwalkan terapi: " + error.message);
    },
  });

  // Update session status
  const updateSessionStatus = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const updateData: Record<string, unknown> = { status };
      if (status === "in_progress") {
        updateData.actual_start_time = new Date().toISOString();
      } else if (status === "completed") {
        updateData.actual_end_time = new Date().toISOString();
      }
      if (notes) updateData.progress_notes = notes;
      
      const { data, error } = await db
        .from("therapy_sessions")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today-therapy-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["all-therapy-sessions"] });
      toast.success("Status terapi berhasil diperbarui");
    },
    onError: (error) => {
      toast.error("Gagal memperbarui status: " + error.message);
    },
  });

  return {
    therapyTypes,
    assessments,
    todaySessions,
    allSessions,
    goals,
    loadingTherapyTypes,
    loadingAssessments,
    loadingSessions,
    loadingAllSessions,
    loadingGoals,
    createAssessment,
    scheduleSession,
    updateSessionStatus,
  };
}

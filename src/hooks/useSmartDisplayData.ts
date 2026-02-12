import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useQueueData(departmentId?: string | null) {
  return useQuery({
    queryKey: ["smart-display-queue", departmentId],
    queryFn: async () => {
      let query = supabase
        .from("queue_tickets")
        .select("*, patients(full_name), departments(name)")
        .eq("queue_date", new Date().toISOString().split("T")[0])
        .order("created_at", { ascending: true });
      if (departmentId) {
        query = query.eq("department_id", departmentId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000,
  });
}

export function useCallQueueTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, counterNumber }: { ticketId: string; counterNumber?: string }) => {
      const { error } = await supabase
        .from("queue_tickets")
        .update({
          status: "dipanggil",
          called_at: new Date().toISOString(),
          counter_number: counterNumber || "1",
        })
        .eq("id", ticketId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["smart-display-queue"] });
      toast.success("Pasien dipanggil");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCompleteQueueTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ticketId: string) => {
      const { error } = await supabase
        .from("queue_tickets")
        .update({
          status: "selesai",
          completed_at: new Date().toISOString(),
        })
        .eq("id", ticketId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["smart-display-queue"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useBedData() {
  return useQuery({
    queryKey: ["smart-display-beds"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beds")
        .select("*, rooms(room_number, room_type, ward:wards(name)), patients:current_patient_id(full_name)")
        .order("bed_number");
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });
}

export function usePharmacyQueueData() {
  return useQuery({
    queryKey: ["smart-display-pharmacy"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prescriptions")
        .select("*, patients(full_name)")
        .in("status", ["menunggu", "diproses", "siap"])
        .order("created_at", { ascending: true })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000,
  });
}

export function useDoctorScheduleData(departmentId?: string | null) {
  return useQuery({
    queryKey: ["smart-display-doctor-schedule", departmentId],
    queryFn: async () => {
      const today = new Date().getDay();
      let query = (supabase as any)
        .from("doctor_schedules")
        .select("*, doctors(full_name, specialization), departments(name)")
        .eq("day_of_week", today)
        .eq("is_active", true);
      if (departmentId) {
        query = query.eq("department_id", departmentId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000,
  });
}

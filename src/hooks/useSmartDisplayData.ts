import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useQueueData() {
  return useQuery({
    queryKey: ["smart-display-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("queue_tickets")
        .select("*, patients(full_name), departments(name)")
        .eq("queue_date", new Date().toISOString().split("T")[0])
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000, // 10 seconds auto-refresh
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

export function useDoctorScheduleData() {
  return useQuery({
    queryKey: ["smart-display-doctor-schedule"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("doctor_schedules")
        .select("*, doctors(full_name, specialization), departments(name)")
        .eq("day_of_week", new Date().getDay())
        .eq("is_active", true);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000,
  });
}

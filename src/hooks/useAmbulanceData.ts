import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AmbulanceFleet {
  id: string;
  ambulance_code: string;
  plate_number: string;
  ambulance_type: string;
  status: string;
  driver_name: string | null;
  crew_names: string | null;
  equipment_status: string | null;
  last_service_date: string | null;
  next_service_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AmbulanceDispatch {
  id: string;
  dispatch_number: string;
  ambulance_id: string | null;
  patient_info: string;
  pickup_location: string;
  destination: string;
  priority: string;
  status: string;
  caller_name: string | null;
  caller_phone: string | null;
  request_time: string;
  dispatch_time: string | null;
  arrival_time: string | null;
  completion_time: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useAmbulanceFleet() {
  return useQuery({
    queryKey: ["ambulance-fleet"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("ambulance_fleet")
        .select("*")
        .order("ambulance_code");
      if (error) throw error;
      return data as AmbulanceFleet[];
    },
  });
}

export function useAmbulanceDispatches() {
  return useQuery({
    queryKey: ["ambulance-dispatches"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("ambulance_dispatches")
        .select("*")
        .order("request_time", { ascending: false });
      if (error) throw error;
      return data as AmbulanceDispatch[];
    },
  });
}

export function useCreateAmbulanceFleet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (fleet: Omit<AmbulanceFleet, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await (supabase as any).from("ambulance_fleet").insert(fleet).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ambulance-fleet"] }); toast.success("Ambulans berhasil ditambahkan"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateDispatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dispatch: Omit<AmbulanceDispatch, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await (supabase as any).from("ambulance_dispatches").insert(dispatch).select().single();
      if (error) throw error;
      // Update ambulance status to on_mission
      if (dispatch.ambulance_id) {
        await (supabase as any).from("ambulance_fleet").update({ status: "on_mission" }).eq("id", dispatch.ambulance_id);
      }
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ambulance-dispatches"] });
      qc.invalidateQueries({ queryKey: ["ambulance-fleet"] });
      toast.success("Ambulans berhasil di-dispatch!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateDispatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<AmbulanceDispatch>) => {
      const { error } = await (supabase as any).from("ambulance_dispatches").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ambulance-dispatches"] });
      qc.invalidateQueries({ queryKey: ["ambulance-fleet"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export async function generateDispatchNumber(): Promise<string> {
  const { data, error } = await (supabase as any).rpc("generate_dispatch_number");
  if (error) throw error;
  return data;
}

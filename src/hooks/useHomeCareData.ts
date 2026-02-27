import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { toast } from "sonner";

export interface HomeCareVisit {
  id: string;
  visit_number: string;
  patient_id: string | null;
  patient_name: string;
  patient_phone: string | null;
  address: string;
  nurse_id: string | null;
  nurse_name: string;
  doctor_id: string | null;
  doctor_name: string | null;
  visit_date: string;
  visit_time: string;
  service_type: string;
  status: string;
  notes: string | null;
  completion_notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useHomeCareVisits() {
  return useQuery({
    queryKey: ["home-care-visits"],
    queryFn: async () => {
      const { data, error } = await (db as any)
        .from("home_care_visits")
        .select("*")
        .order("visit_date", { ascending: false });
      if (error) throw error;
      return data as HomeCareVisit[];
    },
  });
}

export function useCreateHomeCareVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (visit: Omit<HomeCareVisit, "id" | "created_at" | "updated_at" | "completed_at" | "completion_notes">) => {
      const { data, error } = await (db as any)
        .from("home_care_visits")
        .insert(visit)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home-care-visits"] });
      toast.success("Kunjungan berhasil dijadwalkan");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateHomeCareVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<HomeCareVisit>) => {
      const { error } = await (db as any)
        .from("home_care_visits")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home-care-visits"] });
      toast.success("Kunjungan berhasil diperbarui");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export async function generateHomeCareVisitNumber(): Promise<string> {
  const { data, error } = await (db as any).rpc("generate_home_care_visit_number");
  if (error) throw error;
  return data;
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Room {
  id: string;
  code: string;
  name: string;
  room_class: string;
  daily_rate: number;
  total_beds: number;
  is_active: boolean;
  beds: Bed[];
}

export interface Bed {
  id: string;
  bed_number: string;
  status: string;
  current_patient_id: string | null;
}

export interface InpatientAdmission {
  id: string;
  patient_id: string;
  visit_id: string;
  room_id: string;
  bed_id: string | null;
  admission_date: string;
  planned_discharge_date: string | null;
  actual_discharge_date: string | null;
  status: string;
  attending_doctor_id: string | null;
  discharge_summary: string | null;
  patients?: {
    full_name: string;
    medical_record_number: string;
  };
  rooms?: {
    code: string;
    name: string;
    room_class: string;
    daily_rate: number;
  };
  beds?: {
    bed_number: string;
  };
  doctors?: {
    full_name: string;
  };
}

export function useRooms() {
  return useQuery({
    queryKey: ["rooms"],
    queryFn: async (): Promise<Room[]> => {
      const { data, error } = await supabase
        .from("rooms")
        .select(`
          *,
          beds (id, bed_number, status, current_patient_id)
        `)
        .eq("is_active", true)
        .order("room_class");

      if (error) throw error;
      return data as Room[];
    },
  });
}

export function useInpatientAdmissions() {
  return useQuery({
    queryKey: ["inpatient-admissions"],
    queryFn: async (): Promise<InpatientAdmission[]> => {
      const { data, error } = await supabase
        .from("inpatient_admissions")
        .select(`
          *,
          patients (full_name, medical_record_number),
          rooms (code, name, room_class, daily_rate),
          beds (bed_number),
          doctors:attending_doctor_id (full_name)
        `)
        .eq("status", "active")
        .order("admission_date", { ascending: false });

      if (error) throw error;
      return data as InpatientAdmission[];
    },
  });
}

export function useDischargeQueue() {
  return useQuery({
    queryKey: ["discharge-queue"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("inpatient_admissions")
        .select(`
          *,
          patients (full_name, medical_record_number),
          rooms (room_number)
        `)
        .eq("status", "active")
        .lte("planned_discharge_date", today)
        .order("planned_discharge_date");

      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateAdmission() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (admission: {
      patient_id: string;
      room_id: string;
      bed_id?: string;
      attending_doctor_id?: string;
      planned_discharge_date?: string;
      visit_id: string;
    }) => {
      // Create the admission
      const { data: admissionData, error: admissionError } = await supabase
        .from("inpatient_admissions")
        .insert({
          patient_id: admission.patient_id,
          room_id: admission.room_id,
          bed_id: admission.bed_id,
          attending_doctor_id: admission.attending_doctor_id,
          planned_discharge_date: admission.planned_discharge_date,
          visit_id: admission.visit_id,
          status: "active",
        })
        .select()
        .single();

      if (admissionError) throw admissionError;

      // Update bed status if bed is assigned
      if (admission.bed_id) {
        await supabase
          .from("beds")
          .update({ 
            status: "terisi" as const, 
            current_patient_id: admission.patient_id 
          })
          .eq("id", admission.bed_id);
      }

      return admissionData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inpatient-admissions"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["bed-occupancy"] });
      toast({
        title: "Berhasil",
        description: "Pasien berhasil dirawat inapkan",
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

export function useDischargePatient() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      admissionId, 
      bedId,
      dischargeSummary,
      dischargeType 
    }: { 
      admissionId: string; 
      bedId: string | null;
      dischargeSummary?: string;
      dischargeType?: string;
    }) => {
      // Update admission
      const { error: admissionError } = await supabase
        .from("inpatient_admissions")
        .update({
          status: "discharged",
          actual_discharge_date: new Date().toISOString(),
          discharge_summary: dischargeSummary,
          discharge_type: dischargeType,
        })
        .eq("id", admissionId);

      if (admissionError) throw admissionError;

      // Release bed
      if (bedId) {
        await supabase
          .from("beds")
          .update({ 
            status: "tersedia" as const, 
            current_patient_id: null 
          })
          .eq("id", bedId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inpatient-admissions"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["bed-occupancy"] });
      queryClient.invalidateQueries({ queryKey: ["discharge-queue"] });
      toast({
        title: "Berhasil",
        description: "Pasien berhasil dipulangkan",
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

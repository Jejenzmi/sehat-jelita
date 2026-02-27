import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/types/database";

type IcuType = Database['public']['Enums']['icu_type'];
type IcuAdmissionStatus = Database['public']['Enums']['icu_admission_status'];

// Types
export interface ICUBed {
  id: string;
  bed_number: string;
  icu_type: IcuType;
  is_available: boolean | null;
  has_ventilator: boolean | null;
  has_monitor: boolean | null;
  equipment_notes: string | null;
}

export interface ICUAdmission {
  id: string;
  admission_number: string;
  patient_id: string;
  visit_id: string;
  icu_bed_id: string | null;
  icu_type: IcuType;
  admission_date: string;
  admission_reason: string;
  admission_diagnosis: string | null;
  attending_doctor_id: string | null;
  status: IcuAdmissionStatus | null;
  apache_ii_score: number | null;
  sofa_score: number | null;
  discharge_date: string | null;
  discharge_reason: string | null;
  total_icu_days: number | null;
  notes: string | null;
  patients?: { full_name: string; medical_record_number: string } | null;
  doctors?: { full_name: string } | null;
  icu_beds?: { bed_number: string; icu_type: IcuType; has_ventilator?: boolean | null } | null;
}

export interface ICUMonitoring {
  id: string;
  admission_id: string;
  recorded_at: string;
  heart_rate: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  map: number | null;
  temperature: number | null;
  respiratory_rate: number | null;
  spo2: number | null;
  gcs_total: number | null;
  urine_output: number | null;
  fluid_balance: number | null;
  notes: string | null;
}

export interface VentilatorSetting {
  id: string;
  admission_id: string;
  recorded_at: string;
  ventilator_mode: string | null;
  fio2: number | null;
  peep: number | null;
  tidal_volume: number | null;
  respiratory_rate_set: number | null;
  p_f_ratio: number | null;
  notes: string | null;
}

// ICU Beds
export function useICUBeds() {
  return useQuery({
    queryKey: ["icu-beds"],
    queryFn: async () => {
      const { data, error } = await db
        .from("icu_beds")
        .select("*")
        .order("bed_number");

      if (error) throw error;
      return data as ICUBed[];
    },
  });
}

// ICU Admissions
export function useICUAdmissions(icuType?: IcuType) {
  return useQuery({
    queryKey: ["icu-admissions", icuType],
    queryFn: async () => {
      let query = db
        .from("icu_admissions")
        .select(`
          *,
          patients(full_name, medical_record_number),
          doctors(full_name),
          icu_beds(bed_number, icu_type)
        `)
        .order("admission_date", { ascending: false });

      if (icuType) {
        query = query.eq("icu_type", icuType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as ICUAdmission[];
    },
  });
}

// Active ICU Patients
export function useActiveICUPatients() {
  return useQuery({
    queryKey: ["active-icu-patients"],
    queryFn: async () => {
      const { data, error } = await db
        .from("icu_admissions")
        .select(`
          *,
          patients(full_name, medical_record_number, birth_date, gender),
          doctors(full_name),
          icu_beds(bed_number, icu_type, has_ventilator)
        `)
        .eq("status", "active")
        .order("admission_date", { ascending: false });

      if (error) throw error;
      return data as unknown as ICUAdmission[];
    },
  });
}

// ICU Monitoring
export function useICUMonitoring(admissionId: string) {
  return useQuery({
    queryKey: ["icu-monitoring", admissionId],
    queryFn: async () => {
      const { data, error } = await db
        .from("icu_monitoring")
        .select("*")
        .eq("admission_id", admissionId)
        .order("recorded_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as ICUMonitoring[];
    },
    enabled: !!admissionId,
  });
}

// Ventilator Settings
export function useVentilatorSettings(admissionId: string) {
  return useQuery({
    queryKey: ["ventilator-settings", admissionId],
    queryFn: async () => {
      const { data, error } = await db
        .from("ventilator_settings")
        .select("*")
        .eq("admission_id", admissionId)
        .order("recorded_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as VentilatorSetting[];
    },
    enabled: !!admissionId,
  });
}

// ICU Statistics
export function useICUStatistics() {
  return useQuery({
    queryKey: ["icu-statistics"],
    queryFn: async () => {
      // Get beds
      const { data: beds } = await db.from("icu_beds").select("*");
      
      // Get active admissions
      const { data: activeAdmissions } = await db
        .from("icu_admissions")
        .select("icu_type, status")
        .eq("status", "active");

      const totalBeds = beds?.length || 0;
      const availableBeds = beds?.filter(b => b.is_available).length || 0;
      const occupiedBeds = totalBeds - availableBeds;
      const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;

      // Count by type
      const byType: Record<string, { total: number; occupied: number }> = {
        icu: { total: 0, occupied: 0 },
        iccu: { total: 0, occupied: 0 },
        nicu: { total: 0, occupied: 0 },
        picu: { total: 0, occupied: 0 },
        hcu: { total: 0, occupied: 0 },
      };

      beds?.forEach(bed => {
        const type = bed.icu_type;
        if (byType[type]) {
          byType[type].total++;
          if (!bed.is_available) byType[type].occupied++;
        }
      });

      const ventilatorInUse = activeAdmissions?.length || 0;

      return {
        totalBeds,
        availableBeds,
        occupiedBeds,
        occupancyRate: Math.round(occupancyRate),
        ventilatorInUse,
        activePatients: activeAdmissions?.length || 0,
        byType,
      };
    },
  });
}

// Mutations
export function useAddICUMonitoring() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Database['public']['Tables']['icu_monitoring']['Insert']) => {
      const { error } = await db.from("icu_monitoring").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["icu-monitoring"] });
      toast({ title: "Vital signs recorded successfully" });
    },
    onError: (error) => {
      toast({ title: "Error recording vital signs", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateICUBed() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Database['public']['Tables']['icu_beds']['Update']) => {
      const { error } = await db.from("icu_beds").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["icu-beds"] });
      queryClient.invalidateQueries({ queryKey: ["icu-statistics"] });
      toast({ title: "Bed status updated" });
    },
  });
}

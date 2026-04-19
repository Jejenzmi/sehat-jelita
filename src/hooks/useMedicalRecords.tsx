import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface MedicalRecord {
  id: string;
  patient_id: string;
  visit_id: string;
  doctor_id: string;
  record_date: string;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  heart_rate: number | null;
  respiratory_rate: number | null;
  temperature: number | null;
  weight: number | null;
  height: number | null;
  oxygen_saturation: number | null;
  physical_examination: string | null;
  additional_notes: string | null;
  patients?: {
    full_name: string;
    medical_record_number: string;
    gender: string;
    birth_date: string;
  };
  doctors?: {
    full_name: string;
    specialization: string;
  };
  diagnoses?: Diagnosis[];
}

export interface Diagnosis {
  id: string;
  medical_record_id: string;
  icd10_code: string;
  description: string;
  diagnosis_type: string;
  notes: string | null;
}

export interface ICD10Code {
  id: string;
  code: string;
  description_en: string;
  description_id: string | null;
  category: string | null;
}

export function useMedicalRecords(patientId?: string) {
  return useQuery({
    queryKey: ["medical-records", patientId],
    queryFn: async (): Promise<MedicalRecord[]> => {
      let query = supabase
        .from("medical_records")
        .select(`
          *,
          patients (full_name, medical_record_number, gender, birth_date),
          doctors (full_name, specialization),
          diagnoses (*)
        `)
        .order("record_date", { ascending: false });

      if (patientId) {
        query = query.eq("patient_id", patientId);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data as MedicalRecord[];
    },
  });
}

export function useMedicalRecordStats() {
  return useQuery({
    queryKey: ["medical-record-stats"],
    queryFn: async () => {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();

      // Total records
      const { count: totalRecords } = await supabase
        .from("medical_records")
        .select("*", { count: "exact", head: true });

      // Today's records
      const { count: todayRecords } = await supabase
        .from("medical_records")
        .select("*", { count: "exact", head: true })
        .gte("record_date", startOfDay);

      // Active doctors (who have records today)
      const { data: activeDoctors } = await supabase
        .from("medical_records")
        .select("doctor_id")
        .gte("record_date", startOfDay);

      const uniqueDoctors = new Set(activeDoctors?.map((d) => d.doctor_id)).size;

      // ICD-10 compliance (records with at least one diagnosis)
      const { data: recordsWithDiagnosis } = await supabase
        .from("medical_records")
        .select(`
          id,
          diagnoses (id)
        `)
        .gte("record_date", startOfDay);

      const recordsWithICD = recordsWithDiagnosis?.filter(
        (r) => (r.diagnoses as any[])?.length > 0
      ).length || 0;

      const compliance = todayRecords && todayRecords > 0 
        ? Math.round((recordsWithICD / todayRecords) * 100)
        : 100;

      return {
        totalRecords: totalRecords || 0,
        todayRecords: todayRecords || 0,
        activeDoctors: uniqueDoctors,
        icdCompliance: compliance,
      };
    },
  });
}

export function useICD10Codes(search?: string) {
  return useQuery({
    queryKey: ["icd10-codes", search],
    queryFn: async (): Promise<ICD10Code[]> => {
      let query = supabase
        .from("icd10_codes")
        .select("*")
        .eq("is_active", true)
        .limit(50);

      if (search && search.length >= 2) {
        query = query.or(`code.ilike.%${search}%,description_en.ilike.%${search}%,description_id.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !search || search.length >= 2,
  });
}

export function useCreateMedicalRecord() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      patient_id: string;
      visit_id: string;
      doctor_id: string;
      subjective?: string;
      objective?: string;
      assessment?: string;
      plan?: string;
      vitals?: {
        blood_pressure_systolic?: number;
        blood_pressure_diastolic?: number;
        heart_rate?: number;
        respiratory_rate?: number;
        temperature?: number;
        weight?: number;
        height?: number;
        oxygen_saturation?: number;
      };
      diagnoses?: {
        icd10_code: string;
        description: string;
        diagnosis_type: string;
      }[];
    }) => {
      // Create medical record
      const { data: record, error: recordError } = await supabase
        .from("medical_records")
        .insert({
          patient_id: data.patient_id,
          visit_id: data.visit_id,
          doctor_id: data.doctor_id,
          subjective: data.subjective,
          objective: data.objective,
          assessment: data.assessment,
          plan: data.plan,
          blood_pressure_systolic: data.vitals?.blood_pressure_systolic,
          blood_pressure_diastolic: data.vitals?.blood_pressure_diastolic,
          heart_rate: data.vitals?.heart_rate,
          respiratory_rate: data.vitals?.respiratory_rate,
          temperature: data.vitals?.temperature,
          weight: data.vitals?.weight,
          height: data.vitals?.height,
          oxygen_saturation: data.vitals?.oxygen_saturation,
        })
        .select()
        .single();

      if (recordError) throw recordError;

      // Add diagnoses
      if (data.diagnoses && data.diagnoses.length > 0) {
        const diagnosesWithRecordId = data.diagnoses.map((d) => ({
          ...d,
          medical_record_id: record.id,
        }));

        const { error: diagnosisError } = await supabase
          .from("diagnoses")
          .insert(diagnosesWithRecordId);

        if (diagnosisError) throw diagnosisError;
      }

      return record;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medical-records"] });
      queryClient.invalidateQueries({ queryKey: ["medical-record-stats"] });
      toast({
        title: "Berhasil",
        description: "Rekam medis berhasil disimpan",
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

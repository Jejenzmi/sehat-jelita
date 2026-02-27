import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { useToast } from "./use-toast";

export type HospitalType = 'A' | 'B' | 'C' | 'D' | 'FKTP';

export interface HospitalProfileData {
  hospital_name: string;
  hospital_code: string;
  hospital_type: string;
  facility_level: HospitalType;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  accreditation_status?: string;
  bed_count_total?: number;
  is_teaching_hospital?: boolean;
  npwp?: string;
  director_name?: string;
  organization_id?: string;
}

export function useIsSetupCompleted() {
  return useQuery({
    queryKey: ["setup-completed"],
    queryFn: async () => {
      const { data, error } = await db.rpc("is_setup_completed");
      if (error) throw error;
      return data as boolean;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useHospitalProfile() {
  return useQuery({
    queryKey: ["hospital-profile"],
    queryFn: async () => {
      const { data, error } = await db
        .from("hospital_profile")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useModuleConfigurations(hospitalType?: HospitalType) {
  return useQuery({
    queryKey: ["module-configurations", hospitalType],
    queryFn: async () => {
      if (!hospitalType) {
        const { data, error } = await db
          .from("module_configurations")
          .select("*")
          .eq("is_active", true)
          .order("display_order");
        if (error) throw error;
        return data;
      }

      const { data, error } = await db.rpc("get_available_modules", {
        p_hospital_type: hospitalType,
      });
      if (error) throw error;
      return data;
    },
    enabled: true,
  });
}

export function useCompleteSetup() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileData: HospitalProfileData) => {
      const { data: { user } } = await db.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Check if profile exists
      const { data: existing } = await db
        .from("hospital_profile")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await db
          .from("hospital_profile")
          .update({
            ...profileData,
            setup_completed: true,
            setup_completed_at: new Date().toISOString(),
            setup_completed_by: user.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await db
          .from("hospital_profile")
          .insert({
            ...profileData,
            setup_completed: true,
            setup_completed_at: new Date().toISOString(),
            setup_completed_by: user.id,
          });
        if (error) throw error;
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["setup-completed"] });
      queryClient.invalidateQueries({ queryKey: ["hospital-profile"] });
      queryClient.invalidateQueries({ queryKey: ["module-configurations"] });
      toast({
        title: "Setup Selesai!",
        description: "Konfigurasi rumah sakit berhasil disimpan.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAvailableModulesForType(hospitalType: HospitalType) {
  return useQuery({
    queryKey: ["available-modules", hospitalType],
    queryFn: async () => {
      const { data, error } = await db.rpc("get_available_modules", {
        p_hospital_type: hospitalType,
      });
      if (error) throw error;
      return data as Array<{
        module_code: string;
        module_name: string;
        module_category: string;
        module_path: string;
        module_icon: string | null;
        display_order: number;
        is_core_module: boolean;
      }>;
    },
    enabled: !!hospitalType,
  });
}

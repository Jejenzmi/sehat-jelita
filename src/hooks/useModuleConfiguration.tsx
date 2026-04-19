import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

interface ModuleConfig {
  module_code: string;
  module_name: string;
  module_category: string;
  module_path: string;
  module_icon: string | null;
  display_order: number;
  is_core_module: boolean;
}

export function useModuleConfiguration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all available modules for current hospital type
  const { data: availableModules, isLoading: loadingModules } = useQuery({
    queryKey: ["all-modules-for-config"],
    queryFn: async () => {
      // First get hospital type
      const { data: profile } = await supabase
        .from("hospital_profile")
        .select("facility_level, enabled_modules")
        .limit(1)
        .maybeSingle();

      if (!profile?.facility_level) {
        // Return all modules if no profile
        const { data, error } = await supabase
          .from("module_configurations")
          .select("*")
          .eq("is_active", true)
          .order("display_order");
        if (error) throw error;
        return { modules: data, enabledModules: [] as string[], hospitalType: null };
      }

      // Get modules for this hospital type
      const { data, error } = await supabase.rpc("get_available_modules", {
        p_hospital_type: profile.facility_level,
      });
      if (error) throw error;

      // Parse enabled_modules from JSONB
      let enabledModules: string[] = [];
      if (profile.enabled_modules && Array.isArray(profile.enabled_modules)) {
        enabledModules = profile.enabled_modules as string[];
      }

      return {
        modules: data as ModuleConfig[],
        enabledModules,
        hospitalType: profile.facility_level,
      };
    },
  });

  // Toggle module enabled/disabled
  const toggleModule = useMutation({
    mutationFn: async ({ moduleCode, enabled }: { moduleCode: string; enabled: boolean }) => {
      const { error } = await supabase.rpc("toggle_module", {
        p_module_code: moduleCode,
        p_enabled: enabled,
      });
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-modules-for-config"] });
      queryClient.invalidateQueries({ queryKey: ["available-modules-for-sidebar"] });
      queryClient.invalidateQueries({ queryKey: ["hospital-profile-for-modules"] });
      toast({
        title: "Berhasil",
        description: "Konfigurasi modul berhasil diperbarui",
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

  // Batch update enabled modules
  const updateEnabledModules = useMutation({
    mutationFn: async (moduleCodes: string[]) => {
      const { error } = await supabase.rpc("update_enabled_modules", {
        p_module_codes: moduleCodes,
      });
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-modules-for-config"] });
      queryClient.invalidateQueries({ queryKey: ["available-modules-for-sidebar"] });
      queryClient.invalidateQueries({ queryKey: ["hospital-profile-for-modules"] });
      toast({
        title: "Berhasil",
        description: "Konfigurasi modul berhasil disimpan",
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

  return {
    modules: availableModules?.modules || [],
    enabledModules: availableModules?.enabledModules || [],
    hospitalType: availableModules?.hospitalType,
    isLoading: loadingModules,
    toggleModule,
    updateEnabledModules,
  };
}

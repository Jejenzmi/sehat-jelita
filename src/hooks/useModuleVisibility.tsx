import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

interface ModuleConfig {
  module_code: string;
  module_name: string;
  module_category: string;
  module_path: string;
  is_core_module: boolean;
}

export function useModuleVisibility() {
  // Get hospital profile to know the type
  const { data: hospitalProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ["hospital-profile-for-modules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hospital_profile")
        .select("facility_level, setup_completed")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Get available modules for this hospital type
  const { data: availableModules, isLoading: loadingModules } = useQuery({
    queryKey: ["available-modules-for-sidebar", hospitalProfile?.facility_level],
    queryFn: async () => {
      if (!hospitalProfile?.facility_level) {
        // If no hospital type set, return all modules (setup not done)
        const { data, error } = await supabase
          .from("module_configurations")
          .select("module_code, module_name, module_category, module_path, is_core_module")
          .eq("is_active", true);
        if (error) throw error;
        return data as ModuleConfig[];
      }

      const { data, error } = await supabase.rpc("get_available_modules", {
        p_hospital_type: hospitalProfile.facility_level,
      });
      if (error) throw error;
      return data as ModuleConfig[];
    },
    enabled: !loadingProfile,
  });

  const availablePaths = useMemo(() => {
    if (!availableModules) return new Set<string>();
    return new Set(availableModules.map((m) => m.module_path));
  }, [availableModules]);

  const isModuleAvailable = (path: string): boolean => {
    // If setup not completed, show all modules
    if (!hospitalProfile?.setup_completed) return true;
    // Always allow these paths
    if (path === "/" || path === "/dashboard") return true;
    // Check if module is available for this hospital type
    return availablePaths.has(path);
  };

  return {
    isModuleAvailable,
    availableModules,
    hospitalType: hospitalProfile?.facility_level,
    setupCompleted: hospitalProfile?.setup_completed,
    isLoading: loadingProfile || loadingModules,
  };
}

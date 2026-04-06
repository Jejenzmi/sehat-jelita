import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { HospitalType, getPathsForType, MODULE_DEFINITIONS } from "@/lib/modules";

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const FETCH_OPTS: RequestInit = { credentials: 'include', headers: { 'Content-Type': 'application/json' } };

export function useModuleVisibility() {
  // 1. Read hospital profile (facility_level + setup_completed) from backend
  const { data: hospitalProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ["hospital-profile-for-modules"],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/hospital-profile`, FETCH_OPTS);
        if (!res.ok) return null;
        const json = await res.json();
        return json.data as { facility_level?: string; setup_completed?: boolean } | null;
      } catch {
        return null;
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  // 2. Read enabled_modules list saved by admin in settings
  const { data: enabledModulesRaw, isLoading: loadingEnabled } = useQuery({
    queryKey: ["enabled-modules"],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/system-settings`, FETCH_OPTS);
        if (!res.ok) return null;
        const json = await res.json();
        const settings: { setting_key: string; setting_value: unknown }[] = json.data || [];
        const row = settings.find(s => s.setting_key === 'enabled_modules');
        if (!row) return null;
        const val = row.setting_value;
        return Array.isArray(val) ? (val as string[]) : null;
      } catch {
        return null;
      }
    },
    staleTime: 1000 * 60 * 2,
  });

  const facilityLevel = hospitalProfile?.facility_level as HospitalType | undefined;
  const setupCompleted = hospitalProfile?.setup_completed ?? false;

  // Paths allowed by hospital type
  const typePaths = useMemo(() => {
    if (!facilityLevel) return null;
    return getPathsForType(facilityLevel);
  }, [facilityLevel]);

  // Paths of enabled modules (if admin has customized the list)
  const enabledPaths = useMemo(() => {
    if (!enabledModulesRaw) return null;
    const pathMap = new Map(MODULE_DEFINITIONS.map(m => [m.module_code, m.module_path]));
    return new Set(enabledModulesRaw.map(code => pathMap.get(code)).filter(Boolean) as string[]);
  }, [enabledModulesRaw]);

  const isModuleAvailable = (path: string): boolean => {
    // Always show dashboard
    if (path === '/' || path === '/dashboard') return true;
    // If setup not done yet, show everything
    if (!setupCompleted) return true;
    // If hospital type not set, show everything
    if (!typePaths) return true;
    // Must be applicable for this hospital type
    if (!typePaths.has(path)) return false;
    // If admin has a custom enabled list, also check that
    if (enabledPaths && !enabledPaths.has(path)) {
      // Core modules are always visible even if not explicitly in enabled list
      const mod = MODULE_DEFINITIONS.find(m => m.module_path === path);
      if (mod?.is_core_module) return true;
      return false;
    }
    return true;
  };

  return {
    isModuleAvailable,
    facilityLevel,
    setupCompleted,
    isLoading: loadingProfile || loadingEnabled,
  };
}

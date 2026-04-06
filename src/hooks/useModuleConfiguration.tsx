import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";
import { HospitalType, ModuleDefinition, getModulesForType, MODULE_DEFINITIONS } from "@/lib/modules";

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const FETCH_OPTS: RequestInit = { credentials: 'include', headers: { 'Content-Type': 'application/json' } };

async function apiFetch(path: string) {
  const res = await fetch(`${API_BASE}${path}`, FETCH_OPTS);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

async function apiPost(path: string, body: unknown) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...FETCH_OPTS, method: 'POST', body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export function useModuleConfiguration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch hospital profile to get facility_level
  const { data: hospitalProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ["hospital-profile-for-modules"],
    queryFn: async () => {
      const json = await apiFetch('/admin/hospital-profile');
      return json.data as { facility_level?: string } | null;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Fetch enabled_modules list from system_settings
  const { data: enabledModulesRaw, isLoading: loadingEnabled } = useQuery({
    queryKey: ["enabled-modules"],
    queryFn: async () => {
      const json = await apiFetch('/admin/system-settings');
      const settings: { setting_key: string; setting_value: unknown }[] = json.data || [];
      const row = settings.find(s => s.setting_key === 'enabled_modules');
      if (!row) return null;
      const val = row.setting_value;
      return Array.isArray(val) ? (val as string[]) : null;
    },
    staleTime: 1000 * 60 * 2,
  });

  const hospitalType = hospitalProfile?.facility_level as HospitalType | undefined;

  // Modules available for this hospital type (from shared definitions)
  const modules: ModuleDefinition[] = hospitalType
    ? getModulesForType(hospitalType)
    : MODULE_DEFINITIONS;

  // Enabled module codes: if admin has saved a list, use it; otherwise default to all
  const enabledModules: string[] = enabledModulesRaw
    ?? modules.map(m => m.module_code);

  // Batch update enabled modules list
  const updateEnabledModules = useMutation({
    mutationFn: async (moduleCodes: string[]) => {
      await apiPost('/admin/enabled-modules', { p_module_codes: moduleCodes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enabled-modules"] });
      queryClient.invalidateQueries({ queryKey: ["hospital-profile-for-modules"] });
      toast({ title: "Berhasil", description: "Konfigurasi modul berhasil disimpan" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal menyimpan", description: error.message, variant: "destructive" });
    },
  });

  // Toggle single module
  const toggleModule = useMutation({
    mutationFn: async ({ moduleCode, enabled }: { moduleCode: string; enabled: boolean }) => {
      await apiPost('/admin/enabled-modules/toggle', { p_module_code: moduleCode, p_enabled: enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enabled-modules"] });
      queryClient.invalidateQueries({ queryKey: ["hospital-profile-for-modules"] });
      toast({ title: "Berhasil", description: "Modul berhasil diperbarui" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  return {
    modules,
    enabledModules,
    hospitalType,
    isLoading: loadingProfile || loadingEnabled,
    toggleModule,
    updateEnabledModules,
  };
}

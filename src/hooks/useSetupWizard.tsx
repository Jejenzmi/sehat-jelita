import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";
import { HospitalType, MODULE_DEFINITIONS as SHARED_MODULE_DEFINITIONS, getModulesForType } from "@/lib/modules";

export type { HospitalType };

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

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const FETCH_OPTS: RequestInit = { credentials: 'include', headers: { 'Content-Type': 'application/json' } };

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, FETCH_OPTS);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return json.data as T;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...FETCH_OPTS, method: 'POST', body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return json.data as T;
}

// ----------------------------------------------------------------
// Check whether setup has been completed (reads system_settings)
// ----------------------------------------------------------------
export function useIsSetupCompleted() {
  return useQuery({
    queryKey: ["setup-completed"],
    queryFn: async () => {
      try {
        // Try public endpoint first (works even before auth is fully ready)
        const res = await fetch(`${API_BASE}/setup-status`, FETCH_OPTS);
        if (res.ok) {
          const json = await res.json().catch(() => ({}));
          return json.data === true;
        }
        // Fallback: try authenticated endpoint
        const res2 = await fetch(`${API_BASE}/admin/setup-status`, FETCH_OPTS);
        if (res2.ok) {
          const json2 = await res2.json().catch(() => ({}));
          return json2.data === true;
        }
        return false;
      } catch {
        return false;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 min
    retry: false,
  });
}

// ----------------------------------------------------------------
// Fetch current hospital profile (if any)
// ----------------------------------------------------------------
export function useHospitalProfile() {
  return useQuery({
    queryKey: ["hospital-profile"],
    queryFn: () => apiGet<HospitalProfileData | null>('/admin/hospital-profile'),
  });
}

// ----------------------------------------------------------------
// Available modules for a hospital type  (uses shared MODULE_DEFINITIONS)
// ----------------------------------------------------------------
export function useModuleConfigurations(hospitalType?: HospitalType) {
  return useQuery({
    queryKey: ["module-configurations", hospitalType],
    queryFn: async () => {
      if (!hospitalType) return SHARED_MODULE_DEFINITIONS;
      return getModulesForType(hospitalType);
    },
    enabled: true,
  });
}

export function useAvailableModulesForType(hospitalType: HospitalType) {
  return useQuery({
    queryKey: ["available-modules", hospitalType],
    queryFn: async () => getModulesForType(hospitalType),
    enabled: !!hospitalType,
  });
}

// ----------------------------------------------------------------
// Complete setup: saves hospital profile to DB then redirects
// ----------------------------------------------------------------
export function useCompleteSetup() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileData: HospitalProfileData) => {
      // POST to /api/admin/hospital-profile
      // This endpoint upserts the hospital record AND writes setup_completed=true
      const result = await apiPost('/admin/hospital-profile', profileData);
      return result;
    },
    onSuccess: () => {
      // Immediately set cache to true so ProtectedRoute doesn't bounce back to /setup
      queryClient.setQueryData(["setup-completed"], true);
      // Then invalidate to trigger a background refetch to confirm
      queryClient.invalidateQueries({ queryKey: ["setup-completed"] });
      queryClient.invalidateQueries({ queryKey: ["hospital-profile"] });
      queryClient.invalidateQueries({ queryKey: ["hospital-profile-for-modules"] });
      queryClient.invalidateQueries({ queryKey: ["enabled-modules"] });
      queryClient.invalidateQueries({ queryKey: ["module-configurations"] });
      toast({
        title: "Setup Selesai!",
        description: "Konfigurasi rumah sakit berhasil disimpan. Selamat datang di SIMRS ZEN!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal Menyimpan Setup",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

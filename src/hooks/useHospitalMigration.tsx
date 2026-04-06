import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const FETCH_OPTS: RequestInit = { credentials: 'include', headers: { 'Content-Type': 'application/json' } };
async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, FETCH_OPTS);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return (json.data ?? json) as T;
}
async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { ...FETCH_OPTS, method: 'POST', body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return (json.data ?? json) as T;
}

export type HospitalType = 'A' | 'B' | 'C' | 'D' | 'FKTP';

export interface ModuleInfo {
  code: string;
  name: string;
  category: string;
}

export interface MigrationPreview {
  current_type: string;
  new_type: string;
  current_modules: ModuleInfo[];
  new_modules: ModuleInfo[];
  modules_added: ModuleInfo[];
  modules_removed: ModuleInfo[];
  error?: string;
}

export interface MigrationResult {
  success: boolean;
  from_type: string;
  to_type: string;
  modules_added: string[];
  modules_removed: string[];
}

export interface MigrationLog {
  id: string;
  from_type: string;
  to_type: string;
  modules_added: string[];
  modules_removed: string[];
  migrated_by: string;
  migration_notes: string | null;
  created_at: string;
}

export function usePreviewMigration(newType: HospitalType | null) {
  return useQuery({
    queryKey: ["migration-preview", newType],
    queryFn: () => apiFetch<MigrationPreview>(`/admin/hospital-migration/preview?new_type=${newType}`),
    enabled: !!newType,
  });
}

export function useMigrateHospitalType() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ newType, notes }: { newType: HospitalType; notes?: string }) =>
      apiPost<MigrationResult>('/admin/hospital-migration/execute', { new_type: newType, notes: notes || null }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["hospital-profile"] });
      queryClient.invalidateQueries({ queryKey: ["hospital-profile-for-modules"] });
      queryClient.invalidateQueries({ queryKey: ["enabled-modules"] });
      queryClient.invalidateQueries({ queryKey: ["module-configurations"] });
      queryClient.invalidateQueries({ queryKey: ["available-modules"] });
      queryClient.invalidateQueries({ queryKey: ["migration-logs"] });

      toast({
        title: "Migrasi Berhasil!",
        description: `Tipe RS berhasil diubah dari ${data.from_type} ke ${data.to_type}. Halaman akan dimuat ulang...`,
      });

      setTimeout(() => window.location.reload(), 1500);
    },
    onError: (error: Error) => {
      toast({ title: "Gagal Migrasi", description: error.message, variant: "destructive" });
    },
  });
}

export function useMigrationLogs() {
  return useQuery({
    queryKey: ["migration-logs"],
    queryFn: () => apiFetch<MigrationLog[]>('/admin/hospital-migration/logs'),
  });
}

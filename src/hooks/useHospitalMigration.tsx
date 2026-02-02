import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

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
    queryFn: async () => {
      if (!newType) return null;
      
      const { data, error } = await supabase.rpc("preview_hospital_type_migration", {
        p_new_type: newType,
      });
      
      if (error) throw error;
      return data as unknown as MigrationPreview;
    },
    enabled: !!newType,
  });
}

export function useMigrateHospitalType() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ newType, notes }: { newType: HospitalType; notes?: string }) => {
      const { data, error } = await supabase.rpc("migrate_hospital_type", {
        p_new_type: newType,
        p_notes: notes || null,
      });
      
      if (error) throw error;
      return data as unknown as MigrationResult;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["hospital-profile"] });
      queryClient.invalidateQueries({ queryKey: ["module-configurations"] });
      queryClient.invalidateQueries({ queryKey: ["available-modules"] });
      queryClient.invalidateQueries({ queryKey: ["migration-logs"] });
      
      toast({
        title: "Migrasi Berhasil!",
        description: `Tipe RS berhasil diubah dari ${data.from_type} ke ${data.to_type}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal Migrasi",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useMigrationLogs() {
  return useQuery({
    queryKey: ["migration-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hospital_type_migrations")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as MigrationLog[];
    },
  });
}

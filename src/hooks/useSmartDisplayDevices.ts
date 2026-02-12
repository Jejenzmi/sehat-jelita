import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SmartDisplayDevice {
  id: string;
  device_code: string;
  device_name: string;
  location: string;
  description: string | null;
  enabled_modules: string[];
  display_type: string;
  is_active: boolean;
  auto_rotate: boolean;
  rotate_interval: number;
  department_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useSmartDisplayDevices() {
  return useQuery({
    queryKey: ["smart-display-devices"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("smart_display_devices")
        .select("*")
        .order("device_code");
      if (error) throw error;
      return (data || []) as SmartDisplayDevice[];
    },
  });
}

export function useSmartDisplayDevice(deviceCode: string | null) {
  return useQuery({
    queryKey: ["smart-display-device", deviceCode],
    queryFn: async () => {
      if (!deviceCode) return null;
      const { data, error } = await (supabase as any)
        .from("smart_display_devices")
        .select("*")
        .eq("device_code", deviceCode)
        .maybeSingle();
      if (error) throw error;
      return data as SmartDisplayDevice | null;
    },
    enabled: !!deviceCode,
  });
}

export function useCreateSmartDisplayDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (device: Omit<SmartDisplayDevice, "id" | "created_at" | "updated_at">) => {
      const { error } = await (supabase as any)
        .from("smart_display_devices")
        .insert({
          ...device,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["smart-display-devices"] }); toast.success("Device berhasil ditambahkan"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateSmartDisplayDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<SmartDisplayDevice>) => {
      const { error } = await (supabase as any)
        .from("smart_display_devices")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["smart-display-devices"] }); toast.success("Device berhasil diupdate"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteSmartDisplayDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("smart_display_devices")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["smart-display-devices"] }); toast.success("Device berhasil dihapus"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { toast } from "sonner";

export interface SmartDisplayConfig {
  id: string;
  display_type: string;
  running_text: string | null;
  running_text_enabled: boolean;
  slideshow_enabled: boolean;
  slideshow_interval: number;
  video_enabled: boolean;
  video_auto_play: boolean;
  auto_refresh: boolean;
  auto_refresh_interval: number;
  custom_config: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export function useSmartDisplayConfig(displayType = "lobby") {
  return useQuery({
    queryKey: ["smart-display-config", displayType],
    queryFn: async () => {
      const { data, error } = await (db as any)
        .from("smart_display_config")
        .select("*")
        .eq("display_type", displayType)
        .maybeSingle();
      if (error) throw error;
      return data as SmartDisplayConfig | null;
    },
  });
}

export function useUpdateSmartDisplayConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<SmartDisplayConfig>) => {
      const { error } = await (db as any)
        .from("smart_display_config")
        .update({ ...updates, updated_by: (await db.auth.getUser()).data.user?.id })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smart-display-config"] });
      toast.success("Konfigurasi Smart Display berhasil disimpan");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

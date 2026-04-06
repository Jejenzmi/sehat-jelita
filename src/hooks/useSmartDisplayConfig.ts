import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const FETCH_OPTS: RequestInit = { credentials: 'include', headers: { 'Content-Type': 'application/json' } };

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, FETCH_OPTS);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return (json.data ?? json) as T;
}

async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...FETCH_OPTS, method: 'PUT', body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return (json.data ?? json) as T;
}

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
  custom_config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export function useSmartDisplayConfig(displayType = "lobby") {
  return useQuery({
    queryKey: ["smart-display-config", displayType],
    queryFn: () => apiFetch<SmartDisplayConfig | null>(`/smart-display/config/${displayType}`),
  });
}

export function useUpdateSmartDisplayConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Partial<SmartDisplayConfig>) =>
      apiPut<SmartDisplayConfig>(`/smart-display/config/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smart-display-config"] });
      toast.success("Konfigurasi Smart Display berhasil disimpan");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

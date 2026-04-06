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

export interface SmartDisplayMedia {
  id: string;
  display_type: string;
  media_type: "image" | "video";
  file_url: string;
  file_name: string;
  title: string | null;
  display_order: number;
  created_at: string;
}

export function useSmartDisplayMedia(displayType: string, mediaType?: "image" | "video") {
  return useQuery({
    queryKey: ["smart-display-media", displayType, mediaType],
    queryFn: () => {
      const p = new URLSearchParams({ display_type: displayType });
      if (mediaType) p.set('media_type', mediaType);
      return apiFetch<SmartDisplayMedia[]>(`/smart-display/media?${p}`);
    },
  });
}

export function useUploadSmartDisplayMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file, displayType, mediaType, title,
    }: { file: File; displayType: string; mediaType: "image" | "video"; title?: string }) => {
      // Convert file to base64 and POST to backend
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch(`${API_BASE}/smart-display/media/upload`, {
        ...FETCH_OPTS,
        method: 'POST',
        body: JSON.stringify({
          display_type: displayType,
          media_type:   mediaType,
          file_name:    file.name,
          file_data:    base64,
          title:        title || file.name,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || res.statusText);
      return json.data as SmartDisplayMedia;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smart-display-media"] });
      toast.success("Media berhasil diupload");
    },
    onError: (e: Error) => toast.error("Gagal upload: " + e.message),
  });
}

export function useDeleteSmartDisplayMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (media: SmartDisplayMedia) => {
      const res = await fetch(`${API_BASE}/smart-display/media/${media.id}`, {
        ...FETCH_OPTS, method: 'DELETE',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || res.statusText);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smart-display-media"] });
      toast.success("Media berhasil dihapus");
    },
    onError: (e: Error) => toast.error("Gagal hapus: " + e.message),
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { toast } from "sonner";

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
    queryFn: async () => {
      let query = (db as any)
        .from("smart_display_media")
        .select("*")
        .eq("display_type", displayType)
        .order("display_order", { ascending: true });

      if (mediaType) {
        query = query.eq("media_type", mediaType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as SmartDisplayMedia[];
    },
  });
}

export function useUploadSmartDisplayMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      displayType,
      mediaType,
      title,
    }: {
      file: File;
      displayType: string;
      mediaType: "image" | "video";
      title?: string;
    }) => {
      const ext = file.name.split(".").pop();
      const filePath = `${displayType}/${mediaType}/${Date.now()}.${ext}`;

      const { error: uploadError } = await db.storage
        .from("smart-display-media")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = db.storage
        .from("smart-display-media")
        .getPublicUrl(filePath);

      const { error: dbError } = await (db as any)
        .from("smart_display_media")
        .insert({
          display_type: displayType,
          media_type: mediaType,
          file_url: urlData.publicUrl,
          file_name: file.name,
          title: title || file.name,
          created_by: (await db.auth.getUser()).data.user?.id,
        });

      if (dbError) throw dbError;
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
      // Extract storage path from URL
      const url = new URL(media.file_url);
      const pathParts = url.pathname.split("/storage/v1/object/public/smart-display-media/");
      if (pathParts[1]) {
        await db.storage.from("smart-display-media").remove([decodeURIComponent(pathParts[1])]);
      }

      const { error } = await (db as any)
        .from("smart_display_media")
        .delete()
        .eq("id", media.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smart-display-media"] });
      toast.success("Media berhasil dihapus");
    },
    onError: (e: Error) => toast.error("Gagal hapus: " + e.message),
  });
}

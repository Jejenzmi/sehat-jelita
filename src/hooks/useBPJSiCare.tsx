import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";

interface SyncResult {
  room: string;
  action: string;
  result: any;
}

export function useBPJSRoomClasses() {
  return useQuery({
    queryKey: ["bpjs-room-classes"],
    queryFn: async () => {
      const { data, error } = await db.functions.invoke("bpjs-icare", {
        body: { action: "get_room_classes" },
      });
      if (error) throw error;
      return data?.response?.list || [];
    },
    enabled: false, // Only fetch when explicitly called
  });
}

export function useBPJSBedAvailability() {
  return useQuery({
    queryKey: ["bpjs-beds"],
    queryFn: async () => {
      const { data, error } = await db.functions.invoke("bpjs-icare", {
        body: { action: "read_beds", data: { start: 1, limit: 100 } },
      });
      if (error) throw error;
      return data?.response || [];
    },
    enabled: false,
  });
}

export function useSyncBedsToBPJS() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await db.functions.invoke("bpjs-icare", {
        body: { action: "sync_beds" },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast({
        title: "Sinkronisasi Berhasil",
        description: `${data?.response?.synced || 0} kamar berhasil disinkronkan ke BPJS`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Sinkronisasi Gagal",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateBedToBPJS() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (roomData: {
      room_code: string;
      room_class: string;
      room_name: string;
      capacity: number;
      available: number;
    }) => {
      const { data, error } = await db.functions.invoke("bpjs-icare", {
        body: { action: "update_bed", data: roomData },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Update Berhasil",
        description: "Data ketersediaan kamar berhasil diupdate ke BPJS",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Gagal",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// ============================================
// BPJS iCare JKN Types
// ============================================

export interface ICarePatientHistory {
  nomorkartu: string;
  namapeserta: string;
  tgllahir: string;
  riwayat: Array<{
    nosjp: string;
    tglpelayanan: string;
    noresep: string;
    kodeobat: string;
    namaobat: string;
    jmlobat: number;
  }>;
}

export interface ICareValidateResponse {
  response: {
    flag: number;
    message: string;
    data?: any;
  };
  metaData: {
    code: string;
    message: string;
  };
}

// Helper function to call BPJS Antrean edge function
async function callBPJSAntrean(action: string, params: Record<string, any> = {}) {
  const { data, error } = await supabase.functions.invoke("bpjs-antrean", {
    body: { action, ...params },
  });

  if (error) throw error;
  return data;
}

// ============================================
// iCARE JKN HOOKS
// ============================================

/**
 * Validate patient for FKRTL (Rumah Sakit)
 * Returns medication history and patient data
 */
export function useICareValidateFKRTL() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: { nomorKartu: string; kodeDokter: number }) =>
      callBPJSAntrean("icare_validate_fkrtl", data),
    onSuccess: (data) => {
      if (data?.metaData?.code === "200" || data?.metadata?.code === 200) {
        toast({
          title: "Sukses",
          description: "Validasi iCare berhasil",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Validate patient for FKTP (Puskesmas)
 * Returns medication history
 */
export function useICareValidateFKTP() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (nomorKartu: string) =>
      callBPJSAntrean("icare_validate_fktp", { nomorKartu }),
    onSuccess: (data) => {
      if (data?.metaData?.code === "200" || data?.metadata?.code === 200) {
        toast({
          title: "Sukses",
          description: "Validasi iCare berhasil",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Query hook for validating FKRTL patient with card number and doctor
 */
export function useICarePatientValidation(nomorKartu: string, kodeDokter: number) {
  return useQuery({
    queryKey: ["bpjs-icare", "validate-fkrtl", nomorKartu, kodeDokter],
    queryFn: () =>
      callBPJSAntrean("icare_validate_fkrtl", { nomorKartu, kodeDokter }),
    enabled: !!nomorKartu && !!kodeDokter,
  });
}

// ============================================
// iCare Bed Management (from existing bpjs-icare edge function)
// ============================================

async function callBPJSiCare(action: string, data: Record<string, any> = {}) {
  const { data: result, error } = await supabase.functions.invoke("bpjs-icare", {
    body: { action, data },
  });

  if (error) throw error;
  return result;
}

/**
 * Get room class references from BPJS
 */
export function useICareRoomClasses() {
  return useQuery({
    queryKey: ["bpjs-icare", "room-classes"],
    queryFn: () => callBPJSiCare("get_room_classes"),
  });
}

/**
 * Read bed availability from BPJS
 */
export function useICareBeds(start: number = 1, limit: number = 100) {
  return useQuery({
    queryKey: ["bpjs-icare", "beds", start, limit],
    queryFn: () => callBPJSiCare("read_beds", { start, limit }),
  });
}

/**
 * Sync all beds from SIMRS to BPJS iCare
 */
export function useSyncBedsToBPJS() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => callBPJSiCare("sync_beds"),
    onSuccess: (data) => {
      toast({
        title: "Sukses",
        description: `${data?.response?.synced || 0} kamar berhasil disinkronkan ke BPJS`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Update single bed availability in BPJS
 */
export function useUpdateBedToBPJS() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: {
      room_code: string;
      room_class: string;
      room_name: string;
      capacity: number;
      available: number;
    }) => callBPJSiCare("update_bed", data),
    onSuccess: () => {
      toast({
        title: "Sukses",
        description: "Ketersediaan kamar berhasil diupdate ke BPJS",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Create new bed entry in BPJS
 */
export function useCreateBedInBPJS() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: {
      room_code: string;
      room_class: string;
      room_name: string;
      capacity: number;
      available: number;
    }) => callBPJSiCare("create_bed", data),
    onSuccess: () => {
      toast({
        title: "Sukses",
        description: "Kamar berhasil ditambahkan ke BPJS",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Delete bed from BPJS
 */
export function useDeleteBedFromBPJS() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: { room_code: string; room_class: string }) =>
      callBPJSiCare("delete_bed", data),
    onSuccess: () => {
      toast({
        title: "Sukses",
        description: "Kamar berhasil dihapus dari BPJS",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

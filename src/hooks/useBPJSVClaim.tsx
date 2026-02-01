import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// ==================== PESERTA ====================
export function useGetPesertaByNoKartu() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ noKartu, tglSep }: { noKartu: string; tglSep: string }) => {
      const { data, error } = await supabase.functions.invoke("bpjs-vclaim", {
        body: { action: "get_peserta_by_nokartu", data: { noKartu, tglSep } },
      });
      if (error) throw error;
      return data;
    },
    onError: (error: Error) => {
      toast({ title: "Gagal mengambil data peserta", description: error.message, variant: "destructive" });
    },
  });
}

export function useGetPesertaByNIK() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ nik, tglSep }: { nik: string; tglSep: string }) => {
      const { data, error } = await supabase.functions.invoke("bpjs-vclaim", {
        body: { action: "get_peserta_by_nik", data: { nik, tglSep } },
      });
      if (error) throw error;
      return data;
    },
    onError: (error: Error) => {
      toast({ title: "Gagal mengambil data peserta", description: error.message, variant: "destructive" });
    },
  });
}

// ==================== SEP ====================
export function useCreateSEP() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (sepData: any) => {
      const { data, error } = await supabase.functions.invoke("bpjs-vclaim", {
        body: { action: "create_sep", data: sepData },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.metaData?.code === "200") {
        toast({ title: "SEP berhasil dibuat", description: `No SEP: ${data.response?.sep?.noSep}` });
      } else {
        toast({ title: "Gagal membuat SEP", description: data?.metaData?.message, variant: "destructive" });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Gagal membuat SEP", description: error.message, variant: "destructive" });
    },
  });
}

export function useGetSEP() {
  return useMutation({
    mutationFn: async (noSep: string) => {
      const { data, error } = await supabase.functions.invoke("bpjs-vclaim", {
        body: { action: "get_sep", data: { noSep } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useDeleteSEP() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ noSep, user }: { noSep: string; user: string }) => {
      const { data, error } = await supabase.functions.invoke("bpjs-vclaim", {
        body: { action: "delete_sep", data: { noSep, user } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.metaData?.code === "200") {
        toast({ title: "SEP berhasil dihapus" });
      } else {
        toast({ title: "Gagal menghapus SEP", description: data?.metaData?.message, variant: "destructive" });
      }
    },
  });
}

// ==================== LPK ====================
export function useInsertLPK() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (lpkData: any) => {
      const { data, error } = await supabase.functions.invoke("bpjs-vclaim", {
        body: { action: "insert_lpk", data: lpkData },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.metaData?.code === "200") {
        toast({ title: "LPK berhasil disimpan" });
      } else {
        toast({ title: "Gagal menyimpan LPK", description: data?.metaData?.message, variant: "destructive" });
      }
    },
  });
}

export function useUpdateLPK() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (lpkData: any) => {
      const { data, error } = await supabase.functions.invoke("bpjs-vclaim", {
        body: { action: "update_lpk", data: lpkData },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.metaData?.code === "200") {
        toast({ title: "LPK berhasil diupdate" });
      } else {
        toast({ title: "Gagal update LPK", description: data?.metaData?.message, variant: "destructive" });
      }
    },
  });
}

export function useDeleteLPK() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (noSep: string) => {
      const { data, error } = await supabase.functions.invoke("bpjs-vclaim", {
        body: { action: "delete_lpk", data: { noSep } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useGetLPK() {
  return useMutation({
    mutationFn: async ({ tglMasuk, jnsPelayanan }: { tglMasuk: string; jnsPelayanan: string }) => {
      const { data, error } = await supabase.functions.invoke("bpjs-vclaim", {
        body: { action: "get_lpk", data: { tglMasuk, jnsPelayanan } },
      });
      if (error) throw error;
      return data;
    },
  });
}

// ==================== MONITORING ====================
export function useMonitoringKunjungan() {
  return useMutation({
    mutationFn: async ({ tanggal, jnsPelayanan }: { tanggal: string; jnsPelayanan: string }) => {
      const { data, error } = await supabase.functions.invoke("bpjs-vclaim", {
        body: { action: "monitoring_kunjungan", data: { tanggal, jnsPelayanan } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useMonitoringKlaim() {
  return useMutation({
    mutationFn: async ({ tanggal, jnsPelayanan, status }: { tanggal: string; jnsPelayanan: string; status: string }) => {
      const { data, error } = await supabase.functions.invoke("bpjs-vclaim", {
        body: { action: "monitoring_klaim", data: { tanggal, jnsPelayanan, status } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useMonitoringHistoriPelayanan() {
  return useMutation({
    mutationFn: async ({ noKartu, tglMulai, tglAkhir }: { noKartu: string; tglMulai: string; tglAkhir: string }) => {
      const { data, error } = await supabase.functions.invoke("bpjs-vclaim", {
        body: { action: "monitoring_histori_pelayanan", data: { noKartu, tglMulai, tglAkhir } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useMonitoringJasaRaharja() {
  return useMutation({
    mutationFn: async ({ jnsPelayanan, tglMulai, tglAkhir }: { jnsPelayanan: string; tglMulai: string; tglAkhir: string }) => {
      const { data, error } = await supabase.functions.invoke("bpjs-vclaim", {
        body: { action: "monitoring_jasa_raharja", data: { jnsPelayanan, tglMulai, tglAkhir } },
      });
      if (error) throw error;
      return data;
    },
  });
}

// ==================== REFERENSI ====================
export function useRefDiagnosa() {
  return useMutation({
    mutationFn: async (keyword: string) => {
      const { data, error } = await supabase.functions.invoke("bpjs-vclaim", {
        body: { action: "ref_diagnosa", data: { keyword } },
      });
      if (error) throw error;
      return data?.response?.diagnosa || [];
    },
  });
}

export function useRefProsedur() {
  return useMutation({
    mutationFn: async (keyword: string) => {
      const { data, error } = await supabase.functions.invoke("bpjs-vclaim", {
        body: { action: "ref_prosedur", data: { keyword } },
      });
      if (error) throw error;
      return data?.response?.procedure || [];
    },
  });
}

export function useRefPoli() {
  return useMutation({
    mutationFn: async (keyword: string) => {
      const { data, error } = await supabase.functions.invoke("bpjs-vclaim", {
        body: { action: "ref_poli", data: { keyword } },
      });
      if (error) throw error;
      return data?.response?.poli || [];
    },
  });
}

export function useRefFaskes() {
  return useMutation({
    mutationFn: async ({ keyword, jenisFaskes }: { keyword: string; jenisFaskes: string }) => {
      const { data, error } = await supabase.functions.invoke("bpjs-vclaim", {
        body: { action: "ref_faskes", data: { keyword, jenisFaskes } },
      });
      if (error) throw error;
      return data?.response?.faskes || [];
    },
  });
}

export function useRefDokter() {
  return useMutation({
    mutationFn: async ({ jnsPelayanan, tglPelayanan, spesialisasi }: { jnsPelayanan: string; tglPelayanan: string; spesialisasi: string }) => {
      const { data, error } = await supabase.functions.invoke("bpjs-vclaim", {
        body: { action: "ref_dokter", data: { jnsPelayanan, tglPelayanan, spesialisasi } },
      });
      if (error) throw error;
      return data?.response?.list || [];
    },
  });
}

export function useRefRuangRawat() {
  return useQuery({
    queryKey: ["bpjs-ref-ruang-rawat"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("bpjs-vclaim", {
        body: { action: "ref_ruang_rawat", data: {} },
      });
      if (error) throw error;
      return data?.response?.list || [];
    },
    enabled: false,
  });
}

export function useRefCaraKeluar() {
  return useQuery({
    queryKey: ["bpjs-ref-cara-keluar"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("bpjs-vclaim", {
        body: { action: "ref_cara_keluar", data: {} },
      });
      if (error) throw error;
      return data?.response?.list || [];
    },
    enabled: false,
  });
}

export function useRefKondisiPulang() {
  return useQuery({
    queryKey: ["bpjs-ref-kondisi-pulang"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("bpjs-vclaim", {
        body: { action: "ref_kondisi_pulang", data: {} },
      });
      if (error) throw error;
      return data?.response?.list || [];
    },
    enabled: false,
  });
}

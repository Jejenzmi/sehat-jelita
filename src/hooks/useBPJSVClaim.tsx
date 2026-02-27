import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";

// ==================== PESERTA ====================
export function useGetPesertaByNoKartu() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ noKartu, tglSep }: { noKartu: string; tglSep: string }) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
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
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
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
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
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
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
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
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
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
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
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
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
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
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
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
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
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
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
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
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
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
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
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
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
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
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
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
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
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
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
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
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
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
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
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
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
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
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
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
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "ref_kondisi_pulang", data: {} },
      });
      if (error) throw error;
      return data?.response?.list || [];
    },
    enabled: false,
  });
}

// ==================== PRB (Program Rujuk Balik) ====================
export function useInsertPRB() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (prbData: any) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "insert_prb", data: prbData },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.metaData?.code === "200") {
        toast({ title: "PRB berhasil dibuat", description: `No SRB: ${data.response?.noSrb}` });
      } else {
        toast({ title: "Gagal membuat PRB", description: data?.metaData?.message, variant: "destructive" });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Gagal membuat PRB", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdatePRB() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (prbData: any) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "update_prb", data: prbData },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.metaData?.code === "200") {
        toast({ title: "PRB berhasil diupdate" });
      } else {
        toast({ title: "Gagal update PRB", description: data?.metaData?.message, variant: "destructive" });
      }
    },
  });
}

export function useDeletePRB() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ noSrb, noSep, user }: { noSrb: string; noSep: string; user: string }) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "delete_prb", data: { noSrb, noSep, user } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.metaData?.code === "200") {
        toast({ title: "PRB berhasil dihapus" });
      } else {
        toast({ title: "Gagal menghapus PRB", description: data?.metaData?.message, variant: "destructive" });
      }
    },
  });
}

export function useGetPRBBySRB() {
  return useMutation({
    mutationFn: async ({ noSrb, noSep }: { noSrb: string; noSep: string }) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "get_prb_by_srb", data: { noSrb, noSep } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useGetPRBByDate() {
  return useMutation({
    mutationFn: async ({ tglMulai, tglAkhir }: { tglMulai: string; tglAkhir: string }) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "get_prb_by_date", data: { tglMulai, tglAkhir } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useGetPRBPotensi() {
  return useMutation({
    mutationFn: async ({ tahun, bulan }: { tahun: string; bulan: string }) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "get_prb_potensi", data: { tahun, bulan } },
      });
      if (error) throw error;
      return data;
    },
  });
}

// ==================== REFERENSI TAMBAHAN ====================
export function useRefDiagnosaPRB() {
  return useQuery({
    queryKey: ["bpjs-ref-diagnosa-prb"],
    queryFn: async () => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "ref_diagnosa_prb", data: {} },
      });
      if (error) throw error;
      return data?.response?.list || [];
    },
    enabled: false,
  });
}

export function useRefObatPRB() {
  return useMutation({
    mutationFn: async (keyword: string) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "ref_obat_prb", data: { keyword } },
      });
      if (error) throw error;
      return data?.response?.list || [];
    },
  });
}

export function useRefPropinsi() {
  return useQuery({
    queryKey: ["bpjs-ref-propinsi"],
    queryFn: async () => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "ref_propinsi", data: {} },
      });
      if (error) throw error;
      return data?.response?.list || [];
    },
    enabled: false,
  });
}

export function useRefKabupaten() {
  return useMutation({
    mutationFn: async (kodePropinsi: string) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "ref_kabupaten", data: { kodePropinsi } },
      });
      if (error) throw error;
      return data?.response?.list || [];
    },
  });
}

export function useRefKecamatan() {
  return useMutation({
    mutationFn: async (kodeKabupaten: string) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "ref_kecamatan", data: { kodeKabupaten } },
      });
      if (error) throw error;
      return data?.response?.list || [];
    },
  });
}

export function useRefSpesialistik() {
  return useQuery({
    queryKey: ["bpjs-ref-spesialistik"],
    queryFn: async () => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "ref_spesialistik", data: {} },
      });
      if (error) throw error;
      return data?.response?.list || [];
    },
    enabled: false,
  });
}

export function useRefKelasRawat() {
  return useQuery({
    queryKey: ["bpjs-ref-kelas-rawat"],
    queryFn: async () => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "ref_kelas_rawat", data: {} },
      });
      if (error) throw error;
      return data?.response?.list || [];
    },
    enabled: false,
  });
}

export function useRefDokterLPK() {
  return useMutation({
    mutationFn: async (keyword: string) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "ref_dokter_lpk", data: { keyword } },
      });
      if (error) throw error;
      return data?.response?.list || [];
    },
  });
}

// ==================== RENCANA KONTROL / SPRI ====================
export function useInsertRencanaKontrol() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (kontrolData: any) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "insert_rencana_kontrol", data: kontrolData },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.metaData?.code === "200") {
        toast({ title: "Rencana Kontrol berhasil dibuat", description: `No Surat: ${data.response?.noSuratKontrol}` });
      } else {
        toast({ title: "Gagal membuat Rencana Kontrol", description: data?.metaData?.message, variant: "destructive" });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Gagal membuat Rencana Kontrol", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateRencanaKontrol() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (kontrolData: any) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "update_rencana_kontrol", data: kontrolData },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.metaData?.code === "200") {
        toast({ title: "Rencana Kontrol berhasil diupdate" });
      } else {
        toast({ title: "Gagal update Rencana Kontrol", description: data?.metaData?.message, variant: "destructive" });
      }
    },
  });
}

export function useInsertRencanaKontrolV2() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (kontrolData: any) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "insert_rencana_kontrol_v2", data: kontrolData },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.metaData?.code === "200") {
        toast({ title: "Rencana Kontrol v2 berhasil dibuat", description: `No Surat: ${data.response?.noSuratKontrol}` });
      } else {
        toast({ title: "Gagal membuat Rencana Kontrol v2", description: data?.metaData?.message, variant: "destructive" });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Gagal membuat Rencana Kontrol v2", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateRencanaKontrolV2() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (kontrolData: any) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "update_rencana_kontrol_v2", data: kontrolData },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.metaData?.code === "200") {
        toast({ title: "Rencana Kontrol v2 berhasil diupdate" });
      } else {
        toast({ title: "Gagal update Rencana Kontrol v2", description: data?.metaData?.message, variant: "destructive" });
      }
    },
  });
}

export function useDeleteRencanaKontrol() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ noSuratKontrol, user }: { noSuratKontrol: string; user: string }) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "delete_rencana_kontrol", data: { noSuratKontrol, user } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.metaData?.code === "200") {
        toast({ title: "Rencana Kontrol berhasil dihapus" });
      } else {
        toast({ title: "Gagal menghapus Rencana Kontrol", description: data?.metaData?.message, variant: "destructive" });
      }
    },
  });
}

export function useInsertSPRI() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (spriData: any) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "insert_spri", data: spriData },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.metaData?.code === "200") {
        toast({ title: "SPRI berhasil dibuat", description: `No SPRI: ${data.response?.noSPRI}` });
      } else {
        toast({ title: "Gagal membuat SPRI", description: data?.metaData?.message, variant: "destructive" });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Gagal membuat SPRI", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateSPRI() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (spriData: any) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "update_spri", data: spriData },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.metaData?.code === "200") {
        toast({ title: "SPRI berhasil diupdate" });
      } else {
        toast({ title: "Gagal update SPRI", description: data?.metaData?.message, variant: "destructive" });
      }
    },
  });
}

export function useGetRencanaKontrolBySEP() {
  return useMutation({
    mutationFn: async (noSep: string) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "get_rencana_kontrol_by_sep", data: { noSep } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useGetRencanaKontrolBySurat() {
  return useMutation({
    mutationFn: async (noSuratKontrol: string) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "get_rencana_kontrol_by_surat", data: { noSuratKontrol } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useListRencanaKontrolByKartu() {
  return useMutation({
    mutationFn: async ({ bulan, tahun, noKartu, filter }: { bulan: string; tahun: string; noKartu: string; filter: string }) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "list_rencana_kontrol_by_kartu", data: { bulan, tahun, noKartu, filter } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useListRencanaKontrolByDate() {
  return useMutation({
    mutationFn: async ({ tglAwal, tglAkhir, filter }: { tglAwal: string; tglAkhir: string; filter: string }) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "list_rencana_kontrol_by_date", data: { tglAwal, tglAkhir, filter } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useListSpesialistikKontrol() {
  return useMutation({
    mutationFn: async ({ jnsKontrol, nomor, tglRencanaKontrol }: { jnsKontrol: string; nomor: string; tglRencanaKontrol: string }) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "list_spesialistik_kontrol", data: { jnsKontrol, nomor, tglRencanaKontrol } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useJadwalPraktekDokter() {
  return useMutation({
    mutationFn: async ({ jnsKontrol, kdPoli, tglRencanaKontrol }: { jnsKontrol: string; kdPoli: string; tglRencanaKontrol: string }) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "jadwal_praktek_dokter", data: { jnsKontrol, kdPoli, tglRencanaKontrol } },
      });
      if (error) throw error;
      return data;
    },
  });
}

// ==================== RUJUKAN ====================
export function useInsertRujukan() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (rujukanData: any) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "insert_rujukan", data: rujukanData },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.metaData?.code === "200") {
        toast({ title: "Rujukan berhasil dibuat", description: `No Rujukan: ${data.response?.rujukan?.noRujukan}` });
      } else {
        toast({ title: "Gagal membuat Rujukan", description: data?.metaData?.message, variant: "destructive" });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Gagal membuat Rujukan", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateRujukan() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (rujukanData: any) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "update_rujukan", data: rujukanData },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.metaData?.code === "200") {
        toast({ title: "Rujukan berhasil diupdate" });
      } else {
        toast({ title: "Gagal update Rujukan", description: data?.metaData?.message, variant: "destructive" });
      }
    },
  });
}

export function useDeleteRujukan() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ noRujukan, user }: { noRujukan: string; user: string }) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "delete_rujukan", data: { noRujukan, user } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.metaData?.code === "200") {
        toast({ title: "Rujukan berhasil dihapus" });
      } else {
        toast({ title: "Gagal menghapus Rujukan", description: data?.metaData?.message, variant: "destructive" });
      }
    },
  });
}

export function useInsertRujukanKhusus() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (rujukanData: any) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "insert_rujukan_khusus", data: rujukanData },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.metaData?.code === "200") {
        toast({ title: "Rujukan Khusus berhasil dibuat" });
      } else {
        toast({ title: "Gagal membuat Rujukan Khusus", description: data?.metaData?.message, variant: "destructive" });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Gagal membuat Rujukan Khusus", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteRujukanKhusus() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (rujukanData: { idRujukan: string; noRujukan: string; user: string }) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "delete_rujukan_khusus", data: rujukanData },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.metaData?.code === "200") {
        toast({ title: "Rujukan Khusus berhasil dihapus" });
      } else {
        toast({ title: "Gagal menghapus Rujukan Khusus", description: data?.metaData?.message, variant: "destructive" });
      }
    },
  });
}

export function useListRujukanKhusus() {
  return useMutation({
    mutationFn: async ({ bulan, tahun }: { bulan: string; tahun: string }) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "list_rujukan_khusus", data: { bulan, tahun } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useInsertRujukanV2() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (rujukanData: any) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "insert_rujukan_v2", data: rujukanData },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.metaData?.code === "200") {
        toast({ title: "Rujukan 2.0 berhasil dibuat", description: `No Rujukan: ${data.response?.rujukan?.noRujukan}` });
      } else {
        toast({ title: "Gagal membuat Rujukan 2.0", description: data?.metaData?.message, variant: "destructive" });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Gagal membuat Rujukan 2.0", description: error.message, variant: "destructive" });
    },
  });
}

export function useListSpesialistikRujukan() {
  return useMutation({
    mutationFn: async ({ ppkRujukan, tglRujukan }: { ppkRujukan: string; tglRujukan: string }) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "list_spesialistik_rujukan", data: { ppkRujukan, tglRujukan } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useListSaranaRujukan() {
  return useMutation({
    mutationFn: async (ppkRujukan: string) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "list_sarana_rujukan", data: { ppkRujukan } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useListRujukanKeluar() {
  return useMutation({
    mutationFn: async ({ tglMulai, tglAkhir }: { tglMulai: string; tglAkhir: string }) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "list_rujukan_keluar", data: { tglMulai, tglAkhir } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useGetRujukanKeluar() {
  return useMutation({
    mutationFn: async (noRujukan: string) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "get_rujukan_keluar", data: { noRujukan } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useGetJumlahSEPRujukan() {
  return useMutation({
    mutationFn: async ({ jnsRujukan, noRujukan }: { jnsRujukan: string; noRujukan: string }) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "get_jumlah_sep_rujukan", data: { jnsRujukan, noRujukan } },
      });
      if (error) throw error;
      return data;
    },
  });
}

// ==================== SEP INTERNAL ====================
export function useGetSEPInternal() {
  return useMutation({
    mutationFn: async (noSep: string) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "get_sep_internal", data: { noSep } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useDeleteSEPInternal() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (sepInternalData: {
      noSep: string;
      noSurat: string;
      tglRujukanInternal: string;
      kdPoliTuj: string;
      user: string;
    }) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "delete_sep_internal", data: sepInternalData },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.metaData?.code === "200") {
        toast({ title: "SEP Internal berhasil dihapus" });
      } else {
        toast({ title: "Gagal menghapus SEP Internal", description: data?.metaData?.message, variant: "destructive" });
      }
    },
  });
}

// ==================== FINGER PRINT ====================
export function useGetFingerPrint() {
  return useMutation({
    mutationFn: async ({ noKartu, tglPelayanan }: { noKartu: string; tglPelayanan: string }) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "get_finger_print", data: { noKartu, tglPelayanan } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useGetListFingerPrint() {
  return useMutation({
    mutationFn: async (tglPelayanan: string) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "get_list_finger_print", data: { tglPelayanan } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useGetFingerPrintRandomQuestion() {
  return useMutation({
    mutationFn: async ({ noKartu, tglSep }: { noKartu: string; tglSep: string }) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "get_finger_print_random_question", data: { noKartu, tglSep } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function usePostFingerPrintRandomAnswer() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (answerData: {
      noKartu: string;
      tglSep: string;
      jenPel: string;
      ppkPelSep: string;
      tglLahir: string;
      ppkPst: string;
      user: string;
    }) => {
      const { data, error } = await db.functions.invoke("bpjs-vclaim", {
        body: { action: "post_finger_print_random_answer", data: answerData },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.metaData?.code === "200") {
        toast({ title: "Validasi fingerprint berhasil" });
      } else {
        toast({ title: "Gagal validasi fingerprint", description: data?.metaData?.message, variant: "destructive" });
      }
    },
  });
}

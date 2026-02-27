import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";

// Types for BPJS Antrean API
export interface BPJSPoliRef {
  nmpoli: string;
  nmsubspesialis: string;
  kdsubspesialis: string;
  kdpoli: string;
}

export interface BPJSDokterRef {
  namadokter: string;
  kodedokter: number;
}

export interface BPJSJadwalDokter {
  kodesubspesialis: string;
  hari: number;
  kapasitaspasien: number;
  libur: number;
  namahari: string;
  jadwal: string;
  namasubspesialis: string;
  namadokter: string;
  kodepoli: string;
  namapoli: string;
  kodedokter: number;
}

export interface BPJSAntreanData {
  kodebooking: string;
  jenispasien: string;
  nomorkartu?: string;
  nik: string;
  nohp: string;
  kodepoli: string;
  namapoli: string;
  pasienbaru: boolean;
  norm: string;
  tanggalperiksa: string;
  kodedokter: number;
  namadokter: string;
  jampraktek: string;
  jeniskunjungan: number;
  nomorreferensi?: string;
  nomorantrean: string;
  angkaantrean: number;
  estimasidilayani: number;
  sisakuotajkn: number;
  kuotajkn: number;
  sisakuotanonjkn: number;
  kuotanonjkn: number;
  keterangan?: string;
}

export interface BPJSAntreanFarmasi {
  kodebooking: string;
  jenisresep: "racikan" | "non racikan";
  nomorantrean: number;
  keterangan?: string;
}

export interface BPJSUpdateWaktu {
  kodebooking: string;
  taskid: number;
  waktu: number;
  jenisresep?: string;
}

export interface BPJSJadwalUpdate {
  kodepoli: string;
  kodesubspesialis: string;
  kodedokter: number;
  jadwal: Array<{ hari: string; buka: string; tutup: string }>;
}

export interface BPJSDashboardData {
  kdppk: string;
  nmppk: string;
  kodepoli: string;
  namapoli: string;
  waktu_task1: number;
  waktu_task2: number;
  waktu_task3: number;
  waktu_task4: number;
  waktu_task5: number;
  waktu_task6: number;
  avg_waktu_task1: number;
  avg_waktu_task2: number;
  avg_waktu_task3: number;
  avg_waktu_task4: number;
  avg_waktu_task5: number;
  avg_waktu_task6: number;
  jumlah_antrean: number;
  tanggal: string;
  insertdate: number;
}

export interface BPJSAntreanPendaftaran {
  kodebooking: string;
  tanggal: string;
  kodepoli: string;
  kodedokter: number;
  jampraktek: string;
  nik: string;
  nokapst: string;
  nohp: string;
  norekammedis: string;
  jeniskunjungan: number;
  nomorreferensi: string;
  sumberdata: string;
  ispeserta: number;
  noantrean: string;
  estimasidilayani: number;
  createdtime: number;
  status: string;
}

// Helper function to call BPJS Antrean edge function
async function callBPJSAntrean(action: string, params: Record<string, any> = {}) {
  const { data, error } = await db.functions.invoke("bpjs-antrean", {
    body: { action, ...params },
  });

  if (error) throw error;
  return data;
}

// ============================================
// REFERENSI HOOKS
// ============================================

export function useRefPoli() {
  return useQuery({
    queryKey: ["bpjs-antrean", "ref-poli"],
    queryFn: () => callBPJSAntrean("ref_poli"),
  });
}

export function useRefDokter() {
  return useQuery({
    queryKey: ["bpjs-antrean", "ref-dokter"],
    queryFn: () => callBPJSAntrean("ref_dokter"),
  });
}

export function useRefJadwalDokter(kodePoli: string, tanggal: string) {
  return useQuery({
    queryKey: ["bpjs-antrean", "ref-jadwal-dokter", kodePoli, tanggal],
    queryFn: () => callBPJSAntrean("ref_jadwal_dokter", { kodePoli, tanggal }),
    enabled: !!kodePoli && !!tanggal,
  });
}

export function useRefPoliFP() {
  return useQuery({
    queryKey: ["bpjs-antrean", "ref-poli-fp"],
    queryFn: () => callBPJSAntrean("ref_poli_fp"),
  });
}

export function useRefPasienFP(jenisIdentitas: "nik" | "noka", noIdentitas: string) {
  return useQuery({
    queryKey: ["bpjs-antrean", "ref-pasien-fp", jenisIdentitas, noIdentitas],
    queryFn: () => callBPJSAntrean("ref_pasien_fp", { jenisIdentitas, noIdentitas }),
    enabled: !!noIdentitas,
  });
}

// ============================================
// JADWAL DOKTER HOOKS
// ============================================

export function useUpdateJadwalDokter() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BPJSJadwalUpdate) =>
      callBPJSAntrean("update_jadwal_dokter", {
        kodePoli: data.kodepoli,
        kodeSubspesialis: data.kodesubspesialis,
        kodeDokter: data.kodedokter,
        jadwal: data.jadwal,
      }),
    onSuccess: () => {
      toast({ title: "Sukses", description: "Jadwal dokter berhasil diupdate" });
      queryClient.invalidateQueries({ queryKey: ["bpjs-antrean", "ref-jadwal-dokter"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

// ============================================
// ANTREAN HOOKS
// ============================================

export function useAddAntrean() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BPJSAntreanData) =>
      callBPJSAntrean("add_antrean", {
        kodeBooking: data.kodebooking,
        jenisPasien: data.jenispasien,
        nomorKartu: data.nomorkartu,
        nik: data.nik,
        noHp: data.nohp,
        kodePoli: data.kodepoli,
        namaPoli: data.namapoli,
        pasienBaru: data.pasienbaru,
        norm: data.norm,
        tanggalPeriksa: data.tanggalperiksa,
        kodeDokter: data.kodedokter,
        namaDokter: data.namadokter,
        jamPraktek: data.jampraktek,
        jenisKunjungan: data.jeniskunjungan,
        nomorReferensi: data.nomorreferensi,
        nomorAntrean: data.nomorantrean,
        angkaAntrean: data.angkaantrean,
        estimasiDilayani: data.estimasidilayani,
        sisaKuotaJKN: data.sisakuotajkn,
        kuotaJKN: data.kuotajkn,
        sisaKuotaNonJKN: data.sisakuotanonjkn,
        kuotaNonJKN: data.kuotanonjkn,
        keterangan: data.keterangan,
      }),
    onSuccess: () => {
      toast({ title: "Sukses", description: "Antrean berhasil ditambahkan ke BPJS" });
      queryClient.invalidateQueries({ queryKey: ["bpjs-antrean"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useAddAntreanFarmasi() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: BPJSAntreanFarmasi) =>
      callBPJSAntrean("add_antrean_farmasi", {
        kodeBooking: data.kodebooking,
        jenisResep: data.jenisresep,
        nomorAntrean: data.nomorantrean,
        keterangan: data.keterangan,
      }),
    onSuccess: () => {
      toast({ title: "Sukses", description: "Antrean farmasi berhasil ditambahkan" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateWaktuAntrean() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: BPJSUpdateWaktu) =>
      callBPJSAntrean("update_waktu_antrean", {
        kodeBooking: data.kodebooking,
        taskId: data.taskid,
        waktu: data.waktu,
        jenisResep: data.jenisresep,
      }),
    onSuccess: () => {
      toast({ title: "Sukses", description: "Waktu antrean berhasil diupdate" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useBatalAntrean() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { kodeBooking: string; keterangan: string }) =>
      callBPJSAntrean("batal_antrean", data),
    onSuccess: () => {
      toast({ title: "Sukses", description: "Antrean berhasil dibatalkan" });
      queryClient.invalidateQueries({ queryKey: ["bpjs-antrean"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useGetListTask(kodeBooking: string) {
  return useQuery({
    queryKey: ["bpjs-antrean", "list-task", kodeBooking],
    queryFn: () => callBPJSAntrean("get_list_task", { kodeBooking }),
    enabled: !!kodeBooking,
  });
}

// ============================================
// DASHBOARD HOOKS
// ============================================

export function useDashboardTanggal(tanggal: string, waktu: "rs" | "server") {
  return useQuery({
    queryKey: ["bpjs-antrean", "dashboard-tanggal", tanggal, waktu],
    queryFn: () => callBPJSAntrean("dashboard_tanggal", { tanggalDashboard: tanggal, waktuJenis: waktu }),
    enabled: !!tanggal,
  });
}

export function useDashboardBulan(bulan: string, tahun: string, waktu: "rs" | "server") {
  return useQuery({
    queryKey: ["bpjs-antrean", "dashboard-bulan", bulan, tahun, waktu],
    queryFn: () => callBPJSAntrean("dashboard_bulan", { bulan, tahun, waktuType: waktu }),
    enabled: !!bulan && !!tahun,
  });
}

// ============================================
// ANTREAN PENDAFTARAN HOOKS
// ============================================

export function useAntreanPerTanggal(tanggal: string) {
  return useQuery({
    queryKey: ["bpjs-antrean", "pendaftaran-tanggal", tanggal],
    queryFn: () => callBPJSAntrean("antrean_per_tanggal", { tanggal }),
    enabled: !!tanggal,
  });
}

export function useAntreanPerKodeBooking(kodeBooking: string) {
  return useQuery({
    queryKey: ["bpjs-antrean", "pendaftaran-kodebooking", kodeBooking],
    queryFn: () => callBPJSAntrean("antrean_per_kodebooking", { kodeBooking }),
    enabled: !!kodeBooking,
  });
}

export function useAntreanAktif() {
  return useQuery({
    queryKey: ["bpjs-antrean", "pendaftaran-aktif"],
    queryFn: () => callBPJSAntrean("antrean_aktif"),
  });
}

export function useAntreanPerPoliDokter(
  kodePoli: string,
  kodeDokter: number,
  hari: number,
  jamPraktek: string
) {
  return useQuery({
    queryKey: ["bpjs-antrean", "pendaftaran-poli-dokter", kodePoli, kodeDokter, hari, jamPraktek],
    queryFn: () =>
      callBPJSAntrean("antrean_per_poli_dokter", {
        kodePoliFilter: kodePoli,
        kodeDokterFilter: kodeDokter,
        hari,
        jamPraktek,
      }),
    enabled: !!kodePoli && !!kodeDokter,
  });
}

// ============================================
// PELAYANAN OBAT HOOKS
// ============================================

export function useHapusPelayananObat() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: { noSepApotek: string; noResep: string; kodeObat: string; tipeObat: string }) =>
      callBPJSAntrean("hapus_pelayanan_obat", data),
    onSuccess: () => {
      toast({ title: "Sukses", description: "Pelayanan obat berhasil dihapus" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useDaftarPelayananObat(noKunjungan: string) {
  return useQuery({
    queryKey: ["bpjs-antrean", "daftar-pelayanan-obat", noKunjungan],
    queryFn: () => callBPJSAntrean("daftar_pelayanan_obat", { noKunjungan }),
    enabled: !!noKunjungan,
  });
}

export function useRiwayatPelayananObat(tglAwal: string, tglAkhir: string, noKartu: string) {
  return useQuery({
    queryKey: ["bpjs-antrean", "riwayat-pelayanan-obat", tglAwal, tglAkhir, noKartu],
    queryFn: () => callBPJSAntrean("riwayat_pelayanan_obat", { tglAwal, tglAkhir, noKartu }),
    enabled: !!tglAwal && !!tglAkhir && !!noKartu,
  });
}

// ============================================
// RESEP HOOKS
// ============================================

export function useSimpanResep() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: {
      tglSJP: string;
      refAsalSJP: string;
      poliRSP: string;
      kdJnsObat: string;
      noResep: string;
      idUserSJP: string;
      tglRSP: string;
      tglPelRSP: string;
      kdDokter: string;
      iterasi?: string;
    }) => callBPJSAntrean("simpan_resep", data),
    onSuccess: () => {
      toast({ title: "Sukses", description: "Resep berhasil disimpan" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useHapusResep() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: { noSJP: string; refAsalSJP: string; noResep: string }) =>
      callBPJSAntrean("hapus_resep", data),
    onSuccess: () => {
      toast({ title: "Sukses", description: "Resep berhasil dihapus" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useDaftarResep() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: {
      kdPPK: string;
      kdJnsObat: string;
      jnsTgl: string;
      tglMulai: string;
      tglAkhir: string;
    }) => callBPJSAntrean("daftar_resep", data),
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

// ============================================
// SEP HOOKS
// ============================================

export function useCariSEP(noSep: string) {
  return useQuery({
    queryKey: ["bpjs-antrean", "cari-sep", noSep],
    queryFn: () => callBPJSAntrean("cari_sep", { noSep }),
    enabled: !!noSep,
  });
}

// ============================================
// MONITORING HOOKS
// ============================================

export function useMonitoringKlaim(
  bulan: string,
  tahun: string,
  jnsObat: string,
  status: string
) {
  return useQuery({
    queryKey: ["bpjs-antrean", "monitoring-klaim", bulan, tahun, jnsObat, status],
    queryFn: () =>
      callBPJSAntrean("monitoring_klaim", {
        bulanKlaim: bulan,
        tahunKlaim: tahun,
        jnsObat,
        statusKlaim: status,
      }),
    enabled: !!bulan && !!tahun,
  });
}

// ============================================
// REKAP PESERTA PRB HOOKS
// ============================================

export function useRekapPesertaPRB(tahun: string, bulan: string) {
  return useQuery({
    queryKey: ["bpjs-antrean", "rekap-peserta-prb", tahun, bulan],
    queryFn: () => callBPJSAntrean("rekap_peserta_prb", { tahunPRB: tahun, bulanPRB: bulan }),
    enabled: !!tahun && !!bulan,
  });
}

// ============================================
// RS ENDPOINT HOOKS (For Mobile JKN integration)
// ============================================

export function useRSStatusAntrean() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: {
      kodePoli: string;
      kodeDokter: number;
      tanggalPeriksa: string;
      jamPraktek: string;
    }) => callBPJSAntrean("rs_status_antrean", data),
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useRSAmbilAntrean() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: {
      nomorKartu?: string;
      nik: string;
      noHp: string;
      kodePoli: string;
      norm?: string;
      tanggalPeriksa: string;
      kodeDokter: number;
      jamPraktek: string;
      jenisKunjungan: number;
      nomorReferensi?: string;
    }) => callBPJSAntrean("rs_ambil_antrean", data),
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useRSSisaAntrean() {
  return useMutation({
    mutationFn: (kodeBooking: string) => callBPJSAntrean("rs_sisa_antrean", { kodeBooking }),
  });
}

export function useRSBatalAntrean() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: { kodeBooking: string; keterangan: string }) =>
      callBPJSAntrean("rs_batal_antrean", data),
    onSuccess: () => {
      toast({ title: "Sukses", description: "Antrean berhasil dibatalkan" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useRSCheckin() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: { kodeBooking: string; waktu: number }) =>
      callBPJSAntrean("rs_checkin", data),
    onSuccess: () => {
      toast({ title: "Sukses", description: "Pasien berhasil check-in" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useRSInfoPasienBaru() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: {
      nomorKartu: string;
      nik: string;
      nomorKK: string;
      nama: string;
      jenisKelamin: string;
      tanggalLahir: string;
      noHp: string;
      alamat: string;
      kodeProp?: string;
      namaProp?: string;
      kodeDati2?: string;
      namaDati2?: string;
      kodeKec?: string;
      namaKec?: string;
      kodeKel?: string;
      namaKel?: string;
      rw?: string;
      rt?: string;
    }) => callBPJSAntrean("rs_info_pasien_baru", data),
    onSuccess: () => {
      toast({ title: "Sukses", description: "Info pasien baru berhasil disimpan" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useRSJadwalOperasiRS() {
  return useMutation({
    mutationFn: (data: { tanggalAwal: string; tanggalAkhir: string }) =>
      callBPJSAntrean("rs_jadwal_operasi_rs", data),
  });
}

export function useRSJadwalOperasiPasien() {
  return useMutation({
    mutationFn: (noPeserta: string) => callBPJSAntrean("rs_jadwal_operasi_pasien", { noPeserta }),
  });
}

export function useRSAmbilAntreanFarmasi() {
  return useMutation({
    mutationFn: (kodeBooking: string) => callBPJSAntrean("rs_ambil_antrean_farmasi", { kodeBooking }),
  });
}

export function useRSStatusAntreanFarmasi() {
  return useMutation({
    mutationFn: (kodeBooking: string) => callBPJSAntrean("rs_status_antrean_farmasi", { kodeBooking }),
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";

// ============================================
// BPJS FKTP Antrean Types
// ============================================

export interface FKTPPoliRef {
  namapoli: string;
  kodepoli: string;
}

export interface FKTPDokterRef {
  namadokter: string;
  kodedokter: number;
  jampraktek: string;
  kapasitas: number;
}

export interface FKTPAntreanData {
  nomorkartu?: string;
  nik: string;
  nohp: string;
  kodepoli: string;
  namapoli: string;
  norm: string;
  tanggalperiksa: string;
  kodedokter: number;
  namadokter: string;
  jampraktek: string;
  nomorantrean: string;
  angkaantrean: number;
  keterangan?: string;
}

export interface FKTPStatusAntrean {
  namapoli: string;
  totalantrean: number;
  sisaantrean: number;
  antreanpanggil: string;
  keterangan?: string;
}

export interface FKTPStatusAntreanV2 {
  namapoli: string;
  totalantrean: number;
  sisaantrean: number;
  antreanpanggil: string;
  keterangan?: string;
  kodedokter: number;
  namadokter: string;
  jampraktek: string;
}

export interface FKTPSisaAntrean {
  nomorantrean: string;
  namapoli: string;
  sisaantrean: number;
  antreanpanggil: string;
  keterangan?: string;
}

export interface FKTPAmbilAntreanRequest {
  nomorkartu: string;
  nik: string;
  kodepoli: string;
  tanggalperiksa: string;
  keluhan: string;
}

export interface FKTPAmbilAntreanV2Request extends FKTPAmbilAntreanRequest {
  kodedokter: number;
  jampraktek: string;
  norm: string;
  nohp: string;
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
// FKTP REFERENCE HOOKS (BPJS -> FKTP)
// ============================================

/**
 * Get FKTP Poli reference by date
 */
export function useFKTPRefPoli(tanggal: string) {
  return useQuery({
    queryKey: ["bpjs-fktp", "ref-poli", tanggal],
    queryFn: () => callBPJSAntrean("fktp_ref_poli", { tanggal }),
    enabled: !!tanggal,
  });
}

/**
 * Get FKTP Doctor reference by poli and date
 */
export function useFKTPRefDokter(kodePoli: string, tanggal: string) {
  return useQuery({
    queryKey: ["bpjs-fktp", "ref-dokter", kodePoli, tanggal],
    queryFn: () => callBPJSAntrean("fktp_ref_dokter", { kodePoliFKTP: kodePoli, tanggalFKTP: tanggal }),
    enabled: !!kodePoli && !!tanggal,
  });
}

// ============================================
// FKTP ANTREAN HOOKS (FKTP -> BPJS)
// ============================================

/**
 * Add queue to BPJS from FKTP
 */
export function useFKTPAddAntrean() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FKTPAntreanData) =>
      callBPJSAntrean("fktp_add_antrean", {
        nomorKartu: data.nomorkartu,
        nik: data.nik,
        noHp: data.nohp,
        kodePoli: data.kodepoli,
        namaPoli: data.namapoli,
        norm: data.norm,
        tanggalPeriksa: data.tanggalperiksa,
        kodeDokter: data.kodedokter,
        namaDokter: data.namadokter,
        jamPraktek: data.jampraktek,
        nomorAntrean: data.nomorantrean,
        angkaAntrean: data.angkaantrean,
        keterangan: data.keterangan,
      }),
    onSuccess: () => {
      toast({ title: "Sukses", description: "Antrean FKTP berhasil ditambahkan" });
      queryClient.invalidateQueries({ queryKey: ["bpjs-fktp"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

/**
 * Call/Update queue status (hadir/tidak hadir)
 */
export function useFKTPPanggilAntrean() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: {
      tanggalPeriksa: string;
      kodePoli: string;
      nomorKartu: string;
      status: 1 | 2; // 1=Hadir, 2=Tidak Hadir
      waktu: number; // timestamp ms
    }) => callBPJSAntrean("fktp_panggil_antrean", data),
    onSuccess: () => {
      toast({ title: "Sukses", description: "Status antrean berhasil diupdate" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

/**
 * Cancel FKTP queue
 */
export function useFKTPBatalAntrean() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      tanggalPeriksa: string;
      kodePoli: string;
      nomorKartu: string;
      alasan: string;
    }) => callBPJSAntrean("fktp_batal_antrean", data),
    onSuccess: () => {
      toast({ title: "Sukses", description: "Antrean berhasil dibatalkan" });
      queryClient.invalidateQueries({ queryKey: ["bpjs-fktp"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

// ============================================
// FKTP RS ENDPOINTS (Called by Mobile JKN)
// ============================================

/**
 * Get FKTP queue status (called by Mobile JKN)
 */
export function useFKTPRSStatusAntrean() {
  return useMutation({
    mutationFn: (data: { kodePoli: string; tanggalPeriksa: string }) =>
      callBPJSAntrean("fktp_rs_status_antrean", data),
  });
}

/**
 * Get FKTP queue status V2 - returns list with doctor info
 */
export function useFKTPRSStatusAntreanV2() {
  return useMutation({
    mutationFn: (data: { kodePoli: string; tanggalPeriksa: string }) =>
      callBPJSAntrean("fktp_rs_status_antrean_v2", data),
  });
}

/**
 * Take queue (Ambil Antrean) - called by Mobile JKN
 */
export function useFKTPRSAmbilAntrean() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: FKTPAmbilAntreanRequest) =>
      callBPJSAntrean("fktp_rs_ambil_antrean", data),
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

/**
 * Take queue V2 with more fields
 */
export function useFKTPRSAmbilAntreanV2() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: FKTPAmbilAntreanV2Request) =>
      callBPJSAntrean("fktp_rs_ambil_antrean_v2", data),
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

/**
 * Get remaining queue for patient
 */
export function useFKTPRSSisaAntrean() {
  return useMutation({
    mutationFn: (data: { nomorKartu: string; kodePoli: string; tanggalPeriksa: string }) =>
      callBPJSAntrean("fktp_rs_sisa_antrean", data),
  });
}

/**
 * Cancel queue from Mobile JKN
 */
export function useFKTPRSBatalAntrean() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: { nomorKartu: string; kodePoli: string; tanggalPeriksa: string }) =>
      callBPJSAntrean("fktp_rs_batal_antrean", data),
    onSuccess: () => {
      toast({ title: "Sukses", description: "Antrean berhasil dibatalkan" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

/**
 * Cancel queue V2 with keterangan
 */
export function useFKTPRSBatalAntreanV2() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: {
      nomorKartu: string;
      kodePoli: string;
      tanggalPeriksa: string;
      keterangan: string;
    }) => callBPJSAntrean("fktp_rs_batal_antrean_v2", data),
    onSuccess: () => {
      toast({ title: "Sukses", description: "Antrean berhasil dibatalkan" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

/**
 * Register new patient from Mobile JKN
 */
export function useFKTPRSPasienBaru() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: {
      nomorKartu: string;
      nik: string;
      nomorKK: string;
      nama: string;
      jenisKelamin: string;
      tanggalLahir: string;
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
    }) => callBPJSAntrean("fktp_rs_pasien_baru", data),
    onSuccess: () => {
      toast({ title: "Sukses", description: "Pasien baru berhasil didaftarkan" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

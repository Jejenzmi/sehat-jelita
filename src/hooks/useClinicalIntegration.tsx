import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const FETCH_OPTS: RequestInit = { credentials: 'include', headers: { 'Content-Type': 'application/json' } };

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...FETCH_OPTS, method: 'POST', body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return (json.data ?? json) as T;
}

async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...FETCH_OPTS, method: 'PATCH', body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return (json.data ?? json) as T;
}

// ==================== IGD INTEGRATION ====================

export function useIGDToAdmission() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      emergencyVisitId: string;
      visitId: string;
      patientId: string;
      disposition: "rawat_inap" | "rawat_jalan" | "rujuk" | "pulang" | "meninggal";
      roomId?: string;
      bedId?: string;
      doctorId?: string;
    }) => apiPost('/emergency/disposition', params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergency-visits"] });
      queryClient.invalidateQueries({ queryKey: ["inpatient-admissions"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast({ title: "Disposisi berhasil" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Gagal", description: error.message });
    },
  });
}

// ==================== RAWAT INAP INTEGRATION ====================

export function useInpatientWorkflow() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const transferBed = useMutation({
    mutationFn: (params: {
      admissionId: string;
      currentBedId: string | null;
      newRoomId: string;
      newBedId: string;
    }) => apiPatch(`/inpatient/admissions/${params.admissionId}/transfer`, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inpatient-admissions"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast({ title: "Transfer berhasil" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Gagal", description: e.message }),
  });

  const createDischargeBilling = useMutation({
    mutationFn: (params: {
      visitId: string;
      patientId: string;
      paymentType: "umum" | "bpjs" | "asuransi";
      amount: number;
    }) => apiPost('/billing', params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billings"] });
      toast({ title: "Tagihan rawat inap dibuat" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Gagal", description: e.message }),
  });

  return { transferBed, createDischargeBilling };
}

// ==================== LAB INTEGRATION ====================

export function useLabIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createLabOrderFromVisit = useMutation({
    mutationFn: (params: {
      visitId: string;
      patientId: string;
      doctorId: string;
      templateIds: string[];
      notes?: string;
    }) => apiPost('/lab/orders/bulk', params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lab-results"] });
      toast({ title: "Permintaan lab berhasil dibuat" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Gagal", description: e.message }),
  });

  const completeLabResult = useMutation({
    mutationFn: ({ labResultId, ...data }: {
      labResultId: string;
      results: Record<string, string>;
      notes?: string;
    }) => apiPatch(`/lab/results/${labResultId}/complete`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lab-results"] });
      toast({ title: "Hasil lab berhasil disimpan" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Gagal", description: e.message }),
  });

  return { createLabOrderFromVisit, completeLabResult };
}

// ==================== SURGERY INTEGRATION ====================

export function useSurgeryIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const completeSurgery = useMutation({
    mutationFn: ({ surgeryId, ...data }: {
      surgeryId: string;
      operatingRoomId: string;
      postoperativeDiagnosis?: string;
      operativeNotes?: string;
    }) => apiPatch(`/surgery/${surgeryId}/complete`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surgeries"] });
      queryClient.invalidateQueries({ queryKey: ["operating-rooms"] });
      toast({ title: "Operasi selesai" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Gagal", description: e.message }),
  });

  const createSurgeryBilling = useMutation({
    mutationFn: (params: {
      visitId: string;
      patientId: string;
      paymentType: "umum" | "bpjs" | "asuransi";
      surgeonFee: number;
      anesthesiaFee: number;
      roomFee: number;
    }) => apiPost('/billing/surgery', params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billings"] });
      toast({ title: "Tagihan operasi dibuat" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Gagal", description: e.message }),
  });

  return { completeSurgery, createSurgeryBilling };
}

// ==================== ICU INTEGRATION ====================

export function useICUIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const admitToICU = useMutation({
    mutationFn: (params: {
      visitId: string;
      patientId: string;
      icuBedId: string;
      icuType: "icu" | "iccu" | "nicu" | "picu" | "hcu";
      admissionReason: string;
      doctorId?: string;
    }) => apiPost('/icu/admissions', params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["icu-admissions"] });
      queryClient.invalidateQueries({ queryKey: ["icu-beds"] });
      toast({ title: "Pasien masuk ICU" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Gagal", description: e.message }),
  });

  const dischargeFromICU = useMutation({
    mutationFn: ({ admissionId, ...data }: {
      admissionId: string;
      dischargeReason: string;
      outcome: string;
    }) => apiPatch(`/icu/admissions/${admissionId}/discharge`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["icu-admissions"] });
      queryClient.invalidateQueries({ queryKey: ["icu-beds"] });
      toast({ title: "Pasien keluar ICU" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Gagal", description: e.message }),
  });

  return { admitToICU, dischargeFromICU };
}

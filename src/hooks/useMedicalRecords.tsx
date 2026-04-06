import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const FETCH_OPTS: RequestInit = { credentials: 'include', headers: { 'Content-Type': 'application/json' } };

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, FETCH_OPTS);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return (json.data ?? json) as T;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...FETCH_OPTS, method: 'POST', body: JSON.stringify(body),
  });
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

async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, { ...FETCH_OPTS, method: 'DELETE' });
  if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || res.statusText); }
}

// ==================== TYPES ====================

export interface Diagnosis {
  id: string;
  medical_record_id?: string;
  visit_id?: string;
  patient_id?: string;
  // ICD-11
  icd11_code?: string;
  icd11_entity_id?: string;
  icd11_title_en?: string;
  icd11_title_id?: string;
  // ICD-10 (backward compat)
  icd10_code?: string;
  icd10_title?: string;
  // Meta
  diagnosis_type: 'primer' | 'sekunder' | 'komplikasi' | 'komorbid';
  is_confirmed: boolean;
  notes?: string;
  created_at: string;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  visit_id?: string;
  doctor_id?: string;
  record_date: string;
  record_type?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  vital_signs?: Record<string, unknown>;
  physical_exam?: Record<string, unknown>;
  patients?: {
    full_name: string;
    medical_record_number: string;
    gender: string;
    birth_date: string;
  };
  doctors?: {
    full_name: string;
    specialization: string;
  };
  diagnoses?: Diagnosis[];
}

/** Input for creating a diagnosis (used in forms) */
export interface DiagnosisInput {
  icd11_code?: string;
  icd11_entity_id?: string;
  icd11_title_en?: string;
  icd11_title_id?: string;
  icd10_code?: string;
  icd10_title?: string;
  diagnosis_type: 'primer' | 'sekunder' | 'komplikasi' | 'komorbid';
  notes?: string;
}

// ==================== MEDICAL RECORDS ====================

export function useMedicalRecords(patientId?: string, visitId?: string) {
  return useQuery({
    queryKey: ["medical-records", patientId, visitId],
    queryFn: async (): Promise<MedicalRecord[]> => {
      const params = new URLSearchParams({ limit: '50' });
      if (patientId) params.set('patient_id', patientId);
      if (visitId)   params.set('visit_id', visitId);
      return apiFetch<MedicalRecord[]>(`/icd11/medical-records?${params}`);
    },
  });
}

export function useMedicalRecord(id: string) {
  return useQuery({
    queryKey: ["medical-record", id],
    queryFn: () => apiFetch<MedicalRecord>(`/icd11/medical-records/${id}`),
    enabled: !!id,
  });
}

export function useMedicalRecordStats() {
  return useQuery({
    queryKey: ["medical-record-stats"],
    queryFn: async () => {
      // Fetch today's records
      const today = new Date().toISOString().split('T')[0];
      const allRes = await fetch(
        `${API_BASE}/icd11/medical-records?limit=200`,
        FETCH_OPTS
      );
      const allJson = await allRes.json().catch(() => ({ data: [] }));
      const records: MedicalRecord[] = allJson.data ?? [];

      const todayRecords = records.filter(r => r.record_date?.startsWith(today));
      const uniqueDoctors = new Set(todayRecords.map(r => r.doctor_id).filter(Boolean)).size;
      const withDiagnosis = todayRecords.filter(r => r.diagnoses && r.diagnoses.length > 0).length;
      const compliance = todayRecords.length > 0
        ? Math.round((withDiagnosis / todayRecords.length) * 100)
        : 100;

      return {
        totalRecords:  records.length,
        todayRecords:  todayRecords.length,
        activeDoctors: uniqueDoctors,
        icdCompliance: compliance,
      };
    },
  });
}

export function useCreateMedicalRecord() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      patient_id: string;
      visit_id?: string;
      doctor_id?: string;
      subjective?: string;
      objective?: string;
      assessment?: string;
      plan?: string;
      vital_signs?: Record<string, unknown>;
      physical_exam?: Record<string, unknown>;
      diagnoses?: DiagnosisInput[];
    }) => apiPost<MedicalRecord>('/icd11/medical-records', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medical-records"] });
      queryClient.invalidateQueries({ queryKey: ["medical-record-stats"] });
      toast({ title: "Rekam medis berhasil disimpan" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal menyimpan rekam medis", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateMedicalRecord() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: Partial<MedicalRecord> & { id: string }) =>
      apiPut<MedicalRecord>(`/icd11/medical-records/${id}`, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["medical-records"] });
      queryClient.invalidateQueries({ queryKey: ["medical-record", vars.id] });
      toast({ title: "Rekam medis berhasil diperbarui" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal memperbarui", description: error.message, variant: "destructive" });
    },
  });
}

// ==================== DIAGNOSES ====================

export function useDiagnoses(medicalRecordId?: string, visitId?: string) {
  return useQuery({
    queryKey: ["diagnoses", medicalRecordId, visitId],
    queryFn: async (): Promise<Diagnosis[]> => {
      const params = new URLSearchParams();
      if (medicalRecordId) params.set('medical_record_id', medicalRecordId);
      if (visitId)         params.set('visit_id', visitId);
      return apiFetch<Diagnosis[]>(`/icd11/diagnoses?${params}`);
    },
    enabled: !!(medicalRecordId || visitId),
  });
}

export function useAddDiagnosis() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DiagnosisInput & {
      medical_record_id?: string;
      visit_id?: string;
      patient_id?: string;
    }) => apiPost<Diagnosis>('/icd11/diagnoses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diagnoses"] });
      queryClient.invalidateQueries({ queryKey: ["medical-records"] });
      queryClient.invalidateQueries({ queryKey: ["medical-record-stats"] });
      toast({ title: "Diagnosis berhasil ditambahkan" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal menambah diagnosis", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateDiagnosis() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: Partial<DiagnosisInput> & { id: string }) =>
      apiPut<Diagnosis>(`/icd11/diagnoses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diagnoses"] });
      queryClient.invalidateQueries({ queryKey: ["medical-records"] });
      toast({ title: "Diagnosis berhasil diperbarui" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal memperbarui diagnosis", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteDiagnosis() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiDelete(`/icd11/diagnoses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diagnoses"] });
      queryClient.invalidateQueries({ queryKey: ["medical-records"] });
      queryClient.invalidateQueries({ queryKey: ["medical-record-stats"] });
      toast({ title: "Diagnosis berhasil dihapus" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal menghapus diagnosis", description: error.message, variant: "destructive" });
    },
  });
}

// ==================== ICD-11 SEARCH ====================
// Kept for backward-compat usage in RekamMedis.tsx — actual search is inside ICD11SearchInput
export function useICD11Search(query?: string) {
  return useQuery({
    queryKey: ["icd11-search", query],
    queryFn: async () => {
      if (!query || query.trim().length < 2) return [];
      const res = await fetch(
        `${API_BASE}/icd11/search?q=${encodeURIComponent(query)}&lang=id&limit=15`,
        FETCH_OPTS
      );
      const json = await res.json().catch(() => ({}));
      return json.data ?? [];
    },
    enabled: !!(query && query.trim().length >= 2),
    staleTime: 1000 * 60 * 5,
  });
}

/** @deprecated use useICD11Search instead */
export const useICD10Codes = useICD11Search;

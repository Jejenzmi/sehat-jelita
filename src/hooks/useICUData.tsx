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

// ==================== TYPES ====================

export interface ICUBed {
  id: string;
  bed_number: string;
  room_id: string;
  status: string;
  current_patient_id?: string | null;
  rooms?: { room_name: string; room_type: string };
  patients?: { id: string; full_name: string; medical_record_number: string } | null;
}

export interface ICUAdmission {
  id: string;
  patient_id: string;
  visit_id: string;
  bed_id: string;
  admission_date: string;
  discharge_date?: string | null;
  admission_reason: string;
  admission_source: string;
  diagnosis_on_admission: string;
  apache_score?: number | null;
  sofa_score?: number | null;
  ventilator_required: boolean;
  isolation_required: boolean;
  attending_physician_id?: string;
  discharge_destination?: string | null;
  diagnosis_on_discharge?: string | null;
  discharge_condition?: string | null;
  discharge_notes?: string | null;
  patients?: { full_name: string; medical_record_number: string; blood_type?: string } | null;
  beds?: { bed_number: string; rooms?: { room_name: string; room_type: string } } | null;
  icu_beds?: { bed_number: string } | null; // legacy alias
  icu_vital_signs?: ICUVitalSigns[];
}

export interface ICUVitalSigns {
  id: string;
  admission_id: string;
  recorded_at: string;
  recorded_by?: string;
  heart_rate?: number | null;
  systolic_bp?: number | null;
  diastolic_bp?: number | null;
  mean_arterial_pressure?: number | null;
  respiratory_rate?: number | null;
  temperature?: number | null;
  spo2?: number | null;
  fio2?: number | null;
  gcs_eye?: number | null;
  gcs_verbal?: number | null;
  gcs_motor?: number | null;
  gcs_total?: number | null;
  pupil_left?: string | null;
  pupil_right?: string | null;
  cvp?: number | null;
  urine_output?: number | null;
  notes?: string | null;
  // legacy aliases used in ICUMonitoringView
  blood_pressure_systolic?: number | null;
  blood_pressure_diastolic?: number | null;
}

export interface ICUIntakeOutput {
  id: string;
  admission_id: string;
  recorded_at: string;
  type: 'INTAKE' | 'OUTPUT';
  category: string;
  amount: number;
  route?: string | null;
  notes?: string | null;
}

export interface ICUVentilator {
  id: string;
  admission_id: string;
  recorded_at: string;
  mode?: string | null;
  fio2?: number | null;
  peep?: number | null;
  tidal_volume?: number | null;
  respiratory_rate_set?: number | null;
  respiratory_rate_actual?: number | null;
  pip?: number | null;
  plateau_pressure?: number | null;
  ie_ratio?: string | null;
  minute_volume?: number | null;
  notes?: string | null;
}

export interface ICUFluidBalance {
  date: string;
  intake: number;
  output: number;
  balance: number;
  records: ICUIntakeOutput[];
}

export interface ICUBedSummary {
  beds: ICUBed[];
  summary: { total: number; available: number; occupied: number; cleaning: number; maintenance: number };
}

// Normalize vitals — add legacy aliases so ICUMonitoringView still works
function normalizeVitals(v: ICUVitalSigns): ICUVitalSigns {
  return {
    ...v,
    blood_pressure_systolic:  v.systolic_bp,
    blood_pressure_diastolic: v.diastolic_bp,
  };
}

// ==================== QUERIES ====================

export function useICUBeds() {
  return useQuery({
    queryKey: ["icu-beds"],
    queryFn: () => apiFetch<ICUBedSummary>('/icu/beds'),
  });
}

export function useActiveICUPatients() {
  return useQuery({
    queryKey: ["active-icu-patients"],
    queryFn: () => apiFetch<ICUAdmission[]>('/icu/patients'),
    refetchInterval: 30_000,
  });
}

export function useICUAdmissions() {
  return useQuery({
    queryKey: ["icu-admissions"],
    queryFn: () => apiFetch<ICUAdmission[]>('/icu/patients'),
  });
}

export function useICUMonitoring(admissionId?: string) {
  return useQuery({
    queryKey: ["icu-monitoring", admissionId],
    queryFn: async () => {
      const params = admissionId ? `?admission_id=${admissionId}&limit=50` : '?limit=50';
      const data = await apiFetch<ICUVitalSigns[]>(`/icu/monitoring${params}`);
      return data.map(normalizeVitals);
    },
    enabled: !!admissionId,
    refetchInterval: 15_000,
  });
}

export function useICUVitalsHistory(admissionId: string, hours = 24) {
  return useQuery({
    queryKey: ["icu-vitals-history", admissionId, hours],
    queryFn: async () => {
      const data = await apiFetch<ICUVitalSigns[]>(`/icu/admissions/${admissionId}/vitals?hours=${hours}`);
      return data.map(normalizeVitals);
    },
    enabled: !!admissionId,
    refetchInterval: 15_000,
  });
}

export function useICUFluidBalance(admissionId: string, date?: string) {
  return useQuery({
    queryKey: ["icu-fluid-balance", admissionId, date],
    queryFn: () => {
      const q = date ? `?date=${date}` : '';
      return apiFetch<ICUFluidBalance>(`/icu/admissions/${admissionId}/balance${q}`);
    },
    enabled: !!admissionId,
  });
}

export function useICUStatistics() {
  return useQuery({
    queryKey: ["icu-statistics"],
    queryFn: async () => {
      const bedData = await apiFetch<ICUBedSummary>('/icu/beds');
      const patients = await apiFetch<ICUAdmission[]>('/icu/patients');
      const { summary } = bedData;
      const occupancyRate = summary.total > 0
        ? Math.round((summary.occupied / summary.total) * 100)
        : 0;
      return {
        totalBeds:       summary.total,
        availableBeds:   summary.available,
        occupiedBeds:    summary.occupied,
        occupancyRate,
        activePatients:  patients.length,
        ventilatorInUse: patients.filter(p => p.ventilator_required).length,
        byType: {} as Record<string, { total: number; occupied: number }>,
      };
    },
    refetchInterval: 30_000,
  });
}

// ==================== MUTATIONS ====================

export function useAdmitICUPatient() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      patientId: string; visitId: string; bedId: string;
      admissionReason: string; admissionSource: 'ER' | 'OR' | 'WARD' | 'TRANSFER' | 'DIRECT';
      diagnosisOnAdmission: string; apacheScore?: number; sofaScore?: number;
      ventilatorRequired?: boolean; isolationRequired?: boolean; attendingPhysicianId: string;
    }) => apiPost<ICUAdmission>('/icu/admissions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-icu-patients"] });
      queryClient.invalidateQueries({ queryKey: ["icu-beds"] });
      queryClient.invalidateQueries({ queryKey: ["icu-statistics"] });
      toast({ title: "Pasien berhasil dirawat di ICU" });
    },
    onError: (e: Error) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });
}

export function useRecordICUVitals() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ admissionId, ...data }: { admissionId: string } & Record<string, unknown>) =>
      apiPost<ICUVitalSigns>(`/icu/admissions/${admissionId}/vitals`, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["icu-monitoring", vars.admissionId] });
      queryClient.invalidateQueries({ queryKey: ["icu-vitals-history", vars.admissionId] });
      toast({ title: "Tanda vital berhasil dicatat" });
    },
    onError: (e: Error) => toast({ title: "Gagal mencatat tanda vital", description: e.message, variant: "destructive" }),
  });
}

export function useRecordIntakeOutput() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ admissionId, ...data }: { admissionId: string } & Record<string, unknown>) =>
      apiPost<ICUIntakeOutput>(`/icu/admissions/${admissionId}/intake-output`, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["icu-fluid-balance", vars.admissionId] });
      toast({ title: "Catatan intake/output berhasil disimpan" });
    },
    onError: (e: Error) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });
}

export function useRecordVentilator() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ admissionId, ...data }: { admissionId: string } & Record<string, unknown>) =>
      apiPost<ICUVentilator>(`/icu/admissions/${admissionId}/ventilator`, data),
    onSuccess: () => {
      toast({ title: "Setting ventilator berhasil disimpan" });
    },
    onError: (e: Error) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });
}

export function useDischargeICUPatient() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      apiPut<ICUAdmission>(`/icu/admissions/${id}/discharge`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-icu-patients"] });
      queryClient.invalidateQueries({ queryKey: ["icu-beds"] });
      queryClient.invalidateQueries({ queryKey: ["icu-statistics"] });
      toast({ title: "Pasien berhasil dipindahkan dari ICU" });
    },
    onError: (e: Error) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });
}

// Legacy aliases
export const useICUBedStatus = useICUBeds;
export const useAddICUMonitoring = useRecordICUVitals;
export const useUpdateICUBed = useRecordICUVitals;
export const useVentilatorSettings = (admissionId: string) => useICUVitalsHistory(admissionId);

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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

// ==================== TYPES ====================

export interface DialysisMachine {
  id: string;
  machine_number: string;
  brand: string | null;
  model: string | null;
  is_available: boolean | null;
  last_maintenance_date: string | null;
  next_maintenance_date: string | null;
  notes: string | null;
}

export interface VascularAccess {
  id: string;
  patient_id: string;
  access_type: string;
  location: string | null;
  creation_date: string | null;
  is_active: boolean | null;
}

export interface DialysisSession {
  id: string;
  session_number: string;
  patient_id: string;
  machine_id: string | null;
  vascular_access_id: string | null;
  dialysis_type: string | null;
  session_date: string;
  scheduled_time: string | null;
  actual_start_time: string | null;
  actual_end_time: string | null;
  duration_planned: number | null;
  duration_actual: number | null;
  status: string | null;
  attending_doctor_id: string | null;
  pre_weight: number | null;
  dry_weight: number | null;
  target_uf: number | null;
  pre_bp_systolic: number | null;
  pre_bp_diastolic: number | null;
  blood_flow_rate: number | null;
  dialyzer_type: string | null;
  post_weight: number | null;
  actual_uf: number | null;
  kt_v: number | null;
  urr: number | null;
  notes: string | null;
  patients?: { full_name: string; medical_record_number: string } | null;
  dialysis_machines?: { machine_number: string; brand: string | null; model: string | null } | null;
  doctors?: { full_name: string } | null;
}

export interface DialysisMonitoring {
  id: string;
  session_id: string;
  recorded_at: string;
  time_elapsed: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  heart_rate: number | null;
  blood_flow_rate: number | null;
  uf_total: number | null;
  symptoms: string | null;
}

// ==================== HOOKS ====================

export function useDialysisMachines() {
  return useQuery({
    queryKey: ["dialysis-machines"],
    queryFn: () => apiFetch<DialysisMachine[]>('/dialysis/machines'),
  });
}

export function useDialysisSessions(date?: string, status?: string) {
  return useQuery({
    queryKey: ["dialysis-sessions", date, status],
    queryFn: () => {
      const p = new URLSearchParams();
      if (date)   p.set('date', date);
      if (status) p.set('status', status);
      return apiFetch<DialysisSession[]>(`/dialysis/sessions?${p}`);
    },
  });
}

export function useTodayDialysisSessions() {
  const today = new Date().toISOString().split('T')[0];
  return useDialysisSessions(today);
}

export function useDialysisMonitoring(sessionId: string) {
  return useQuery({
    queryKey: ["dialysis-monitoring", sessionId],
    queryFn: () => apiFetch<DialysisMonitoring[]>(`/dialysis/sessions/${sessionId}/monitoring`),
    enabled: !!sessionId,
    refetchInterval: 30_000,
  });
}

export interface DialysisStatistics {
  totalMachines: number;
  availableMachines: number;
  inUseMachines: number;
  todayScheduled: number;
  todayInProgress: number;
  todayCompleted: number;
  monthlyTotal: number;
  avgKtV: string;
}

export interface WeeklySessionData {
  day: string;
  sessions: number;
}

export interface AdequacyData {
  name: string;
  value: number;
  color: string;
}

export function useDialysisStatistics() {
  return useQuery({
    queryKey: ["dialysis-statistics"],
    queryFn: () => apiFetch<DialysisStatistics>('/dialysis/statistics'),
    refetchInterval: 60_000,
  });
}

export function useWeeklyDialysisSessions() {
  return useQuery({
    queryKey: ["dialysis-weekly-sessions"],
    queryFn: () => apiFetch<WeeklySessionData[]>('/dialysis/weekly-summary'),
  });
}

export function useDialysisAdequacy() {
  return useQuery({
    queryKey: ["dialysis-adequacy"],
    queryFn: () => apiFetch<AdequacyData[]>('/dialysis/adequacy'),
  });
}

export function useUpdateDialysisSession() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<DialysisSession>) =>
      apiPost(`/dialysis/sessions/${id}/complete`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dialysis-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["dialysis-statistics"] });
      toast({ title: "Sesi diperbarui" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });
}

export function useAddDialysisMonitoring() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ sessionId, ...data }: { sessionId: string } & Partial<DialysisMonitoring>) =>
      apiPost(`/dialysis/sessions/${sessionId}/vitals`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dialysis-monitoring"] });
      toast({ title: "Data monitoring dicatat" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });
}

export function useStartDialysisSession() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: {
      patient_id: string;
      machine_id: string;
      dialysis_type: string;
      session_date: string;
      scheduled_time: string;
      duration_planned: number;
      attending_doctor_id?: string;
      pre_weight?: number;
      dry_weight?: number;
      target_uf?: number;
      pre_bp_systolic?: number;
      pre_bp_diastolic?: number;
    }) => apiPost('/dialysis/sessions/start', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dialysis-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["dialysis-machines"] });
      toast({ title: "Sesi hemodialisa dimulai" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });
}

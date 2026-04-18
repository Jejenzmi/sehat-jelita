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

async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...FETCH_OPTS, method: 'PATCH', body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return (json.data ?? json) as T;
}

// ==================== TYPES ====================

export interface TelemedicineSession {
  id: string;
  appointment_id: string | null;
  patient_id: string;
  doctor_id: string;
  room_name: string;
  session_token: string | null;
  status: string;
  scheduled_start: string;
  actual_start: string | null;
  actual_end: string | null;
  duration_minutes: number | null;
  patient_joined_at: string | null;
  doctor_joined_at: string | null;
  recording_url: string | null;
  notes: string | null;
  technical_issues: string | null;
  patients?: { id: string; full_name: string; medical_record_number: string };
  doctors?:  { id: string; full_name: string; specialization: string | null };
  patient?: { id: string; full_name: string; medical_record_number: string };
  doctor?: { id: string; full_name: string; specialization: string | null };
  appointment?: { id: string; chief_complaint?: string | null };
}

export interface TelemedicineStats {
  today: number;
  waiting: number;
  completed: number;
  avg_duration: number;
  avgDuration?: number;
}

// ==================== HOOKS ====================

export function useTelemedicineStats() {
  return useQuery({
    queryKey: ["telemedicine-stats"],
    queryFn: () => apiFetch<TelemedicineStats>('/telemedicine/stats'),
    refetchInterval: 30_000,
  });
}

export function useTelemedicineSessions(date?: string, status?: string) {
  return useQuery({
    queryKey: ["telemedicine-sessions", date, status],
    queryFn: () => {
      const p = new URLSearchParams();
      if (date)   p.set('date', date);
      if (status) p.set('status', status);
      return apiFetch<TelemedicineSession[]>(`/telemedicine/sessions?${p}`);
    },
    refetchInterval: 15_000,
  });
}

export function useTelemedicineSession(id?: string) {
  return useQuery({
    queryKey: ["telemedicine-session", id],
    queryFn: () => apiFetch<TelemedicineSession>(`/telemedicine/sessions/${id}`),
    enabled: !!id,
  });
}

export function useCreateTelemedicineSession() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { appointment_id?: string; patient_id: string; doctor_id: string; scheduled_start: string }) =>
      apiPost<TelemedicineSession>('/telemedicine/sessions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telemedicine-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["telemedicine-stats"] });
      toast({ title: "Sesi telemedicine berhasil dibuat" });
    },
    onError: (e: Error) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateTelemedicineSession() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; status?: string; user_type?: string; notes?: string; technical_issues?: string }) =>
      apiPatch<TelemedicineSession>(`/telemedicine/sessions/${id}`, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["telemedicine-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["telemedicine-session", vars.id] });
      queryClient.invalidateQueries({ queryKey: ["telemedicine-stats"] });
    },
    onError: (e: Error) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });
}

// ─── WebRTC Signaling (polling) ──────────────────────────────────────────────

export interface WebRTCSignal {
  id: string;
  session_id: string;
  sender_id: string;
  signal_type: "offer" | "answer" | "ice-candidate";
  signal_data: RTCSessionDescriptionInit | RTCIceCandidateInit;
  created_at: string;
}

export function usePollWebRTCSignals(sessionId?: string, since?: string, excludeSender?: string) {
  return useQuery({
    queryKey: ["webrtc-signals", sessionId, since, excludeSender],
    queryFn: () => {
      const p = new URLSearchParams();
      if (since)          p.set('since', since);
      if (excludeSender)  p.set('exclude_sender', excludeSender);
      return apiFetch<WebRTCSignal[]>(`/telemedicine/sessions/${sessionId}/signals?${p}`);
    },
    enabled: !!sessionId,
    refetchInterval: 1_500,
  });
}

export function useSendWebRTCSignal() {
  return useMutation({
    mutationFn: ({ sessionId, ...data }: { sessionId: string; sender_id: string; signal_type: string; signal_data: unknown }) =>
      apiPost(`/telemedicine/sessions/${sessionId}/signal`, data),
  });
}

// ─── Legacy compatibility ────────────────────────────────────────────────────

/** @deprecated Use useTelemedicineSessions + useTelemedicineStats instead */
export function useTelemedicineData() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const sessionsQuery = useTelemedicineSessions();
  const statsQuery    = useTelemedicineStats();
  const updateSession = useUpdateTelemedicineSession();

  return {
    sessions:      sessionsQuery.data ?? [],
    loading:       sessionsQuery.isLoading,
    stats:         {
      ...(statsQuery.data ?? { today: 0, waiting: 0, completed: 0, avg_duration: 0 }),
      avgDuration: statsQuery.data?.avg_duration ?? 0,
    },
    fetchSessions: () => queryClient.invalidateQueries({ queryKey: ["telemedicine-sessions"] }),
    createSession: (appointmentId: string) => {
      toast({ title: "Info", description: "Gunakan useCreateTelemedicineSession hook" });
      void appointmentId;
    },
    startSession: (sessionId: string, userType: "doctor" | "patient") =>
      updateSession.mutate({ id: sessionId, status: "in_progress", user_type: userType }),
    endSession: (sessionId: string, notes?: string) =>
      updateSession.mutate({ id: sessionId, status: "completed", notes }),
    updateSessionNotes: (sessionId: string, notes: string) =>
      updateSession.mutate({ id: sessionId, notes }),
  };
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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

export interface OperatingRoom {
  id: string;
  room_number: string;
  name: string;
  room_type: string;
  equipment: string[];
  is_available: boolean;
  is_active: boolean;
  notes: string | null;
}

export interface Surgery {
  id: string;
  surgery_number: string;
  patient_id: string;
  visit_id: string | null;
  operating_room_id: string | null;
  scheduled_date: string;
  scheduled_start_time: string;
  scheduled_end_time: string | null;
  actual_start_time: string | null;
  actual_end_time: string | null;
  preoperative_diagnosis: string;
  postoperative_diagnosis: string | null;
  procedure_name: string;
  procedure_code: string | null;
  procedure_type: string;
  wound_class: string;
  status: 'scheduled' | 'preparation' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
  cancellation_reason: string | null;
  anesthesia_type: string | null;
  asa_classification: string | null;
  preoperative_notes: string | null;
  operative_notes: string | null;
  postoperative_notes: string | null;
  complications: string | null;
  blood_loss_ml: number | null;
  consent_signed: boolean;
  consent_signed_at: string | null;
  consent_signed_by: string | null;
  created_at: string;
  updated_at: string;
  patient?: {
    full_name: string;
    medical_record_number: string;
    birth_date: string;
    gender: string;
  };
  operating_room?: OperatingRoom;
}

export interface SurgeryTeamMember {
  id: string;
  surgery_id: string;
  staff_id: string | null;
  staff_name: string;
  role: string;
  is_primary: boolean;
  notes: string | null;
}

export interface SurgicalSafetyChecklist {
  id: string;
  surgery_id: string;
  sign_in_completed: boolean;
  sign_in_time: string | null;
  sign_in_by: string | null;
  time_out_completed: boolean;
  time_out_time: string | null;
  time_out_by: string | null;
  sign_out_completed: boolean;
  sign_out_time: string | null;
  sign_out_by: string | null;
}

export function useSurgeryData() {
  const queryClient = useQueryClient();

  const { data: operatingRooms = [], isLoading: loadingRooms } = useQuery({
    queryKey: ["operating-rooms"],
    queryFn: () => apiFetch<OperatingRoom[]>('/surgery/operating-rooms'),
  });

  const { data: surgeries = [], isLoading: loadingSurgeries, refetch: refetchSurgeries } = useQuery({
    queryKey: ["surgeries"],
    queryFn: () => apiFetch<Surgery[]>('/surgery/schedule'),
  });

  const { data: todaySurgeries = [], isLoading: loadingToday } = useQuery({
    queryKey: ["surgeries-today"],
    queryFn: () => {
      const today = new Date().toISOString().split("T")[0];
      return apiFetch<Surgery[]>(`/surgery/schedule?date=${today}`);
    },
  });

  const createSurgery = useMutation({
    mutationFn: (surgeryData: Partial<Surgery>) => apiPost<Surgery>('/surgery', surgeryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surgeries"] });
      queryClient.invalidateQueries({ queryKey: ["surgeries-today"] });
      toast.success("Jadwal operasi berhasil dibuat");
    },
    onError: (error: Error) => toast.error(`Gagal membuat jadwal: ${error.message}`),
  });

  const updateSurgery = useMutation({
    mutationFn: ({ id, ...updateData }: Partial<Surgery> & { id: string }) =>
      apiPut<Surgery>(`/surgery/${id}`, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surgeries"] });
      queryClient.invalidateQueries({ queryKey: ["surgeries-today"] });
      toast.success("Data operasi berhasil diperbarui");
    },
    onError: (error: Error) => toast.error(`Gagal memperbarui: ${error.message}`),
  });

  const updateSurgeryStatus = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: Surgery['status']; notes?: string }) => {
      if (status === 'in_progress') return apiPut(`/surgery/${id}/start`, { notes });
      if (status === 'completed') return apiPut(`/surgery/${id}/complete`, { notes });
      return apiPut(`/surgery/${id}`, { status, cancellation_reason: notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surgeries"] });
      queryClient.invalidateQueries({ queryKey: ["surgeries-today"] });
      toast.success("Status operasi diperbarui");
    },
    onError: (error: Error) => toast.error(`Gagal memperbarui status: ${error.message}`),
  });

  const addTeamMember = useMutation({
    mutationFn: (member: Omit<SurgeryTeamMember, 'id'>) => apiPost('/surgery/teams', member),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surgery-team"] });
      toast.success("Anggota tim ditambahkan");
    },
  });

  const fetchSurgeryTeam = async (surgeryId: string): Promise<SurgeryTeamMember[]> => {
    return apiFetch<SurgeryTeamMember[]>(`/surgery/teams?surgery_id=${surgeryId}`);
  };

  const updateSafetyChecklist = useMutation({
    mutationFn: ({ surgeryId, ...checklistData }: Partial<SurgicalSafetyChecklist> & { surgeryId: string }) =>
      apiPost('/surgery/safety-checklists', { surgery_id: surgeryId, ...checklistData }),
    onSuccess: () => toast.success("Checklist diperbarui"),
  });

  const stats = {
    totalToday: todaySurgeries.length,
    scheduled: todaySurgeries.filter(s => s.status === 'scheduled').length,
    inProgress: todaySurgeries.filter(s => s.status === 'in_progress').length,
    completed: todaySurgeries.filter(s => s.status === 'completed').length,
    cancelled: todaySurgeries.filter(s => s.status === 'cancelled').length,
    availableRooms: operatingRooms.filter(r => r.is_available).length,
  };

  return {
    operatingRooms,
    surgeries,
    todaySurgeries,
    stats,
    isLoading: loadingRooms || loadingSurgeries || loadingToday,
    createSurgery,
    updateSurgery,
    updateSurgeryStatus,
    addTeamMember,
    fetchSurgeryTeam,
    updateSafetyChecklist,
    refetchSurgeries,
  };
}

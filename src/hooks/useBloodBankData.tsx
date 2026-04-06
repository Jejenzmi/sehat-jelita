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

export interface BloodInventory {
  id: string;
  bag_number: string;
  blood_type: string;
  product_type: string;
  volume: number | null;
  collection_date: string;
  expiry_date: string;
  source_blood_bank: string | null;
  status: string | null;
  storage_location: string | null;
  hiv_status: string | null;
  hbsag_status: string | null;
  hcv_status: string | null;
  reserved_for_patient_id: string | null;
  notes: string | null;
}

export interface TransfusionRequest {
  id: string;
  request_number: string;
  patient_id: string;
  visit_id: string | null;
  requesting_doctor_id: string | null;
  department: string | null;
  request_date: string;
  urgency: string | null;
  product_type: string;
  units_requested: number;
  indication: string;
  patient_blood_type: string | null;
  patient_hemoglobin: number | null;
  status: string | null;
  notes: string | null;
  patients?: { full_name: string; medical_record_number: string } | null;
  doctors?: { full_name: string } | null;
}

export interface CrossmatchTest {
  id: string;
  request_id: string | null;
  patient_id: string;
  blood_bag_id: string;
  test_date: string;
  major_crossmatch: string | null;
  minor_crossmatch: string | null;
  is_compatible: boolean | null;
  valid_until: string | null;
  blood_inventory?: { bag_number: string; blood_type: string; product_type: string } | null;
  patients?: { full_name: string } | null;
}

export interface TransfusionReaction {
  id: string;
  transfusion_id: string;
  patient_id: string;
  reaction_type: string;
  severity: string;
  reaction_time: string;
  outcome: string | null;
}

// ==================== HOOKS ====================

export function useBloodInventory(status?: string) {
  return useQuery({
    queryKey: ["blood-inventory", status],
    queryFn: () => {
      const p = new URLSearchParams();
      if (status) p.set('status', status);
      return apiFetch<BloodInventory[]>(`/bloodbank/inventory?${p}`);
    },
  });
}

export function useAvailableBlood() {
  return useBloodInventory("available");
}

export function useBloodInventoryStats() {
  return useQuery({
    queryKey: ["blood-inventory-stats"],
    queryFn: () => apiFetch('/bloodbank/inventory/summary'),
    refetchInterval: 30_000,
  });
}

export function useTransfusionRequests(status?: string) {
  return useQuery({
    queryKey: ["transfusion-requests", status],
    queryFn: () => {
      const p = new URLSearchParams();
      if (status) p.set('status', status);
      return apiFetch<TransfusionRequest[]>(`/bloodbank/requests?${p}`);
    },
  });
}

export function useCrossmatchTests(requestId?: string) {
  return useQuery({
    queryKey: ["crossmatch-tests", requestId],
    queryFn: () => {
      const p = new URLSearchParams();
      if (requestId) p.set('request_id', requestId);
      return apiFetch<CrossmatchTest[]>(`/bloodbank/crossmatch?${p}`);
    },
  });
}

export function useAddBloodInventory() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<BloodInventory>) => apiPost('/bloodbank/inventory', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blood-inventory"] });
      toast({ title: "Kantong darah berhasil ditambahkan" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Gagal", description: e.message }),
  });
}

export function useUpdateBloodStatus() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bagId, ...data }: { bagId: string; status: string; notes?: string }) =>
      apiPatch(`/bloodbank/inventory/${bagId}/screening`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blood-inventory"] });
      toast({ title: "Status darah diperbarui" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Gagal", description: e.message }),
  });
}

export function useCreateTransfusionRequest() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TransfusionRequest>) => apiPost('/bloodbank/requests', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfusion-requests"] });
      toast({ title: "Permintaan transfusi berhasil dibuat" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Gagal", description: e.message }),
  });
}

export function usePerformCrossmatch() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { request_id: string; blood_bag_id: string; patient_id: string }) =>
      apiPost('/bloodbank/crossmatch', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crossmatch-tests"] });
      toast({ title: "Crossmatch berhasil dilakukan" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Gagal", description: e.message }),
  });
}

export function useCreateTransfusion() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPost('/bloodbank/transfusions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfusion-requests"] });
      queryClient.invalidateQueries({ queryKey: ["blood-inventory"] });
      toast({ title: "Transfusi dimulai" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Gagal", description: e.message }),
  });
}

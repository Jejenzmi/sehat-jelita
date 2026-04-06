import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const FETCH_OPTS: RequestInit = {
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
};

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

// ─────────────────────────── CSSD ────────────────────────────────────────────

export interface CssdStats {
  totalItems: number;
  todayBatches: number;
  pending: number;
  successRate: number;
}

export interface CssdBatch {
  id: string;
  batch_number: string;
  batch_date: string;
  sterilization_method: string;
  item_count: number;
  status: string;
  operator_name?: string | null;
  temperature?: number | null;
  pressure?: number | null;
  duration_minutes?: number | null;
  biological_indicator_result?: string | null;
  chemical_indicator_result?: string | null;
  notes?: string | null;
  completed_at?: string | null;
  cssd_items?: CssdItem[];
}

export interface CssdItem {
  id: string;
  batch_id: string;
  item_name: string;
  item_code?: string | null;
  quantity: number;
  department_origin?: string | null;
  status: string;
}

export function useCssdStats() {
  return useQuery({
    queryKey: ["cssd-stats"],
    queryFn: () => apiFetch<CssdStats>('/cssd/stats'),
    refetchInterval: 60_000,
  });
}

export function useCssdBatches(status?: string) {
  return useQuery({
    queryKey: ["cssd-batches", status],
    queryFn: () => {
      const q = status ? `?status=${status}&limit=20` : '?limit=20';
      return apiFetch<CssdBatch[]>(`/cssd/batches${q}`);
    },
  });
}

export function useCreateCssdBatch() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CssdBatch> & { items?: Partial<CssdItem>[] }) =>
      apiPost<CssdBatch>('/cssd/batches', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cssd-batches"] });
      queryClient.invalidateQueries({ queryKey: ["cssd-stats"] });
      toast({ title: "Batch CSSD berhasil dibuat" });
    },
    onError: (e: Error) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateCssdBatch() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<CssdBatch>) =>
      apiPut<CssdBatch>(`/cssd/batches/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cssd-batches"] });
      queryClient.invalidateQueries({ queryKey: ["cssd-stats"] });
      toast({ title: "Status batch diperbarui" });
    },
    onError: (e: Error) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });
}

// ─────────────────────────── LINEN ───────────────────────────────────────────

export interface LinenStats {
  totalLinen: number;
  cleanLinen: number;
  inLaundry: number;
  damaged: number;
  todayBatches: number;
}

export interface LinenInventoryItem {
  id: string;
  item_name: string;
  item_code?: string | null;
  total_qty: number;
  clean_qty: number;
  in_laundry_qty: number;
  dirty_qty: number;
  damaged_qty: number;
  department_name?: string | null;
  linen_categories?: { category_name: string } | null;
}

export interface LinenBatch {
  id: string;
  batch_number: string;
  batch_date: string;
  department_origin?: string | null;
  status: string;
  total_items: number;
  weight_kg?: number | null;
  operator_name?: string | null;
  completed_at?: string | null;
  notes?: string | null;
}

export function useLinenStats() {
  return useQuery({
    queryKey: ["linen-stats"],
    queryFn: () => apiFetch<LinenStats>('/linen/stats'),
    refetchInterval: 60_000,
  });
}

export function useLinenInventory() {
  return useQuery({
    queryKey: ["linen-inventory"],
    queryFn: () => apiFetch<LinenInventoryItem[]>('/linen/inventory'),
  });
}

export function useLinenBatches(status?: string) {
  return useQuery({
    queryKey: ["linen-batches", status],
    queryFn: () => {
      const q = status ? `?status=${status}&limit=20` : '?limit=20';
      return apiFetch<LinenBatch[]>(`/linen/batches${q}`);
    },
  });
}

export function useCreateLinenBatch() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LinenBatch>) => apiPost<LinenBatch>('/linen/batches', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["linen-batches"] });
      queryClient.invalidateQueries({ queryKey: ["linen-stats"] });
      toast({ title: "Batch laundry berhasil dibuat" });
    },
    onError: (e: Error) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateLinenBatch() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<LinenBatch>) =>
      apiPut<LinenBatch>(`/linen/batches/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["linen-batches"] });
      queryClient.invalidateQueries({ queryKey: ["linen-stats"] });
      toast({ title: "Status batch diperbarui" });
    },
    onError: (e: Error) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });
}

// ─────────────────────────── WASTE ───────────────────────────────────────────

export interface WasteStats {
  todayWeight: number;
  b3Weight: number;
  pendingPickup: number;
  compliance: number;
}

export interface WasteRecord {
  id: string;
  record_date: string;
  waste_type: string;
  waste_category?: string | null;
  source_department?: string | null;
  weight_kg: number;
  volume_liter?: number | null;
  container_type?: string | null;
  disposal_method?: string | null;
  disposal_vendor?: string | null;
  manifest_number?: string | null;
  status: string;
  officer_name?: string | null;
  notes?: string | null;
  disposed_at?: string | null;
}

export function useWasteStats() {
  return useQuery({
    queryKey: ["waste-stats"],
    queryFn: () => apiFetch<WasteStats>('/waste/stats'),
    refetchInterval: 60_000,
  });
}

export function useWasteRecords(filters?: { waste_type?: string; status?: string }) {
  return useQuery({
    queryKey: ["waste-records", filters],
    queryFn: () => {
      const params = new URLSearchParams({ limit: '20' });
      if (filters?.waste_type) params.set('waste_type', filters.waste_type);
      if (filters?.status)     params.set('status', filters.status);
      return apiFetch<WasteRecord[]>(`/waste/records?${params}`);
    },
  });
}

export function useCreateWasteRecord() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<WasteRecord>) => apiPost<WasteRecord>('/waste/records', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waste-records"] });
      queryClient.invalidateQueries({ queryKey: ["waste-stats"] });
      toast({ title: "Catatan limbah berhasil disimpan" });
    },
    onError: (e: Error) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateWasteRecord() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<WasteRecord>) =>
      apiPut<WasteRecord>(`/waste/records/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waste-records"] });
      queryClient.invalidateQueries({ queryKey: ["waste-stats"] });
      toast({ title: "Status limbah diperbarui" });
    },
    onError: (e: Error) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });
}

// ─────────────────────────── MAINTENANCE ─────────────────────────────────────

export interface MaintenanceStats {
  totalAssets: number;
  needRepair: number;
  scheduledThisWeek: number;
  uptime: number;
}

export interface MaintenanceAsset {
  id: string;
  asset_code: string;
  asset_name: string;
  asset_category?: string | null;
  brand?: string | null;
  model?: string | null;
  serial_number?: string | null;
  department_name?: string | null;
  location?: string | null;
  status: string;
  condition: string;
  last_service_date?: string | null;
  next_service_date?: string | null;
  warranty_expiry?: string | null;
  maintenance_requests?: MaintenanceRequest[];
}

export interface MaintenanceRequest {
  id: string;
  request_number: string;
  asset_id?: string | null;
  request_type: string;
  priority: string;
  title: string;
  description?: string | null;
  reported_by?: string | null;
  department_name?: string | null;
  technician_name?: string | null;
  status: string;
  scheduled_date?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  cost?: number | null;
  resolution_notes?: string | null;
  maintenance_assets?: { asset_name: string; asset_code: string; location?: string | null } | null;
}

export function useMaintenanceStats() {
  return useQuery({
    queryKey: ["maintenance-stats"],
    queryFn: () => apiFetch<MaintenanceStats>('/maintenance/stats'),
    refetchInterval: 60_000,
  });
}

export function useMaintenanceAssets(status?: string) {
  return useQuery({
    queryKey: ["maintenance-assets", status],
    queryFn: () => {
      const q = status ? `?status=${status}&limit=50` : '?limit=50';
      return apiFetch<MaintenanceAsset[]>(`/maintenance/assets${q}`);
    },
  });
}

export function useMaintenanceRequests(status?: string) {
  return useQuery({
    queryKey: ["maintenance-requests", status],
    queryFn: () => {
      const q = status ? `?status=${status}&limit=30` : '?limit=30';
      return apiFetch<MaintenanceRequest[]>(`/maintenance/requests${q}`);
    },
  });
}

export function useCreateMaintenanceRequest() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MaintenanceRequest>) =>
      apiPost<MaintenanceRequest>('/maintenance/requests', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-stats"] });
      toast({ title: "Permintaan pemeliharaan berhasil dibuat" });
    },
    onError: (e: Error) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateMaintenanceRequest() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<MaintenanceRequest>) =>
      apiPut<MaintenanceRequest>(`/maintenance/requests/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-assets"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-stats"] });
      toast({ title: "Status pemeliharaan diperbarui" });
    },
    onError: (e: Error) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });
}

export function useCreateMaintenanceAsset() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MaintenanceAsset>) =>
      apiPost<MaintenanceAsset>('/maintenance/assets', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-assets"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-stats"] });
      toast({ title: "Aset berhasil ditambahkan" });
    },
    onError: (e: Error) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });
}

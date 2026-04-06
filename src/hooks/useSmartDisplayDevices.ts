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

async function apiMethod<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...FETCH_OPTS, method,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return (json.data ?? json) as T;
}

export interface SmartDisplayDevice {
  id: string;
  device_code: string;
  device_name: string;
  location: string;
  description: string | null;
  enabled_modules: string[];
  display_type: string;
  is_active: boolean;
  auto_rotate: boolean;
  rotate_interval: number;
  department_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useSmartDisplayDevices() {
  return useQuery({
    queryKey: ["smart-display-devices"],
    queryFn: () => apiFetch<SmartDisplayDevice[]>('/smart-display/devices'),
  });
}

export function useSmartDisplayDevice(deviceCode: string | null) {
  return useQuery({
    queryKey: ["smart-display-device", deviceCode],
    queryFn: () => apiFetch<SmartDisplayDevice | null>(`/smart-display/devices/${deviceCode}`),
    enabled: !!deviceCode,
  });
}

export function useCreateSmartDisplayDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (device: Omit<SmartDisplayDevice, "id" | "created_at" | "updated_at">) =>
      apiMethod<SmartDisplayDevice>('POST', '/smart-display/devices', device),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["smart-display-devices"] });
      toast.success("Device berhasil ditambahkan");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateSmartDisplayDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Partial<SmartDisplayDevice>) =>
      apiMethod<SmartDisplayDevice>('PUT', `/smart-display/devices/${id}`, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["smart-display-devices"] });
      toast.success("Device berhasil diupdate");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteSmartDisplayDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiMethod('DELETE', `/smart-display/devices/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["smart-display-devices"] });
      toast.success("Device berhasil dihapus");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

import { useQuery } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const FETCH_OPTS: RequestInit = { credentials: 'include', headers: { 'Content-Type': 'application/json' } };

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, FETCH_OPTS);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return (json.data ?? json) as T;
}

// ==================== TYPES ====================

export interface ExecutiveKPI {
  label: string;
  value: string | number;
  change: string | number;
  trend: "up" | "down";
  previousValue?: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  target: number;
  rawat_jalan: number;
  rawat_inap: number;
}

export interface VisitData {
  month: string;
  rawat_jalan: number;
  igd: number;
  rawat_inap: number;
}

export interface DepartmentPerformance {
  name: string;
  visits: number;
  revenue: number;
  satisfaction: number;
}

export interface PaymentDistribution {
  name: string;
  value: number;
  color: string;
}

export interface BedOccupancyByClass {
  class: string;
  occupied: number;
  total: number;
  rate: number;
}

// ==================== HOOKS ====================

export function useExecutiveKPIs() {
  return useQuery({
    queryKey: ["executive-kpis"],
    queryFn: async (): Promise<ExecutiveKPI[]> => {
      const raw = await apiFetch<Array<{ label: string; value: number; change: number; trend: string }>>('/executive-dashboard/kpis');
      return raw.map(k => ({
        label: k.label,
        value: k.label === 'Pendapatan'
          ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(k.value)
          : k.label === 'BOR' ? `${k.value}%`
          : k.label === 'ALOS' ? `${k.value} hari`
          : k.value.toLocaleString('id-ID'),
        change: `${k.change >= 0 ? '+' : ''}${k.change}%`,
        trend: k.trend as 'up' | 'down',
      }));
    },
    refetchInterval: 60_000,
  });
}

export function useRevenueData() {
  return useQuery({
    queryKey: ["executive-revenue"],
    queryFn: () => apiFetch<RevenueData[]>('/executive-dashboard/revenue'),
    refetchInterval: 300_000,
  });
}

export function useVisitTrends() {
  return useQuery({
    queryKey: ["executive-visits"],
    queryFn: () => apiFetch<VisitData[]>('/executive-dashboard/visits-trend'),
    refetchInterval: 300_000,
  });
}

export function useDepartmentPerformance() {
  return useQuery({
    queryKey: ["executive-departments"],
    queryFn: () => apiFetch<DepartmentPerformance[]>('/executive-dashboard/departments'),
    refetchInterval: 300_000,
  });
}

export function usePaymentDistribution() {
  return useQuery({
    queryKey: ["executive-payment-distribution"],
    queryFn: () => apiFetch<PaymentDistribution[]>('/executive-dashboard/payment-distribution'),
    refetchInterval: 300_000,
  });
}

export function useBedOccupancyByClass() {
  return useQuery({
    queryKey: ["executive-bed-occupancy"],
    queryFn: () => apiFetch<BedOccupancyByClass[]>('/executive-dashboard/bed-occupancy'),
    refetchInterval: 60_000,
  });
}

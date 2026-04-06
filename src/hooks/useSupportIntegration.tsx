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

// ==================== INVENTORY INTEGRATION ====================

export function useInventoryIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const receivePurchaseOrder = useMutation({
    mutationFn: ({ poId, receivedItems }: {
      poId: string;
      receivedItems: Array<{ medicineId: string; quantityReceived: number; batchNumber: string; expiryDate: string }>;
    }) => apiPost('/inventory/purchase-orders/receive', { poId, receivedItems }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
      toast({ title: "Barang berhasil diterima" });
    },
    onError: (e: Error) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  const distributeStock = useMutation({
    mutationFn: ({ medicineId, quantity, notes }: { medicineId: string; quantity: number; notes?: string }) =>
      apiPost('/inventory/medicines/distribute', { medicineId, quantity, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
      toast({ title: "Distribusi berhasil" });
    },
    onError: (e: Error) => toast({ title: "Stok tidak mencukupi", description: e.message, variant: "destructive" }),
  });

  return { receivePurchaseOrder, distributeStock };
}

// ==================== SDM/HR INTEGRATION ====================

export function useHRIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const recordAttendance = useMutation({
    mutationFn: (data: { employeeId: string; checkIn?: string; checkOut?: string; status: string; notes?: string }) =>
      apiPost('/hr/attendance', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast({ title: "Absensi dicatat" });
    },
    onError: (e: Error) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  const generatePayroll = useMutation({
    mutationFn: (data: { employeeId: string; periodMonth: number; periodYear: number }) =>
      apiPost('/hr/payroll/generate', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
      toast({ title: "Payroll berhasil digenerate" });
    },
    onError: (e: Error) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  const processPayroll = useMutation({
    mutationFn: (payrollId: string) =>
      apiPatch(`/hr/payroll/${payrollId}/process`, { status: 'paid' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
      toast({ title: "Pembayaran gaji diproses" });
    },
    onError: (e: Error) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  return { recordAttendance, generatePayroll, processPayroll };
}

// ==================== AKUNTANSI INTEGRATION ====================

export function useAccountingIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createJournalFromBilling = useMutation({
    mutationFn: (data: { billingId: string; cashAccountId: string; revenueAccountId: string }) =>
      apiPost('/accounting/journals/from-billing', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      toast({ title: "Jurnal otomatis dibuat" });
    },
    onError: (e: Error) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  const createJournalFromPayroll = useMutation({
    mutationFn: (data: { payrollIds: string[]; salaryExpenseAccountId: string; cashAccountId: string }) =>
      apiPost('/accounting/journals/from-payroll', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      toast({ title: "Jurnal gaji dibuat" });
    },
    onError: (e: Error) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  return { createJournalFromBilling, createJournalFromPayroll };
}

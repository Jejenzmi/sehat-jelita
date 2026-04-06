import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

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

export interface ChartOfAccount {
  id: string;
  account_code: string;
  account_name: string;
  account_type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  account_category?: string;
  parent_id?: string;
  parent_account_id?: string;
  normal_balance: 'DEBIT' | 'CREDIT';
  is_active: boolean;
  is_header: boolean;
  level: number;
  display_order: number;
  opening_balance: number;
  current_balance: number;
  description?: string;
}

export interface FiscalPeriod {
  id: string;
  period_name: string;
  start_date: string;
  end_date: string;
  fiscal_year: number;
  period_number: number;
  is_closed: boolean;
  entry_count: number;
}

export interface JournalEntryLine {
  id?: string;
  entry_id?: string;
  journal_entry_id?: string;
  account_id: string;
  description?: string;
  debit_amount: number;
  credit_amount: number;
  line_number: number;
  account?: ChartOfAccount;
}

export interface JournalEntry {
  id: string;
  entry_number: string;
  journal_number: string;
  entry_date: string;
  description: string;
  reference_type?: string;
  reference_id?: string;
  reference_number?: string;
  total_debit: number;
  total_credit: number;
  status: 'DRAFT' | 'POSTED' | 'VOIDED';
  posted_at?: string;
  posted_by?: string;
  notes?: string;
  created_at: string;
  lines?: JournalEntryLine[];
}

export interface GeneralLedgerEntry {
  id: string;
  account_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  normal_balance: string;
  opening_balance: number;
  total_debit: number;
  total_credit: number;
  closing_balance: number;
  transaction_count: number;
  account?: ChartOfAccount;
}

// ==================== CHART OF ACCOUNTS ====================

export function useChartOfAccounts(type?: string) {
  return useQuery({
    queryKey: ["chart-of-accounts", type],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (type) params.set('type', type);
      const path = `/accounting/accounts${params.toString() ? '?' + params.toString() : ''}`;
      return apiFetch<ChartOfAccount[]>(path);
    },
  });
}

export function useAccountsByType(type?: string) {
  return useQuery({
    queryKey: ["accounts-by-type", type],
    queryFn: async () => {
      const params = new URLSearchParams({ active: 'true', is_header: 'false' });
      if (type) params.set('type', type);
      return apiFetch<ChartOfAccount[]>(`/accounting/accounts?${params.toString()}`);
    },
  });
}

export function useAddAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (account: Partial<ChartOfAccount>) =>
      apiPost<ChartOfAccount>('/accounting/accounts', account),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chart-of-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["accounts-by-type"] });
      toast({ title: "Akun berhasil ditambahkan" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal menambah akun", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...account }: Partial<ChartOfAccount> & { id: string }) =>
      apiPut<ChartOfAccount>(`/accounting/accounts/${id}`, account),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chart-of-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["accounts-by-type"] });
      toast({ title: "Akun berhasil diperbarui" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal memperbarui akun", description: error.message, variant: "destructive" });
    },
  });
}

// ==================== FISCAL PERIODS ====================

export function useFiscalPeriods(year?: number) {
  return useQuery({
    queryKey: ["fiscal-periods", year],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (year) params.set('year', String(year));
      return apiFetch<FiscalPeriod[]>(`/accounting/fiscal-periods?${params.toString()}`);
    },
  });
}

export function useCurrentFiscalPeriod() {
  return useQuery({
    queryKey: ["current-fiscal-period"],
    queryFn: async () => {
      const year = new Date().getFullYear();
      const month = new Date().getMonth() + 1;
      const periods = await apiFetch<FiscalPeriod[]>(`/accounting/fiscal-periods?year=${year}`);
      return periods.find(p => p.period_number === month && !p.is_closed) ?? null;
    },
  });
}

// ==================== JOURNAL ENTRIES ====================

export function useJournalEntries(month?: number, year?: number, status?: string) {
  return useQuery({
    queryKey: ["journal-entries", month, year, status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (month && year) {
        const y = year;
        const m = String(month).padStart(2, '0');
        params.set('startDate', `${y}-${m}-01`);
        params.set('endDate', `${y}-${m}-31`);
      }
      if (status) params.set('status', status);
      params.set('limit', '200');
      return apiFetch<JournalEntry[]>(`/accounting/journals?${params.toString()}`);
    },
  });
}

export function useJournalEntryWithLines(id: string) {
  return useQuery({
    queryKey: ["journal-entry", id],
    queryFn: () => apiFetch<JournalEntry>(`/accounting/journals/${id}`),
    enabled: !!id,
  });
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ entry, lines }: { entry: Partial<JournalEntry>; lines: JournalEntryLine[] }) => {
      const totalDebit  = lines.reduce((s, l) => s + (l.debit_amount  || 0), 0);
      const totalCredit = lines.reduce((s, l) => s + (l.credit_amount || 0), 0);
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new Error("Jurnal tidak seimbang! Total debit harus sama dengan total kredit.");
      }
      return apiPost<JournalEntry>('/accounting/journals', { ...entry, lines });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      toast({ title: "Jurnal berhasil dibuat" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal membuat jurnal", description: error.message, variant: "destructive" });
    },
  });
}

export function usePostJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiPut<JournalEntry>(`/accounting/journals/${id}/post`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      queryClient.invalidateQueries({ queryKey: ["chart-of-accounts"] });
      toast({ title: "Jurnal berhasil diposting" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal memposting jurnal", description: error.message, variant: "destructive" });
    },
  });
}

export function useVoidJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiPut<JournalEntry>(`/accounting/journals/${id}/void`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      toast({ title: "Jurnal berhasil dibatalkan" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal membatalkan jurnal", description: error.message, variant: "destructive" });
    },
  });
}

// ==================== GENERAL LEDGER ====================

export function useGeneralLedger(year: number, month?: number) {
  return useQuery({
    queryKey: ["general-ledger", year, month],
    queryFn: async () => {
      const params = new URLSearchParams({ year: String(year) });
      if (month) params.set('month', String(month));
      return apiFetch<GeneralLedgerEntry[]>(`/accounting/reports/general-ledger?${params.toString()}`);
    },
  });
}

// ==================== FINANCIAL REPORTS ====================

export function useIncomeStatement(year: number, month?: number) {
  return useQuery({
    queryKey: ["income-statement", year, month],
    queryFn: async () => {
      const params = new URLSearchParams({ year: String(year) });
      if (month) params.set('month', String(month));
      return apiFetch<{
        revenue: (ChartOfAccount & { amount: number })[];
        expenses: (ChartOfAccount & { amount: number })[];
        totalRevenue: number;
        totalExpense: number;
        netIncome: number;
      }>(`/accounting/reports/income-statement?${params.toString()}`);
    },
  });
}

export function useBalanceSheet(asOfDate: string) {
  return useQuery({
    queryKey: ["balance-sheet", asOfDate],
    queryFn: async () => {
      const params = new URLSearchParams({ asOfDate });
      return apiFetch<{
        assets: (ChartOfAccount & { balance: number })[];
        liabilities: (ChartOfAccount & { balance: number })[];
        equity: (ChartOfAccount & { balance: number })[];
        totalAssets: number;
        totalLiabilities: number;
        totalEquity: number;
        isBalanced: boolean;
      }>(`/accounting/reports/balance-sheet?${params.toString()}`);
    },
  });
}

export function useCashFlowStatement(year: number, month?: number) {
  return useQuery({
    queryKey: ["cash-flow-statement", year, month],
    queryFn: async () => {
      const params = new URLSearchParams({ year: String(year) });
      if (month) params.set('month', String(month));
      return apiFetch<{
        operating: { description: string; amount: number }[];
        investing: { description: string; amount: number }[];
        financing: { description: string; amount: number }[];
        totalOperating: number;
        totalInvesting: number;
        totalFinancing: number;
        netCashFlow: number;
      }>(`/accounting/reports/cash-flow?${params.toString()}`);
    },
  });
}

// ==================== INTEGRATION HELPERS ====================

export async function createBillingJournal(
  billingId: string,
  invoiceNumber: string,
  amount: number,
  paymentType: string
) {
  const accounts = await apiFetch<ChartOfAccount[]>('/accounting/accounts?active=true&is_header=false');
  const kasAccount      = accounts.find(a => a.account_code === "1101");
  const revenueAccount  = accounts.find(a => a.account_code === "4100");

  if (!kasAccount || !revenueAccount) return null;

  return {
    entry: {
      entry_date: format(new Date(), "yyyy-MM-dd"),
      description: `Pembayaran ${invoiceNumber} - ${paymentType}`,
      reference_type: "billing",
      reference_id: billingId,
      reference_number: invoiceNumber,
    },
    lines: [
      { account_id: kasAccount.id, debit_amount: amount, credit_amount: 0, line_number: 1 },
      { account_id: revenueAccount.id, debit_amount: 0, credit_amount: amount, line_number: 2 },
    ],
  };
}

export async function createPayrollJournal(
  payrollMonth: number,
  payrollYear: number,
  totalGross: number,
  _totalDeductions: Record<string, number>
) {
  const accounts = await apiFetch<ChartOfAccount[]>('/accounting/accounts?active=true&is_header=false');
  const kasAccount  = accounts.find(a => a.account_code === "1101");
  const gajiAccount = accounts.find(a => a.account_code === "5101");

  if (!kasAccount || !gajiAccount) return null;

  return {
    entry: {
      entry_date: format(new Date(), "yyyy-MM-dd"),
      description: `Pembayaran Gaji Periode ${payrollMonth}/${payrollYear}`,
      reference_type: "payroll",
    },
    lines: [
      { account_id: gajiAccount.id, debit_amount: totalGross, credit_amount: 0, line_number: 1 },
      { account_id: kasAccount.id,  debit_amount: 0, credit_amount: totalGross, line_number: 2 },
    ],
  };
}

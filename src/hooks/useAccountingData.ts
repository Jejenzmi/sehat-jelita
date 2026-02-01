import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Types
export interface ChartOfAccount {
  id: string;
  account_code: string;
  account_name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  account_category: string;
  parent_account_id?: string;
  level: number;
  is_header: boolean;
  is_active: boolean;
  normal_balance: 'debit' | 'credit';
  description?: string;
  opening_balance: number;
  current_balance: number;
}

export interface FiscalPeriod {
  id: string;
  period_name: string;
  start_date: string;
  end_date: string;
  fiscal_year: number;
  period_number: number;
  is_closed: boolean;
}

export interface JournalEntry {
  id: string;
  journal_number: string;
  entry_date: string;
  description: string;
  reference_type?: string;
  reference_id?: string;
  reference_number?: string;
  fiscal_period_id?: string;
  total_debit: number;
  total_credit: number;
  status: 'draft' | 'posted' | 'voided';
  posted_at?: string;
  created_at: string;
  lines?: JournalEntryLine[];
}

export interface JournalEntryLine {
  id?: string;
  journal_entry_id?: string;
  account_id: string;
  description?: string;
  debit_amount: number;
  credit_amount: number;
  line_number: number;
  department_id?: string;
  account?: ChartOfAccount;
}

export interface GeneralLedgerEntry {
  id: string;
  account_id: string;
  period_year: number;
  period_month: number;
  opening_balance: number;
  total_debit: number;
  total_credit: number;
  closing_balance: number;
  transaction_count: number;
  account?: ChartOfAccount;
}

// ==================== CHART OF ACCOUNTS ====================

export function useChartOfAccounts() {
  return useQuery({
    queryKey: ["chart-of-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .order("account_code");
      
      if (error) throw error;
      return data as ChartOfAccount[];
    },
  });
}

export function useAccountsByType(type?: string) {
  return useQuery({
    queryKey: ["accounts-by-type", type],
    queryFn: async () => {
      let query = supabase
        .from("chart_of_accounts")
        .select("*")
        .eq("is_active", true)
        .eq("is_header", false)
        .order("account_code");
      
      if (type) {
        query = query.eq("account_type", type);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ChartOfAccount[];
    },
  });
}

export function useAddAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (account: Partial<ChartOfAccount>) => {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .insert(account as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chart-of-accounts"] });
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
    mutationFn: async ({ id, ...account }: Partial<ChartOfAccount> & { id: string }) => {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .update(account)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chart-of-accounts"] });
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
      let query = supabase
        .from("fiscal_periods")
        .select("*")
        .order("start_date", { ascending: false });
      
      if (year) {
        query = query.eq("fiscal_year", year);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as FiscalPeriod[];
    },
  });
}

export function useCurrentFiscalPeriod() {
  return useQuery({
    queryKey: ["current-fiscal-period"],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("fiscal_periods")
        .select("*")
        .lte("start_date", today)
        .gte("end_date", today)
        .eq("is_closed", false)
        .maybeSingle();
      
      if (error) throw error;
      return data as FiscalPeriod | null;
    },
  });
}

// ==================== JOURNAL ENTRIES ====================

export function useJournalEntries(month?: number, year?: number, status?: string) {
  return useQuery({
    queryKey: ["journal-entries", month, year, status],
    queryFn: async () => {
      let query = supabase
        .from("journal_entries")
        .select("*")
        .order("entry_date", { ascending: false })
        .order("journal_number", { ascending: false });
      
      if (month && year) {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
        query = query.gte("entry_date", startDate).lte("entry_date", endDate);
      }
      
      if (status) {
        query = query.eq("status", status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as JournalEntry[];
    },
  });
}

export function useJournalEntryWithLines(id: string) {
  return useQuery({
    queryKey: ["journal-entry", id],
    queryFn: async () => {
      const { data: journal, error: journalError } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("id", id)
        .single();
      
      if (journalError) throw journalError;
      
      const { data: lines, error: linesError } = await supabase
        .from("journal_entry_lines")
        .select(`
          *,
          chart_of_accounts (id, account_code, account_name)
        `)
        .eq("journal_entry_id", id)
        .order("line_number");
      
      if (linesError) throw linesError;
      
      return { ...journal, lines } as JournalEntry;
    },
    enabled: !!id,
  });
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ entry, lines }: { entry: Partial<JournalEntry>; lines: JournalEntryLine[] }) => {
      // Generate journal number
      const { data: numberData } = await supabase.rpc('generate_journal_number');
      const journalNumber = numberData || `JV-${Date.now()}`;
      
      // Calculate totals
      const totalDebit = lines.reduce((sum, l) => sum + (l.debit_amount || 0), 0);
      const totalCredit = lines.reduce((sum, l) => sum + (l.credit_amount || 0), 0);
      
      // Validate balance
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new Error("Jurnal tidak seimbang! Total debit harus sama dengan total kredit.");
      }
      
      // Insert journal entry
      const { data: journal, error: journalError } = await supabase
        .from("journal_entries")
        .insert({
          ...entry,
          journal_number: journalNumber,
          total_debit: totalDebit,
          total_credit: totalCredit,
        } as any)
        .select()
        .single();
      
      if (journalError) throw journalError;
      
      // Insert lines
      const linesWithJournalId = lines.map((line, idx) => ({
        journal_entry_id: journal.id,
        account_id: line.account_id,
        description: line.description,
        debit_amount: line.debit_amount || 0,
        credit_amount: line.credit_amount || 0,
        line_number: idx + 1,
        department_id: line.department_id,
      }));
      
      const { error: linesError } = await supabase
        .from("journal_entry_lines")
        .insert(linesWithJournalId as any);
      
      if (linesError) throw linesError;
      
      return journal;
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
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("journal_entries")
        .update({
          status: "posted",
          posted_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
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
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data, error } = await supabase
        .from("journal_entries")
        .update({
          status: "voided",
          voided_at: new Date().toISOString(),
          void_reason: reason,
        })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
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
      // Get accounts with their balances from journal entries
      const { data: accounts, error: accountsError } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .eq("is_active", true)
        .eq("is_header", false)
        .order("account_code");
      
      if (accountsError) throw accountsError;
      
      // Get all posted journal lines for the period
      let startDate = `${year}-01-01`;
      let endDate = `${year}-12-31`;
      
      if (month) {
        startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        endDate = `${year}-${String(month).padStart(2, '0')}-31`;
      }
      
      const { data: journalLines, error: linesError } = await supabase
        .from("journal_entry_lines")
        .select(`
          account_id,
          debit_amount,
          credit_amount,
          journal_entries!inner (entry_date, status)
        `)
        .gte("journal_entries.entry_date", startDate)
        .lte("journal_entries.entry_date", endDate)
        .eq("journal_entries.status", "posted");
      
      if (linesError) throw linesError;
      
      // Aggregate by account
      const ledgerMap = new Map<string, GeneralLedgerEntry>();
      
      accounts?.forEach(acc => {
        ledgerMap.set(acc.id, {
          id: acc.id,
          account_id: acc.id,
          period_year: year,
          period_month: month || 0,
          opening_balance: acc.opening_balance || 0,
          total_debit: 0,
          total_credit: 0,
          closing_balance: acc.opening_balance || 0,
          transaction_count: 0,
          account: acc as ChartOfAccount,
        });
      });
      
      journalLines?.forEach((line: any) => {
        const entry = ledgerMap.get(line.account_id);
        if (entry) {
          entry.total_debit += line.debit_amount || 0;
          entry.total_credit += line.credit_amount || 0;
          entry.transaction_count += 1;
          
          // Calculate closing balance based on normal balance
          if (entry.account?.normal_balance === 'debit') {
            entry.closing_balance = entry.opening_balance + entry.total_debit - entry.total_credit;
          } else {
            entry.closing_balance = entry.opening_balance + entry.total_credit - entry.total_debit;
          }
        }
      });
      
      return Array.from(ledgerMap.values()).filter(e => e.transaction_count > 0 || e.opening_balance !== 0);
    },
  });
}

// ==================== FINANCIAL REPORTS ====================

export function useIncomeStatement(year: number, month?: number) {
  return useQuery({
    queryKey: ["income-statement", year, month],
    queryFn: async () => {
      let startDate = `${year}-01-01`;
      let endDate = `${year}-12-31`;
      
      if (month) {
        startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        endDate = `${year}-${String(month).padStart(2, '0')}-31`;
      }
      
      // Get revenue accounts
      const { data: revenueAccounts } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .eq("account_type", "revenue")
        .eq("is_header", false)
        .eq("is_active", true);
      
      // Get expense accounts
      const { data: expenseAccounts } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .eq("account_type", "expense")
        .eq("is_header", false)
        .eq("is_active", true);
      
      // Get journal lines
      const { data: journalLines } = await supabase
        .from("journal_entry_lines")
        .select(`
          account_id,
          debit_amount,
          credit_amount,
          journal_entries!inner (entry_date, status)
        `)
        .gte("journal_entries.entry_date", startDate)
        .lte("journal_entries.entry_date", endDate)
        .eq("journal_entries.status", "posted");
      
      // Calculate revenue
      const revenueItems = revenueAccounts?.map(acc => {
        const lines = journalLines?.filter((l: any) => l.account_id === acc.id) || [];
        const amount = lines.reduce((sum: number, l: any) => sum + (l.credit_amount || 0) - (l.debit_amount || 0), 0);
        return { ...acc, amount };
      }).filter(item => item.amount !== 0) || [];
      
      // Calculate expenses
      const expenseItems = expenseAccounts?.map(acc => {
        const lines = journalLines?.filter((l: any) => l.account_id === acc.id) || [];
        const amount = lines.reduce((sum: number, l: any) => sum + (l.debit_amount || 0) - (l.credit_amount || 0), 0);
        return { ...acc, amount };
      }).filter(item => item.amount !== 0) || [];
      
      const totalRevenue = revenueItems.reduce((sum, item) => sum + item.amount, 0);
      const totalExpense = expenseItems.reduce((sum, item) => sum + item.amount, 0);
      const netIncome = totalRevenue - totalExpense;
      
      return {
        revenue: revenueItems,
        expenses: expenseItems,
        totalRevenue,
        totalExpense,
        netIncome,
      };
    },
  });
}

export function useBalanceSheet(asOfDate: string) {
  return useQuery({
    queryKey: ["balance-sheet", asOfDate],
    queryFn: async () => {
      // Get all accounts
      const { data: accounts } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .eq("is_header", false)
        .eq("is_active", true)
        .order("account_code");
      
      // Get all posted journal lines up to date
      const { data: journalLines } = await supabase
        .from("journal_entry_lines")
        .select(`
          account_id,
          debit_amount,
          credit_amount,
          journal_entries!inner (entry_date, status)
        `)
        .lte("journal_entries.entry_date", asOfDate)
        .eq("journal_entries.status", "posted");
      
      const calculateBalance = (acc: ChartOfAccount) => {
        const lines = journalLines?.filter((l: any) => l.account_id === acc.id) || [];
        const totalDebit = lines.reduce((sum: number, l: any) => sum + (l.debit_amount || 0), 0);
        const totalCredit = lines.reduce((sum: number, l: any) => sum + (l.credit_amount || 0), 0);
        
        if (acc.normal_balance === 'debit') {
          return (acc.opening_balance || 0) + totalDebit - totalCredit;
        } else {
          return (acc.opening_balance || 0) + totalCredit - totalDebit;
        }
      };
      
      const assets = accounts?.filter(a => a.account_type === 'asset').map(acc => ({
        ...acc,
        balance: calculateBalance(acc as ChartOfAccount),
      })).filter(a => a.balance !== 0) || [];
      
      const liabilities = accounts?.filter(a => a.account_type === 'liability').map(acc => ({
        ...acc,
        balance: calculateBalance(acc as ChartOfAccount),
      })).filter(a => a.balance !== 0) || [];
      
      const equity = accounts?.filter(a => a.account_type === 'equity').map(acc => ({
        ...acc,
        balance: calculateBalance(acc as ChartOfAccount),
      })).filter(a => a.balance !== 0) || [];
      
      const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
      const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balance, 0);
      const totalEquity = equity.reduce((sum, a) => sum + a.balance, 0);
      
      return {
        assets,
        liabilities,
        equity,
        totalAssets,
        totalLiabilities,
        totalEquity,
        isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
      };
    },
  });
}

export function useCashFlowStatement(year: number, month?: number) {
  return useQuery({
    queryKey: ["cash-flow-statement", year, month],
    queryFn: async () => {
      let startDate = `${year}-01-01`;
      let endDate = `${year}-12-31`;
      
      if (month) {
        startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        endDate = `${year}-${String(month).padStart(2, '0')}-31`;
      }
      
      // Get cash accounts (1101, 1102, 1103)
      const { data: cashAccounts } = await supabase
        .from("chart_of_accounts")
        .select("id, account_code, account_name")
        .in("account_code", ["1101", "1102", "1103"]);
      
      const cashAccountIds = cashAccounts?.map(a => a.id) || [];
      
      // Get journal lines for cash accounts
      const { data: cashLines } = await supabase
        .from("journal_entry_lines")
        .select(`
          account_id,
          debit_amount,
          credit_amount,
          description,
          journal_entries!inner (
            id,
            entry_date, 
            status, 
            description,
            reference_type
          )
        `)
        .in("account_id", cashAccountIds)
        .gte("journal_entries.entry_date", startDate)
        .lte("journal_entries.entry_date", endDate)
        .eq("journal_entries.status", "posted");
      
      // Categorize cash flows
      const operating: { description: string; amount: number }[] = [];
      const investing: { description: string; amount: number }[] = [];
      const financing: { description: string; amount: number }[] = [];
      
      cashLines?.forEach((line: any) => {
        const amount = (line.debit_amount || 0) - (line.credit_amount || 0);
        const desc = line.journal_entries?.description || line.description || "Transaksi";
        const refType = line.journal_entries?.reference_type;
        
        const item = { description: desc, amount };
        
        if (refType === 'billing' || refType === 'payroll') {
          operating.push(item);
        } else if (desc.toLowerCase().includes('aset') || desc.toLowerCase().includes('peralatan')) {
          investing.push(item);
        } else if (desc.toLowerCase().includes('modal') || desc.toLowerCase().includes('pinjaman')) {
          financing.push(item);
        } else {
          operating.push(item);
        }
      });
      
      const totalOperating = operating.reduce((sum, i) => sum + i.amount, 0);
      const totalInvesting = investing.reduce((sum, i) => sum + i.amount, 0);
      const totalFinancing = financing.reduce((sum, i) => sum + i.amount, 0);
      const netCashFlow = totalOperating + totalInvesting + totalFinancing;
      
      return {
        operating,
        investing,
        financing,
        totalOperating,
        totalInvesting,
        totalFinancing,
        netCashFlow,
      };
    },
  });
}

// ==================== INTEGRATION HELPERS ====================

export async function createBillingJournal(billingId: string, invoiceNumber: string, amount: number, paymentType: string) {
  // This would be called when a billing is paid
  const { data: accounts } = await supabase
    .from("chart_of_accounts")
    .select("id, account_code")
    .in("account_code", ["1101", "4600"]); // Kas and Pendapatan Farmasi
  
  const kasAccount = accounts?.find(a => a.account_code === "1101");
  const revenueAccount = accounts?.find(a => a.account_code === "4600");
  
  if (!kasAccount || !revenueAccount) return null;
  
  return {
    entry: {
      entry_date: format(new Date(), "yyyy-MM-dd"),
      description: `Pembayaran ${invoiceNumber} - ${paymentType}`,
      reference_type: "billing",
      reference_id: billingId,
      reference_number: invoiceNumber,
      status: "posted" as const,
    },
    lines: [
      { account_id: kasAccount.id, debit_amount: amount, credit_amount: 0, line_number: 1 },
      { account_id: revenueAccount.id, debit_amount: 0, credit_amount: amount, line_number: 2 },
    ],
  };
}

export async function createPayrollJournal(payrollMonth: number, payrollYear: number, totalGross: number, totalDeductions: Record<string, number>) {
  // This would be called when payroll is processed
  const { data: accounts } = await supabase
    .from("chart_of_accounts")
    .select("id, account_code")
    .in("account_code", ["1101", "5101", "2102", "2103", "2104", "2105"]);
  
  const kasAccount = accounts?.find(a => a.account_code === "1101");
  const gajiAccount = accounts?.find(a => a.account_code === "5101");
  const hutangGajiAccount = accounts?.find(a => a.account_code === "2102");
  
  if (!kasAccount || !gajiAccount) return null;
  
  const lines = [
    { account_id: gajiAccount.id, debit_amount: totalGross, credit_amount: 0, line_number: 1 },
  ];
  
  let lineNum = 2;
  const totalDeductionAmount = Object.values(totalDeductions).reduce((a, b) => a + b, 0);
  const netPay = totalGross - totalDeductionAmount;
  
  // Add deduction entries (credits to liability accounts)
  // Add net pay to cash (credit)
  lines.push({ account_id: kasAccount.id, debit_amount: 0, credit_amount: netPay, line_number: lineNum++ });
  
  return {
    entry: {
      entry_date: format(new Date(), "yyyy-MM-dd"),
      description: `Pembayaran Gaji Periode ${payrollMonth}/${payrollYear}`,
      reference_type: "payroll",
      status: "posted" as const,
    },
    lines,
  };
}

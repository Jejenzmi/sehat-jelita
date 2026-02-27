import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";

/**
 * Support & Back-Office Integration Hook
 * Integrates workflows across: Inventory, SDM/HR, Akuntansi
 */

// ==================== INVENTORY INTEGRATION ====================

export function useInventoryIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const receivePurchaseOrder = useMutation({
    mutationFn: async ({
      poId,
      receivedItems,
    }: {
      poId: string;
      receivedItems: Array<{
        medicineId: string;
        quantityReceived: number;
        batchNumber: string;
        expiryDate: string;
      }>;
    }) => {
      // Update PO status
      await db.from("purchase_orders").update({ status: "received" }).eq("id", poId);

      // Add medicine batches and update stock
      for (const item of receivedItems) {
        // Create batch
        await db.from("medicine_batches").insert({
          medicine_id: item.medicineId,
          batch_number: item.batchNumber,
          expiry_date: item.expiryDate,
          initial_quantity: item.quantityReceived,
          quantity: item.quantityReceived,
          status: "active",
        });

        // Update medicine stock
        const { data: medicine } = await db.from("medicines").select("stock").eq("id", item.medicineId).single();
        await db.from("medicines").update({ stock: (medicine?.stock || 0) + item.quantityReceived }).eq("id", item.medicineId);
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
      queryClient.invalidateQueries({ queryKey: ["medicine-batches"] });
      toast({ title: "Barang berhasil diterima" });
    },
  });

  const distributeStock = useMutation({
    mutationFn: async ({
      medicineId,
      quantity,
      notes,
    }: {
      medicineId: string;
      quantity: number;
      notes?: string;
    }) => {
      const { data: medicine } = await db.from("medicines").select("stock").eq("id", medicineId).single();

      if (!medicine || medicine.stock < quantity) {
        throw new Error("Stok tidak mencukupi");
      }

      await db.from("medicines").update({ stock: medicine.stock - quantity }).eq("id", medicineId);

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
      toast({ title: "Distribusi berhasil" });
    },
  });

  return { receivePurchaseOrder, distributeStock };
}

// ==================== SDM/HR INTEGRATION ====================

export function useHRIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const recordAttendance = useMutation({
    mutationFn: async ({
      employeeId,
      checkIn,
      checkOut,
      status,
      notes,
    }: {
      employeeId: string;
      checkIn?: string;
      checkOut?: string;
      status: "present" | "absent" | "late" | "leave" | "sick";
      notes?: string;
    }) => {
      const today = new Date().toISOString().split("T")[0];

      const { data: existing } = await db
        .from("attendance")
        .select("id")
        .eq("employee_id", employeeId)
        .eq("attendance_date", today)
        .maybeSingle();

      if (existing) {
        const { data, error } = await db
          .from("attendance")
          .update({
            check_in: checkIn,
            check_out: checkOut,
            status,
            notes,
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await db
          .from("attendance")
          .insert({
            employee_id: employeeId,
            attendance_date: today,
            check_in: checkIn || null,
            check_out: checkOut || null,
            status,
            notes: notes || null,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast({ title: "Absensi dicatat" });
    },
  });

  const generatePayroll = useMutation({
    mutationFn: async ({
      employeeId,
      periodMonth,
      periodYear,
    }: {
      employeeId: string;
      periodMonth: number;
      periodYear: number;
    }) => {
      const { data: employee } = await db.from("employees").select("*").eq("id", employeeId).single();

      if (!employee) throw new Error("Karyawan tidak ditemukan");

      const basicSalary = employee.salary || 0;
      const allowances = { transport: 500000, meal: 300000 };
      const totalAllowances = Object.values(allowances).reduce((a, b) => a + b, 0);
      const deductions = { bpjs: Math.min(basicSalary * 0.03, 360000) };
      const totalDeductions = Object.values(deductions).reduce((a, b) => a + b, 0);
      const grossSalary = basicSalary + totalAllowances;
      const taxAmount = Math.max(0, (grossSalary - 4500000) * 0.05);
      const netSalary = grossSalary - totalDeductions - taxAmount;

      const { data: existingPayroll } = await db
        .from("payroll")
        .select("id")
        .eq("employee_id", employeeId)
        .eq("period_month", periodMonth)
        .eq("period_year", periodYear)
        .maybeSingle();

      if (existingPayroll) {
        const { data, error } = await db
          .from("payroll")
          .update({
            basic_salary: basicSalary,
            allowances,
            deductions,
            gross_salary: grossSalary,
            tax_amount: taxAmount,
            net_salary: netSalary,
            status: "pending",
          })
          .eq("id", existingPayroll.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await db
          .from("payroll")
          .insert({
            employee_id: employeeId,
            period_month: periodMonth,
            period_year: periodYear,
            basic_salary: basicSalary,
            allowances,
            deductions,
            gross_salary: grossSalary,
            tax_amount: taxAmount,
            net_salary: netSalary,
            status: "pending",
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
      toast({ title: "Payroll berhasil digenerate" });
    },
  });

  const processPayroll = useMutation({
    mutationFn: async ({ payrollId }: { payrollId: string }) => {
      const { data, error } = await db
        .from("payroll")
        .update({
          status: "paid",
          payment_date: new Date().toISOString(),
          payment_method: "transfer",
        })
        .eq("id", payrollId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
      toast({ title: "Pembayaran gaji diproses" });
    },
  });

  return { recordAttendance, generatePayroll, processPayroll };
}

// ==================== AKUNTANSI INTEGRATION ====================

export function useAccountingIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createJournalFromBilling = useMutation({
    mutationFn: async ({
      billingId,
      cashAccountId,
      revenueAccountId,
    }: {
      billingId: string;
      cashAccountId: string;
      revenueAccountId: string;
    }) => {
      const { data: billing } = await db.from("billings").select("*, patients(full_name)").eq("id", billingId).single();

      if (!billing) throw new Error("Billing tidak ditemukan");

      const { data: journalNumber } = await db.rpc("generate_journal_number");

      const { data: journal, error: journalError } = await db
        .from("journal_entries")
        .insert({
          journal_number: journalNumber,
          entry_date: new Date().toISOString().split("T")[0],
          description: `Pembayaran ${billing.invoice_number}`,
          reference_type: "billing",
          reference_id: billingId,
          reference_number: billing.invoice_number,
          total_debit: billing.total,
          total_credit: billing.total,
          status: "posted",
          posted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (journalError) throw journalError;

      await db.from("journal_entry_lines").insert([
        { journal_entry_id: journal.id, account_id: cashAccountId, description: "Penerimaan kas", debit_amount: billing.total, credit_amount: 0, line_number: 1 },
        { journal_entry_id: journal.id, account_id: revenueAccountId, description: "Pendapatan", debit_amount: 0, credit_amount: billing.total, line_number: 2 },
      ]);

      return journal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      toast({ title: "Jurnal otomatis dibuat" });
    },
  });

  const createJournalFromPayroll = useMutation({
    mutationFn: async ({
      payrollIds,
      salaryExpenseAccountId,
      cashAccountId,
    }: {
      payrollIds: string[];
      salaryExpenseAccountId: string;
      cashAccountId: string;
    }) => {
      const { data: payrolls } = await db.from("payroll").select("*").in("id", payrollIds);

      if (!payrolls || payrolls.length === 0) throw new Error("Payroll tidak ditemukan");

      const totalNet = payrolls.reduce((sum, p) => sum + (p.net_salary || 0), 0);
      const totalGross = payrolls.reduce((sum, p) => sum + (p.gross_salary || 0), 0);

      const { data: journalNumber } = await db.rpc("generate_journal_number");
      const periodMonth = payrolls[0].period_month;
      const periodYear = payrolls[0].period_year;

      const { data: journal, error } = await db
        .from("journal_entries")
        .insert({
          journal_number: journalNumber,
          entry_date: new Date().toISOString().split("T")[0],
          description: `Pembayaran Gaji ${periodMonth}/${periodYear}`,
          reference_type: "payroll",
          reference_number: `PAYROLL-${periodMonth}-${periodYear}`,
          total_debit: totalGross,
          total_credit: totalGross,
          status: "posted",
          posted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      await db.from("journal_entry_lines").insert([
        { journal_entry_id: journal.id, account_id: salaryExpenseAccountId, description: "Beban Gaji", debit_amount: totalGross, credit_amount: 0, line_number: 1 },
        { journal_entry_id: journal.id, account_id: cashAccountId, description: "Pembayaran Gaji", debit_amount: 0, credit_amount: totalNet, line_number: 2 },
      ]);

      return journal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      toast({ title: "Jurnal payroll dibuat" });
    },
  });

  return { createJournalFromBilling, createJournalFromPayroll };
}

// ==================== COMBINED SUPPORT STATS ====================

export function useSupportDashboardStats() {
  return useQuery({
    queryKey: ["support-dashboard-stats"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const [
        { count: lowStockMedicines },
        { count: pendingOrders },
        { count: presentToday },
        { count: pendingPayroll },
        { count: pendingJournals },
      ] = await Promise.all([
        db.from("medicines").select("*", { count: "exact", head: true }).lte("stock", 10).eq("is_active", true),
        db.from("purchase_orders").select("*", { count: "exact", head: true }).in("status", ["pending", "approved"]),
        db.from("attendance").select("*", { count: "exact", head: true }).eq("attendance_date", today).eq("status", "present"),
        db.from("payroll").select("*", { count: "exact", head: true }).eq("status", "pending").eq("period_month", currentMonth).eq("period_year", currentYear),
        db.from("journal_entries").select("*", { count: "exact", head: true }).eq("status", "draft"),
      ]);

      return {
        lowStockMedicines: lowStockMedicines || 0,
        pendingOrders: pendingOrders || 0,
        presentToday: presentToday || 0,
        pendingPayroll: pendingPayroll || 0,
        pendingJournals: pendingJournals || 0,
      };
    },
  });
}

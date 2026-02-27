// HR Data Management Hook - All CRUD operations for HR module
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Types
export interface Employee {
  id: string;
  employee_number: string;
  full_name: string;
  nik?: string;
  birth_date?: string;
  birth_place?: string;
  gender?: string;
  address?: string;
  phone?: string;
  email?: string;
  department_id?: string;
  position: string;
  position_id?: string;
  grade_id?: string;
  employment_type: string;
  join_date: string;
  end_date?: string;
  salary?: number;
  bank_name?: string;
  bank_account?: string;
  npwp?: string;
  bpjs_kesehatan?: string;
  bpjs_ketenagakerjaan?: string;
  tax_status?: string;
  marital_status?: string;
  education_level?: string;
  religion?: string;
  blood_type?: string;
  status: string;
  notes?: string;
  departments?: { name: string };
  positions?: { position_name: string };
  employee_grades?: { grade_name: string };
}

export interface SalaryComponent {
  id: string;
  component_code: string;
  component_name: string;
  component_type: 'allowance' | 'deduction' | 'benefit';
  calculation_type: 'fixed' | 'percentage' | 'formula';
  base_amount: number;
  percentage: number;
  formula?: string;
  is_taxable: boolean;
  is_active: boolean;
  description?: string;
}

export interface EmployeeGrade {
  id: string;
  grade_code: string;
  grade_name: string;
  level: number;
  min_salary: number;
  max_salary: number;
  description?: string;
  is_active: boolean;
}

export interface Position {
  id: string;
  position_code: string;
  position_name: string;
  department_id?: string;
  grade_id?: string;
  base_salary: number;
  position_allowance: number;
  is_structural: boolean;
  is_active: boolean;
  departments?: { name: string };
  employee_grades?: { grade_name: string };
}

export interface PayrollRecord {
  id: string;
  employee_id: string;
  period_month: number;
  period_year: number;
  basic_salary: number;
  allowances?: Record<string, number> | unknown;
  deductions?: Record<string, number> | unknown;
  overtime_hours?: number;
  overtime_amount?: number;
  gross_salary: number;
  tax_amount?: number;
  net_salary: number;
  status: string;
  payment_date?: string;
  payment_method?: string;
  employees?: Record<string, unknown>;
}

export interface OvertimeRecord {
  id: string;
  employee_id: string;
  overtime_date: string;
  start_time: string;
  end_time: string;
  total_hours: number;
  overtime_type: 'weekday' | 'weekend' | 'holiday';
  hourly_rate: number;
  total_amount: number;
  status: string;
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  employees?: Record<string, unknown>;
}

export interface PerformanceReview {
  id: string;
  employee_id: string;
  review_period: string;
  review_year: number;
  reviewer_id?: string;
  review_date: string;
  kpi_score: number;
  competency_score: number;
  behavior_score: number;
  overall_score: number;
  rating?: string;
  strengths?: string;
  areas_for_improvement?: string;
  goals_next_period?: string;
  status: string;
  employees?: Record<string, unknown>;
  reviewer?: Record<string, unknown>;
}

export interface TrainingRecord {
  id: string;
  employee_id: string;
  training_name: string;
  training_type: 'internal' | 'external' | 'online' | 'certification';
  provider?: string;
  start_date: string;
  end_date?: string;
  duration_hours?: number;
  location?: string;
  cost?: number;
  certificate_number?: string;
  certificate_expiry?: string;
  score?: number;
  status: string;
  notes?: string;
  employees?: Record<string, unknown>;
}

export interface LeaveBalance {
  id: string;
  employee_id: string;
  leave_type: string;
  year: number;
  initial_balance: number;
  used: number;
  remaining: number;
  carried_over: number;
  expired: number;
  employees?: Record<string, unknown>;
}

export interface WorkShift {
  id: string;
  shift_code: string;
  shift_name: string;
  start_time: string;
  end_time: string;
  break_duration: number;
  is_night_shift: boolean;
  allowance_amount: number;
  is_active: boolean;
}

// Simplified types for query results
export interface EmployeeBasic {
  full_name: string;
  employee_number: string;
  position: string;
  department_id?: string;
  departments?: { name: string };
}

// Fetch hooks
export function useEmployees() {
  return useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await db
        .from("employees")
        .select(`
          *,
          departments (name)
        `)
        .order("full_name");
      
      if (error) throw error;
      return data as Employee[];
    },
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ["employee", id],
    queryFn: async () => {
      const { data, error } = await db
        .from("employees")
        .select(`
          *,
          departments (name)
        `)
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data as Employee;
    },
    enabled: !!id,
  });
}

export function useAttendance(date: string) {
  return useQuery({
    queryKey: ["attendance", date],
    queryFn: async () => {
      const { data, error } = await db
        .from("attendance")
        .select(`
          *,
          employees (full_name, employee_number, position)
        `)
        .eq("attendance_date", date)
        .order("check_in", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useLeaveRequests() {
  return useQuery({
    queryKey: ["leave-requests"],
    queryFn: async () => {
      const { data, error } = await db
        .from("leave_requests")
        .select(`
          *,
          employees (full_name, employee_number, position)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useSalaryComponents() {
  return useQuery({
    queryKey: ["salary-components"],
    queryFn: async () => {
      const { data, error } = await db
        .from("salary_components")
        .select("*")
        .order("component_type", { ascending: true });
      
      if (error) throw error;
      return data as SalaryComponent[];
    },
  });
}

export function useEmployeeGrades() {
  return useQuery({
    queryKey: ["employee-grades"],
    queryFn: async () => {
      const { data, error } = await db
        .from("employee_grades")
        .select("*")
        .order("level", { ascending: true });
      
      if (error) throw error;
      return data as EmployeeGrade[];
    },
  });
}

export function usePositions() {
  return useQuery({
    queryKey: ["positions"],
    queryFn: async () => {
      const { data, error } = await db
        .from("positions")
        .select(`
          *,
          departments (name),
          employee_grades (grade_name)
        `)
        .order("position_name");
      
      if (error) throw error;
      return data as Position[];
    },
  });
}

export function usePayroll(month?: number, year?: number) {
  return useQuery({
    queryKey: ["payroll", month, year],
    queryFn: async () => {
      let query = db
        .from("payroll")
        .select(`
          *,
          employees (full_name, employee_number, position, department_id, departments (name))
        `)
        .order("created_at", { ascending: false });
      
      if (month && year) {
        query = query.eq("period_month", month).eq("period_year", year);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as PayrollRecord[];
    },
  });
}

export function useOvertimeRecords(month?: number, year?: number) {
  return useQuery({
    queryKey: ["overtime-records", month, year],
    queryFn: async () => {
      let query = db
        .from("overtime_records")
        .select(`
          *,
          employees (full_name, employee_number, position)
        `)
        .order("overtime_date", { ascending: false });
      
      if (month && year) {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
        query = query.gte("overtime_date", startDate).lte("overtime_date", endDate);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as OvertimeRecord[];
    },
  });
}

export function usePerformanceReviews(year?: number) {
  return useQuery({
    queryKey: ["performance-reviews", year],
    queryFn: async () => {
      let query = db
        .from("performance_reviews")
        .select(`
          *,
          employees!performance_reviews_employee_id_fkey (full_name, employee_number, position)
        `)
        .order("review_date", { ascending: false });
      
      if (year) {
        query = query.eq("review_year", year);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as PerformanceReview[];
    },
  });
}

export function useTrainingRecords() {
  return useQuery({
    queryKey: ["training-records"],
    queryFn: async () => {
      const { data, error } = await db
        .from("training_records")
        .select(`
          *,
          employees (full_name, employee_number, position)
        `)
        .order("start_date", { ascending: false });
      
      if (error) throw error;
      return data as TrainingRecord[];
    },
  });
}

export function useLeaveBalances(year?: number) {
  return useQuery({
    queryKey: ["leave-balances", year],
    queryFn: async () => {
      let query = db
        .from("leave_balances")
        .select(`
          *,
          employees (full_name, employee_number, position)
        `)
        .order("created_at", { ascending: false });
      
      if (year) {
        query = query.eq("year", year);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as LeaveBalance[];
    },
  });
}

export function useWorkShifts() {
  return useQuery({
    queryKey: ["work-shifts"],
    queryFn: async () => {
      const { data, error } = await db
        .from("work_shifts")
        .select("*")
        .eq("is_active", true)
        .order("start_time");
      
      if (error) throw error;
      return data as WorkShift[];
    },
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await db
        .from("departments")
        .select("*")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });
}

export function useEmployeeStats() {
  return useQuery({
    queryKey: ["employee-stats"],
    queryFn: async () => {
      const { count: total } = await db
        .from("employees")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      const today = format(new Date(), "yyyy-MM-dd");
      const { count: presentToday } = await db
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .eq("attendance_date", today)
        .eq("status", "present");

      const { count: pendingLeave } = await db
        .from("leave_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      const { count: pendingPayroll } = await db
        .from("payroll")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      return {
        total: total || 0,
        presentToday: presentToday || 0,
        pendingLeave: pendingLeave || 0,
        pendingPayroll: pendingPayroll || 0,
      };
    },
  });
}

// Mutation hooks
export function useAddEmployee() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (employee: Record<string, unknown>) => {
      const { data, error } = await db
        .from("employees")
        .insert(employee as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee-stats"] });
      toast({ title: "Karyawan berhasil ditambahkan" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal menambah karyawan", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...employee }: Partial<Employee> & { id: string }) => {
      const { data, error } = await db
        .from("employees")
        .update(employee)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast({ title: "Data karyawan berhasil diperbarui" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal memperbarui data", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db
        .from("employees")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee-stats"] });
      toast({ title: "Karyawan berhasil dihapus" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal menghapus karyawan", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateLeaveRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status, rejection_reason }: { id: string; status: string; rejection_reason?: string }) => {
      const updateData: Record<string, unknown> = { 
        status, 
        approved_at: new Date().toISOString() 
      };
      if (rejection_reason) {
        updateData.rejection_reason = rejection_reason;
      }
      
      const { error } = await db
        .from("leave_requests")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["employee-stats"] });
      toast({ title: "Status cuti berhasil diperbarui" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal memperbarui status", description: error.message, variant: "destructive" });
    },
  });
}

export function useAddLeaveRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (leaveRequest: {
      employee_id: string;
      leave_type: string;
      start_date: string;
      end_date: string;
      total_days: number;
      reason?: string;
    }) => {
      const { data, error } = await db
        .from("leave_requests")
        .insert(leaveRequest)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["employee-stats"] });
      toast({ title: "Pengajuan cuti berhasil dibuat" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal membuat pengajuan", description: error.message, variant: "destructive" });
    },
  });
}

export function useAddAttendance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (attendance: {
      employee_id: string;
      attendance_date: string;
      check_in?: string;
      check_out?: string;
      status: string;
      notes?: string;
    }) => {
      const { data, error } = await db
        .from("attendance")
        .insert(attendance)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["employee-stats"] });
      toast({ title: "Absensi berhasil dicatat" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal mencatat absensi", description: error.message, variant: "destructive" });
    },
  });
}

export function useCreatePayroll() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payroll: Record<string, unknown>) => {
      const { data, error } = await db
        .from("payroll")
        .insert(payroll as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
      toast({ title: "Payroll berhasil dibuat" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal membuat payroll", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdatePayroll() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...payroll }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await db
        .from("payroll")
        .update(payroll as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
      toast({ title: "Payroll berhasil diperbarui" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal memperbarui payroll", description: error.message, variant: "destructive" });
    },
  });
}

export function useAddOvertime() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (overtime: Record<string, unknown>) => {
      const { data, error } = await db
        .from("overtime_records")
        .insert(overtime as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overtime-records"] });
      toast({ title: "Lembur berhasil dicatat" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal mencatat lembur", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateOvertime() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...overtime }: Partial<OvertimeRecord> & { id: string }) => {
      const { data, error } = await db
        .from("overtime_records")
        .update(overtime)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overtime-records"] });
      toast({ title: "Status lembur berhasil diperbarui" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal memperbarui status", description: error.message, variant: "destructive" });
    },
  });
}

export function useAddPerformanceReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (review: Record<string, unknown>) => {
      const { data, error } = await db
        .from("performance_reviews")
        .insert(review as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-reviews"] });
      toast({ title: "Penilaian kinerja berhasil dibuat" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal membuat penilaian", description: error.message, variant: "destructive" });
    },
  });
}

export function useAddTraining() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (training: Record<string, unknown>) => {
      const { data, error } = await db
        .from("training_records")
        .insert(training as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-records"] });
      toast({ title: "Pelatihan berhasil dicatat" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal mencatat pelatihan", description: error.message, variant: "destructive" });
    },
  });
}

// Utility functions for payroll calculation
export function calculateOvertimeRate(baseSalary: number, overtimeType: 'weekday' | 'weekend' | 'holiday'): number {
  const hourlyRate = baseSalary / 173; // Standard working hours per month
  
  switch (overtimeType) {
    case 'weekday':
      return hourlyRate * 1.5; // 150% for first hour, 200% for subsequent (simplified)
    case 'weekend':
      return hourlyRate * 2.0; // 200%
    case 'holiday':
      return hourlyRate * 3.0; // 300%
    default:
      return hourlyRate * 1.5;
  }
}

export function calculatePPh21(grossSalary: number, taxStatus: string): number {
  // Simplified PPh 21 calculation
  const yearlyGross = grossSalary * 12;
  
  // PTKP (Penghasilan Tidak Kena Pajak) 2024
  const ptkpMap: Record<string, number> = {
    'TK/0': 54000000,
    'TK/1': 58500000,
    'TK/2': 63000000,
    'TK/3': 67500000,
    'K/0': 58500000,
    'K/1': 63000000,
    'K/2': 67500000,
    'K/3': 72000000,
  };
  
  const ptkp = ptkpMap[taxStatus] || 54000000;
  const pkp = Math.max(0, yearlyGross - ptkp);
  
  // Progressive tax rates
  let tax = 0;
  if (pkp <= 60000000) {
    tax = pkp * 0.05;
  } else if (pkp <= 250000000) {
    tax = 60000000 * 0.05 + (pkp - 60000000) * 0.15;
  } else if (pkp <= 500000000) {
    tax = 60000000 * 0.05 + 190000000 * 0.15 + (pkp - 250000000) * 0.25;
  } else if (pkp <= 5000000000) {
    tax = 60000000 * 0.05 + 190000000 * 0.15 + 250000000 * 0.25 + (pkp - 500000000) * 0.30;
  } else {
    tax = 60000000 * 0.05 + 190000000 * 0.15 + 250000000 * 0.25 + 4500000000 * 0.30 + (pkp - 5000000000) * 0.35;
  }
  
  return Math.round(tax / 12); // Monthly tax
}

export function calculateBPJS(baseSalary: number): { kesehatan: number; jht: number; jp: number } {
  const maxBPJSKesehatan = 12000000; // Max salary for BPJS calculation
  const maxBPJSJP = 9559600; // Max salary for JP calculation
  
  const baseKesehatan = Math.min(baseSalary, maxBPJSKesehatan);
  const baseJP = Math.min(baseSalary, maxBPJSJP);
  
  return {
    kesehatan: Math.round(baseKesehatan * 0.01), // 1% employee contribution
    jht: Math.round(baseSalary * 0.02), // 2% employee contribution
    jp: Math.round(baseJP * 0.01), // 1% employee contribution
  };
}

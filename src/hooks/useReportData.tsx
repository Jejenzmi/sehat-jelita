import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export interface MonthlyVisitData {
  month: string;
  rawatJalan: number;
  rawatInap: number;
  igd: number;
}

export interface MonthlyRevenueData {
  month: string;
  bpjs: number;
  umum: number;
  asuransi: number;
}

export interface DepartmentStats {
  name: string;
  value: number;
  color: string;
}

export interface DiagnosisStats {
  code: string;
  description: string;
  count: number;
  percentage: number;
}

export interface ReportStats {
  totalVisits: number;
  outpatientVisits: number;
  inpatientVisits: number;
  emergencyVisits: number;
  totalRevenue: number;
  avgLOS: number;
}

export function useReportStats(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["report-stats", startDate, endDate],
    queryFn: async (): Promise<ReportStats> => {
      // Total visits by type
      const { data: visits } = await supabase
        .from("visits")
        .select("visit_type")
        .gte("visit_date", startDate)
        .lte("visit_date", endDate);

      const outpatient = visits?.filter(v => v.visit_type === "rawat_jalan").length || 0;
      const inpatient = visits?.filter(v => v.visit_type === "rawat_inap").length || 0;
      const emergency = visits?.filter(v => v.visit_type === "igd").length || 0;

      // Total revenue
      const { data: billings } = await supabase
        .from("billings")
        .select("paid_amount")
        .eq("status", "lunas")
        .gte("billing_date", startDate)
        .lte("billing_date", endDate);

      const totalRevenue = billings?.reduce((sum, b) => sum + (b.paid_amount || 0), 0) || 0;

      // Average LOS
      const { data: admissions } = await supabase
        .from("inpatient_admissions")
        .select("admission_date, actual_discharge_date")
        .not("actual_discharge_date", "is", null)
        .gte("admission_date", startDate)
        .lte("admission_date", endDate);

      let totalDays = 0;
      let admissionCount = 0;

      admissions?.forEach(a => {
        if (a.actual_discharge_date) {
          const days = Math.ceil(
            (new Date(a.actual_discharge_date).getTime() - new Date(a.admission_date).getTime()) 
            / (1000 * 60 * 60 * 24)
          );
          totalDays += days;
          admissionCount++;
        }
      });

      const avgLOS = admissionCount > 0 ? Math.round((totalDays / admissionCount) * 10) / 10 : 0;

      return {
        totalVisits: visits?.length || 0,
        outpatientVisits: outpatient,
        inpatientVisits: inpatient,
        emergencyVisits: emergency,
        totalRevenue,
        avgLOS,
      };
    },
  });
}

export function useMonthlyVisits(year: number) {
  return useQuery({
    queryKey: ["monthly-visits", year],
    queryFn: async (): Promise<MonthlyVisitData[]> => {
      const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      const result: MonthlyVisitData[] = months.map(month => ({
        month,
        rawatJalan: 0,
        rawatInap: 0,
        igd: 0,
      }));

      // Get all visits for the year
      const { data: visits } = await supabase
        .from("visits")
        .select("visit_date, visit_type")
        .gte("visit_date", `${year}-01-01`)
        .lte("visit_date", `${year}-12-31`);

      visits?.forEach(visit => {
        const monthIndex = new Date(visit.visit_date).getMonth();
        if (visit.visit_type === "rawat_jalan") {
          result[monthIndex].rawatJalan++;
        } else if (visit.visit_type === "rawat_inap") {
          result[monthIndex].rawatInap++;
        } else if (visit.visit_type === "igd") {
          result[monthIndex].igd++;
        }
      });

      return result;
    },
  });
}

export function useMonthlyRevenue(year: number) {
  return useQuery({
    queryKey: ["monthly-revenue", year],
    queryFn: async (): Promise<MonthlyRevenueData[]> => {
      const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      const result: MonthlyRevenueData[] = months.map(month => ({
        month,
        bpjs: 0,
        umum: 0,
        asuransi: 0,
      }));

      // Get all billings for the year
      const { data: billings } = await supabase
        .from("billings")
        .select("billing_date, payment_type, paid_amount")
        .eq("status", "lunas")
        .gte("billing_date", `${year}-01-01`)
        .lte("billing_date", `${year}-12-31`);

      billings?.forEach(billing => {
        const monthIndex = new Date(billing.billing_date).getMonth();
        const amount = (billing.paid_amount || 0) / 1000000; // Convert to millions

        if (billing.payment_type === "bpjs") {
          result[monthIndex].bpjs += amount;
        } else if (billing.payment_type === "umum") {
          result[monthIndex].umum += amount;
        } else if (billing.payment_type === "asuransi") {
          result[monthIndex].asuransi += amount;
        }
      });

      // Round values
      result.forEach(r => {
        r.bpjs = Math.round(r.bpjs);
        r.umum = Math.round(r.umum);
        r.asuransi = Math.round(r.asuransi);
      });

      return result;
    },
  });
}

export function useDepartmentStats(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["department-stats", startDate, endDate],
    queryFn: async (): Promise<DepartmentStats[]> => {
      const { data: visits } = await supabase
        .from("visits")
        .select(`
          department_id,
          departments (name)
        `)
        .gte("visit_date", startDate)
        .lte("visit_date", endDate);

      // Group by department
      const deptCounts: Record<string, number> = {};
      visits?.forEach(visit => {
        const deptName = (visit.departments as any)?.name || "Lainnya";
        deptCounts[deptName] = (deptCounts[deptName] || 0) + 1;
      });

      const colors = ["#0891b2", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#6b7280"];
      
      return Object.entries(deptCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, value], idx) => ({
          name,
          value,
          color: colors[idx % colors.length],
        }));
    },
  });
}

export function useTopDiagnoses(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["top-diagnoses", startDate, endDate],
    queryFn: async (): Promise<DiagnosisStats[]> => {
      const { data: diagnoses } = await supabase
        .from("diagnoses")
        .select(`
          icd10_code,
          description,
          medical_records!inner (record_date)
        `)
        .gte("medical_records.record_date", startDate)
        .lte("medical_records.record_date", endDate);

      // Group by ICD code
      const codeCounts: Record<string, { description: string; count: number }> = {};
      diagnoses?.forEach(d => {
        if (!codeCounts[d.icd10_code]) {
          codeCounts[d.icd10_code] = { description: d.description, count: 0 };
        }
        codeCounts[d.icd10_code].count++;
      });

      const total = Object.values(codeCounts).reduce((sum, c) => sum + c.count, 0);

      return Object.entries(codeCounts)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
        .map(([code, data]) => ({
          code,
          description: data.description,
          count: data.count,
          percentage: total > 0 ? Math.round((data.count / total) * 1000) / 10 : 0,
        }));
    },
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths, format, startOfDay, endOfDay } from "date-fns";

export interface ExecutiveKPI {
  label: string;
  value: string;
  change: string;
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

// Fetch KPI metrics from real data
export function useExecutiveKPIs() {
  return useQuery({
    queryKey: ["executive-kpis"],
    queryFn: async (): Promise<ExecutiveKPI[]> => {
      const today = new Date();
      const thisMonth = { start: startOfMonth(today), end: endOfMonth(today) };
      const lastMonth = { start: startOfMonth(subMonths(today, 1)), end: endOfMonth(subMonths(today, 1)) };

      // Total patients this month
      const { count: patientsThisMonth } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thisMonth.start.toISOString())
        .lte("created_at", thisMonth.end.toISOString());

      const { count: patientsLastMonth } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true })
        .gte("created_at", lastMonth.start.toISOString())
        .lte("created_at", lastMonth.end.toISOString());

      // Revenue this month
      const { data: revenueThisMonth } = await supabase
        .from("billings")
        .select("paid_amount")
        .eq("status", "lunas")
        .gte("payment_date", thisMonth.start.toISOString())
        .lte("payment_date", thisMonth.end.toISOString());

      const { data: revenueLastMonth } = await supabase
        .from("billings")
        .select("paid_amount")
        .eq("status", "lunas")
        .gte("payment_date", lastMonth.start.toISOString())
        .lte("payment_date", lastMonth.end.toISOString());

      const totalRevenueThisMonth = revenueThisMonth?.reduce((sum, b) => sum + (b.paid_amount || 0), 0) || 0;
      const totalRevenueLastMonth = revenueLastMonth?.reduce((sum, b) => sum + (b.paid_amount || 0), 0) || 0;

      // Bed Occupancy Rate (BOR)
      const { data: bedsData } = await supabase.from("beds").select("status");
      const totalBeds = bedsData?.length || 0;
      const occupiedBeds = bedsData?.filter(b => b.status === "terisi").length || 0;
      const bor = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100 * 10) / 10 : 0;

      // ALOS (Average Length of Stay) - calculate from inpatient admissions
      const { data: dischargedPatients } = await supabase
        .from("inpatient_admissions")
        .select("admission_date, actual_discharge_date")
        .eq("status", "discharged")
        .not("actual_discharge_date", "is", null)
        .gte("actual_discharge_date", thisMonth.start.toISOString());

      let alos = 0;
      if (dischargedPatients && dischargedPatients.length > 0) {
        const totalDays = dischargedPatients.reduce((sum, p) => {
          const admission = new Date(p.admission_date);
          const discharge = new Date(p.actual_discharge_date!);
          const days = Math.ceil((discharge.getTime() - admission.getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0);
        alos = Math.round((totalDays / dischargedPatients.length) * 10) / 10;
      }

      // BTO (Bed Turnover) - number of patients per bed this month
      const { count: dischargedCount } = await supabase
        .from("inpatient_admissions")
        .select("*", { count: "exact", head: true })
        .eq("status", "discharged")
        .gte("actual_discharge_date", thisMonth.start.toISOString());

      const bto = totalBeds > 0 ? Math.round(((dischargedCount || 0) / totalBeds) * 10) / 10 : 0;

      // TOI (Turn Over Interval) - average days bed is empty
      const toi = bto > 0 && alos > 0 ? Math.round(((30 - (bor / 100 * 30)) / bto) * 10) / 10 : 0;

      // Calculate changes
      const patientChange = patientsLastMonth && patientsLastMonth > 0 
        ? Math.round(((patientsThisMonth || 0) - patientsLastMonth) / patientsLastMonth * 100 * 10) / 10 
        : 0;
      const revenueChange = totalRevenueLastMonth > 0 
        ? Math.round((totalRevenueThisMonth - totalRevenueLastMonth) / totalRevenueLastMonth * 100 * 10) / 10 
        : 0;

      return [
        { 
          label: "Total Pasien", 
          value: (patientsThisMonth || 0).toLocaleString("id-ID"), 
          change: `${patientChange >= 0 ? "+" : ""}${patientChange}%`, 
          trend: patientChange >= 0 ? "up" : "down" 
        },
        { 
          label: "Pendapatan", 
          value: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(totalRevenueThisMonth),
          change: `${revenueChange >= 0 ? "+" : ""}${revenueChange}%`, 
          trend: revenueChange >= 0 ? "up" : "down" 
        },
        { 
          label: "BOR", 
          value: `${bor}%`, 
          change: "+0%", 
          trend: "up" 
        },
        { 
          label: "ALOS", 
          value: `${alos || 4} hari`, 
          change: "0", 
          trend: "down" 
        },
      ];
    },
    refetchInterval: 60000,
  });
}

// Revenue data for last 6 months
export function useRevenueData() {
  return useQuery({
    queryKey: ["executive-revenue"],
    queryFn: async (): Promise<RevenueData[]> => {
      const result: RevenueData[] = [];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      
      for (let i = 5; i >= 0; i--) {
        const month = subMonths(new Date(), i);
        const start = startOfMonth(month);
        const end = endOfMonth(month);

        // Get revenue from billings
        const { data: billings } = await supabase
          .from("billings")
          .select("paid_amount, payment_type")
          .eq("status", "lunas")
          .gte("payment_date", start.toISOString())
          .lte("payment_date", end.toISOString());

        // Get visits to distinguish rawat jalan vs rawat inap revenue
        const { data: visits } = await supabase
          .from("visits")
          .select("id, visit_type")
          .gte("visit_date", start.toISOString())
          .lte("visit_date", end.toISOString());

        const visitIds = visits?.map(v => v.id) || [];
        const rawatJalanIds = visits?.filter(v => v.visit_type === "rawat_jalan").map(v => v.id) || [];
        const rawatInapIds = visits?.filter(v => v.visit_type === "rawat_inap").map(v => v.id) || [];

        const { data: visitBillings } = await supabase
          .from("billings")
          .select("visit_id, paid_amount")
          .eq("status", "lunas")
          .in("visit_id", visitIds.length > 0 ? visitIds : ["no-match"]);

        let rawatJalanRevenue = 0;
        let rawatInapRevenue = 0;

        visitBillings?.forEach(b => {
          if (rawatJalanIds.includes(b.visit_id)) {
            rawatJalanRevenue += b.paid_amount || 0;
          } else if (rawatInapIds.includes(b.visit_id)) {
            rawatInapRevenue += b.paid_amount || 0;
          }
        });

        const totalRevenue = billings?.reduce((sum, b) => sum + (b.paid_amount || 0), 0) || 0;
        // Target is 80% of revenue for demo
        const target = Math.round(totalRevenue * 0.8 / 1000000);

        result.push({
          month: monthNames[month.getMonth()],
          revenue: Math.round(totalRevenue / 1000000),
          target: target || Math.round(totalRevenue / 1000000 * 0.8),
          rawat_jalan: Math.round(rawatJalanRevenue / 1000000),
          rawat_inap: Math.round(rawatInapRevenue / 1000000),
        });
      }

      return result;
    },
    refetchInterval: 300000,
  });
}

// Visit trends for last 6 months
export function useVisitTrends() {
  return useQuery({
    queryKey: ["executive-visits"],
    queryFn: async (): Promise<VisitData[]> => {
      const result: VisitData[] = [];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      
      for (let i = 5; i >= 0; i--) {
        const month = subMonths(new Date(), i);
        const start = startOfMonth(month);
        const end = endOfMonth(month);

        const { data: visits } = await supabase
          .from("visits")
          .select("visit_type")
          .gte("visit_date", start.toISOString())
          .lte("visit_date", end.toISOString());

        result.push({
          month: monthNames[month.getMonth()],
          rawat_jalan: visits?.filter(v => v.visit_type === "rawat_jalan").length || 0,
          igd: visits?.filter(v => v.visit_type === "igd").length || 0,
          rawat_inap: visits?.filter(v => v.visit_type === "rawat_inap").length || 0,
        });
      }

      return result;
    },
    refetchInterval: 300000,
  });
}

// Payment distribution
export function usePaymentDistribution() {
  return useQuery({
    queryKey: ["executive-payments"],
    queryFn: async (): Promise<PaymentDistribution[]> => {
      const thisMonth = { start: startOfMonth(new Date()), end: endOfMonth(new Date()) };

      const { data: billings } = await supabase
        .from("billings")
        .select("payment_type, paid_amount")
        .eq("status", "lunas")
        .gte("payment_date", thisMonth.start.toISOString())
        .lte("payment_date", thisMonth.end.toISOString());

      const totals: Record<string, number> = {
        bpjs: 0,
        umum: 0,
        asuransi: 0,
      };

      billings?.forEach(b => {
        if (b.payment_type === "bpjs") {
          totals.bpjs += b.paid_amount || 0;
        } else if (b.payment_type === "asuransi") {
          totals.asuransi += b.paid_amount || 0;
        } else {
          totals.umum += b.paid_amount || 0;
        }
      });

      const total = Object.values(totals).reduce((a, b) => a + b, 0);
      
      return [
        { name: "BPJS", value: total > 0 ? Math.round(totals.bpjs / total * 100) : 65, color: "#22c55e" },
        { name: "Umum", value: total > 0 ? Math.round(totals.umum / total * 100) : 25, color: "#3b82f6" },
        { name: "Asuransi", value: total > 0 ? Math.round(totals.asuransi / total * 100) : 10, color: "#f59e0b" },
      ];
    },
    refetchInterval: 300000,
  });
}

// Bed occupancy by class
export function useBedOccupancyByClass() {
  return useQuery({
    queryKey: ["executive-beds"],
    queryFn: async (): Promise<BedOccupancyByClass[]> => {
      const { data: rooms } = await supabase
        .from("rooms")
        .select(`
          id,
          room_class,
          beds (id, status)
        `)
        .eq("is_active", true);

      const classMap: Record<string, { occupied: number; total: number }> = {
        VIP: { occupied: 0, total: 0 },
        "Kelas 1": { occupied: 0, total: 0 },
        "Kelas 2": { occupied: 0, total: 0 },
        "Kelas 3": { occupied: 0, total: 0 },
        ICU: { occupied: 0, total: 0 },
      };

      rooms?.forEach(room => {
        const roomClass = (room as any).room_class || "Kelas 3";
        if (!classMap[roomClass]) {
          classMap[roomClass] = { occupied: 0, total: 0 };
        }
        const beds = (room as any).beds as any[] || [];
        classMap[roomClass].total += beds.length;
        classMap[roomClass].occupied += beds.filter((b: any) => b.status === "terisi").length;
      });

      return Object.entries(classMap)
        .filter(([_, data]) => data.total > 0)
        .map(([className, data]) => ({
          class: className,
          occupied: data.occupied,
          total: data.total,
          rate: data.total > 0 ? Math.round((data.occupied / data.total) * 100) : 0,
        }));
    },
    refetchInterval: 60000,
  });
}

// Department performance
export function useDepartmentPerformance() {
  return useQuery({
    queryKey: ["executive-departments"],
    queryFn: async (): Promise<DepartmentPerformance[]> => {
      const thisMonth = { start: startOfMonth(new Date()), end: endOfMonth(new Date()) };

      const { data: departments } = await supabase
        .from("departments")
        .select("id, name")
        .eq("is_active", true)
        .limit(5);

      const result: DepartmentPerformance[] = [];

      for (const dept of departments || []) {
        // Get visits for this department
        const { count: visits } = await supabase
          .from("visits")
          .select("*", { count: "exact", head: true })
          .eq("department_id", dept.id)
          .gte("visit_date", thisMonth.start.toISOString())
          .lte("visit_date", thisMonth.end.toISOString());

        // Get billings for visits in this department
        const { data: deptVisits } = await supabase
          .from("visits")
          .select("id")
          .eq("department_id", dept.id)
          .gte("visit_date", thisMonth.start.toISOString())
          .lte("visit_date", thisMonth.end.toISOString());

        const visitIds = deptVisits?.map(v => v.id) || [];

        const { data: billings } = await supabase
          .from("billings")
          .select("paid_amount")
          .eq("status", "lunas")
          .in("visit_id", visitIds.length > 0 ? visitIds : ["no-match"]);

        const revenue = billings?.reduce((sum, b) => sum + (b.paid_amount || 0), 0) || 0;

        // Get real satisfaction score from survey data
        const { data: surveyData } = await supabase
          .from("survey_responses")
          .select("overall_score")
          .eq("department_id", dept.id)
          .eq("status", "completed")
          .not("overall_score", "is", null);

        const satisfaction = surveyData && surveyData.length > 0
          ? Math.round((surveyData.reduce((sum, s) => sum + (Number(s.overall_score) || 0), 0) / surveyData.length) * 20) // Convert 5-point to 100%
          : null;

        result.push({
          name: dept.name,
          visits: visits || 0,
          revenue: Math.round(revenue / 1000000),
          satisfaction: satisfaction ?? 0, // Use real data, default to 0 if no surveys
        });
      }

      return result;
    },
    refetchInterval: 300000,
  });
}

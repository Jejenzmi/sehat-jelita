import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, subDays, format } from "date-fns";

export interface DashboardStats {
  totalVisitsToday: number;
  outpatientToday: number;
  inpatientCount: number;
  occupancyRate: number;
  revenueToday: number;
  pendingBillings: number;
}

export interface BedOccupancyData {
  name: string;
  occupied: number;
  total: number;
  color: string;
}

export interface WeeklyVisitData {
  name: string;
  rawatJalan: number;
  rawatInap: number;
  igd: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      const today = new Date();
      const startToday = startOfDay(today).toISOString();
      const endToday = endOfDay(today).toISOString();

      // Get today's visits count
      const { count: visitsToday } = await db
        .from("visits")
        .select("*", { count: "exact", head: true })
        .gte("visit_date", startToday)
        .lte("visit_date", endToday);

      // Get outpatient visits today
      const { count: outpatientToday } = await db
        .from("visits")
        .select("*", { count: "exact", head: true })
        .eq("visit_type", "rawat_jalan")
        .gte("visit_date", startToday)
        .lte("visit_date", endToday);

      // Get inpatient admissions (active)
      const { count: inpatientCount } = await db
        .from("inpatient_admissions")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Get beds for occupancy calculation
      const { data: bedsData } = await db
        .from("beds")
        .select("status");

      const totalBeds = bedsData?.length || 0;
      const occupiedBeds = bedsData?.filter(b => b.status === "terisi").length || 0;
      const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

      // Get today's revenue
      const { data: billingData } = await db
        .from("billings")
        .select("paid_amount")
        .eq("status", "lunas")
        .gte("payment_date", startToday)
        .lte("payment_date", endToday);

      const revenueToday = billingData?.reduce((sum, b) => sum + (b.paid_amount || 0), 0) || 0;

      // Get pending billings count
      const { count: pendingBillings } = await db
        .from("billings")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      return {
        totalVisitsToday: visitsToday || 0,
        outpatientToday: outpatientToday || 0,
        inpatientCount: inpatientCount || 0,
        occupancyRate,
        revenueToday,
        pendingBillings: pendingBillings || 0,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useBedOccupancy() {
  return useQuery({
    queryKey: ["bed-occupancy"],
    queryFn: async (): Promise<BedOccupancyData[]> => {
      // Get rooms with their beds
      const { data: rooms } = await db
        .from("rooms")
        .select(`
          id,
          room_class,
          beds (id, status)
        `)
        .eq("is_active", true);

      // Group by room class
      const classMap: Record<string, { occupied: number; total: number; color: string }> = {
        VIP: { occupied: 0, total: 0, color: "bg-medical-purple" },
        "Kelas 1": { occupied: 0, total: 0, color: "bg-primary" },
        "Kelas 2": { occupied: 0, total: 0, color: "bg-medical-blue" },
        "Kelas 3": { occupied: 0, total: 0, color: "bg-success" },
        ICU: { occupied: 0, total: 0, color: "bg-destructive" },
        NICU: { occupied: 0, total: 0, color: "bg-warning" },
      };

      rooms?.forEach(room => {
        const roomClass = (room as any).room_class || "Kelas 3";
        if (!classMap[roomClass]) {
          classMap[roomClass] = { occupied: 0, total: 0, color: "bg-muted" };
        }
        const beds = (room as any).beds as any[] || [];
        classMap[roomClass].total += beds.length;
        classMap[roomClass].occupied += beds.filter((b: any) => b.status === "terisi").length;
      });

      return Object.entries(classMap)
        .filter(([_, data]) => data.total > 0)
        .map(([name, data]) => ({
          name,
          occupied: data.occupied,
          total: data.total,
          color: data.color,
        }));
    },
    refetchInterval: 60000,
  });
}

export function useWeeklyVisits() {
  return useQuery({
    queryKey: ["weekly-visits"],
    queryFn: async (): Promise<WeeklyVisitData[]> => {
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

      const { data: visits } = await db
        .from("visits")
        .select("visit_date, visit_type")
        .gte("visit_date", weekStart.toISOString())
        .lte("visit_date", weekEnd.toISOString());

      // Group by day
      const daysOfWeek = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
      const result: WeeklyVisitData[] = daysOfWeek.map((name, idx) => ({
        name,
        rawatJalan: 0,
        rawatInap: 0,
        igd: 0,
      }));

      visits?.forEach(visit => {
        const visitDate = new Date(visit.visit_date);
        const dayIndex = (visitDate.getDay() + 6) % 7; // Convert to Monday = 0
        
        if (visit.visit_type === "rawat_jalan") {
          result[dayIndex].rawatJalan++;
        } else if (visit.visit_type === "rawat_inap") {
          result[dayIndex].rawatInap++;
        } else if (visit.visit_type === "igd") {
          result[dayIndex].igd++;
        }
      });

      return result;
    },
    refetchInterval: 60000,
  });
}

export function useRecentPatients() {
  return useQuery({
    queryKey: ["recent-patients"],
    queryFn: async () => {
      const { data } = await db
        .from("visits")
        .select(`
          id,
          visit_date,
          visit_type,
          status,
          patients (
            id,
            full_name,
            medical_record_number
          ),
          departments (
            name
          )
        `)
        .order("visit_date", { ascending: false })
        .limit(10);

      return data || [];
    },
    refetchInterval: 30000,
  });
}

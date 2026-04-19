import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string | null;
  action: string;
  old_data: any;
  new_data: any;
  user_id: string | null;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface UseAuditLogsOptions {
  tableName?: string;
  action?: string;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export function useAuditLogs(options: UseAuditLogsOptions = {}) {
  const { tableName, action, limit = 100, startDate, endDate } = options;

  return useQuery({
    queryKey: ["audit-logs", tableName, action, limit, startDate, endDate],
    queryFn: async (): Promise<AuditLog[]> => {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (tableName) {
        query = query.eq("table_name", tableName);
      }

      if (action) {
        query = query.eq("action", action);
      }

      if (startDate) {
        query = query.gte("created_at", startDate);
      }

      if (endDate) {
        query = query.lte("created_at", endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching audit logs:", error);
        throw error;
      }

      // Fetch user profiles separately
      const userIds = [...new Set(data?.map(d => d.user_id).filter(Boolean))];
      let profilesMap: Record<string, any> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", userIds);

        profiles?.forEach(p => {
          profilesMap[p.user_id] = p;
        });
      }

      return (data || []).map(log => ({
        ...log,
        profiles: profilesMap[log.user_id || ""] || undefined,
      })) as AuditLog[];
    },
  });
}

export function useAuditStats() {
  return useQuery({
    queryKey: ["audit-stats"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      // Get today's count
      const { count: todayCount } = await supabase
        .from("audit_logs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today);

      // Get this week's count
      const { count: weekCount } = await supabase
        .from("audit_logs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekAgo);

      // Get action breakdown
      const { data: actionBreakdown } = await supabase
        .from("audit_logs")
        .select("action")
        .gte("created_at", weekAgo);

      const actionCounts = {
        INSERT: 0,
        UPDATE: 0,
        DELETE: 0,
      };

      actionBreakdown?.forEach((log: any) => {
        if (log.action in actionCounts) {
          actionCounts[log.action as keyof typeof actionCounts]++;
        }
      });

      // Get table breakdown
      const { data: tableBreakdown } = await supabase
        .from("audit_logs")
        .select("table_name")
        .gte("created_at", weekAgo);

      const tableCounts: Record<string, number> = {};
      tableBreakdown?.forEach((log: any) => {
        tableCounts[log.table_name] = (tableCounts[log.table_name] || 0) + 1;
      });

      return {
        todayCount: todayCount || 0,
        weekCount: weekCount || 0,
        actionCounts,
        tableCounts,
      };
    },
  });
}

import { useQuery } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string | null;
  action: string;
  old_data: unknown;
  new_data: unknown;
  user_id: string | null;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
  user?: { id: string; email: string; full_name: string };
}

interface UseAuditLogsOptions {
  tableName?: string;
  action?: string;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

async function fetchAuditLogs(params: URLSearchParams): Promise<AuditLog[]> {
  const res = await fetch(`${API_BASE}/admin/audit-logs?${params}`, {
    credentials: "include",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return json.data || [];
}

export function useAuditLogs(options: UseAuditLogsOptions = {}) {
  const { tableName, action, limit = 100, startDate, endDate } = options;

  return useQuery({
    queryKey: ["audit-logs", tableName, action, limit, startDate, endDate],
    queryFn: () => {
      const params = new URLSearchParams({ limit: String(limit) });
      if (tableName)  params.set("table_name", tableName);
      if (action)     params.set("action", action);
      if (startDate)  params.set("from", startDate);
      if (endDate)    params.set("to", endDate);
      return fetchAuditLogs(params);
    },
  });
}

export function useAuditStats() {
  return useQuery({
    queryKey: ["audit-stats"],
    queryFn: async () => {
      const today   = new Date().toISOString().split("T")[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const [todayLogs, weekLogs] = await Promise.all([
        fetchAuditLogs(new URLSearchParams({ from: today, limit: "1000" })),
        fetchAuditLogs(new URLSearchParams({ from: weekAgo, limit: "1000" })),
      ]);

      const actionCounts = { INSERT: 0, UPDATE: 0, DELETE: 0 } as Record<string, number>;
      const tableCounts: Record<string, number> = {};

      weekLogs.forEach((log) => {
        if (log.action in actionCounts) actionCounts[log.action]++;
        tableCounts[log.table_name] = (tableCounts[log.table_name] || 0) + 1;
      });

      return {
        todayCount: todayLogs.length,
        weekCount:  weekLogs.length,
        actionCounts,
        tableCounts,
      };
    },
  });
}

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, Shield, Calendar, User, Database, Eye,
  ChevronLeft, ChevronRight, Download, Filter, RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  user_id: string;
  old_data: unknown;
  new_data: unknown;
  ip_address?: string;
  created_at: string;
  user?: { id: string; email: string; full_name: string };
}

const actionBadge: Record<string, { label: string; variant: string }> = {
  CREATE: { label: "Buat", variant: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  UPDATE: { label: "Ubah", variant: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  DELETE: { label: "Hapus", variant: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  VERIFY: { label: "Verifikasi", variant: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  DISPENSE: { label: "Serah", variant: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  RETURN: { label: "Retur", variant: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  LOGIN: { label: "Login", variant: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200" },
};

function JsonDiff({ oldData, newData }: { oldData: unknown; newData: unknown }) {
  if (!oldData && !newData) return <p className="text-sm text-muted-foreground">Tidak ada data</p>;

  const oldObj = typeof oldData === "object" && oldData ? (oldData as Record<string, unknown>) : {};
  const newObj = typeof newData === "object" && newData ? (newData as Record<string, unknown>) : {};
  const allKeys = [...new Set([...Object.keys(oldObj), ...Object.keys(newObj)])];

  return (
    <div className="font-mono text-xs space-y-1">
      {allKeys.map((key) => {
        const oldVal = JSON.stringify(oldObj[key] ?? null);
        const newVal = JSON.stringify(newObj[key] ?? null);
        const changed = oldVal !== newVal;

        if (!changed && oldObj[key] !== undefined) return null;

        return (
          <div key={key} className={`py-1 px-2 rounded ${changed ? "bg-yellow-50 dark:bg-yellow-950" : ""}`}>
            <span className="font-semibold text-muted-foreground">{key}: </span>
            {oldObj[key] !== undefined && (
              <span className="text-red-600 line-through mr-2">{oldVal}</span>
            )}
            {newObj[key] !== undefined && (
              <span className="text-green-600">{newVal}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(30);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Filters
  const [filterAction, setFilterAction] = useState("");
  const [filterTable, setFilterTable] = useState("");
  const [searchUser, setSearchUser] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (filterAction) params.set("action", filterAction);
      if (filterTable) params.set("table_name", filterTable);
      if (searchUser) params.set("user_id", searchUser);

      const res = await fetch(`${API_BASE}/admin/audit-logs?${params}`, {
        credentials: "include",
      });
      const json = await res.json();
      if (json.success) {
        setLogs(json.data || []);
        setTotal(json.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [page, filterAction, filterTable]);

  const totalPages = Math.ceil(total / limit);

  const tableNames = [...new Set(logs.map((l) => l.table_name).filter(Boolean))];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Audit Logs
          </h1>
          <p className="text-muted-foreground">Riwayat perubahan data sistem</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="w-48">
              <Label className="text-xs">Aksi</Label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger><SelectValue placeholder="Semua aksi" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="VERIFY">Verify</SelectItem>
                  <SelectItem value="DISPENSE">Dispense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Label className="text-xs">Tabel</Label>
              <Select value={filterTable} onValueChange={setFilterTable}>
                <SelectTrigger><SelectValue placeholder="Semua tabel" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua</SelectItem>
                  {tableNames.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs">Cari User</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ID atau nama user..."
                  className="pl-9"
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchLogs()}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Log Aktivitas</CardTitle>
          <CardDescription>{total.toLocaleString()} entri ditemukan</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px]">Waktu</TableHead>
                    <TableHead className="w-[180px]">User</TableHead>
                    <TableHead className="w-[100px]">Aksi</TableHead>
                    <TableHead className="w-[160px]">Tabel</TableHead>
                    <TableHead>Record ID</TableHead>
                    <TableHead className="w-[80px]">Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const action = actionBadge[log.action] || { label: log.action, variant: "bg-gray-100 text-gray-800" };
                    return (
                      <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            {format(new Date(log.created_at), "dd MMM yyyy, HH:mm:ss", { locale: localeId })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{log.user?.full_name || "-"}</p>
                              <p className="text-xs text-muted-foreground truncate">{log.user?.email || log.user_id}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${action.variant}`}>
                            {action.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Database className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm font-mono">{log.table_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-mono text-muted-foreground">
                            {log.record_id?.substring(0, 8)}...
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {logs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        Tidak ada log ditemukan
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Halaman {page} dari {totalPages} ({total} total)
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Detail Audit Log
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-4 p-1">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">Waktu</Label>
                    <p>{format(new Date(selectedLog.created_at), "dd MMMM yyyy, HH:mm:ss", { locale: localeId })}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">User</Label>
                    <p>{selectedLog.user?.full_name || selectedLog.user_id}</p>
                    <p className="text-xs text-muted-foreground">{selectedLog.user?.email}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Aksi</Label>
                    <p>{selectedLog.action}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Tabel</Label>
                    <p className="font-mono">{selectedLog.table_name}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Record ID</Label>
                    <p className="font-mono text-xs">{selectedLog.record_id}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Perubahan Data</Label>
                  <div className="bg-muted p-3 rounded-lg">
                    <JsonDiff oldData={selectedLog.old_data} newData={selectedLog.new_data} />
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

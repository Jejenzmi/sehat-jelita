import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Wrench, AlertCircle, CheckCircle, Clock, Plus, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  useMaintenanceStats, useMaintenanceRequests, useMaintenanceAssets,
  useCreateMaintenanceRequest, useUpdateMaintenanceRequest,
} from "@/hooks/useSupportModules";

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  low:      { label: "Rendah",   color: "bg-muted text-muted-foreground" },
  normal:   { label: "Normal",   color: "bg-info/10 text-info" },
  high:     { label: "Tinggi",   color: "bg-warning/10 text-warning" },
  critical: { label: "Kritis",   color: "bg-destructive/10 text-destructive" },
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  open:        { label: "Buka",        color: "bg-warning/10 text-warning" },
  in_progress: { label: "Dikerjakan",  color: "bg-info/10 text-info" },
  completed:   { label: "Selesai",     color: "bg-success/10 text-success" },
  cancelled:   { label: "Dibatalkan",  color: "bg-muted text-muted-foreground" },
};

const EMPTY_FORM = {
  asset_id: "", request_type: "corrective", priority: "normal",
  title: "", description: "", reported_by: "", department_name: "", technician_name: "",
};

export default function MaintenanceDashboard() {
  const { data: stats, isLoading: loadingStats } = useMaintenanceStats();
  const { data: requests = [], isLoading: loadingRequests } = useMaintenanceRequests();
  const { data: assets = [] } = useMaintenanceAssets();
  const createRequest = useCreateMaintenanceRequest();
  const updateRequest = useUpdateMaintenanceRequest();

  const [tab, setTab] = useState<"requests" | "assets">("requests");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const handleCreate = () => {
    createRequest.mutate({
      ...form,
      asset_id: form.asset_id || undefined,
      description: form.description || undefined,
      reported_by: form.reported_by || undefined,
      department_name: form.department_name || undefined,
      technician_name: form.technician_name || undefined,
    }, { onSuccess: () => { setOpen(false); setForm(EMPTY_FORM); } });
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Wrench className="h-8 w-8 text-primary" />
              <div>
                {loadingStats ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{stats?.totalAssets ?? 0}</p>}
                <p className="text-sm text-muted-foreground">Total Aset</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-warning" />
              <div>
                {loadingStats ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{stats?.needRepair ?? 0}</p>}
                <p className="text-sm text-muted-foreground">Perlu Perbaikan</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-info" />
              <div>
                {loadingStats ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{stats?.scheduledThisWeek ?? 0}</p>}
                <p className="text-sm text-muted-foreground">Jadwal Minggu Ini</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-success" />
              <div>
                {loadingStats ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{stats?.uptime ?? 100}%</p>}
                <p className="text-sm text-muted-foreground">Uptime Aset</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button variant={tab === "requests" ? "default" : "outline"} size="sm" onClick={() => setTab("requests")}>Work Order</Button>
        <Button variant={tab === "assets" ? "default" : "outline"} size="sm" onClick={() => setTab("assets")}>Daftar Aset</Button>
      </div>

      {/* Work Orders */}
      {tab === "requests" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Permintaan Pemeliharaan</CardTitle>
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Work Order Baru
            </Button>
          </CardHeader>
          <CardContent>
            {loadingRequests ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Tidak ada work order aktif</div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No. WO</TableHead>
                      <TableHead>Judul</TableHead>
                      <TableHead>Aset</TableHead>
                      <TableHead>Prioritas</TableHead>
                      <TableHead>Teknisi</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((req) => {
                      const p = PRIORITY_MAP[req.priority] || { label: req.priority, color: "bg-muted" };
                      const s = STATUS_MAP[req.status] || { label: req.status, color: "bg-muted" };
                      const nextStatus: Record<string, string> = { open: "in_progress", in_progress: "completed" };
                      const nextLabel: Record<string, string> = { open: "Mulai", in_progress: "Selesai" };
                      return (
                        <TableRow key={req.id}>
                          <TableCell className="font-mono text-xs">{req.request_number}</TableCell>
                          <TableCell className="max-w-[200px] truncate font-medium">{req.title}</TableCell>
                          <TableCell className="text-sm">{req.maintenance_assets?.asset_name || "-"}</TableCell>
                          <TableCell><Badge className={p.color}>{p.label}</Badge></TableCell>
                          <TableCell>{req.technician_name || "-"}</TableCell>
                          <TableCell><Badge className={s.color}>{s.label}</Badge></TableCell>
                          <TableCell>
                            {nextStatus[req.status] && (
                              <Button variant="outline" size="sm"
                                onClick={() => updateRequest.mutate({ id: req.id, status: nextStatus[req.status] })}
                                disabled={updateRequest.isPending}>
                                {updateRequest.isPending ? <RefreshCw className="h-3 w-3 animate-spin" /> : nextLabel[req.status]}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Assets */}
      {tab === "assets" && (
        <Card>
          <CardHeader><CardTitle>Daftar Aset</CardTitle></CardHeader>
          <CardContent>
            {assets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Belum ada data aset terdaftar</div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode Aset</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Lokasi</TableHead>
                      <TableHead>Kondisi</TableHead>
                      <TableHead>Service Berikut</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assets.map((asset) => {
                      const s = STATUS_MAP[asset.status] || { label: asset.status, color: "bg-muted" };
                      return (
                        <TableRow key={asset.id}>
                          <TableCell className="font-mono text-xs">{asset.asset_code}</TableCell>
                          <TableCell className="font-medium">{asset.asset_name}</TableCell>
                          <TableCell>{asset.asset_category || "-"}</TableCell>
                          <TableCell>{asset.location || "-"}</TableCell>
                          <TableCell><Badge variant="outline">{asset.condition}</Badge></TableCell>
                          <TableCell className="text-sm">
                            {asset.next_service_date
                              ? format(new Date(asset.next_service_date), "dd MMM yyyy", { locale: id })
                              : "-"}
                          </TableCell>
                          <TableCell><Badge className={s.color}>{s.label}</Badge></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Work Order Baru</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Judul / Deskripsi Singkat *</Label>
              <Input placeholder="Cth: AC ruang operasi tidak dingin" value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tipe</Label>
                <Select value={form.request_type} onValueChange={v => setForm(p => ({ ...p, request_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corrective">Korektif</SelectItem>
                    <SelectItem value="preventive">Preventif</SelectItem>
                    <SelectItem value="calibration">Kalibrasi</SelectItem>
                    <SelectItem value="inspection">Inspeksi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioritas</Label>
                <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Rendah</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Tinggi</SelectItem>
                    <SelectItem value="critical">Kritis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Aset</Label>
                <Select value={form.asset_id} onValueChange={v => setForm(p => ({ ...p, asset_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Pilih aset..." /></SelectTrigger>
                  <SelectContent>
                    {assets.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.asset_name} ({a.asset_code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Teknisi</Label>
                <Input value={form.technician_name} onChange={e => setForm(p => ({ ...p, technician_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Dilaporkan Oleh</Label>
                <Input value={form.reported_by} onChange={e => setForm(p => ({ ...p, reported_by: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Departemen</Label>
                <Input value={form.department_name} onChange={e => setForm(p => ({ ...p, department_name: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Keterangan Detail</Label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleCreate} disabled={createRequest.isPending || !form.title}>
              {createRequest.isPending && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              Buat Work Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

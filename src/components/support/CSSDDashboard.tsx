import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Package, CheckCircle, Clock, Plus, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useCssdStats, useCssdBatches, useCreateCssdBatch, useUpdateCssdBatch } from "@/hooks/useSupportModules";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending:     { label: "Menunggu",   color: "bg-warning/10 text-warning" },
  in_process:  { label: "Diproses",   color: "bg-info/10 text-info" },
  completed:   { label: "Selesai",    color: "bg-success/10 text-success" },
  failed:      { label: "Gagal",      color: "bg-destructive/10 text-destructive" },
  quarantine:  { label: "Karantina",  color: "bg-orange-100 text-orange-600" },
};

const METHOD_LABELS: Record<string, string> = {
  autoclave:       "Autoclave",
  ethylene_oxide:  "Ethylene Oxide",
  dry_heat:        "Dry Heat",
  plasma:          "Plasma",
};

export default function CSSDDashboard() {
  const { data: stats, isLoading: loadingStats } = useCssdStats();
  const { data: batches = [], isLoading: loadingBatches } = useCssdBatches();
  const createBatch = useCreateCssdBatch();
  const updateBatch = useUpdateCssdBatch();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    sterilization_method: "autoclave",
    operator_name: "",
    temperature: "",
    pressure: "",
    duration_minutes: "",
    notes: "",
  });

  const handleCreate = () => {
    createBatch.mutate({
      sterilization_method: form.sterilization_method,
      operator_name: form.operator_name || undefined,
      temperature: form.temperature ? parseFloat(form.temperature) : undefined,
      pressure: form.pressure ? parseFloat(form.pressure) : undefined,
      duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : undefined,
      notes: form.notes || undefined,
      status: "pending",
    }, {
      onSuccess: () => {
        setOpen(false);
        setForm({ sterilization_method: "autoclave", operator_name: "", temperature: "", pressure: "", duration_minutes: "", notes: "" });
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              <div>
                {loadingStats ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{stats?.totalItems ?? 0}</p>}
                <p className="text-sm text-muted-foreground">Total Item Steril</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-success" />
              <div>
                {loadingStats ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{stats?.todayBatches ?? 0}</p>}
                <p className="text-sm text-muted-foreground">Batch Hari Ini</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-info" />
              <div>
                {loadingStats ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{stats?.successRate ?? 0}%</p>}
                <p className="text-sm text-muted-foreground">Tingkat Keberhasilan</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-warning" />
              <div>
                {loadingStats ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{stats?.pending ?? 0}</p>}
                <p className="text-sm text-muted-foreground">Menunggu Proses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Batch List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Batch Sterilisasi Terkini</CardTitle>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Batch Baru
          </Button>
        </CardHeader>
        <CardContent>
          {loadingBatches ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>
          ) : batches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Belum ada batch sterilisasi</div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Batch</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Metode</TableHead>
                    <TableHead>Operator</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((batch) => {
                    const s = STATUS_MAP[batch.status] || { label: batch.status, color: "bg-muted" };
                    return (
                      <TableRow key={batch.id}>
                        <TableCell className="font-mono text-sm">{batch.batch_number}</TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(batch.batch_date), "dd MMM yyyy HH:mm", { locale: id })}
                        </TableCell>
                        <TableCell>{METHOD_LABELS[batch.sterilization_method] || batch.sterilization_method}</TableCell>
                        <TableCell>{batch.operator_name || "-"}</TableCell>
                        <TableCell>{batch.item_count}</TableCell>
                        <TableCell>
                          <Badge className={s.color}>{s.label}</Badge>
                        </TableCell>
                        <TableCell>
                          {batch.status === "pending" && (
                            <Button
                              variant="outline" size="sm"
                              onClick={() => updateBatch.mutate({ id: batch.id, status: "in_process" })}
                              disabled={updateBatch.isPending}
                            >
                              {updateBatch.isPending ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Mulai Proses"}
                            </Button>
                          )}
                          {batch.status === "in_process" && (
                            <Button
                              size="sm"
                              onClick={() => updateBatch.mutate({ id: batch.id, status: "completed" })}
                              disabled={updateBatch.isPending}
                            >
                              Selesai
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

      {/* Create Batch Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Batch Sterilisasi Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Metode Sterilisasi</Label>
              <Select value={form.sterilization_method} onValueChange={v => setForm(f => ({ ...f, sterilization_method: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="autoclave">Autoclave</SelectItem>
                  <SelectItem value="ethylene_oxide">Ethylene Oxide</SelectItem>
                  <SelectItem value="dry_heat">Dry Heat</SelectItem>
                  <SelectItem value="plasma">Plasma</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Operator</Label>
              <Input placeholder="Nama operator" value={form.operator_name} onChange={e => setForm(f => ({ ...f, operator_name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Suhu (°C)</Label>
                <Input type="number" value={form.temperature} onChange={e => setForm(f => ({ ...f, temperature: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Tekanan (bar)</Label>
                <Input type="number" value={form.pressure} onChange={e => setForm(f => ({ ...f, pressure: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Durasi (mnt)</Label>
                <Input type="number" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Catatan</Label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleCreate} disabled={createBatch.isPending}>
              {createBatch.isPending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
              Buat Batch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

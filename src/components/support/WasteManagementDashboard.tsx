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
import { Trash2, AlertTriangle, Truck, CheckCircle, Plus, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useWasteStats, useWasteRecords, useCreateWasteRecord, useUpdateWasteRecord } from "@/hooks/useSupportModules";

const WASTE_TYPES: Record<string, string> = {
  medical: "Medis", b3: "B3 / Infeksius", domestic: "Domestik",
  sharps: "Benda Tajam", pharmaceutical: "Farmasi", pathological: "Patologi",
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  collected:   { label: "Dikumpulkan",  color: "bg-warning/10 text-warning" },
  stored:      { label: "Disimpan",     color: "bg-info/10 text-info" },
  transported: { label: "Diangkut",     color: "bg-orange-100 text-orange-600" },
  disposed:    { label: "Dibuang",      color: "bg-success/10 text-success" },
};

const EMPTY_FORM = {
  waste_type: "medical", waste_category: "", source_department: "",
  weight_kg: "", volume_liter: "", container_type: "",
  disposal_method: "", disposal_vendor: "", manifest_number: "", officer_name: "", notes: "",
};

export default function WasteManagementDashboard() {
  const { data: stats, isLoading: loadingStats } = useWasteStats();
  const { data: records = [], isLoading: loadingRecords } = useWasteRecords();
  const createRecord = useCreateWasteRecord();
  const updateRecord = useUpdateWasteRecord();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const f = (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleCreate = () => {
    createRecord.mutate({
      waste_type: form.waste_type,
      waste_category: form.waste_category || undefined,
      source_department: form.source_department || undefined,
      weight_kg: parseFloat(form.weight_kg) || 0,
      volume_liter: form.volume_liter ? parseFloat(form.volume_liter) : undefined,
      container_type: form.container_type || undefined,
      disposal_method: form.disposal_method || undefined,
      disposal_vendor: form.disposal_vendor || undefined,
      manifest_number: form.manifest_number || undefined,
      officer_name: form.officer_name || undefined,
      notes: form.notes || undefined,
      status: "collected",
    }, { onSuccess: () => { setOpen(false); setForm(EMPTY_FORM); } });
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Trash2 className="h-8 w-8 text-warning" />
              <div>
                {loadingStats ? <Skeleton className="h-8 w-20" /> : <p className="text-2xl font-bold">{stats?.todayWeight?.toFixed(1) ?? 0} kg</p>}
                <p className="text-sm text-muted-foreground">Limbah Hari Ini</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                {loadingStats ? <Skeleton className="h-8 w-20" /> : <p className="text-2xl font-bold">{stats?.b3Weight?.toFixed(1) ?? 0} kg</p>}
                <p className="text-sm text-muted-foreground">Limbah B3</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Truck className="h-8 w-8 text-info" />
              <div>
                {loadingStats ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{stats?.pendingPickup ?? 0}</p>}
                <p className="text-sm text-muted-foreground">Menunggu Pengangkutan</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-success" />
              <div>
                {loadingStats ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{stats?.compliance ?? 100}%</p>}
                <p className="text-sm text-muted-foreground">Kepatuhan</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Records */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Log Pengumpulan Limbah</CardTitle>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Catat Limbah
          </Button>
        </CardHeader>
        <CardContent>
          {loadingRecords ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>
          ) : records.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Belum ada catatan limbah hari ini</div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Sumber</TableHead>
                    <TableHead>Berat</TableHead>
                    <TableHead>No. Manifes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((rec) => {
                    const s = STATUS_MAP[rec.status] || { label: rec.status, color: "bg-muted" };
                    const nextStatus: Record<string, string> = { collected: "stored", stored: "transported", transported: "disposed" };
                    const nextLabel: Record<string, string> = { collected: "Simpan", stored: "Angkut", transported: "Buang" };
                    return (
                      <TableRow key={rec.id}>
                        <TableCell className="text-sm">{format(new Date(rec.record_date), "dd MMM HH:mm", { locale: id })}</TableCell>
                        <TableCell><Badge variant="outline">{WASTE_TYPES[rec.waste_type] || rec.waste_type}</Badge></TableCell>
                        <TableCell>{rec.source_department || "-"}</TableCell>
                        <TableCell>{rec.weight_kg} kg</TableCell>
                        <TableCell className="font-mono text-xs">{rec.manifest_number || "-"}</TableCell>
                        <TableCell><Badge className={s.color}>{s.label}</Badge></TableCell>
                        <TableCell>
                          {nextStatus[rec.status] && (
                            <Button variant="outline" size="sm"
                              onClick={() => updateRecord.mutate({ id: rec.id, status: nextStatus[rec.status] })}
                              disabled={updateRecord.isPending}>
                              {updateRecord.isPending ? <RefreshCw className="h-3 w-3 animate-spin" /> : nextLabel[rec.status]}
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

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Catat Limbah Baru</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Jenis Limbah</Label>
              <Select value={form.waste_type} onValueChange={v => setForm(p => ({ ...p, waste_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(WASTE_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sumber Departemen</Label>
              <Input placeholder="Cth: IGD" value={form.source_department} onChange={f("source_department")} />
            </div>
            <div className="space-y-2">
              <Label>Berat (kg) *</Label>
              <Input type="number" step="0.001" value={form.weight_kg} onChange={f("weight_kg")} />
            </div>
            <div className="space-y-2">
              <Label>Volume (liter)</Label>
              <Input type="number" step="0.001" value={form.volume_liter} onChange={f("volume_liter")} />
            </div>
            <div className="space-y-2">
              <Label>Jenis Wadah</Label>
              <Input placeholder="Cth: kantong kuning" value={form.container_type} onChange={f("container_type")} />
            </div>
            <div className="space-y-2">
              <Label>Metode Pembuangan</Label>
              <Input placeholder="Cth: incinerasi" value={form.disposal_method} onChange={f("disposal_method")} />
            </div>
            <div className="space-y-2">
              <Label>Vendor Pembuangan</Label>
              <Input value={form.disposal_vendor} onChange={f("disposal_vendor")} />
            </div>
            <div className="space-y-2">
              <Label>No. Manifes</Label>
              <Input value={form.manifest_number} onChange={f("manifest_number")} />
            </div>
            <div className="space-y-2">
              <Label>Petugas</Label>
              <Input value={form.officer_name} onChange={f("officer_name")} />
            </div>
            <div className="space-y-2">
              <Label>Catatan</Label>
              <Input value={form.notes} onChange={f("notes")} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleCreate} disabled={createRecord.isPending || !form.weight_kg}>
              {createRecord.isPending && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

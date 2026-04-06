import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Shirt, Droplets, Package, AlertCircle, Plus, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useLinenStats, useLinenBatches, useLinenInventory, useCreateLinenBatch, useUpdateLinenBatch } from "@/hooks/useSupportModules";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  collected:    { label: "Dikumpulkan", color: "bg-warning/10 text-warning" },
  in_laundry:   { label: "Dicuci",      color: "bg-info/10 text-info" },
  clean:        { label: "Bersih",      color: "bg-success/10 text-success" },
  distributed:  { label: "Didistribusi", color: "bg-muted text-muted-foreground" },
};

export default function LinenLaundryDashboard() {
  const { data: stats, isLoading: loadingStats } = useLinenStats();
  const { data: batches = [], isLoading: loadingBatches } = useLinenBatches();
  const { data: inventory = [] } = useLinenInventory();
  const createBatch = useCreateLinenBatch();
  const updateBatch = useUpdateLinenBatch();

  const [tab, setTab] = useState<"batches" | "inventory">("batches");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ department_origin: "", total_items: "", weight_kg: "", operator_name: "", notes: "" });

  const handleCreate = () => {
    createBatch.mutate({
      department_origin: form.department_origin || undefined,
      total_items: form.total_items ? parseInt(form.total_items) : 0,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : undefined,
      operator_name: form.operator_name || undefined,
      notes: form.notes || undefined,
      status: "collected",
    }, {
      onSuccess: () => {
        setOpen(false);
        setForm({ department_origin: "", total_items: "", weight_kg: "", operator_name: "", notes: "" });
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
              <Shirt className="h-8 w-8 text-primary" />
              <div>
                {loadingStats ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{(stats?.totalLinen ?? 0).toLocaleString()}</p>}
                <p className="text-sm text-muted-foreground">Total Linen</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Droplets className="h-8 w-8 text-info" />
              <div>
                {loadingStats ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{stats?.inLaundry ?? 0}</p>}
                <p className="text-sm text-muted-foreground">Dalam Pencucian</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-success" />
              <div>
                {loadingStats ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{(stats?.cleanLinen ?? 0).toLocaleString()}</p>}
                <p className="text-sm text-muted-foreground">Bersih & Siap</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div>
                {loadingStats ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{stats?.damaged ?? 0}</p>}
                <p className="text-sm text-muted-foreground">Perlu Penggantian</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button variant={tab === "batches" ? "default" : "outline"} size="sm" onClick={() => setTab("batches")}>Batch Laundry</Button>
        <Button variant={tab === "inventory" ? "default" : "outline"} size="sm" onClick={() => setTab("inventory")}>Inventaris Linen</Button>
      </div>

      {/* Batches */}
      {tab === "batches" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Batch Laundry Terkini</CardTitle>
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Batch Baru
            </Button>
          </CardHeader>
          <CardContent>
            {loadingBatches ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>
            ) : batches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Belum ada batch laundry</div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No. Batch</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Asal Ruangan</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Berat (kg)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.map((batch) => {
                      const s = STATUS_MAP[batch.status] || { label: batch.status, color: "bg-muted" };
                      const nextStatus: Record<string, string> = { collected: "in_laundry", in_laundry: "clean", clean: "distributed" };
                      const nextLabel: Record<string, string> = { collected: "Mulai Cuci", in_laundry: "Selesai Cuci", clean: "Distribusi" };
                      return (
                        <TableRow key={batch.id}>
                          <TableCell className="font-mono text-sm">{batch.batch_number}</TableCell>
                          <TableCell className="text-sm">{format(new Date(batch.batch_date), "dd MMM yyyy HH:mm", { locale: id })}</TableCell>
                          <TableCell>{batch.department_origin || "-"}</TableCell>
                          <TableCell>{batch.total_items}</TableCell>
                          <TableCell>{batch.weight_kg ? `${batch.weight_kg} kg` : "-"}</TableCell>
                          <TableCell><Badge className={s.color}>{s.label}</Badge></TableCell>
                          <TableCell>
                            {nextStatus[batch.status] && (
                              <Button variant="outline" size="sm"
                                onClick={() => updateBatch.mutate({ id: batch.id, status: nextStatus[batch.status] })}
                                disabled={updateBatch.isPending}>
                                {updateBatch.isPending ? <RefreshCw className="h-3 w-3 animate-spin" /> : nextLabel[batch.status]}
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

      {/* Inventory */}
      {tab === "inventory" && (
        <Card>
          <CardHeader><CardTitle>Inventaris Linen</CardTitle></CardHeader>
          <CardContent>
            {inventory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Belum ada data inventaris linen</div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Item</TableHead>
                      <TableHead>Departemen</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Bersih</TableHead>
                      <TableHead>Dicuci</TableHead>
                      <TableHead>Rusak</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.item_name}</TableCell>
                        <TableCell>{item.department_name || "-"}</TableCell>
                        <TableCell>{item.total_qty}</TableCell>
                        <TableCell className="text-success">{item.clean_qty}</TableCell>
                        <TableCell className="text-info">{item.in_laundry_qty}</TableCell>
                        <TableCell className="text-destructive">{item.damaged_qty}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Batch Laundry Baru</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Asal Ruangan / Departemen</Label>
              <Input placeholder="Cth: Rawat Inap Lt.2" value={form.department_origin} onChange={e => setForm(f => ({ ...f, department_origin: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Jumlah Item</Label>
                <Input type="number" value={form.total_items} onChange={e => setForm(f => ({ ...f, total_items: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Berat (kg)</Label>
                <Input type="number" step="0.1" value={form.weight_kg} onChange={e => setForm(f => ({ ...f, weight_kg: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Operator</Label>
              <Input placeholder="Nama operator" value={form.operator_name} onChange={e => setForm(f => ({ ...f, operator_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Catatan</Label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleCreate} disabled={createBatch.isPending}>
              {createBatch.isPending && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              Buat Batch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

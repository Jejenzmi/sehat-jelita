/**
 * SIMRS ZEN - SISRUTE (Sistem Informasi Rujukan Terintegrasi)
 * Dashboard manajemen rujukan masuk & keluar
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
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
import {
  ArrowDownToLine, ArrowUpFromLine, Clock, CheckCircle,
  Plus, RefreshCw, Search, AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const API = import.meta.env.VITE_API_URL || "/api";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return (json.data ?? json) as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReferralStats {
  total: number; pending: number; in_transfer: number; today: number;
  by_type: { inbound?: number; outbound?: number };
}

interface Referral {
  id: string;
  referral_number: string;
  referral_type: "inbound" | "outbound";
  urgency_level: "biasa" | "segera" | "darurat";
  status: string;
  reason: string;
  referring_facility?: string | null;
  destination_facility?: string | null;
  referring_doctor?: string | null;
  destination_doctor?: string | null;
  diagnosis_description?: string | null;
  notes?: string | null;
  created_at: string;
  patients: { id: string; full_name: string; medical_record_number: string };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const URGENCY: Record<string, { label: string; color: string }> = {
  darurat: { label: "Darurat",  color: "bg-destructive/10 text-destructive" },
  segera:  { label: "Segera",   color: "bg-warning/10 text-warning" },
  biasa:   { label: "Biasa",    color: "bg-muted text-muted-foreground" },
};

const STATUS: Record<string, { label: string; color: string }> = {
  pending:     { label: "Menunggu",    color: "bg-yellow-100 text-yellow-700" },
  accepted:    { label: "Diterima",    color: "bg-blue-100 text-blue-700" },
  in_transfer: { label: "Dalam Perjalanan", color: "bg-orange-100 text-orange-700" },
  arrived:     { label: "Tiba",        color: "bg-success/10 text-success" },
  rejected:    { label: "Ditolak",     color: "bg-destructive/10 text-destructive" },
  cancelled:   { label: "Dibatalkan",  color: "bg-muted text-muted-foreground" },
};

const NEXT_STATUS: Record<string, { next: string; label: string }> = {
  pending:     { next: "accepted",    label: "Terima" },
  accepted:    { next: "in_transfer", label: "Dalam Perjalanan" },
  in_transfer: { next: "arrived",     label: "Sudah Tiba" },
};

const EMPTY_FORM = {
  patient_id: "", referral_type: "outbound", urgency_level: "biasa",
  reason: "", diagnosis_description: "", referring_facility: "",
  destination_facility: "", referring_doctor: "", destination_doctor: "", notes: "",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Sisrute() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"all" | "inbound" | "outbound">("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const f = (k: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));

  // Queries
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["sisrute-stats"],
    queryFn: () => apiFetch<ReferralStats>("/sisrute/stats"),
    refetchInterval: 60_000,
  });

  const { data: referrals = [], isLoading: loadingList, refetch } = useQuery({
    queryKey: ["sisrute", tab, search],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "30" });
      if (tab !== "all") params.set("referral_type", tab);
      if (search)        params.set("search", search);
      return apiFetch<Referral[]>(`/sisrute?${params}`);
    },
  });

  const { data: detail } = useQuery({
    queryKey: ["sisrute-detail", detailId],
    queryFn: () => detailId ? apiFetch<Referral>(`/sisrute/${detailId}`) : null,
    enabled: !!detailId,
  });

  // Mutations
  const createReferral = useMutation({
    mutationFn: (data: typeof EMPTY_FORM) => apiFetch("/sisrute", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sisrute"] });
      qc.invalidateQueries({ queryKey: ["sisrute-stats"] });
      toast({ title: "Rujukan berhasil dibuat" });
      setOpen(false);
      setForm(EMPTY_FORM);
    },
    onError: (e: Error) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch(`/sisrute/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sisrute"] });
      qc.invalidateQueries({ queryKey: ["sisrute-stats"] });
      qc.invalidateQueries({ queryKey: ["sisrute-detail"] });
      toast({ title: "Status rujukan diperbarui" });
    },
    onError: (e: Error) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SISRUTE</h1>
          <p className="text-muted-foreground">Sistem Informasi Rujukan Terintegrasi</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Buat Rujukan
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <Clock className="h-8 w-8 text-warning" />, value: stats?.pending ?? 0, label: "Menunggu" },
          { icon: <ArrowDownToLine className="h-8 w-8 text-info" />, value: stats?.by_type?.inbound ?? 0, label: "Rujukan Masuk" },
          { icon: <ArrowUpFromLine className="h-8 w-8 text-primary" />, value: stats?.by_type?.outbound ?? 0, label: "Rujukan Keluar" },
          { icon: <CheckCircle className="h-8 w-8 text-success" />, value: stats?.today ?? 0, label: "Hari Ini" },
        ].map(({ icon, value, label }, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                {icon}
                <div>
                  {loadingStats ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold">{value}</p>}
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="flex gap-2">
              {(["all", "inbound", "outbound"] as const).map(t => (
                <Button key={t} size="sm" variant={tab === t ? "default" : "outline"} onClick={() => setTab(t)}>
                  {t === "all" ? "Semua" : t === "inbound" ? "Masuk" : "Keluar"}
                </Button>
              ))}
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Cari pasien / fasilitas..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingList ? (
            <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12" />)}</div>
          ) : referrals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Tidak ada data rujukan</div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Rujukan</TableHead>
                    <TableHead>Pasien</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Asal / Tujuan</TableHead>
                    <TableHead>Urgensi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map(ref => {
                    const urg = URGENCY[ref.urgency_level] ?? URGENCY.biasa;
                    const st  = STATUS[ref.status] ?? { label: ref.status, color: "bg-muted" };
                    const nx  = NEXT_STATUS[ref.status];
                    return (
                      <TableRow key={ref.id} className="cursor-pointer hover:bg-muted/40">
                        <TableCell className="font-mono text-xs" onClick={() => setDetailId(ref.id)}>
                          {ref.referral_number}
                        </TableCell>
                        <TableCell onClick={() => setDetailId(ref.id)}>
                          <p className="font-medium text-sm">{ref.patients.full_name}</p>
                          <p className="text-xs text-muted-foreground">{ref.patients.medical_record_number}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {ref.referral_type === "inbound"
                              ? <><ArrowDownToLine className="h-3 w-3 mr-1 inline" />Masuk</>
                              : <><ArrowUpFromLine className="h-3 w-3 mr-1 inline" />Keluar</>}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm max-w-[180px] truncate">
                          {ref.referral_type === "inbound"
                            ? ref.referring_facility || "-"
                            : ref.destination_facility || "-"}
                        </TableCell>
                        <TableCell><Badge className={urg.color}>{urg.label}</Badge></TableCell>
                        <TableCell><Badge className={st.color}>{st.label}</Badge></TableCell>
                        <TableCell>
                          {nx && (
                            <Button
                              variant="outline" size="sm"
                              onClick={() => updateStatus.mutate({ id: ref.id, status: nx.next })}
                              disabled={updateStatus.isPending}
                            >
                              {updateStatus.isPending ? <RefreshCw className="h-3 w-3 animate-spin" /> : nx.label}
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

      {/* Detail Dialog */}
      <Dialog open={!!detailId} onOpenChange={o => !o && setDetailId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Rujukan</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs text-muted-foreground">No. Rujukan</Label><p className="font-mono">{detail.referral_number}</p></div>
                <div><Label className="text-xs text-muted-foreground">Urgensi</Label><Badge className={URGENCY[detail.urgency_level]?.color}>{URGENCY[detail.urgency_level]?.label}</Badge></div>
                <div><Label className="text-xs text-muted-foreground">Pasien</Label><p>{detail.patients.full_name}</p></div>
                <div><Label className="text-xs text-muted-foreground">No. RM</Label><p className="font-mono">{detail.patients.medical_record_number}</p></div>
                <div><Label className="text-xs text-muted-foreground">Asal Fasilitas</Label><p>{detail.referring_facility || "-"}</p></div>
                <div><Label className="text-xs text-muted-foreground">Tujuan Fasilitas</Label><p>{detail.destination_facility || "-"}</p></div>
                <div><Label className="text-xs text-muted-foreground">Dokter Pengirim</Label><p>{detail.referring_doctor || "-"}</p></div>
                <div><Label className="text-xs text-muted-foreground">Dokter Tujuan</Label><p>{detail.destination_doctor || "-"}</p></div>
                <div className="col-span-2"><Label className="text-xs text-muted-foreground">Diagnosis</Label><p>{detail.diagnosis_description || "-"}</p></div>
                <div className="col-span-2"><Label className="text-xs text-muted-foreground">Alasan Rujukan</Label><p>{detail.reason}</p></div>
                {detail.notes && <div className="col-span-2"><Label className="text-xs text-muted-foreground">Catatan</Label><p>{detail.notes}</p></div>}
                <div><Label className="text-xs text-muted-foreground">Dibuat</Label><p>{format(new Date(detail.created_at), "dd MMM yyyy HH:mm", { locale: id })}</p></div>
                <div><Label className="text-xs text-muted-foreground">Status</Label><Badge className={STATUS[detail.status]?.color}>{STATUS[detail.status]?.label}</Badge></div>
              </div>
              {NEXT_STATUS[detail.status] && (
                <div className="pt-2 flex justify-end">
                  <Button
                    onClick={() => updateStatus.mutate({ id: detail.id, status: NEXT_STATUS[detail.status].next })}
                    disabled={updateStatus.isPending}
                  >
                    {updateStatus.isPending && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                    {NEXT_STATUS[detail.status].label}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Buat Rujukan Baru</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tipe Rujukan</Label>
                <Select value={form.referral_type} onValueChange={v => setForm(p => ({ ...p, referral_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outbound">Keluar (ke RS lain)</SelectItem>
                    <SelectItem value="inbound">Masuk (dari RS lain)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Urgensi</Label>
                <Select value={form.urgency_level} onValueChange={v => setForm(p => ({ ...p, urgency_level: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="biasa">Biasa</SelectItem>
                    <SelectItem value="segera">Segera</SelectItem>
                    <SelectItem value="darurat">Darurat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>ID Pasien (UUID) *</Label>
              <Input placeholder="UUID pasien..." value={form.patient_id} onChange={f("patient_id")} />
            </div>
            <div className="space-y-2">
              <Label>Alasan Rujukan *</Label>
              <Textarea placeholder="Jelaskan alasan rujukan..." value={form.reason} onChange={f("reason")} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Asal Fasilitas</Label>
                <Input placeholder="Nama RS asal" value={form.referring_facility} onChange={f("referring_facility")} />
              </div>
              <div className="space-y-2">
                <Label>Tujuan Fasilitas</Label>
                <Input placeholder="Nama RS tujuan" value={form.destination_facility} onChange={f("destination_facility")} />
              </div>
              <div className="space-y-2">
                <Label>Dokter Pengirim</Label>
                <Input value={form.referring_doctor} onChange={f("referring_doctor")} />
              </div>
              <div className="space-y-2">
                <Label>Dokter Tujuan</Label>
                <Input value={form.destination_doctor} onChange={f("destination_doctor")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Diagnosis</Label>
              <Input placeholder="Keterangan diagnosis" value={form.diagnosis_description} onChange={f("diagnosis_description")} />
            </div>
            <div className="space-y-2">
              <Label>Catatan Tambahan</Label>
              <Textarea value={form.notes} onChange={f("notes")} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button
              onClick={() => createReferral.mutate(form)}
              disabled={createReferral.isPending || !form.reason || !form.patient_id}
            >
              {createReferral.isPending && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              Buat Rujukan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

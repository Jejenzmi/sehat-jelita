/**
 * SIMRS ZEN - Sertifikasi & Pelatihan Staf
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
import { Award, Calendar, AlertTriangle, GraduationCap, Plus, RefreshCw, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

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

interface CertStats { total: number; expiring_soon: number; expired: number; mandatory: number; by_type: Record<string, number> }
interface TrainingStats { total_this_year: number; upcoming: number; by_type: Record<string, number> }

interface Cert {
  id: string; cert_name: string; cert_number?: string | null;
  cert_type: string; issuing_authority?: string | null;
  issue_date?: string | null; expiry_date?: string | null;
  is_mandatory: boolean; days_until_expiry?: number | null;
  employees: { full_name: string; employee_number: string; job_title: string };
}

interface Training {
  id: string; training_name: string; training_type: string;
  organizer?: string | null; venue?: string | null;
  start_date: string; end_date?: string | null;
  duration_hours?: number | null; is_mandatory: boolean;
  employees?: { full_name: string } | null;
  departments?: { department_name: string } | null;
}

const CERT_TYPES: Record<string, string> = { clinical: "Klinis", general: "Umum", technical: "Teknis", management: "Manajemen", other: "Lainnya" };
const TRAIN_TYPES: Record<string, string> = { internal: "Internal", external: "Eksternal", online: "Online", seminar: "Seminar", workshop: "Workshop" };

const EMPTY_CERT = { employee_id: "", cert_name: "", cert_number: "", issuing_authority: "", cert_type: "general", issue_date: "", expiry_date: "", is_mandatory: false, notes: "" };
const EMPTY_TRAIN = { training_name: "", training_type: "internal", organizer: "", venue: "", start_date: "", end_date: "", duration_hours: "", is_mandatory: false, description: "" };

function expiryBadge(days: number | null | undefined) {
  if (days === null || days === undefined) return null;
  if (days < 0)  return <Badge className="bg-destructive/10 text-destructive">Kedaluwarsa</Badge>;
  if (days <= 30) return <Badge className="bg-warning/10 text-warning">≤30 hari</Badge>;
  return <Badge className="bg-success/10 text-success">Aktif</Badge>;
}

export default function StaffCertifications() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"certs" | "trainings">("certs");
  const [openCert, setOpenCert] = useState(false);
  const [openTrain, setOpenTrain] = useState(false);
  const [certForm, setCertForm] = useState(EMPTY_CERT);
  const [trainForm, setTrainForm] = useState(EMPTY_TRAIN);

  // ── Certifications ─────────────────────────────────────────────────────────

  const { data: certStats, isLoading: loadingCertStats } = useQuery({
    queryKey: ["cert-stats"],
    queryFn: () => apiFetch<CertStats>("/staff-certifications/certifications/stats"),
    refetchInterval: 120_000,
  });

  const { data: certs = [], isLoading: loadingCerts } = useQuery({
    queryKey: ["certs"],
    queryFn: () => apiFetch<Cert[]>("/staff-certifications/certifications?limit=50"),
    enabled: tab === "certs",
  });

  const createCert = useMutation({
    mutationFn: (data: typeof EMPTY_CERT) => apiFetch("/staff-certifications/certifications", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["certs"] }); qc.invalidateQueries({ queryKey: ["cert-stats"] }); toast({ title: "Sertifikasi ditambahkan" }); setOpenCert(false); setCertForm(EMPTY_CERT); },
    onError: (e: Error) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  // ── Trainings ──────────────────────────────────────────────────────────────

  const { data: trainStats, isLoading: loadingTrainStats } = useQuery({
    queryKey: ["training-stats"],
    queryFn: () => apiFetch<TrainingStats>("/staff-certifications/trainings/stats"),
    refetchInterval: 120_000,
  });

  const { data: trainings = [], isLoading: loadingTrainings } = useQuery({
    queryKey: ["trainings"],
    queryFn: () => apiFetch<Training[]>("/staff-certifications/trainings?limit=50"),
    enabled: tab === "trainings",
  });

  const createTraining = useMutation({
    mutationFn: (data: typeof EMPTY_TRAIN) => apiFetch("/staff-certifications/trainings", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["trainings"] }); qc.invalidateQueries({ queryKey: ["training-stats"] }); toast({ title: "Pelatihan ditambahkan" }); setOpenTrain(false); setTrainForm(EMPTY_TRAIN); },
    onError: (e: Error) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sertifikasi & Pelatihan</h1>
          <p className="text-muted-foreground">Manajemen kompetensi dan pengembangan staf</p>
        </div>
        <Button size="sm" onClick={() => tab === "certs" ? setOpenCert(true) : setOpenTrain(true)}>
          <Plus className="h-4 w-4 mr-2" />{tab === "certs" ? "Tambah Sertifikasi" : "Tambah Pelatihan"}
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(tab === "certs" ? [
          { icon: <Award className="h-8 w-8 text-primary" />, value: certStats?.total ?? 0, label: "Total Sertifikasi", loading: loadingCertStats },
          { icon: <AlertTriangle className="h-8 w-8 text-warning" />, value: certStats?.expiring_soon ?? 0, label: "Segera Kedaluwarsa", loading: loadingCertStats },
          { icon: <AlertTriangle className="h-8 w-8 text-destructive" />, value: certStats?.expired ?? 0, label: "Sudah Kedaluwarsa", loading: loadingCertStats },
          { icon: <CheckCircle className="h-8 w-8 text-info" />, value: certStats?.mandatory ?? 0, label: "Wajib", loading: loadingCertStats },
        ] : [
          { icon: <GraduationCap className="h-8 w-8 text-primary" />, value: trainStats?.total_this_year ?? 0, label: "Tahun Ini", loading: loadingTrainStats },
          { icon: <Calendar className="h-8 w-8 text-info" />, value: trainStats?.upcoming ?? 0, label: "Akan Datang", loading: loadingTrainStats },
          { icon: <GraduationCap className="h-8 w-8 text-success" />, value: trainStats?.by_type?.internal ?? 0, label: "Internal", loading: loadingTrainStats },
          { icon: <GraduationCap className="h-8 w-8 text-warning" />, value: trainStats?.by_type?.external ?? 0, label: "Eksternal", loading: loadingTrainStats },
        ]).map(({ icon, value, label, loading }, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                {icon}
                <div>
                  {loading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold">{value}</p>}
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tab switch */}
      <div className="flex gap-2">
        <Button size="sm" variant={tab === "certs" ? "default" : "outline"} onClick={() => setTab("certs")}>
          <Award className="h-4 w-4 mr-2" /> Sertifikasi
        </Button>
        <Button size="sm" variant={tab === "trainings" ? "default" : "outline"} onClick={() => setTab("trainings")}>
          <GraduationCap className="h-4 w-4 mr-2" /> Pelatihan
        </Button>
      </div>

      {/* Certifications table */}
      {tab === "certs" && (
        <Card>
          <CardHeader><CardTitle>Daftar Sertifikasi Staf</CardTitle></CardHeader>
          <CardContent>
            {loadingCerts ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>
            ) : certs.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Belum ada data sertifikasi</p>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Sertifikasi</TableHead>
                      <TableHead>Staf</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Penerbit</TableHead>
                      <TableHead>Berlaku Hingga</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certs.map(c => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <p className="font-medium">{c.cert_name}</p>
                          {c.cert_number && <p className="text-xs text-muted-foreground font-mono">{c.cert_number}</p>}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{c.employees.full_name}</p>
                          <p className="text-xs text-muted-foreground">{c.employees.job_title}</p>
                        </TableCell>
                        <TableCell><Badge variant="outline">{CERT_TYPES[c.cert_type] || c.cert_type}</Badge></TableCell>
                        <TableCell className="text-sm">{c.issuing_authority || "-"}</TableCell>
                        <TableCell className="text-sm">
                          {c.expiry_date ? format(new Date(c.expiry_date), "dd MMM yyyy", { locale: localeId }) : "-"}
                        </TableCell>
                        <TableCell>{expiryBadge(c.days_until_expiry)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Trainings table */}
      {tab === "trainings" && (
        <Card>
          <CardHeader><CardTitle>Daftar Pelatihan</CardTitle></CardHeader>
          <CardContent>
            {loadingTrainings ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>
            ) : trainings.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Belum ada data pelatihan</p>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Pelatihan</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Penyelenggara</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Durasi</TableHead>
                      <TableHead>Wajib</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trainings.map(t => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.training_name}</TableCell>
                        <TableCell><Badge variant="outline">{TRAIN_TYPES[t.training_type] || t.training_type}</Badge></TableCell>
                        <TableCell className="text-sm">{t.organizer || "-"}</TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(t.start_date), "dd MMM yyyy", { locale: localeId })}
                          {t.end_date && ` – ${format(new Date(t.end_date), "dd MMM", { locale: localeId })}`}
                        </TableCell>
                        <TableCell className="text-sm">{t.duration_hours ? `${t.duration_hours} jam` : "-"}</TableCell>
                        <TableCell>{t.is_mandatory ? <Badge className="bg-warning/10 text-warning">Wajib</Badge> : <Badge variant="outline">Opsional</Badge>}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Cert Dialog */}
      <Dialog open={openCert} onOpenChange={setOpenCert}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Tambah Sertifikasi</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>ID Karyawan (UUID) *</Label><Input value={certForm.employee_id} onChange={e => setCertForm(p => ({ ...p, employee_id: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Nama Sertifikasi *</Label><Input value={certForm.cert_name} onChange={e => setCertForm(p => ({ ...p, cert_name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Tipe</Label>
                <Select value={certForm.cert_type} onValueChange={v => setCertForm(p => ({ ...p, cert_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(CERT_TYPES).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>No. Sertifikat</Label><Input value={certForm.cert_number} onChange={e => setCertForm(p => ({ ...p, cert_number: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Tanggal Terbit</Label><Input type="datetime-local" value={certForm.issue_date} onChange={e => setCertForm(p => ({ ...p, issue_date: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Tanggal Kedaluwarsa</Label><Input type="datetime-local" value={certForm.expiry_date} onChange={e => setCertForm(p => ({ ...p, expiry_date: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>Penerbit</Label><Input value={certForm.issuing_authority} onChange={e => setCertForm(p => ({ ...p, issuing_authority: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCert(false)}>Batal</Button>
            <Button onClick={() => createCert.mutate(certForm)} disabled={createCert.isPending || !certForm.cert_name || !certForm.employee_id}>
              {createCert.isPending && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />} Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Training Dialog */}
      <Dialog open={openTrain} onOpenChange={setOpenTrain}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Tambah Pelatihan</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Nama Pelatihan *</Label><Input value={trainForm.training_name} onChange={e => setTrainForm(p => ({ ...p, training_name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Tipe</Label>
                <Select value={trainForm.training_type} onValueChange={v => setTrainForm(p => ({ ...p, training_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(TRAIN_TYPES).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Durasi (jam)</Label><Input type="number" value={trainForm.duration_hours} onChange={e => setTrainForm(p => ({ ...p, duration_hours: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Tanggal Mulai *</Label><Input type="datetime-local" value={trainForm.start_date} onChange={e => setTrainForm(p => ({ ...p, start_date: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Tanggal Selesai</Label><Input type="datetime-local" value={trainForm.end_date} onChange={e => setTrainForm(p => ({ ...p, end_date: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>Penyelenggara</Label><Input value={trainForm.organizer} onChange={e => setTrainForm(p => ({ ...p, organizer: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Lokasi</Label><Input value={trainForm.venue} onChange={e => setTrainForm(p => ({ ...p, venue: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Deskripsi</Label><Textarea value={trainForm.description} onChange={e => setTrainForm(p => ({ ...p, description: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenTrain(false)}>Batal</Button>
            <Button onClick={() => createTraining.mutate(trainForm)} disabled={createTraining.isPending || !trainForm.training_name || !trainForm.start_date}>
              {createTraining.isPending && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />} Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

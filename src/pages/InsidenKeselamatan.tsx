import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, Plus, Search, Clock, CheckCircle, FileText } from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

const API = import.meta.env.VITE_API_URL || "/api";
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const severityLabel: Record<string, { label: string; color: string }> = {
  "1": { label: "Minimal", color: "bg-gray-100 text-gray-800" },
  "2": { label: "Minor", color: "bg-blue-100 text-blue-800" },
  "3": { label: "Moderate", color: "bg-yellow-100 text-yellow-800" },
  "4": { label: "Major", color: "bg-orange-100 text-orange-800" },
  "5": { label: "Sentinel", color: "bg-red-100 text-red-800" },
};

const statusBadge: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  reported: "secondary",
  under_investigation: "default",
  closed: "secondary",
  escalated: "destructive",
};

export default function InsidenKeselamatan() {
  const { toast } = useToast();
  const [incidents, setIncidents] = useState<Record<string, unknown>[]>([]);
  const [dashboard, setDashboard] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({
    incident_date: new Date().toISOString().slice(0, 16),
    incident_type: "KTD",
    incident_category: "medication_error",
    description: "",
    immediate_action: "",
    contributing_factors: "",
    severity_grade: "2",
    harm_to_patient: "tidak_ada",
    reporter_role: "",
  });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const [inc, dash] = await Promise.all([
        axios.get(`${API}/incidents?${params}`, { headers: authHeader() }),
        axios.get(`${API}/incidents/dashboard`, { headers: authHeader() }),
      ]);
      setIncidents(inc.data.data || []);
      setDashboard(dash.data.data || null);
    } catch {
      toast({ title: "Gagal memuat data insiden", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [search, statusFilter]);

  const handleSubmit = async () => {
    try {
      await axios.post(`${API}/incidents`, form, { headers: authHeader() });
      toast({ title: "Insiden berhasil dilaporkan" });
      setShowForm(false);
      fetchAll();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error || "Gagal menyimpan";
      toast({ title: msg, variant: "destructive" });
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await axios.patch(`${API}/incidents/${id}/status`, { status }, { headers: authHeader() });
      toast({ title: `Status diperbarui ke: ${status}` });
      fetchAll();
    } catch {
      toast({ title: "Gagal memperbarui status", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Insiden Keselamatan Pasien (IKP)</h1>
          <p className="text-muted-foreground">Pelaporan dan investigasi insiden klinis</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button variant="destructive"><Plus className="h-4 w-4 mr-2" />Laporkan Insiden</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Form Pelaporan Insiden Keselamatan Pasien</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tanggal & Waktu Insiden</Label>
                  <Input type="datetime-local" value={form.incident_date}
                    onChange={e => setForm(f => ({ ...f, incident_date: e.target.value }))} />
                </div>
                <div>
                  <Label>Tipe Insiden</Label>
                  <Select value={form.incident_type} onValueChange={v => setForm(f => ({ ...f, incident_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[["KTD", "Kejadian Tidak Diharapkan"], ["KNC", "Kejadian Nyaris Cedera"], ["KTC", "Kejadian Tidak Cedera"], ["KPCS", "Kondisi Potensi Cedera Serius"], ["sentinel", "Sentinel Event"]].map(([v, l]) => (
                        <SelectItem key={v} value={v}>{v} — {l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Kategori</Label>
                  <Select value={form.incident_category} onValueChange={v => setForm(f => ({ ...f, incident_category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["medication_error", "fall", "procedure", "diagnosis", "equipment", "other"].map(c => (
                        <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Grade Keparahan (1–5)</Label>
                  <Select value={form.severity_grade} onValueChange={v => setForm(f => ({ ...f, severity_grade: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(severityLabel).map(([v, { label }]) => (
                        <SelectItem key={v} value={v}>{v} – {label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Dampak ke Pasien</Label>
                  <Select value={form.harm_to_patient} onValueChange={v => setForm(f => ({ ...f, harm_to_patient: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[["tidak_ada", "Tidak Ada"], ["ringan", "Ringan"], ["sedang", "Sedang"], ["berat", "Berat"], ["kematian", "Kematian"]].map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Peran Pelapor</Label>
                  <Input placeholder="Perawat, Dokter, dll." value={form.reporter_role}
                    onChange={e => setForm(f => ({ ...f, reporter_role: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Deskripsi Insiden *</Label>
                <Textarea rows={3} value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <Label>Tindakan Segera</Label>
                <Textarea rows={2} value={form.immediate_action}
                  onChange={e => setForm(f => ({ ...f, immediate_action: e.target.value }))} />
              </div>
              <div>
                <Label>Faktor Kontribusi</Label>
                <Textarea rows={2} value={form.contributing_factors}
                  onChange={e => setForm(f => ({ ...f, contributing_factors: e.target.value }))} />
              </div>
              <Button onClick={handleSubmit} className="w-full">Kirim Laporan</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dashboard stats */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div><p className="text-2xl font-bold">{String(dashboard.total)}</p><p className="text-sm text-muted-foreground">Total Insiden</p></div>
          </CardContent></Card>
          <Card><CardContent className="pt-6 flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-500" />
            <div><p className="text-2xl font-bold">{String(dashboard.thisMonth)}</p><p className="text-sm text-muted-foreground">Bulan Ini</p></div>
          </CardContent></Card>
          <Card><CardContent className="pt-6 flex items-center gap-3">
            <Clock className="h-8 w-8 text-orange-500" />
            <div><p className="text-2xl font-bold">{String(dashboard.openCount)}</p><p className="text-sm text-muted-foreground">Masih Terbuka</p></div>
          </CardContent></Card>
          <Card><CardContent className="pt-6 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">
                {Array.isArray(dashboard.byStatus)
                  ? String((dashboard.byStatus as { status: string; _count: { id: number } }[]).find(s => s.status === "closed")?._count?.id ?? 0)
                  : "0"}
              </p>
              <p className="text-sm text-muted-foreground">Selesai</p>
            </div>
          </CardContent></Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Cari kode, deskripsi..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Semua Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {["draft", "reported", "under_investigation", "closed", "escalated"].map(s => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Incident list */}
      {loading ? (
        <div className="flex justify-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : (
        <div className="space-y-3">
          {incidents.map(inc => {
            const sv = severityLabel[String(inc.severity_grade)] || { label: String(inc.severity_grade), color: "" };
            return (
              <Card key={String(inc.id)} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedIncident(inc)}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-bold">{String(inc.incident_code || "—")}</span>
                        <Badge variant={statusBadge[String(inc.status)] || "outline"}>{String(inc.status).replace(/_/g, " ")}</Badge>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sv.color}`}>{sv.label}</span>
                        <Badge variant="outline">{String(inc.incident_type)}</Badge>
                      </div>
                      <p className="text-sm line-clamp-2">{String(inc.description)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(String(inc.incident_date)).toLocaleString("id-ID")} · Dilaporkan: {String(inc.reported_by || "—")}
                      </p>
                    </div>
                    {inc.status !== "closed" && (
                      <div className="flex gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                        {inc.status === "draft" && (
                          <Button size="sm" variant="outline" onClick={() => updateStatus(String(inc.id), "reported")}>Laporkan</Button>
                        )}
                        {inc.status === "reported" && (
                          <Button size="sm" variant="outline" onClick={() => updateStatus(String(inc.id), "under_investigation")}>Investigasi</Button>
                        )}
                        {inc.status === "under_investigation" && (
                          <Button size="sm" variant="outline" onClick={() => updateStatus(String(inc.id), "closed")}>Tutup</Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {!incidents.length && (
            <div className="text-center py-10 text-muted-foreground">
              <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Tidak ada insiden ditemukan</p>
            </div>
          )}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detail Insiden — {selectedIncident ? String(selectedIncident.incident_code || "—") : ""}
            </DialogTitle>
          </DialogHeader>
          {selectedIncident && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Tanggal", new Date(String(selectedIncident.incident_date)).toLocaleString("id-ID")],
                  ["Tipe", String(selectedIncident.incident_type)],
                  ["Kategori", String(selectedIncident.incident_category || "—")],
                  ["Keparahan", severityLabel[String(selectedIncident.severity_grade)]?.label || String(selectedIncident.severity_grade)],
                  ["Dampak", String(selectedIncident.harm_to_patient || "—").replace(/_/g, " ")],
                  ["Status", String(selectedIncident.status || "—").replace(/_/g, " ")],
                ].map(([label, value]) => (
                  <div key={label}><span className="text-muted-foreground">{label}: </span><span className="font-medium">{value}</span></div>
                ))}
              </div>
              <div><p className="font-medium text-sm">Deskripsi</p><p className="text-sm mt-1">{String(selectedIncident.description)}</p></div>
              {selectedIncident.immediate_action && (
                <div><p className="font-medium text-sm">Tindakan Segera</p><p className="text-sm mt-1">{String(selectedIncident.immediate_action)}</p></div>
              )}
              {selectedIncident.investigation_notes && (
                <div><p className="font-medium text-sm">Catatan Investigasi</p><p className="text-sm mt-1">{String(selectedIncident.investigation_notes)}</p></div>
              )}
              {selectedIncident.corrective_action && (
                <div><p className="font-medium text-sm">Tindakan Korektif</p><p className="text-sm mt-1">{String(selectedIncident.corrective_action)}</p></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

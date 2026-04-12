import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Wrench, Package, AlertTriangle, Plus, Search, FileText, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API = import.meta.env.VITE_API_URL || "/api";
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("zen_access_token")}`, "Content-Type": "application/json" });

async function apiFetch(url: string, opts: RequestInit = {}) {
  const res = await fetch(url, { headers: authHeader(), credentials: 'include', ...opts });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw { response: { data: json } };
  return json;
}

const conditionColors: Record<string, string> = {
  baik: "bg-green-100 text-green-800",
  rusak_ringan: "bg-yellow-100 text-yellow-800",
  rusak_berat: "bg-orange-100 text-orange-800",
  tidak_berfungsi: "bg-red-100 text-red-800",
};

export default function ASPAK() {
  const { toast } = useToast();
  const [assets, setAssets] = useState<Record<string, unknown>[]>([]);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [reports, setReports] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    asset_code: "", asset_name: "", asset_category: "medis",
    brand: "", model: "", serial_number: "",
    year_of_purchase: "", current_condition: "baik",
    room_location: "", quantity: "1", kemenkes_code: "", notes: "",
  });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("search", search);
      if (categoryFilter !== "all") params.set("category", categoryFilter);

      const [a, s, r] = await Promise.all([
        apiFetch(`${API}/aspak/assets?${params}`),
        apiFetch(`${API}/aspak/summary`),
        apiFetch(`${API}/aspak/reports`),
      ]);
      setAssets(a.data || []);
      setSummary(s.data || null);
      setReports(r.data || []);
    } catch {
      toast({ title: "Gagal memuat data ASPAK", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [search, categoryFilter]);

  const handleSubmit = async () => {
    try {
      await apiFetch(`${API}/aspak/assets`, { method: "POST", body: JSON.stringify(form) });
      toast({ title: "Aset berhasil disimpan" });
      setShowForm(false);
      setForm({ asset_code: "", asset_name: "", asset_category: "medis", brand: "", model: "", serial_number: "", year_of_purchase: "", current_condition: "baik", room_location: "", quantity: "1", kemenkes_code: "", notes: "" });
      fetchAll();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error || "Gagal menyimpan";
      toast({ title: msg, variant: "destructive" });
    }
  };

  const handleGenerateReport = async () => {
    const period = new Date().toISOString().slice(0, 7);
    try {
      await apiFetch(`${API}/aspak/reports`, { method: "POST", body: JSON.stringify({ report_period: period }) });
      toast({ title: `Laporan ${period} berhasil dibuat` });
      fetchAll();
    } catch {
      toast({ title: "Gagal membuat laporan", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ASPAK — Aset & Peralatan RS</h1>
          <p className="text-muted-foreground">Manajemen aset dan pelaporan ke Kemenkes</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Tambah Aset</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Tambah Aset Baru</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              {[
                ["Kode Aset", "asset_code"], ["Nama Aset *", "asset_name"],
                ["Merek", "brand"], ["Model", "model"],
                ["Serial Number", "serial_number"], ["Tahun Pengadaan", "year_of_purchase"],
                ["Lokasi Ruang", "room_location"], ["Kode ASPAK Kemenkes", "kemenkes_code"],
                ["Jumlah", "quantity"],
              ].map(([label, key]) => (
                <div key={key}>
                  <Label>{label}</Label>
                  <Input
                    value={(form as Record<string, string>)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <div>
                <Label>Kategori</Label>
                <Select value={form.asset_category} onValueChange={v => setForm(f => ({ ...f, asset_category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["medis", "non_medis", "laboratorium", "radiologi", "farmasi"].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Kondisi</Label>
                <Select value={form.current_condition} onValueChange={v => setForm(f => ({ ...f, current_condition: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["baik", "rusak_ringan", "rusak_berat", "tidak_berfungsi"].map(c => (
                      <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSubmit} className="w-full">Simpan Aset</Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6 flex items-center gap-3">
            <Package className="h-8 w-8 text-blue-500" />
            <div><p className="text-2xl font-bold">{String(summary.totalAssets)}</p><p className="text-sm text-muted-foreground">Total Aset</p></div>
          </CardContent></Card>
          <Card><CardContent className="pt-6 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">
                {Array.isArray(summary.byCondition)
                  ? (summary.byCondition as { current_condition: string; _count: { id: number } }[]).find(c => c.current_condition === "baik")?._count?.id ?? 0
                  : 0}
              </p>
              <p className="text-sm text-muted-foreground">Kondisi Baik</p>
            </div>
          </CardContent></Card>
          <Card><CardContent className="pt-6 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-orange-500" />
            <div><p className="text-2xl font-bold">{String(summary.maintenanceDue)}</p><p className="text-sm text-muted-foreground">Jadwal Maintenance</p></div>
          </CardContent></Card>
          <Card><CardContent className="pt-6 flex items-center gap-3">
            <FileText className="h-8 w-8 text-purple-500" />
            <div><p className="text-2xl font-bold">{reports.length}</p><p className="text-sm text-muted-foreground">Laporan Tersimpan</p></div>
          </CardContent></Card>
        </div>
      )}

      <Tabs defaultValue="assets">
        <TabsList>
          <TabsTrigger value="assets"><Package className="h-4 w-4 mr-1" />Daftar Aset</TabsTrigger>
          <TabsTrigger value="maintenance"><Wrench className="h-4 w-4 mr-1" />Maintenance</TabsTrigger>
          <TabsTrigger value="reports"><FileText className="h-4 w-4 mr-1" />Laporan Kemenkes</TabsTrigger>
        </TabsList>

        {/* ASSETS */}
        <TabsContent value="assets" className="mt-4 space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Cari nama/kode aset..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Semua Kategori" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {["medis", "non_medis", "laboratorium", "radiologi", "farmasi"].map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50"><tr>
                  {["Kode", "Nama Aset", "Kategori", "Merek/Model", "Kondisi", "Ruang", "Kode Kemenkes"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {assets.map((a) => (
                    <tr key={String(a.id)} className="border-t hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs">{String(a.asset_code || "—")}</td>
                      <td className="px-4 py-3 font-medium">{String(a.asset_name)}</td>
                      <td className="px-4 py-3"><Badge variant="outline">{String(a.asset_category || "—")}</Badge></td>
                      <td className="px-4 py-3">{[a.brand, a.model].filter(Boolean).join(" / ") || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${conditionColors[String(a.current_condition)] || ""}`}>
                          {String(a.current_condition || "—").replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">{String(a.room_location || "—")}</td>
                      <td className="px-4 py-3 font-mono text-xs">{String(a.kemenkes_code || "—")}</td>
                    </tr>
                  ))}
                  {!assets.length && (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Tidak ada aset ditemukan</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* MAINTENANCE */}
        <TabsContent value="maintenance" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Aset dengan Jadwal Maintenance</CardTitle></CardHeader>
            <CardContent>
              {assets.filter(a => a.next_maintenance_at).length > 0 ? (
                <div className="space-y-3">
                  {assets.filter(a => a.next_maintenance_at).map(a => {
                    const due = new Date(String(a.next_maintenance_at));
                    const diff = Math.ceil((due.getTime() - Date.now()) / 86400000);
                    return (
                      <div key={String(a.id)} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{String(a.asset_name)}</p>
                          <p className="text-sm text-muted-foreground">{String(a.room_location || "—")}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={diff <= 7 ? "destructive" : diff <= 30 ? "secondary" : "outline"}>
                            {diff < 0 ? `Terlambat ${Math.abs(diff)}h` : diff === 0 ? "Hari ini" : `${diff} hari lagi`}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">{due.toLocaleDateString("id-ID")}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Tidak ada jadwal maintenance yang tercatat</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* REPORTS */}
        <TabsContent value="reports" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">Laporan bulanan untuk pelaporan ke Kemenkes</p>
            <Button onClick={handleGenerateReport} variant="outline">
              <FileText className="h-4 w-4 mr-2" />Generate Laporan Bulan Ini
            </Button>
          </div>
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50"><tr>
                {["Periode", "Tipe", "Status", "Dibuat", "Disubmit oleh"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {reports.map(r => (
                  <tr key={String(r.id)} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{String(r.report_period)}</td>
                    <td className="px-4 py-3">{String(r.report_type)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={r.status === "submitted" ? "default" : r.status === "accepted" ? "secondary" : "outline"}>
                        {String(r.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{new Date(String(r.created_at)).toLocaleDateString("id-ID")}</td>
                    <td className="px-4 py-3">{String(r.submitted_by || "—")}</td>
                  </tr>
                ))}
                {!reports.length && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Belum ada laporan</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

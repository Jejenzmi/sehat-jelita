import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Activity, Heart, Thermometer, Wind, Plus, Search, AlertTriangle } from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

const API = import.meta.env.VITE_API_URL || "/api";
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

function isCritical(vital: Record<string, unknown>) {
  const warnings: string[] = [];
  if (vital.systolic_bp && (Number(vital.systolic_bp) >= 180 || Number(vital.systolic_bp) < 90)) warnings.push("TD Kritis");
  if (vital.spo2 && Number(vital.spo2) < 90) warnings.push("SpO2 Kritis");
  if (vital.gcs_total && Number(vital.gcs_total) <= 8) warnings.push("GCS Rendah");
  if (vital.temperature && (Number(vital.temperature) >= 38.5 || Number(vital.temperature) < 35)) warnings.push("Suhu Abnormal");
  if (vital.heart_rate && (Number(vital.heart_rate) > 120 || Number(vital.heart_rate) < 50)) warnings.push("Nadi Abnormal");
  return warnings;
}

export default function TandaVital() {
  const { toast } = useToast();
  const [patientId, setPatientId] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [vitals, setVitals] = useState<Record<string, unknown>[]>([]);
  const [latest, setLatest] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patient_id: "", visit_id: "",
    systolic_bp: "", diastolic_bp: "", heart_rate: "",
    respiratory_rate: "", spo2: "", temperature: "",
    weight_kg: "", height_cm: "",
    pain_score: "", gcs_total: "", gcs_eye: "", gcs_verbal: "", gcs_motor: "",
    blood_glucose: "", notes: "",
  });

  const fetchVitals = async (pid: string) => {
    if (!pid) return;
    setLoading(true);
    try {
      const [v, l] = await Promise.all([
        axios.get(`${API}/vital-signs?patient_id=${pid}&limit=20`, { headers: authHeader() }),
        axios.get(`${API}/vital-signs/latest/${pid}`, { headers: authHeader() }),
      ]);
      setVitals(v.data.data || []);
      setLatest(l.data.data || null);
    } catch {
      toast({ title: "Gagal memuat tanda vital", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (patientSearch.trim()) {
      setPatientId(patientSearch.trim());
      fetchVitals(patientSearch.trim());
    }
  };

  const handleSubmit = async () => {
    try {
      await axios.post(`${API}/vital-signs`, { ...form, patient_id: patientId || form.patient_id }, { headers: authHeader() });
      toast({ title: "Tanda vital berhasil disimpan" });
      setShowForm(false);
      fetchVitals(patientId || form.patient_id);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error || "Gagal menyimpan";
      toast({ title: msg, variant: "destructive" });
    }
  };

  const field = (key: string, label: string, unit?: string) => (
    <div>
      <Label>{label}{unit ? ` (${unit})` : ""}</Label>
      <Input
        type="number"
        value={(form as Record<string, string>)[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tanda Vital</h1>
          <p className="text-muted-foreground">Monitoring dan trending tanda-tanda vital pasien</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Input Tanda Vital</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Input Tanda Vital Baru</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Patient ID</Label>
                  <Input placeholder="UUID pasien" value={form.patient_id}
                    onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))} />
                </div>
                <p className="col-span-2 text-sm font-semibold text-muted-foreground border-b pb-1">Hemodinamik</p>
                {field("systolic_bp", "Sistolik", "mmHg")}
                {field("diastolic_bp", "Diastolik", "mmHg")}
                {field("heart_rate", "Nadi", "bpm")}
                <p className="col-span-2 text-sm font-semibold text-muted-foreground border-b pb-1">Pernapasan</p>
                {field("respiratory_rate", "Frekuensi Napas", "/menit")}
                {field("spo2", "SpO2", "%")}
                <p className="col-span-2 text-sm font-semibold text-muted-foreground border-b pb-1">Suhu & Antropometri</p>
                {field("temperature", "Suhu", "°C")}
                {field("weight_kg", "Berat Badan", "kg")}
                {field("height_cm", "Tinggi Badan", "cm")}
                <p className="col-span-2 text-sm font-semibold text-muted-foreground border-b pb-1">Skoring</p>
                {field("pain_score", "Skala Nyeri VAS", "0–10")}
                {field("gcs_total", "GCS Total", "3–15")}
                {field("gcs_eye", "GCS Eye")}
                {field("gcs_verbal", "GCS Verbal")}
                {field("gcs_motor", "GCS Motor")}
                {field("blood_glucose", "Gula Darah", "mg/dL")}
                <div className="col-span-2">
                  <Label>Catatan</Label>
                  <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
              <Button onClick={handleSubmit} className="w-full">Simpan Tanda Vital</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search patient */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Masukkan Patient ID..." value={patientSearch}
            onChange={e => setPatientSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()} />
        </div>
        <Button onClick={handleSearch}>Cari</Button>
      </div>

      {/* Latest vitals summary */}
      {latest && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">Tanda Vital Terbaru</h2>
            <span className="text-sm text-muted-foreground">
              {new Date(String(latest.recorded_at)).toLocaleString("id-ID")}
            </span>
            {isCritical(latest).map(w => (
              <Badge key={w} variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />{w}
              </Badge>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card><CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-lg font-bold">
                    {latest.systolic_bp ? `${latest.systolic_bp}/${latest.diastolic_bp}` : "—"} <span className="text-xs text-muted-foreground">mmHg</span>
                  </p>
                  <p className="text-xs text-muted-foreground">Tekanan Darah</p>
                </div>
              </div>
            </CardContent></Card>
            <Card><CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-lg font-bold">{latest.heart_rate ?? "—"} <span className="text-xs text-muted-foreground">bpm</span></p>
                  <p className="text-xs text-muted-foreground">Nadi</p>
                </div>
              </div>
            </CardContent></Card>
            <Card><CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Wind className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-lg font-bold">{latest.spo2 ?? "—"}<span className="text-xs text-muted-foreground">%</span></p>
                  <p className="text-xs text-muted-foreground">SpO2</p>
                </div>
              </div>
            </CardContent></Card>
            <Card><CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Thermometer className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-lg font-bold">{latest.temperature ?? "—"}<span className="text-xs text-muted-foreground">°C</span></p>
                  <p className="text-xs text-muted-foreground">Suhu</p>
                </div>
              </div>
            </CardContent></Card>
          </div>
        </div>
      )}

      {/* History table */}
      {loading ? (
        <div className="flex justify-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : vitals.length > 0 ? (
        <Card>
          <CardHeader><CardTitle>Riwayat Tanda Vital</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>{["Waktu", "TD", "Nadi", "RR", "SpO2", "Suhu", "GCS", "Nyeri", "GD", "Catatan"].map(h => (
                    <th key={h} className="px-3 py-3 text-left font-medium whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {vitals.map(v => {
                    const crit = isCritical(v);
                    return (
                      <tr key={String(v.id)} className={`border-t ${crit.length > 0 ? "bg-red-50" : "hover:bg-muted/30"}`}>
                        <td className="px-3 py-2 whitespace-nowrap text-xs">{new Date(String(v.recorded_at)).toLocaleString("id-ID")}</td>
                        <td className="px-3 py-2">{v.systolic_bp ? `${v.systolic_bp}/${v.diastolic_bp}` : "—"}</td>
                        <td className="px-3 py-2">{String(v.heart_rate ?? "—")}</td>
                        <td className="px-3 py-2">{String(v.respiratory_rate ?? "—")}</td>
                        <td className="px-3 py-2">{v.spo2 ? `${v.spo2}%` : "—"}</td>
                        <td className="px-3 py-2">{v.temperature ? `${v.temperature}°C` : "—"}</td>
                        <td className="px-3 py-2">{String(v.gcs_total ?? "—")}</td>
                        <td className="px-3 py-2">{String(v.pain_score ?? "—")}</td>
                        <td className="px-3 py-2">{v.blood_glucose ? `${v.blood_glucose}` : "—"}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground max-w-[150px] truncate">{String(v.notes || "")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : patientId ? (
        <div className="text-center py-10 text-muted-foreground">
          <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Belum ada data tanda vital untuk pasien ini</p>
        </div>
      ) : null}
    </div>
  );
}

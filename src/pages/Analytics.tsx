import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Users, Bed, DollarSign, Activity, Calendar, AlertCircle } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "/api";

function useApi<T>(url: string, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem("zen_access_token");
    fetch(`${API}${url}`, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' })
      .then(r => r.json())
      .then(json => { setData(json.data || json); setError(null); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, deps);

  return { data, loading, error };
}

function KpiCard({ title, value, sub, icon: Icon, color = "text-primary" }: {
  title: string; value: string | number; sub?: string;
  icon: React.ElementType; color?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <Icon className={`h-8 w-8 ${color}`} />
          <div>
            <p className="text-2xl font-bold">{value ?? "—"}</p>
            <p className="text-sm font-medium">{title}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  const [period, setPeriod] = useState("today");

  const { data: overview, loading: ovLoad } = useApi<Record<string, number>>(
    `/analytics/overview?period=${period}`, [period]
  );
  const { data: bedStats } = useApi<Record<string, number>>("/analytics/beds");
  const { data: revenueData } = useApi<{ daily: { date: string; total: number }[] }>(
    `/analytics/revenue?days=7`
  );
  const { data: deptStats } = useApi<{ name: string; visits: number }[]>("/analytics/departments");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics & KPI</h1>
          <p className="text-muted-foreground">Dashboard kinerja operasional rumah sakit</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hari Ini</SelectItem>
            <SelectItem value="week">7 Hari</SelectItem>
            <SelectItem value="month">Bulan Ini</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Ringkasan</TabsTrigger>
          <TabsTrigger value="revenue">Pendapatan</TabsTrigger>
          <TabsTrigger value="beds">Tempat Tidur</TabsTrigger>
          <TabsTrigger value="departments">Departemen</TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW ── */}
        <TabsContent value="overview" className="mt-4">
          {ovLoad ? (
            <div className="flex justify-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard title="Total Kunjungan" value={overview?.total_visits ?? "—"} icon={Users} color="text-blue-500" />
              <KpiCard title="Pasien Baru" value={overview?.new_patients ?? "—"} icon={Users} color="text-green-500" />
              <KpiCard title="Rawat Inap" value={overview?.inpatient_count ?? "—"} icon={Bed} color="text-purple-500" />
              <KpiCard title="Pendapatan" value={overview?.total_revenue ? `Rp ${Number(overview.total_revenue).toLocaleString("id-ID")}` : "—"} icon={DollarSign} color="text-yellow-500" />
              <KpiCard title="Resep Keluar" value={overview?.prescriptions ?? "—"} icon={Activity} color="text-red-500" />
              <KpiCard title="Lab Order" value={overview?.lab_orders ?? "—"} icon={BarChart3} color="text-indigo-500" />
              <KpiCard title="Radiologi" value={overview?.radiology_orders ?? "—"} icon={TrendingUp} color="text-cyan-500" />
              <KpiCard title="Antrian Aktif" value={overview?.queue_active ?? "—"} icon={Calendar} color="text-orange-500" />
            </div>
          )}
        </TabsContent>

        {/* ── REVENUE ── */}
        <TabsContent value="revenue" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pendapatan 7 Hari Terakhir</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueData?.daily?.length ? (
                <div className="space-y-3">
                  {revenueData.daily.map((d) => {
                    const max = Math.max(...revenueData.daily.map(x => x.total));
                    const pct = max > 0 ? (d.total / max) * 100 : 0;
                    return (
                      <div key={d.date} className="flex items-center gap-3">
                        <span className="w-24 text-sm text-muted-foreground shrink-0">{d.date}</span>
                        <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-32 text-right text-sm font-medium shrink-0">
                          Rp {Number(d.total).toLocaleString("id-ID")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Tidak ada data pendapatan</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── BEDS ── */}
        <TabsContent value="beds" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard title="Total TT" value={bedStats?.total ?? "—"} icon={Bed} />
            <KpiCard title="Terisi" value={bedStats?.occupied ?? "—"} icon={Bed} color="text-red-500" />
            <KpiCard title="Tersedia" value={bedStats?.available ?? "—"} icon={Bed} color="text-green-500" />
            <KpiCard
              title="BOR"
              value={bedStats?.total ? `${((Number(bedStats.occupied) / Number(bedStats.total)) * 100).toFixed(1)}%` : "—"}
              sub="Bed Occupancy Rate"
              icon={TrendingUp}
              color="text-blue-500"
            />
          </div>
        </TabsContent>

        {/* ── DEPARTMENTS ── */}
        <TabsContent value="departments" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Kunjungan per Departemen</CardTitle></CardHeader>
            <CardContent>
              {Array.isArray(deptStats) && deptStats.length > 0 ? (
                <div className="space-y-3">
                  {deptStats.map((d) => {
                    const max = Math.max(...deptStats.map((x) => x.visits));
                    const pct = max > 0 ? (d.visits / max) * 100 : 0;
                    return (
                      <div key={d.name} className="flex items-center gap-3">
                        <span className="w-32 text-sm truncate shrink-0">{d.name}</span>
                        <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <Badge variant="secondary" className="shrink-0">{d.visits}</Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                  <AlertCircle className="h-8 w-8" />
                  <p>Tidak ada data departemen</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

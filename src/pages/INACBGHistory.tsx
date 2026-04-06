import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Search, TrendingUp, TrendingDown, Minus, ClipboardList } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { credentials: 'include' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return (json.data ?? json) as T;
}

interface INACBGRecord {
  id: string;
  drg_code: string | null;
  drg_description: string | null;
  severity_level: number;
  los_actual: number | null;
  los_grouper: number | null;
  primary_diagnosis: string | null;
  secondary_diagnoses: string[];
  procedures: string[];
  base_tariff: number | null;
  adjustment_factor: number | null;
  final_tariff: number | null;
  hospital_cost: number | null;
  variance: number | null;
  calculated_by: string | null;
  calculated_at: string;
}

function fmtRp(val: number | null) {
  if (val == null) return "-";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
}

function SeverityBadge({ level }: { level: number }) {
  const map: Record<number, { label: string; className: string }> = {
    1: { label: "Ringan", className: "bg-green-100 text-green-800" },
    2: { label: "Sedang", className: "bg-yellow-100 text-yellow-800" },
    3: { label: "Berat", className: "bg-red-100 text-red-800" },
  };
  const s = map[level] ?? { label: `Level ${level}`, className: "bg-gray-100 text-gray-800" };
  return <Badge className={s.className}>{s.label}</Badge>;
}

function VarianceIndicator({ variance }: { variance: number | null }) {
  if (variance == null) return <span className="text-muted-foreground">-</span>;
  if (variance > 0) return (
    <span className="flex items-center gap-1 text-red-600 font-medium">
      <TrendingUp className="h-3 w-3" /> {fmtRp(variance)}
    </span>
  );
  if (variance < 0) return (
    <span className="flex items-center gap-1 text-green-600 font-medium">
      <TrendingDown className="h-3 w-3" /> {fmtRp(Math.abs(variance))}
    </span>
  );
  return <span className="flex items-center gap-1 text-muted-foreground"><Minus className="h-3 w-3" /> 0</span>;
}

export default function INACBGHistory() {
  const [limit, setLimit] = useState("50");
  const [search, setSearch] = useState("");

  const { data: records = [], isLoading, refetch } = useQuery<INACBGRecord[]>({
    queryKey: ["inacbg-history", limit],
    queryFn: () => apiFetch(`/eklaim/inacbg-calculations?limit=${limit}`),
  });

  const filtered = search.trim()
    ? records.filter(r =>
        r.drg_code?.toLowerCase().includes(search.toLowerCase()) ||
        r.drg_description?.toLowerCase().includes(search.toLowerCase()) ||
        r.primary_diagnosis?.toLowerCase().includes(search.toLowerCase())
      )
    : records;

  const totalPositiveVariance = records.filter(r => (r.variance ?? 0) > 0).length;
  const totalNegativeVariance = records.filter(r => (r.variance ?? 0) < 0).length;
  const avgVariance = records.length > 0
    ? records.reduce((s, r) => s + (r.variance ?? 0), 0) / records.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Riwayat Kalkulasi INACBG
          </h2>
          <p className="text-sm text-muted-foreground">
            Histori perhitungan tarif INA-CBG / INACBG untuk klaim BPJS
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Kalkulasi</p>
            <p className="text-2xl font-bold">{records.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Variance Positif</p>
            <p className="text-2xl font-bold text-red-600">{totalPositiveVariance}</p>
            <p className="text-xs text-muted-foreground">Biaya RS &gt; Tarif CBG</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Variance Negatif</p>
            <p className="text-2xl font-bold text-green-600">{totalNegativeVariance}</p>
            <p className="text-xs text-muted-foreground">Biaya RS &lt; Tarif CBG</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Rata-rata Variance</p>
            <p className={`text-xl font-bold ${avgVariance > 0 ? "text-red-600" : "text-green-600"}`}>
              {fmtRp(avgVariance)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <CardTitle className="text-base">Daftar Kalkulasi</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari kode DRG / diagnosis..."
                  className="pl-8 w-64"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <Select value={limit} onValueChange={setLimit}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["20","50","100","200"].map(v => (
                    <SelectItem key={v} value={v}>{v} data</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Memuat data...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              {search ? "Tidak ditemukan hasil pencarian." : "Belum ada riwayat kalkulasi."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode DRG</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Diagnosis Utama</TableHead>
                    <TableHead className="text-right">LOS Aktual</TableHead>
                    <TableHead className="text-right">Tarif Dasar</TableHead>
                    <TableHead className="text-right">Tarif Final</TableHead>
                    <TableHead className="text-right">Biaya RS</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    <TableHead>Waktu Hitung</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono font-medium">{r.drg_code ?? "-"}</TableCell>
                      <TableCell className="max-w-48 truncate" title={r.drg_description ?? ""}>
                        {r.drg_description ?? "-"}
                      </TableCell>
                      <TableCell><SeverityBadge level={r.severity_level} /></TableCell>
                      <TableCell className="max-w-40 truncate" title={r.primary_diagnosis ?? ""}>
                        {r.primary_diagnosis ?? "-"}
                      </TableCell>
                      <TableCell className="text-right">{r.los_actual ?? "-"} hr</TableCell>
                      <TableCell className="text-right">{fmtRp(r.base_tariff)}</TableCell>
                      <TableCell className="text-right font-medium">{fmtRp(r.final_tariff)}</TableCell>
                      <TableCell className="text-right">{fmtRp(r.hospital_cost)}</TableCell>
                      <TableCell className="text-right">
                        <VarianceIndicator variance={r.variance} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(r.calculated_at).toLocaleString("id-ID")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

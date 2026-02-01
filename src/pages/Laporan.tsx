import { useState } from "react";
import { 
  FileBarChart, Download, Calendar, TrendingUp, Users, 
  CreditCard, Stethoscope, BedDouble, Filter, FileSpreadsheet, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";
import { 
  useReportStats, 
  useMonthlyVisits, 
  useMonthlyRevenue, 
  useDepartmentStats, 
  useTopDiagnoses 
} from "@/hooks/useReportData";

export default function Laporan() {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const [dateRange, setDateRange] = useState({ 
    start: `${currentYear}-01-01`, 
    end: `${currentYear}-12-31` 
  });

  // Fetch real data
  const { data: stats, isLoading: statsLoading } = useReportStats(dateRange.start, dateRange.end);
  const { data: monthlyVisits = [], isLoading: visitsLoading } = useMonthlyVisits(currentYear);
  const { data: monthlyRevenue = [], isLoading: revenueLoading } = useMonthlyRevenue(currentYear);
  const { data: departmentStats = [], isLoading: deptLoading } = useDepartmentStats(dateRange.start, dateRange.end);
  const { data: topDiagnoses = [], isLoading: diagnosesLoading } = useTopDiagnoses(dateRange.start, dateRange.end);

  const isLoading = statsLoading || visitsLoading || revenueLoading;

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) return `Rp ${(amount / 1000000000).toFixed(1)}M`;
    if (amount >= 1000000) return `Rp ${(amount / 1000000).toFixed(1)}jt`;
    return `Rp ${amount.toLocaleString("id-ID")}`;
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text("Laporan SIMRS", 14, 22);
    doc.setFontSize(12);
    doc.text(`Periode: ${dateRange.start} - ${dateRange.end}`, 14, 32);
    
    // Summary Stats
    doc.setFontSize(14);
    doc.text("Ringkasan Statistik", 14, 45);
    
    const statsData = [
      ["Total Kunjungan", (stats?.totalVisits || 0).toLocaleString()],
      ["Rawat Jalan", (stats?.outpatientVisits || 0).toLocaleString()],
      ["Rawat Inap", (stats?.inpatientVisits || 0).toLocaleString()],
      ["IGD", (stats?.emergencyVisits || 0).toLocaleString()],
      ["Total Pendapatan", formatCurrency(stats?.totalRevenue || 0)],
      ["Rata-rata LOS", `${stats?.avgLOS || 0} hari`],
    ];
    
    autoTable(doc, {
      startY: 50,
      head: [["Metrik", "Nilai"]],
      body: statsData,
      theme: "striped",
    });
    
    // Top Diagnoses
    if (topDiagnoses.length > 0) {
      doc.text("10 Diagnosa Terbanyak", 14, (doc as any).lastAutoTable.finalY + 15);
      
      const diagnosesData = topDiagnoses.map(d => [d.code, d.description, d.count.toString(), `${d.percentage}%`]);
      
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [["Kode ICD", "Diagnosa", "Jumlah", "Persentase"]],
        body: diagnosesData,
        theme: "striped",
      });
    }
    
    doc.save(`Laporan_SIMRS_${dateRange.start}_${dateRange.end}.pdf`);
    
    toast({
      title: "Export Berhasil",
      description: "Laporan PDF telah didownload",
    });
  };

  const exportToExcel = () => {
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [
      ["LAPORAN SIMRS"],
      [`Periode: ${dateRange.start} - ${dateRange.end}`],
      [],
      ["Metrik", "Nilai"],
      ["Total Kunjungan", stats?.totalVisits || 0],
      ["Rawat Jalan", stats?.outpatientVisits || 0],
      ["Rawat Inap", stats?.inpatientVisits || 0],
      ["IGD", stats?.emergencyVisits || 0],
      ["Total Pendapatan (Rp)", stats?.totalRevenue || 0],
      ["Rata-rata LOS (hari)", stats?.avgLOS || 0],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan");
    
    // Monthly visits sheet
    const visitsData = [
      ["Bulan", "Rawat Jalan", "Rawat Inap", "IGD", "Total"],
      ...monthlyVisits.map(m => [
        m.month,
        m.rawatJalan,
        m.rawatInap,
        m.igd,
        m.rawatJalan + m.rawatInap + m.igd,
      ]),
    ];
    const wsVisits = XLSX.utils.aoa_to_sheet(visitsData);
    XLSX.utils.book_append_sheet(wb, wsVisits, "Kunjungan Bulanan");
    
    // Revenue sheet
    const revenueData = [
      ["Bulan", "BPJS (Jt)", "Umum (Jt)", "Asuransi (Jt)", "Total (Jt)"],
      ...monthlyRevenue.map(m => [
        m.month,
        m.bpjs,
        m.umum,
        m.asuransi,
        m.bpjs + m.umum + m.asuransi,
      ]),
    ];
    const wsRevenue = XLSX.utils.aoa_to_sheet(revenueData);
    XLSX.utils.book_append_sheet(wb, wsRevenue, "Pendapatan Bulanan");
    
    // Diagnoses sheet
    if (topDiagnoses.length > 0) {
      const diagnosesData = [
        ["Kode ICD", "Diagnosa", "Jumlah", "Persentase"],
        ...topDiagnoses.map(d => [d.code, d.description, d.count, `${d.percentage}%`]),
      ];
      const wsDiagnoses = XLSX.utils.aoa_to_sheet(diagnosesData);
      XLSX.utils.book_append_sheet(wb, wsDiagnoses, "Top Diagnosa");
    }
    
    XLSX.writeFile(wb, `Laporan_SIMRS_${dateRange.start}_${dateRange.end}.xlsx`);
    
    toast({
      title: "Export Berhasil",
      description: "Laporan Excel telah didownload",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Laporan & Analitik</h1>
          <p className="text-muted-foreground">Dashboard laporan dan statistik rumah sakit</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button className="gradient-primary shadow-glow" onClick={exportToPDF}>
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="module-card">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label>Tanggal Mulai</Label>
            <Input 
              type="date" 
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Tanggal Akhir</Label>
            <Input 
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Departemen</Label>
            <Select defaultValue="all">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Departemen</SelectItem>
                <SelectItem value="rawat-jalan">Rawat Jalan</SelectItem>
                <SelectItem value="rawat-inap">Rawat Inap</SelectItem>
                <SelectItem value="igd">IGD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Terapkan Filter
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="module-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Total Kunjungan</span>
          </div>
          {isLoading ? (
            <Skeleton className="h-10 w-24" />
          ) : (
            <>
              <p className="text-3xl font-bold">{(stats?.totalVisits || 0).toLocaleString()}</p>
              <p className="text-sm text-success flex items-center gap-1 mt-1">
                <TrendingUp className="h-4 w-4" />
                Periode ini
              </p>
            </>
          )}
        </div>
        <div className="module-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-success/10">
              <Stethoscope className="h-5 w-5 text-success" />
            </div>
            <span className="text-sm text-muted-foreground">Rawat Jalan</span>
          </div>
          {isLoading ? (
            <Skeleton className="h-10 w-24" />
          ) : (
            <>
              <p className="text-3xl font-bold">{(stats?.outpatientVisits || 0).toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {stats?.totalVisits ? ((stats.outpatientVisits / stats.totalVisits) * 100).toFixed(1) : 0}% dari total
              </p>
            </>
          )}
        </div>
        <div className="module-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-warning/10">
              <BedDouble className="h-5 w-5 text-warning" />
            </div>
            <span className="text-sm text-muted-foreground">Rawat Inap</span>
          </div>
          {isLoading ? (
            <Skeleton className="h-10 w-24" />
          ) : (
            <>
              <p className="text-3xl font-bold">{(stats?.inpatientVisits || 0).toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">Avg. LOS: {stats?.avgLOS || 0} hari</p>
            </>
          )}
        </div>
        <div className="module-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-info/10">
              <CreditCard className="h-5 w-5 text-info" />
            </div>
            <span className="text-sm text-muted-foreground">Total Pendapatan</span>
          </div>
          {isLoading ? (
            <Skeleton className="h-10 w-24" />
          ) : (
            <>
              <p className="text-3xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</p>
              <p className="text-sm text-success flex items-center gap-1 mt-1">
                <TrendingUp className="h-4 w-4" />
                Periode ini
              </p>
            </>
          )}
        </div>
      </div>

      {/* Charts */}
      <Tabs defaultValue="kunjungan" className="space-y-4">
        <TabsList>
          <TabsTrigger value="kunjungan">Kunjungan</TabsTrigger>
          <TabsTrigger value="pendapatan">Pendapatan</TabsTrigger>
          <TabsTrigger value="departemen">Per Departemen</TabsTrigger>
          <TabsTrigger value="diagnosa">Top Diagnosa</TabsTrigger>
        </TabsList>

        <TabsContent value="kunjungan">
          <div className="module-card">
            <h3 className="text-lg font-semibold mb-6">Tren Kunjungan Bulanan</h3>
            {visitsLoading ? (
              <Skeleton className="h-[400px]" />
            ) : (
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyVisits}>
                    <defs>
                      <linearGradient id="colorRawatJalan" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0891b2" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorRawatInap" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorIGD" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem"
                      }} 
                    />
                    <Legend />
                    <Area type="monotone" dataKey="rawatJalan" name="Rawat Jalan" stroke="#0891b2" fill="url(#colorRawatJalan)" strokeWidth={2} />
                    <Area type="monotone" dataKey="rawatInap" name="Rawat Inap" stroke="#10b981" fill="url(#colorRawatInap)" strokeWidth={2} />
                    <Area type="monotone" dataKey="igd" name="IGD" stroke="#ef4444" fill="url(#colorIGD)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pendapatan">
          <div className="module-card">
            <h3 className="text-lg font-semibold mb-6">Pendapatan Bulanan (dalam Juta Rupiah)</h3>
            {revenueLoading ? (
              <Skeleton className="h-[400px]" />
            ) : (
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem"
                      }}
                      formatter={(value: number) => [`Rp ${value} Jt`, ""]}
                    />
                    <Legend />
                    <Bar dataKey="bpjs" name="BPJS" fill="#0891b2" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="umum" name="Umum" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="asuransi" name="Asuransi" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="departemen">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="module-card">
              <h3 className="text-lg font-semibold mb-6">Distribusi per Departemen</h3>
              {deptLoading ? (
                <Skeleton className="h-[350px]" />
              ) : departmentStats.length === 0 ? (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  Tidak ada data departemen
                </div>
              ) : (
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={departmentStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {departmentStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "0.5rem"
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            <div className="module-card">
              <h3 className="text-lg font-semibold mb-6">Detail per Departemen</h3>
              {deptLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-8" />)}
                </div>
              ) : departmentStats.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Tidak ada data departemen
                </div>
              ) : (
                <div className="space-y-4">
                  {departmentStats.map((dept, idx) => {
                    const total = departmentStats.reduce((a, b) => a + b.value, 0);
                    return (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: dept.color }}
                          />
                          <span>{dept.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold">{dept.value.toLocaleString()}</span>
                          <Badge variant="secondary">
                            {total > 0 ? ((dept.value / total) * 100).toFixed(1) : 0}%
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="diagnosa">
          <div className="module-card">
            <h3 className="text-lg font-semibold mb-6">10 Diagnosa Terbanyak (ICD-10)</h3>
            {diagnosesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : topDiagnoses.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Tidak ada data diagnosis
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Kode ICD-10</th>
                      <th>Diagnosis</th>
                      <th>Jumlah</th>
                      <th>Persentase</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topDiagnoses.map((dx, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td><code className="font-mono">{dx.code}</code></td>
                        <td>{dx.description}</td>
                        <td className="font-medium">{dx.count.toLocaleString()}</td>
                        <td>
                          <Badge variant="secondary">{dx.percentage}%</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

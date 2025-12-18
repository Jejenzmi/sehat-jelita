import { useState } from "react";
import { 
  FileBarChart, Download, Calendar, TrendingUp, Users, 
  CreditCard, Stethoscope, BedDouble, Filter, FileSpreadsheet, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

// Sample data
const monthlyVisits = [
  { month: "Jan", rawatJalan: 2450, rawatInap: 320, igd: 180 },
  { month: "Feb", rawatJalan: 2680, rawatInap: 350, igd: 195 },
  { month: "Mar", rawatJalan: 2890, rawatInap: 380, igd: 210 },
  { month: "Apr", rawatJalan: 2750, rawatInap: 340, igd: 185 },
  { month: "Mei", rawatJalan: 3100, rawatInap: 420, igd: 225 },
  { month: "Jun", rawatJalan: 2950, rawatInap: 390, igd: 200 },
  { month: "Jul", rawatJalan: 3200, rawatInap: 450, igd: 240 },
  { month: "Agu", rawatJalan: 3050, rawatInap: 410, igd: 215 },
  { month: "Sep", rawatJalan: 2900, rawatInap: 370, igd: 190 },
  { month: "Okt", rawatJalan: 3150, rawatInap: 430, igd: 230 },
  { month: "Nov", rawatJalan: 3300, rawatInap: 460, igd: 250 },
  { month: "Des", rawatJalan: 2800, rawatInap: 350, igd: 180 },
];

const monthlyRevenue = [
  { month: "Jan", bpjs: 1250, umum: 450, asuransi: 120 },
  { month: "Feb", bpjs: 1380, umum: 520, asuransi: 145 },
  { month: "Mar", bpjs: 1520, umum: 580, asuransi: 160 },
  { month: "Apr", bpjs: 1420, umum: 510, asuransi: 135 },
  { month: "Mei", bpjs: 1680, umum: 650, asuransi: 180 },
  { month: "Jun", bpjs: 1550, umum: 590, asuransi: 155 },
  { month: "Jul", bpjs: 1780, umum: 720, asuransi: 200 },
  { month: "Agu", bpjs: 1650, umum: 680, asuransi: 185 },
  { month: "Sep", bpjs: 1480, umum: 550, asuransi: 150 },
  { month: "Okt", bpjs: 1720, umum: 700, asuransi: 190 },
  { month: "Nov", bpjs: 1850, umum: 750, asuransi: 210 },
  { month: "Des", bpjs: 1450, umum: 520, asuransi: 140 },
];

const departmentStats = [
  { name: "Poli Umum", value: 3500, color: "#0891b2" },
  { name: "Poli Anak", value: 2800, color: "#10b981" },
  { name: "Poli Kandungan", value: 2200, color: "#f59e0b" },
  { name: "Poli Jantung", value: 1800, color: "#ef4444" },
  { name: "Poli Penyakit Dalam", value: 2500, color: "#8b5cf6" },
  { name: "Lainnya", value: 1500, color: "#6b7280" },
];

const topDiagnoses = [
  { code: "J06.9", description: "ISPA", count: 1250, percentage: 15.2 },
  { code: "I10", description: "Hipertensi", count: 980, percentage: 11.9 },
  { code: "E11.9", description: "DM Tipe 2", count: 750, percentage: 9.1 },
  { code: "K29.7", description: "Gastritis", count: 620, percentage: 7.5 },
  { code: "M54.5", description: "Low Back Pain", count: 540, percentage: 6.6 },
];

export default function Laporan() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState({ start: "2024-01-01", end: "2024-12-31" });
  const [selectedReport, setSelectedReport] = useState("kunjungan");

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
      ["Total Kunjungan", "35,225"],
      ["Rawat Jalan", "30,000"],
      ["Rawat Inap", "4,670"],
      ["IGD", "2,400"],
      ["Total Pendapatan", "Rp 28.5 Miliar"],
    ];
    
    autoTable(doc, {
      startY: 50,
      head: [["Metrik", "Nilai"]],
      body: statsData,
      theme: "striped",
    });
    
    // Top Diagnoses
    doc.text("10 Diagnosa Terbanyak", 14, (doc as any).lastAutoTable.finalY + 15);
    
    const diagnosesData = topDiagnoses.map(d => [d.code, d.description, d.count.toString(), `${d.percentage}%`]);
    
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [["Kode ICD", "Diagnosa", "Jumlah", "Persentase"]],
      body: diagnosesData,
      theme: "striped",
    });
    
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
      ["Total Kunjungan", 35225],
      ["Rawat Jalan", 30000],
      ["Rawat Inap", 4670],
      ["IGD", 2400],
      ["Total Pendapatan (Rp)", 28500000000],
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
    const diagnosesData = [
      ["Kode ICD", "Diagnosa", "Jumlah", "Persentase"],
      ...topDiagnoses.map(d => [d.code, d.description, d.count, `${d.percentage}%`]),
    ];
    const wsDiagnoses = XLSX.utils.aoa_to_sheet(diagnosesData);
    XLSX.utils.book_append_sheet(wb, wsDiagnoses, "Top Diagnosa");
    
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
          <p className="text-3xl font-bold">35,225</p>
          <p className="text-sm text-success flex items-center gap-1 mt-1">
            <TrendingUp className="h-4 w-4" />
            +12.5% vs tahun lalu
          </p>
        </div>
        <div className="module-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-success/10">
              <Stethoscope className="h-5 w-5 text-success" />
            </div>
            <span className="text-sm text-muted-foreground">Rawat Jalan</span>
          </div>
          <p className="text-3xl font-bold">30,000</p>
          <p className="text-sm text-muted-foreground mt-1">85.2% dari total</p>
        </div>
        <div className="module-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-warning/10">
              <BedDouble className="h-5 w-5 text-warning" />
            </div>
            <span className="text-sm text-muted-foreground">Rawat Inap</span>
          </div>
          <p className="text-3xl font-bold">4,670</p>
          <p className="text-sm text-muted-foreground mt-1">Avg. LOS: 4.2 hari</p>
        </div>
        <div className="module-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-info/10">
              <CreditCard className="h-5 w-5 text-info" />
            </div>
            <span className="text-sm text-muted-foreground">Total Pendapatan</span>
          </div>
          <p className="text-3xl font-bold">Rp 28.5M</p>
          <p className="text-sm text-success flex items-center gap-1 mt-1">
            <TrendingUp className="h-4 w-4" />
            +18.3% vs tahun lalu
          </p>
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
          </div>
        </TabsContent>

        <TabsContent value="pendapatan">
          <div className="module-card">
            <h3 className="text-lg font-semibold mb-6">Pendapatan Bulanan (dalam Juta Rupiah)</h3>
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
          </div>
        </TabsContent>

        <TabsContent value="departemen">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="module-card">
              <h3 className="text-lg font-semibold mb-6">Distribusi per Departemen</h3>
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
            </div>
            <div className="module-card">
              <h3 className="text-lg font-semibold mb-6">Detail per Departemen</h3>
              <div className="space-y-4">
                {departmentStats.map((dept, idx) => (
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
                        {((dept.value / departmentStats.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="diagnosa">
          <div className="module-card">
            <h3 className="text-lg font-semibold mb-6">10 Diagnosa Terbanyak (ICD-10)</h3>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Kode ICD-10</th>
                    <th>Diagnosa</th>
                    <th>Jumlah Kasus</th>
                    <th>Persentase</th>
                    <th>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {topDiagnoses.map((dx, idx) => (
                    <tr key={dx.code}>
                      <td>
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                          {idx + 1}
                        </span>
                      </td>
                      <td className="font-mono font-medium">{dx.code}</td>
                      <td>{dx.description}</td>
                      <td className="font-bold">{dx.count.toLocaleString()}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${dx.percentage * 5}%` }}
                            />
                          </div>
                          <span className="text-sm">{dx.percentage}%</span>
                        </div>
                      </td>
                      <td>
                        <Badge variant="secondary" className="bg-success/10 text-success">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +5%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

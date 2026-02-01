import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, Bed, DollarSign, TrendingUp, TrendingDown, Activity, 
  Clock, AlertTriangle, CheckCircle, Target,
  ArrowUpRight, ArrowDownRight, Building2
} from "lucide-react";
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from "recharts";
import {
  useExecutiveKPIs,
  useRevenueData,
  useVisitTrends,
  usePaymentDistribution,
  useBedOccupancyByClass,
  useDepartmentPerformance,
} from "@/hooks/useExecutiveDashboardData";

// Fallback data for when real data is empty
const fallbackRevenueData = [
  { month: "Jan", revenue: 450, target: 400, rawat_jalan: 280, rawat_inap: 170 },
  { month: "Feb", revenue: 480, target: 420, rawat_jalan: 300, rawat_inap: 180 },
  { month: "Mar", revenue: 520, target: 450, rawat_jalan: 320, rawat_inap: 200 },
  { month: "Apr", revenue: 490, target: 470, rawat_jalan: 290, rawat_inap: 200 },
  { month: "Mei", revenue: 560, target: 500, rawat_jalan: 350, rawat_inap: 210 },
  { month: "Jun", revenue: 610, target: 520, rawat_jalan: 380, rawat_inap: 230 },
];

const fallbackVisitData = [
  { month: "Jan", rawat_jalan: 1250, igd: 320, rawat_inap: 180 },
  { month: "Feb", rawat_jalan: 1380, igd: 290, rawat_inap: 195 },
  { month: "Mar", rawat_jalan: 1420, igd: 350, rawat_inap: 210 },
  { month: "Apr", rawat_jalan: 1300, igd: 310, rawat_inap: 188 },
  { month: "Mei", rawat_jalan: 1520, igd: 380, rawat_inap: 225 },
  { month: "Jun", rawat_jalan: 1680, igd: 420, rawat_inap: 240 },
];

const fallbackBedOccupancy = [
  { class: "VIP", occupied: 8, total: 10, rate: 80 },
  { class: "Kelas 1", occupied: 18, total: 24, rate: 75 },
  { class: "Kelas 2", occupied: 28, total: 36, rate: 78 },
  { class: "Kelas 3", occupied: 45, total: 60, rate: 75 },
  { class: "ICU", occupied: 6, total: 8, rate: 75 },
];

const fallbackKPIs = [
  { label: "Total Pasien", value: "12,845", change: "+12.5%", trend: "up" as const },
  { label: "Pendapatan", value: "Rp 6.1M", change: "+18.2%", trend: "up" as const },
  { label: "BOR", value: "76.8%", change: "+2.3%", trend: "up" as const },
  { label: "ALOS", value: "4.2 hari", change: "-0.3", trend: "down" as const },
  { label: "BTO", value: "5.8", change: "+0.4", trend: "up" as const },
  { label: "TOI", value: "1.2 hari", change: "-0.2", trend: "down" as const },
];

const getKPIIcon = (label: string) => {
  switch (label) {
    case "Total Pasien": return Users;
    case "Pendapatan": return DollarSign;
    case "BOR": return Bed;
    case "ALOS": return Clock;
    case "BTO": return TrendingUp;
    case "TOI": return Activity;
    default: return Activity;
  }
};

export default function DashboardExecutive() {
  const { data: kpis, isLoading: loadingKPIs } = useExecutiveKPIs();
  const { data: revenueData, isLoading: loadingRevenue } = useRevenueData();
  const { data: visitData, isLoading: loadingVisits } = useVisitTrends();
  const { data: paymentDist, isLoading: loadingPayment } = usePaymentDistribution();
  const { data: bedOccupancy, isLoading: loadingBeds } = useBedOccupancyByClass();
  const { data: deptPerformance, isLoading: loadingDepts } = useDepartmentPerformance();

  // Use real data or fallback
  const kpiData = kpis && kpis.length > 0 ? kpis : fallbackKPIs;
  const revenue = revenueData && revenueData.some(r => r.revenue > 0) ? revenueData : fallbackRevenueData;
  const visits = visitData && visitData.some(v => v.rawat_jalan > 0 || v.igd > 0) ? visitData : fallbackVisitData;
  const beds = bedOccupancy && bedOccupancy.length > 0 ? bedOccupancy : fallbackBedOccupancy;
  const payments = paymentDist || [
    { name: "BPJS", value: 65, color: "#22c55e" },
    { name: "Umum", value: 25, color: "#3b82f6" },
    { name: "Asuransi", value: 10, color: "#f59e0b" },
  ];
  const departments = deptPerformance || [
    { name: "Poli Umum", visits: 580, revenue: 145, satisfaction: 92 },
    { name: "Poli Gigi", visits: 320, revenue: 98, satisfaction: 88 },
    { name: "Poli Anak", visits: 420, revenue: 125, satisfaction: 95 },
    { name: "Poli Kandungan", visits: 280, revenue: 156, satisfaction: 90 },
    { name: "Poli Jantung", visits: 180, revenue: 210, satisfaction: 87 },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Executive Dashboard</h1>
          <p className="text-muted-foreground">Ringkasan performa dan KPI Rumah Sakit</p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="month">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Minggu Ini</SelectItem>
              <SelectItem value="month">Bulan Ini</SelectItem>
              <SelectItem value="quarter">Kuartal Ini</SelectItem>
              <SelectItem value="year">Tahun Ini</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {loadingKPIs ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <Card key={idx}>
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))
        ) : (
          kpiData.map((metric, idx) => {
            const Icon = getKPIIcon(metric.label);
            return (
              <Card key={idx}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <Badge 
                      variant="outline" 
                      className={metric.trend === "up" ? "text-green-600 bg-green-50" : "text-blue-600 bg-blue-50"}
                    >
                      {metric.trend === "up" ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                      {metric.change}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Main Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pendapatan vs Target
            </CardTitle>
            <CardDescription>Dalam jutaan rupiah</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingRevenue ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenue}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                    formatter={(value: number) => [`Rp ${value}jt`, ""]}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="target" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted))" name="Target" />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.3)" name="Realisasi" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Visit Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Tren Kunjungan Pasien
            </CardTitle>
            <CardDescription>Per kategori layanan</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingVisits ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={visits}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Legend />
                  <Bar dataKey="rawat_jalan" fill="hsl(var(--primary))" name="Rawat Jalan" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="igd" fill="hsl(var(--destructive))" name="IGD" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="rawat_inap" fill="hsl(var(--success))" name="Rawat Inap" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Payment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribusi Pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPayment ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={payments}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {payments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value}%`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-4">
                  {payments.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm">{item.name} ({item.value}%)</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Bed Occupancy */}
        <Card>
          <CardHeader>
            <CardTitle>Okupansi Tempat Tidur</CardTitle>
            <CardDescription>Per kelas kamar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingBeds ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))
            ) : (
              beds.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{item.class}</span>
                    <span className="text-muted-foreground">{item.occupied}/{item.total} ({item.rate}%)</span>
                  </div>
                  <Progress value={item.rate} className="h-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Indikator Cepat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-success" />
                <div>
                  <p className="font-medium">Kepuasan Pasien</p>
                  <p className="text-xs text-muted-foreground">Rata-rata bulan ini</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-success">91%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Target Tercapai</p>
                  <p className="text-xs text-muted-foreground">6 dari 8 KPI</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-primary">75%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-warning/10 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-medium">Stok Kritis</p>
                  <p className="text-xs text-muted-foreground">Perlu restock</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-warning">12</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Performa Departemen
          </CardTitle>
          <CardDescription>Bulan ini</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingDepts ? (
            <Skeleton className="h-[200px] w-full" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Departemen</th>
                    <th className="text-right py-3 px-4 font-medium">Kunjungan</th>
                    <th className="text-right py-3 px-4 font-medium">Pendapatan (jt)</th>
                    <th className="text-right py-3 px-4 font-medium">Kepuasan</th>
                    <th className="py-3 px-4 font-medium">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="py-3 px-4 font-medium">{dept.name}</td>
                      <td className="text-right py-3 px-4">{dept.visits.toLocaleString()}</td>
                      <td className="text-right py-3 px-4">Rp {dept.revenue}</td>
                      <td className="text-right py-3 px-4">
                        <Badge variant={dept.satisfaction >= 90 ? "default" : "secondary"}>
                          {dept.satisfaction}%
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-24 h-8">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={[{ v: 20 }, { v: 35 }, { v: 28 }, { v: 45 }, { v: 38 }, { v: 52 }]}>
                              <Line type="monotone" dataKey="v" stroke="hsl(var(--success))" strokeWidth={2} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

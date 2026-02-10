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

  // Use real data only - no fallbacks
  const kpiData = kpis || [];
  const revenue = revenueData || [];
  const visits = visitData || [];
  const beds = bedOccupancy || [];
  const payments = paymentDist || [];
  const departments = deptPerformance || [];

  const hasKPIData = kpiData.length > 0;
  const hasRevenueData = revenue.length > 0;
  const hasVisitData = visits.length > 0;
  const hasBedData = beds.length > 0;
  const hasPaymentData = payments.length > 0;
  const hasDeptData = departments.length > 0;

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
        ) : hasKPIData ? (
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
                  <p className="text-2xl font-bold truncate" title={metric.value}>{metric.value}</p>
                  <p className="text-xs text-muted-foreground truncate">{metric.label}</p>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="md:col-span-3 lg:col-span-6">
            <CardContent className="pt-6 text-center text-muted-foreground">
              Belum ada data KPI. Data akan muncul setelah ada transaksi.
            </CardContent>
          </Card>
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
            ) : hasRevenueData ? (
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
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Belum ada data pendapatan
              </div>
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
            ) : hasVisitData ? (
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
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Belum ada data kunjungan
              </div>
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
            ) : hasPaymentData ? (
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
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Belum ada data pembayaran
              </div>
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
            ) : hasBedData ? (
              beds.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{item.class}</span>
                    <span className="text-muted-foreground">{item.occupied}/{item.total} ({item.rate}%)</span>
                  </div>
                  <Progress value={item.rate} className="h-2" />
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Belum ada data tempat tidur
              </div>
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
              <span className="text-2xl font-bold text-success">-</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Target Tercapai</p>
                  <p className="text-xs text-muted-foreground">KPI tercapai</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-primary">-</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-warning/10 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-medium">Stok Kritis</p>
                  <p className="text-xs text-muted-foreground">Perlu restock</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-warning">-</span>
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
          ) : hasDeptData ? (
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
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Belum ada data performa departemen
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

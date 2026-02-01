import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { FileText, Download, TrendingUp, Activity } from "lucide-react";
import { useSurgeryData } from "@/hooks/useSurgeryData";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns";
import { id } from "date-fns/locale";

export function SurgeryReports() {
  const { surgeries } = useSurgeryData();
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));

  // Filter surgeries by date range
  const filteredSurgeries = surgeries.filter((s) => {
    const surgeryDate = s.scheduled_date;
    return surgeryDate >= dateFrom && surgeryDate <= dateTo;
  });

  // Statistics
  const stats = {
    total: filteredSurgeries.length,
    completed: filteredSurgeries.filter(s => s.status === 'completed').length,
    cancelled: filteredSurgeries.filter(s => s.status === 'cancelled').length,
    elective: filteredSurgeries.filter(s => s.procedure_type === 'elective').length,
    emergency: filteredSurgeries.filter(s => s.procedure_type === 'emergency').length,
    urgent: filteredSurgeries.filter(s => s.procedure_type === 'urgent').length,
  };

  // Data for procedure type pie chart
  const procedureTypeData = [
    { name: 'Elektif', value: stats.elective, color: '#3b82f6' },
    { name: 'Cito', value: stats.emergency, color: '#ef4444' },
    { name: 'Urgent', value: stats.urgent, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  // Data for status pie chart
  const statusData = [
    { name: 'Selesai', value: stats.completed, color: '#22c55e' },
    { name: 'Dibatalkan', value: stats.cancelled, color: '#ef4444' },
    { name: 'Lainnya', value: stats.total - stats.completed - stats.cancelled, color: '#94a3b8' },
  ].filter(d => d.value > 0);

  // Daily surgery count for bar chart
  const getDailyCounts = () => {
    const days = eachDayOfInterval({
      start: parseISO(dateFrom),
      end: parseISO(dateTo),
    }).slice(0, 31); // Limit to 31 days

    return days.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const count = filteredSurgeries.filter(s => s.scheduled_date === dateStr).length;
      return {
        date: format(day, "dd MMM", { locale: id }),
        jumlah: count,
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Laporan Operasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-sm text-muted-foreground">Dari Tanggal</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-40"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Sampai Tanggal</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-40"
              />
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Operasi</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <Activity className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Selesai</p>
                <p className="text-3xl font-bold text-success">{stats.completed}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dibatalkan</p>
                <p className="text-3xl font-bold text-destructive">{stats.cancelled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tingkat Keberhasilan</p>
                <p className="text-3xl font-bold">
                  {stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Daily Surgery Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Jumlah Operasi per Hari</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getDailyCounts()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="jumlah" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Procedure Type Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Berdasarkan Tipe Prosedur</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {procedureTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={procedureTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {procedureTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Tidak ada data
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Pie Chart */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Berdasarkan Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Tidak ada data
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

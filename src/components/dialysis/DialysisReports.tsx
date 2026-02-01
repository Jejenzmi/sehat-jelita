import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDialysisStatistics, useWeeklyDialysisSessions, useDialysisAdequacy } from "@/hooks/useDialysisData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export function DialysisReports() {
  const { data: stats, isLoading: loadingStats } = useDialysisStatistics();
  const { data: weeklyData, isLoading: loadingWeekly } = useWeeklyDialysisSessions();
  const { data: adequacyData, isLoading: loadingAdequacy } = useDialysisAdequacy();

  // Use real data or empty fallback
  const chartWeeklyData = weeklyData || [];
  const chartAdequacyData = adequacyData || [
    { name: "Kt/V ≥ 1.2", value: 0, color: "hsl(var(--primary))" },
    { name: "Kt/V < 1.2", value: 0, color: "hsl(var(--muted))" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Weekly Sessions Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Sesi per Hari (Minggu Ini)</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingWeekly ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartWeeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Adequacy Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Adequacy (Kt/V)</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAdequacy ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartAdequacyData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {chartAdequacyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-4">
                  {chartAdequacyData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm">{item.name}: {item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Bulan Ini</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingStats ? (
            <div className="grid gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold">{stats?.monthlyTotal || 0}</div>
                <div className="text-sm text-muted-foreground">Total Sesi</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold">{stats?.avgKtV || "0.00"}</div>
                <div className="text-sm text-muted-foreground">Rata-rata Kt/V</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold">{stats?.totalMachines || 0}</div>
                <div className="text-sm text-muted-foreground">Mesin Aktif</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold">{stats?.todayCompleted || 0}</div>
                <div className="text-sm text-muted-foreground">Sesi Hari Ini</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

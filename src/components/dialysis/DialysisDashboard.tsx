import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDialysisStatistics, useTodayDialysisSessions } from "@/hooks/useDialysisData";
import { Activity, Clock, CheckCircle, Cpu, TrendingUp } from "lucide-react";

export function DialysisDashboard() {
  const { data: stats, isLoading: loadingStats } = useDialysisStatistics();
  const { data: todaySessions, isLoading: loadingSessions } = useTodayDialysisSessions();

  if (loadingStats) {
    return <div className="text-center py-8">Memuat data...</div>;
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="outline">Terjadwal</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500">Berlangsung</Badge>;
      case "completed":
        return <Badge className="bg-green-500">Selesai</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Dibatalkan</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mesin HD</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMachines || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.availableMachines} tersedia, {stats?.inUseMachines} digunakan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sesi Hari Ini</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.todayScheduled || 0) + (stats?.todayInProgress || 0) + (stats?.todayCompleted || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.todayInProgress} berlangsung
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selesai Hari Ini</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayCompleted || 0}</div>
            <p className="text-xs text-muted-foreground">
              sesi selesai
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Kt/V</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgKtV || "0.00"}</div>
            <p className="text-xs text-muted-foreground">
              bulan ini ({stats?.monthlyTotal} sesi)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Sesi Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingSessions ? (
            <div className="text-center py-4">Memuat...</div>
          ) : todaySessions?.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Tidak ada sesi terjadwal hari ini
            </div>
          ) : (
            <div className="space-y-3">
              {todaySessions?.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <div className="font-medium">{session.patients?.full_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {session.session_number} • Mesin: {session.dialysis_machines?.machine_number || "-"}
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(session.status)}
                    <div className="text-sm text-muted-foreground mt-1">
                      {session.scheduled_time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

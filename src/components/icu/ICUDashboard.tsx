import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useICUStatistics, useActiveICUPatients } from "@/hooks/useICUData";
import { Activity, BedDouble, Heart, Wind, Users, AlertTriangle } from "lucide-react";

export function ICUDashboard() {
  const { data: stats, isLoading: loadingStats } = useICUStatistics();
  const { data: activePatients, isLoading: loadingPatients } = useActiveICUPatients();

  if (loadingStats) {
    return <div className="text-center py-8">Memuat data...</div>;
  }

  const icuTypeLabels: Record<string, string> = {
    icu: "ICU",
    iccu: "ICCU",
    nicu: "NICU",
    picu: "PICU",
    hcu: "HCU",
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tempat Tidur</CardTitle>
            <BedDouble className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBeds || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.availableBeds} tersedia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pasien Aktif</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activePatients || 0}</div>
            <p className="text-xs text-muted-foreground">
              Occupancy: {stats?.occupancyRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventilator Aktif</CardTitle>
            <Wind className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.ventilatorInUse || 0}</div>
            <p className="text-xs text-muted-foreground">
              Pasien dengan ventilator
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bed Terisi</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.occupiedBeds || 0}</div>
            <p className="text-xs text-muted-foreground">
              dari {stats?.totalBeds} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bed Status by Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BedDouble className="h-5 w-5" />
            Status Tempat Tidur per Unit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            {stats?.byType && Object.entries(stats.byType).map(([type, data]) => (
              <div key={type} className="p-4 rounded-lg border bg-card">
                <div className="text-lg font-bold text-center">{icuTypeLabels[type]}</div>
                <div className="flex justify-center gap-2 mt-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    {data.total - data.occupied} kosong
                  </Badge>
                  <Badge variant="outline" className="bg-red-50 text-red-700">
                    {data.occupied} terisi
                  </Badge>
                </div>
                <div className="text-center text-sm text-muted-foreground mt-1">
                  Total: {data.total}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Patients */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Pasien Aktif
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingPatients ? (
            <div className="text-center py-4">Memuat...</div>
          ) : activePatients?.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Tidak ada pasien aktif
            </div>
          ) : (
            <div className="space-y-3">
              {activePatients?.slice(0, 5).map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <div className="font-medium">{patient.patients?.full_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {patient.patients?.medical_record_number} • {patient.icu_beds?.bed_number}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge>{icuTypeLabels[patient.icu_type] || patient.icu_type}</Badge>
                    {patient.icu_beds?.has_ventilator && (
                      <Badge variant="outline" className="ml-2">
                        <Wind className="h-3 w-3 mr-1" />
                        Ventilator
                      </Badge>
                    )}
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

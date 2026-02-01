import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Pause, 
  Stethoscope,
  Timer,
  Users
} from "lucide-react";
import { useSurgeryData } from "@/hooks/useSurgeryData";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export function SurgeryDashboard() {
  const { todaySurgeries, operatingRooms, stats, isLoading, updateSurgeryStatus } = useSurgeryData();

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      scheduled: { label: "Terjadwal", variant: "secondary" },
      preparation: { label: "Persiapan", variant: "outline" },
      in_progress: { label: "Berlangsung", variant: "default" },
      completed: { label: "Selesai", variant: "secondary" },
      cancelled: { label: "Dibatalkan", variant: "destructive" },
      postponed: { label: "Ditunda", variant: "outline" },
    };
    const config = statusConfig[status] || { label: status, variant: "secondary" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleStatusChange = (surgeryId: string, newStatus: 'preparation' | 'in_progress' | 'completed') => {
    updateSurgeryStatus.mutate({ id: surgeryId, status: newStatus });
  };

  if (isLoading) {
    return <div className="text-center py-8">Memuat data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Operasi Hari Ini</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalToday}</div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(), "EEEE, dd MMMM yyyy", { locale: id })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sedang Berlangsung</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">operasi aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selesai</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">dari {stats.totalToday} jadwal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ruang OK Tersedia</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.availableRooms}</div>
            <p className="text-xs text-muted-foreground">dari {operatingRooms.length} ruang</p>
          </CardContent>
        </Card>
      </div>

      {/* Operating Room Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Status Ruang Operasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {operatingRooms.map((room) => {
              const activeOperation = todaySurgeries.find(
                s => s.operating_room_id === room.id && s.status === 'in_progress'
              );
              
              return (
                <Card key={room.id} className={activeOperation ? "border-primary" : ""}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">{room.room_number}</p>
                        <p className="text-sm text-muted-foreground">{room.name}</p>
                      </div>
                      <Badge variant={activeOperation ? "default" : room.is_available ? "outline" : "secondary"}>
                        {activeOperation ? "Aktif" : room.is_available ? "Tersedia" : "Tidak Tersedia"}
                      </Badge>
                    </div>
                    {activeOperation && (
                      <div className="mt-3 p-2 bg-muted rounded-md text-sm">
                        <p className="font-medium">{activeOperation.patient?.full_name}</p>
                        <p className="text-muted-foreground">{activeOperation.procedure_name}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Today's Surgery List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Jadwal Operasi Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todaySurgeries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada jadwal operasi hari ini
            </div>
          ) : (
            <div className="space-y-4">
              {todaySurgeries.map((surgery) => (
                <div
                  key={surgery.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <p className="text-lg font-bold">
                        {surgery.scheduled_start_time.slice(0, 5)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {surgery.operating_room?.room_number}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">{surgery.patient?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {surgery.patient?.medical_record_number} • {surgery.procedure_name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {surgery.preoperative_diagnosis}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(surgery.status)}
                    {surgery.status === 'scheduled' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStatusChange(surgery.id, 'preparation')}
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Persiapan
                      </Button>
                    )}
                    {surgery.status === 'preparation' && (
                      <Button 
                        size="sm"
                        onClick={() => handleStatusChange(surgery.id, 'in_progress')}
                      >
                        <Activity className="h-4 w-4 mr-1" />
                        Mulai
                      </Button>
                    )}
                    {surgery.status === 'in_progress' && (
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => handleStatusChange(surgery.id, 'completed')}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Selesai
                      </Button>
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

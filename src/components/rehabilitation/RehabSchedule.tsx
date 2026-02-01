import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Check, X } from "lucide-react";
import { useRehabilitationData } from "@/hooks/useRehabilitationData";

export function RehabSchedule() {
  const { todaySessions, allSessions, loadingSessions, updateSessionStatus } = useRehabilitationData();

  if (loadingSessions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Jadwal Terapi Hari Ini</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600">Selesai</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-600">Berlangsung</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Batal</Badge>;
      case "no_show":
        return <Badge variant="secondary">Tidak Hadir</Badge>;
      default:
        return <Badge variant="outline">Terjadwal</Badge>;
    }
  };

  const handleStatusChange = (id: string, status: string) => {
    updateSessionStatus.mutate({ id, status });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Jadwal Terapi Hari Ini</CardTitle>
        </CardHeader>
        <CardContent>
          {todaySessions && todaySessions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Pasien</TableHead>
                  <TableHead>Jenis Terapi</TableHead>
                  <TableHead>Durasi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todaySessions.map((session: any) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-mono">
                      {session.scheduled_time?.slice(0, 5) || "-"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {session.patients?.full_name || "-"}
                    </TableCell>
                    <TableCell>{session.therapy_name}</TableCell>
                    <TableCell>
                      {session.therapy_types?.duration_minutes || session.duration_minutes || 30} menit
                    </TableCell>
                    <TableCell>{getStatusBadge(session.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {session.status === "scheduled" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(session.id, "in_progress")}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                        )}
                        {session.status === "in_progress" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(session.id, "completed")}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        {session.status === "scheduled" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(session.id, "cancelled")}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada jadwal terapi hari ini
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Jadwal Mendatang</CardTitle>
        </CardHeader>
        <CardContent>
          {allSessions && allSessions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Pasien</TableHead>
                  <TableHead>Jenis Terapi</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allSessions.slice(0, 10).map((session: any) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      {new Date(session.scheduled_date).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell className="font-mono">
                      {session.scheduled_time?.slice(0, 5) || "-"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {session.patients?.full_name || "-"}
                    </TableCell>
                    <TableCell>{session.therapy_name}</TableCell>
                    <TableCell>{getStatusBadge(session.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada jadwal terapi mendatang
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

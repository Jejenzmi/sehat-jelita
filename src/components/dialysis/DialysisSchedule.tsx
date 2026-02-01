import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDialysisSessions } from "@/hooks/useDialysisData";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export function DialysisSchedule() {
  const { data: sessions, isLoading } = useDialysisSessions();

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
      case "missed":
        return <Badge variant="secondary">Tidak Hadir</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Memuat jadwal...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Jadwal Sesi Hemodialisa</CardTitle>
      </CardHeader>
      <CardContent>
        {sessions?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Tidak ada sesi terjadwal
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Sesi</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead>Pasien</TableHead>
                <TableHead>Mesin</TableHead>
                <TableHead>Durasi</TableHead>
                <TableHead>Kt/V</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions?.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">{session.session_number}</TableCell>
                  <TableCell>
                    {format(new Date(session.session_date), "dd MMM yyyy", { locale: id })}
                  </TableCell>
                  <TableCell>{session.scheduled_time || "-"}</TableCell>
                  <TableCell>
                    <div>{session.patients?.full_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {session.patients?.medical_record_number}
                    </div>
                  </TableCell>
                  <TableCell>
                    {session.dialysis_machines?.machine_number || "-"}
                    {session.dialysis_machines?.brand && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({session.dialysis_machines.brand})
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {session.duration_actual || session.duration_planned || "-"} menit
                  </TableCell>
                  <TableCell>
                    {session.kt_v ? (
                      <Badge variant={Number(session.kt_v) >= 1.2 ? "default" : "destructive"}>
                        {session.kt_v}
                      </Badge>
                    ) : "-"}
                  </TableCell>
                  <TableCell>{getStatusBadge(session.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

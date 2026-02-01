import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useForensicData } from "@/hooks/useForensicData";

export function DeathCertificates() {
  const { deathCertificates, loadingCertificates } = useForensicData();

  if (loadingCertificates) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sertifikat Kematian</CardTitle>
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
      case "issued":
        return <Badge className="bg-green-600">Diterbitkan</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Dibatalkan</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sertifikat Kematian</CardTitle>
      </CardHeader>
      <CardContent>
        {deathCertificates && deathCertificates.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Sertifikat</TableHead>
                <TableHead>Nama Almarhum</TableHead>
                <TableHead>Tgl. Kematian</TableHead>
                <TableHead>Penyebab</TableHead>
                <TableHead>Dokter</TableHead>
                <TableHead>Izin Makam</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deathCertificates.map((cert: any) => (
                <TableRow key={cert.id}>
                  <TableCell className="font-mono text-sm">
                    {cert.certificate_number}
                  </TableCell>
                  <TableCell className="font-medium">
                    {cert.deceased_name}
                  </TableCell>
                  <TableCell>
                    {new Date(cert.date_of_death).toLocaleDateString("id-ID")}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {cert.immediate_cause || "-"}
                  </TableCell>
                  <TableCell>
                    {cert.doctors?.full_name || cert.certifying_doctor_name || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={cert.burial_permit_issued ? "default" : "outline"}>
                      {cert.burial_permit_issued ? "Ya" : "Belum"}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(cert.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Tidak ada sertifikat kematian
          </div>
        )}
      </CardContent>
    </Card>
  );
}

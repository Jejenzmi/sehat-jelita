import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useForensicData } from "@/hooks/useForensicData";

export function VisumReports() {
  const { visumReports, loadingVisums } = useForensicData();

  if (loadingVisums) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Visum et Repertum</CardTitle>
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
      case "finalized":
        return <Badge className="bg-green-600">Final</Badge>;
      case "submitted":
        return <Badge className="bg-blue-600">Diserahkan</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visum et Repertum</CardTitle>
      </CardHeader>
      <CardContent>
        {visumReports && visumReports.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Visum</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Pasien/Korban</TableHead>
                <TableHead>Pemohon</TableHead>
                <TableHead>Pemeriksa</TableHead>
                <TableHead>Tgl. Pemeriksaan</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visumReports.map((visum: any) => (
                <TableRow key={visum.id}>
                  <TableCell className="font-mono text-sm">
                    {visum.visum_number}
                  </TableCell>
                  <TableCell>
                    <Badge variant={visum.visum_type === "living" ? "default" : "secondary"}>
                      {visum.visum_type === "living" ? "Hidup" : "Jenazah"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {visum.patients?.full_name || "-"}
                  </TableCell>
                  <TableCell>{visum.requesting_authority || "-"}</TableCell>
                  <TableCell>
                    {visum.doctors?.full_name || visum.examiner_name || "-"}
                  </TableCell>
                  <TableCell>
                    {visum.examination_date
                      ? new Date(visum.examination_date).toLocaleDateString("id-ID")
                      : "-"}
                  </TableCell>
                  <TableCell>{getStatusBadge(visum.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Tidak ada laporan visum
          </div>
        )}
      </CardContent>
    </Card>
  );
}

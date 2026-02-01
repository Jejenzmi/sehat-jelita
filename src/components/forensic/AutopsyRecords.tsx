import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useForensicData } from "@/hooks/useForensicData";

export function AutopsyRecords() {
  const { autopsyRecords, loadingAutopsies } = useForensicData();

  if (loadingAutopsies) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Catatan Otopsi</CardTitle>
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
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Catatan Otopsi</CardTitle>
      </CardHeader>
      <CardContent>
        {autopsyRecords && autopsyRecords.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Otopsi</TableHead>
                <TableHead>No. Kasus</TableHead>
                <TableHead>Almarhum</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Patologis</TableHead>
                <TableHead>Tgl. Otopsi</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {autopsyRecords.map((autopsy: any) => (
                <TableRow key={autopsy.id}>
                  <TableCell className="font-mono text-sm">
                    {autopsy.autopsy_number}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {autopsy.mortuary_cases?.case_number || "-"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {autopsy.mortuary_cases?.deceased_name || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {autopsy.autopsy_type === "full" ? "Lengkap" :
                       autopsy.autopsy_type === "limited" ? "Terbatas" : "Eksternal"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {autopsy.doctors?.full_name || autopsy.pathologist_name || "-"}
                  </TableCell>
                  <TableCell>
                    {autopsy.autopsy_date
                      ? new Date(autopsy.autopsy_date).toLocaleDateString("id-ID")
                      : "-"}
                  </TableCell>
                  <TableCell>{getStatusBadge(autopsy.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Tidak ada catatan otopsi
          </div>
        )}
      </CardContent>
    </Card>
  );
}

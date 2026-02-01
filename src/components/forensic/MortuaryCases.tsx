import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useForensicData } from "@/hooks/useForensicData";

export function MortuaryCases() {
  const { mortuaryCases, loadingCases, releaseBody } = useForensicData();

  if (loadingCases) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daftar Kasus Kamar Jenazah</CardTitle>
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
      case "released":
        return <Badge variant="secondary">Diserahkan</Badge>;
      case "autopsy_pending":
        return <Badge className="bg-amber-600">Otopsi Pending</Badge>;
      case "autopsy_complete":
        return <Badge className="bg-blue-600">Otopsi Selesai</Badge>;
      default:
        return <Badge variant="outline">Diterima</Badge>;
    }
  };

  const getCaseTypeBadge = (caseType: string) => {
    const colors: Record<string, string> = {
      natural: "bg-gray-100 text-gray-800",
      accident: "bg-orange-100 text-orange-800",
      suicide: "bg-red-100 text-red-800",
      homicide: "bg-red-200 text-red-900",
      undetermined: "bg-yellow-100 text-yellow-800",
      pending: "bg-gray-100 text-gray-600",
    };
    return colors[caseType] || "bg-gray-100 text-gray-800";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Kasus Kamar Jenazah</CardTitle>
      </CardHeader>
      <CardContent>
        {mortuaryCases && mortuaryCases.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Kasus</TableHead>
                <TableHead>Nama Almarhum</TableHead>
                <TableHead>Tgl. Masuk</TableHead>
                <TableHead>Jenis Kasus</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mortuaryCases.map((case_: any) => (
                <TableRow key={case_.id}>
                  <TableCell className="font-mono text-sm">
                    {case_.case_number}
                  </TableCell>
                  <TableCell className="font-medium">
                    {case_.deceased_name}
                  </TableCell>
                  <TableCell>
                    {new Date(case_.admission_date).toLocaleDateString("id-ID")}
                  </TableCell>
                  <TableCell>
                    <Badge className={getCaseTypeBadge(case_.case_type)}>
                      {case_.case_type === "natural" ? "Alamiah" :
                       case_.case_type === "accident" ? "Kecelakaan" :
                       case_.case_type === "suicide" ? "Bunuh Diri" :
                       case_.case_type === "homicide" ? "Pembunuhan" :
                       case_.case_type === "undetermined" ? "Belum Ditentukan" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>{case_.storage_location || "-"}</TableCell>
                  <TableCell>{getStatusBadge(case_.status)}</TableCell>
                  <TableCell>
                    {case_.status !== "released" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => releaseBody.mutate({
                          id: case_.id,
                          releasedTo: "Keluarga",
                          releasedBy: "Petugas"
                        })}
                      >
                        Serahkan
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Tidak ada kasus kamar jenazah
          </div>
        )}
      </CardContent>
    </Card>
  );
}

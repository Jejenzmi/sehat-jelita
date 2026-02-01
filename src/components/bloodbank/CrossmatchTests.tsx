import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCrossmatchTests } from "@/hooks/useBloodBankData";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CheckCircle, XCircle, Clock } from "lucide-react";

export function CrossmatchTests() {
  const { data: tests, isLoading } = useCrossmatchTests();

  const getResultIcon = (result: string | null) => {
    switch (result) {
      case "compatible":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "incompatible":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getResultBadge = (result: string | null) => {
    switch (result) {
      case "compatible":
        return <Badge className="bg-green-500">Compatible</Badge>;
      case "incompatible":
        return <Badge variant="destructive">Incompatible</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Memuat data crossmatch...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hasil Crossmatch</CardTitle>
      </CardHeader>
      <CardContent>
        {tests?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Tidak ada data crossmatch
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal Test</TableHead>
                <TableHead>Pasien</TableHead>
                <TableHead>No. Kantong</TableHead>
                <TableHead>Gol. Darah</TableHead>
                <TableHead>Major CM</TableHead>
                <TableHead>Minor CM</TableHead>
                <TableHead>Hasil</TableHead>
                <TableHead>Valid Sampai</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tests?.map((test) => (
                <TableRow key={test.id}>
                  <TableCell>
                    {format(new Date(test.test_date), "dd MMM yyyy HH:mm", { locale: id })}
                  </TableCell>
                  <TableCell>{test.patients?.full_name}</TableCell>
                  <TableCell className="font-medium">
                    {test.blood_inventory?.bag_number}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-bold">
                      {test.blood_inventory?.blood_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getResultIcon(test.major_crossmatch)}
                      <span className="text-sm capitalize">{test.major_crossmatch}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getResultIcon(test.minor_crossmatch)}
                      <span className="text-sm capitalize">{test.minor_crossmatch}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {test.is_compatible !== null ? (
                      test.is_compatible ? (
                        <Badge className="bg-green-500">Compatible</Badge>
                      ) : (
                        <Badge variant="destructive">Incompatible</Badge>
                      )
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {test.valid_until
                      ? format(new Date(test.valid_until), "dd MMM yyyy HH:mm", { locale: id })
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

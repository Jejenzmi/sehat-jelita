import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import { useNutritionData } from "@/hooks/useNutritionData";

export function NutritionAllergies() {
  const { foodAllergies, loadingAllergies } = useNutritionData();

  if (loadingAllergies) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daftar Alergi Makanan</CardTitle>
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

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "severe":
        return <Badge variant="destructive">Parah</Badge>;
      case "moderate":
        return <Badge className="bg-orange-500">Sedang</Badge>;
      case "mild":
        return <Badge variant="secondary">Ringan</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <CardTitle>Daftar Alergi Makanan</CardTitle>
      </CardHeader>
      <CardContent>
        {foodAllergies && foodAllergies.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. RM</TableHead>
                <TableHead>Nama Pasien</TableHead>
                <TableHead>Alergen</TableHead>
                <TableHead>Tingkat</TableHead>
                <TableHead>Reaksi</TableHead>
                <TableHead>Tanggal Diagnosis</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {foodAllergies.map((allergy: any) => (
                <TableRow key={allergy.id}>
                  <TableCell className="font-mono text-sm">
                    {allergy.patients?.medical_record_number || "-"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {allergy.patients?.full_name || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      {allergy.allergen}
                    </Badge>
                  </TableCell>
                  <TableCell>{getSeverityBadge(allergy.severity)}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {allergy.reaction_description || "-"}
                  </TableCell>
                  <TableCell>
                    {allergy.diagnosed_date
                      ? new Date(allergy.diagnosed_date).toLocaleDateString("id-ID")
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Belum ada data alergi makanan tercatat
          </div>
        )}
      </CardContent>
    </Card>
  );
}

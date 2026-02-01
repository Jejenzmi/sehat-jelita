import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useNutritionData } from "@/hooks/useNutritionData";

export function NutritionPatientList() {
  const { patientDiets, loadingPatientDiets } = useNutritionData();

  if (loadingPatientDiets) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pasien dengan Diet Khusus</CardTitle>
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

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      diabetes: "bg-orange-100 text-orange-800",
      renal: "bg-purple-100 text-purple-800",
      cardiac: "bg-red-100 text-red-800",
      low_sodium: "bg-blue-100 text-blue-800",
      high_protein: "bg-green-100 text-green-800",
      regular: "bg-gray-100 text-gray-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pasien dengan Diet Khusus</CardTitle>
      </CardHeader>
      <CardContent>
        {patientDiets && patientDiets.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. RM</TableHead>
                <TableHead>Nama Pasien</TableHead>
                <TableHead>Jenis Diet</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Instruksi Khusus</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patientDiets.map((diet: any) => (
                <TableRow key={diet.id}>
                  <TableCell className="font-mono text-sm">
                    {diet.patients?.medical_record_number || "-"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {diet.patients?.full_name || "-"}
                  </TableCell>
                  <TableCell>{diet.diet_name}</TableCell>
                  <TableCell>
                    <Badge className={getCategoryBadge(diet.diet_types?.category || "regular")}>
                      {diet.diet_types?.name || diet.diet_name}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {diet.special_instructions || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={diet.status === "active" ? "default" : "secondary"}>
                      {diet.status === "active" ? "Aktif" : "Selesai"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Belum ada pasien dengan diet khusus
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNutritionData } from "@/hooks/useNutritionData";

export function NutritionReports() {
  const { dietTypes, mealRecords } = useNutritionData();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Distribusi Jenis Diet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dietTypes?.map((diet) => (
              <div key={diet.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{diet.name}</p>
                  <p className="text-xs text-muted-foreground">{diet.description}</p>
                </div>
                <span className="text-sm font-medium">{diet.calories_target} kal</span>
              </div>
            )) || (
              <p className="text-muted-foreground text-center py-4">Memuat data...</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Statistik Konsumsi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Tingkat Konsumsi Rata-rata</span>
              <span className="text-lg font-bold text-green-600">85%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Pasien Nafsu Makan Baik</span>
              <span className="text-lg font-bold">72%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Memerlukan Bantuan Makan</span>
              <span className="text-lg font-bold text-orange-600">15%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Total Kalori Tersaji Hari Ini</span>
              <span className="text-lg font-bold">45,000 kal</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

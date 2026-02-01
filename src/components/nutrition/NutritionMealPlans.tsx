import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNutritionData } from "@/hooks/useNutritionData";
import { UtensilsCrossed, Coffee, Sun, Moon } from "lucide-react";

export function NutritionMealPlans() {
  const { todayMealPlans, loadingMealPlans } = useNutritionData();

  if (loadingMealPlans) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const mealTypes = [
    { type: "breakfast", label: "Sarapan", icon: Coffee, time: "06:00 - 08:00" },
    { type: "lunch", label: "Makan Siang", icon: Sun, time: "11:00 - 13:00" },
    { type: "dinner", label: "Makan Malam", icon: Moon, time: "17:00 - 19:00" },
  ];

  const getMealsByType = (type: string) => {
    return todayMealPlans?.filter((m: any) => m.meal_type === type) || [];
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mealTypes.map(({ type, label, icon: Icon, time }) => {
          const meals = getMealsByType(type);
          return (
            <Card key={type}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">{label}</CardTitle>
                  <p className="text-sm text-muted-foreground">{time}</p>
                </div>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {meals.length > 0 ? (
                  <div className="space-y-3">
                    {meals.slice(0, 5).map((meal: any) => (
                      <div key={meal.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                        <div>
                          <p className="font-medium text-sm">
                            {meal.patient_diets?.patients?.full_name || "Pasien"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {meal.patient_diets?.diet_name}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {meal.calories_planned || 0} kal
                        </Badge>
                      </div>
                    ))}
                    {meals.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{meals.length - 5} lainnya
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <UtensilsCrossed className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Belum ada jadwal</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Menu Hari Ini</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{todayMealPlans?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Total Porsi</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">
                {todayMealPlans?.reduce((sum: number, m: any) => sum + (m.calories_planned || 0), 0) || 0}
              </p>
              <p className="text-sm text-muted-foreground">Total Kalori</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">8</p>
              <p className="text-sm text-muted-foreground">Jenis Diet</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">3</p>
              <p className="text-sm text-muted-foreground">Waktu Makan</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

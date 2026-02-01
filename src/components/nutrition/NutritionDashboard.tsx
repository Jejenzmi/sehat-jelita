import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Utensils, AlertTriangle, Calendar, TrendingUp, Plus } from "lucide-react";
import { useNutritionData } from "@/hooks/useNutritionData";
import { NutritionPatientList } from "./NutritionPatientList";
import { NutritionMealPlans } from "./NutritionMealPlans";
import { NutritionAllergies } from "./NutritionAllergies";
import { NutritionReports } from "./NutritionReports";

export function NutritionDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { patientDiets, foodAllergies, todayMealPlans, loadingPatientDiets } = useNutritionData();

  const activeDiets = patientDiets?.length || 0;
  const totalAllergies = foodAllergies?.length || 0;
  const mealsToday = todayMealPlans?.length || 0;
  const breakfastMeals = todayMealPlans?.filter(m => m.meal_type === 'breakfast').length || 0;
  const lunchMeals = todayMealPlans?.filter(m => m.meal_type === 'lunch').length || 0;
  const dinnerMeals = todayMealPlans?.filter(m => m.meal_type === 'dinner').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Instalasi Gizi</h1>
          <p className="text-muted-foreground">Manajemen diet, alergi makanan, dan perencanaan menu</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Diet Pasien
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Diet Aktif</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDiets}</div>
            <p className="text-xs text-muted-foreground">Pasien dengan diet khusus</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Alergi Makanan</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAllergies}</div>
            <p className="text-xs text-muted-foreground">Pasien dengan alergi tercatat</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Menu Hari Ini</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mealsToday}</div>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline" className="text-xs">Pagi: {breakfastMeals}</Badge>
              <Badge variant="outline" className="text-xs">Siang: {lunchMeals}</Badge>
              <Badge variant="outline" className="text-xs">Malam: {dinnerMeals}</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Konsumsi</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">Tingkat konsumsi hari ini</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Daftar Pasien</TabsTrigger>
          <TabsTrigger value="meal-plans">Rencana Menu</TabsTrigger>
          <TabsTrigger value="allergies">Alergi Makanan</TabsTrigger>
          <TabsTrigger value="reports">Laporan</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <NutritionPatientList />
        </TabsContent>

        <TabsContent value="meal-plans" className="mt-4">
          <NutritionMealPlans />
        </TabsContent>

        <TabsContent value="allergies" className="mt-4">
          <NutritionAllergies />
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <NutritionReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}

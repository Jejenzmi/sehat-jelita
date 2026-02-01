import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Users, Calendar, Target, Plus } from "lucide-react";
import { useRehabilitationData } from "@/hooks/useRehabilitationData";
import { RehabPatientList } from "./RehabPatientList";
import { RehabSchedule } from "./RehabSchedule";
import { RehabTherapyTypes } from "./RehabTherapyTypes";
import { RehabReports } from "./RehabReports";

export function RehabilitationDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { assessments, todaySessions, goals, loadingAssessments, loadingSessions } = useRehabilitationData();

  const totalPatients = assessments?.length || 0;
  const todaySessionsCount = todaySessions?.length || 0;
  const completedToday = todaySessions?.filter((s: any) => s.status === "completed").length || 0;
  const inProgressGoals = goals?.filter((g: any) => g.status === "in_progress").length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rehabilitasi Medik</h1>
          <p className="text-muted-foreground">Fisioterapi, Terapi Okupasi, dan Terapi Wicara</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Assessment Baru
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pasien</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPatients}</div>
            <p className="text-xs text-muted-foreground">Pasien dalam program rehabilitasi</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sesi Hari Ini</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaySessionsCount}</div>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline" className="text-xs">Selesai: {completedToday}</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Goal Aktif</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressGoals}</div>
            <p className="text-xs text-muted-foreground">Target rehabilitasi berjalan</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tingkat Keberhasilan</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">Goal tercapai bulan ini</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Daftar Pasien</TabsTrigger>
          <TabsTrigger value="schedule">Jadwal Terapi</TabsTrigger>
          <TabsTrigger value="therapy-types">Jenis Terapi</TabsTrigger>
          <TabsTrigger value="reports">Laporan</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <RehabPatientList />
        </TabsContent>

        <TabsContent value="schedule" className="mt-4">
          <RehabSchedule />
        </TabsContent>

        <TabsContent value="therapy-types" className="mt-4">
          <RehabTherapyTypes />
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <RehabReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}

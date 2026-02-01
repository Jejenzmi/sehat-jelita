import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DialysisDashboard } from "@/components/dialysis/DialysisDashboard";
import { DialysisSchedule } from "@/components/dialysis/DialysisSchedule";
import { DialysisMachines } from "@/components/dialysis/DialysisMachines";
import { DialysisReports } from "@/components/dialysis/DialysisReports";

export default function Hemodialisa() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Unit Hemodialisa</h1>
        <p className="text-muted-foreground">
          Jadwal HD, mesin dialisis, monitoring, dan catatan dialisis
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="schedule">Jadwal Sesi</TabsTrigger>
          <TabsTrigger value="machines">Mesin HD</TabsTrigger>
          <TabsTrigger value="reports">Laporan</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <DialysisDashboard />
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <DialysisSchedule />
        </TabsContent>

        <TabsContent value="machines" className="space-y-4">
          <DialysisMachines />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <DialysisReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}

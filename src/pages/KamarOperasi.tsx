import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SurgerySchedule } from "@/components/surgery/SurgerySchedule";
import { SurgeryDashboard } from "@/components/surgery/SurgeryDashboard";
import { OperatingRoomManagement } from "@/components/surgery/OperatingRoomManagement";
import { SurgeryReports } from "@/components/surgery/SurgeryReports";

export default function KamarOperasi() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kamar Operasi</h1>
        <p className="text-muted-foreground">
          Manajemen jadwal operasi, tim bedah, dan monitoring ruang OK
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="schedule">Jadwal Operasi</TabsTrigger>
          <TabsTrigger value="rooms">Ruang OK</TabsTrigger>
          <TabsTrigger value="reports">Laporan</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <SurgeryDashboard />
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <SurgerySchedule />
        </TabsContent>

        <TabsContent value="rooms" className="space-y-4">
          <OperatingRoomManagement />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <SurgeryReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}

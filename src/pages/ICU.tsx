import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ICUDashboard } from "@/components/icu/ICUDashboard";
import { ICUPatientList } from "@/components/icu/ICUPatientList";
import { ICUBedManagement } from "@/components/icu/ICUBedManagement";
import { ICUMonitoringView } from "@/components/icu/ICUMonitoringView";

export default function ICU() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ICU / NICU / PICU</h1>
        <p className="text-muted-foreground">
          Monitoring pasien intensif, ventilator tracking, dan scoring system
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="patients">Pasien Aktif</TabsTrigger>
          <TabsTrigger value="beds">Tempat Tidur</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <ICUDashboard />
        </TabsContent>

        <TabsContent value="patients" className="space-y-4">
          <ICUPatientList />
        </TabsContent>

        <TabsContent value="beds" className="space-y-4">
          <ICUBedManagement />
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <ICUMonitoringView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

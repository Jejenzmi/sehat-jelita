import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, Activity, AlertTriangle, FileCheck, Shield } from "lucide-react";
import AccreditationDashboard from "@/components/quality/AccreditationDashboard";
import QualityIndicatorsDashboard from "@/components/quality/QualityIndicatorsDashboard";
import SafetyIncidentsDashboard from "@/components/quality/SafetyIncidentsDashboard";
import ConsentManagementDashboard from "@/components/quality/ConsentManagementDashboard";
import INADRGDashboard from "@/components/quality/INADRGDashboard";

export default function Mutu() {
  const [activeTab, setActiveTab] = useState("accreditation");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kepatuhan & Mutu</h1>
        <p className="text-muted-foreground">Akreditasi, Indikator Mutu, Insiden, dan Informed Consent</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="accreditation" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">Akreditasi</span>
          </TabsTrigger>
          <TabsTrigger value="quality" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">SISMADAK</span>
          </TabsTrigger>
          <TabsTrigger value="incidents" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Insiden</span>
          </TabsTrigger>
          <TabsTrigger value="consent" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Consent</span>
          </TabsTrigger>
          <TabsTrigger value="inadrg" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">INA-DRG</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accreditation" className="mt-6">
          <AccreditationDashboard />
        </TabsContent>

        <TabsContent value="quality" className="mt-6">
          <QualityIndicatorsDashboard />
        </TabsContent>

        <TabsContent value="incidents" className="mt-6">
          <SafetyIncidentsDashboard />
        </TabsContent>

        <TabsContent value="consent" className="mt-6">
          <ConsentManagementDashboard />
        </TabsContent>

        <TabsContent value="inadrg" className="mt-6">
          <INADRGDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

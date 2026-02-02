import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, AlertTriangle, FileCheck, Calculator, Send, Award, Activity } from "lucide-react";
import AccreditationDashboard from "@/components/quality/AccreditationDashboard";
import QualityIndicatorsDashboard from "@/components/quality/QualityIndicatorsDashboard";
import SafetyIncidentsDashboard from "@/components/quality/SafetyIncidentsDashboard";
import ConsentManagementDashboard from "@/components/quality/ConsentManagementDashboard";
import INACBGGrouper from "@/components/quality/INACBGGrouper";
import SISRUTEDashboard from "@/components/referral/SISRUTEDashboard";

export default function Mutu() {
  const [activeTab, setActiveTab] = useState("accreditation");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kepatuhan & Mutu</h1>
        <p className="text-muted-foreground">Akreditasi, Indikator Mutu, INA-CBG, dan SISRUTE</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
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
          <TabsTrigger value="inacbg" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">INA-CBG</span>
          </TabsTrigger>
          <TabsTrigger value="sisrute" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">SISRUTE</span>
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

        <TabsContent value="inacbg" className="mt-6">
          <INACBGGrouper />
        </TabsContent>

        <TabsContent value="sisrute" className="mt-6">
          <SISRUTEDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

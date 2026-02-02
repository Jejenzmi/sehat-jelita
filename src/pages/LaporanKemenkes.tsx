import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileBarChart, Package } from "lucide-react";
import RLReportsDashboard from "@/components/reports/RLReportsDashboard";
import ASPAKDashboard from "@/components/aspak/ASPAKDashboard";

export default function LaporanKemenkes() {
  const [activeTab, setActiveTab] = useState("rl-reports");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pelaporan Kemenkes & ASPAK</h1>
        <p className="text-muted-foreground">
          Pelaporan RL 1-6 ke Kemenkes dan Manajemen Sarana Prasarana Kesehatan
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="rl-reports" className="flex items-center gap-2">
            <FileBarChart className="h-4 w-4" />
            <span>Laporan RL 1-6</span>
          </TabsTrigger>
          <TabsTrigger value="aspak" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span>ASPAK</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rl-reports" className="mt-6">
          <RLReportsDashboard />
        </TabsContent>

        <TabsContent value="aspak" className="mt-6">
          <ASPAKDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

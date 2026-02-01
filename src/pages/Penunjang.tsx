import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, Shirt, Trash2, Building2, Sparkles } from "lucide-react";
import CSSDDashboard from "@/components/support/CSSDDashboard";
import LinenLaundryDashboard from "@/components/support/LinenLaundryDashboard";
import WasteManagementDashboard from "@/components/support/WasteManagementDashboard";
import MaintenanceDashboard from "@/components/support/MaintenanceDashboard";
import VendorDashboard from "@/components/support/VendorDashboard";

export default function Penunjang() {
  const [activeTab, setActiveTab] = useState("cssd");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manajemen Penunjang</h1>
        <p className="text-muted-foreground">CSSD, Linen, Pemeliharaan, Limbah, dan Vendor</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="cssd" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">CSSD</span>
          </TabsTrigger>
          <TabsTrigger value="linen" className="flex items-center gap-2">
            <Shirt className="h-4 w-4" />
            <span className="hidden sm:inline">Linen</span>
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            <span className="hidden sm:inline">Pemeliharaan</span>
          </TabsTrigger>
          <TabsTrigger value="waste" className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Limbah</span>
          </TabsTrigger>
          <TabsTrigger value="vendor" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Vendor</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cssd" className="mt-6">
          <CSSDDashboard />
        </TabsContent>

        <TabsContent value="linen" className="mt-6">
          <LinenLaundryDashboard />
        </TabsContent>

        <TabsContent value="maintenance" className="mt-6">
          <MaintenanceDashboard />
        </TabsContent>

        <TabsContent value="waste" className="mt-6">
          <WasteManagementDashboard />
        </TabsContent>

        <TabsContent value="vendor" className="mt-6">
          <VendorDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

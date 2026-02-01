import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BloodBankDashboard } from "@/components/bloodbank/BloodBankDashboard";
import { BloodInventoryList } from "@/components/bloodbank/BloodInventoryList";
import { TransfusionRequests } from "@/components/bloodbank/TransfusionRequests";
import { CrossmatchTests } from "@/components/bloodbank/CrossmatchTests";

export default function BankDarah() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bank Darah (BDRS)</h1>
        <p className="text-muted-foreground">
          Stok darah, crossmatch, screening, dan permintaan transfusi
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="inventory">Stok Darah</TabsTrigger>
          <TabsTrigger value="requests">Permintaan</TabsTrigger>
          <TabsTrigger value="crossmatch">Crossmatch</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <BloodBankDashboard />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <BloodInventoryList />
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <TransfusionRequests />
        </TabsContent>

        <TabsContent value="crossmatch" className="space-y-4">
          <CrossmatchTests />
        </TabsContent>
      </Tabs>
    </div>
  );
}

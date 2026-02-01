import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Users, Building2, Calendar, Plus } from "lucide-react";
import { useMCUData } from "@/hooks/useMCUData";
import { MCURegistrationList } from "./MCURegistrationList";
import { MCUPackages } from "./MCUPackages";
import { MCUCorporateClients } from "./MCUCorporateClients";
import { MCUReports } from "./MCUReports";

export function MCUDashboard() {
  const [activeTab, setActiveTab] = useState("registrations");
  const { registrations, packages, corporateClients, todaySchedule, loadingRegistrations } = useMCUData();

  const totalRegistrations = registrations?.length || 0;
  const todayCount = todaySchedule?.length || 0;
  const completedCount = registrations?.filter((r: any) => r.status === "completed").length || 0;
  const corporateCount = corporateClients?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Medical Check Up</h1>
          <p className="text-muted-foreground">Pemeriksaan kesehatan berkala dan korporat</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Pendaftaran Baru
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pendaftaran</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRegistrations}</div>
            <p className="text-xs text-muted-foreground">Pendaftaran MCU</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Jadwal Hari Ini</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCount}</div>
            <p className="text-xs text-muted-foreground">Peserta MCU hari ini</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Selesai</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground">MCU selesai bulan ini</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Klien Korporat</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{corporateCount}</div>
            <p className="text-xs text-muted-foreground">Perusahaan terdaftar</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="registrations">Pendaftaran</TabsTrigger>
          <TabsTrigger value="packages">Paket MCU</TabsTrigger>
          <TabsTrigger value="corporate">Klien Korporat</TabsTrigger>
          <TabsTrigger value="reports">Laporan</TabsTrigger>
        </TabsList>

        <TabsContent value="registrations" className="mt-4">
          <MCURegistrationList />
        </TabsContent>

        <TabsContent value="packages" className="mt-4">
          <MCUPackages />
        </TabsContent>

        <TabsContent value="corporate" className="mt-4">
          <MCUCorporateClients />
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <MCUReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}

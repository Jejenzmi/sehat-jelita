import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skull, FileText, ScrollText, Award, Plus } from "lucide-react";
import { useForensicData } from "@/hooks/useForensicData";
import { MortuaryCases } from "./MortuaryCases";
import { AutopsyRecords } from "./AutopsyRecords";
import { VisumReports } from "./VisumReports";
import { DeathCertificates } from "./DeathCertificates";

export function ForensicDashboard() {
  const [activeTab, setActiveTab] = useState("mortuary");
  const { activeCases, autopsyRecords, visumReports, deathCertificates, loadingActiveCases } = useForensicData();

  const activeCount = activeCases?.length || 0;
  const autopsyCount = autopsyRecords?.filter((a: any) => a.status !== "completed").length || 0;
  const visumCount = visumReports?.length || 0;
  const certificateCount = deathCertificates?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Forensik & Kamar Jenazah</h1>
          <p className="text-muted-foreground">Manajemen jenazah, otopsi, visum, dan sertifikat kematian</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Kasus Baru
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Jenazah Aktif</CardTitle>
            <Skull className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">Dalam penyimpanan</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Otopsi Pending</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{autopsyCount}</div>
            <p className="text-xs text-muted-foreground">Menunggu pemeriksaan</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Visum</CardTitle>
            <ScrollText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{visumCount}</div>
            <p className="text-xs text-muted-foreground">Laporan visum et repertum</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sertifikat</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{certificateCount}</div>
            <p className="text-xs text-muted-foreground">Sertifikat kematian</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="mortuary">Kamar Jenazah</TabsTrigger>
          <TabsTrigger value="autopsy">Otopsi</TabsTrigger>
          <TabsTrigger value="visum">Visum et Repertum</TabsTrigger>
          <TabsTrigger value="certificates">Sertifikat Kematian</TabsTrigger>
        </TabsList>

        <TabsContent value="mortuary" className="mt-4">
          <MortuaryCases />
        </TabsContent>

        <TabsContent value="autopsy" className="mt-4">
          <AutopsyRecords />
        </TabsContent>

        <TabsContent value="visum" className="mt-4">
          <VisumReports />
        </TabsContent>

        <TabsContent value="certificates" className="mt-4">
          <DeathCertificates />
        </TabsContent>
      </Tabs>
    </div>
  );
}

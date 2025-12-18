import { useState } from "react";
import { Search, Filter, Stethoscope, Clock, CheckCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

const poliData = [
  { name: "Poli Umum", doctor: "dr. Sari Dewi", queue: 12, served: 8, waiting: 4, status: "active" },
  { name: "Poli Gigi", doctor: "drg. Ahmad Fauzi", queue: 8, served: 5, waiting: 3, status: "active" },
  { name: "Poli Anak", doctor: "dr. Lisa, Sp.A", queue: 15, served: 10, waiting: 5, status: "active" },
  { name: "Poli Kandungan", doctor: "dr. Maya, Sp.OG", queue: 10, served: 7, waiting: 3, status: "active" },
  { name: "Poli Jantung", doctor: "dr. Andi, Sp.JP", queue: 6, served: 4, waiting: 2, status: "active" },
  { name: "Poli Paru", doctor: "dr. Budi, Sp.P", queue: 5, served: 3, waiting: 2, status: "break" },
  { name: "Poli Mata", doctor: "dr. Nina, Sp.M", queue: 7, served: 5, waiting: 2, status: "active" },
  { name: "Poli THT", doctor: "dr. Rudi, Sp.THT", queue: 4, served: 2, waiting: 2, status: "active" },
];

const currentPatients = [
  { id: "RM-001", name: "Ahmad H.", poli: "Poli Umum", doctor: "dr. Sari", status: "Pemeriksaan", time: "09:15" },
  { id: "RM-002", name: "Siti A.", poli: "Poli Kandungan", doctor: "dr. Maya", status: "Menunggu Hasil Lab", time: "09:00" },
  { id: "RM-003", name: "Budi S.", poli: "Poli Jantung", doctor: "dr. Andi", status: "Konsultasi", time: "09:30" },
  { id: "RM-004", name: "Dewi L.", poli: "Poli Anak", doctor: "dr. Lisa", status: "Resep Obat", time: "08:45" },
];

export default function RawatJalan() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Rawat Jalan</h1>
        <p className="text-muted-foreground">Manajemen pelayanan rawat jalan</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Stethoscope className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">8</p>
            <p className="text-sm text-muted-foreground">Poliklinik Aktif</p>
          </div>
        </div>
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-warning/10">
            <Clock className="h-6 w-6 text-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold">67</p>
            <p className="text-sm text-muted-foreground">Total Antrian</p>
          </div>
        </div>
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-success/10">
            <CheckCircle className="h-6 w-6 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold">44</p>
            <p className="text-sm text-muted-foreground">Sudah Dilayani</p>
          </div>
        </div>
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-info/10">
            <Users className="h-6 w-6 text-info" />
          </div>
          <div>
            <p className="text-2xl font-bold">23</p>
            <p className="text-sm text-muted-foreground">Menunggu</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview Poli</TabsTrigger>
          <TabsTrigger value="current">Pasien Sedang Dilayani</TabsTrigger>
          <TabsTrigger value="queue">Antrian</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {poliData.map((poli) => (
              <div key={poli.name} className="module-card">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">{poli.name}</h4>
                  <Badge
                    variant="outline"
                    className={
                      poli.status === "active"
                        ? "bg-success/10 text-success border-success/20"
                        : "bg-warning/10 text-warning border-warning/20"
                    }
                  >
                    {poli.status === "active" ? "Aktif" : "Istirahat"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{poli.doctor}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{poli.served}/{poli.queue}</span>
                  </div>
                  <Progress value={(poli.served / poli.queue) * 100} className="h-2" />
                </div>
                <div className="flex justify-between mt-4 text-sm">
                  <div className="text-center">
                    <p className="font-bold text-success">{poli.served}</p>
                    <p className="text-xs text-muted-foreground">Selesai</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-warning">{poli.waiting}</p>
                    <p className="text-xs text-muted-foreground">Menunggu</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="current">
          <div className="module-card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Pasien Sedang Dilayani</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Cari pasien..." className="pl-10 w-64" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {patient.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{patient.name}</p>
                      <p className="text-sm text-muted-foreground">{patient.poli} - {patient.doctor}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="bg-info/10 text-info border-info/20">
                      {patient.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">Sejak {patient.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="queue">
          <div className="module-card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Antrian per Poliklinik</h3>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
            <p className="text-muted-foreground text-center py-8">
              Pilih poliklinik untuk melihat detail antrian
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

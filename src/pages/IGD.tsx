import { useState } from "react";
import { 
  Ambulance, Clock, AlertTriangle, Users, Heart, Activity, 
  Plus, Search, Filter, BedDouble, UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useEmergencyVisits, useEmergencyStats, TriageLevel } from "@/hooks/useEmergencyData";
import { differenceInYears, format } from "date-fns";

// Triage colors based on severity
const triageConfig = {
  merah: { label: "Merah (Resusitasi)", color: "bg-red-500", textColor: "text-red-500", bgLight: "bg-red-500/10", description: "Kondisi mengancam jiwa" },
  kuning: { label: "Kuning (Emergensi)", color: "bg-yellow-500", textColor: "text-yellow-500", bgLight: "bg-yellow-500/10", description: "Perlu penanganan segera" },
  hijau: { label: "Hijau (Urgency)", color: "bg-green-500", textColor: "text-green-500", bgLight: "bg-green-500/10", description: "Dapat menunggu" },
  hitam: { label: "Hitam (Non-Salvageable)", color: "bg-gray-800", textColor: "text-gray-800", bgLight: "bg-gray-800/10", description: "Meninggal / Tidak dapat diselamatkan" },
};

export default function IGD() {
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: emergencyVisits = [], isLoading: visitsLoading } = useEmergencyVisits();
  const { data: stats, isLoading: statsLoading } = useEmergencyStats();

  const filteredPatients = emergencyVisits.filter(p =>
    p.patients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.chief_complaint?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isLoading = visitsLoading || statsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ambulance className="h-7 w-7 text-destructive" />
            Instalasi Gawat Darurat (IGD)
          </h1>
          <p className="text-muted-foreground">Layanan 24 Jam - Penanganan Darurat</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-destructive hover:bg-destructive/90 shadow-lg">
              <UserPlus className="h-4 w-4 mr-2" />
              Pasien Baru IGD
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Pendaftaran Pasien IGD</DialogTitle>
              <DialogDescription>
                Lakukan triase dan registrasi pasien gawat darurat
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <p className="text-sm text-muted-foreground">
                Untuk mendaftarkan pasien IGD baru, silakan daftarkan melalui modul Pendaftaran terlebih dahulu.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline">Tutup</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Triage Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(triageConfig).map(([key, config]) => (
          <div 
            key={key} 
            className={`module-card ${config.bgLight} border-l-4`}
            style={{ borderLeftColor: config.color.replace('bg-', 'var(--') }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${config.textColor}`}>{config.label}</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mt-1" />
                ) : (
                  <p className="text-3xl font-bold">{stats?.triageCounts[key as TriageLevel] || 0}</p>
                )}
                <p className="text-xs text-muted-foreground">{config.description}</p>
              </div>
              <div className={`w-12 h-12 rounded-full ${config.color} flex items-center justify-center`}>
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-destructive/10">
            <Activity className="h-6 w-6 text-destructive" />
          </div>
          <div>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <p className="text-2xl font-bold">{stats?.totalActive || 0}</p>
            )}
            <p className="text-sm text-muted-foreground">Pasien Aktif</p>
          </div>
        </div>
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <BedDouble className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">-</p>
            <p className="text-sm text-muted-foreground">Bed Terisi</p>
          </div>
        </div>
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-warning/10">
            <Clock className="h-6 w-6 text-warning" />
          </div>
          <div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold">{stats?.avgResponseTime || 0} mnt</p>
            )}
            <p className="text-sm text-muted-foreground">Avg. Response Time</p>
          </div>
        </div>
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-success/10">
            <Users className="h-6 w-6 text-success" />
          </div>
          <div>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <p className="text-2xl font-bold">{stats?.todayTotal || 0}</p>
            )}
            <p className="text-sm text-muted-foreground">Pasien Hari Ini</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="patients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="patients">Pasien IGD</TabsTrigger>
          <TabsTrigger value="monitor">Monitor Vital</TabsTrigger>
        </TabsList>

        <TabsContent value="patients">
          <div className="module-card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Daftar Pasien IGD</h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Cari pasien..." 
                    className="pl-10 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {visitsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada pasien IGD aktif
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPatients.map((patient) => {
                  const triage = triageConfig[patient.triage_level as keyof typeof triageConfig];
                  const age = patient.patients?.birth_date 
                    ? differenceInYears(new Date(), new Date(patient.patients.birth_date))
                    : "-";
                  
                  return (
                    <div
                      key={patient.id}
                      className={`flex items-center justify-between p-4 rounded-xl border-l-4 ${triage.bgLight} hover:shadow-md transition-all cursor-pointer`}
                      onClick={() => setSelectedPatient(patient)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-4 h-4 rounded-full ${triage.color} animate-pulse`} />
                        <Avatar>
                          <AvatarFallback className={`${triage.bgLight} ${triage.textColor}`}>
                            {patient.patients?.full_name?.split(" ").map((n: string) => n[0]).join("") || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{patient.patients?.full_name || "Unknown"}</p>
                            <Badge variant="outline" className="text-xs">
                              {patient.patients?.medical_record_number}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {patient.patients?.gender === "L" ? "Laki-laki" : "Perempuan"}, {age} tahun • {patient.chief_complaint}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <Badge className={triage.color}>{triage.label.split(" ")[0]}</Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {patient.arrival_mode} • {format(new Date(patient.arrival_time), "HH:mm")}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium">{patient.visits?.status || "-"}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="monitor">
          <div className="module-card">
            <h3 className="text-lg font-semibold mb-6">Monitor Tanda Vital Real-time</h3>
            <div className="text-center py-8 text-muted-foreground">
              Fitur monitor vital sign akan terintegrasi dengan perangkat monitoring.
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

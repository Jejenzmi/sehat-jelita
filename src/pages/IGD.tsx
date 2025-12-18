import { useState } from "react";
import { 
  Ambulance, Clock, AlertTriangle, Users, Heart, Activity, 
  Plus, Search, Filter, BedDouble, UserPlus, Phone, MapPin 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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

// Triage colors based on severity
const triageConfig = {
  merah: { label: "Merah (Resusitasi)", color: "bg-red-500", textColor: "text-red-500", bgLight: "bg-red-500/10", description: "Kondisi mengancam jiwa" },
  kuning: { label: "Kuning (Emergensi)", color: "bg-yellow-500", textColor: "text-yellow-500", bgLight: "bg-yellow-500/10", description: "Perlu penanganan segera" },
  hijau: { label: "Hijau (Urgency)", color: "bg-green-500", textColor: "text-green-500", bgLight: "bg-green-500/10", description: "Dapat menunggu" },
  hitam: { label: "Hitam (Non-Salvageable)", color: "bg-gray-800", textColor: "text-gray-800", bgLight: "bg-gray-800/10", description: "Meninggal / Tidak dapat diselamatkan" },
};

const emergencyPatients = [
  { id: "IGD-001", name: "Ahmad Hidayat", age: 45, gender: "L", triage: "merah", complaint: "Nyeri dada akut, sesak napas", arrivalTime: "09:15", arrivalMode: "Ambulans", status: "Resusitasi", bed: "Bed 1", vitals: { bp: "160/100", hr: 120, rr: 28, temp: 37.8, spo2: 88 } },
  { id: "IGD-002", name: "Siti Aminah", age: 28, gender: "P", triage: "kuning", complaint: "Kecelakaan lalu lintas, fraktur terbuka", arrivalTime: "09:30", arrivalMode: "Ambulans", status: "Pemeriksaan", bed: "Bed 3", vitals: { bp: "110/70", hr: 100, rr: 22, temp: 36.8, spo2: 96 } },
  { id: "IGD-003", name: "Budi Santoso", age: 62, gender: "L", triage: "kuning", complaint: "Stroke, kelemahan sisi kiri", arrivalTime: "09:45", arrivalMode: "Pribadi", status: "CT Scan", bed: "Bed 5", vitals: { bp: "180/110", hr: 88, rr: 18, temp: 36.5, spo2: 95 } },
  { id: "IGD-004", name: "Dewi Lestari", age: 35, gender: "P", triage: "hijau", complaint: "Demam tinggi 3 hari", arrivalTime: "10:00", arrivalMode: "Pribadi", status: "Menunggu", bed: "-", vitals: { bp: "120/80", hr: 90, rr: 20, temp: 39.2, spo2: 98 } },
  { id: "IGD-005", name: "Rahmat Wijaya", age: 50, gender: "L", triage: "merah", complaint: "Luka tusuk abdomen", arrivalTime: "10:15", arrivalMode: "Ambulans", status: "Operasi", bed: "Bed 2", vitals: { bp: "90/60", hr: 130, rr: 30, temp: 36.2, spo2: 92 } },
];

const igdBeds = [
  { id: 1, name: "Bed 1 - Resusitasi", status: "terisi", patient: "Ahmad Hidayat", triage: "merah" },
  { id: 2, name: "Bed 2 - Resusitasi", status: "terisi", patient: "Rahmat Wijaya", triage: "merah" },
  { id: 3, name: "Bed 3 - Trauma", status: "terisi", patient: "Siti Aminah", triage: "kuning" },
  { id: 4, name: "Bed 4 - Trauma", status: "tersedia", patient: null, triage: null },
  { id: 5, name: "Bed 5 - Observasi", status: "terisi", patient: "Budi Santoso", triage: "kuning" },
  { id: 6, name: "Bed 6 - Observasi", status: "tersedia", patient: null, triage: null },
  { id: 7, name: "Bed 7 - Isolasi", status: "tersedia", patient: null, triage: null },
  { id: 8, name: "Bed 8 - Anak", status: "tersedia", patient: null, triage: null },
];

export default function IGD() {
  const [selectedPatient, setSelectedPatient] = useState<typeof emergencyPatients[0] | null>(null);

  const triageCount = {
    merah: emergencyPatients.filter(p => p.triage === "merah").length,
    kuning: emergencyPatients.filter(p => p.triage === "kuning").length,
    hijau: emergencyPatients.filter(p => p.triage === "hijau").length,
    hitam: emergencyPatients.filter(p => p.triage === "hitam").length,
  };

  const occupiedBeds = igdBeds.filter(b => b.status === "terisi").length;

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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Pasien</Label>
                  <Input placeholder="Nama lengkap" />
                </div>
                <div className="space-y-2">
                  <Label>NIK</Label>
                  <Input placeholder="16 digit NIK" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Jenis Kelamin</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">Laki-laki</SelectItem>
                      <SelectItem value="P">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Usia</Label>
                  <Input type="number" placeholder="Tahun" />
                </div>
                <div className="space-y-2">
                  <Label>Cara Datang</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ambulans">Ambulans</SelectItem>
                      <SelectItem value="pribadi">Pribadi</SelectItem>
                      <SelectItem value="rujukan">Rujukan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Level Triase</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Pilih level triase" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(triageConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${config.color}`} />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Keluhan Utama</Label>
                <Textarea placeholder="Deskripsikan keluhan utama pasien" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kontak Darurat</Label>
                  <Input placeholder="Nama" />
                </div>
                <div className="space-y-2">
                  <Label>No. Telepon</Label>
                  <Input placeholder="08xxxxxxxxxx" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline">Batal</Button>
              <Button className="bg-destructive hover:bg-destructive/90">Daftarkan & Triase</Button>
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
                <p className="text-3xl font-bold">{triageCount[key as keyof typeof triageCount]}</p>
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
            <p className="text-2xl font-bold">{emergencyPatients.length}</p>
            <p className="text-sm text-muted-foreground">Pasien Aktif</p>
          </div>
        </div>
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <BedDouble className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{occupiedBeds}/{igdBeds.length}</p>
            <p className="text-sm text-muted-foreground">Bed Terisi</p>
          </div>
        </div>
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-warning/10">
            <Clock className="h-6 w-6 text-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold">12 mnt</p>
            <p className="text-sm text-muted-foreground">Avg. Response Time</p>
          </div>
        </div>
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-success/10">
            <Users className="h-6 w-6 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold">45</p>
            <p className="text-sm text-muted-foreground">Pasien Hari Ini</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="patients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="patients">Pasien IGD</TabsTrigger>
          <TabsTrigger value="beds">Bed Management</TabsTrigger>
          <TabsTrigger value="monitor">Monitor Vital</TabsTrigger>
        </TabsList>

        <TabsContent value="patients">
          <div className="module-card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Daftar Pasien IGD</h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Cari pasien..." className="pl-10 w-64" />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {emergencyPatients.map((patient) => {
                const triage = triageConfig[patient.triage as keyof typeof triageConfig];
                return (
                  <div
                    key={patient.id}
                    className={`flex items-center justify-between p-4 rounded-xl border-l-4 ${triage.bgLight} hover:shadow-md transition-all cursor-pointer`}
                    style={{ borderLeftColor: triage.color.replace('bg-', '') }}
                    onClick={() => setSelectedPatient(patient)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-4 h-4 rounded-full ${triage.color} animate-pulse`} />
                      <Avatar>
                        <AvatarFallback className={`${triage.bgLight} ${triage.textColor}`}>
                          {patient.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{patient.name}</p>
                          <Badge variant="outline" className="text-xs">
                            {patient.id}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {patient.gender === "L" ? "Laki-laki" : "Perempuan"}, {patient.age} tahun • {patient.complaint}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <Badge className={triage.color}>{triage.label.split(" ")[0]}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {patient.arrivalMode} • {patient.arrivalTime}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">{patient.bed}</p>
                        <p className="text-xs text-muted-foreground">{patient.status}</p>
                      </div>
                      <div className="text-right text-xs space-y-1">
                        <p>BP: <span className="font-mono">{patient.vitals.bp}</span></p>
                        <p>HR: <span className="font-mono">{patient.vitals.hr}</span> SpO2: <span className="font-mono">{patient.vitals.spo2}%</span></p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="beds">
          <div className="module-card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Bed Management IGD</h3>
                <p className="text-sm text-muted-foreground">
                  {igdBeds.filter(b => b.status === "tersedia").length} dari {igdBeds.length} bed tersedia
                </p>
              </div>
              <Progress 
                value={(occupiedBeds / igdBeds.length) * 100} 
                className="w-32 h-2"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {igdBeds.map((bed) => {
                const triage = bed.triage ? triageConfig[bed.triage as keyof typeof triageConfig] : null;
                return (
                  <div
                    key={bed.id}
                    className={`p-4 rounded-xl border-2 ${
                      bed.status === "terisi" 
                        ? triage?.bgLight + " " + "border-" + triage?.color.replace("bg-", "")
                        : "bg-muted/30 border-dashed border-muted"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{bed.name}</span>
                      <Badge 
                        variant={bed.status === "terisi" ? "default" : "secondary"}
                        className={bed.status === "terisi" ? triage?.color : ""}
                      >
                        {bed.status === "terisi" ? "Terisi" : "Tersedia"}
                      </Badge>
                    </div>
                    {bed.patient && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">{bed.patient}</p>
                        <p className="text-xs text-muted-foreground">Triase: {triage?.label.split(" ")[0]}</p>
                      </div>
                    )}
                    {!bed.patient && (
                      <Button variant="ghost" size="sm" className="w-full mt-2">
                        <Plus className="h-4 w-4 mr-1" />
                        Assign Pasien
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="monitor">
          <div className="module-card">
            <h3 className="text-lg font-semibold mb-6">Monitor Tanda Vital Real-time</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {emergencyPatients.filter(p => p.triage === "merah" || p.triage === "kuning").map((patient) => {
                const triage = triageConfig[patient.triage as keyof typeof triageConfig];
                return (
                  <div key={patient.id} className={`p-4 rounded-xl ${triage.bgLight} border border-${triage.color.replace("bg-", "")}/30`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${triage.color} animate-pulse`} />
                        <span className="font-semibold">{patient.name}</span>
                        <Badge variant="outline" className="text-xs">{patient.bed}</Badge>
                      </div>
                      <Badge className={triage.color}>{triage.label.split(" ")[0]}</Badge>
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-background">
                        <Heart className="h-4 w-4 mx-auto text-destructive mb-1" />
                        <p className="text-lg font-bold">{patient.vitals.hr}</p>
                        <p className="text-xs text-muted-foreground">HR</p>
                      </div>
                      <div className="p-2 rounded-lg bg-background">
                        <Activity className="h-4 w-4 mx-auto text-primary mb-1" />
                        <p className="text-lg font-bold">{patient.vitals.bp}</p>
                        <p className="text-xs text-muted-foreground">BP</p>
                      </div>
                      <div className="p-2 rounded-lg bg-background">
                        <p className="text-lg font-bold">{patient.vitals.rr}</p>
                        <p className="text-xs text-muted-foreground">RR</p>
                      </div>
                      <div className="p-2 rounded-lg bg-background">
                        <p className="text-lg font-bold">{patient.vitals.temp}°</p>
                        <p className="text-xs text-muted-foreground">Temp</p>
                      </div>
                      <div className="p-2 rounded-lg bg-background">
                        <p className={`text-lg font-bold ${patient.vitals.spo2 < 95 ? "text-destructive" : ""}`}>
                          {patient.vitals.spo2}%
                        </p>
                        <p className="text-xs text-muted-foreground">SpO2</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

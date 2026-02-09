import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Monitor,
  Tv,
  BedDouble,
  Clock,
  Users,
  Volume2,
  Maximize2,
  Settings2,
  Play,
  Pause,
  Plus,
  RefreshCw,
  Megaphone,
  Stethoscope,
  Pill,
  CalendarDays,
  Bell,
} from "lucide-react";

// Mock queue data
const mockQueueData = [
  { number: "A001", name: "Ahmad Suryadi", poli: "Poli Umum", doctor: "dr. Budi Santoso", status: "dipanggil", counter: "Loket 1" },
  { number: "A002", name: "Siti Nurhaliza", poli: "Poli Anak", doctor: "dr. Indah, Sp.A", status: "menunggu", counter: "-" },
  { number: "A003", name: "Joko Widodo", poli: "Poli Mata", doctor: "dr. Riana, Sp.M", status: "menunggu", counter: "-" },
  { number: "B001", name: "Fatimah Zahra", poli: "Poli Gigi", doctor: "drg. Ovilya", status: "menunggu", counter: "-" },
  { number: "B002", name: "Rizky Pratama", poli: "Poli Bedah", doctor: "dr. Asep, Sp.B", status: "selesai", counter: "Loket 2" },
  { number: "C001", name: "Dewi Lestari", poli: "Poli Dalam", doctor: "dr. Arzan, Sp.PD", status: "dipanggil", counter: "Loket 3" },
];

const mockPharmacyQueue = [
  { number: "R001", name: "Ahmad Suryadi", type: "Racikan", status: "proses", eta: "15 menit" },
  { number: "R002", name: "Siti Nurhaliza", type: "Non-Racikan", status: "siap", eta: "-" },
  { number: "R003", name: "Joko Widodo", type: "Non-Racikan", status: "proses", eta: "5 menit" },
  { number: "R004", name: "Fatimah Zahra", type: "Racikan", status: "menunggu", eta: "20 menit" },
];

const mockDoctorSchedule = [
  { name: "dr. Budi Santoso", poli: "Poli Umum", time: "08:00 - 14:00", status: "praktek", patients: 12 },
  { name: "dr. Indah Dina, Sp.A", poli: "Poli Anak", time: "09:00 - 15:00", status: "praktek", patients: 8 },
  { name: "dr. Riana Azmi, Sp.M", poli: "Poli Mata", time: "10:00 - 16:00", status: "belum mulai", patients: 0 },
  { name: "dr. H. Asep, Sp.B", poli: "Poli Bedah", time: "08:00 - 12:00", status: "praktek", patients: 5 },
  { name: "dr. Arzan, Sp.PD", poli: "Poli Dalam", time: "13:00 - 18:00", status: "praktek", patients: 15 },
  { name: "dr. Ratna, Sp.OG", poli: "Poli Obgyn", time: "14:00 - 20:00", status: "belum mulai", patients: 0 },
];

const mockPromos = [
  { title: "Paket MCU Executive", desc: "Diskon 30% untuk Medical Check Up lengkap", color: "bg-blue-500" },
  { title: "Vaksin Influenza", desc: "Tersedia vaksin influenza untuk dewasa & anak", color: "bg-emerald-500" },
  { title: "Klinik Laktasi", desc: "Konsultasi laktasi gratis setiap hari Sabtu", color: "bg-amber-500" },
];

function CurrentTime() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="text-center">
      <p className="text-4xl font-bold text-foreground tabular-nums">{time.toLocaleTimeString("id-ID")}</p>
      <p className="text-sm text-muted-foreground">{time.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
    </div>
  );
}

// Lobby Display Component
function LobbyDisplay() {
  const [promoIdx, setPromoIdx] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setPromoIdx(prev => (prev + 1) % mockPromos.length), 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      {/* Header with clock */}
      <div className="flex items-center justify-between bg-primary/5 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <Monitor className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-xl font-bold">RS SIMRS ZEN</h2>
            <p className="text-sm text-muted-foreground">Lobby Display - Informasi Antrian</p>
          </div>
        </div>
        <CurrentTime />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Queue Display */}
        <div className="lg:col-span-2 space-y-4">
          {/* Currently Called */}
          <Card className="border-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-primary animate-pulse" /> Sedang Dipanggil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {mockQueueData.filter(q => q.status === "dipanggil").map(q => (
                  <div key={q.number} className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="text-3xl font-bold text-primary">{q.number}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{q.name}</p>
                      <p className="text-xs text-muted-foreground">{q.poli} • {q.doctor}</p>
                    </div>
                    <Badge>{q.counter}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Waiting Queue */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" /> Antrian Menunggu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockQueueData.filter(q => q.status === "menunggu").map(q => (
                  <div key={q.number} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <div className="text-lg font-bold text-muted-foreground w-16">{q.number}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{q.name}</p>
                      <p className="text-xs text-muted-foreground">{q.poli}</p>
                    </div>
                    <Badge variant="outline">{q.doctor}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right side: Schedule + Promo */}
        <div className="space-y-4">
          {/* Doctor Schedule */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Stethoscope className="h-4 w-4" /> Jadwal Dokter Hari Ini
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockDoctorSchedule.map((doc, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${doc.status === "praktek" ? "bg-emerald-500" : "bg-slate-300"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs truncate">{doc.name}</p>
                      <p className="text-[10px] text-muted-foreground">{doc.poli} • {doc.time}</p>
                    </div>
                    {doc.status === "praktek" && <Badge variant="outline" className="text-[10px]">{doc.patients} pasien</Badge>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Promo Carousel */}
          <Card className={`${mockPromos[promoIdx].color} text-white transition-all duration-500`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Megaphone className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Info & Promo</span>
              </div>
              <h3 className="font-bold text-lg">{mockPromos[promoIdx].title}</h3>
              <p className="text-sm opacity-90 mt-1">{mockPromos[promoIdx].desc}</p>
              <div className="flex gap-1 mt-3">
                {mockPromos.map((_, i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full ${i === promoIdx ? "bg-white" : "bg-white/30"}`} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Ward Display Component
function WardDisplay() {
  const bedData = [
    { room: "VIP-01", patient: "Tn. Suryadi", doctor: "dr. Budi", admitDate: "02 Feb 2026", status: "terisi" },
    { room: "VIP-02", patient: "-", doctor: "-", admitDate: "-", status: "kosong" },
    { room: "101-A", patient: "Ny. Fatimah", doctor: "dr. Indah", admitDate: "05 Feb 2026", status: "terisi" },
    { room: "101-B", patient: "Tn. Joko", doctor: "dr. Arzan", admitDate: "07 Feb 2026", status: "terisi" },
    { room: "102-A", patient: "-", doctor: "-", admitDate: "-", status: "maintenance" },
    { room: "102-B", patient: "Ny. Dewi", doctor: "dr. Ratna", admitDate: "08 Feb 2026", status: "terisi" },
    { room: "103-A", patient: "-", doctor: "-", admitDate: "-", status: "kosong" },
    { room: "103-B", patient: "Tn. Rizky", doctor: "dr. Asep", admitDate: "06 Feb 2026", status: "terisi" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <BedDouble className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-xl font-bold">Ward Display - Lantai 2</h2>
            <p className="text-sm text-muted-foreground">Status Tempat Tidur Real-time</p>
          </div>
        </div>
        <CurrentTime />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="text-center">
          <CardContent className="pt-4">
            <p className="text-3xl font-bold text-blue-600">{bedData.length}</p>
            <p className="text-xs text-muted-foreground">Total TT</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4">
            <p className="text-3xl font-bold text-red-500">{bedData.filter(b => b.status === "terisi").length}</p>
            <p className="text-xs text-muted-foreground">Terisi</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4">
            <p className="text-3xl font-bold text-emerald-500">{bedData.filter(b => b.status === "kosong").length}</p>
            <p className="text-xs text-muted-foreground">Kosong</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4">
            <p className="text-3xl font-bold text-amber-500">{bedData.filter(b => b.status === "maintenance").length}</p>
            <p className="text-xs text-muted-foreground">Maintenance</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {bedData.map(bed => (
          <Card key={bed.room} className={`${bed.status === "terisi" ? "border-red-200 bg-red-50/50 dark:bg-red-950/20" : bed.status === "kosong" ? "border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20" : "border-amber-200 bg-amber-50/50 dark:bg-amber-950/20"}`}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">{bed.room}</span>
                <Badge variant={bed.status === "terisi" ? "destructive" : bed.status === "kosong" ? "default" : "secondary"} className="text-[10px]">
                  {bed.status}
                </Badge>
              </div>
              {bed.status === "terisi" && (
                <div className="text-xs space-y-1">
                  <p className="font-medium">{bed.patient}</p>
                  <p className="text-muted-foreground">{bed.doctor}</p>
                  <p className="text-muted-foreground">Masuk: {bed.admitDate}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Pharmacy Display Component
function PharmacyDisplay() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <Pill className="h-8 w-8 text-emerald-600" />
          <div>
            <h2 className="text-xl font-bold">Antrian Farmasi</h2>
            <p className="text-sm text-muted-foreground">Display Antrian Resep</p>
          </div>
        </div>
        <CurrentTime />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Resep Siap */}
        <Card className="border-emerald-200">
          <CardHeader className="pb-2 bg-emerald-50/50 dark:bg-emerald-950/20">
            <CardTitle className="text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <Bell className="h-4 w-4 animate-bounce" /> Resep Siap Diambil
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            {mockPharmacyQueue.filter(q => q.status === "siap").map(q => (
              <div key={q.number} className="flex items-center gap-3 p-3 bg-emerald-100/50 rounded-lg mb-2">
                <div className="text-2xl font-bold text-emerald-600">{q.number}</div>
                <div className="flex-1">
                  <p className="font-semibold">{q.name}</p>
                  <p className="text-xs text-muted-foreground">{q.type}</p>
                </div>
                <Badge className="bg-emerald-500">SIAP</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Resep Dalam Proses */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" /> Sedang Diproses
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3 space-y-2">
            {mockPharmacyQueue.filter(q => q.status === "proses" || q.status === "menunggu").map(q => (
              <div key={q.number} className="flex items-center gap-3 p-2 rounded-lg border">
                <div className="text-lg font-bold text-muted-foreground">{q.number}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{q.name}</p>
                  <p className="text-xs text-muted-foreground">{q.type}</p>
                </div>
                <div className="text-right">
                  <Badge variant={q.status === "proses" ? "secondary" : "outline"} className="text-[10px]">{q.status}</Badge>
                  <p className="text-[10px] text-muted-foreground mt-1">Est. {q.eta}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SmartDisplay() {
  const [activeDisplay, setActiveDisplay] = useState("lobby");
  const [autoRefresh, setAutoRefresh] = useState(true);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Tv className="h-6 w-6 text-primary" />
            Smart Hospital Display
          </h1>
          <p className="text-muted-foreground text-sm">Manajemen layar informasi untuk lobby, ward, dan farmasi</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs">Auto Refresh</Label>
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          </div>
          <Button variant="outline" size="sm" onClick={() => toast.success("Fullscreen mode aktif")}>
            <Maximize2 className="h-4 w-4 mr-1" /> Fullscreen
          </Button>
          <Button variant="outline" size="sm">
            <Settings2 className="h-4 w-4 mr-1" /> Pengaturan
          </Button>
        </div>
      </div>

      <Tabs value={activeDisplay} onValueChange={setActiveDisplay}>
        <TabsList>
          <TabsTrigger value="lobby" className="gap-1"><Monitor className="h-3.5 w-3.5" /> Lobby Display</TabsTrigger>
          <TabsTrigger value="ward" className="gap-1"><BedDouble className="h-3.5 w-3.5" /> Ward Display</TabsTrigger>
          <TabsTrigger value="pharmacy" className="gap-1"><Pill className="h-3.5 w-3.5" /> Farmasi Display</TabsTrigger>
          <TabsTrigger value="schedule" className="gap-1"><CalendarDays className="h-3.5 w-3.5" /> Jadwal Display</TabsTrigger>
        </TabsList>

        <TabsContent value="lobby"><LobbyDisplay /></TabsContent>
        <TabsContent value="ward"><WardDisplay /></TabsContent>
        <TabsContent value="pharmacy"><PharmacyDisplay /></TabsContent>
        <TabsContent value="schedule">
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-purple-50 dark:bg-purple-950/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-8 w-8 text-purple-600" />
                <div>
                  <h2 className="text-xl font-bold">Jadwal Dokter Hari Ini</h2>
                  <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
              </div>
              <CurrentTime />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {mockDoctorSchedule.map((doc, i) => (
                <Card key={i} className={doc.status === "praktek" ? "border-emerald-200" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${doc.status === "praktek" ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                      <Badge variant={doc.status === "praktek" ? "default" : "secondary"} className="text-[10px]">{doc.status}</Badge>
                    </div>
                    <h3 className="font-bold">{doc.name}</h3>
                    <p className="text-sm text-muted-foreground">{doc.poli}</p>
                    <div className="flex items-center gap-1 mt-2 text-sm">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{doc.time}</span>
                    </div>
                    {doc.patients > 0 && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>{doc.patients} pasien terdaftar</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

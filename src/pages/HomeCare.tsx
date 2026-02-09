import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Home, Plus, Search, MapPin, Clock, User, Phone, Calendar, Activity, FileText } from "lucide-react";
import { toast } from "sonner";

const mockVisits = [
  { id: "HC-001", patient: "Siti Rahayu", address: "Jl. Merdeka No. 45, Bandung", phone: "08123456789", nurse: "Ns. Dewi Sari", doctor: "dr. Ahmad", visitDate: "2026-02-09", visitTime: "09:00", status: "scheduled", type: "Perawatan Luka", notes: "Post-operasi, ganti perban" },
  { id: "HC-002", patient: "Hadi Santoso", address: "Jl. Sudirman No. 12, Bandung", phone: "08198765432", nurse: "Ns. Rina", doctor: "dr. Budi", visitDate: "2026-02-09", visitTime: "11:00", status: "in_progress", type: "Fisioterapi", notes: "Latihan pasca stroke" },
  { id: "HC-003", patient: "Aminah Wati", address: "Jl. Asia Afrika No. 78, Bandung", phone: "08134567890", nurse: "Ns. Yanti", doctor: "dr. Clara", visitDate: "2026-02-08", visitTime: "14:00", status: "completed", type: "Kontrol Diabetes", notes: "Cek gula darah & injeksi insulin" },
  { id: "HC-004", patient: "Bambang P.", address: "Jl. Dago No. 33, Bandung", phone: "08145678901", nurse: "Ns. Dewi Sari", doctor: "dr. Ahmad", visitDate: "2026-02-10", visitTime: "10:00", status: "scheduled", type: "Perawatan Paliatif", notes: "Manajemen nyeri" },
];

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  scheduled: { label: "Dijadwalkan", variant: "outline" },
  in_progress: { label: "Sedang Berlangsung", variant: "default" },
  completed: { label: "Selesai", variant: "secondary" },
  cancelled: { label: "Dibatalkan", variant: "destructive" },
};

export default function HomeCare() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = mockVisits.filter(v => {
    const matchSearch = v.patient.toLowerCase().includes(search.toLowerCase()) || v.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || v.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: mockVisits.length,
    scheduled: mockVisits.filter(v => v.status === "scheduled").length,
    inProgress: mockVisits.filter(v => v.status === "in_progress").length,
    completed: mockVisits.filter(v => v.status === "completed").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Home className="h-8 w-8 text-primary" /> Home Care
          </h1>
          <p className="text-muted-foreground">Manajemen kunjungan perawatan rumah</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Jadwalkan Kunjungan</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Jadwalkan Kunjungan Home Care</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Pasien</Label><Input placeholder="Nama pasien" /></div>
                <div><Label>No. Telepon</Label><Input placeholder="08xxxxxxxxx" /></div>
              </div>
              <div><Label>Alamat Kunjungan</Label><Textarea placeholder="Alamat lengkap pasien" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Tanggal</Label><Input type="date" /></div>
                <div><Label>Waktu</Label><Input type="time" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Perawat</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Pilih perawat" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dewi">Ns. Dewi Sari</SelectItem>
                      <SelectItem value="rina">Ns. Rina</SelectItem>
                      <SelectItem value="yanti">Ns. Yanti</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Jenis Layanan</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Pilih layanan" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wound">Perawatan Luka</SelectItem>
                      <SelectItem value="physio">Fisioterapi</SelectItem>
                      <SelectItem value="palliative">Perawatan Paliatif</SelectItem>
                      <SelectItem value="checkup">Kontrol Rutin</SelectItem>
                      <SelectItem value="injection">Injeksi/Infus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Catatan</Label><Textarea placeholder="Catatan tambahan" /></div>
              <Button className="w-full" onClick={() => toast.success("Kunjungan berhasil dijadwalkan")}>Simpan</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold">{stats.total}</p><p className="text-sm text-muted-foreground">Total Kunjungan</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p><p className="text-sm text-muted-foreground">Dijadwalkan</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold text-orange-600">{stats.inProgress}</p><p className="text-sm text-muted-foreground">Berlangsung</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold text-green-600">{stats.completed}</p><p className="text-sm text-muted-foreground">Selesai</p></CardContent></Card>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Daftar Kunjungan</TabsTrigger>
          <TabsTrigger value="schedule">Jadwal Hari Ini</TabsTrigger>
          <TabsTrigger value="reports">Laporan</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input placeholder="Cari pasien atau ID..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} /></div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="scheduled">Dijadwalkan</SelectItem>
                <SelectItem value="in_progress">Berlangsung</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Pasien</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead>Perawat</TableHead>
                  <TableHead>Jadwal</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(v => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono text-sm">{v.id}</TableCell>
                    <TableCell><div><p className="font-medium">{v.patient}</p><p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{v.phone}</p></div></TableCell>
                    <TableCell><p className="text-sm flex items-center gap-1"><MapPin className="h-3 w-3 flex-shrink-0" />{v.address}</p></TableCell>
                    <TableCell>{v.nurse}</TableCell>
                    <TableCell><div className="text-sm"><p className="flex items-center gap-1"><Calendar className="h-3 w-3" />{v.visitDate}</p><p className="flex items-center gap-1"><Clock className="h-3 w-3" />{v.visitTime}</p></div></TableCell>
                    <TableCell>{v.type}</TableCell>
                    <TableCell><Badge variant={statusMap[v.status]?.variant}>{statusMap[v.status]?.label}</Badge></TableCell>
                    <TableCell><Button size="sm" variant="outline"><FileText className="h-3 w-3 mr-1" />Detail</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <div className="grid md:grid-cols-2 gap-4">
            {mockVisits.filter(v => v.visitDate === "2026-02-09").map(v => (
              <Card key={v.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{v.patient}</CardTitle>
                    <Badge variant={statusMap[v.status]?.variant}>{statusMap[v.status]?.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" />{v.visitTime} WIB</p>
                  <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />{v.address}</p>
                  <p className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" />{v.nurse} • {v.doctor}</p>
                  <p className="flex items-center gap-2"><Activity className="h-4 w-4 text-muted-foreground" />{v.type}</p>
                  <p className="text-muted-foreground italic">{v.notes}</p>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1">Navigasi</Button>
                    <Button size="sm" className="flex-1">Mulai Kunjungan</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <Card><CardContent className="pt-6 text-center text-muted-foreground py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Laporan Home Care akan tersedia setelah data kunjungan terakumulasi.</p>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

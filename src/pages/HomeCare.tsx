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
import { useHomeCareVisits, useCreateHomeCareVisit, useUpdateHomeCareVisit, generateHomeCareVisitNumber } from "@/hooks/useHomeCareData";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  scheduled: { label: "Dijadwalkan", variant: "outline" },
  in_progress: { label: "Sedang Berlangsung", variant: "default" },
  completed: { label: "Selesai", variant: "secondary" },
  cancelled: { label: "Dibatalkan", variant: "destructive" },
};

export default function HomeCare() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ patient_name: "", patient_phone: "", address: "", visit_date: "", visit_time: "", nurse_name: "", service_type: "", notes: "" });

  const { data: visits = [], isLoading } = useHomeCareVisits();
  const createVisit = useCreateHomeCareVisit();
  const updateVisit = useUpdateHomeCareVisit();

  const filtered = visits.filter(v => {
    const matchSearch = v.patient_name.toLowerCase().includes(search.toLowerCase()) || v.visit_number.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || v.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const today = new Date().toISOString().split("T")[0];
  const stats = {
    total: visits.length,
    scheduled: visits.filter(v => v.status === "scheduled").length,
    inProgress: visits.filter(v => v.status === "in_progress").length,
    completed: visits.filter(v => v.status === "completed").length,
  };

  const handleCreate = async () => {
    const visitNumber = await generateHomeCareVisitNumber();
    createVisit.mutate({
      visit_number: visitNumber,
      patient_id: null,
      patient_name: form.patient_name,
      patient_phone: form.patient_phone,
      address: form.address,
      nurse_id: null,
      nurse_name: form.nurse_name,
      doctor_id: null,
      doctor_name: null,
      visit_date: form.visit_date,
      visit_time: form.visit_time,
      service_type: form.service_type,
      status: "scheduled",
      notes: form.notes || null,
    }, {
      onSuccess: () => {
        setDialogOpen(false);
        setForm({ patient_name: "", patient_phone: "", address: "", visit_date: "", visit_time: "", nurse_name: "", service_type: "", notes: "" });
      }
    });
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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Jadwalkan Kunjungan</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Jadwalkan Kunjungan Home Care</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Pasien</Label><Input placeholder="Nama pasien" value={form.patient_name} onChange={e => setForm(f => ({ ...f, patient_name: e.target.value }))} /></div>
                <div><Label>No. Telepon</Label><Input placeholder="08xxxxxxxxx" value={form.patient_phone} onChange={e => setForm(f => ({ ...f, patient_phone: e.target.value }))} /></div>
              </div>
              <div><Label>Alamat Kunjungan</Label><Textarea placeholder="Alamat lengkap pasien" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Tanggal</Label><Input type="date" value={form.visit_date} onChange={e => setForm(f => ({ ...f, visit_date: e.target.value }))} /></div>
                <div><Label>Waktu</Label><Input type="time" value={form.visit_time} onChange={e => setForm(f => ({ ...f, visit_time: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Perawat</Label><Input placeholder="Nama perawat" value={form.nurse_name} onChange={e => setForm(f => ({ ...f, nurse_name: e.target.value }))} /></div>
                <div><Label>Jenis Layanan</Label>
                  <Select value={form.service_type} onValueChange={v => setForm(f => ({ ...f, service_type: v }))}>
                    <SelectTrigger><SelectValue placeholder="Pilih layanan" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Perawatan Luka">Perawatan Luka</SelectItem>
                      <SelectItem value="Fisioterapi">Fisioterapi</SelectItem>
                      <SelectItem value="Perawatan Paliatif">Perawatan Paliatif</SelectItem>
                      <SelectItem value="Kontrol Rutin">Kontrol Rutin</SelectItem>
                      <SelectItem value="Injeksi/Infus">Injeksi/Infus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Catatan</Label><Textarea placeholder="Catatan tambahan" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <Button className="w-full" onClick={handleCreate} disabled={createVisit.isPending || !form.patient_name || !form.address || !form.visit_date || !form.visit_time || !form.nurse_name || !form.service_type}>
                {createVisit.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Memuat data...</div>
            ) : (
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
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Belum ada data kunjungan</TableCell></TableRow>
                  ) : filtered.map(v => (
                    <TableRow key={v.id}>
                      <TableCell className="font-mono text-sm">{v.visit_number}</TableCell>
                      <TableCell><div><p className="font-medium">{v.patient_name}</p>{v.patient_phone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{v.patient_phone}</p>}</div></TableCell>
                      <TableCell><p className="text-sm flex items-center gap-1"><MapPin className="h-3 w-3 flex-shrink-0" />{v.address}</p></TableCell>
                      <TableCell>{v.nurse_name}</TableCell>
                      <TableCell><div className="text-sm"><p className="flex items-center gap-1"><Calendar className="h-3 w-3" />{v.visit_date}</p><p className="flex items-center gap-1"><Clock className="h-3 w-3" />{v.visit_time}</p></div></TableCell>
                      <TableCell>{v.service_type}</TableCell>
                      <TableCell><Badge variant={statusMap[v.status]?.variant}>{statusMap[v.status]?.label || v.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {v.status === "scheduled" && (
                            <Button size="sm" variant="outline" onClick={() => updateVisit.mutate({ id: v.id, status: "in_progress" })}>Mulai</Button>
                          )}
                          {v.status === "in_progress" && (
                            <Button size="sm" onClick={() => updateVisit.mutate({ id: v.id, status: "completed", completed_at: new Date().toISOString() })}>Selesai</Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <div className="grid md:grid-cols-2 gap-4">
            {visits.filter(v => v.visit_date === today).length === 0 ? (
              <Card><CardContent className="pt-6 text-center text-muted-foreground py-12">Tidak ada kunjungan hari ini</CardContent></Card>
            ) : visits.filter(v => v.visit_date === today).map(v => (
              <Card key={v.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{v.patient_name}</CardTitle>
                    <Badge variant={statusMap[v.status]?.variant}>{statusMap[v.status]?.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" />{v.visit_time} WIB</p>
                  <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />{v.address}</p>
                  <p className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" />{v.nurse_name}{v.doctor_name && ` • ${v.doctor_name}`}</p>
                  <p className="flex items-center gap-2"><Activity className="h-4 w-4 text-muted-foreground" />{v.service_type}</p>
                  {v.notes && <p className="text-muted-foreground italic">{v.notes}</p>}
                  <div className="flex gap-2 pt-2">
                    {v.status === "scheduled" && <Button size="sm" className="flex-1" onClick={() => updateVisit.mutate({ id: v.id, status: "in_progress" })}>Mulai Kunjungan</Button>}
                    {v.status === "in_progress" && <Button size="sm" className="flex-1" onClick={() => updateVisit.mutate({ id: v.id, status: "completed", completed_at: new Date().toISOString() })}>Selesaikan</Button>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

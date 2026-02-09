import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Ambulance, AlertTriangle, CheckCircle, Truck, Wrench, MapPin, Clock, Phone } from "lucide-react";
import { useAmbulanceFleet, useAmbulanceDispatches, useCreateDispatch, generateDispatchNumber } from "@/hooks/useAmbulanceData";

const fleetStatusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  available: { label: "Tersedia", variant: "default" },
  on_mission: { label: "Misi", variant: "secondary" },
  maintenance: { label: "Perawatan", variant: "destructive" },
};

const dispatchStatusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Menunggu", variant: "outline" },
  dispatched: { label: "Dikirim", variant: "secondary" },
  en_route: { label: "Dalam Perjalanan", variant: "default" },
  arrived: { label: "Tiba", variant: "default" },
  completed: { label: "Selesai", variant: "secondary" },
};

const priorityMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  emergency: { label: "DARURAT", variant: "destructive" },
  urgent: { label: "Mendesak", variant: "default" },
  normal: { label: "Normal", variant: "outline" },
};

export default function AmbulanceCenter() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ priority: "emergency", caller_name: "", caller_phone: "", pickup_location: "", destination: "IGD RS ZEN", ambulance_id: "", patient_info: "", notes: "" });

  const { data: fleet = [], isLoading: fleetLoading } = useAmbulanceFleet();
  const { data: dispatches = [], isLoading: dispatchLoading } = useAmbulanceDispatches();
  const createDispatch = useCreateDispatch();

  const availableFleet = fleet.filter(f => f.status === "available");

  const handleDispatch = async () => {
    const dispatchNumber = await generateDispatchNumber();
    createDispatch.mutate({
      dispatch_number: dispatchNumber,
      ambulance_id: form.ambulance_id || null,
      patient_info: form.patient_info,
      pickup_location: form.pickup_location,
      destination: form.destination,
      priority: form.priority,
      status: "dispatched",
      caller_name: form.caller_name,
      caller_phone: form.caller_phone,
      request_time: new Date().toISOString(),
      dispatch_time: new Date().toISOString(),
      arrival_time: null,
      completion_time: null,
      notes: form.notes || null,
    }, {
      onSuccess: () => {
        setDialogOpen(false);
        setForm({ priority: "emergency", caller_name: "", caller_phone: "", pickup_location: "", destination: "IGD RS ZEN", ambulance_id: "", patient_info: "", notes: "" });
      }
    });
  };

  const activeDispatches = dispatches.filter(d => !["completed"].includes(d.status));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Ambulance className="h-8 w-8 text-primary" /> Ambulance Center
          </h1>
          <p className="text-muted-foreground">Manajemen armada & dispatch ambulans</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive"><AlertTriangle className="h-4 w-4 mr-2" /> Dispatch Darurat</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Dispatch Ambulans Darurat</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Prioritas</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emergency">🔴 DARURAT</SelectItem>
                    <SelectItem value="urgent">🟡 Mendesak</SelectItem>
                    <SelectItem value="normal">🟢 Normal / Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Info Pasien</Label><Input placeholder="Nama/kondisi pasien" value={form.patient_info} onChange={e => setForm(f => ({ ...f, patient_info: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Nama Pemanggil</Label><Input placeholder="Nama" value={form.caller_name} onChange={e => setForm(f => ({ ...f, caller_name: e.target.value }))} /></div>
                <div><Label>No. Telepon</Label><Input placeholder="08xxx" value={form.caller_phone} onChange={e => setForm(f => ({ ...f, caller_phone: e.target.value }))} /></div>
              </div>
              <div><Label>Lokasi Jemput</Label><Textarea placeholder="Alamat lengkap" value={form.pickup_location} onChange={e => setForm(f => ({ ...f, pickup_location: e.target.value }))} /></div>
              <div><Label>Tujuan</Label><Input placeholder="RS ZEN / Alamat tujuan" value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} /></div>
              <div><Label>Ambulans</Label>
                <Select value={form.ambulance_id} onValueChange={v => setForm(f => ({ ...f, ambulance_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Pilih ambulans tersedia" /></SelectTrigger>
                  <SelectContent>
                    {availableFleet.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.ambulance_code} - {f.ambulance_type} ({f.plate_number})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Keterangan</Label><Textarea placeholder="Info tambahan" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <Button className="w-full" variant="destructive" onClick={handleDispatch} disabled={createDispatch.isPending || !form.patient_info || !form.pickup_location}>
                <Ambulance className="h-4 w-4 mr-2" /> {createDispatch.isPending ? "Mengirim..." : "DISPATCH SEKARANG"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-green-500/30 bg-green-500/5"><CardContent className="pt-6 text-center">
          <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
          <p className="text-2xl font-bold">{fleet.filter(f => f.status === "available").length}</p>
          <p className="text-sm text-muted-foreground">Tersedia</p>
        </CardContent></Card>
        <Card className="border-blue-500/30 bg-blue-500/5"><CardContent className="pt-6 text-center">
          <Truck className="h-6 w-6 text-blue-600 mx-auto mb-1" />
          <p className="text-2xl font-bold">{fleet.filter(f => f.status === "on_mission").length}</p>
          <p className="text-sm text-muted-foreground">Dalam Misi</p>
        </CardContent></Card>
        <Card className="border-orange-500/30 bg-orange-500/5"><CardContent className="pt-6 text-center">
          <Wrench className="h-6 w-6 text-orange-600 mx-auto mb-1" />
          <p className="text-2xl font-bold">{fleet.filter(f => f.status === "maintenance").length}</p>
          <p className="text-sm text-muted-foreground">Perawatan</p>
        </CardContent></Card>
        <Card className="border-red-500/30 bg-red-500/5"><CardContent className="pt-6 text-center">
          <AlertTriangle className="h-6 w-6 text-red-600 mx-auto mb-1" />
          <p className="text-2xl font-bold">{dispatches.filter(d => d.priority === "emergency" && d.status !== "completed").length}</p>
          <p className="text-sm text-muted-foreground">Dispatch Darurat</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="dispatch">
        <TabsList>
          <TabsTrigger value="dispatch">Dispatch Aktif</TabsTrigger>
          <TabsTrigger value="fleet">Armada</TabsTrigger>
          <TabsTrigger value="history">Riwayat</TabsTrigger>
        </TabsList>

        <TabsContent value="dispatch" className="space-y-4">
          {dispatchLoading ? (
            <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
          ) : activeDispatches.length === 0 ? (
            <Card><CardContent className="pt-6 text-center text-muted-foreground py-12">Tidak ada dispatch aktif</CardContent></Card>
          ) : activeDispatches.map(d => (
            <Card key={d.id} className={d.priority === "emergency" ? "border-red-500/50" : ""}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <Badge variant={priorityMap[d.priority]?.variant}>{priorityMap[d.priority]?.label}</Badge>
                    <span className="font-mono text-sm">{d.dispatch_number}</span>
                    <Badge variant={dispatchStatusMap[d.status]?.variant}>{dispatchStatusMap[d.status]?.label}</Badge>
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium">{d.patient_info}</p>
                    <p className="text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{d.caller_name} - {d.caller_phone}</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1"><MapPin className="h-3 w-3 text-green-600" /><span className="font-medium">Dari:</span> {d.pickup_location}</p>
                    <p className="flex items-center gap-1"><MapPin className="h-3 w-3 text-red-600" /><span className="font-medium">Ke:</span> {d.destination}</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1"><Clock className="h-3 w-3" />Request: {new Date(d.request_time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>
                    {d.dispatch_time && <p className="flex items-center gap-1"><Clock className="h-3 w-3" />Dispatch: {new Date(d.dispatch_time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="fleet">
          <Card>
            {fleetLoading ? (
              <div className="p-8 text-center text-muted-foreground">Memuat data...</div>
            ) : fleet.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Belum ada data armada ambulans</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Plat Nomor</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pengemudi</TableHead>
                    <TableHead>Kru</TableHead>
                    <TableHead>Peralatan</TableHead>
                    <TableHead>Service Berikutnya</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fleet.map(f => (
                    <TableRow key={f.id}>
                      <TableCell className="font-mono">{f.ambulance_code}</TableCell>
                      <TableCell className="font-medium">{f.plate_number}</TableCell>
                      <TableCell><Badge variant="outline">{f.ambulance_type}</Badge></TableCell>
                      <TableCell><Badge variant={fleetStatusMap[f.status]?.variant}>{fleetStatusMap[f.status]?.label}</Badge></TableCell>
                      <TableCell>{f.driver_name || "-"}</TableCell>
                      <TableCell>{f.crew_names || "-"}</TableCell>
                      <TableCell>{f.equipment_status}</TableCell>
                      <TableCell>{f.next_service_date || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            {dispatches.filter(d => d.status === "completed").length === 0 ? (
              <CardContent className="pt-6 text-center text-muted-foreground py-12">
                <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Belum ada riwayat dispatch.</p>
              </CardContent>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>No.</TableHead><TableHead>Pasien</TableHead><TableHead>Dari</TableHead><TableHead>Ke</TableHead><TableHead>Prioritas</TableHead><TableHead>Waktu</TableHead></TableRow></TableHeader>
                <TableBody>
                  {dispatches.filter(d => d.status === "completed").map(d => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-sm">{d.dispatch_number}</TableCell>
                      <TableCell>{d.patient_info}</TableCell>
                      <TableCell>{d.pickup_location}</TableCell>
                      <TableCell>{d.destination}</TableCell>
                      <TableCell><Badge variant={priorityMap[d.priority]?.variant}>{priorityMap[d.priority]?.label}</Badge></TableCell>
                      <TableCell>{new Date(d.request_time).toLocaleDateString("id-ID")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

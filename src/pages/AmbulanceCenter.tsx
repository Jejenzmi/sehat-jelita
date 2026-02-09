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
import { Ambulance, Plus, Search, MapPin, Clock, Phone, AlertTriangle, CheckCircle, Truck, Users, Wrench } from "lucide-react";
import { toast } from "sonner";

const mockFleet = [
  { id: "AMB-01", plateNumber: "D 1234 RS", type: "ALS", status: "available", driver: "Pak Joko", crew: "Ns. Andi, EMT Budi", lastService: "2026-01-15", nextService: "2026-04-15", equipment: "Lengkap" },
  { id: "AMB-02", plateNumber: "D 5678 RS", type: "BLS", status: "on_mission", driver: "Pak Heru", crew: "EMT Deni", lastService: "2026-01-20", nextService: "2026-04-20", equipment: "Lengkap" },
  { id: "AMB-03", plateNumber: "D 9012 RS", type: "ALS", status: "maintenance", driver: "-", crew: "-", lastService: "2026-02-01", nextService: "2026-02-10", equipment: "Dalam Perbaikan" },
  { id: "AMB-04", plateNumber: "D 3456 RS", type: "Transport", status: "available", driver: "Pak Rudi", crew: "EMT Sari", lastService: "2026-01-25", nextService: "2026-04-25", equipment: "Lengkap" },
];

const mockDispatches = [
  { id: "DSP-001", ambulanceId: "AMB-02", patient: "Darurat - Kecelakaan", pickup: "Jl. Soekarno Hatta Km 5", destination: "IGD RS ZEN", requestTime: "08:30", dispatchTime: "08:32", arrivalTime: "08:45", status: "en_route", priority: "emergency", caller: "Polsek Buah Batu", callerPhone: "022-7501234" },
  { id: "DSP-002", ambulanceId: "AMB-04", patient: "Aminah (Transfer)", pickup: "RS Borromeus", destination: "RS ZEN - ICU", requestTime: "09:00", dispatchTime: "09:10", arrivalTime: "-", status: "dispatched", priority: "urgent", caller: "IGD RS Borromeus", callerPhone: "022-2504321" },
  { id: "DSP-003", ambulanceId: "AMB-01", patient: "Budi Hartono (Pulang)", pickup: "RS ZEN Lt.3", destination: "Jl. Pasteur No. 88", requestTime: "10:00", dispatchTime: "-", arrivalTime: "-", status: "pending", priority: "normal", caller: "Perawat Lt.3", callerPhone: "ext.301" },
];

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
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Ambulance className="h-8 w-8 text-primary" /> Ambulance Center
          </h1>
          <p className="text-muted-foreground">Manajemen armada & dispatch ambulans</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive"><AlertTriangle className="h-4 w-4 mr-2" /> Dispatch Darurat</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Dispatch Ambulans Darurat</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Prioritas</Label>
                <Select defaultValue="emergency">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emergency">🔴 DARURAT</SelectItem>
                    <SelectItem value="urgent">🟡 Mendesak</SelectItem>
                    <SelectItem value="normal">🟢 Normal / Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Nama Pemanggil</Label><Input placeholder="Nama" /></div>
                <div><Label>No. Telepon</Label><Input placeholder="08xxx" /></div>
              </div>
              <div><Label>Lokasi Jemput</Label><Textarea placeholder="Alamat lengkap lokasi jemput" /></div>
              <div><Label>Tujuan</Label><Input placeholder="RS ZEN / Alamat tujuan" /></div>
              <div><Label>Ambulans</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Pilih ambulans tersedia" /></SelectTrigger>
                  <SelectContent>
                    {mockFleet.filter(f => f.status === "available").map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.id} - {f.type} ({f.plateNumber})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Keterangan</Label><Textarea placeholder="Informasi kondisi pasien" /></div>
              <Button className="w-full" variant="destructive" onClick={() => toast.success("Ambulans berhasil di-dispatch!")}>
                <Ambulance className="h-4 w-4 mr-2" /> DISPATCH SEKARANG
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-green-500/30 bg-green-500/5"><CardContent className="pt-6 text-center">
          <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
          <p className="text-2xl font-bold">{mockFleet.filter(f => f.status === "available").length}</p>
          <p className="text-sm text-muted-foreground">Tersedia</p>
        </CardContent></Card>
        <Card className="border-blue-500/30 bg-blue-500/5"><CardContent className="pt-6 text-center">
          <Truck className="h-6 w-6 text-blue-600 mx-auto mb-1" />
          <p className="text-2xl font-bold">{mockFleet.filter(f => f.status === "on_mission").length}</p>
          <p className="text-sm text-muted-foreground">Dalam Misi</p>
        </CardContent></Card>
        <Card className="border-orange-500/30 bg-orange-500/5"><CardContent className="pt-6 text-center">
          <Wrench className="h-6 w-6 text-orange-600 mx-auto mb-1" />
          <p className="text-2xl font-bold">{mockFleet.filter(f => f.status === "maintenance").length}</p>
          <p className="text-sm text-muted-foreground">Perawatan</p>
        </CardContent></Card>
        <Card className="border-red-500/30 bg-red-500/5"><CardContent className="pt-6 text-center">
          <AlertTriangle className="h-6 w-6 text-red-600 mx-auto mb-1" />
          <p className="text-2xl font-bold">{mockDispatches.filter(d => d.priority === "emergency").length}</p>
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
          {mockDispatches.map(d => (
            <Card key={d.id} className={d.priority === "emergency" ? "border-red-500/50" : ""}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <Badge variant={priorityMap[d.priority]?.variant}>{priorityMap[d.priority]?.label}</Badge>
                    <span className="font-mono text-sm">{d.id}</span>
                    <Badge variant={dispatchStatusMap[d.status]?.variant}>{dispatchStatusMap[d.status]?.label}</Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">{d.ambulanceId}</span>
                </div>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium">{d.patient}</p>
                    <p className="text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{d.caller} - {d.callerPhone}</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1"><MapPin className="h-3 w-3 text-green-600" /><span className="font-medium">Dari:</span> {d.pickup}</p>
                    <p className="flex items-center gap-1"><MapPin className="h-3 w-3 text-red-600" /><span className="font-medium">Ke:</span> {d.destination}</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1"><Clock className="h-3 w-3" />Request: {d.requestTime}</p>
                    <p className="flex items-center gap-1"><Clock className="h-3 w-3" />Dispatch: {d.dispatchTime}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="fleet">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
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
                {mockFleet.map(f => (
                  <TableRow key={f.id}>
                    <TableCell className="font-mono">{f.id}</TableCell>
                    <TableCell className="font-medium">{f.plateNumber}</TableCell>
                    <TableCell><Badge variant="outline">{f.type}</Badge></TableCell>
                    <TableCell><Badge variant={fleetStatusMap[f.status]?.variant}>{fleetStatusMap[f.status]?.label}</Badge></TableCell>
                    <TableCell>{f.driver}</TableCell>
                    <TableCell>{f.crew}</TableCell>
                    <TableCell>{f.equipment}</TableCell>
                    <TableCell>{f.nextService}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card><CardContent className="pt-6 text-center text-muted-foreground py-12">
            <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Riwayat dispatch akan ditampilkan setelah data terakumulasi.</p>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

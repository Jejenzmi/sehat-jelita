import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Bed, Users, Calendar, Clock, CheckCircle, LogOut, Building2, Plus, Search, FileText, AlertTriangle } from "lucide-react";

// Sample data
const rooms = [
  { id: 1, code: "VIP-01", name: "Ruang VIP 01", class: "VIP", totalBeds: 2, availableBeds: 1, dailyRate: 1500000 },
  { id: 2, code: "VIP-02", name: "Ruang VIP 02", class: "VIP", totalBeds: 2, availableBeds: 0, dailyRate: 1500000 },
  { id: 3, code: "K1-01", name: "Ruang Kelas 1 - 01", class: "Kelas 1", totalBeds: 4, availableBeds: 2, dailyRate: 750000 },
  { id: 4, code: "K1-02", name: "Ruang Kelas 1 - 02", class: "Kelas 1", totalBeds: 4, availableBeds: 1, dailyRate: 750000 },
  { id: 5, code: "K2-01", name: "Ruang Kelas 2 - 01", class: "Kelas 2", totalBeds: 6, availableBeds: 3, dailyRate: 450000 },
  { id: 6, code: "K3-01", name: "Ruang Kelas 3 - 01", class: "Kelas 3", totalBeds: 8, availableBeds: 5, dailyRate: 250000 },
  { id: 7, code: "ICU-01", name: "ICU", class: "ICU", totalBeds: 4, availableBeds: 1, dailyRate: 3000000 },
];

const inpatients = [
  { 
    id: 1, 
    patient: "Ahmad Sulaiman", 
    mrn: "RM-2024-000001",
    room: "VIP-01", 
    bed: "Bed 1",
    class: "VIP",
    admissionDate: "2024-01-10", 
    plannedDischarge: "2024-01-17",
    diagnosis: "Demam Berdarah Dengue",
    doctor: "Dr. Budi Santoso",
    status: "active",
    los: 5
  },
  { 
    id: 2, 
    patient: "Siti Rahmah", 
    mrn: "RM-2024-000002",
    room: "K1-01", 
    bed: "Bed 2",
    class: "Kelas 1",
    admissionDate: "2024-01-12", 
    plannedDischarge: "2024-01-16",
    diagnosis: "Post Appendectomy",
    doctor: "Dr. Ani Wijaya",
    status: "active",
    los: 3
  },
  { 
    id: 3, 
    patient: "Bambang Hermanto", 
    mrn: "RM-2024-000003",
    room: "ICU-01", 
    bed: "Bed 1",
    class: "ICU",
    admissionDate: "2024-01-14", 
    plannedDischarge: "2024-01-20",
    diagnosis: "Serangan Jantung Akut",
    doctor: "Dr. Budi Santoso",
    status: "critical",
    los: 1
  },
];

const dischargeQueue = [
  { id: 1, patient: "Dewi Lestari", mrn: "RM-2024-000004", room: "K2-01", plannedDate: "2024-01-15", status: "pending_billing" },
  { id: 2, patient: "Eko Prasetyo", mrn: "RM-2024-000005", room: "K3-01", plannedDate: "2024-01-15", status: "pending_pharmacy" },
];

const getClassBadge = (roomClass: string) => {
  const colors: Record<string, string> = {
    "VIP": "bg-purple-500",
    "Kelas 1": "bg-blue-500",
    "Kelas 2": "bg-green-500",
    "Kelas 3": "bg-gray-500",
    "ICU": "bg-red-500",
  };
  return <Badge className={colors[roomClass] || "bg-gray-500"}>{roomClass}</Badge>;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge className="bg-green-500">Aktif</Badge>;
    case "critical":
      return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Kritis</Badge>;
    case "pending_billing":
      return <Badge className="bg-yellow-500">Tunggu Billing</Badge>;
    case "pending_pharmacy":
      return <Badge className="bg-blue-500">Tunggu Farmasi</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function RawatInap() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<typeof rooms[0] | null>(null);
  const [isDischargeOpen, setIsDischargeOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<typeof inpatients[0] | null>(null);

  const totalBeds = rooms.reduce((acc, room) => acc + room.totalBeds, 0);
  const availableBeds = rooms.reduce((acc, room) => acc + room.availableBeds, 0);
  const occupancyRate = ((totalBeds - availableBeds) / totalBeds * 100).toFixed(1);

  const filteredInpatients = inpatients.filter(patient => 
    patient.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.room.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rawat Inap</h1>
          <p className="text-muted-foreground">Manajemen pasien rawat inap dan kamar</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Admisi Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Admisi Pasien Baru</DialogTitle>
                <DialogDescription>Daftarkan pasien untuk rawat inap</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pasien</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih pasien" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="p1">Ahmad Sulaiman - RM-2024-000001</SelectItem>
                        <SelectItem value="p2">Siti Rahmah - RM-2024-000002</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>DPJP</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih dokter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="d1">Dr. Budi Santoso</SelectItem>
                        <SelectItem value="d2">Dr. Ani Wijaya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Kelas Kamar</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kelas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vip">VIP</SelectItem>
                        <SelectItem value="k1">Kelas 1</SelectItem>
                        <SelectItem value="k2">Kelas 2</SelectItem>
                        <SelectItem value="k3">Kelas 3</SelectItem>
                        <SelectItem value="icu">ICU</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Kamar & Bed</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kamar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vip1-1">VIP-01 - Bed 2</SelectItem>
                        <SelectItem value="k1-1">K1-01 - Bed 1</SelectItem>
                        <SelectItem value="k1-2">K1-01 - Bed 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tanggal Masuk</Label>
                    <Input type="datetime-local" />
                  </div>
                  <div className="space-y-2">
                    <Label>Rencana Pulang</Label>
                    <Input type="date" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Diagnosis Masuk</Label>
                  <Input placeholder="Masukkan diagnosis..." />
                </div>
                <div className="space-y-2">
                  <Label>Catatan</Label>
                  <Textarea placeholder="Catatan tambahan..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline">Batal</Button>
                <Button>Simpan Admisi</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Bed</CardTitle>
            <Bed className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBeds}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bed Terisi</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBeds - availableBeds}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bed Kosong</CardTitle>
            <Bed className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{availableBeds}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <Building2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupancyRate}%</div>
            <Progress value={parseFloat(occupancyRate)} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rencana Pulang</CardTitle>
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dischargeQueue.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="patients">
        <TabsList>
          <TabsTrigger value="patients">Pasien Rawat Inap</TabsTrigger>
          <TabsTrigger value="rooms">Manajemen Kamar</TabsTrigger>
          <TabsTrigger value="discharge">Discharge Planning</TabsTrigger>
        </TabsList>

        <TabsContent value="patients" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Daftar Pasien Rawat Inap</CardTitle>
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input 
                    placeholder="Cari pasien..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. RM</TableHead>
                    <TableHead>Nama Pasien</TableHead>
                    <TableHead>Kamar</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Tgl Masuk</TableHead>
                    <TableHead>LOS</TableHead>
                    <TableHead>DPJP</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInpatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">{patient.mrn}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{patient.patient}</p>
                          <p className="text-xs text-muted-foreground">{patient.diagnosis}</p>
                        </div>
                      </TableCell>
                      <TableCell>{patient.room} - {patient.bed}</TableCell>
                      <TableCell>{getClassBadge(patient.class)}</TableCell>
                      <TableCell>{patient.admissionDate}</TableCell>
                      <TableCell>{patient.los} hari</TableCell>
                      <TableCell>{patient.doctor}</TableCell>
                      <TableCell>{getStatusBadge(patient.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <FileText className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedPatient(patient);
                              setIsDischargeOpen(true);
                            }}
                          >
                            <LogOut className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rooms" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <Card key={room.id} className={room.availableBeds === 0 ? "border-red-200 bg-red-50" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{room.name}</CardTitle>
                    {getClassBadge(room.class)}
                  </div>
                  <CardDescription>Kode: {room.code}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Kapasitas:</span>
                      <span className="font-medium">{room.totalBeds} bed</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tersedia:</span>
                      <span className={`font-medium ${room.availableBeds === 0 ? "text-red-600" : "text-green-600"}`}>
                        {room.availableBeds} bed
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tarif/hari:</span>
                      <span className="font-medium">Rp {room.dailyRate.toLocaleString()}</span>
                    </div>
                    <Progress value={(room.totalBeds - room.availableBeds) / room.totalBeds * 100} />
                    <div className="flex gap-2">
                      {Array.from({ length: room.totalBeds }).map((_, idx) => (
                        <div 
                          key={idx}
                          className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium ${
                            idx < room.totalBeds - room.availableBeds 
                              ? "bg-red-100 text-red-700 border border-red-300" 
                              : "bg-green-100 text-green-700 border border-green-300"
                          }`}
                        >
                          {idx + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="discharge" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Antrian Discharge</CardTitle>
              <CardDescription>Pasien yang akan dipulangkan hari ini</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. RM</TableHead>
                    <TableHead>Nama Pasien</TableHead>
                    <TableHead>Kamar</TableHead>
                    <TableHead>Rencana Pulang</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dischargeQueue.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">{patient.mrn}</TableCell>
                      <TableCell>{patient.patient}</TableCell>
                      <TableCell>{patient.room}</TableCell>
                      <TableCell>{patient.plannedDate}</TableCell>
                      <TableCell>{getStatusBadge(patient.status)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">Proses Discharge</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Checklist Discharge</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: "Resume Medis", completed: true },
                  { label: "Resep Pulang", completed: true },
                  { label: "Obat dari Farmasi", completed: false },
                  { label: "Billing Selesai", completed: false },
                  { label: "Surat Keterangan Sakit", completed: true },
                  { label: "Edukasi Pasien", completed: false },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      item.completed ? "bg-green-100" : "bg-gray-100"
                    }`}>
                      {item.completed ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <span className={item.completed ? "text-muted-foreground line-through" : ""}>{item.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Discharge Dialog */}
      <Dialog open={isDischargeOpen} onOpenChange={setIsDischargeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Discharge Pasien</DialogTitle>
            <DialogDescription>
              {selectedPatient?.patient} - {selectedPatient?.mrn}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Pulang</Label>
                <Input type="datetime-local" />
              </div>
              <div className="space-y-2">
                <Label>Tipe Pulang</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sembuh">Sembuh</SelectItem>
                    <SelectItem value="rujuk">Rujuk</SelectItem>
                    <SelectItem value="pulang_paksa">Pulang Paksa</SelectItem>
                    <SelectItem value="meninggal">Meninggal</SelectItem>
                    <SelectItem value="lain">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Resume Medis</Label>
              <Textarea placeholder="Tulis resume medis pasien..." rows={4} />
            </div>
            <div className="space-y-2">
              <Label>Instruksi Pulang</Label>
              <Textarea placeholder="Instruksi untuk pasien setelah pulang..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDischargeOpen(false)}>Batal</Button>
            <Button onClick={() => setIsDischargeOpen(false)}>Proses Discharge</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

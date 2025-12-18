import { useState } from "react";
import { Search, UserPlus, Calendar, Clock, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const queueData = [
  { no: 1, rm: "RM-2024-001234", name: "Ahmad Hidayat", poli: "Poli Umum", doctor: "dr. Sari", status: "Dipanggil", time: "08:30" },
  { no: 2, rm: "RM-2024-001235", name: "Siti Aminah", poli: "Poli Kandungan", doctor: "dr. Maya, Sp.OG", status: "Menunggu", time: "08:35" },
  { no: 3, rm: "RM-2024-001236", name: "Budi Santoso", poli: "Poli Jantung", doctor: "dr. Andi, Sp.JP", status: "Menunggu", time: "08:40" },
  { no: 4, rm: "RM-2024-001237", name: "Dewi Lestari", poli: "Poli Umum", doctor: "dr. Sari", status: "Menunggu", time: "08:45" },
  { no: 5, rm: "RM-2024-001238", name: "Rahmat Wijaya", poli: "Poli Anak", doctor: "dr. Lisa, Sp.A", status: "Menunggu", time: "08:50" },
];

const poliOptions = [
  "Poli Umum",
  "Poli Gigi",
  "Poli Anak",
  "Poli Kandungan",
  "Poli Jantung",
  "Poli Paru",
  "Poli Mata",
  "Poli THT",
  "Poli Kulit",
  "Poli Saraf",
];

export default function Pendaftaran() {
  const [isNewPatient, setIsNewPatient] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pendaftaran Pasien</h1>
          <p className="text-muted-foreground">Kelola pendaftaran dan antrian pasien</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gradient-primary shadow-glow">
              <UserPlus className="h-4 w-4 mr-2" />
              Daftarkan Pasien
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Pendaftaran Pasien</DialogTitle>
              <DialogDescription>
                Daftarkan pasien baru atau cari pasien lama
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="existing" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="existing">Pasien Lama</TabsTrigger>
                <TabsTrigger value="new">Pasien Baru</TabsTrigger>
              </TabsList>

              <TabsContent value="existing" className="space-y-4 mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari No. RM, NIK, atau Nama Pasien..."
                    className="pl-10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Poliklinik</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Poliklinik" />
                      </SelectTrigger>
                      <SelectContent>
                        {poliOptions.map((poli) => (
                          <SelectItem key={poli} value={poli.toLowerCase()}>
                            {poli}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Jenis Pembayaran</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Pembayaran" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bpjs">BPJS Kesehatan</SelectItem>
                        <SelectItem value="umum">Umum / Pribadi</SelectItem>
                        <SelectItem value="asuransi">Asuransi Lain</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="new" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>NIK</Label>
                    <Input placeholder="Masukkan NIK (16 digit)" />
                  </div>
                  <div className="space-y-2">
                    <Label>No. BPJS</Label>
                    <Input placeholder="Masukkan No. BPJS (opsional)" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nama Lengkap</Label>
                    <Input placeholder="Nama sesuai KTP" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tanggal Lahir</Label>
                    <Input type="date" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Jenis Kelamin</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="l">Laki-laki</SelectItem>
                        <SelectItem value="p">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>No. Telepon</Label>
                    <Input placeholder="08xxxxxxxxxx" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Alamat</Label>
                  <Input placeholder="Alamat lengkap" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Poliklinik</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Poliklinik" />
                      </SelectTrigger>
                      <SelectContent>
                        {poliOptions.map((poli) => (
                          <SelectItem key={poli} value={poli.toLowerCase()}>
                            {poli}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Jenis Pembayaran</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Pembayaran" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bpjs">BPJS Kesehatan</SelectItem>
                        <SelectItem value="umum">Umum / Pribadi</SelectItem>
                        <SelectItem value="asuransi">Asuransi Lain</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button variant="outline">Batal</Button>
              <Button className="gradient-primary">Daftarkan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">45</p>
            <p className="text-sm text-muted-foreground">Antrian Hari Ini</p>
          </div>
        </div>
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-success/10">
            <Calendar className="h-6 w-6 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold">32</p>
            <p className="text-sm text-muted-foreground">Sudah Dilayani</p>
          </div>
        </div>
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-warning/10">
            <Clock className="h-6 w-6 text-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold">13</p>
            <p className="text-sm text-muted-foreground">Menunggu</p>
          </div>
        </div>
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-info/10">
            <UserPlus className="h-6 w-6 text-info" />
          </div>
          <div>
            <p className="text-2xl font-bold">8</p>
            <p className="text-sm text-muted-foreground">Pasien Baru</p>
          </div>
        </div>
      </div>

      {/* Queue Table */}
      <div className="module-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Antrian Pasien</h3>
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

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>No. Antrian</th>
                <th>No. RM</th>
                <th>Pasien</th>
                <th>Poliklinik</th>
                <th>Dokter</th>
                <th>Jam Daftar</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {queueData.map((patient) => (
                <tr key={patient.no}>
                  <td>
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                      {patient.no}
                    </span>
                  </td>
                  <td className="font-mono text-xs">{patient.rm}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {patient.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{patient.name}</span>
                    </div>
                  </td>
                  <td>{patient.poli}</td>
                  <td>{patient.doctor}</td>
                  <td>{patient.time}</td>
                  <td>
                    <Badge
                      variant="outline"
                      className={
                        patient.status === "Dipanggil"
                          ? "bg-success/10 text-success border-success/20"
                          : "bg-warning/10 text-warning border-warning/20"
                      }
                    >
                      {patient.status}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        Panggil
                      </Button>
                      <Button size="sm" variant="ghost">
                        Detail
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

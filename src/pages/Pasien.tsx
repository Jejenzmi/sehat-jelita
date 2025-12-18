import { useState } from "react";
import { Search, Filter, Download, Eye, Edit, MoreHorizontal, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const patientsData = [
  {
    id: "RM-2024-001234",
    nik: "3201234567890001",
    name: "Ahmad Hidayat",
    gender: "L",
    birthDate: "1979-05-15",
    age: 45,
    phone: "081234567890",
    address: "Jl. Merdeka No. 123, Jakarta",
    bpjs: "0001234567890",
    lastVisit: "2024-01-15",
    totalVisits: 12,
  },
  {
    id: "RM-2024-001235",
    nik: "3201234567890002",
    name: "Siti Aminah",
    gender: "P",
    birthDate: "1992-08-20",
    age: 32,
    phone: "081234567891",
    address: "Jl. Sudirman No. 456, Jakarta",
    bpjs: "0001234567891",
    lastVisit: "2024-01-14",
    totalVisits: 8,
  },
  {
    id: "RM-2024-001236",
    nik: "3201234567890003",
    name: "Budi Santoso",
    gender: "L",
    birthDate: "1966-03-10",
    age: 58,
    phone: "081234567892",
    address: "Jl. Gatot Subroto No. 789, Jakarta",
    bpjs: "0001234567892",
    lastVisit: "2024-01-13",
    totalVisits: 25,
  },
  {
    id: "RM-2024-001237",
    nik: "3201234567890004",
    name: "Dewi Lestari",
    gender: "P",
    birthDate: "1996-11-25",
    age: 28,
    phone: "081234567893",
    address: "Jl. Asia Afrika No. 101, Bandung",
    bpjs: null,
    lastVisit: "2024-01-12",
    totalVisits: 3,
  },
  {
    id: "RM-2024-001238",
    nik: "3201234567890005",
    name: "Rahmat Wijaya",
    gender: "L",
    birthDate: "1957-07-08",
    age: 67,
    phone: "081234567894",
    address: "Jl. Diponegoro No. 202, Surabaya",
    bpjs: "0001234567894",
    lastVisit: "2024-01-11",
    totalVisits: 45,
  },
];

export default function Pasien() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Data Pasien</h1>
          <p className="text-muted-foreground">Kelola data pasien rumah sakit</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">12,458</p>
            <p className="text-sm text-muted-foreground">Total Pasien</p>
          </div>
        </div>
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-success/10">
            <Users className="h-6 w-6 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold">8,234</p>
            <p className="text-sm text-muted-foreground">Pasien BPJS</p>
          </div>
        </div>
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-info/10">
            <Users className="h-6 w-6 text-info" />
          </div>
          <div>
            <p className="text-2xl font-bold">4,224</p>
            <p className="text-sm text-muted-foreground">Pasien Umum</p>
          </div>
        </div>
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-warning/10">
            <Users className="h-6 w-6 text-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold">156</p>
            <p className="text-sm text-muted-foreground">Pasien Baru (Bulan Ini)</p>
          </div>
        </div>
      </div>

      {/* Patient List */}
      <div className="module-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-semibold">Daftar Pasien</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari No. RM, NIK, atau Nama..."
                className="pl-10 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="bpjs">BPJS</SelectItem>
                <SelectItem value="umum">Umum</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>No. RM</th>
                <th>Pasien</th>
                <th>NIK</th>
                <th>No. BPJS</th>
                <th>No. Telepon</th>
                <th>Kunjungan Terakhir</th>
                <th>Total Kunjungan</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {patientsData.map((patient) => (
                <tr key={patient.id}>
                  <td className="font-mono text-xs font-medium">{patient.id}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {patient.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{patient.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {patient.gender === "L" ? "Laki-laki" : "Perempuan"}, {patient.age} tahun
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="font-mono text-xs">{patient.nik}</td>
                  <td>
                    {patient.bpjs ? (
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {patient.bpjs}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-muted text-muted-foreground">
                        Umum
                      </Badge>
                    )}
                  </td>
                  <td className="text-sm">{patient.phone}</td>
                  <td className="text-sm text-muted-foreground">{patient.lastVisit}</td>
                  <td>
                    <Badge variant="outline">{patient.totalVisits}x</Badge>
                  </td>
                  <td>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Lihat Detail
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Data
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Riwayat Kunjungan
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Rekam Medis
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted-foreground">
            Menampilkan 1-5 dari 12,458 pasien
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              Sebelumnya
            </Button>
            <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
              1
            </Button>
            <Button variant="outline" size="sm">
              2
            </Button>
            <Button variant="outline" size="sm">
              3
            </Button>
            <Button variant="outline" size="sm">
              Selanjutnya
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

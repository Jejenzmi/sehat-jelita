import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye } from "lucide-react";

const recentPatients = [
  {
    id: "RM-2024-001234",
    name: "Ahmad Hidayat",
    age: 45,
    gender: "L",
    service: "Poli Umum",
    status: "Menunggu",
    time: "08:30",
    payment: "BPJS",
  },
  {
    id: "RM-2024-001235",
    name: "Siti Aminah",
    age: 32,
    gender: "P",
    service: "Poli Kandungan",
    status: "Dilayani",
    time: "08:45",
    payment: "Umum",
  },
  {
    id: "RM-2024-001236",
    name: "Budi Santoso",
    age: 58,
    gender: "L",
    service: "Poli Jantung",
    status: "Selesai",
    time: "09:00",
    payment: "BPJS",
  },
  {
    id: "RM-2024-001237",
    name: "Dewi Lestari",
    age: 28,
    gender: "P",
    service: "IGD",
    status: "Menunggu",
    time: "09:15",
    payment: "Asuransi",
  },
  {
    id: "RM-2024-001238",
    name: "Rahmat Wijaya",
    age: 67,
    gender: "L",
    service: "Rawat Inap",
    status: "Dilayani",
    time: "09:30",
    payment: "BPJS",
  },
];

const statusStyles: Record<string, string> = {
  Menunggu: "bg-warning/10 text-warning border-warning/20",
  Dilayani: "bg-info/10 text-info border-info/20",
  Selesai: "bg-success/10 text-success border-success/20",
};

const paymentStyles: Record<string, string> = {
  BPJS: "bg-primary/10 text-primary",
  Umum: "bg-muted text-muted-foreground",
  Asuransi: "bg-medical-purple/10 text-medical-purple",
};

export function RecentPatients() {
  return (
    <div className="module-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Pasien Terbaru</h3>
          <p className="text-sm text-muted-foreground">Daftar pasien hari ini</p>
        </div>
        <Button variant="outline" size="sm">
          Lihat Semua
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>No. RM</th>
              <th>Pasien</th>
              <th>Layanan</th>
              <th>Pembayaran</th>
              <th>Status</th>
              <th>Jam</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {recentPatients.map((patient) => (
              <tr key={patient.id}>
                <td className="font-mono text-xs">{patient.id}</td>
                <td>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {patient.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{patient.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {patient.gender === "L" ? "Laki-laki" : "Perempuan"}, {patient.age} tahun
                      </p>
                    </div>
                  </div>
                </td>
                <td className="text-sm">{patient.service}</td>
                <td>
                  <Badge variant="secondary" className={paymentStyles[patient.payment]}>
                    {patient.payment}
                  </Badge>
                </td>
                <td>
                  <Badge variant="outline" className={statusStyles[patient.status]}>
                    {patient.status}
                  </Badge>
                </td>
                <td className="text-sm text-muted-foreground">{patient.time}</td>
                <td>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

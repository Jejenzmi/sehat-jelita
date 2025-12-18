import { Link } from "react-router-dom";
import {
  UserPlus,
  FileText,
  Pill,
  CreditCard,
  Ambulance,
  BedDouble,
  FlaskConical,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

const quickActions = [
  {
    icon: UserPlus,
    label: "Pendaftaran Baru",
    description: "Daftarkan pasien baru",
    path: "/pendaftaran",
    color: "bg-primary/10 text-primary hover:bg-primary/20",
  },
  {
    icon: Ambulance,
    label: "IGD",
    description: "Akses cepat IGD",
    path: "/igd",
    color: "bg-destructive/10 text-destructive hover:bg-destructive/20",
  },
  {
    icon: FileText,
    label: "Rekam Medis",
    description: "Cari rekam medis",
    path: "/rekam-medis",
    color: "bg-medical-blue/10 text-medical-blue hover:bg-medical-blue/20",
  },
  {
    icon: BedDouble,
    label: "Rawat Inap",
    description: "Kelola kamar",
    path: "/rawat-inap",
    color: "bg-medical-purple/10 text-medical-purple hover:bg-medical-purple/20",
  },
  {
    icon: Pill,
    label: "Farmasi",
    description: "Resep & obat",
    path: "/farmasi",
    color: "bg-success/10 text-success hover:bg-success/20",
  },
  {
    icon: FlaskConical,
    label: "Laboratorium",
    description: "Hasil lab",
    path: "/laboratorium",
    color: "bg-warning/10 text-warning hover:bg-warning/20",
  },
  {
    icon: CreditCard,
    label: "Kasir",
    description: "Pembayaran",
    path: "/billing",
    color: "bg-medical-coral/10 text-medical-coral hover:bg-medical-coral/20",
  },
  {
    icon: Calendar,
    label: "Jadwal Dokter",
    description: "Lihat jadwal",
    path: "/jadwal-dokter",
    color: "bg-info/10 text-info hover:bg-info/20",
  },
];

export function QuickActions() {
  return (
    <div className="module-card">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Aksi Cepat</h3>
        <p className="text-sm text-muted-foreground">Akses modul dengan cepat</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <Link
            key={action.path}
            to={action.path}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 group",
              action.color
            )}
          >
            <action.icon className="h-6 w-6 transition-transform group-hover:scale-110" />
            <div className="text-center">
              <p className="text-sm font-medium">{action.label}</p>
              <p className="text-xs opacity-70 hidden sm:block">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

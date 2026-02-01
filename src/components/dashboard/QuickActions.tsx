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
  Radio,
  Droplet,
  UtensilsCrossed,
  Activity,
  ClipboardCheck,
  Skull,
  Wrench,
  HeartPulse,
  Syringe,
  BarChart3,
  FileBarChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMenuAccess } from "@/hooks/useMenuAccess";
import { useAuth } from "@/hooks/useAuth";

type AppRole = "admin" | "dokter" | "perawat" | "kasir" | "farmasi" | "laboratorium" | "radiologi" | "pendaftaran" | "keuangan" | "gizi" | "icu" | "bedah" | "rehabilitasi" | "mcu" | "forensik" | "cssd" | "manajemen" | "bank_darah" | "hemodialisa";

interface QuickAction {
  icon: React.ElementType;
  label: string;
  description: string;
  path: string;
  color: string;
  roles?: AppRole[]; // If specified, only show for these roles
}

const allQuickActions: QuickAction[] = [
  // General - shown to most users
  {
    icon: UserPlus,
    label: "Pendaftaran Baru",
    description: "Daftarkan pasien baru",
    path: "/pendaftaran",
    color: "bg-primary/10 text-primary hover:bg-primary/20",
    roles: ["admin", "pendaftaran"],
  },
  {
    icon: Ambulance,
    label: "IGD",
    description: "Akses cepat IGD",
    path: "/igd",
    color: "bg-destructive/10 text-destructive hover:bg-destructive/20",
    roles: ["admin", "dokter", "perawat"],
  },
  {
    icon: FileText,
    label: "Rekam Medis",
    description: "Cari rekam medis",
    path: "/rekam-medis",
    color: "bg-medical-blue/10 text-medical-blue hover:bg-medical-blue/20",
    roles: ["admin", "dokter", "perawat", "icu", "bedah"],
  },
  {
    icon: BedDouble,
    label: "Rawat Inap",
    description: "Kelola kamar",
    path: "/rawat-inap",
    color: "bg-medical-purple/10 text-medical-purple hover:bg-medical-purple/20",
    roles: ["admin", "dokter", "perawat", "icu", "bedah", "gizi", "bank_darah"],
  },
  {
    icon: Pill,
    label: "Farmasi",
    description: "Resep & obat",
    path: "/farmasi",
    color: "bg-success/10 text-success hover:bg-success/20",
    roles: ["admin", "farmasi"],
  },
  {
    icon: FlaskConical,
    label: "Laboratorium",
    description: "Hasil lab",
    path: "/laboratorium",
    color: "bg-warning/10 text-warning hover:bg-warning/20",
    roles: ["admin", "laboratorium", "dokter", "mcu"],
  },
  {
    icon: Radio,
    label: "Radiologi",
    description: "Hasil radiologi",
    path: "/radiologi",
    color: "bg-info/10 text-info hover:bg-info/20",
    roles: ["admin", "radiologi", "dokter", "mcu"],
  },
  {
    icon: CreditCard,
    label: "Kasir",
    description: "Pembayaran",
    path: "/billing",
    color: "bg-medical-coral/10 text-medical-coral hover:bg-medical-coral/20",
    roles: ["admin", "kasir", "keuangan"],
  },
  {
    icon: Calendar,
    label: "Jadwal Dokter",
    description: "Lihat jadwal",
    path: "/jadwal-dokter",
    color: "bg-info/10 text-info hover:bg-info/20",
    roles: ["admin", "pendaftaran", "dokter"],
  },
  // Specialized modules
  {
    icon: HeartPulse,
    label: "ICU",
    description: "Monitoring ICU",
    path: "/icu",
    color: "bg-destructive/10 text-destructive hover:bg-destructive/20",
    roles: ["admin", "icu", "dokter", "perawat"],
  },
  {
    icon: Syringe,
    label: "Kamar Operasi",
    description: "Jadwal operasi",
    path: "/kamar-operasi",
    color: "bg-medical-purple/10 text-medical-purple hover:bg-medical-purple/20",
    roles: ["admin", "bedah", "dokter"],
  },
  {
    icon: Droplet,
    label: "Bank Darah",
    description: "Stok darah",
    path: "/bank-darah",
    color: "bg-destructive/10 text-destructive hover:bg-destructive/20",
    roles: ["admin", "bank_darah"],
  },
  {
    icon: Droplet,
    label: "Hemodialisa",
    description: "Jadwal HD",
    path: "/hemodialisa",
    color: "bg-warning/10 text-warning hover:bg-warning/20",
    roles: ["admin", "hemodialisa"],
  },
  {
    icon: UtensilsCrossed,
    label: "Gizi",
    description: "Dietary pasien",
    path: "/gizi",
    color: "bg-success/10 text-success hover:bg-success/20",
    roles: ["admin", "gizi"],
  },
  {
    icon: Activity,
    label: "Rehabilitasi",
    description: "Fisioterapi",
    path: "/rehabilitasi",
    color: "bg-medical-blue/10 text-medical-blue hover:bg-medical-blue/20",
    roles: ["admin", "rehabilitasi"],
  },
  {
    icon: ClipboardCheck,
    label: "MCU",
    description: "Medical Check Up",
    path: "/mcu",
    color: "bg-success/10 text-success hover:bg-success/20",
    roles: ["admin", "mcu"],
  },
  {
    icon: Skull,
    label: "Forensik",
    description: "Kamar jenazah",
    path: "/forensik",
    color: "bg-muted-foreground/10 text-muted-foreground hover:bg-muted-foreground/20",
    roles: ["admin", "forensik"],
  },
  {
    icon: Wrench,
    label: "Penunjang",
    description: "CSSD & Laundry",
    path: "/penunjang",
    color: "bg-muted-foreground/10 text-muted-foreground hover:bg-muted-foreground/20",
    roles: ["admin", "cssd"],
  },
  {
    icon: FileBarChart,
    label: "Akuntansi",
    description: "Laporan keuangan",
    path: "/akuntansi",
    color: "bg-primary/10 text-primary hover:bg-primary/20",
    roles: ["admin", "keuangan"],
  },
  {
    icon: BarChart3,
    label: "Executive",
    description: "Dashboard eksekutif",
    path: "/dashboard-executive",
    color: "bg-primary/10 text-primary hover:bg-primary/20",
    roles: ["admin", "manajemen"],
  },
];

export function QuickActions() {
  const { canViewPath } = useMenuAccess();
  const { roles } = useAuth();

  // Filter actions based on:
  // 1. User can view the path (menu access)
  // 2. If roles specified, user has at least one matching role
  const filteredActions = allQuickActions.filter((action) => {
    // First check menu access
    if (!canViewPath(action.path)) return false;
    
    // If no specific roles, show to anyone with access
    if (!action.roles) return true;
    
    // Check if user has any of the required roles
    const userRoleStrings = roles as string[];
    return action.roles.some(role => userRoleStrings.includes(role));
  }).slice(0, 8); // Limit to 8 quick actions

  if (filteredActions.length === 0) {
    return null;
  }

  return (
    <div className="module-card">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Aksi Cepat</h3>
        <p className="text-sm text-muted-foreground">Akses modul dengan cepat</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {filteredActions.map((action) => (
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

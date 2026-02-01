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
  Video,
  Users,
  ListOrdered,
  Package,
  UserCog,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMenuAccess } from "@/hooks/useMenuAccess";
import { useAuth } from "@/hooks/useAuth";

interface QuickAction {
  icon: React.ElementType;
  label: string;
  description: string;
  path: string;
  color: string;
  priority: number; // Lower = higher priority for this role
}

// Role-specific quick actions - prioritized by job function
const roleQuickActions: Record<string, QuickAction[]> = {
  admin: [
    { icon: UserPlus, label: "Pendaftaran", description: "Daftarkan pasien", path: "/pendaftaran", color: "bg-primary/10 text-primary hover:bg-primary/20", priority: 1 },
    { icon: Users, label: "Pasien", description: "Data pasien", path: "/pasien", color: "bg-medical-blue/10 text-medical-blue hover:bg-medical-blue/20", priority: 2 },
    { icon: Ambulance, label: "IGD", description: "Akses IGD", path: "/igd", color: "bg-destructive/10 text-destructive hover:bg-destructive/20", priority: 3 },
    { icon: FileText, label: "Rekam Medis", description: "Rekam medis", path: "/rekam-medis", color: "bg-medical-blue/10 text-medical-blue hover:bg-medical-blue/20", priority: 4 },
    { icon: CreditCard, label: "Billing", description: "Pembayaran", path: "/billing", color: "bg-medical-coral/10 text-medical-coral hover:bg-medical-coral/20", priority: 5 },
    { icon: BarChart3, label: "Executive", description: "Dashboard", path: "/dashboard-executive", color: "bg-primary/10 text-primary hover:bg-primary/20", priority: 6 },
    { icon: UserCog, label: "Manajemen User", description: "Kelola akses", path: "/manajemen-user", color: "bg-medical-purple/10 text-medical-purple hover:bg-medical-purple/20", priority: 7 },
    { icon: Award, label: "Mutu", description: "Akreditasi", path: "/mutu", color: "bg-success/10 text-success hover:bg-success/20", priority: 8 },
  ],
  dokter: [
    { icon: BedDouble, label: "Rawat Jalan", description: "Pasien poliklinik", path: "/rawat-jalan", color: "bg-medical-blue/10 text-medical-blue hover:bg-medical-blue/20", priority: 1 },
    { icon: BedDouble, label: "Rawat Inap", description: "Pasien inap", path: "/rawat-inap", color: "bg-medical-purple/10 text-medical-purple hover:bg-medical-purple/20", priority: 2 },
    { icon: Ambulance, label: "IGD", description: "Emergency", path: "/igd", color: "bg-destructive/10 text-destructive hover:bg-destructive/20", priority: 3 },
    { icon: FileText, label: "Rekam Medis", description: "SOAP & catatan", path: "/rekam-medis", color: "bg-medical-blue/10 text-medical-blue hover:bg-medical-blue/20", priority: 4 },
    { icon: Syringe, label: "Kamar Operasi", description: "Jadwal OK", path: "/kamar-operasi", color: "bg-medical-purple/10 text-medical-purple hover:bg-medical-purple/20", priority: 5 },
    { icon: HeartPulse, label: "ICU", description: "Intensive care", path: "/icu", color: "bg-destructive/10 text-destructive hover:bg-destructive/20", priority: 6 },
    { icon: Video, label: "Telemedicine", description: "Konsultasi online", path: "/telemedicine", color: "bg-info/10 text-info hover:bg-info/20", priority: 7 },
    { icon: Calendar, label: "Jadwal", description: "Jadwal praktik", path: "/jadwal-dokter", color: "bg-success/10 text-success hover:bg-success/20", priority: 8 },
  ],
  perawat: [
    { icon: BedDouble, label: "Rawat Jalan", description: "Asuhan keperawatan", path: "/rawat-jalan", color: "bg-medical-blue/10 text-medical-blue hover:bg-medical-blue/20", priority: 1 },
    { icon: BedDouble, label: "Rawat Inap", description: "Monitoring pasien", path: "/rawat-inap", color: "bg-medical-purple/10 text-medical-purple hover:bg-medical-purple/20", priority: 2 },
    { icon: Ambulance, label: "IGD", description: "Triase & emergency", path: "/igd", color: "bg-destructive/10 text-destructive hover:bg-destructive/20", priority: 3 },
    { icon: HeartPulse, label: "ICU", description: "Monitoring ICU", path: "/icu", color: "bg-destructive/10 text-destructive hover:bg-destructive/20", priority: 4 },
    { icon: FileText, label: "Rekam Medis", description: "Catatan asuhan", path: "/rekam-medis", color: "bg-medical-blue/10 text-medical-blue hover:bg-medical-blue/20", priority: 5 },
    { icon: ListOrdered, label: "Antrian", description: "Status antrian", path: "/antrian", color: "bg-info/10 text-info hover:bg-info/20", priority: 6 },
  ],
  kasir: [
    { icon: CreditCard, label: "Billing", description: "Pembayaran pasien", path: "/billing", color: "bg-medical-coral/10 text-medical-coral hover:bg-medical-coral/20", priority: 1 },
    { icon: ListOrdered, label: "Antrian Bayar", description: "Antrian kasir", path: "/antrian", color: "bg-info/10 text-info hover:bg-info/20", priority: 2 },
  ],
  pendaftaran: [
    { icon: UserPlus, label: "Pendaftaran", description: "Daftar pasien baru", path: "/pendaftaran", color: "bg-primary/10 text-primary hover:bg-primary/20", priority: 1 },
    { icon: Users, label: "Data Pasien", description: "Cari & edit pasien", path: "/pasien", color: "bg-medical-blue/10 text-medical-blue hover:bg-medical-blue/20", priority: 2 },
    { icon: ListOrdered, label: "Antrian", description: "Kelola antrian", path: "/antrian", color: "bg-info/10 text-info hover:bg-info/20", priority: 3 },
    { icon: Calendar, label: "Jadwal Dokter", description: "Lihat jadwal", path: "/jadwal-dokter", color: "bg-success/10 text-success hover:bg-success/20", priority: 4 },
  ],
  farmasi: [
    { icon: Pill, label: "Farmasi", description: "Dispensing obat", path: "/farmasi", color: "bg-success/10 text-success hover:bg-success/20", priority: 1 },
    { icon: Package, label: "Stok Obat", description: "Inventory obat", path: "/inventory", color: "bg-warning/10 text-warning hover:bg-warning/20", priority: 2 },
  ],
  laboratorium: [
    { icon: FlaskConical, label: "Laboratorium", description: "Input hasil lab", path: "/laboratorium", color: "bg-warning/10 text-warning hover:bg-warning/20", priority: 1 },
  ],
  radiologi: [
    { icon: Radio, label: "Radiologi", description: "Hasil imaging", path: "/radiologi", color: "bg-info/10 text-info hover:bg-info/20", priority: 1 },
  ],
  keuangan: [
    { icon: CreditCard, label: "Billing", description: "Tagihan & pembayaran", path: "/billing", color: "bg-medical-coral/10 text-medical-coral hover:bg-medical-coral/20", priority: 1 },
    { icon: FileBarChart, label: "Akuntansi", description: "Jurnal & laporan", path: "/akuntansi", color: "bg-primary/10 text-primary hover:bg-primary/20", priority: 2 },
    { icon: HeartPulse, label: "BPJS", description: "Klaim BPJS", path: "/bpjs", color: "bg-success/10 text-success hover:bg-success/20", priority: 3 },
    { icon: HeartPulse, label: "Asuransi", description: "Klaim asuransi", path: "/asuransi", color: "bg-info/10 text-info hover:bg-info/20", priority: 4 },
    { icon: BarChart3, label: "Laporan", description: "Laporan keuangan", path: "/laporan", color: "bg-medical-purple/10 text-medical-purple hover:bg-medical-purple/20", priority: 5 },
  ],
  gizi: [
    { icon: UtensilsCrossed, label: "Gizi", description: "Diet & menu pasien", path: "/gizi", color: "bg-success/10 text-success hover:bg-success/20", priority: 1 },
  ],
  icu: [
    { icon: HeartPulse, label: "ICU", description: "Monitoring ICU", path: "/icu", color: "bg-destructive/10 text-destructive hover:bg-destructive/20", priority: 1 },
    { icon: FileText, label: "Rekam Medis", description: "Catatan medis", path: "/rekam-medis", color: "bg-medical-blue/10 text-medical-blue hover:bg-medical-blue/20", priority: 2 },
  ],
  bedah: [
    { icon: Syringe, label: "Kamar Operasi", description: "Jadwal & OK", path: "/kamar-operasi", color: "bg-medical-purple/10 text-medical-purple hover:bg-medical-purple/20", priority: 1 },
    { icon: FileText, label: "Rekam Medis", description: "Catatan operasi", path: "/rekam-medis", color: "bg-medical-blue/10 text-medical-blue hover:bg-medical-blue/20", priority: 2 },
  ],
  rehabilitasi: [
    { icon: Activity, label: "Rehabilitasi", description: "Jadwal fisioterapi", path: "/rehabilitasi", color: "bg-medical-blue/10 text-medical-blue hover:bg-medical-blue/20", priority: 1 },
  ],
  mcu: [
    { icon: ClipboardCheck, label: "MCU", description: "Medical Check Up", path: "/mcu", color: "bg-success/10 text-success hover:bg-success/20", priority: 1 },
    { icon: FlaskConical, label: "Lab MCU", description: "Hasil lab MCU", path: "/laboratorium", color: "bg-warning/10 text-warning hover:bg-warning/20", priority: 2 },
    { icon: Radio, label: "Radiologi MCU", description: "Hasil imaging", path: "/radiologi", color: "bg-info/10 text-info hover:bg-info/20", priority: 3 },
  ],
  forensik: [
    { icon: Skull, label: "Forensik", description: "Kamar jenazah", path: "/forensik", color: "bg-muted-foreground/10 text-muted-foreground hover:bg-muted-foreground/20", priority: 1 },
  ],
  cssd: [
    { icon: Wrench, label: "Penunjang", description: "CSSD & maintenance", path: "/penunjang", color: "bg-muted-foreground/10 text-muted-foreground hover:bg-muted-foreground/20", priority: 1 },
  ],
  manajemen: [
    { icon: BarChart3, label: "Executive", description: "Dashboard eksekutif", path: "/dashboard-executive", color: "bg-primary/10 text-primary hover:bg-primary/20", priority: 1 },
    { icon: UserCog, label: "SDM", description: "Manajemen SDM", path: "/sdm", color: "bg-medical-blue/10 text-medical-blue hover:bg-medical-blue/20", priority: 2 },
    { icon: Award, label: "Mutu", description: "Akreditasi", path: "/mutu", color: "bg-success/10 text-success hover:bg-success/20", priority: 3 },
    { icon: FileBarChart, label: "Laporan", description: "Laporan manajemen", path: "/laporan", color: "bg-medical-purple/10 text-medical-purple hover:bg-medical-purple/20", priority: 4 },
  ],
  bank_darah: [
    { icon: Droplet, label: "Bank Darah", description: "Stok & crossmatch", path: "/bank-darah", color: "bg-destructive/10 text-destructive hover:bg-destructive/20", priority: 1 },
  ],
  hemodialisa: [
    { icon: Droplet, label: "Hemodialisa", description: "Jadwal HD", path: "/hemodialisa", color: "bg-warning/10 text-warning hover:bg-warning/20", priority: 1 },
  ],
};

export function QuickActions() {
  const { canViewPath } = useMenuAccess();
  const { roles } = useAuth();

  // Get primary role's quick actions
  const primaryRole = roles[0] || "admin";
  const roleActions = roleQuickActions[primaryRole] || roleQuickActions.admin;

  // Filter actions based on actual menu access and sort by priority
  const filteredActions = roleActions
    .filter((action) => canViewPath(action.path))
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 8);

  if (filteredActions.length === 0) {
    return null;
  }

  return (
    <div className="module-card">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Aksi Cepat</h3>
        <p className="text-sm text-muted-foreground">Akses modul dengan cepat sesuai tugas Anda</p>
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

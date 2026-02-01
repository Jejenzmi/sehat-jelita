import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Stethoscope, 
  HeartPulse, 
  Pill, 
  FlaskConical, 
  Radio, 
  CreditCard, 
  UserPlus, 
  FileBarChart,
  UtensilsCrossed,
  Activity,
  ClipboardCheck,
  Skull,
  Wrench,
  Droplet,
  Syringe
} from "lucide-react";

interface RoleInfo {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  features: string[];
}

const roleInfoMap: Record<string, RoleInfo> = {
  admin: {
    title: "Administrator",
    description: "Akses penuh ke seluruh modul sistem",
    icon: HeartPulse,
    color: "bg-primary text-primary-foreground",
    features: ["Manajemen User", "Pengaturan Sistem", "Semua Modul", "Laporan Lengkap"],
  },
  dokter: {
    title: "Dokter",
    description: "Pelayanan medis dan rekam medis",
    icon: Stethoscope,
    color: "bg-medical-blue text-white",
    features: ["Rawat Jalan", "Rawat Inap", "IGD", "Rekam Medis", "Telemedicine"],
  },
  perawat: {
    title: "Perawat",
    description: "Asuhan keperawatan dan monitoring pasien",
    icon: HeartPulse,
    color: "bg-success text-white",
    features: ["Rawat Jalan", "Rawat Inap", "IGD", "ICU", "Monitoring Vital"],
  },
  kasir: {
    title: "Kasir",
    description: "Pembayaran dan billing pasien",
    icon: CreditCard,
    color: "bg-medical-coral text-white",
    features: ["Billing", "Pembayaran", "Klaim BPJS", "Asuransi"],
  },
  farmasi: {
    title: "Farmasi",
    description: "Manajemen obat dan resep",
    icon: Pill,
    color: "bg-success text-white",
    features: ["Dispensing Obat", "Stok Obat", "Inventory", "Laporan"],
  },
  laboratorium: {
    title: "Laboratorium",
    description: "Pemeriksaan dan hasil lab",
    icon: FlaskConical,
    color: "bg-warning text-white",
    features: ["Pemeriksaan Lab", "Input Hasil", "Validasi", "Laporan"],
  },
  radiologi: {
    title: "Radiologi",
    description: "Pemeriksaan radiologi dan imaging",
    icon: Radio,
    color: "bg-info text-white",
    features: ["Rontgen", "CT Scan", "MRI", "USG", "Laporan"],
  },
  pendaftaran: {
    title: "Pendaftaran",
    description: "Registrasi dan antrian pasien",
    icon: UserPlus,
    color: "bg-primary text-primary-foreground",
    features: ["Pendaftaran Baru", "Antrian", "Jadwal Dokter", "BPJS"],
  },
  keuangan: {
    title: "Keuangan",
    description: "Akuntansi dan laporan keuangan",
    icon: FileBarChart,
    color: "bg-primary text-primary-foreground",
    features: ["Billing", "Akuntansi", "Laporan Keuangan", "Klaim BPJS"],
  },
  manajemen: {
    title: "Manajemen",
    description: "Dashboard eksekutif dan laporan",
    icon: FileBarChart,
    color: "bg-medical-purple text-white",
    features: ["Dashboard Eksekutif", "Laporan", "SDM", "Mutu & Akreditasi"],
  },
  gizi: {
    title: "Gizi",
    description: "Pelayanan gizi dan diet pasien",
    icon: UtensilsCrossed,
    color: "bg-success text-white",
    features: ["Perencanaan Diet", "Menu Pasien", "Alergi Makanan", "Laporan"],
  },
  icu: {
    title: "ICU",
    description: "Intensive Care Unit",
    icon: HeartPulse,
    color: "bg-destructive text-white",
    features: ["Monitoring ICU", "Rekam Medis", "Rawat Inap", "Scoring"],
  },
  bedah: {
    title: "Bedah",
    description: "Kamar operasi dan jadwal bedah",
    icon: Syringe,
    color: "bg-medical-purple text-white",
    features: ["Jadwal Operasi", "Kamar OK", "Rekam Medis", "Rawat Inap"],
  },
  rehabilitasi: {
    title: "Rehabilitasi",
    description: "Fisioterapi dan rehabilitasi medik",
    icon: Activity,
    color: "bg-medical-blue text-white",
    features: ["Jadwal Terapi", "Tipe Terapi", "Laporan", "Pasien"],
  },
  mcu: {
    title: "Medical Check Up",
    description: "Pemeriksaan kesehatan berkala",
    icon: ClipboardCheck,
    color: "bg-success text-white",
    features: ["Paket MCU", "Registrasi", "Hasil Lab/Radiologi", "Laporan"],
  },
  forensik: {
    title: "Forensik",
    description: "Kedokteran forensik dan kamar jenazah",
    icon: Skull,
    color: "bg-muted-foreground text-white",
    features: ["Kamar Jenazah", "Otopsi", "Visum", "Sertifikat Kematian"],
  },
  cssd: {
    title: "CSSD",
    description: "Sterilisasi dan penunjang",
    icon: Wrench,
    color: "bg-muted-foreground text-white",
    features: ["CSSD", "Laundry", "Maintenance", "Inventory"],
  },
  bank_darah: {
    title: "Bank Darah",
    description: "Unit transfusi darah",
    icon: Droplet,
    color: "bg-destructive text-white",
    features: ["Stok Darah", "Crossmatch", "Transfusi", "Laporan"],
  },
};

export function RoleDashboardContent() {
  const { roles } = useAuth();

  // Get the primary role (first role in the array)
  const primaryRole = roles[0] || "user";
  const roleInfo = roleInfoMap[primaryRole];

  if (!roleInfo) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${roleInfo.color}`}>
            <roleInfo.icon className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-lg">{roleInfo.title}</CardTitle>
            <CardDescription>{roleInfo.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {roleInfo.features.map((feature) => (
            <Badge key={feature} variant="secondary" className="text-xs">
              {feature}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

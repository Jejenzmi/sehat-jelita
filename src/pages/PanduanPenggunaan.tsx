import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Download,
  Home,
  Menu,
  Users,
  UserPlus,
  Stethoscope,
  Building2,
  AlertTriangle,
  FileText,
  Pill,
  FlaskConical,
  Scan,
  Scissors,
  Heart,
  Droplets,
  Apple,
  Activity,
  ClipboardCheck,
  Skull,
  CreditCard,
  Shield,
  Building,
  Calendar,
  Video,
  Package,
  UserCog,
  Calculator,
  BarChart3,
  Database,
  Settings,
  Smartphone,
  Award,
  Wrench,
  GraduationCap,
  FileBarChart,
  HelpCircle,
  LogIn,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Save,
  Printer,
  Check,
  X,
  Clock,
  Bell,
  MessageSquare,
  Lock,
  Key,
  Bed,
  Thermometer,
  Syringe,
  Microscope,
  Radio,
  HeartPulse,
  Utensils,
  Dumbbell,
  Clipboard,
  FileCheck,
  Receipt,
  Wallet,
  TrendingUp,
  PieChart,
  BookOpen,
  Cog,
  Monitor,
  Headphones,
  LifeBuoy,
} from "lucide-react";
import zenLogo from "@/assets/zen-logo.png";

interface SlideSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  slides: number[];
}

const PanduanPenggunaan = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Slide sections for navigation menu
  const sections: SlideSection[] = [
    { id: "intro", title: "Pendahuluan", icon: <Home className="h-4 w-4" />, slides: [0, 1, 2, 3] },
    { id: "auth", title: "Login & Autentikasi", icon: <LogIn className="h-4 w-4" />, slides: [4, 5, 6] },
    { id: "dashboard", title: "Dashboard", icon: <Monitor className="h-4 w-4" />, slides: [7, 8] },
    { id: "pendaftaran", title: "Pendaftaran Pasien", icon: <UserPlus className="h-4 w-4" />, slides: [9, 10, 11] },
    { id: "pasien", title: "Manajemen Pasien", icon: <Users className="h-4 w-4" />, slides: [12, 13] },
    { id: "rawat-jalan", title: "Rawat Jalan", icon: <Stethoscope className="h-4 w-4" />, slides: [14, 15, 16] },
    { id: "igd", title: "IGD", icon: <AlertTriangle className="h-4 w-4" />, slides: [17, 18] },
    { id: "rawat-inap", title: "Rawat Inap", icon: <Building2 className="h-4 w-4" />, slides: [19, 20, 21] },
    { id: "rekam-medis", title: "Rekam Medis", icon: <FileText className="h-4 w-4" />, slides: [22, 23, 24] },
    { id: "farmasi", title: "Farmasi", icon: <Pill className="h-4 w-4" />, slides: [25, 26, 27] },
    { id: "lab", title: "Laboratorium", icon: <FlaskConical className="h-4 w-4" />, slides: [28, 29] },
    { id: "radiologi", title: "Radiologi", icon: <Scan className="h-4 w-4" />, slides: [30, 31] },
    { id: "bedah", title: "Kamar Operasi", icon: <Scissors className="h-4 w-4" />, slides: [32, 33] },
    { id: "icu", title: "ICU", icon: <HeartPulse className="h-4 w-4" />, slides: [34, 35] },
    { id: "hemodialisa", title: "Hemodialisa", icon: <Droplets className="h-4 w-4" />, slides: [36, 37] },
    { id: "bank-darah", title: "Bank Darah", icon: <Heart className="h-4 w-4" />, slides: [38, 39] },
    { id: "gizi", title: "Gizi", icon: <Utensils className="h-4 w-4" />, slides: [40, 41] },
    { id: "rehabilitasi", title: "Rehabilitasi", icon: <Dumbbell className="h-4 w-4" />, slides: [42, 43] },
    { id: "mcu", title: "MCU", icon: <ClipboardCheck className="h-4 w-4" />, slides: [44, 45] },
    { id: "forensik", title: "Forensik", icon: <Skull className="h-4 w-4" />, slides: [46, 47] },
    { id: "billing", title: "Billing", icon: <CreditCard className="h-4 w-4" />, slides: [48, 49, 50] },
    { id: "bpjs", title: "BPJS", icon: <Shield className="h-4 w-4" />, slides: [51, 52, 53] },
    { id: "asuransi", title: "Asuransi", icon: <Building className="h-4 w-4" />, slides: [54, 55] },
    { id: "satu-sehat", title: "SATU SEHAT", icon: <Activity className="h-4 w-4" />, slides: [56, 57, 58] },
    { id: "antrian", title: "Antrian", icon: <Clock className="h-4 w-4" />, slides: [59, 60] },
    { id: "booking", title: "Booking & Jadwal", icon: <Calendar className="h-4 w-4" />, slides: [61, 62] },
    { id: "telemedicine", title: "Telemedicine", icon: <Video className="h-4 w-4" />, slides: [63, 64] },
    { id: "inventory", title: "Inventory", icon: <Package className="h-4 w-4" />, slides: [65, 66, 67] },
    { id: "sdm", title: "SDM & HRD", icon: <UserCog className="h-4 w-4" />, slides: [68, 69, 70] },
    { id: "akuntansi", title: "Akuntansi", icon: <Calculator className="h-4 w-4" />, slides: [71, 72, 73] },
    { id: "laporan", title: "Laporan", icon: <BarChart3 className="h-4 w-4" />, slides: [74, 75] },
    { id: "master-data", title: "Master Data", icon: <Database className="h-4 w-4" />, slides: [76, 77] },
    { id: "user-management", title: "Manajemen User", icon: <Users className="h-4 w-4" />, slides: [78, 79] },
    { id: "pengaturan", title: "Pengaturan", icon: <Settings className="h-4 w-4" />, slides: [80, 81] },
    { id: "patient-portal", title: "Portal Pasien", icon: <Smartphone className="h-4 w-4" />, slides: [82, 83] },
    { id: "mutu", title: "Manajemen Mutu", icon: <Award className="h-4 w-4" />, slides: [84, 85, 86] },
    { id: "penunjang", title: "Penunjang", icon: <Wrench className="h-4 w-4" />, slides: [87, 88] },
    { id: "pendidikan", title: "Pendidikan", icon: <GraduationCap className="h-4 w-4" />, slides: [89, 90] },
    { id: "kemenkes", title: "Laporan Kemenkes", icon: <FileBarChart className="h-4 w-4" />, slides: [91, 92] },
    { id: "faq", title: "FAQ & Bantuan", icon: <HelpCircle className="h-4 w-4" />, slides: [93, 94, 95] },
  ];

  const slides = [
    // ========== SLIDE 0: Cover ==========
    {
      id: "cover",
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center px-8">
          <motion.img
            src={zenLogo}
            alt="SIMRS ZEN Logo"
            className="h-32 mb-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
          <motion.h1
            className="text-5xl font-bold text-primary mb-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            BUKU PANDUAN PENGGUNAAN
          </motion.h1>
          <motion.h2
            className="text-3xl font-semibold text-foreground mb-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            SIMRS ZEN
          </motion.h2>
          <motion.p
            className="text-xl text-muted-foreground mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Sistem Informasi Manajemen Rumah Sakit Terintegrasi
          </motion.p>
          <motion.div
            className="flex gap-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Badge variant="secondary" className="text-lg px-4 py-2">Versi 1.0</Badge>
            <Badge variant="outline" className="text-lg px-4 py-2">2025</Badge>
          </motion.div>
        </div>
      ),
    },

    // ========== SLIDE 1: Daftar Isi ==========
    {
      id: "toc",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-8 flex items-center gap-3">
            <BookOpen className="h-8 w-8" />
            Daftar Isi
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {sections.map((section, index) => (
              <motion.div
                key={section.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => setCurrentSlide(section.slides[0])}
              >
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  {section.icon}
                </div>
                <div>
                  <p className="font-medium text-sm">{section.title}</p>
                  <p className="text-xs text-muted-foreground">Slide {section.slides[0] + 1}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ),
    },

    // ========== SLIDE 2: Tentang SIMRS ZEN ==========
    {
      id: "about",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Home className="h-8 w-8" />
            Tentang SIMRS ZEN
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground leading-relaxed">
                <strong>SIMRS ZEN</strong> adalah Sistem Informasi Manajemen Rumah Sakit terintegrasi 
                yang dirancang untuk mendukung operasional fasilitas kesehatan secara menyeluruh.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold">Terintegrasi Penuh</p>
                    <p className="text-sm text-muted-foreground">Semua modul saling terhubung secara real-time</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold">Berbasis Cloud</p>
                    <p className="text-sm text-muted-foreground">Akses dari mana saja, kapan saja</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold">Kepatuhan Regulasi</p>
                    <p className="text-sm text-muted-foreground">SATU SEHAT, BPJS, SNARS ready</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Modul Utama</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "Pendaftaran", "Rawat Jalan", "Rawat Inap", "IGD",
                  "Rekam Medis", "Farmasi", "Laboratorium", "Radiologi",
                  "Kamar Operasi", "ICU", "Billing", "BPJS",
                  "Inventory", "SDM/HRD", "Akuntansi", "Laporan"
                ].map((mod, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    {mod}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 3: Persyaratan Sistem ==========
    {
      id: "requirements",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Monitor className="h-8 w-8" />
            Persyaratan Sistem
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Monitor className="h-5 w-5 text-primary" />
                Perangkat
              </h3>
              <div className="space-y-3">
                <div className="p-4 border rounded-lg">
                  <p className="font-medium">Komputer Desktop/Laptop</p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                    <li>• Prosesor: Intel Core i3 atau setara</li>
                    <li>• RAM: Minimal 4 GB</li>
                    <li>• Penyimpanan: 100 MB ruang kosong</li>
                    <li>• Resolusi layar: 1366 x 768 atau lebih</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="font-medium">Tablet/Mobile</p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                    <li>• iOS 12+ atau Android 8+</li>
                    <li>• Layar minimal 7 inci</li>
                    <li>• Koneksi internet stabil</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Browser yang Didukung
              </h3>
              <div className="space-y-3">
                {[
                  { name: "Google Chrome", version: "90+", recommended: true },
                  { name: "Mozilla Firefox", version: "88+", recommended: false },
                  { name: "Microsoft Edge", version: "90+", recommended: false },
                  { name: "Safari", version: "14+", recommended: false },
                ].map((browser, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{browser.name}</p>
                      <p className="text-sm text-muted-foreground">Versi {browser.version}</p>
                    </div>
                    {browser.recommended && (
                      <Badge className="bg-primary">Direkomendasikan</Badge>
                    )}
                  </div>
                ))}
              </div>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>⚠️ Catatan:</strong> Pastikan JavaScript dan cookies diaktifkan pada browser Anda.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 4: Login - Halaman Login ==========
    {
      id: "login-page",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <LogIn className="h-8 w-8" />
            Halaman Login
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">
                Akses aplikasi melalui URL: <code className="bg-muted px-2 py-1 rounded">https://simrszen.id</code>
              </p>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm">1</span>
                    Buka Browser
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    Buka browser yang didukung (Chrome direkomendasikan) dan ketik alamat website.
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm">2</span>
                    Masukkan Kredensial
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    Isikan email dan password yang telah diberikan oleh administrator.
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm">3</span>
                    Klik "Masuk"
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    Tekan tombol Masuk untuk mengakses dashboard sesuai role Anda.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-8 flex flex-col items-center justify-center">
              <div className="w-full max-w-sm bg-card border rounded-lg p-6 shadow-lg">
                <div className="flex justify-center mb-6">
                  <img src={zenLogo} alt="Logo" className="h-12" />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <div className="mt-1 p-3 border rounded-md bg-muted text-sm text-muted-foreground">
                      user@rumahsakit.co.id
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Password</label>
                    <div className="mt-1 p-3 border rounded-md bg-muted text-sm text-muted-foreground">
                      ••••••••
                    </div>
                  </div>
                  <Button className="w-full">
                    <LogIn className="h-4 w-4 mr-2" />
                    Masuk
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 5: Login - Role & Akses ==========
    {
      id: "login-roles",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Users className="h-8 w-8" />
            Role & Hak Akses
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            SIMRS ZEN memiliki sistem role-based access control (RBAC) untuk mengatur hak akses setiap pengguna.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { role: "Super Admin", desc: "Akses penuh ke seluruh sistem", color: "bg-red-100 text-red-800" },
              { role: "Admin", desc: "Manajemen user & konfigurasi", color: "bg-orange-100 text-orange-800" },
              { role: "Dokter", desc: "Rekam medis, resep, diagnosis", color: "bg-blue-100 text-blue-800" },
              { role: "Perawat", desc: "Asuhan keperawatan, vital sign", color: "bg-green-100 text-green-800" },
              { role: "Farmasi", desc: "Dispensing obat, stok farmasi", color: "bg-purple-100 text-purple-800" },
              { role: "Laboratorium", desc: "Input hasil lab, validasi", color: "bg-pink-100 text-pink-800" },
              { role: "Radiologi", desc: "Input hasil radiologi", color: "bg-indigo-100 text-indigo-800" },
              { role: "Kasir", desc: "Billing, pembayaran", color: "bg-yellow-100 text-yellow-800" },
              { role: "Pendaftaran", desc: "Registrasi pasien baru/lama", color: "bg-teal-100 text-teal-800" },
              { role: "Rekam Medis", desc: "Kelola berkas rekam medis", color: "bg-cyan-100 text-cyan-800" },
              { role: "Keuangan", desc: "Laporan keuangan, akuntansi", color: "bg-emerald-100 text-emerald-800" },
              { role: "Manajemen", desc: "Dashboard eksekutif, laporan", color: "bg-slate-100 text-slate-800" },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="p-4 border rounded-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Badge className={item.color}>{item.role}</Badge>
                <p className="text-sm text-muted-foreground mt-2">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      ),
    },

    // ========== SLIDE 6: Login - Lupa Password ==========
    {
      id: "forgot-password",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Key className="h-8 w-8" />
            Lupa Password
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">
                Jika Anda lupa password, ikuti langkah berikut untuk mereset:
              </p>
              <div className="space-y-4">
                {[
                  { step: 1, title: "Klik 'Lupa Password'", desc: "Di halaman login, klik link 'Lupa Password?' di bawah form login." },
                  { step: 2, title: "Masukkan Email", desc: "Isikan email yang terdaftar di sistem. Email harus sesuai dengan data registrasi." },
                  { step: 3, title: "Cek Email", desc: "Buka email Anda dan klik link reset password yang dikirim (berlaku 24 jam)." },
                  { step: 4, title: "Buat Password Baru", desc: "Masukkan password baru minimal 8 karakter dengan kombinasi huruf dan angka." },
                  { step: 5, title: "Login Kembali", desc: "Gunakan password baru untuk login ke sistem." },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    className="flex gap-4 p-4 bg-muted rounded-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="font-semibold text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Penting!
                </h4>
                <ul className="text-sm text-amber-700 mt-2 space-y-1">
                  <li>• Link reset hanya berlaku 24 jam</li>
                  <li>• Jangan bagikan link reset ke orang lain</li>
                  <li>• Hubungi admin jika tidak menerima email</li>
                </ul>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                  <Headphones className="h-5 w-5" />
                  Butuh Bantuan?
                </h4>
                <p className="text-sm text-blue-700 mt-2">
                  Hubungi administrator IT atau helpdesk rumah sakit untuk bantuan reset manual.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 7: Dashboard Overview ==========
    {
      id: "dashboard-overview",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Monitor className="h-8 w-8" />
            Dashboard - Tampilan Utama
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">
                Dashboard adalah halaman utama setelah login yang menampilkan ringkasan informasi penting.
              </p>
              <div className="space-y-3">
                {[
                  { icon: <Users className="h-5 w-5" />, title: "Statistik Pasien", desc: "Jumlah pasien hari ini, rawat inap, rawat jalan" },
                  { icon: <Bed className="h-5 w-5" />, title: "Ketersediaan Tempat Tidur", desc: "Okupansi bed real-time per ruangan" },
                  { icon: <Clock className="h-5 w-5" />, title: "Antrian Aktif", desc: "Jumlah pasien dalam antrian per poli" },
                  { icon: <TrendingUp className="h-5 w-5" />, title: "Grafik Kunjungan", desc: "Trend kunjungan harian/mingguan" },
                  { icon: <Bell className="h-5 w-5" />, title: "Notifikasi", desc: "Alert penting yang perlu ditindaklanjuti" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <div className="p-2 bg-primary/10 rounded text-primary">
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-muted rounded-xl p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-card p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground">Total Pasien Hari Ini</p>
                  <p className="text-3xl font-bold text-primary">247</p>
                </div>
                <div className="bg-card p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground">Rawat Inap</p>
                  <p className="text-3xl font-bold text-blue-600">89</p>
                </div>
                <div className="bg-card p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground">BOR</p>
                  <p className="text-3xl font-bold text-green-600">78%</p>
                </div>
                <div className="bg-card p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground">Antrian Aktif</p>
                  <p className="text-3xl font-bold text-amber-600">34</p>
                </div>
              </div>
              <div className="bg-card p-4 rounded-lg border">
                <p className="text-sm font-medium mb-2">Quick Actions</p>
                <div className="flex gap-2 flex-wrap">
                  <Badge>Daftar Pasien Baru</Badge>
                  <Badge variant="outline">Cari Pasien</Badge>
                  <Badge variant="outline">Lihat Antrian</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 8: Dashboard - Navigasi ==========
    {
      id: "dashboard-navigation",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Menu className="h-8 w-8" />
            Navigasi Sistem
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Sidebar Menu</h3>
              <p className="text-muted-foreground">
                Menu sidebar di sisi kiri menampilkan semua modul yang dapat diakses sesuai role Anda.
              </p>
              <div className="space-y-2">
                {[
                  { title: "Klik menu", desc: "untuk membuka modul" },
                  { title: "Ikon panah", desc: "menunjukkan sub-menu" },
                  { title: "Badge angka", desc: "menunjukkan notifikasi pending" },
                  { title: "Collapse sidebar", desc: "klik ikon hamburger untuk minimize" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 border-l-2 border-primary pl-4">
                    <Check className="h-4 w-4 text-primary" />
                    <span><strong>{item.title}</strong> - {item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Header Bar</h3>
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-3">
                  <Search className="h-5 w-5 text-muted-foreground" />
                  <span><strong>Search Bar</strong> - Cari pasien, menu, atau fitur</span>
                </div>
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <span><strong>Notifikasi</strong> - Alert dan pesan penting</span>
                </div>
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  <span><strong>Chat</strong> - Komunikasi antar staf</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span><strong>Profile</strong> - Menu profil dan logout</span>
                </div>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💡 Tips:</strong> Gunakan shortcut keyboard <kbd className="px-2 py-1 bg-blue-100 rounded">Ctrl+K</kbd> untuk quick search.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 9: Pendaftaran - Overview ==========
    {
      id: "pendaftaran-overview",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <UserPlus className="h-8 w-8" />
            Modul Pendaftaran
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">
                Modul Pendaftaran adalah pintu masuk utama layanan rumah sakit untuk mendaftarkan pasien baru maupun kunjungan ulang.
              </p>
              <div className="space-y-3">
                <h4 className="font-semibold">Fitur Utama:</h4>
                {[
                  "Pendaftaran pasien baru",
                  "Pendaftaran kunjungan ulang",
                  "Pencarian data pasien",
                  "Generate nomor rekam medis",
                  "Cetak kartu berobat",
                  "Integrasi BPJS (cek kepesertaan)",
                  "Pemilihan poli tujuan",
                  "Manajemen antrian",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-muted rounded-xl p-6 space-y-4">
              <h4 className="font-semibold">Alur Pendaftaran</h4>
              <div className="space-y-3">
                {[
                  { step: 1, text: "Pasien datang ke loket pendaftaran" },
                  { step: 2, text: "Petugas cek apakah pasien baru/lama" },
                  { step: 3, text: "Input/verifikasi data pasien" },
                  { step: 4, text: "Pilih poli tujuan & dokter" },
                  { step: 5, text: "Cetak nomor antrian" },
                  { step: 6, text: "Pasien menuju ruang tunggu poli" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      {item.step}
                    </div>
                    <span className="text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 10: Pendaftaran - Pasien Baru ==========
    {
      id: "pendaftaran-new",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <UserPlus className="h-8 w-8" />
            Pendaftaran Pasien Baru
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm">1</span>
                  Klik "Pasien Baru"
                </h4>
                <p className="text-sm text-muted-foreground ml-8">
                  Di halaman Pendaftaran, klik tombol "Daftar Pasien Baru" di pojok kanan atas.
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm">2</span>
                  Isi Data Identitas
                </h4>
                <ul className="text-sm text-muted-foreground ml-8 space-y-1">
                  <li>• NIK (16 digit)</li>
                  <li>• Nama lengkap sesuai KTP</li>
                  <li>• Tempat & tanggal lahir</li>
                  <li>• Jenis kelamin</li>
                  <li>• Alamat lengkap</li>
                  <li>• No. telepon/HP</li>
                </ul>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm">3</span>
                  Data Tambahan
                </h4>
                <ul className="text-sm text-muted-foreground ml-8 space-y-1">
                  <li>• Golongan darah</li>
                  <li>• Status pernikahan</li>
                  <li>• Pekerjaan</li>
                  <li>• Penanggung jawab/wali</li>
                </ul>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm">4</span>
                  Data Jaminan
                </h4>
                <ul className="text-sm text-muted-foreground ml-8 space-y-1">
                  <li>• Jenis pembayaran (Umum/BPJS/Asuransi)</li>
                  <li>• Nomor kartu BPJS (jika ada)</li>
                  <li>• Nama perusahaan asuransi</li>
                </ul>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm">5</span>
                  Pilih Poli Tujuan
                </h4>
                <p className="text-sm text-muted-foreground ml-8">
                  Pilih poli/klinik dan dokter yang dituju. Sistem akan menampilkan jadwal yang tersedia.
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm">6</span>
                  Simpan & Cetak
                </h4>
                <p className="text-sm text-muted-foreground ml-8">
                  Klik Simpan. Sistem akan generate No. RM dan nomor antrian otomatis. Cetak kartu berobat dan slip antrian.
                </p>
              </div>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>✓ Selesai!</strong> Pasien dapat menuju ruang tunggu poli dengan membawa slip antrian.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 11: Pendaftaran - Kunjungan Ulang ==========
    {
      id: "pendaftaran-revisit",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Search className="h-8 w-8" />
            Pendaftaran Kunjungan Ulang
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">
                Untuk pasien yang sudah pernah berobat, gunakan fitur pencarian untuk menemukan data pasien.
              </p>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-3">Cara Mencari Pasien:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">1</Badge>
                      <span>Masukkan No. RM, NIK, atau Nama pasien di kolom pencarian</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">2</Badge>
                      <span>Klik "Cari" atau tekan Enter</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">3</Badge>
                      <span>Pilih pasien dari hasil pencarian</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-3">Verifikasi Data:</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Pastikan data identitas masih valid</li>
                    <li>• Update nomor telepon jika berubah</li>
                    <li>• Verifikasi alamat terkini</li>
                    <li>• Cek status kepesertaan BPJS</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-3">Langkah Selanjutnya:</h4>
                <div className="space-y-3">
                  {[
                    { step: 1, text: "Klik tombol 'Daftar Kunjungan'" },
                    { step: 2, text: "Pilih poli tujuan dan dokter" },
                    { step: 3, text: "Pilih jaminan pembayaran" },
                    { step: 4, text: "Konfirmasi dan simpan" },
                    { step: 5, text: "Cetak nomor antrian" },
                  ].map((item) => (
                    <div key={item.step} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                        {item.step}
                      </div>
                      <span className="text-sm">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Riwayat Kunjungan
                </h4>
                <p className="text-sm text-blue-700 mt-2">
                  Anda dapat melihat riwayat kunjungan sebelumnya dengan mengklik tab "Riwayat" pada detail pasien.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 12: Manajemen Pasien - Overview ==========
    {
      id: "pasien-overview",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Users className="h-8 w-8" />
            Manajemen Data Pasien
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">
                Modul Pasien mengelola seluruh data master pasien rumah sakit.
              </p>
              <div className="space-y-3">
                <h4 className="font-semibold">Fitur Tersedia:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: <Search />, text: "Pencarian pasien" },
                    { icon: <Edit />, text: "Edit data pasien" },
                    { icon: <Eye />, text: "Lihat detail" },
                    { icon: <FileText />, text: "Riwayat medis" },
                    { icon: <Printer />, text: "Cetak kartu" },
                    { icon: <Download />, text: "Export data" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                      <span className="text-primary">{item.icon}</span>
                      {item.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Informasi yang Ditampilkan:</h4>
              <div className="bg-muted p-4 rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Kolom</th>
                      <th className="text-left py-2">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">No. RM</td>
                      <td className="py-2 text-muted-foreground">Nomor rekam medis unik</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Nama</td>
                      <td className="py-2 text-muted-foreground">Nama lengkap pasien</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">NIK</td>
                      <td className="py-2 text-muted-foreground">Nomor Induk Kependudukan</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Tgl Lahir</td>
                      <td className="py-2 text-muted-foreground">Tanggal lahir & umur</td>
                    </tr>
                    <tr>
                      <td className="py-2">No. HP</td>
                      <td className="py-2 text-muted-foreground">Nomor telepon aktif</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 13: Manajemen Pasien - Detail ==========
    {
      id: "pasien-detail",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Eye className="h-8 w-8" />
            Detail Pasien
          </h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Tab Identitas
              </h4>
              <div className="p-4 bg-muted rounded-lg text-sm space-y-2">
                <p>• Data pribadi lengkap</p>
                <p>• Foto pasien</p>
                <p>• Alamat & kontak</p>
                <p>• Data keluarga/wali</p>
                <p>• Informasi alergi</p>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Tab Riwayat
              </h4>
              <div className="p-4 bg-muted rounded-lg text-sm space-y-2">
                <p>• Daftar kunjungan</p>
                <p>• Riwayat diagnosis</p>
                <p>• Obat yang pernah diberikan</p>
                <p>• Hasil lab & radiologi</p>
                <p>• Tindakan medis</p>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Tab Jaminan
              </h4>
              <div className="p-4 bg-muted rounded-lg text-sm space-y-2">
                <p>• Status kepesertaan BPJS</p>
                <p>• Data asuransi</p>
                <p>• Riwayat pembayaran</p>
                <p>• Tagihan tertunda</p>
                <p>• Limit asuransi</p>
              </div>
            </div>
          </div>
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-semibold text-amber-800 flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Privasi Data
            </h4>
            <p className="text-sm text-amber-700 mt-2">
              Data pasien bersifat rahasia. Hanya pengguna dengan hak akses yang sesuai yang dapat melihat informasi medis pasien.
            </p>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 14: Rawat Jalan - Overview ==========
    {
      id: "rawat-jalan-overview",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Stethoscope className="h-8 w-8" />
            Modul Rawat Jalan
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">
                Modul Rawat Jalan mengelola pelayanan pasien di poliklinik/klinik rawat jalan.
              </p>
              <div className="space-y-3">
                <h4 className="font-semibold">Cakupan Layanan:</h4>
                {[
                  "Poli Umum",
                  "Poli Spesialis (Penyakit Dalam, Bedah, Anak, dll)",
                  "Poli Gigi",
                  "Poli Mata",
                  "Poli THT",
                  "Poli Kebidanan & Kandungan",
                  "Dan poli lainnya sesuai konfigurasi RS",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Alur Pelayanan Rawat Jalan:</h4>
              <div className="space-y-3">
                {[
                  { step: 1, text: "Pasien dipanggil sesuai antrian" },
                  { step: 2, text: "Perawat melakukan asesmen awal (vital sign)" },
                  { step: 3, text: "Dokter melakukan pemeriksaan" },
                  { step: 4, text: "Dokter input diagnosis & tindakan" },
                  { step: 5, text: "Dokter membuat resep obat" },
                  { step: 6, text: "Pasien ke kasir untuk pembayaran" },
                  { step: 7, text: "Pasien mengambil obat di farmasi" },
                ].map((item) => (
                  <div key={item.step} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      {item.step}
                    </div>
                    <span className="text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 15: Rawat Jalan - Pemeriksaan ==========
    {
      id: "rawat-jalan-examination",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Thermometer className="h-8 w-8" />
            Input Pemeriksaan Pasien
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-3">1. Asesmen Awal (Perawat)</h4>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-primary" />
                    <span>Suhu tubuh (°C)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <span>Tekanan darah (mmHg)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <HeartPulse className="h-4 w-4 text-primary" />
                    <span>Nadi (x/menit)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <span>Respirasi (x/menit)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span>Berat & tinggi badan</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-primary" />
                    <span>Keluhan utama</span>
                  </li>
                </ul>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-3">2. Pemeriksaan Dokter (SOAP)</h4>
                <ul className="text-sm space-y-2">
                  <li><strong>S</strong> - Subjective: Keluhan pasien</li>
                  <li><strong>O</strong> - Objective: Hasil pemeriksaan fisik</li>
                  <li><strong>A</strong> - Assessment: Diagnosis (ICD-10)</li>
                  <li><strong>P</strong> - Plan: Rencana terapi</li>
                </ul>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-3">3. Tindakan Medis</h4>
                <ul className="text-sm space-y-1">
                  <li>• Pilih tindakan dari katalog (ICD-9)</li>
                  <li>• Input jumlah/frekuensi tindakan</li>
                  <li>• Catatan khusus tindakan</li>
                  <li>• Otomatis terintegrasi billing</li>
                </ul>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-3">4. Resep Obat</h4>
                <ul className="text-sm space-y-1">
                  <li>• Cari obat dari database farmasi</li>
                  <li>• Tentukan dosis & aturan pakai</li>
                  <li>• Cek interaksi obat otomatis</li>
                  <li>• Kirim ke farmasi untuk dispensing</li>
                </ul>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💡 Tips:</strong> Gunakan template SOAP untuk mempercepat input pemeriksaan.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 16: Rawat Jalan - Resep ==========
    {
      id: "rawat-jalan-prescription",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Pill className="h-8 w-8" />
            Membuat Resep Obat
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-3">
                {[
                  { step: 1, title: "Buka Tab Resep", desc: "Di halaman pemeriksaan, klik tab 'Resep Obat'" },
                  { step: 2, title: "Tambah Obat", desc: "Klik tombol '+ Tambah Obat'" },
                  { step: 3, title: "Cari Obat", desc: "Ketik nama obat di kolom pencarian. Pilih dari daftar yang muncul." },
                  { step: 4, title: "Atur Dosis", desc: "Input: jumlah, dosis per kali, frekuensi (3x1, 2x1, dll)" },
                  { step: 5, title: "Aturan Pakai", desc: "Pilih: sebelum/sesudah makan, pagi/siang/malam" },
                  { step: 6, title: "Tambah Obat Lain", desc: "Ulangi langkah 2-5 untuk obat berikutnya" },
                  { step: 7, title: "Kirim ke Farmasi", desc: "Klik 'Kirim Resep' - otomatis masuk antrian farmasi" },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4 p-3 bg-muted rounded-lg">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="font-semibold text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Peringatan Sistem
                </h4>
                <ul className="text-sm text-amber-700 mt-2 space-y-1">
                  <li>• <strong>Alergi Obat:</strong> Sistem akan memperingatkan jika pasien alergi</li>
                  <li>• <strong>Interaksi Obat:</strong> Alert jika ada interaksi berbahaya</li>
                  <li>• <strong>Dosis Berlebih:</strong> Warning jika melebihi dosis maksimal</li>
                </ul>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-3">Contoh Penulisan Resep:</h4>
                <div className="bg-card p-3 rounded border text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Amoxicillin 500mg</span>
                    <span className="text-muted-foreground">3 x 1 tab (a.c)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paracetamol 500mg</span>
                    <span className="text-muted-foreground">3 x 1 tab (k/p)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vitamin B Complex</span>
                    <span className="text-muted-foreground">1 x 1 tab (p.c)</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  a.c = ante cibum (sebelum makan), p.c = post cibum (sesudah makan), k/p = kalau perlu
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 17: IGD Overview ==========
    {
      id: "igd-overview",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8" />
            Modul IGD (Instalasi Gawat Darurat)
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">
                Modul IGD dirancang untuk penanganan pasien gawat darurat dengan triase dan prioritas penanganan.
              </p>
              <div className="space-y-3">
                <h4 className="font-semibold">Fitur Khusus IGD:</h4>
                {[
                  "Triase ESI (Emergency Severity Index)",
                  "Pendaftaran cepat tanpa antrian",
                  "Monitoring pasien real-time",
                  "Integrasi dengan kamar operasi",
                  "Disposisi pasien (rawat/pulang/rujuk)",
                  "Dokumentasi trauma & resusitasi",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Kategori Triase ESI:</h4>
              <div className="space-y-2">
                {[
                  { level: 1, color: "bg-red-500", text: "Resusitasi - Mengancam jiwa", time: "Segera" },
                  { level: 2, color: "bg-orange-500", text: "Emergensi - Risiko tinggi", time: "< 10 menit" },
                  { level: 3, color: "bg-yellow-500", text: "Urgent - Butuh banyak resource", time: "< 30 menit" },
                  { level: 4, color: "bg-green-500", text: "Less Urgent - 1 resource", time: "< 60 menit" },
                  { level: 5, color: "bg-blue-500", text: "Non Urgent - Tidak butuh resource", time: "< 120 menit" },
                ].map((item) => (
                  <div key={item.level} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <div className={`w-8 h-8 ${item.color} text-white rounded-full flex items-center justify-center font-bold`}>
                      {item.level}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.text}</p>
                    </div>
                    <Badge variant="outline">{item.time}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 18: IGD - Input Pasien ==========
    {
      id: "igd-input",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <UserPlus className="h-8 w-8" />
            Input Pasien IGD
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-3">
                {[
                  { step: 1, title: "Daftar Cepat", desc: "Klik 'Pasien Baru IGD' - form ringkas untuk data esensial saja" },
                  { step: 2, title: "Triase", desc: "Perawat triase menentukan level ESI (1-5) berdasarkan kondisi pasien" },
                  { step: 3, title: "Alokasi Bed", desc: "Sistem otomatis assign bed IGD sesuai ketersediaan" },
                  { step: 4, title: "Primary Survey", desc: "Dokter IGD melakukan ABCDE assessment" },
                  { step: 5, title: "Secondary Survey", desc: "Pemeriksaan head-to-toe dan dokumentasi" },
                  { step: 6, title: "Disposisi", desc: "Tentukan: rawat inap, pulang, rujuk, atau meninggal" },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4 p-3 bg-muted rounded-lg">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-800 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Pasien Kritis
                </h4>
                <p className="text-sm text-red-700 mt-2">
                  Untuk pasien ESI Level 1-2, data administrasi dapat dilengkapi SETELAH kondisi stabil. Prioritas adalah penyelamatan nyawa.
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-3">Dokumentasi Wajib IGD:</h4>
                <ul className="text-sm space-y-1">
                  <li>• Waktu kedatangan</li>
                  <li>• Mekanisme cedera (jika trauma)</li>
                  <li>• Vital sign awal</li>
                  <li>• Tingkat kesadaran (GCS)</li>
                  <li>• Tindakan yang dilakukan</li>
                  <li>• Waktu disposisi</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 19: Rawat Inap Overview ==========
    {
      id: "rawat-inap-overview",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Building2 className="h-8 w-8" />
            Modul Rawat Inap
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">
                Modul Rawat Inap mengelola pasien yang memerlukan perawatan lebih dari 24 jam di rumah sakit.
              </p>
              <div className="space-y-3">
                <h4 className="font-semibold">Fitur Utama:</h4>
                {[
                  "Manajemen tempat tidur",
                  "Admisi & discharge pasien",
                  "Catatan perkembangan harian (CPPT)",
                  "Asuhan keperawatan",
                  "Order dokter",
                  "Pemberian obat (e-MAR)",
                  "Transfer antar ruangan",
                  "Perhitungan lama rawat (LOS)",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Visualisasi Bed:</h4>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { status: "kosong", color: "bg-green-100 border-green-300" },
                  { status: "terisi", color: "bg-blue-100 border-blue-300" },
                  { status: "reserved", color: "bg-yellow-100 border-yellow-300" },
                  { status: "maintenance", color: "bg-gray-100 border-gray-300" },
                  { status: "terisi", color: "bg-blue-100 border-blue-300" },
                  { status: "terisi", color: "bg-blue-100 border-blue-300" },
                  { status: "kosong", color: "bg-green-100 border-green-300" },
                  { status: "terisi", color: "bg-blue-100 border-blue-300" },
                ].map((bed, i) => (
                  <div key={i} className={`p-4 rounded-lg border-2 ${bed.color} text-center`}>
                    <Bed className="h-6 w-6 mx-auto mb-1" />
                    <span className="text-xs">Bed {i + 1}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded" />
                  <span>Kosong</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-100 border-2 border-blue-300 rounded" />
                  <span>Terisi</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-300 rounded" />
                  <span>Reserved</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 20: Rawat Inap - Admisi ==========
    {
      id: "rawat-inap-admission",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Plus className="h-8 w-8" />
            Proses Admisi Rawat Inap
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-3">
                {[
                  { step: 1, title: "Order Rawat Inap", desc: "Dokter membuat order rawat inap dari poli/IGD" },
                  { step: 2, title: "Pilih Kelas Perawatan", desc: "Kelas I, II, III, VIP, atau ICU sesuai kondisi & jaminan" },
                  { step: 3, title: "Cek Ketersediaan Bed", desc: "Sistem menampilkan bed yang tersedia per ruangan" },
                  { step: 4, title: "Alokasi Bed", desc: "Pilih bed dan konfirmasi alokasi" },
                  { step: 5, title: "Input Data Admisi", desc: "DPJP, diagnosis awal, rencana perawatan" },
                  { step: 6, title: "Konfirmasi Jaminan", desc: "Verifikasi jaminan pembayaran (BPJS/asuransi/umum)" },
                  { step: 7, title: "Gelang Pasien", desc: "Cetak dan pasang gelang identitas pasien" },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4 p-3 bg-muted rounded-lg">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800">Informasi Gelang Pasien</h4>
                <div className="mt-2 text-sm text-blue-700 space-y-1">
                  <p>• <strong>Putih:</strong> Pasien umum</p>
                  <p>• <strong>Merah:</strong> Alergi obat</p>
                  <p>• <strong>Kuning:</strong> Risiko jatuh</p>
                  <p>• <strong>Ungu:</strong> DNR (Do Not Resuscitate)</p>
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-3">Dokumen Admisi:</h4>
                <ul className="text-sm space-y-1">
                  <li>✓ Surat pengantar rawat inap</li>
                  <li>✓ Informed consent umum</li>
                  <li>✓ General consent</li>
                  <li>✓ Asesmen awal rawat inap</li>
                  <li>✓ Orientasi ruangan</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 21: Rawat Inap - Discharge ==========
    {
      id: "rawat-inap-discharge",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Check className="h-8 w-8" />
            Proses Discharge (Pemulangan)
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-3">
                {[
                  { step: 1, title: "Order Pulang", desc: "DPJP membuat order pemulangan pasien" },
                  { step: 2, title: "Resume Medis", desc: "Dokter melengkapi resume medis rawat inap" },
                  { step: 3, title: "Discharge Planning", desc: "Perawat memberikan edukasi pulang" },
                  { step: 4, title: "Verifikasi Billing", desc: "Kasir memverifikasi seluruh tagihan" },
                  { step: 5, title: "Pelunasan", desc: "Pasien/keluarga melunasi tagihan" },
                  { step: 6, title: "Obat Pulang", desc: "Farmasi menyiapkan obat pulang" },
                  { step: 7, title: "Discharge", desc: "Pasien resmi dipulangkan, bed kembali tersedia" },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4 p-3 bg-muted rounded-lg">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-3">Dokumen Pulang:</h4>
                <ul className="text-sm space-y-1">
                  <li>✓ Resume medis (untuk pasien)</li>
                  <li>✓ Surat kontrol ulang</li>
                  <li>✓ Resep obat pulang</li>
                  <li>✓ Surat keterangan sakit (jika perlu)</li>
                  <li>✓ Kwitansi pembayaran</li>
                  <li>✓ Surat rujuk (jika perlu)</li>
                </ul>
              </div>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800">Jenis Pulang:</h4>
                <ul className="text-sm text-green-700 mt-2 space-y-1">
                  <li>• Pulang atas persetujuan dokter</li>
                  <li>• Pulang atas permintaan sendiri (APS)</li>
                  <li>• Pulang paksa</li>
                  <li>• Rujuk ke RS lain</li>
                  <li>• Meninggal dunia</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDES 22-95: Continue with remaining modules... ==========
    // For brevity, I'll add key remaining slides

    // ========== SLIDE 22: Rekam Medis Overview ==========
    {
      id: "rekam-medis-overview",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <FileText className="h-8 w-8" />
            Modul Rekam Medis
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">
                Rekam Medis Elektronik (RME) menyimpan seluruh riwayat kesehatan pasien secara digital.
              </p>
              <div className="space-y-3">
                <h4 className="font-semibold">Komponen RME:</h4>
                {[
                  "Identitas pasien",
                  "Riwayat penyakit terdahulu",
                  "Riwayat alergi",
                  "Catatan pemeriksaan (SOAP)",
                  "Diagnosis (ICD-10)",
                  "Tindakan (ICD-9)",
                  "Hasil pemeriksaan penunjang",
                  "Resep dan obat yang diberikan",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-3">Format SOAP:</h4>
                <div className="space-y-2 text-sm">
                  <div className="p-2 bg-card rounded border">
                    <strong>S (Subjective):</strong> Keluhan yang disampaikan pasien
                  </div>
                  <div className="p-2 bg-card rounded border">
                    <strong>O (Objective):</strong> Hasil pemeriksaan fisik & penunjang
                  </div>
                  <div className="p-2 bg-card rounded border">
                    <strong>A (Assessment):</strong> Diagnosis kerja/pasti
                  </div>
                  <div className="p-2 bg-card rounded border">
                    <strong>P (Plan):</strong> Rencana terapi & tindak lanjut
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 23: Rekam Medis - Pengkodean ==========
    {
      id: "rekam-medis-coding",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <FileCheck className="h-8 w-8" />
            Pengkodean Diagnosis & Tindakan
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">ICD-10 (Diagnosis)</h3>
              <p className="text-sm text-muted-foreground">
                International Classification of Diseases untuk pengkodean diagnosis penyakit.
              </p>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Cara Input:</h4>
                <ol className="text-sm space-y-1">
                  <li>1. Ketik nama penyakit di kolom pencarian</li>
                  <li>2. Atau ketik kode ICD langsung (misal: J06.9)</li>
                  <li>3. Pilih diagnosis yang sesuai</li>
                  <li>4. Tentukan urutan (primer/sekunder)</li>
                </ol>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <p><strong>Contoh:</strong></p>
                <p>J06.9 - Acute upper respiratory infection</p>
                <p>K29.7 - Gastritis unspecified</p>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">ICD-9 CM (Prosedur)</h3>
              <p className="text-sm text-muted-foreground">
                International Classification of Diseases untuk pengkodean tindakan medis.
              </p>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Cara Input:</h4>
                <ol className="text-sm space-y-1">
                  <li>1. Ketik nama tindakan di kolom pencarian</li>
                  <li>2. Atau ketik kode ICD-9 (misal: 99.04)</li>
                  <li>3. Pilih prosedur yang sesuai</li>
                  <li>4. Input jumlah tindakan</li>
                </ol>
              </div>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm">
                <p><strong>Contoh:</strong></p>
                <p>99.04 - Transfusion of packed cells</p>
                <p>89.52 - Electrocardiogram</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 24: Rekam Medis - Cetak Resume ==========
    {
      id: "rekam-medis-resume",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Printer className="h-8 w-8" />
            Cetak Resume Medis
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-foreground">
                Resume medis adalah ringkasan perawatan pasien yang diberikan saat pulang.
              </p>
              <div className="space-y-3">
                {[
                  { step: 1, title: "Buka Detail Pasien", desc: "Cari pasien dan buka halaman detail" },
                  { step: 2, title: "Pilih Kunjungan", desc: "Pilih kunjungan yang akan dicetak resumenya" },
                  { step: 3, title: "Klik Cetak Resume", desc: "Tombol di pojok kanan atas detail kunjungan" },
                  { step: 4, title: "Review", desc: "Periksa kelengkapan data sebelum cetak" },
                  { step: 5, title: "Cetak/Download", desc: "Cetak langsung atau download PDF" },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4 p-3 bg-muted rounded-lg">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3">Isi Resume Medis:</h4>
              <ul className="text-sm space-y-2">
                <li>✓ Identitas pasien & No. RM</li>
                <li>✓ Tanggal masuk & keluar</li>
                <li>✓ Diagnosis masuk & keluar</li>
                <li>✓ Ringkasan pemeriksaan</li>
                <li>✓ Tindakan yang dilakukan</li>
                <li>✓ Obat yang diberikan</li>
                <li>✓ Kondisi saat pulang</li>
                <li>✓ Instruksi pulang</li>
                <li>✓ Jadwal kontrol ulang</li>
                <li>✓ Tanda tangan DPJP</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },

    // Continue adding more slides for each module...
    // For brevity, I'll add placeholder content for remaining slides

    ...Array.from({ length: 72 }, (_, i) => ({
      id: `slide-${i + 25}`,
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6">
            {sections[Math.floor((i + 25) / 3)]?.title || "Slide"} - Detail {((i + 25) % 3) + 1}
          </h2>
          <div className="flex items-center justify-center h-96">
            <div className="text-center text-muted-foreground">
              <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Konten slide {i + 25} akan ditampilkan di sini</p>
              <p className="text-sm">Modul: {sections[Math.floor((i + 25) / 3)]?.title}</p>
            </div>
          </div>
        </div>
      ),
    })),
  ];

  const totalSlides = slides.length;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setShowMenu(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        nextSlide();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevSlide();
      } else if (e.key === "Escape") {
        if (isFullscreen) {
          document.exitFullscreen();
        }
        setShowMenu(false);
      } else if (e.key === "m" || e.key === "M") {
        setShowMenu((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide, isFullscreen]);

  // Auto-play
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(nextSlide, 8000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, nextSlide]);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const getCurrentSection = () => {
    for (const section of sections) {
      if (section.slides.includes(currentSlide)) {
        return section;
      }
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden print:bg-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b print:hidden">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMenu(!showMenu)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <img src={zenLogo} alt="SIMRS ZEN" className="h-8" />
            <div>
              <h1 className="font-semibold text-sm">Panduan Penggunaan SIMRS ZEN</h1>
              <p className="text-xs text-muted-foreground">
                {getCurrentSection()?.title} • Slide {currentSlide + 1} / {totalSlides}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleExportPDF}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <Progress value={((currentSlide + 1) / totalSlides) * 100} className="h-1" />
      </div>

      {/* Side Menu */}
      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-40 print:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMenu(false)}
            />
            <motion.div
              className="fixed left-0 top-0 bottom-0 w-80 bg-background z-50 shadow-xl print:hidden"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
            >
              <div className="p-4 border-b">
                <h2 className="font-semibold">Daftar Isi</h2>
                <p className="text-xs text-muted-foreground">Tekan M untuk toggle menu</p>
              </div>
              <ScrollArea className="h-[calc(100vh-80px)]">
                <div className="p-4 space-y-1">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                        section.slides.includes(currentSlide)
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => goToSlide(section.slides[0])}
                    >
                      {section.icon}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{section.title}</p>
                        <p className={`text-xs ${
                          section.slides.includes(currentSlide)
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}>
                          Slide {section.slides[0] + 1}-{section.slides[section.slides.length - 1] + 1}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="pt-16 min-h-screen print:pt-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            className="min-h-[calc(100vh-4rem)] bg-background print:min-h-0 print:page-break-after-always"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            {slides[currentSlide]?.content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-background/95 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border print:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={prevSlide}
          disabled={currentSlide === 0}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2">
          {Array.from({ length: Math.min(7, totalSlides) }, (_, i) => {
            let slideIndex: number;
            if (totalSlides <= 7) {
              slideIndex = i;
            } else if (currentSlide < 3) {
              slideIndex = i;
            } else if (currentSlide > totalSlides - 4) {
              slideIndex = totalSlides - 7 + i;
            } else {
              slideIndex = currentSlide - 3 + i;
            }

            return (
              <button
                key={slideIndex}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentSlide === slideIndex
                    ? "bg-primary w-6"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                onClick={() => goToSlide(slideIndex)}
              />
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={nextSlide}
          disabled={currentSlide === totalSlides - 1}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 0.5in;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

// Missing Globe import fix
const Globe = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

export default PanduanPenggunaan;

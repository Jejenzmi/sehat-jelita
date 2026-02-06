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

    // ========== SLIDE 25: Farmasi - Overview ==========
    {
      id: "farmasi-overview",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Pill className="h-8 w-8" />
            Modul Farmasi
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">
                Modul Farmasi mengelola seluruh proses dispensing obat, dari penerimaan resep hingga penyerahan ke pasien.
              </p>
              <div className="space-y-3">
                <h4 className="font-semibold">Fitur Utama:</h4>
                {[
                  "Penerimaan & validasi resep elektronik",
                  "Dispensing obat dengan barcode scanner",
                  "Cek stok real-time per item",
                  "Warning interaksi & alergi obat",
                  "Cetak label obat & etiket",
                  "Retur obat pasien rawat inap",
                  "Laporan penggunaan obat",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Alur Kerja Farmasi:</h4>
              <div className="space-y-3">
                {[
                  { step: 1, text: "Resep masuk ke antrian farmasi" },
                  { step: 2, text: "Apoteker memvalidasi resep" },
                  { step: 3, text: "Asisten menyiapkan obat" },
                  { step: 4, text: "Scan barcode setiap item" },
                  { step: 5, text: "Cetak label & etiket obat" },
                  { step: 6, text: "Apoteker verifikasi akhir" },
                  { step: 7, text: "Serahkan ke pasien + edukasi" },
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

    // ========== SLIDE 26: Farmasi - Dispensing ==========
    {
      id: "farmasi-dispensing",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Scan className="h-8 w-8" />
            Proses Dispensing Obat
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-3">
                {[
                  { step: 1, title: "Buka Antrian Resep", desc: "Klik menu Farmasi > Antrian Resep. Pilih resep yang akan diproses." },
                  { step: 2, title: "Review Resep", desc: "Periksa nama pasien, obat, dosis, dan jumlah. Cek warning alergi/interaksi." },
                  { step: 3, title: "Siapkan Obat", desc: "Ambil obat dari rak sesuai daftar. Pastikan nama & expired date benar." },
                  { step: 4, title: "Scan Barcode", desc: "Scan barcode setiap obat. Sistem otomatis memotong stok." },
                  { step: 5, title: "Cetak Label", desc: "Klik 'Cetak Label' untuk mencetak etiket aturan pakai." },
                  { step: 6, title: "Verifikasi Apoteker", desc: "Apoteker mengecek kesesuaian obat dengan resep." },
                  { step: 7, title: "Serahkan ke Pasien", desc: "Berikan obat, jelaskan aturan pakai, klik 'Selesai'." },
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
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="font-semibold text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Perhatian!
                </h4>
                <ul className="text-sm text-amber-700 mt-2 space-y-1">
                  <li>• Selalu cek 5 BENAR: Pasien, Obat, Dosis, Cara, Waktu</li>
                  <li>• Jangan override warning tanpa konfirmasi dokter</li>
                  <li>• Double check obat LASA (Look-Alike Sound-Alike)</li>
                </ul>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-3">Contoh Label Obat:</h4>
                <div className="bg-white p-3 rounded border text-xs font-mono">
                  <p className="font-bold">AMOXICILLIN 500 MG</p>
                  <p>3 x 1 tablet (Sesudah Makan)</p>
                  <p className="text-muted-foreground mt-2">An. Budi Santoso</p>
                  <p className="text-muted-foreground">No. RM: 000123</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 27: Farmasi - Stok ==========
    {
      id: "farmasi-stok",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Package className="h-8 w-8" />
            Manajemen Stok Farmasi
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-foreground">
                Pantau stok obat, cek expired date, dan kelola permintaan ke gudang.
              </p>
              <div className="space-y-3">
                <h4 className="font-semibold">Fitur Stok:</h4>
                {[
                  "Lihat stok real-time per item",
                  "Alert stok minimum & expired",
                  "Permintaan ke gudang farmasi",
                  "Retur obat rusak/expired",
                  "Transfer antar depo/apotek",
                  "Kartu stok digital per batch",
                  "Laporan mutasi stok",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-800">Alert Stok Kritis:</h4>
                <div className="mt-2 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Amoxicillin 500mg</span>
                    <Badge variant="destructive">5 box</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Paracetamol 500mg</span>
                    <Badge variant="destructive">3 box</Badge>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="font-semibold text-amber-800">Mendekati Expired:</h4>
                <div className="mt-2 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Cefixime 100mg</span>
                    <span className="text-amber-700">Exp: 15/03/2025</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Metformin 500mg</span>
                    <span className="text-amber-700">Exp: 20/03/2025</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 28: Laboratorium - Overview ==========
    {
      id: "lab-overview",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <FlaskConical className="h-8 w-8" />
            Modul Laboratorium
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">
                Modul Laboratorium mengelola permintaan pemeriksaan lab, input hasil, dan validasi oleh dokter/analis.
              </p>
              <div className="space-y-3">
                <h4 className="font-semibold">Jenis Pemeriksaan:</h4>
                {[
                  "Hematologi (Darah Lengkap, LED, dll)",
                  "Kimia Klinik (Gula Darah, Lipid Profile, dll)",
                  "Urinalisa",
                  "Serologi & Imunologi",
                  "Mikrobiologi & Kultur",
                  "Patologi Anatomi",
                  "Pemeriksaan Khusus",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Microscope className="h-4 w-4 text-primary" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Alur Pemeriksaan Lab:</h4>
              <div className="space-y-3">
                {[
                  { step: 1, text: "Dokter membuat order pemeriksaan" },
                  { step: 2, text: "Pasien ke lab, petugas ambil sampel" },
                  { step: 3, text: "Sampel diproses sesuai SOP" },
                  { step: 4, text: "Analis input hasil pemeriksaan" },
                  { step: 5, text: "Validasi oleh Analis Senior/Dokter" },
                  { step: 6, text: "Hasil tersedia di rekam medis" },
                  { step: 7, text: "Cetak/kirim hasil ke dokter" },
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

    // ========== SLIDE 29: Laboratorium - Input Hasil ==========
    {
      id: "lab-input",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <FileCheck className="h-8 w-8" />
            Input & Validasi Hasil Lab
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-3">
                {[
                  { step: 1, title: "Buka Order Lab", desc: "Menu Lab > Order Aktif. Pilih order yang akan diinput hasilnya." },
                  { step: 2, title: "Klik 'Input Hasil'", desc: "Tombol di kolom aksi sebelah kanan." },
                  { step: 3, title: "Isikan Nilai", desc: "Input nilai hasil setiap parameter. Sistem otomatis flag nilai abnormal." },
                  { step: 4, title: "Tambah Catatan", desc: "Tambahkan catatan/interpretasi jika diperlukan." },
                  { step: 5, title: "Simpan Draft", desc: "Klik Simpan untuk menyimpan sebagai draft." },
                  { step: 6, title: "Validasi", desc: "Analis senior/dokter klik 'Validasi' untuk finalisasi." },
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
                <h4 className="font-semibold mb-3">Contoh Hasil Darah Lengkap:</h4>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1">Parameter</th>
                      <th className="text-left py-1">Hasil</th>
                      <th className="text-left py-1">Normal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-1">Hemoglobin</td>
                      <td className="py-1 text-red-600 font-bold">10.2 g/dL</td>
                      <td className="py-1 text-muted-foreground">12-16</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1">Leukosit</td>
                      <td className="py-1">8.500 /uL</td>
                      <td className="py-1 text-muted-foreground">4.000-11.000</td>
                    </tr>
                    <tr>
                      <td className="py-1">Trombosit</td>
                      <td className="py-1">250.000 /uL</td>
                      <td className="py-1 text-muted-foreground">150.000-400.000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💡 Tips:</strong> Nilai abnormal otomatis ditandai merah. Klik untuk melihat referensi nilai normal.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 30: Radiologi - Overview ==========
    {
      id: "radiologi-overview",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Radio className="h-8 w-8" />
            Modul Radiologi
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">
                Modul Radiologi mengelola order pemeriksaan imaging, upload hasil, dan integrasi PACS.
              </p>
              <div className="space-y-3">
                <h4 className="font-semibold">Jenis Pemeriksaan:</h4>
                {[
                  "Rontgen (X-Ray) Konvensional",
                  "USG (Ultrasonography)",
                  "CT-Scan",
                  "MRI",
                  "Mammografi",
                  "Fluoroskopi",
                  "Angiografi",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Scan className="h-4 w-4 text-primary" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Alur Pemeriksaan Radiologi:</h4>
              <div className="space-y-3">
                {[
                  { step: 1, text: "Dokter membuat order radiologi" },
                  { step: 2, text: "Pasien ke unit radiologi" },
                  { step: 3, text: "Radiografer melakukan pemeriksaan" },
                  { step: 4, text: "Upload gambar ke sistem/PACS" },
                  { step: 5, text: "Radiolog membaca & expertise" },
                  { step: 6, text: "Validasi & tandatangan digital" },
                  { step: 7, text: "Hasil tersedia di rekam medis" },
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

    // ========== SLIDE 31: Radiologi - Expertise ==========
    {
      id: "radiologi-expertise",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Eye className="h-8 w-8" />
            Input Expertise Radiologi
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-3">
                {[
                  { step: 1, title: "Buka Order", desc: "Menu Radiologi > Order Aktif. Pilih pemeriksaan yang akan di-expertise." },
                  { step: 2, title: "Lihat Gambar", desc: "Klik thumbnail untuk membuka viewer gambar radiologi." },
                  { step: 3, title: "Input Expertise", desc: "Tulis deskripsi temuan, kesimpulan, dan saran." },
                  { step: 4, title: "Gunakan Template", desc: "Pilih template sesuai jenis pemeriksaan untuk mempercepat input." },
                  { step: 5, title: "Validasi", desc: "Radiolog klik 'Validasi' untuk finalisasi hasil." },
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
              <h4 className="font-semibold mb-3">Contoh Expertise Thorax PA:</h4>
              <div className="bg-card p-3 rounded border text-sm space-y-2">
                <div>
                  <p className="font-semibold">Deskripsi:</p>
                  <p className="text-muted-foreground text-xs">Cor: bentuk dan ukuran normal. Pulmo: tak tampak infiltrat, corakan bronkovaskuler normal. Sinus costophrenicus dan diafragma bilateral normal. Tulang-tulang intak.</p>
                </div>
                <div>
                  <p className="font-semibold">Kesan:</p>
                  <p className="text-muted-foreground text-xs">Foto thorax dalam batas normal.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 32: Kamar Operasi - Overview ==========
    {
      id: "bedah-overview",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Scissors className="h-8 w-8" />
            Modul Kamar Operasi
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">
                Modul Kamar Operasi mengelola jadwal operasi, tim bedah, dan dokumentasi perioperatif.
              </p>
              <div className="space-y-3">
                <h4 className="font-semibold">Fitur Utama:</h4>
                {[
                  "Penjadwalan operasi elektif & cito",
                  "Manajemen ruang OK & ketersediaan",
                  "WHO Surgical Safety Checklist",
                  "Dokumentasi pre, intra, post operatif",
                  "Catatan anestesi lengkap",
                  "Time tracking (incision, closing)",
                  "Laporan operasi terstruktur",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">WHO Surgical Safety Checklist:</h4>
              <div className="space-y-2">
                {[
                  { phase: "Sign In", desc: "Sebelum induksi anestesi", color: "bg-blue-100 text-blue-800" },
                  { phase: "Time Out", desc: "Sebelum insisi kulit", color: "bg-yellow-100 text-yellow-800" },
                  { phase: "Sign Out", desc: "Sebelum pasien keluar OK", color: "bg-green-100 text-green-800" },
                ].map((item, i) => (
                  <div key={i} className="p-3 border rounded-lg">
                    <Badge className={item.color}>{item.phase}</Badge>
                    <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💡 Tips:</strong> Semua fase checklist WAJIB dilengkapi sebelum melanjutkan ke tahap berikutnya.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 33: Kamar Operasi - Jadwal ==========
    {
      id: "bedah-jadwal",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Calendar className="h-8 w-8" />
            Penjadwalan Operasi
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-3">
                {[
                  { step: 1, title: "Buat Jadwal Baru", desc: "Klik tombol '+ Jadwalkan Operasi' di halaman Kamar Operasi." },
                  { step: 2, title: "Pilih Pasien", desc: "Cari pasien dengan No. RM atau nama. Pastikan sudah ada order operasi." },
                  { step: 3, title: "Tentukan Tanggal & Waktu", desc: "Pilih tanggal dan estimasi jam mulai operasi." },
                  { step: 4, title: "Pilih Ruang OK", desc: "Sistem menampilkan ruang OK yang tersedia pada waktu tersebut." },
                  { step: 5, title: "Tentukan Tim", desc: "Pilih operator utama, asisten, anestesiolog, dan perawat OK." },
                  { step: 6, title: "Konfirmasi", desc: "Review dan klik 'Simpan Jadwal'." },
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
                <h4 className="font-semibold mb-3">Status Jadwal:</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Terjadwal</Badge>
                    <span className="text-sm text-muted-foreground">Sudah dijadwalkan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-500">Persiapan</Badge>
                    <span className="text-sm text-muted-foreground">Pasien di ruang persiapan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-500">Berlangsung</Badge>
                    <span className="text-sm text-muted-foreground">Operasi sedang berjalan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500">Selesai</Badge>
                    <span className="text-sm text-muted-foreground">Operasi selesai</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-800">Operasi CITO:</h4>
                <p className="text-sm text-red-700 mt-1">Untuk operasi darurat, pilih 'CITO' saat membuat jadwal. Jadwal akan diprioritaskan.</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 34: ICU - Overview ==========
    {
      id: "icu-overview",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <HeartPulse className="h-8 w-8" />
            Modul ICU / NICU / PICU
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">
                Modul perawatan intensif untuk monitoring pasien kritis dengan dukungan ventilator dan scoring system.
              </p>
              <div className="space-y-3">
                <h4 className="font-semibold">Fitur Khusus:</h4>
                {[
                  "Monitoring vital sign real-time",
                  "Grafik trend parameter vital",
                  "Ventilator tracking & setting",
                  "APACHE II / SOFA Score",
                  "Fluid balance harian",
                  "Catatan perawatan intensif",
                  "Integrasi lab & farmasi",
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
                <h4 className="font-semibold mb-3">Unit Perawatan Intensif:</h4>
                <div className="space-y-2">
                  {[
                    { name: "ICU", desc: "Dewasa", beds: 8 },
                    { name: "NICU", desc: "Neonatus", beds: 6 },
                    { name: "PICU", desc: "Pediatrik", beds: 4 },
                    { name: "ICCU", desc: "Kardiak", beds: 4 },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-card rounded border">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <Badge variant="outline">{item.beds} bed</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 35: ICU - Monitoring ==========
    {
      id: "icu-monitoring",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Activity className="h-8 w-8" />
            Monitoring Pasien ICU
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-foreground">
                Input dan pantau parameter vital pasien ICU secara berkala.
              </p>
              <div className="space-y-3">
                <h4 className="font-semibold">Parameter yang Dipantau:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "Tekanan Darah", "Heart Rate", "SpO2", "Suhu",
                    "RR", "CVP", "MAP", "Urine Output",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                      <Activity className="h-4 w-4 text-primary" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Frekuensi Input:</h4>
                <ul className="text-sm space-y-1">
                  <li>• Vital sign: Setiap 1-2 jam</li>
                  <li>• Intake/output: Setiap shift</li>
                  <li>• Ventilator setting: Setiap perubahan</li>
                  <li>• Scoring: Harian</li>
                </ul>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-card border rounded-lg">
                <h4 className="font-semibold mb-3">Contoh Dashboard Pasien:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-muted rounded text-center">
                    <p className="text-muted-foreground text-xs">BP</p>
                    <p className="font-bold text-lg">120/80</p>
                  </div>
                  <div className="p-2 bg-muted rounded text-center">
                    <p className="text-muted-foreground text-xs">HR</p>
                    <p className="font-bold text-lg">82</p>
                  </div>
                  <div className="p-2 bg-muted rounded text-center">
                    <p className="text-muted-foreground text-xs">SpO2</p>
                    <p className="font-bold text-lg text-green-600">98%</p>
                  </div>
                  <div className="p-2 bg-muted rounded text-center">
                    <p className="text-muted-foreground text-xs">Temp</p>
                    <p className="font-bold text-lg">36.8°C</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💡 APACHE II Score:</strong> Skor 0-71 untuk prediksi mortalitas. Input otomatis dari data lab dan vital sign.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 36: Hemodialisa - Overview ==========
    {
      id: "hd-overview",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Droplets className="h-8 w-8" />
            Modul Hemodialisa
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">
                Modul untuk pengelolaan unit hemodialisa, penjadwalan sesi, dan monitoring adekuasi dialisis.
              </p>
              <div className="space-y-3">
                <h4 className="font-semibold">Fitur Utama:</h4>
                {[
                  "Penjadwalan sesi HD rutin",
                  "Manajemen mesin HD",
                  "Monitoring intra-dialitik",
                  "Kalkulasi Kt/V (adekuasi)",
                  "Catatan akses vaskuler",
                  "Pemberian EPO & obat HD",
                  "Laporan bulanan HD",
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
                <h4 className="font-semibold mb-3">Jadwal Sesi Mingguan:</h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  {["Senin", "Rabu", "Jumat"].map((day) => (
                    <div key={day} className="p-2 bg-card rounded border text-center">
                      <p className="font-medium">{day}</p>
                      <p className="text-xs text-muted-foreground">Shift I: 07.00</p>
                      <p className="text-xs text-muted-foreground">Shift II: 13.00</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800">Target Adekuasi:</h4>
                <p className="text-sm text-green-700 mt-1">Kt/V ≥ 1.2 atau URR ≥ 65%</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 37: Hemodialisa - Sesi ==========
    {
      id: "hd-session",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Clock className="h-8 w-8" />
            Dokumentasi Sesi HD
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-3">
                {[
                  { step: 1, title: "Pre-Dialisis", desc: "Input BB pre, TD, HR, keluhan, akses vaskuler." },
                  { step: 2, title: "Setting Mesin", desc: "QB, QD, UF goal, durasi, dialisat." },
                  { step: 3, title: "Monitoring Intra", desc: "Catat TD, HR setiap 1 jam. Catat kejadian khusus." },
                  { step: 4, title: "Post-Dialisis", desc: "BB post, TD post, UFR aktual, komplikasi." },
                  { step: 5, title: "Kalkulasi", desc: "Sistem hitung Kt/V, URR otomatis." },
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
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="font-semibold text-amber-800">Komplikasi Intra-Dialitik:</h4>
                <ul className="text-sm text-amber-700 mt-2 space-y-1">
                  <li>• Hipotensi</li>
                  <li>• Kram otot</li>
                  <li>• Mual/muntah</li>
                  <li>• Nyeri dada</li>
                  <li>• Clotting</li>
                </ul>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Contoh Setting:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-card rounded border">
                    <p className="text-muted-foreground text-xs">QB</p>
                    <p className="font-bold">250 ml/min</p>
                  </div>
                  <div className="p-2 bg-card rounded border">
                    <p className="text-muted-foreground text-xs">QD</p>
                    <p className="font-bold">500 ml/min</p>
                  </div>
                  <div className="p-2 bg-card rounded border">
                    <p className="text-muted-foreground text-xs">UF Goal</p>
                    <p className="font-bold">2.5 L</p>
                  </div>
                  <div className="p-2 bg-card rounded border">
                    <p className="text-muted-foreground text-xs">Durasi</p>
                    <p className="font-bold">4 jam</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 38: Bank Darah - Overview ==========
    {
      id: "bloodbank-overview",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Heart className="h-8 w-8" />
            Modul Bank Darah (BDRS)
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">
                Modul Bank Darah Rumah Sakit untuk manajemen stok darah, permintaan transfusi, dan uji silang.
              </p>
              <div className="space-y-3">
                <h4 className="font-semibold">Fitur Utama:</h4>
                {[
                  "Manajemen stok per golongan darah",
                  "Penerimaan darah dari PMI/UTD",
                  "Permintaan transfusi dari ruangan",
                  "Uji silang (crossmatch)",
                  "Screening infeksi (HIV, HBsAg, HCV)",
                  "Pelacakan darah (traceability)",
                  "Laporan penggunaan darah",
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
                <h4 className="font-semibold mb-3">Stok Per Golongan:</h4>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { type: "A+", count: 12 },
                    { type: "A-", count: 3 },
                    { type: "B+", count: 8 },
                    { type: "B-", count: 2 },
                    { type: "O+", count: 15 },
                    { type: "O-", count: 4 },
                    { type: "AB+", count: 5 },
                    { type: "AB-", count: 1 },
                  ].map((item) => (
                    <div key={item.type} className="p-2 bg-card rounded border text-center">
                      <p className="font-bold text-primary">{item.type}</p>
                      <p className="text-sm">{item.count} bag</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-800">Stok Kritis:</h4>
                <p className="text-sm text-red-700 mt-1">O- dan AB- tersisa &lt; 5 bag. Segera order ke PMI.</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 39: Bank Darah - Crossmatch ==========
    {
      id: "bloodbank-crossmatch",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <FlaskConical className="h-8 w-8" />
            Uji Silang (Crossmatch)
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-3">
                {[
                  { step: 1, title: "Terima Permintaan", desc: "Order transfusi masuk dari ruangan dengan sampel darah pasien." },
                  { step: 2, title: "Cek Golongan Darah", desc: "Verifikasi/ulang pemeriksaan golongan darah pasien." },
                  { step: 3, title: "Pilih Kantong Darah", desc: "Pilih kantong yang sesuai golongan dan paling mendekati expired." },
                  { step: 4, title: "Lakukan Crossmatch", desc: "Mayor dan minor crossmatch. Input hasil (Compatible/Incompatible)." },
                  { step: 5, title: "Validasi", desc: "Supervisor memvalidasi hasil crossmatch." },
                  { step: 6, title: "Release", desc: "Darah siap diserahkan ke ruangan untuk transfusi." },
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
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800 flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  Compatible
                </h4>
                <p className="text-sm text-green-700 mt-1">Tidak ada reaksi aglutinasi. Darah aman ditransfusikan.</p>
              </div>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-800 flex items-center gap-2">
                  <X className="h-5 w-5" />
                  Incompatible
                </h4>
                <p className="text-sm text-red-700 mt-1">Terdapat reaksi aglutinasi. JANGAN ditransfusikan. Pilih kantong lain.</p>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="font-semibold text-amber-800">Masa Berlaku Crossmatch:</h4>
                <p className="text-sm text-amber-700 mt-1">Hasil crossmatch berlaku 72 jam. Lewat masa ini harus diulang.</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 40: Gizi - Overview ==========
    {
      id: "gizi-overview",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Utensils className="h-8 w-8" />
            Modul Gizi / Dietary
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">
                Modul Gizi untuk pengelolaan diet pasien rawat inap, asesmen gizi, dan perencanaan menu.
              </p>
              <div className="space-y-3">
                <h4 className="font-semibold">Fitur Utama:</h4>
                {[
                  "Asesmen status gizi pasien",
                  "Penentuan kebutuhan kalori",
                  "Perencanaan diet individual",
                  "Manajemen alergi makanan",
                  "Jadwal distribusi makanan",
                  "Konsultasi gizi",
                  "Edukasi diet pulang",
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
                <h4 className="font-semibold mb-3">Jenis Diet Tersedia:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    "Diet Biasa", "Diet Lunak", "Diet Saring", "Diet Cair",
                    "Diet DM", "Diet Rendah Garam", "Diet Rendah Protein", "Diet Jantung",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-card rounded border">
                      <Apple className="h-4 w-4 text-primary" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="font-semibold text-amber-800">Perhatian Alergi:</h4>
                <p className="text-sm text-amber-700 mt-1">Sistem akan warning jika menu mengandung bahan yang pasien alergi.</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 41: Gizi - Meal Plan ==========
    {
      id: "gizi-mealplan",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Apple className="h-8 w-8" />
            Perencanaan Menu Pasien
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-3">
                {[
                  { step: 1, title: "Asesmen Gizi", desc: "Ahli gizi melakukan asesmen: BB, TB, IMT, kondisi klinis." },
                  { step: 2, title: "Hitung Kebutuhan", desc: "Kalkulasi kebutuhan kalori, protein, lemak, karbohidrat." },
                  { step: 3, title: "Tentukan Jenis Diet", desc: "Pilih jenis diet sesuai diagnosis & kondisi." },
                  { step: 4, title: "Susun Menu", desc: "Buat menu harian: makan pagi, siang, malam, snack." },
                  { step: 5, title: "Order ke Dapur", desc: "Kirim order menu ke dapur untuk disiapkan." },
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
              <h4 className="font-semibold mb-3">Contoh Menu Diet DM 1500 kkal:</h4>
              <div className="space-y-3 text-sm">
                <div className="p-2 bg-card rounded border">
                  <p className="font-medium">Makan Pagi (07.00)</p>
                  <p className="text-muted-foreground text-xs">Nasi merah 100gr, telur rebus 1 butir, sayur bening, teh tawar</p>
                </div>
                <div className="p-2 bg-card rounded border">
                  <p className="font-medium">Snack (10.00)</p>
                  <p className="text-muted-foreground text-xs">Buah pepaya 100gr</p>
                </div>
                <div className="p-2 bg-card rounded border">
                  <p className="font-medium">Makan Siang (12.00)</p>
                  <p className="text-muted-foreground text-xs">Nasi merah 150gr, ikan panggang, tumis kangkung, buah</p>
                </div>
                <div className="p-2 bg-card rounded border">
                  <p className="font-medium">Makan Malam (18.00)</p>
                  <p className="text-muted-foreground text-xs">Nasi merah 100gr, ayam kukus, sayur sop</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 42: Rehabilitasi - Overview ==========
    {
      id: "rehab-overview",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Dumbbell className="h-8 w-8" />
            Modul Rehabilitasi Medik
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">
                Modul untuk pelayanan rehabilitasi medik dan fisioterapi pasien.
              </p>
              <div className="space-y-3">
                <h4 className="font-semibold">Layanan Rehabilitasi:</h4>
                {[
                  "Fisioterapi",
                  "Okupasi Terapi",
                  "Terapi Wicara",
                  "Ortotik Prostetik",
                  "Hidroterapi",
                  "Elektroterapi",
                  "Terapi Latihan",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-primary" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Alur Pelayanan:</h4>
              <div className="space-y-3">
                {[
                  { step: 1, text: "Konsultasi dokter Sp.KFR" },
                  { step: 2, text: "Asesmen oleh fisioterapis" },
                  { step: 3, text: "Buat program terapi" },
                  { step: 4, text: "Jadwalkan sesi terapi" },
                  { step: 5, text: "Eksekusi terapi + dokumentasi" },
                  { step: 6, text: "Evaluasi kemajuan berkala" },
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

    // ========== SLIDE 43: Rehabilitasi - Sesi ==========
    {
      id: "rehab-session",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Calendar className="h-8 w-8" />
            Jadwal & Dokumentasi Terapi
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-3">
                {[
                  { step: 1, title: "Lihat Jadwal", desc: "Buka menu Rehabilitasi > Jadwal. Lihat sesi hari ini." },
                  { step: 2, title: "Panggil Pasien", desc: "Klik nama pasien untuk memulai sesi terapi." },
                  { step: 3, title: "Dokumentasi", desc: "Catat jenis terapi yang dilakukan, durasi, respons pasien." },
                  { step: 4, title: "Evaluasi", desc: "Input skor kemajuan (VAS, ROM, Barthel Index, dll)." },
                  { step: 5, title: "Selesai", desc: "Simpan catatan, jadwalkan sesi berikutnya." },
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
                <h4 className="font-semibold mb-3">Jenis Modalitas:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    "TENS", "Ultrasound", "SWD", "MWD",
                    "IRR", "Paraffin Bath", "Traksi", "CPM",
                  ].map((item, i) => (
                    <div key={i} className="p-2 bg-card rounded border text-center">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💡 Tips:</strong> Gunakan foto/video untuk dokumentasi kemajuan ROM pasien.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 44: MCU - Overview ==========
    {
      id: "mcu-overview",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <ClipboardCheck className="h-8 w-8" />
            Modul Medical Check Up (MCU)
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">
                Modul untuk pelayanan pemeriksaan kesehatan berkala perorangan maupun korporasi.
              </p>
              <div className="space-y-3">
                <h4 className="font-semibold">Fitur Utama:</h4>
                {[
                  "Manajemen paket MCU",
                  "Pendaftaran MCU perorangan/grup",
                  "Penjadwalan pemeriksaan",
                  "Integrasi lab & radiologi",
                  "Generate hasil MCU otomatis",
                  "Manajemen klien korporasi",
                  "Laporan MCU & statistik",
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
                <h4 className="font-semibold mb-3">Paket MCU Tersedia:</h4>
                <div className="space-y-2 text-sm">
                  {[
                    { name: "Paket Bronze", price: "Rp 500.000", items: "Lab dasar, EKG, Dokter" },
                    { name: "Paket Silver", price: "Rp 1.000.000", items: "+ Rontgen, USG Abdomen" },
                    { name: "Paket Gold", price: "Rp 2.000.000", items: "+ Treadmill, Lab lengkap" },
                    { name: "Paket Executive", price: "Rp 5.000.000", items: "+ CT Scan, Endoskopi" },
                  ].map((pkg, i) => (
                    <div key={i} className="p-2 bg-card rounded border">
                      <div className="flex justify-between">
                        <span className="font-medium">{pkg.name}</span>
                        <span className="text-primary font-bold">{pkg.price}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{pkg.items}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 45: MCU - Proses ==========
    {
      id: "mcu-process",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <FileCheck className="h-8 w-8" />
            Proses MCU
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-3">
                {[
                  { step: 1, title: "Registrasi MCU", desc: "Daftarkan peserta, pilih paket, jadwalkan tanggal." },
                  { step: 2, title: "Check-In", desc: "Peserta datang, verifikasi identitas, cetak checklist." },
                  { step: 3, title: "Pemeriksaan Fisik", desc: "Vital sign, TB/BB, visus, audiometri." },
                  { step: 4, title: "Lab & Radiologi", desc: "Pengambilan sampel, foto rontgen sesuai paket." },
                  { step: 5, title: "Pemeriksaan Dokter", desc: "Dokter melakukan anamnesis & pemeriksaan." },
                  { step: 6, title: "Generate Hasil", desc: "Sistem kompilasi hasil, dokter review & TTD." },
                  { step: 7, title: "Penyerahan Hasil", desc: "Hasil MCU diserahkan ke peserta/perusahaan." },
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
                <h4 className="font-semibold mb-3">Kategori Hasil MCU:</h4>
                <div className="space-y-2">
                  {[
                    { cat: "Fit", desc: "Sehat, layak bekerja", color: "bg-green-100 text-green-800" },
                    { cat: "Fit with Note", desc: "Layak dengan catatan", color: "bg-yellow-100 text-yellow-800" },
                    { cat: "Temporary Unfit", desc: "Sementara tidak layak", color: "bg-orange-100 text-orange-800" },
                    { cat: "Unfit", desc: "Tidak layak bekerja", color: "bg-red-100 text-red-800" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 border rounded">
                      <Badge className={item.color}>{item.cat}</Badge>
                      <span className="text-sm text-muted-foreground">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 46: Forensik - Overview ==========
    {
      id: "forensik-overview",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Skull className="h-8 w-8" />
            Modul Forensik & Kamar Jenazah
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">
                Modul untuk pelayanan forensik klinik, kamar jenazah, dan autopsi.
              </p>
              <div className="space-y-3">
                <h4 className="font-semibold">Layanan:</h4>
                {[
                  "Visum et Repertum",
                  "Pengelolaan kamar jenazah",
                  "Autopsi (untuk RS Pendidikan)",
                  "Surat keterangan kematian",
                  "Dokumentasi forensik",
                  "Koordinasi dengan kepolisian",
                  "Penyerahan jenazah ke keluarga",
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
                <h4 className="font-semibold mb-3">Kapasitas Kamar Jenazah:</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-card rounded border text-center">
                    <p className="text-2xl font-bold text-primary">8</p>
                    <p className="text-sm text-muted-foreground">Total Kapasitas</p>
                  </div>
                  <div className="p-3 bg-card rounded border text-center">
                    <p className="text-2xl font-bold">3</p>
                    <p className="text-sm text-muted-foreground">Terisi</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="font-semibold text-amber-800">Catatan Penting:</h4>
                <p className="text-sm text-amber-700 mt-1">Semua kasus forensik memerlukan koordinasi dengan pihak berwenang.</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 47: Forensik - Visum ==========
    {
      id: "forensik-visum",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <FileText className="h-8 w-8" />
            Pembuatan Visum et Repertum
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-3">
                {[
                  { step: 1, title: "Terima Permintaan", desc: "Permintaan visum dari kepolisian dengan surat resmi." },
                  { step: 2, title: "Identifikasi Korban", desc: "Catat identitas korban dari dokumen/surat pengantar." },
                  { step: 3, title: "Pemeriksaan", desc: "Dokter forensik melakukan pemeriksaan fisik lengkap." },
                  { step: 4, title: "Dokumentasi", desc: "Foto luka/cedera, ukuran, lokasi anatomis." },
                  { step: 5, title: "Penulisan Visum", desc: "Tulis hasil pemeriksaan dengan bahasa medis-legal." },
                  { step: 6, title: "Validasi & TTD", desc: "Dokter validasi dan tanda tangan visum." },
                  { step: 7, title: "Serahkan", desc: "Serahkan visum ke penyidik dengan tanda terima." },
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
                <h4 className="font-semibold mb-3">Jenis Visum:</h4>
                <div className="space-y-2 text-sm">
                  <div className="p-2 bg-card rounded border">
                    <p className="font-medium">Visum Hidup</p>
                    <p className="text-xs text-muted-foreground">Untuk korban masih hidup (KDRT, penganiayaan, kecelakaan)</p>
                  </div>
                  <div className="p-2 bg-card rounded border">
                    <p className="font-medium">Visum Mati (Jenazah)</p>
                    <p className="text-xs text-muted-foreground">Untuk korban meninggal dunia</p>
                  </div>
                  <div className="p-2 bg-card rounded border">
                    <p className="font-medium">Visum Psikiatri</p>
                    <p className="text-xs text-muted-foreground">Untuk pemeriksaan kejiwaan tersangka</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 48: Billing - Overview ==========
    {
      id: "billing-overview",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <CreditCard className="h-8 w-8" />
            Modul Billing
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">
                Modul Billing mengelola seluruh proses penagihan dan pembayaran pasien.
              </p>
              <div className="space-y-3">
                <h4 className="font-semibold">Fitur Utama:</h4>
                {[
                  "Kalkulasi biaya otomatis dari pelayanan",
                  "Multi jaminan (BPJS, Asuransi, Umum)",
                  "Split billing per jaminan",
                  "Pembayaran tunai/non-tunai",
                  "Cetak kwitansi & invoice",
                  "Rincian biaya terperinci",
                  "Laporan pendapatan",
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
                <h4 className="font-semibold mb-3">Komponen Biaya:</h4>
                <div className="space-y-2 text-sm">
                  {[
                    { item: "Jasa Dokter", amount: "Rp 150.000" },
                    { item: "Tindakan Medis", amount: "Rp 75.000" },
                    { item: "Obat & BMHP", amount: "Rp 250.000" },
                    { item: "Laboratorium", amount: "Rp 180.000" },
                    { item: "Administrasi", amount: "Rp 25.000" },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between p-2 bg-card rounded border">
                      <span>{item.item}</span>
                      <span className="font-bold">{item.amount}</span>
                    </div>
                  ))}
                  <div className="flex justify-between p-2 bg-primary/10 rounded font-bold">
                    <span>TOTAL</span>
                    <span className="text-primary">Rp 680.000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 49: Billing - Pembayaran ==========
    {
      id: "billing-payment",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Wallet className="h-8 w-8" />
            Proses Pembayaran
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-3">
                {[
                  { step: 1, title: "Buka Tagihan", desc: "Menu Billing > Tagihan Aktif. Cari pasien dengan No. RM atau nama." },
                  { step: 2, title: "Review Rincian", desc: "Periksa semua item tagihan. Pastikan sudah lengkap." },
                  { step: 3, title: "Tentukan Jaminan", desc: "Pilih jaminan: BPJS, Asuransi, Umum, atau kombinasi." },
                  { step: 4, title: "Hitung Tanggungan", desc: "Sistem otomatis hitung porsi jaminan dan tanggungan pasien." },
                  { step: 5, title: "Terima Pembayaran", desc: "Input nominal bayar, pilih metode (tunai/EDC/transfer)." },
                  { step: 6, title: "Cetak Kwitansi", desc: "Cetak kwitansi pembayaran untuk pasien." },
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
                <h4 className="font-semibold mb-3">Metode Pembayaran:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { method: "Tunai", icon: <Wallet className="h-4 w-4" /> },
                    { method: "Debit/Credit", icon: <CreditCard className="h-4 w-4" /> },
                    { method: "Transfer", icon: <Building className="h-4 w-4" /> },
                    { method: "QRIS", icon: <Scan className="h-4 w-4" /> },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 bg-card rounded border">
                      <span className="text-primary">{item.icon}</span>
                      <span className="text-sm">{item.method}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800">Sudah Lunas</h4>
                <p className="text-sm text-green-700 mt-1">Setelah lunas, status berubah dan pasien bisa mengambil obat.</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 50: Billing - Laporan ==========
    {
      id: "billing-reports",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <BarChart3 className="h-8 w-8" />
            Laporan Pendapatan
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-foreground">
                Akses berbagai laporan pendapatan dan penerimaan kas.
              </p>
              <div className="space-y-3">
                <h4 className="font-semibold">Jenis Laporan:</h4>
                {[
                  "Laporan Penerimaan Harian",
                  "Laporan per Jenis Jaminan",
                  "Laporan per Unit/Departemen",
                  "Laporan Piutang Pasien",
                  "Laporan Piutang Asuransi",
                  "Rekap Pendapatan Bulanan",
                  "Analisis Trend Pendapatan",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <FileBarChart className="h-4 w-4 text-primary" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3">Ringkasan Hari Ini:</h4>
              <div className="space-y-3">
                <div className="p-3 bg-card rounded border">
                  <p className="text-sm text-muted-foreground">Total Penerimaan</p>
                  <p className="text-2xl font-bold text-primary">Rp 45.750.000</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="p-2 bg-card rounded border text-center">
                    <p className="text-muted-foreground text-xs">Tunai</p>
                    <p className="font-bold">Rp 12.5 jt</p>
                  </div>
                  <div className="p-2 bg-card rounded border text-center">
                    <p className="text-muted-foreground text-xs">BPJS</p>
                    <p className="font-bold">Rp 28 jt</p>
                  </div>
                  <div className="p-2 bg-card rounded border text-center">
                    <p className="text-muted-foreground text-xs">Asuransi</p>
                    <p className="font-bold">Rp 5.25 jt</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 51-95: More detailed content ==========
    // Continue with BPJS, Asuransi, SATU SEHAT, Antrian, Booking, Telemedicine, Inventory, SDM, Akuntansi, Laporan, Master Data, User Management, Pengaturan, Portal Pasien, Mutu, Penunjang, Pendidikan, Kemenkes, FAQ

    // ========== SLIDE 51: BPJS - Overview ==========
    {
      id: "bpjs-overview",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Shield className="h-8 w-8" />
            Modul BPJS Kesehatan
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">
                Integrasi lengkap dengan layanan BPJS Kesehatan untuk bridging dan klaim.
              </p>
              <div className="space-y-3">
                <h4 className="font-semibold">Layanan BPJS Terintegrasi:</h4>
                {[
                  "VClaim - Penerbitan SEP",
                  "Antrean Online BPJS",
                  "PCare (untuk FKTP)",
                  "iCare - Monitoring Klaim",
                  "E-Claim - Pengajuan Klaim",
                  "Fingerprint BPJS",
                  "Cek Kepesertaan Real-time",
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
                <h4 className="font-semibold mb-3">Status Koneksi:</h4>
                <div className="space-y-2">
                  {[
                    { service: "VClaim", status: "Connected", ok: true },
                    { service: "Antrean", status: "Connected", ok: true },
                    { service: "E-Claim", status: "Connected", ok: true },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-card rounded border">
                      <span className="text-sm">{item.service}</span>
                      <Badge className={item.ok ? "bg-green-500" : "bg-red-500"}>{item.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💡 Info:</strong> Kredensial BPJS dikonfigurasi di menu Pengaturan &gt; Integrasi Eksternal.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 52: BPJS - SEP ==========
    {
      id: "bpjs-sep",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <FileText className="h-8 w-8" />
            Penerbitan SEP (Surat Eligibilitas Peserta)
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-3">
                {[
                  { step: 1, title: "Cek Kepesertaan", desc: "Input No. Kartu BPJS atau NIK. Klik 'Cek'. Pastikan status aktif." },
                  { step: 2, title: "Pilih Jenis Pelayanan", desc: "Rawat Jalan / Rawat Inap / IGD." },
                  { step: 3, title: "Input Data Rujukan", desc: "Untuk FKRTL: input nomor rujukan dari FKTP." },
                  { step: 4, title: "Pilih Poli & Dokter", desc: "Pilih poli tujuan dan dokter yang akan menangani." },
                  { step: 5, title: "Input Diagnosa Awal", desc: "Pilih kode ICD-10 untuk diagnosa awal." },
                  { step: 6, title: "Terbitkan SEP", desc: "Klik 'Buat SEP'. Sistem akan menghubungi VClaim BPJS." },
                  { step: 7, title: "Cetak SEP", desc: "Setelah berhasil, cetak SEP untuk pasien." },
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
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="font-semibold text-amber-800">Syarat Penerbitan SEP:</h4>
                <ul className="text-sm text-amber-700 mt-2 space-y-1">
                  <li>• Kepesertaan BPJS aktif</li>
                  <li>• Rujukan valid (untuk FKRTL)</li>
                  <li>• Tidak ada SEP ganda di tanggal sama</li>
                </ul>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Contoh No. SEP:</h4>
                <p className="font-mono text-lg">0301R0011223V000001</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 53: BPJS - Klaim ==========
    {
      id: "bpjs-claim",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Receipt className="h-8 w-8" />
            Pengajuan Klaim BPJS
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-foreground">
                Proses pengajuan klaim ke BPJS setelah pelayanan selesai.
              </p>
              <div className="space-y-3">
                {[
                  { step: 1, title: "Lengkapi Diagnosa", desc: "Pastikan ICD-10 (diagnosa) dan ICD-9 (prosedur) sudah di-input." },
                  { step: 2, title: "Grouping INA-CBG", desc: "Sistem otomatis grouping. Cek kode dan tarif INA-CBG." },
                  { step: 3, title: "Review Berkas", desc: "Verifikasi kelengkapan: SEP, resume medis, penunjang." },
                  { step: 4, title: "Kirim Klaim", desc: "Klik 'Kirim ke E-Claim' untuk mengajukan klaim." },
                  { step: 5, title: "Monitor Status", desc: "Pantau status klaim di menu Monitoring Klaim." },
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
                <h4 className="font-semibold mb-3">Status Klaim:</h4>
                <div className="space-y-2">
                  {[
                    { status: "Layak", desc: "Klaim disetujui", color: "bg-green-500" },
                    { status: "Pending", desc: "Menunggu verifikasi", color: "bg-yellow-500" },
                    { status: "Dispute", desc: "Ada ketidaksesuaian", color: "bg-orange-500" },
                    { status: "Tidak Layak", desc: "Klaim ditolak", color: "bg-red-500" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 border rounded">
                      <Badge className={item.color}>{item.status}</Badge>
                      <span className="text-sm text-muted-foreground">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ========== SLIDE 54-95: Continue with remaining modules ==========
    // Adding summary slides for remaining modules

    // SLIDE 54: Asuransi Overview
    {
      id: "asuransi-overview",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Building className="h-8 w-8" />
            Modul Asuransi & Jaminan Lain
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">Kelola berbagai jenis jaminan selain BPJS.</p>
              <div className="space-y-3">
                <h4 className="font-semibold">Jenis Jaminan:</h4>
                {["Asuransi Swasta (Prudential, Allianz, dll)", "Jasa Raharja (Kecelakaan)", "Perusahaan/Korporasi", "CoB (Coordination of Benefit)", "Umum/Pribadi"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3">Fitur:</h4>
              <ul className="text-sm space-y-2">
                <li>• Cek eligibilitas ke provider asuransi</li>
                <li>• Letter of Guarantee (LoG)</li>
                <li>• Klaim cashless & reimbursement</li>
                <li>• Tracking status klaim</li>
                <li>• Laporan piutang per asuransi</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },

    // SLIDE 55: Asuransi Klaim
    {
      id: "asuransi-klaim",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <FileCheck className="h-8 w-8" />
            Proses Klaim Asuransi
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              {[
                { step: 1, title: "Verifikasi Polis", desc: "Cek nomor polis, masa aktif, dan plafon." },
                { step: 2, title: "Minta LoG", desc: "Ajukan Letter of Guarantee ke asuransi." },
                { step: 3, title: "Pelayanan", desc: "Berikan pelayanan sesuai cakupan." },
                { step: 4, title: "Ajukan Klaim", desc: "Kirim berkas klaim ke asuransi." },
                { step: 5, title: "Terima Pembayaran", desc: "Rekonsiliasi pembayaran dari asuransi." },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 p-3 bg-muted rounded-lg">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">{item.step}</div>
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800">Dokumen Klaim:</h4>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• Formulir klaim</li>
                <li>• Resume medis</li>
                <li>• Rincian biaya</li>
                <li>• Hasil penunjang (lab/radiologi)</li>
                <li>• Kwitansi asli</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },

    // SLIDE 56-95: Add remaining detailed slides for each module
    // For brevity, I'll add key slides and summaries

    // SATU SEHAT slides
    {
      id: "satusehat-overview",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Activity className="h-8 w-8" />
            Integrasi SATU SEHAT
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">Platform data kesehatan nasional berbasis FHIR R4.</p>
              <div className="space-y-3">
                <h4 className="font-semibold">Resource yang Disinkronkan:</h4>
                {["Patient", "Encounter", "Condition", "Observation", "Medication", "ServiceRequest", "DiagnosticReport", "Composition (Bundle RME)"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm font-mono">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-3">Status Sinkronisasi:</h4>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 bg-card rounded border">
                    <span className="text-sm">Terkirim Hari Ini</span>
                    <Badge className="bg-green-500">247</Badge>
                  </div>
                  <div className="flex justify-between p-2 bg-card rounded border">
                    <span className="text-sm">Gagal</span>
                    <Badge variant="destructive">3</Badge>
                  </div>
                  <div className="flex justify-between p-2 bg-card rounded border">
                    <span className="text-sm">Pending</span>
                    <Badge variant="outline">12</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    {
      id: "satusehat-config",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Settings className="h-8 w-8" />
            Konfigurasi SATU SEHAT
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              {[
                { step: 1, title: "Daftar di SATU SEHAT", desc: "Daftarkan faskes di satusehat.kemkes.go.id" },
                { step: 2, title: "Dapatkan Kredensial", desc: "Client ID dan Client Secret dari SATU SEHAT." },
                { step: 3, title: "Input di Pengaturan", desc: "Menu Pengaturan > SATU SEHAT. Masukkan kredensial." },
                { step: 4, title: "Pilih Environment", desc: "Development untuk testing, Production untuk live." },
                { step: 5, title: "Test Koneksi", desc: "Klik 'Test Koneksi' untuk verifikasi." },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 p-3 bg-muted rounded-lg">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">{item.step}</div>
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-semibold text-amber-800">Penting:</h4>
              <ul className="text-sm text-amber-700 mt-2 space-y-1">
                <li>• Gunakan environment Development untuk testing</li>
                <li>• Jangan share Client Secret</li>
                <li>• Token akan auto-refresh</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },

    {
      id: "satusehat-sync",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Activity className="h-8 w-8" />
            Sinkronisasi Data ke SATU SEHAT
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-foreground">Data otomatis dikirim ke SATU SEHAT setelah kunjungan selesai.</p>
              <div className="space-y-3">
                <h4 className="font-semibold">Alur Sinkronisasi:</h4>
                {[
                  "Kunjungan pasien selesai",
                  "Data di-bundle dalam format FHIR",
                  "Sistem mengirim ke API SATU SEHAT",
                  "Response diterima & dicatat",
                  "Jika gagal, masuk antrian retry",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</div>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3">Log Sinkronisasi:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-green-50 rounded border border-green-200">
                  <span>RM-000123 - Encounter</span>
                  <Badge className="bg-green-500">Success</Badge>
                </div>
                <div className="flex justify-between p-2 bg-green-50 rounded border border-green-200">
                  <span>RM-000124 - Condition</span>
                  <Badge className="bg-green-500">Success</Badge>
                </div>
                <div className="flex justify-between p-2 bg-red-50 rounded border border-red-200">
                  <span>RM-000125 - Encounter</span>
                  <Badge variant="destructive">Failed</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // Continue with Antrian, Booking, Telemedicine, Inventory, SDM, Akuntansi, dll
    // For brevity, adding summary slides for remaining modules

    {
      id: "antrian-overview",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Clock className="h-8 w-8" />
            Sistem Antrian
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">Manajemen antrian pasien terintegrasi dengan BPJS Antrean.</p>
              <div className="space-y-3">
                <h4 className="font-semibold">Fitur Antrian:</h4>
                {["Ambil nomor antrian (on-site/online)", "Display antrian per poli", "Panggil pasien dari sistem", "Estimasi waktu tunggu", "Integrasi BPJS Antrean Online", "Laporan waktu tunggu"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3">Status Antrian Hari Ini:</h4>
              <div className="space-y-2">
                {[
                  { poli: "Poli Umum", current: "A-025", waiting: 12 },
                  { poli: "Poli Penyakit Dalam", current: "B-018", waiting: 8 },
                  { poli: "Poli Anak", current: "C-010", waiting: 5 },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-card rounded border">
                    <span className="text-sm">{item.poli}</span>
                    <div className="flex gap-2">
                      <Badge variant="outline">{item.current}</Badge>
                      <Badge>{item.waiting} menunggu</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
    },

    {
      id: "antrian-usage",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Bell className="h-8 w-8" />
            Penggunaan Sistem Antrian
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="font-semibold">Untuk Petugas Loket:</h4>
              {[
                { step: 1, title: "Generate Antrian", desc: "Setelah daftar, klik 'Cetak Antrian'." },
                { step: 2, title: "Monitor Display", desc: "Pantau jumlah antrian di display loket." },
                { step: 3, title: "Update Status", desc: "Update jika ada pembatalan/reschedule." },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 p-3 bg-muted rounded-lg">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">{item.step}</div>
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Untuk Poli/Unit:</h4>
              {[
                { step: 1, title: "Lihat Antrian", desc: "Buka halaman antrian poli Anda." },
                { step: 2, title: "Panggil Pasien", desc: "Klik 'Panggil' untuk memanggil nomor berikutnya." },
                { step: 3, title: "Lewati/Skip", desc: "Klik 'Skip' jika pasien tidak hadir." },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 p-3 bg-muted rounded-lg">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">{item.step}</div>
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },

    // Booking
    {
      id: "booking-overview",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Calendar className="h-8 w-8" />
            Booking & Jadwal Dokter
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">Sistem booking online untuk reservasi jadwal dokter.</p>
              <div className="space-y-3">
                <h4 className="font-semibold">Fitur Booking:</h4>
                {["Lihat jadwal praktek dokter", "Booking slot waktu", "Reminder otomatis (SMS/WA)", "Reschedule/cancel booking", "Integrasi dengan antrian", "Laporan booking harian"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3">Jadwal Hari Ini:</h4>
              <div className="space-y-2 text-sm">
                {[
                  { doc: "dr. Ahmad, Sp.PD", time: "08:00-12:00", booked: 15 },
                  { doc: "dr. Siti, Sp.A", time: "09:00-13:00", booked: 12 },
                  { doc: "dr. Budi, Sp.B", time: "10:00-14:00", booked: 8 },
                ].map((item, i) => (
                  <div key={i} className="p-2 bg-card rounded border">
                    <p className="font-medium">{item.doc}</p>
                    <div className="flex justify-between text-muted-foreground text-xs">
                      <span>{item.time}</span>
                      <span>{item.booked} booking</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
    },

    {
      id: "booking-usage",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Calendar className="h-8 w-8" />
            Cara Booking Jadwal
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              {[
                { step: 1, title: "Pilih Poli/Dokter", desc: "Cari dokter atau pilih dari daftar poli." },
                { step: 2, title: "Lihat Jadwal", desc: "Lihat slot yang tersedia di kalender." },
                { step: 3, title: "Pilih Waktu", desc: "Klik slot waktu yang diinginkan." },
                { step: 4, title: "Input Data Pasien", desc: "Masukkan data pasien atau cari dengan No. RM." },
                { step: 5, title: "Konfirmasi", desc: "Review dan klik 'Konfirmasi Booking'." },
                { step: 6, title: "Kirim Reminder", desc: "Sistem akan mengirim reminder ke pasien." },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 p-3 bg-muted rounded-lg">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">{item.step}</div>
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800">Tips:</h4>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• Booking dapat dilakukan H-7</li>
                <li>• Pasien akan menerima kode booking</li>
                <li>• Tunjukkan kode saat check-in</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },

    // Telemedicine
    {
      id: "telemedicine-overview",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Video className="h-8 w-8" />
            Modul Telemedicine
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">Layanan konsultasi jarak jauh via video call.</p>
              <div className="space-y-3">
                <h4 className="font-semibold">Fitur Telemedicine:</h4>
                {["Video call HD", "Chat real-time", "Share screen/dokumen", "Rekam sesi (opsional)", "E-prescription langsung", "Integrasi rekam medis"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-3">Alur Telemedicine:</h4>
                {["Pasien booking jadwal telekonsul", "Pasien login ke portal", "Dokter memulai video call", "Konsultasi & pemeriksaan", "Dokter buat resep (jika perlu)", "Pasien bayar & ambil obat"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">{i + 1}</div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
    },

    {
      id: "telemedicine-usage",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Video className="h-8 w-8" />
            Memulai Sesi Telemedicine
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="font-semibold">Untuk Dokter:</h4>
              {[
                { step: 1, title: "Buka Menu Telemedicine", desc: "Lihat jadwal konsultasi hari ini." },
                { step: 2, title: "Klik 'Mulai Sesi'", desc: "Sistem akan menghubungkan ke pasien." },
                { step: 3, title: "Lakukan Konsultasi", desc: "Video call dengan pasien, catat temuan." },
                { step: 4, title: "Buat Resep", desc: "Jika perlu, buat e-prescription." },
                { step: 5, title: "Akhiri Sesi", desc: "Simpan catatan dan akhiri sesi." },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 p-3 bg-muted rounded-lg">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">{item.step}</div>
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-semibold text-amber-800">Persyaratan Teknis:</h4>
              <ul className="text-sm text-amber-700 mt-2 space-y-1">
                <li>• Koneksi internet stabil (min 2 Mbps)</li>
                <li>• Webcam & microphone aktif</li>
                <li>• Browser Chrome/Firefox terbaru</li>
                <li>• Izinkan akses kamera & mikrofon</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },

    // Inventory
    {
      id: "inventory-overview",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Package className="h-8 w-8" />
            Modul Inventory
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">Manajemen stok obat, alat kesehatan, dan BHP.</p>
              <div className="space-y-3">
                <h4 className="font-semibold">Fitur Inventory:</h4>
                {["Manajemen stok per gudang/depo", "Purchase Order (PO)", "Penerimaan barang (GRN)", "Transfer antar gudang", "Retur barang", "Kartu stok digital", "Alert stok minimum & expired"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3">Ringkasan Stok:</h4>
              <div className="space-y-2">
                <div className="p-2 bg-card rounded border">
                  <p className="text-sm text-muted-foreground">Total Item</p>
                  <p className="text-xl font-bold">2,458</p>
                </div>
                <div className="p-2 bg-red-50 rounded border border-red-200">
                  <p className="text-sm text-red-700">Stok Kritis</p>
                  <p className="text-xl font-bold text-red-700">23</p>
                </div>
                <div className="p-2 bg-amber-50 rounded border border-amber-200">
                  <p className="text-sm text-amber-700">Mendekati Expired</p>
                  <p className="text-xl font-bold text-amber-700">45</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    {
      id: "inventory-po",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <FileCheck className="h-8 w-8" />
            Membuat Purchase Order
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              {[
                { step: 1, title: "Buat PO Baru", desc: "Menu Inventory > PO > Tambah PO." },
                { step: 2, title: "Pilih Supplier", desc: "Pilih supplier dari daftar vendor." },
                { step: 3, title: "Tambah Item", desc: "Cari dan tambahkan item yang akan dipesan." },
                { step: 4, title: "Input Jumlah & Harga", desc: "Masukkan qty dan harga per item." },
                { step: 5, title: "Simpan Draft", desc: "Simpan sebagai draft untuk review." },
                { step: 6, title: "Approval", desc: "Kirim untuk approval atasan." },
                { step: 7, title: "Kirim ke Supplier", desc: "Setelah approved, kirim PO ke supplier." },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 p-3 bg-muted rounded-lg">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">{item.step}</div>
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3">Status PO:</h4>
              <div className="space-y-2">
                {[
                  { status: "Draft", color: "bg-gray-500" },
                  { status: "Pending Approval", color: "bg-yellow-500" },
                  { status: "Approved", color: "bg-blue-500" },
                  { status: "Sent", color: "bg-purple-500" },
                  { status: "Received", color: "bg-green-500" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Badge className={item.color}>{item.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
    },

    {
      id: "inventory-receive",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Package className="h-8 w-8" />
            Penerimaan Barang
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              {[
                { step: 1, title: "Pilih PO", desc: "Buka PO yang akan diterima barangnya." },
                { step: 2, title: "Klik 'Terima Barang'", desc: "Mulai proses penerimaan barang." },
                { step: 3, title: "Input Qty Diterima", desc: "Masukkan jumlah aktual yang diterima per item." },
                { step: 4, title: "Input Batch/Expired", desc: "Catat nomor batch dan tanggal expired." },
                { step: 5, title: "Verifikasi Fisik", desc: "Cek kondisi barang, kemasan, suhu (jika perlu)." },
                { step: 6, title: "Konfirmasi", desc: "Simpan penerimaan. Stok otomatis bertambah." },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 p-3 bg-muted rounded-lg">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">{item.step}</div>
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800">Penting:</h4>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• Selalu cek kesesuaian dengan faktur</li>
                <li>• Catat jika ada selisih qty</li>
                <li>• Simpan bukti penerimaan</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },

    // SDM/HRD
    {
      id: "sdm-overview",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <UserCog className="h-8 w-8" />
            Modul SDM / HRD
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">Manajemen sumber daya manusia rumah sakit.</p>
              <div className="space-y-3">
                <h4 className="font-semibold">Fitur SDM:</h4>
                {["Data karyawan lengkap", "Absensi & kehadiran", "Manajemen cuti", "Penggajian (payroll)", "Lembur", "Penilaian kinerja", "Pelatihan & sertifikasi", "Jadwal shift & roster"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3">Statistik Karyawan:</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-card rounded border text-center">
                  <p className="text-2xl font-bold text-primary">342</p>
                  <p className="text-xs text-muted-foreground">Total Karyawan</p>
                </div>
                <div className="p-2 bg-card rounded border text-center">
                  <p className="text-2xl font-bold text-green-600">325</p>
                  <p className="text-xs text-muted-foreground">Hadir Hari Ini</p>
                </div>
                <div className="p-2 bg-card rounded border text-center">
                  <p className="text-2xl font-bold text-yellow-600">12</p>
                  <p className="text-xs text-muted-foreground">Cuti</p>
                </div>
                <div className="p-2 bg-card rounded border text-center">
                  <p className="text-2xl font-bold text-red-600">5</p>
                  <p className="text-xs text-muted-foreground">Sakit</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    {
      id: "sdm-attendance",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Clock className="h-8 w-8" />
            Absensi & Kehadiran
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-foreground">Kelola absensi karyawan dengan berbagai metode.</p>
              <div className="space-y-3">
                <h4 className="font-semibold">Metode Absensi:</h4>
                {["Fingerprint", "Face Recognition", "Kartu RFID", "Absensi Online (GPS)", "Manual Entry (approval)"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3">Laporan Kehadiran:</h4>
              <ul className="text-sm space-y-2">
                <li>• Rekap harian per unit</li>
                <li>• Rekap bulanan per karyawan</li>
                <li>• Analisis keterlambatan</li>
                <li>• Laporan lembur</li>
                <li>• Export untuk payroll</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },

    {
      id: "sdm-payroll",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Wallet className="h-8 w-8" />
            Penggajian (Payroll)
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              {[
                { step: 1, title: "Import Data Kehadiran", desc: "Tarik data absensi bulan berjalan." },
                { step: 2, title: "Hitung Komponen", desc: "Sistem hitung gaji pokok, tunjangan, lembur." },
                { step: 3, title: "Hitung Potongan", desc: "BPJS Kesehatan, BPJS TK, PPh 21." },
                { step: 4, title: "Review", desc: "Atasan review dan approve payroll." },
                { step: 5, title: "Generate Slip Gaji", desc: "Buat slip gaji per karyawan." },
                { step: 6, title: "Transfer Gaji", desc: "Proses transfer ke rekening karyawan." },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 p-3 bg-muted rounded-lg">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">{item.step}</div>
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3">Komponen Gaji:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-card rounded border">
                  <span>Gaji Pokok</span>
                  <span className="font-bold">+ Rp 5.000.000</span>
                </div>
                <div className="flex justify-between p-2 bg-card rounded border">
                  <span>Tunjangan</span>
                  <span className="font-bold">+ Rp 1.500.000</span>
                </div>
                <div className="flex justify-between p-2 bg-card rounded border">
                  <span>Lembur</span>
                  <span className="font-bold">+ Rp 450.000</span>
                </div>
                <div className="flex justify-between p-2 bg-red-50 rounded border">
                  <span>BPJS</span>
                  <span className="font-bold text-red-600">- Rp 200.000</span>
                </div>
                <div className="flex justify-between p-2 bg-red-50 rounded border">
                  <span>PPh 21</span>
                  <span className="font-bold text-red-600">- Rp 150.000</span>
                </div>
                <div className="flex justify-between p-2 bg-primary/10 rounded border font-bold">
                  <span>Take Home Pay</span>
                  <span className="text-primary">Rp 6.600.000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // Akuntansi
    {
      id: "akuntansi-overview",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Calculator className="h-8 w-8" />
            Modul Akuntansi
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">Sistem akuntansi terintegrasi dengan double-entry bookkeeping.</p>
              <div className="space-y-3">
                <h4 className="font-semibold">Fitur Akuntansi:</h4>
                {["Chart of Accounts (COA)", "Jurnal Umum", "Buku Besar", "Neraca Saldo", "Laporan Laba Rugi", "Laporan Neraca", "Laporan Arus Kas", "Jurnal otomatis dari Billing & Payroll"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3">Ringkasan Keuangan:</h4>
              <div className="space-y-2">
                <div className="p-2 bg-card rounded border">
                  <p className="text-xs text-muted-foreground">Pendapatan Bulan Ini</p>
                  <p className="text-xl font-bold text-green-600">Rp 2.5 M</p>
                </div>
                <div className="p-2 bg-card rounded border">
                  <p className="text-xs text-muted-foreground">Beban Operasional</p>
                  <p className="text-xl font-bold text-red-600">Rp 1.8 M</p>
                </div>
                <div className="p-2 bg-primary/10 rounded border">
                  <p className="text-xs text-muted-foreground">Laba Bersih</p>
                  <p className="text-xl font-bold text-primary">Rp 700 jt</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    {
      id: "akuntansi-jurnal",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <FileText className="h-8 w-8" />
            Jurnal Umum
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              {[
                { step: 1, title: "Buat Jurnal Baru", desc: "Menu Akuntansi > Jurnal > Tambah Jurnal." },
                { step: 2, title: "Input Tanggal & Keterangan", desc: "Tentukan tanggal transaksi dan deskripsi." },
                { step: 3, title: "Pilih Akun Debit", desc: "Pilih akun yang akan di-debit, input nominal." },
                { step: 4, title: "Pilih Akun Kredit", desc: "Pilih akun yang akan di-kredit, pastikan balance." },
                { step: 5, title: "Simpan", desc: "Review dan simpan jurnal." },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 p-3 bg-muted rounded-lg">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">{item.step}</div>
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3">Contoh Jurnal:</h4>
              <div className="bg-card p-3 rounded border text-sm">
                <p className="font-medium mb-2">Penerimaan Pembayaran Pasien</p>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1">Akun</th>
                      <th className="text-right py-1">Debit</th>
                      <th className="text-right py-1">Kredit</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-1">Kas</td>
                      <td className="text-right">500.000</td>
                      <td className="text-right">-</td>
                    </tr>
                    <tr>
                      <td className="py-1">Pendapatan Jasa</td>
                      <td className="text-right">-</td>
                      <td className="text-right">500.000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    {
      id: "akuntansi-laporan",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <PieChart className="h-8 w-8" />
            Laporan Keuangan
          </h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <FileBarChart className="h-5 w-5 text-primary" />
                Neraca
              </h4>
              <ul className="text-sm space-y-1">
                <li>• Posisi Aset</li>
                <li>• Posisi Liabilitas</li>
                <li>• Posisi Ekuitas</li>
                <li>• Per tanggal tertentu</li>
              </ul>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Laba Rugi
              </h4>
              <ul className="text-sm space-y-1">
                <li>• Pendapatan</li>
                <li>• Beban Operasional</li>
                <li>• Laba Kotor/Bersih</li>
                <li>• Periode tertentu</li>
              </ul>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Arus Kas
              </h4>
              <ul className="text-sm space-y-1">
                <li>• Operasional</li>
                <li>• Investasi</li>
                <li>• Pendanaan</li>
                <li>• Saldo Akhir</li>
              </ul>
            </div>
          </div>
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Tips:</strong> Semua laporan dapat di-export ke PDF dan Excel untuk keperluan audit.
            </p>
          </div>
        </div>
      ),
    },

    // Laporan
    {
      id: "laporan-overview",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <BarChart3 className="h-8 w-8" />
            Modul Laporan
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">Berbagai laporan operasional dan manajerial.</p>
              <div className="space-y-3">
                <h4 className="font-semibold">Kategori Laporan:</h4>
                {["Laporan Kunjungan", "Laporan Pendapatan", "Laporan Pelayanan", "Laporan Farmasi", "Laporan SDM", "Laporan Inventory", "Laporan Indikator Mutu", "Dashboard Eksekutif"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <FileBarChart className="h-4 w-4 text-primary" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3">Format Export:</h4>
              <div className="grid grid-cols-2 gap-2">
                {["PDF", "Excel", "CSV", "Print"].map((format, i) => (
                  <div key={i} className="p-2 bg-card rounded border text-center">
                    <span className="text-sm font-medium">{format}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
    },

    {
      id: "laporan-generate",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Printer className="h-8 w-8" />
            Generate Laporan
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              {[
                { step: 1, title: "Pilih Jenis Laporan", desc: "Pilih kategori dan jenis laporan yang dibutuhkan." },
                { step: 2, title: "Tentukan Periode", desc: "Pilih rentang tanggal atau periode laporan." },
                { step: 3, title: "Filter (Opsional)", desc: "Filter berdasarkan unit, dokter, jaminan, dll." },
                { step: 4, title: "Generate", desc: "Klik 'Generate' dan tunggu proses selesai." },
                { step: 5, title: "Review & Export", desc: "Lihat preview, lalu export sesuai format." },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 p-3 bg-muted rounded-lg">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">{item.step}</div>
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800">Jadwal Laporan Otomatis:</h4>
              <p className="text-sm text-blue-700 mt-2">Anda dapat mengatur laporan tertentu untuk di-generate dan dikirim via email secara otomatis (harian/mingguan/bulanan).</p>
            </div>
          </div>
        </div>
      ),
    },

    // Master Data
    {
      id: "master-data-overview",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Database className="h-8 w-8" />
            Master Data
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">Kelola data referensi sistem.</p>
              <div className="space-y-3">
                <h4 className="font-semibold">Data Master:</h4>
                {["Data Dokter", "Data Ruangan/Kamar", "Tarif Layanan", "Katalog Obat", "Katalog Tindakan (ICD-9)", "Katalog Diagnosis (ICD-10)", "Data Supplier", "Data Asuransi Rekanan"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-semibold text-amber-800">Perhatian:</h4>
              <p className="text-sm text-amber-700 mt-2">Perubahan data master berdampak luas ke sistem. Pastikan Anda memiliki hak akses dan melakukan perubahan dengan hati-hati.</p>
            </div>
          </div>
        </div>
      ),
    },

    {
      id: "master-data-tarif",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Receipt className="h-8 w-8" />
            Manajemen Tarif
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              {[
                { step: 1, title: "Buka Master Tarif", desc: "Menu Master Data > Tarif Layanan." },
                { step: 2, title: "Cari/Tambah Tarif", desc: "Cari tarif existing atau klik Tambah." },
                { step: 3, title: "Input Detail", desc: "Nama layanan, kategori, tarif per kelas." },
                { step: 4, title: "Komponen Tarif", desc: "Tentukan jasa dokter, RS, BHP." },
                { step: 5, title: "Simpan", desc: "Simpan dan tarif siap digunakan." },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 p-3 bg-muted rounded-lg">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">{item.step}</div>
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3">Contoh Tarif:</h4>
              <div className="space-y-2 text-sm">
                {[
                  { item: "Konsultasi Dokter Umum", kelas3: "75.000", kelas2: "100.000", kelas1: "150.000" },
                  { item: "Konsultasi Sp.PD", kelas3: "150.000", kelas2: "200.000", kelas1: "300.000" },
                ].map((row, i) => (
                  <div key={i} className="p-2 bg-card rounded border">
                    <p className="font-medium">{row.item}</p>
                    <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                      <span>III: Rp {row.kelas3}</span>
                      <span>II: Rp {row.kelas2}</span>
                      <span>I: Rp {row.kelas1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // User Management
    {
      id: "user-management-overview",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Users className="h-8 w-8" />
            Manajemen User
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">Kelola akun pengguna dan hak akses sistem.</p>
              <div className="space-y-3">
                <h4 className="font-semibold">Fitur:</h4>
                {["Tambah/Edit/Hapus User", "Assign Role", "Reset Password", "Aktivasi/Nonaktifkan", "Log Aktivitas User", "Hak Akses per Menu"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3">Statistik User:</h4>
              <div className="space-y-2">
                <div className="flex justify-between p-2 bg-card rounded border">
                  <span className="text-sm">Total User</span>
                  <Badge>156</Badge>
                </div>
                <div className="flex justify-between p-2 bg-card rounded border">
                  <span className="text-sm">User Aktif</span>
                  <Badge className="bg-green-500">148</Badge>
                </div>
                <div className="flex justify-between p-2 bg-card rounded border">
                  <span className="text-sm">User Nonaktif</span>
                  <Badge variant="secondary">8</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    {
      id: "user-management-create",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <UserPlus className="h-8 w-8" />
            Membuat User Baru
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              {[
                { step: 1, title: "Klik Tambah User", desc: "Menu Manajemen User > Tambah User." },
                { step: 2, title: "Input Data User", desc: "Nama, email, username, password awal." },
                { step: 3, title: "Pilih Role", desc: "Pilih role sesuai fungsi kerja." },
                { step: 4, title: "Atur Hak Akses", desc: "Tentukan menu yang dapat diakses." },
                { step: 5, title: "Simpan", desc: "User siap digunakan untuk login." },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 p-3 bg-muted rounded-lg">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">{item.step}</div>
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800">Tips Keamanan:</h4>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• Gunakan password minimal 8 karakter</li>
                <li>• Kombinasi huruf, angka, simbol</li>
                <li>• Wajibkan ganti password saat login pertama</li>
                <li>• Nonaktifkan user yang sudah tidak bekerja</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },

    // Pengaturan
    {
      id: "pengaturan-overview",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Settings className="h-8 w-8" />
            Pengaturan Sistem
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">Konfigurasi sistem dan integrasi.</p>
              <div className="space-y-3">
                <h4 className="font-semibold">Pengaturan Tersedia:</h4>
                {["Profil Rumah Sakit", "Integrasi BPJS", "Integrasi SATU SEHAT", "Konfigurasi Email", "Konfigurasi Printer", "Konfigurasi Modul", "Backup & Restore"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Cog className="h-4 w-4 text-primary" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-semibold text-amber-800">Perhatian:</h4>
              <p className="text-sm text-amber-700 mt-2">Hanya administrator yang dapat mengakses menu pengaturan. Perubahan konfigurasi dapat berdampak ke seluruh sistem.</p>
            </div>
          </div>
        </div>
      ),
    },

    {
      id: "pengaturan-integrasi",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Cog className="h-8 w-8" />
            Konfigurasi Integrasi
          </h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                BPJS
              </h4>
              <ul className="text-sm space-y-1">
                <li>• Cons ID</li>
                <li>• Secret Key</li>
                <li>• User Key</li>
                <li>• Kode PPK</li>
              </ul>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                SATU SEHAT
              </h4>
              <ul className="text-sm space-y-1">
                <li>• Organization ID</li>
                <li>• Client ID</li>
                <li>• Client Secret</li>
                <li>• Environment</li>
              </ul>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Notifikasi
              </h4>
              <ul className="text-sm space-y-1">
                <li>• SMTP Email</li>
                <li>• WhatsApp API</li>
                <li>• SMS Gateway</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },

    // Portal Pasien
    {
      id: "portal-pasien-overview",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Smartphone className="h-8 w-8" />
            Portal Pasien
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">Layanan mandiri untuk pasien via web/mobile.</p>
              <div className="space-y-3">
                <h4 className="font-semibold">Fitur Portal:</h4>
                {["Lihat hasil lab", "Lihat rekam medis", "Lihat resep & riwayat obat", "Booking jadwal dokter", "Lihat tagihan", "Update profil", "QR Code untuk check-in"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3">Cara Registrasi:</h4>
              {["Buka portal.simrszen.id", "Klik 'Daftar'", "Input NIK dan data pribadi", "Verifikasi email/WA", "Login dengan NIK + password"].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm mb-2">
                  <div className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">{i + 1}</div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },

    {
      id: "portal-pasien-usage",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Smartphone className="h-8 w-8" />
            Penggunaan Portal Pasien
          </h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3">Lihat Hasil Lab</h4>
              <ul className="text-sm space-y-1">
                <li>• Login ke portal</li>
                <li>• Menu 'Hasil Lab'</li>
                <li>• Pilih tanggal</li>
                <li>• Download PDF</li>
              </ul>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3">Booking Online</h4>
              <ul className="text-sm space-y-1">
                <li>• Menu 'Booking'</li>
                <li>• Pilih dokter/poli</li>
                <li>• Pilih tanggal & jam</li>
                <li>• Konfirmasi</li>
              </ul>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3">QR Check-in</h4>
              <ul className="text-sm space-y-1">
                <li>• Buka menu 'QR Code'</li>
                <li>• Tunjukkan ke loket</li>
                <li>• Langsung terdata</li>
                <li>• Lebih cepat!</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },

    // Mutu
    {
      id: "mutu-overview",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Award className="h-8 w-8" />
            Manajemen Mutu
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">Modul untuk mendukung akreditasi dan peningkatan mutu.</p>
              <div className="space-y-3">
                <h4 className="font-semibold">Komponen Mutu:</h4>
                {["Tracker Akreditasi SNARS", "Indikator Mutu SISMADAK", "Pelaporan Insiden Keselamatan", "Informed Consent Digital", "INA-CBG Grouper", "Audit Klinis"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3">Skor Akreditasi:</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Kelengkapan Dokumen</span>
                  <Badge className="bg-green-500">85%</Badge>
                </div>
                <Progress value={85} className="h-2" />
                <div className="flex justify-between items-center mt-3">
                  <span className="text-sm">Kepatuhan SOP</span>
                  <Badge className="bg-yellow-500">72%</Badge>
                </div>
                <Progress value={72} className="h-2" />
              </div>
            </div>
          </div>
        </div>
      ),
    },

    {
      id: "mutu-indikator",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <TrendingUp className="h-8 w-8" />
            Indikator Mutu
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="font-semibold">Indikator Nasional:</h4>
              {[
                { name: "Kepatuhan Identifikasi Pasien", target: "100%", actual: "98%" },
                { name: "Waktu Tanggap IGD", target: "≤5 menit", actual: "4.2 menit" },
                { name: "Kepatuhan Cuci Tangan", target: "≥85%", actual: "89%" },
                { name: "Kepatuhan Penggunaan Formularium", target: "≥80%", actual: "82%" },
              ].map((item, i) => (
                <div key={i} className="p-3 bg-muted rounded-lg">
                  <p className="font-medium text-sm">{item.name}</p>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Target: {item.target}</span>
                    <span className="text-green-600 font-bold">Aktual: {item.actual}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800">Input Indikator:</h4>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>1. Buka Menu Mutu &gt; Indikator</li>
                <li>2. Pilih periode pelaporan</li>
                <li>3. Input data numerator/denominator</li>
                <li>4. Sistem hitung persentase</li>
                <li>5. Submit untuk review</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },

    {
      id: "mutu-insiden",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8" />
            Pelaporan Insiden Keselamatan
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              {[
                { step: 1, title: "Buat Laporan", desc: "Menu Mutu > Insiden > Lapor Insiden Baru." },
                { step: 2, title: "Isi Detail", desc: "Tanggal, lokasi, jenis insiden, kronologi." },
                { step: 3, title: "Grading", desc: "Sistem tentukan grading (biru/hijau/kuning/merah)." },
                { step: 4, title: "Investigasi", desc: "Tim mutu melakukan investigasi (RCA jika perlu)." },
                { step: 5, title: "Tindak Lanjut", desc: "Tentukan CAPA (Corrective & Preventive Action)." },
                { step: 6, title: "Monitoring", desc: "Pantau implementasi dan efektivitas." },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 p-3 bg-muted rounded-lg">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">{item.step}</div>
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3">Grading Insiden:</h4>
              <div className="space-y-2">
                {[
                  { color: "bg-blue-500", grade: "Biru", desc: "KNC (Kondisi berpotensi cidera)" },
                  { color: "bg-green-500", grade: "Hijau", desc: "KTC (Tidak cidera)" },
                  { color: "bg-yellow-500", grade: "Kuning", desc: "KPC (Cidera ringan)" },
                  { color: "bg-red-500", grade: "Merah", desc: "Sentinel (Cidera berat/kematian)" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 border rounded">
                    <Badge className={item.color}>{item.grade}</Badge>
                    <span className="text-xs text-muted-foreground">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // Penunjang
    {
      id: "penunjang-overview",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Wrench className="h-8 w-8" />
            Modul Penunjang
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">Manajemen unit penunjang non-medis.</p>
              <div className="space-y-3">
                <h4 className="font-semibold">Unit Penunjang:</h4>
                {["CSSD (Sterilisasi)", "Laundry/Linen", "Pemeliharaan/Maintenance", "Limbah Medis", "Vendor/Outsourcing"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-primary" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3">Fitur per Unit:</h4>
              <ul className="text-sm space-y-2">
                <li>• Jadwal pemeliharaan alat</li>
                <li>• Work order & tracking</li>
                <li>• Jadwal sterilisasi</li>
                <li>• Manifest limbah B3</li>
                <li>• Manajemen kontrak vendor</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },

    {
      id: "penunjang-maintenance",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Wrench className="h-8 w-8" />
            Pemeliharaan & Kalibrasi
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              {[
                { step: 1, title: "Daftar Alat", desc: "Lihat daftar alat kesehatan yang harus dikalibrasi." },
                { step: 2, title: "Jadwal Kalibrasi", desc: "Lihat jadwal kalibrasi per alat." },
                { step: 3, title: "Buat Work Order", desc: "Buat WO untuk pelaksanaan kalibrasi." },
                { step: 4, title: "Eksekusi", desc: "Teknisi melakukan kalibrasi, input hasil." },
                { step: 5, title: "Upload Sertifikat", desc: "Upload sertifikat kalibrasi dari vendor." },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 p-3 bg-muted rounded-lg">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">{item.step}</div>
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-semibold text-amber-800">Alert Kalibrasi:</h4>
              <p className="text-sm text-amber-700 mt-2">Sistem akan memberikan notifikasi 30 hari sebelum jadwal kalibrasi alat berakhir.</p>
            </div>
          </div>
        </div>
      ),
    },

    // Pendidikan
    {
      id: "pendidikan-overview",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <GraduationCap className="h-8 w-8" />
            Modul Pendidikan
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">Untuk RS Pendidikan: kelola trainee, rotasi, dan riset.</p>
              <div className="space-y-3">
                <h4 className="font-semibold">Fitur:</h4>
                {["Data trainee (Koas, PPDS, Internsip)", "Jadwal rotasi klinis", "Evaluasi kompetensi", "Log tindakan", "Proyek penelitian", "Kegiatan akademis/CME"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3">Trainee Aktif:</h4>
              <div className="space-y-2">
                {[
                  { program: "Koas", count: 45 },
                  { program: "PPDS", count: 28 },
                  { program: "Internsip", count: 12 },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between p-2 bg-card rounded border">
                    <span className="text-sm">{item.program}</span>
                    <Badge>{item.count} orang</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
    },

    {
      id: "pendidikan-rotasi",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Calendar className="h-8 w-8" />
            Manajemen Rotasi Klinis
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              {[
                { step: 1, title: "Buat Jadwal Rotasi", desc: "Tentukan trainee, stase, tanggal mulai & selesai." },
                { step: 2, title: "Assign Supervisor", desc: "Tentukan dokter pembimbing per stase." },
                { step: 3, title: "Aktifkan Rotasi", desc: "Trainee mulai rotasi di departemen tujuan." },
                { step: 4, title: "Log Aktivitas", desc: "Trainee mencatat tindakan yang dilakukan." },
                { step: 5, title: "Evaluasi", desc: "Supervisor melakukan evaluasi di akhir rotasi." },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 p-3 bg-muted rounded-lg">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">{item.step}</div>
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3">Contoh Jadwal Rotasi:</h4>
              <div className="space-y-2 text-sm">
                {[
                  { dept: "Penyakit Dalam", period: "1 Jan - 28 Feb" },
                  { dept: "Bedah", period: "1 Mar - 30 Apr" },
                  { dept: "Anak", period: "1 Mei - 30 Jun" },
                ].map((item, i) => (
                  <div key={i} className="p-2 bg-card rounded border">
                    <p className="font-medium">{item.dept}</p>
                    <p className="text-xs text-muted-foreground">{item.period}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // Kemenkes
    {
      id: "kemenkes-overview",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <FileBarChart className="h-8 w-8" />
            Laporan Kemenkes (RL)
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg text-foreground">Generate laporan wajib untuk Kemenkes RI.</p>
              <div className="space-y-3">
                <h4 className="font-semibold">Laporan RL:</h4>
                {[
                  "RL 1 - Data Dasar RS",
                  "RL 2 - Ketenagaan",
                  "RL 3 - Pelayanan (BOR, ALOS, TOI, BTO)",
                  "RL 4 - Morbiditas/Mortalitas",
                  "RL 5 - Kunjungan",
                  "RL 6 - Khusus",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <FileBarChart className="h-4 w-4 text-primary" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3">Indikator Kinerja RS:</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: "BOR", value: "78%", desc: "Bed Occupancy Rate" },
                  { name: "ALOS", value: "4.2 hari", desc: "Avg Length of Stay" },
                  { name: "TOI", value: "1.5 hari", desc: "Turn Over Interval" },
                  { name: "BTO", value: "45x", desc: "Bed Turn Over" },
                ].map((item, i) => (
                  <div key={i} className="p-2 bg-card rounded border text-center">
                    <p className="text-xl font-bold text-primary">{item.value}</p>
                    <p className="text-xs font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
    },

    {
      id: "kemenkes-generate",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <Download className="h-8 w-8" />
            Generate Laporan RL
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              {[
                { step: 1, title: "Pilih Jenis RL", desc: "Menu Laporan Kemenkes > Pilih jenis RL." },
                { step: 2, title: "Tentukan Periode", desc: "Pilih bulan/triwulan/tahun pelaporan." },
                { step: 3, title: "Generate", desc: "Sistem akan mengkalkulasi dari data operasional." },
                { step: 4, title: "Review", desc: "Periksa data dan koreksi jika perlu." },
                { step: 5, title: "Export", desc: "Export ke format Excel untuk upload ke SIRS Online." },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 p-3 bg-muted rounded-lg">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">{item.step}</div>
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800">Deadline Pelaporan:</h4>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• RL Bulanan: Tanggal 10 bulan berikutnya</li>
                <li>• RL Triwulanan: Tanggal 15 bulan pertama triwulan berikutnya</li>
                <li>• RL Tahunan: Tanggal 31 Januari tahun berikutnya</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },

    // FAQ
    {
      id: "faq-1",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <HelpCircle className="h-8 w-8" />
            FAQ - Pertanyaan Umum
          </h2>
          <div className="space-y-4">
            {[
              { q: "Bagaimana jika lupa password?", a: "Klik 'Lupa Password' di halaman login, masukkan email, lalu cek email untuk link reset password." },
              { q: "Bagaimana cara menambah user baru?", a: "Hanya admin yang bisa menambah user. Menu Manajemen User > Tambah User." },
              { q: "Apakah data pasien aman?", a: "Ya, sistem menggunakan enkripsi dan role-based access control untuk melindungi data." },
              { q: "Bagaimana jika sistem error?", a: "Refresh halaman. Jika masih error, hubungi IT helpdesk dengan screenshot error." },
              { q: "Apakah bisa akses dari HP?", a: "Ya, sistem responsive dan dapat diakses dari browser HP. Untuk pengalaman terbaik, gunakan laptop/PC." },
            ].map((item, i) => (
              <div key={i} className="p-4 bg-muted rounded-lg">
                <p className="font-semibold flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  {item.q}
                </p>
                <p className="text-sm text-muted-foreground mt-2 ml-6">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },

    {
      id: "faq-2",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <HelpCircle className="h-8 w-8" />
            FAQ - Troubleshooting
          </h2>
          <div className="space-y-4">
            {[
              { q: "Printer tidak mencetak, apa yang harus dilakukan?", a: "Cek koneksi printer, pastikan driver terinstall, cek antrian print di komputer. Jika masih gagal, hubungi IT." },
              { q: "Data pasien tidak muncul di pencarian?", a: "Pastikan ejaan nama benar. Coba cari dengan No. RM atau NIK. Data mungkin belum di-input." },
              { q: "Tidak bisa buat SEP BPJS?", a: "Cek koneksi BPJS di Pengaturan. Pastikan kepesertaan aktif dan rujukan valid." },
              { q: "Resep tidak terkirim ke farmasi?", a: "Pastikan sudah klik 'Kirim Resep'. Cek antrian di modul Farmasi. Refresh halaman." },
              { q: "Laporan menampilkan data kosong?", a: "Pastikan periode yang dipilih benar. Data mungkin belum di-input untuk periode tersebut." },
            ].map((item, i) => (
              <div key={i} className="p-4 bg-muted rounded-lg">
                <p className="font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  {item.q}
                </p>
                <p className="text-sm text-muted-foreground mt-2 ml-6">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },

    {
      id: "faq-3",
      content: (
        <div className="px-12 py-8">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
            <LifeBuoy className="h-8 w-8" />
            Kontak Bantuan
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold flex items-center gap-2">
                  <Headphones className="h-5 w-5 text-primary" />
                  IT Helpdesk
                </h4>
                <ul className="text-sm space-y-2 mt-3">
                  <li>📞 Ext. 1234 (Internal)</li>
                  <li>📱 0812-3456-7890 (WhatsApp)</li>
                  <li>📧 it.helpdesk@rs.co.id</li>
                  <li>⏰ Senin-Jumat: 08.00-17.00</li>
                </ul>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Vendor Support
                </h4>
                <ul className="text-sm space-y-2 mt-3">
                  <li>📞 (021) 1234-5678</li>
                  <li>📧 support@simrszen.id</li>
                  <li>🌐 help.simrszen.id</li>
                </ul>
              </div>
            </div>
            <div className="p-4 bg-primary/5 rounded-lg flex flex-col items-center justify-center text-center">
              <img src={zenLogo} alt="SIMRS ZEN" className="h-20 mb-4" />
              <h3 className="text-xl font-bold text-primary">SIMRS ZEN</h3>
              <p className="text-muted-foreground">Sistem Informasi Manajemen Rumah Sakit Terintegrasi</p>
              <p className="text-sm text-muted-foreground mt-4">© 2025 - Semua Hak Dilindungi</p>
            </div>
          </div>
        </div>
      ),
    },
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

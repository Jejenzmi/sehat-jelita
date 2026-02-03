import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  Play, 
  Pause, 
  Maximize2, 
  Minimize2,
  Menu,
  X
} from "lucide-react";
import zenLogo from "@/assets/zen-logo.webp";

interface Slide {
  id: number;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  background?: string;
}

const slides: Slide[] = [
  {
    id: 1,
    title: "ZEN⁺ SIMRS",
    subtitle: "Sistem Informasi Manajemen Rumah Sakit Terintegrasi",
    background: "from-primary via-primary/90 to-primary/80",
    content: (
      <div className="flex flex-col items-center justify-center h-full text-white">
        <img src={zenLogo} alt="ZEN+ Logo" className="h-32 w-32 mb-8 animate-pulse" />
        <h1 className="text-5xl md:text-7xl font-bold mb-4 text-center">ZEN⁺ SIMRS</h1>
        <p className="text-xl md:text-2xl opacity-90 text-center max-w-2xl">
          Sistem Informasi Manajemen Rumah Sakit Modern, Terintegrasi & Cloud-Based
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <span className="px-4 py-2 bg-white/20 rounded-full text-sm">✓ SATU SEHAT Ready</span>
          <span className="px-4 py-2 bg-white/20 rounded-full text-sm">✓ BPJS Integrated</span>
          <span className="px-4 py-2 bg-white/20 rounded-full text-sm">✓ 100% Cloud</span>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    title: "Mengapa ZEN⁺?",
    background: "from-slate-900 to-slate-800",
    content: (
      <div className="text-white p-8 md:p-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">Mengapa Memilih ZEN⁺?</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            { icon: "🚀", title: "Modern & Cepat", desc: "Berbasis cloud dengan performa tinggi, akses dari mana saja" },
            { icon: "🔗", title: "Terintegrasi", desc: "Terhubung langsung dengan SATU SEHAT, BPJS, dan sistem eksternal" },
            { icon: "🔒", title: "Aman & Patuh", desc: "Keamanan data tingkat enterprise, compliance regulasi Kemenkes" },
            { icon: "📊", title: "Real-time Analytics", desc: "Dashboard eksekutif dan laporan otomatis sesuai standar" },
            { icon: "💰", title: "Efisiensi Biaya", desc: "Tanpa investasi infrastruktur server, bayar sesuai penggunaan" },
            { icon: "🎯", title: "User Friendly", desc: "Antarmuka intuitif, minimal training untuk staf RS" },
          ].map((item, idx) => (
            <div key={idx} className="bg-white/10 rounded-xl p-6 backdrop-blur">
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-white/80">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 3,
    title: "Modul Lengkap",
    background: "from-blue-600 to-indigo-700",
    content: (
      <div className="text-white p-8 md:p-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-8 text-center">Modul Lengkap & Terintegrasi</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {[
            "Pendaftaran & Antrian",
            "Rawat Jalan",
            "Rawat Inap",
            "IGD",
            "Farmasi",
            "Laboratorium",
            "Radiologi",
            "Kamar Operasi",
            "ICU/NICU",
            "Hemodialisa",
            "Bank Darah",
            "Gizi & Nutrisi",
            "Rehabilitasi Medik",
            "MCU",
            "Forensik",
            "Rekam Medis",
            "Billing & Kasir",
            "Inventori",
            "SDM & Payroll",
            "Akuntansi",
            "BPJS Integration",
            "SATU SEHAT",
            "Telemedicine",
            "Laporan Kemenkes",
          ].map((modul, idx) => (
            <div key={idx} className="bg-white/20 rounded-lg p-3 text-center text-sm backdrop-blur">
              ✓ {modul}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 4,
    title: "Integrasi SATU SEHAT",
    background: "from-green-600 to-emerald-700",
    content: (
      <div className="text-white p-8 md:p-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-8 text-center">Integrasi SATU SEHAT</h2>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 rounded-2xl p-8 backdrop-blur mb-8">
            <p className="text-xl mb-6 text-center">
              ZEN⁺ telah terintegrasi penuh dengan platform SATU SEHAT Kemenkes RI
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                "Patient (Data Pasien)",
                "Encounter (Kunjungan)",
                "Condition (Diagnosis)",
                "Observation (Vital Signs)",
                "Medication (Obat)",
                "Procedure (Tindakan)",
                "Practitioner (Tenaga Medis)",
                "Organization (Faskes)",
              ].map((resource, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-400 flex items-center justify-center">✓</div>
                  <span>{resource}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-center text-white/80">
            Sinkronisasi otomatis, validasi data, dan monitoring status pengiriman
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 5,
    title: "Integrasi BPJS",
    background: "from-teal-600 to-cyan-700",
    content: (
      <div className="text-white p-8 md:p-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-8 text-center">Integrasi BPJS Kesehatan</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div className="bg-white/10 rounded-2xl p-6 backdrop-blur">
            <h3 className="text-2xl font-semibold mb-4">🏥 VClaim</h3>
            <ul className="space-y-2 text-white/90">
              <li>• Cek kepesertaan pasien BPJS</li>
              <li>• Generate SEP otomatis</li>
              <li>• Update & monitoring claim</li>
              <li>• Sinkronisasi data pasien</li>
            </ul>
          </div>
          <div className="bg-white/10 rounded-2xl p-6 backdrop-blur">
            <h3 className="text-2xl font-semibold mb-4">📋 E-Claim (INA-CBG)</h3>
            <ul className="space-y-2 text-white/90">
              <li>• Grouper INA-CBG otomatis</li>
              <li>• Pengajuan klaim digital</li>
              <li>• Tracking status verifikasi</li>
              <li>• Analisis potensi dispute</li>
            </ul>
          </div>
          <div className="bg-white/10 rounded-2xl p-6 backdrop-blur">
            <h3 className="text-2xl font-semibold mb-4">🚑 Antrean Online</h3>
            <ul className="space-y-2 text-white/90">
              <li>• Integrasi JKN Mobile</li>
              <li>• Push notifikasi jadwal</li>
              <li>• Reschedule otomatis</li>
            </ul>
          </div>
          <div className="bg-white/10 rounded-2xl p-6 backdrop-blur">
            <h3 className="text-2xl font-semibold mb-4">📊 Aplicares</h3>
            <ul className="space-y-2 text-white/90">
              <li>• Monitoring tempat tidur</li>
              <li>• Update realtime</li>
              <li>• Sinkronisasi otomatis</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 6,
    title: "Arsitektur Cloud",
    background: "from-purple-600 to-violet-700",
    content: (
      <div className="text-white p-8 md:p-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-8 text-center">Arsitektur Cloud Modern</h2>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 rounded-2xl p-8 backdrop-blur">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-5xl mb-4">☁️</div>
                <h3 className="text-xl font-semibold mb-2">Cloud Native</h3>
                <p className="text-white/80">Infrastruktur terkelola, auto-scaling, high availability</p>
              </div>
              <div>
                <div className="text-5xl mb-4">🔐</div>
                <h3 className="text-xl font-semibold mb-2">Security First</h3>
                <p className="text-white/80">Enkripsi end-to-end, role-based access, audit trail</p>
              </div>
              <div>
                <div className="text-5xl mb-4">⚡</div>
                <h3 className="text-xl font-semibold mb-2">Real-time Sync</h3>
                <p className="text-white/80">Data tersinkronisasi antar unit dalam hitungan detik</p>
              </div>
            </div>
          </div>
          <div className="mt-8 text-center">
            <p className="text-xl">99.9% Uptime Guarantee • Backup Otomatis • Disaster Recovery</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 7,
    title: "Migrasi Mudah",
    background: "from-orange-500 to-amber-600",
    content: (
      <div className="text-white p-8 md:p-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-8 text-center">Proses Migrasi yang Mudah</h2>
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {[
              { step: 1, title: "Assessment", desc: "Audit sistem existing, pemetaan data & gap analysis" },
              { step: 2, title: "Persiapan", desc: "Setup environment, konfigurasi master data, API bridging" },
              { step: 3, title: "Migrasi Data", desc: "Export, cleansing, transform & import data legacy" },
              { step: 4, title: "Parallel Run", desc: "Operasional paralel, UAT, training pengguna" },
              { step: 5, title: "Go-Live", desc: "Cutover, hypercare support, monitoring performa" },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-6 mb-6">
                <div className="h-12 w-12 rounded-full bg-white text-orange-600 flex items-center justify-center font-bold text-xl shrink-0">
                  {item.step}
                </div>
                <div className="bg-white/10 rounded-xl p-4 flex-1 backdrop-blur">
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="text-white/80">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 8,
    title: "Dashboard & Analytics",
    background: "from-rose-600 to-pink-700",
    content: (
      <div className="text-white p-8 md:p-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-8 text-center">Dashboard & Analytics</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div className="bg-white/10 rounded-2xl p-6 backdrop-blur">
            <h3 className="text-2xl font-semibold mb-4">📊 Executive Dashboard</h3>
            <ul className="space-y-2 text-white/90">
              <li>• KPI rumah sakit real-time</li>
              <li>• Trend kunjungan & pendapatan</li>
              <li>• Okupansi tempat tidur</li>
              <li>• Performa unit layanan</li>
            </ul>
          </div>
          <div className="bg-white/10 rounded-2xl p-6 backdrop-blur">
            <h3 className="text-2xl font-semibold mb-4">📈 Laporan Otomatis</h3>
            <ul className="space-y-2 text-white/90">
              <li>• RL 1-5 Kemenkes</li>
              <li>• Laporan keuangan</li>
              <li>• Statistik pelayanan</li>
              <li>• Export PDF/Excel</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 9,
    title: "Testimoni",
    background: "from-indigo-600 to-blue-700",
    content: (
      <div className="text-white p-8 md:p-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">Dipercaya Rumah Sakit</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white/10 rounded-2xl p-6 backdrop-blur">
            <p className="text-lg mb-4 italic">
              "Implementasi ZEN⁺ sangat smooth, tim support responsif. Integrasi BPJS berjalan lancar tanpa kendala berarti."
            </p>
            <p className="font-semibold">— Dr. Ahmad, Direktur RS</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-6 backdrop-blur">
            <p className="text-lg mb-4 italic">
              "Dashboard eksekutif sangat membantu monitoring performa RS. Data akurat dan real-time."
            </p>
            <p className="font-semibold">— Ibu Sari, Kepala Keuangan</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 10,
    title: "Terima Kasih",
    background: "from-primary via-primary/90 to-primary/80",
    content: (
      <div className="flex flex-col items-center justify-center h-full text-white">
        <img src={zenLogo} alt="ZEN+ Logo" className="h-24 w-24 mb-6" />
        <h1 className="text-4xl md:text-6xl font-bold mb-4 text-center">Terima Kasih</h1>
        <p className="text-xl md:text-2xl opacity-90 text-center max-w-2xl mb-8">
          Siap bertransformasi digital bersama ZEN⁺ SIMRS?
        </p>
        <div className="space-y-4 text-center">
          <p className="text-lg">📧 info@zenplus.id</p>
          <p className="text-lg">📞 0812-3456-7890</p>
          <p className="text-lg">🌐 www.zenplus.id</p>
        </div>
      </div>
    ),
  },
];

export default function Presentasi() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNav, setShowNav] = useState(false);

  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < slides.length) {
      setCurrentSlide(index);
    }
  }, []);

  const nextSlide = useCallback(() => {
    goToSlide(currentSlide + 1);
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentSlide - 1);
  }, [currentSlide, goToSlide]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        nextSlide();
      } else if (e.key === "ArrowLeft") {
        prevSlide();
      } else if (e.key === "Escape") {
        setShowNav(false);
      } else if (e.key === "f") {
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide, toggleFullscreen]);

  // Auto-play
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (currentSlide < slides.length - 1) {
        nextSlide();
      } else {
        setIsPlaying(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, currentSlide, nextSlide]);

  const slide = slides[currentSlide];
  const progress = ((currentSlide + 1) / slides.length) * 100;

  return (
    <div className={`relative h-screen w-screen overflow-hidden bg-gradient-to-br ${slide.background}`}>
      {/* Slide Content */}
      <div className="h-full w-full">
        {slide.content}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0">
        <Progress value={progress} className="h-1 rounded-none bg-white/20" />
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={prevSlide}
          disabled={currentSlide === 0}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        
        <span className="text-white font-medium px-4">
          {currentSlide + 1} / {slides.length}
        </span>

        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={nextSlide}
          disabled={currentSlide === slides.length - 1}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      {/* Top Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={() => setShowNav(!showNav)}
        >
          {showNav ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={() => window.location.href = "/"}
        >
          <Home className="h-5 w-5" />
        </Button>
      </div>

      {/* Slide Navigator */}
      {showNav && (
        <div className="absolute right-4 top-16 w-64 bg-black/80 backdrop-blur rounded-lg p-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
          <h3 className="text-white font-semibold mb-3">Navigasi Slide</h3>
          <div className="space-y-2">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                className={`w-full text-left p-2 rounded text-sm transition-colors ${
                  idx === currentSlide
                    ? "bg-primary text-white"
                    : "text-white/80 hover:bg-white/10"
                }`}
                onClick={() => {
                  goToSlide(idx);
                  setShowNav(false);
                }}
              >
                {idx + 1}. {s.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Touch/Click Navigation Areas */}
      <button
        className="absolute left-0 top-0 h-full w-1/4 cursor-pointer opacity-0"
        onClick={prevSlide}
        aria-label="Previous slide"
      />
      <button
        className="absolute right-0 top-0 h-full w-1/4 cursor-pointer opacity-0"
        onClick={nextSlide}
        aria-label="Next slide"
      />
    </div>
  );
}

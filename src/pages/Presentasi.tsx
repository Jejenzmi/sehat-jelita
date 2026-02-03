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
    title: "Cover",
    background: "from-white to-slate-50",
    content: (
      <div className="flex flex-col items-center justify-center h-full px-8">
        <div className="text-center max-w-3xl">
          <div className="flex items-center justify-center gap-4 mb-12">
            <img src={zenLogo} alt="ZEN+ Logo" className="h-16 w-16" />
            <div className="text-left">
              <p className="text-xs text-slate-400 tracking-widest uppercase">PT Zen Multimedia Indonesia</p>
              <h2 className="text-xl font-semibold text-slate-800">ZEN⁺ SIMRS</h2>
            </div>
          </div>
          
          <p className="text-xs text-slate-400 tracking-[0.3em] uppercase mb-4">Proposal Penawaran</p>
          <h1 className="text-3xl md:text-5xl font-light text-slate-900 leading-tight mb-6">
            Sistem Informasi Manajemen<br />Rumah Sakit Terintegrasi
          </h1>
          <div className="w-20 h-px bg-slate-300 mx-auto mb-6" />
          <p className="text-slate-500 text-sm max-w-lg mx-auto leading-relaxed">
            Solusi digital komprehensif untuk transformasi pelayanan kesehatan modern dengan integrasi SATU SEHAT dan BPJS Kesehatan
          </p>
          
          <div className="mt-16 pt-8 border-t border-slate-200">
            <p className="text-xs text-slate-400 mb-2">Diajukan kepada</p>
            <p className="text-lg font-medium text-slate-700">RSUD Dr. Moewardi Surakarta</p>
            <p className="text-sm text-slate-400 mt-4">Februari 2026</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    title: "Daftar Isi",
    background: "from-white to-slate-50",
    content: (
      <div className="h-full px-8 md:px-16 py-12">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs text-slate-400 tracking-[0.2em] uppercase mb-2">Dokumen Proposal</p>
          <h2 className="text-2xl font-light text-slate-900 mb-8">Daftar Isi</h2>
          <div className="w-12 h-px bg-primary mb-10" />
          
          <div className="space-y-4">
            {[
              { num: "01", title: "Tentang ZEN⁺ SIMRS", page: "03" },
              { num: "02", title: "Keunggulan Solusi", page: "04" },
              { num: "03", title: "Modul & Fitur Lengkap", page: "05" },
              { num: "04", title: "Integrasi SATU SEHAT", page: "06" },
              { num: "05", title: "Integrasi BPJS Kesehatan", page: "07" },
              { num: "06", title: "Arsitektur & Keamanan", page: "08" },
              { num: "07", title: "Metodologi Implementasi", page: "09" },
              { num: "08", title: "Referensi Klien", page: "10" },
            ].map((item) => (
              <div key={item.num} className="flex items-center group">
                <span className="text-primary font-medium w-8">{item.num}</span>
                <span className="flex-1 text-slate-700 group-hover:text-slate-900 transition-colors">{item.title}</span>
                <span className="text-slate-300 border-b border-dotted border-slate-200 flex-1 mx-4" />
                <span className="text-slate-400 text-sm">{item.page}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    title: "Tentang ZEN⁺",
    background: "from-white to-slate-50",
    content: (
      <div className="h-full px-8 md:px-16 py-12">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-slate-400 tracking-[0.2em] uppercase mb-2">01 — Pendahuluan</p>
          <h2 className="text-2xl font-light text-slate-900 mb-2">Tentang ZEN⁺ SIMRS</h2>
          <div className="w-12 h-px bg-primary mb-8" />
          
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <p className="text-slate-600 leading-relaxed mb-6">
                <strong className="text-slate-800">ZEN⁺ SIMRS</strong> adalah sistem informasi manajemen rumah sakit generasi terbaru yang dikembangkan oleh PT Zen Multimedia Indonesia dengan pendekatan cloud-native dan user-centric design.
              </p>
              <p className="text-slate-600 leading-relaxed mb-6">
                Dirancang khusus untuk memenuhi kebutuhan rumah sakit di Indonesia dengan kepatuhan penuh terhadap regulasi Kemenkes RI, standar interoperabilitas SATU SEHAT (HL7 FHIR), dan integrasi BPJS Kesehatan.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Dengan pengalaman implementasi di berbagai tipe rumah sakit, ZEN⁺ menawarkan solusi yang scalable, aman, dan mudah diadopsi oleh seluruh tingkatan pengguna.
              </p>
            </div>
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-lg p-5 bg-white">
                <p className="text-3xl font-light text-primary mb-1">100%</p>
                <p className="text-sm text-slate-500">Cloud-Based Architecture</p>
              </div>
              <div className="border border-slate-200 rounded-lg p-5 bg-white">
                <p className="text-3xl font-light text-primary mb-1">24/7</p>
                <p className="text-sm text-slate-500">Technical Support</p>
              </div>
              <div className="border border-slate-200 rounded-lg p-5 bg-white">
                <p className="text-3xl font-light text-primary mb-1">99.9%</p>
                <p className="text-sm text-slate-500">Uptime Guarantee (SLA)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    title: "Keunggulan",
    background: "from-white to-slate-50",
    content: (
      <div className="h-full px-8 md:px-16 py-12">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-slate-400 tracking-[0.2em] uppercase mb-2">02 — Value Proposition</p>
          <h2 className="text-2xl font-light text-slate-900 mb-2">Keunggulan Solusi</h2>
          <div className="w-12 h-px bg-primary mb-8" />
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { 
                icon: "⚡", 
                title: "Performa Tinggi", 
                desc: "Arsitektur modern dengan response time < 200ms, mendukung operasional RS dengan ribuan transaksi harian tanpa lag." 
              },
              { 
                icon: "🔗", 
                title: "Interoperabilitas", 
                desc: "Terintegrasi native dengan SATU SEHAT, BPJS VClaim, E-Claim, Antrean Online, dan sistem eksternal lainnya." 
              },
              { 
                icon: "🔒", 
                title: "Keamanan Enterprise", 
                desc: "Enkripsi end-to-end, role-based access control, audit trail lengkap, dan compliance dengan standar keamanan data kesehatan." 
              },
              { 
                icon: "☁️", 
                title: "Zero Infrastructure", 
                desc: "Tidak perlu investasi server dan infrastruktur IT. Semua dikelola di cloud dengan auto-scaling dan backup otomatis." 
              },
              { 
                icon: "📊", 
                title: "Business Intelligence", 
                desc: "Dashboard eksekutif real-time, analitik prediktif, dan laporan otomatis sesuai standar Kemenkes (RL 1-5)." 
              },
              { 
                icon: "🎯", 
                title: "User Experience", 
                desc: "Antarmuka intuitif yang dirancang untuk efisiensi kerja, minimal training, dan adopsi cepat oleh seluruh staf RS." 
              },
            ].map((item, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-6 bg-white hover:shadow-md transition-shadow">
                <span className="text-2xl mb-4 block">{item.icon}</span>
                <h3 className="font-medium text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 5,
    title: "Modul",
    background: "from-white to-slate-50",
    content: (
      <div className="h-full px-8 md:px-16 py-12 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-slate-400 tracking-[0.2em] uppercase mb-2">03 — Ruang Lingkup</p>
          <h2 className="text-2xl font-light text-slate-900 mb-2">Modul & Fitur Lengkap</h2>
          <div className="w-12 h-px bg-primary mb-8" />
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Pelayanan Klinis</h3>
              <div className="space-y-2">
                {["Pendaftaran & Antrian Cerdas", "Rawat Jalan (Poliklinik)", "Rawat Inap", "Instalasi Gawat Darurat (IGD)", "Kamar Operasi (IBS)", "ICU/NICU/PICU", "Hemodialisa", "Rehabilitasi Medik", "Medical Check Up (MCU)", "Forensik & Kedokteran Kehakiman"].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 py-2 border-b border-slate-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-sm text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Penunjang & Manajemen</h3>
              <div className="space-y-2">
                {["Farmasi & Apotek", "Laboratorium", "Radiologi & Imaging", "Bank Darah (UTDRS)", "Gizi & Nutrisi", "Rekam Medis Elektronik", "Billing & Kasir", "Inventori & Logistik", "SDM & Payroll", "Akuntansi & Keuangan"].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 py-2 border-b border-slate-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-sm text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 6,
    title: "SATU SEHAT",
    background: "from-white to-slate-50",
    content: (
      <div className="h-full px-8 md:px-16 py-12">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-slate-400 tracking-[0.2em] uppercase mb-2">04 — Interoperabilitas</p>
          <h2 className="text-2xl font-light text-slate-900 mb-2">Integrasi SATU SEHAT</h2>
          <div className="w-12 h-px bg-primary mb-8" />
          
          <p className="text-slate-600 leading-relaxed mb-8 max-w-2xl">
            ZEN⁺ telah tersertifikasi dan terintegrasi penuh dengan platform SATU SEHAT Kemenkes RI menggunakan standar HL7 FHIR R4 untuk pertukaran data kesehatan yang aman dan terstandar.
          </p>
          
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {[
              { resource: "Patient", desc: "Data demografis pasien" },
              { resource: "Encounter", desc: "Riwayat kunjungan" },
              { resource: "Condition", desc: "Diagnosis (ICD-10)" },
              { resource: "Observation", desc: "Vital signs & lab" },
              { resource: "Medication", desc: "Resep & pemberian obat" },
              { resource: "Procedure", desc: "Tindakan medis" },
              { resource: "Practitioner", desc: "Data tenaga kesehatan" },
              { resource: "Organization", desc: "Profil fasilitas" },
            ].map((item, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-4 bg-white text-center">
                <p className="font-medium text-slate-900 text-sm mb-1">{item.resource}</p>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
          
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
            <p className="text-sm text-slate-600">
              <strong className="text-slate-800">Fitur:</strong> Sinkronisasi otomatis • Validasi data real-time • Retry mechanism • Dashboard monitoring status pengiriman • Log audit lengkap
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 7,
    title: "BPJS",
    background: "from-white to-slate-50",
    content: (
      <div className="h-full px-8 md:px-16 py-12">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-slate-400 tracking-[0.2em] uppercase mb-2">05 — Integrasi</p>
          <h2 className="text-2xl font-light text-slate-900 mb-2">Integrasi BPJS Kesehatan</h2>
          <div className="w-12 h-px bg-primary mb-8" />
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-slate-200 rounded-lg p-6 bg-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold">V</span>
                </div>
                <h3 className="font-medium text-slate-900">VClaim Service</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Cek kepesertaan & eligibilitas</li>
                <li>• Generate SEP otomatis</li>
                <li>• Data rujukan FKTP</li>
                <li>• Monitoring status klaim</li>
              </ul>
            </div>
            
            <div className="border border-slate-200 rounded-lg p-6 bg-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold">E</span>
                </div>
                <h3 className="font-medium text-slate-900">E-Claim / INA-CBG</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Grouper INA-CBG terintegrasi</li>
                <li>• Pengajuan klaim digital</li>
                <li>• Tracking verifikasi</li>
                <li>• Analisis potensi dispute</li>
              </ul>
            </div>
            
            <div className="border border-slate-200 rounded-lg p-6 bg-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold">A</span>
                </div>
                <h3 className="font-medium text-slate-900">Antrean Online</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Integrasi Mobile JKN</li>
                <li>• Push jadwal & notifikasi</li>
                <li>• Reschedule otomatis</li>
              </ul>
            </div>
            
            <div className="border border-slate-200 rounded-lg p-6 bg-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold">P</span>
                </div>
                <h3 className="font-medium text-slate-900">Aplicares</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Monitoring tempat tidur</li>
                <li>• Update ketersediaan realtime</li>
                <li>• Sinkronisasi otomatis</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 8,
    title: "Arsitektur",
    background: "from-white to-slate-50",
    content: (
      <div className="h-full px-8 md:px-16 py-12">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-slate-400 tracking-[0.2em] uppercase mb-2">06 — Infrastruktur</p>
          <h2 className="text-2xl font-light text-slate-900 mb-2">Arsitektur & Keamanan</h2>
          <div className="w-12 h-px bg-primary mb-8" />
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-6 border border-slate-200 rounded-lg bg-white">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">☁️</span>
              </div>
              <h3 className="font-medium text-slate-900 mb-2">Cloud Native</h3>
              <p className="text-xs text-slate-500">Auto-scaling, load balancing, multi-region deployment</p>
            </div>
            <div className="text-center p-6 border border-slate-200 rounded-lg bg-white">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">🔐</span>
              </div>
              <h3 className="font-medium text-slate-900 mb-2">Security First</h3>
              <p className="text-xs text-slate-500">Enkripsi AES-256, TLS 1.3, SOC 2 compliance</p>
            </div>
            <div className="text-center p-6 border border-slate-200 rounded-lg bg-white">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">🔄</span>
              </div>
              <h3 className="font-medium text-slate-900 mb-2">High Availability</h3>
              <p className="text-xs text-slate-500">99.9% uptime SLA, automated failover, DR ready</p>
            </div>
          </div>
          
          <div className="bg-slate-900 text-white rounded-lg p-6">
            <h4 className="font-medium mb-4">Spesifikasi Teknis</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between border-b border-slate-700 pb-2">
                <span className="text-slate-400">Database</span>
                <span>PostgreSQL 15</span>
              </div>
              <div className="flex justify-between border-b border-slate-700 pb-2">
                <span className="text-slate-400">API</span>
                <span>RESTful + GraphQL</span>
              </div>
              <div className="flex justify-between border-b border-slate-700 pb-2">
                <span className="text-slate-400">Authentication</span>
                <span>OAuth 2.0 + JWT</span>
              </div>
              <div className="flex justify-between border-b border-slate-700 pb-2">
                <span className="text-slate-400">Backup</span>
                <span>Daily + Point-in-time</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 9,
    title: "Implementasi",
    background: "from-white to-slate-50",
    content: (
      <div className="h-full px-8 md:px-16 py-12">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-slate-400 tracking-[0.2em] uppercase mb-2">07 — Metodologi</p>
          <h2 className="text-2xl font-light text-slate-900 mb-2">Tahapan Implementasi</h2>
          <div className="w-12 h-px bg-primary mb-8" />
          
          <div className="space-y-4">
            {[
              { 
                phase: "Phase 1", 
                title: "Assessment & Planning", 
                duration: "2 Minggu",
                items: ["Audit sistem existing", "Gap analysis", "Pemetaan data & proses bisnis", "Project charter & timeline"]
              },
              { 
                phase: "Phase 2", 
                title: "Persiapan & Konfigurasi", 
                duration: "3 Minggu",
                items: ["Setup environment", "Konfigurasi master data", "Integrasi API BPJS & SATU SEHAT", "Customization workflow"]
              },
              { 
                phase: "Phase 3", 
                title: "Migrasi Data", 
                duration: "2 Minggu",
                items: ["Data cleansing & validation", "ETL process", "Parallel verification", "Data integrity check"]
              },
              { 
                phase: "Phase 4", 
                title: "UAT & Training", 
                duration: "2 Minggu",
                items: ["User acceptance testing", "Training end-user", "Documentation", "Bug fixing & refinement"]
              },
              { 
                phase: "Phase 5", 
                title: "Go-Live & Hypercare", 
                duration: "2 Minggu",
                items: ["Cutover weekend", "On-site support", "Performance monitoring", "Knowledge transfer"]
              },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-6 items-start">
                <div className="w-20 shrink-0">
                  <p className="text-xs text-primary font-medium">{item.phase}</p>
                  <p className="text-xs text-slate-400">{item.duration}</p>
                </div>
                <div className="flex-1 border border-slate-200 rounded-lg p-4 bg-white">
                  <h3 className="font-medium text-slate-900 mb-2">{item.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    {item.items.map((i, iIdx) => (
                      <span key={iIdx} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{i}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 10,
    title: "Penutup",
    background: "from-white to-slate-50",
    content: (
      <div className="flex flex-col items-center justify-center h-full px-8">
        <div className="text-center max-w-2xl">
          <img src={zenLogo} alt="ZEN+ Logo" className="h-16 w-16 mx-auto mb-8" />
          <p className="text-xs text-slate-400 tracking-[0.3em] uppercase mb-4">Proposal</p>
          <h1 className="text-3xl font-light text-slate-900 mb-4">
            Siap Bertransformasi Digital?
          </h1>
          <div className="w-16 h-px bg-primary mx-auto mb-6" />
          <p className="text-slate-500 leading-relaxed mb-12">
            Kami siap mendampingi RSUD Dr. Moewardi dalam perjalanan transformasi digital menuju pelayanan kesehatan yang lebih efisien dan terintegrasi.
          </p>
          
          <div className="border-t border-slate-200 pt-8">
            <p className="text-sm font-medium text-slate-900 mb-4">PT Zen Multimedia Indonesia</p>
            <div className="flex flex-col items-center gap-2 text-sm text-slate-500">
              <p>📧 info@zenplus.id</p>
              <p>📞 (021) 1234-5678</p>
              <p>🌐 www.zenplus.id</p>
            </div>
          </div>
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

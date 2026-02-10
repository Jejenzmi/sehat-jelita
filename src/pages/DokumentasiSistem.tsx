import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Download,
  Maximize,
  Home,
  Building2,
  Database,
  Shield,
  Users,
  Stethoscope,
  FlaskConical,
  Pill,
  Bed,
  Heart,
  Brain,
  Activity,
  FileText,
  DollarSign,
  BarChart3,
  Globe,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Award,
  Zap,
  Cloud,
  Lock,
  Server,
  Workflow
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import lintaslinkLogo from "@/assets/lintaslink-logo.png";

interface Slide {
  id: number;
  title: string;
  content: React.ReactNode;
  background?: string;
}

const DokumentasiSistem = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const slides: Slide[] = [
    // Slide 1: Cover
    {
      id: 1,
      title: "Cover",
      background: "bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-800",
      content: (
        <div className="flex flex-col items-center justify-center h-full text-white text-center px-8">
          <motion.img 
            src={lintaslinkLogo} 
            alt="SIMRS Lintas Link" 
            className="w-32 h-32 mb-8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
          />
          <motion.h1 
            className="text-5xl md:text-7xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            SIMRS ZEN
          </motion.h1>
          <motion.p 
            className="text-2xl md:text-3xl text-teal-100 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Sistem Informasi Manajemen Rumah Sakit
          </motion.p>
          <motion.div 
            className="bg-white/10 backdrop-blur rounded-xl px-8 py-4 mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <p className="text-lg">Dokumentasi Sistem & Manual Book</p>
            <p className="text-sm text-teal-200 mt-2">Versi 1.0 | Februari 2026</p>
          </motion.div>
          <motion.div 
            className="mt-12 text-teal-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <p className="font-semibold">PT Lintaslink Media Teknologi</p>
            <p className="text-sm">Menara MTH, Jakarta</p>
          </motion.div>
        </div>
      )
    },
    // Slide 2: Tentang SIMRS ZEN
    {
      id: 2,
      title: "Tentang SIMRS ZEN",
      content: (
        <div className="p-8 md:p-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8 flex items-center gap-3">
            <Building2 className="w-10 h-10 text-teal-600" />
            Tentang SIMRS ZEN
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <p className="text-lg text-gray-600 leading-relaxed">
                SIMRS ZEN adalah <strong>Sistem Informasi Manajemen Rumah Sakit</strong> berbasis web 
                yang dikembangkan untuk memenuhi kebutuhan digitalisasi layanan kesehatan di Indonesia.
              </p>
              <div className="bg-teal-50 rounded-xl p-6 border border-teal-100">
                <h3 className="font-semibold text-teal-800 mb-3">Visi</h3>
                <p className="text-teal-700">
                  Menjadi solusi SIMRS terdepan yang mendukung transformasi digital 
                  rumah sakit Indonesia menuju era kesehatan 5.0
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Cloud, label: "Cloud-Based", desc: "Akses dari mana saja" },
                { icon: Shield, label: "Secure", desc: "Enkripsi end-to-end" },
                { icon: Zap, label: "Fast", desc: "Performa optimal" },
                { icon: Globe, label: "Integrated", desc: "SATU SEHAT & BPJS" }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  className="bg-white rounded-xl p-4 shadow-md border border-gray-100 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                >
                  <item.icon className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                  <p className="font-semibold text-gray-800">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    // Slide 3: Kepatuhan Regulasi
    {
      id: 3,
      title: "Kepatuhan Regulasi",
      content: (
        <div className="p-8 md:p-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8 flex items-center gap-3">
            <Award className="w-10 h-10 text-teal-600" />
            Kepatuhan Regulasi
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "PMK No. 24/2022", desc: "Rekam Medis Elektronik", status: "Compliant" },
              { title: "SATU SEHAT", desc: "Interoperabilitas FHIR R4", status: "Terintegrasi" },
              { title: "BPJS Kesehatan", desc: "VClaim, PCare, iCare, Antrean", status: "Terintegrasi" },
              { title: "Standar SNARS", desc: "Akreditasi Rumah Sakit", status: "Mendukung" },
              { title: "INA-CBG/DRG", desc: "Sistem Pembiayaan Casemix", status: "Terintegrasi" },
              { title: "Laporan RL 1-6", desc: "Pelaporan Kemenkes RI", status: "Otomatis" }
            ].map((item, i) => (
              <motion.div 
                key={i}
                className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.1 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-gray-800">{item.title}</h3>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-sm text-gray-600 mb-3">{item.desc}</p>
                <span className="inline-block bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">
                  {item.status}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )
    },
    // Slide 4: Arsitektur Sistem
    {
      id: 4,
      title: "Arsitektur Sistem",
      content: (
        <div className="p-8 md:p-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8 flex items-center gap-3">
            <Server className="w-10 h-10 text-teal-600" />
            Arsitektur Sistem
          </h2>
          <div className="flex flex-col items-center space-y-4">
            {[
              { label: "Frontend Layer", tech: "React 18 + TypeScript + Vite + TailwindCSS", color: "bg-blue-500" },
              { label: "API Layer", tech: "Supabase Edge Functions (Deno) / Node.js Express", color: "bg-teal-500" },
              { label: "Database Layer", tech: "PostgreSQL 15 + Row Level Security", color: "bg-green-500" },
              { label: "External APIs", tech: "SATU SEHAT • BPJS • SISRUTE • ASPAK", color: "bg-purple-500" }
            ].map((layer, i) => (
              <motion.div 
                key={i}
                className={`w-full max-w-3xl ${layer.color} text-white rounded-xl p-4 text-center shadow-lg`}
                initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.15 }}
              >
                <p className="font-bold text-lg">{layer.label}</p>
                <p className="text-sm opacity-90">{layer.tech}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { icon: Lock, label: "TLS 1.3 Encryption" },
              { icon: Users, label: "21 User Roles" },
              { icon: Database, label: "40+ Tables" }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <item.icon className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      )
    },
    // Slide 5: Modul Pelayanan Klinis
    {
      id: 5,
      title: "Modul Pelayanan Klinis",
      content: (
        <div className="p-8 md:p-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8 flex items-center gap-3">
            <Stethoscope className="w-10 h-10 text-teal-600" />
            Modul Pelayanan Klinis
          </h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { icon: Users, name: "Pendaftaran", desc: "Registrasi & Admisi" },
              { icon: Stethoscope, name: "Rawat Jalan", desc: "Poliklinik Spesialis" },
              { icon: Activity, name: "IGD", desc: "Triase ESI 5 Level" },
              { icon: Bed, name: "Rawat Inap", desc: "Bed Management" },
              { icon: Heart, name: "ICU/ICCU", desc: "Critical Care" },
              { icon: Brain, name: "Kamar Operasi", desc: "Surgical Suite" },
              { icon: Activity, name: "Hemodialisa", desc: "HD Management" },
              { icon: FileText, name: "Rekam Medis", desc: "EMR SOAP" }
            ].map((module, i) => (
              <motion.div 
                key={i}
                className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:border-teal-300 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
              >
                <module.icon className="w-8 h-8 text-teal-600 mb-2" />
                <p className="font-semibold text-gray-800">{module.name}</p>
                <p className="text-xs text-gray-500">{module.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )
    },
    // Slide 6: Modul Penunjang Medis
    {
      id: 6,
      title: "Modul Penunjang Medis",
      content: (
        <div className="p-8 md:p-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8 flex items-center gap-3">
            <FlaskConical className="w-10 h-10 text-teal-600" />
            Modul Penunjang Medis
          </h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { icon: FlaskConical, name: "Laboratorium", desc: "LIS Integration" },
              { icon: Activity, name: "Radiologi", desc: "PACS/RIS Ready" },
              { icon: Pill, name: "Farmasi", desc: "E-Prescription" },
              { icon: Heart, name: "Bank Darah", desc: "BDRS" },
              { icon: Activity, name: "Gizi", desc: "Nutrition Care" },
              { icon: Users, name: "Rehabilitasi", desc: "Fisioterapi" },
              { icon: FileText, name: "MCU", desc: "Medical Check Up" },
              { icon: Shield, name: "Forensik", desc: "Medikolegal" }
            ].map((module, i) => (
              <motion.div 
                key={i}
                className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:border-teal-300 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
              >
                <module.icon className="w-8 h-8 text-cyan-600 mb-2" />
                <p className="font-semibold text-gray-800">{module.name}</p>
                <p className="text-xs text-gray-500">{module.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )
    },
    // Slide 7: Modul Keuangan & Administrasi
    {
      id: 7,
      title: "Modul Keuangan & Administrasi",
      content: (
        <div className="p-8 md:p-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8 flex items-center gap-3">
            <DollarSign className="w-10 h-10 text-teal-600" />
            Modul Keuangan & Administrasi
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-700">Keuangan</h3>
              {[
                { name: "Billing & Kasir", desc: "Multi-payer, Invoice, Payment" },
                { name: "Akuntansi", desc: "COA, Jurnal, GL, Laporan Keuangan" },
                { name: "INA-CBG Grouper", desc: "Kalkulasi tarif otomatis" }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  className="bg-amber-50 rounded-lg p-4 border border-amber-100"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                >
                  <p className="font-semibold text-amber-800">{item.name}</p>
                  <p className="text-sm text-amber-600">{item.desc}</p>
                </motion.div>
              ))}
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-700">Administrasi</h3>
              {[
                { name: "SDM / HRD", desc: "Payroll, Absensi, Cuti, Shift" },
                { name: "Inventory", desc: "Multi-gudang, PO, Expiry Track" },
                { name: "Aset & ASPAK", desc: "Alkes, Kalibrasi, Pemeliharaan" }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  className="bg-blue-50 rounded-lg p-4 border border-blue-100"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                >
                  <p className="font-semibold text-blue-800">{item.name}</p>
                  <p className="text-sm text-blue-600">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    // Slide 8: Modul Manajemen & Mutu
    {
      id: 8,
      title: "Modul Manajemen & Mutu",
      content: (
        <div className="p-8 md:p-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8 flex items-center gap-3">
            <BarChart3 className="w-10 h-10 text-teal-600" />
            Modul Manajemen & Mutu
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: BarChart3, name: "Dashboard Executive", desc: "KPI real-time, Revenue analytics" },
              { icon: Award, name: "Akreditasi SNARS", desc: "Self-assessment, Gap analysis" },
              { icon: Activity, name: "Indikator Mutu", desc: "SISMADAK, Target vs Achievement" },
              { icon: Shield, name: "Insiden Keselamatan", desc: "IKP, Grading, RCA, CAPA" },
              { icon: FileText, name: "Informed Consent", desc: "Digital signature, Audit trail" },
              { icon: BarChart3, name: "Laporan RL 1-6", desc: "Pelaporan Kemenkes otomatis" }
            ].map((module, i) => (
              <motion.div 
                key={i}
                className="bg-white rounded-xl p-5 shadow-md border border-gray-100"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.08 }}
              >
                <module.icon className="w-10 h-10 text-purple-600 mb-3" />
                <p className="font-semibold text-gray-800 mb-1">{module.name}</p>
                <p className="text-sm text-gray-500">{module.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )
    },
    // Slide 9: Integrasi SATU SEHAT
    {
      id: 9,
      title: "Integrasi SATU SEHAT",
      background: "bg-gradient-to-br from-green-600 to-teal-700",
      content: (
        <div className="p-8 md:p-12 text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 flex items-center gap-3">
            <Globe className="w-10 h-10" />
            Integrasi SATU SEHAT
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <p className="text-lg mb-6 text-green-100">
                Terintegrasi penuh dengan platform SATU SEHAT menggunakan standar 
                <strong> HL7 FHIR R4</strong> dan autentikasi <strong>OAuth 2.0</strong>
              </p>
              <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                <h3 className="font-semibold mb-4">Resource FHIR Didukung:</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    "Organization", "Location", "Practitioner", "Patient",
                    "Encounter", "Condition", "Observation", "Procedure",
                    "Medication", "MedicationRequest", "AllergyIntolerance",
                    "ServiceRequest", "DiagnosticReport", "Composition", "Immunization"
                  ].map((resource, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-300" />
                      <span>{resource}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <p className="font-semibold mb-2">Alur Sinkronisasi</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-xs">1</span>
                    <span>User menyimpan data di SIMRS ZEN</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-xs">2</span>
                    <span>Transform ke format FHIR R4</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-xs">3</span>
                    <span>OAuth token request</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-xs">4</span>
                    <span>POST ke SATU SEHAT API</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-xs">5</span>
                    <span>Simpan SATU SEHAT ID</span>
                  </div>
                </div>
              </div>
              <div className="bg-green-400/20 rounded-xl p-4 border border-green-300/30">
                <p className="text-sm">
                  <strong>Status:</strong> Uji coba sandbox berhasil ✓
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    // Slide 10: Integrasi BPJS Kesehatan
    {
      id: 10,
      title: "Integrasi BPJS Kesehatan",
      background: "bg-gradient-to-br from-blue-600 to-indigo-700",
      content: (
        <div className="p-8 md:p-12 text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 flex items-center gap-3">
            <Shield className="w-10 h-10" />
            Integrasi BPJS Kesehatan
          </h2>
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            {[
              { name: "VClaim", desc: "Klaim FKRTL", status: "Active" },
              { name: "PCare", desc: "FKTP/Puskesmas", status: "Active" },
              { name: "Antrean", desc: "Antrean Online JKN", status: "Active" },
              { name: "iCare", desc: "Aplikasi Peserta", status: "Active" }
            ].map((service, i) => (
              <motion.div 
                key={i}
                className="bg-white/10 backdrop-blur rounded-xl p-5 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                <p className="font-bold text-xl mb-1">{service.name}</p>
                <p className="text-sm text-blue-200 mb-3">{service.desc}</p>
                <span className="inline-block bg-green-400 text-green-900 text-xs px-3 py-1 rounded-full">
                  {service.status}
                </span>
              </motion.div>
            ))}
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-6">
            <h3 className="font-semibold mb-4">Fitur VClaim:</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              {[
                "Cek Kepesertaan", "Generate SEP", "Update/Hapus SEP",
                "Rencana Kontrol", "Surat Kontrol", "Rujukan Keluar",
                "PRB", "Monitoring Klaim", "E-Claim FHIR"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-300" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 text-sm text-blue-200">
            <p><strong>Keamanan:</strong> HMAC-SHA256 signature • AES-256-CBC encryption</p>
          </div>
        </div>
      )
    },
    // Slide 11: Uji Coba SATU SEHAT (Sandbox)
    {
      id: 11,
      title: "Uji Coba SATU SEHAT",
      content: (
        <div className="p-8 md:p-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8 flex items-center gap-3">
            <Workflow className="w-10 h-10 text-teal-600" />
            Uji Coba SATU SEHAT (Sandbox)
          </h2>
          <div className="space-y-4">
            {[
              { step: 1, endpoint: "POST /oauth2/v1/accesstoken", desc: "Get OAuth Token", status: "200 OK" },
              { step: 2, endpoint: "GET /fhir-r4/v1/Patient", desc: "Get Patient by NIK", status: "200 OK" },
              { step: 3, endpoint: "POST /fhir-r4/v1/Encounter", desc: "Create Encounter", status: "201 Created" },
              { step: 4, endpoint: "POST /fhir-r4/v1/Condition", desc: "Create Diagnosis (ICD-10)", status: "201 Created" },
              { step: 5, endpoint: "PUT /fhir-r4/v1/Encounter/{id}", desc: "Update Encounter to Finished", status: "200 OK" }
            ].map((item, i) => (
              <motion.div 
                key={i}
                className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-md border border-gray-100"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
              >
                <div className="bg-teal-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">
                  {item.step}
                </div>
                <div className="flex-1">
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">{item.endpoint}</code>
                  <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
                </div>
                <span className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full font-medium">
                  {item.status}
                </span>
              </motion.div>
            ))}
          </div>
          <div className="mt-6 bg-green-50 rounded-xl p-4 border border-green-200">
            <p className="text-green-800 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Semua endpoint berhasil diuji dengan response 200/201
            </p>
          </div>
        </div>
      )
    },
    // Slide 12: Screenshot Aplikasi
    {
      id: 12,
      title: "Screenshot Aplikasi",
      content: (
        <div className="p-8 md:p-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8 flex items-center gap-3">
            <FileText className="w-10 h-10 text-teal-600" />
            Screenshot Aplikasi
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: "Dashboard", desc: "Overview statistik rumah sakit, KPI, dan akses cepat ke modul" },
              { title: "Rekam Medis", desc: "Format SOAP, ICD-10 coding, riwayat kunjungan" },
              { title: "Integrasi Eksternal", desc: "Konfigurasi SATU SEHAT, BPJS, SISRUTE" },
              { title: "Billing & Kasir", desc: "Invoice, payment processing, laporan pendapatan" }
            ].map((screen, i) => (
              <motion.div 
                key={i}
                className="bg-gray-100 rounded-xl p-6 border-2 border-dashed border-gray-300"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.1 }}
              >
                <div className="h-32 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                  <p className="text-gray-400 text-sm">[Screenshot: {screen.title}]</p>
                </div>
                <h3 className="font-semibold text-gray-800">{screen.title}</h3>
                <p className="text-sm text-gray-600">{screen.desc}</p>
              </motion.div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-6 text-center">
            * Screenshot detail tersedia di dokumen PDF terpisah
          </p>
        </div>
      )
    },
    // Slide 13: Keamanan & Compliance
    {
      id: 13,
      title: "Keamanan & Compliance",
      content: (
        <div className="p-8 md:p-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8 flex items-center gap-3">
            <Lock className="w-10 h-10 text-teal-600" />
            Keamanan & Compliance
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-700">Keamanan Data</h3>
              {[
                { icon: Lock, label: "Enkripsi TLS 1.3", desc: "Data in transit" },
                { icon: Database, label: "Row Level Security", desc: "Akses data per user" },
                { icon: Shield, label: "JWT Authentication", desc: "Stateless auth tokens" },
                { icon: Users, label: "RBAC 21 Roles", desc: "Granular permissions" }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  className="flex items-center gap-4 bg-white rounded-lg p-4 shadow-sm border"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                >
                  <item.icon className="w-8 h-8 text-teal-600" />
                  <div>
                    <p className="font-medium text-gray-800">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-700">Audit & Logging</h3>
              {[
                { label: "Audit Trail", desc: "Log semua aktivitas user" },
                { label: "Data Retention", desc: "Sesuai regulasi Kemenkes" },
                { label: "Backup Otomatis", desc: "Daily encrypted backup" },
                { label: "Disaster Recovery", desc: "Multi-region redundancy" }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  className="bg-blue-50 rounded-lg p-4 border border-blue-100"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                >
                  <p className="font-medium text-blue-800">{item.label}</p>
                  <p className="text-sm text-blue-600">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    // Slide 14: Roadmap Implementasi
    {
      id: 14,
      title: "Roadmap Implementasi",
      content: (
        <div className="p-8 md:p-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8 flex items-center gap-3">
            <Clock className="w-10 h-10 text-teal-600" />
            Roadmap Implementasi
          </h2>
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-teal-200"></div>
            <div className="space-y-6">
              {[
                { month: "Bulan 1", title: "Assessment & Setup", desc: "Analisis kebutuhan, konfigurasi sistem, migrasi data master" },
                { month: "Bulan 2", title: "Training & Pilot", desc: "Pelatihan user, pilot di 1-2 unit, feedback collection" },
                { month: "Bulan 3", title: "Rollout Phase 1", desc: "Go-live pendaftaran, rawat jalan, farmasi, billing" },
                { month: "Bulan 4", title: "Rollout Phase 2", desc: "Rawat inap, IGD, laboratorium, radiologi" },
                { month: "Bulan 5", title: "Full Operation", desc: "Integrasi SATU SEHAT & BPJS, optimasi, monitoring" }
              ].map((phase, i) => (
                <motion.div 
                  key={i}
                  className="relative pl-16"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                >
                  <div className="absolute left-6 w-5 h-5 bg-teal-600 rounded-full border-4 border-white shadow"></div>
                  <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100">
                    <span className="inline-block bg-teal-100 text-teal-700 text-xs px-3 py-1 rounded-full mb-2">
                      {phase.month}
                    </span>
                    <h3 className="font-semibold text-gray-800">{phase.title}</h3>
                    <p className="text-sm text-gray-600">{phase.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    // Slide 15: Kontak & Dukungan
    {
      id: 15,
      title: "Kontak & Dukungan",
      background: "bg-gradient-to-br from-slate-800 to-slate-900",
      content: (
        <div className="p-8 md:p-12 text-white h-full flex flex-col justify-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
            Hubungi Kami
          </h2>
          <div className="max-w-2xl mx-auto w-full">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-8 mb-8">
              <div className="text-center mb-6">
                <img src={lintaslinkLogo} alt="PT Lintaslink Media Teknologi" className="w-20 h-20 mx-auto mb-4" />
                <h3 className="text-2xl font-bold">PT Lintaslink Media Teknologi</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <MapPin className="w-6 h-6 text-teal-400" />
                  <p>Jl. Taman Pahlawan No.166, Purwakarta, Jawa Barat 41111</p>
                </div>
                <div className="flex items-center gap-4">
                  <Phone className="w-6 h-6 text-teal-400" />
                  <p>+62 851-2104-5798 (WhatsApp)</p>
                </div>
                <div className="flex items-center gap-4">
                  <Mail className="w-6 h-6 text-teal-400" />
                  <p>info@zenmultimedia.co.id</p>
                </div>
                <div className="flex items-center gap-4">
                  <Globe className="w-6 h-6 text-teal-400" />
                  <p>https://zenmultimedia.co.id</p>
                </div>
              </div>
            </div>
            <div className="text-center text-slate-400">
              <p>Demo Online: <span className="text-teal-400">https://simrszen.id</span></p>
              <p className="mt-4 text-sm">© 2026 PT Lintaslink Media Teknologi. All rights reserved.</p>
            </div>
          </div>
        </div>
      )
    },
    // Slide 16: Terima Kasih
    {
      id: 16,
      title: "Terima Kasih",
      background: "bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-800",
      content: (
        <div className="flex flex-col items-center justify-center h-full text-white text-center px-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
          >
            <img src={lintaslinkLogo} alt="SIMRS Lintas Link" className="w-24 h-24 mb-8" />
          </motion.div>
          <motion.h1 
            className="text-5xl md:text-6xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Terima Kasih
          </motion.h1>
          <motion.p 
            className="text-2xl text-teal-100 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            SIMRS ZEN - Solusi Digital Rumah Sakit Indonesia
          </motion.p>
          <motion.div 
            className="bg-white/10 backdrop-blur rounded-xl px-8 py-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <p className="text-lg">Ada Pertanyaan?</p>
            <p className="text-teal-200 mt-2">info@zenmultimedia.co.id | +62 851-2104-5798</p>
          </motion.div>
        </div>
      )
    }
  ];

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        nextSlide();
      } else if (e.key === "ArrowLeft") {
        prevSlide();
      } else if (e.key === "Escape") {
        setIsFullscreen(false);
      } else if (e.key === "f" || e.key === "F") {
        setIsFullscreen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Auto-play
  useEffect(() => {
    if (!isAutoPlay) return;
    const interval = setInterval(nextSlide, 8000);
    return () => clearInterval(interval);
  }, [isAutoPlay, nextSlide]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const progress = ((currentSlide + 1) / slides.length) * 100;

  return (
    <div className={`min-h-screen bg-gray-100 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header Controls */}
      <div className="bg-white shadow-sm px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <Home className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <span className="text-sm text-gray-500">
            Slide {currentSlide + 1} / {slides.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAutoPlay(!isAutoPlay)}
          >
            {isAutoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
            <Maximize className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => window.print()}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <Progress value={progress} className="h-1 rounded-none" />

      {/* Slide Container */}
      <div className="relative" style={{ height: 'calc(100vh - 60px)' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className={`absolute inset-0 ${slides[currentSlide].background || 'bg-slate-50'}`}
          >
            {slides[currentSlide].content}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-lg"
          onClick={prevSlide}
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-lg"
          onClick={nextSlide}
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>

      {/* Slide Thumbnails */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentSlide ? 'bg-teal-600 w-6' : 'bg-gray-300 hover:bg-gray-400'
            }`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { background: white; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default DokumentasiSistem;

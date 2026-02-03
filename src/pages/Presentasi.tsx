import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, type Easing } from "framer-motion";
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
import zenCompanyLogo from "@/assets/zen-company-logo.png";

// Animation variants
const easeOut: Easing = [0.22, 1, 0.36, 1];

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: easeOut }
  })
};

const fadeInLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: easeOut }
  })
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.1, duration: 0.5, ease: easeOut }
  })
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 }
  }
};

interface Slide {
  id: number;
  title: string;
  content: React.ReactNode;
}

const slides: Slide[] = [
  {
    id: 1,
    title: "Cover",
    content: (
      <div className="relative flex flex-col items-center justify-center h-full px-8 overflow-hidden">
        {/* Animated background elements */}
        <motion.div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-3xl"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-blue-500/10 to-transparent blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], rotate: [0, -90, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
        
        <div className="relative z-10 text-center max-w-4xl">
          <motion.img 
            src={zenCompanyLogo} 
            alt="PT Zen Multimedia Indonesia" 
            className="h-12 md:h-16 mx-auto mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          
          <motion.p 
            className="text-xs text-slate-400 tracking-[0.4em] uppercase mb-6"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            Proposal Penawaran
          </motion.p>
          
          <motion.h1 
            className="text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent leading-tight mb-8"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            Sistem Informasi<br />Manajemen Rumah Sakit
          </motion.h1>
          
          <motion.div 
            className="flex justify-center gap-4 mb-8"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            custom={3}
          >
            <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">SATU SEHAT Ready</span>
            <span className="px-4 py-2 rounded-full bg-blue-500/10 text-blue-600 text-sm font-medium">BPJS Integrated</span>
            <span className="px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 text-sm font-medium">Cloud Native</span>
          </motion.div>
          
          <motion.div 
            className="mt-16 pt-8 border-t border-slate-200"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            custom={4}
          >
            <p className="text-xs text-slate-400 mb-2">Diajukan kepada</p>
            <p className="text-xl font-semibold text-slate-800">RSUD Dr. Moewardi Surakarta</p>
            <p className="text-sm text-slate-400 mt-3">Februari 2026</p>
          </motion.div>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    title: "Tentang Kami",
    content: (
      <div className="relative h-full px-8 md:px-16 py-12 overflow-hidden">
        <motion.div
          className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-3xl"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />
        
        <div className="relative z-10 max-w-5xl mx-auto">
          <motion.div variants={fadeInLeft} initial="hidden" animate="visible">
            <p className="text-xs text-primary tracking-[0.3em] uppercase mb-2 font-semibold">01 — Pendahuluan</p>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
              Tentang <span className="text-primary">ZEN⁺</span> SIMRS
            </h2>
            <motion.div 
              className="w-20 h-1 bg-gradient-to-r from-primary to-blue-500 rounded-full mb-8"
              initial={{ width: 0 }}
              animate={{ width: 80 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            />
          </motion.div>
          
          <div className="grid md:grid-cols-5 gap-10">
            <motion.div 
              className="md:col-span-3"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.p variants={fadeInUp} className="text-lg text-slate-600 leading-relaxed mb-6">
                <strong className="text-slate-900">ZEN⁺ SIMRS</strong> adalah sistem informasi manajemen rumah sakit generasi terbaru yang dikembangkan dengan pendekatan <span className="text-primary font-semibold">cloud-native</span> dan <span className="text-primary font-semibold">user-centric design</span>.
              </motion.p>
              <motion.p variants={fadeInUp} className="text-slate-600 leading-relaxed mb-6">
                Dirancang khusus untuk memenuhi kebutuhan rumah sakit di Indonesia dengan kepatuhan penuh terhadap regulasi Kemenkes RI, standar interoperabilitas SATU SEHAT (HL7 FHIR), dan integrasi BPJS Kesehatan.
              </motion.p>
            </motion.div>
            
            <motion.div 
              className="md:col-span-2 space-y-4"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {[
                { value: "100%", label: "Cloud-Based", color: "from-primary to-blue-500" },
                { value: "24/7", label: "Support", color: "from-blue-500 to-cyan-500" },
                { value: "99.9%", label: "Uptime SLA", color: "from-cyan-500 to-emerald-500" },
              ].map((item, idx) => (
                <motion.div 
                  key={idx}
                  variants={scaleIn}
                  custom={idx}
                  className="relative overflow-hidden rounded-2xl p-6 bg-white border border-slate-100 shadow-lg shadow-slate-100/50 group hover:shadow-xl hover:shadow-primary/10 transition-all duration-500"
                  whileHover={{ scale: 1.02, y: -4 }}
                >
                  <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${item.color}`} />
                  <p className={`text-3xl font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>{item.value}</p>
                  <p className="text-sm text-slate-500 mt-1">{item.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    title: "Keunggulan",
    content: (
      <div className="relative h-full px-8 md:px-16 py-12 overflow-hidden">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-r from-primary/5 via-blue-500/5 to-cyan-500/5 blur-3xl"
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        />
        
        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="text-center mb-12">
            <p className="text-xs text-primary tracking-[0.3em] uppercase mb-2 font-semibold">02 — Value Proposition</p>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900">
              Mengapa Memilih <span className="text-primary">ZEN⁺</span>?
            </h2>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {[
              { icon: "⚡", title: "Performa Tinggi", desc: "Response time <200ms untuk ribuan transaksi harian", gradient: "from-amber-400 to-orange-500" },
              { icon: "🔗", title: "Terintegrasi", desc: "Native dengan SATU SEHAT, BPJS, dan sistem eksternal", gradient: "from-primary to-blue-500" },
              { icon: "🔒", title: "Enterprise Security", desc: "Enkripsi end-to-end, RBAC, dan audit trail lengkap", gradient: "from-emerald-400 to-teal-500" },
              { icon: "☁️", title: "Zero Infrastructure", desc: "Tanpa investasi server, auto-scaling & backup otomatis", gradient: "from-blue-400 to-indigo-500" },
              { icon: "📊", title: "Business Intelligence", desc: "Dashboard real-time dan laporan otomatis RL 1-5", gradient: "from-purple-400 to-pink-500" },
              { icon: "🎯", title: "User Friendly", desc: "Antarmuka intuitif, minimal training, adopsi cepat", gradient: "from-rose-400 to-red-500" },
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                variants={scaleIn}
                custom={idx}
                className="group relative overflow-hidden rounded-2xl p-6 bg-white border border-slate-100 shadow-lg hover:shadow-2xl transition-all duration-500"
                whileHover={{ y: -8 }}
              >
                <motion.div 
                  className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                />
                <motion.span 
                  className="text-4xl block mb-4"
                  whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  {item.icon}
                </motion.span>
                <h3 className="font-bold text-slate-900 mb-2 text-lg">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    title: "Modul",
    content: (
      <div className="relative h-full px-8 md:px-16 py-10 overflow-hidden">
        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="text-center mb-8">
            <p className="text-xs text-primary tracking-[0.3em] uppercase mb-2 font-semibold">03 — Ruang Lingkup</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Modul <span className="text-primary">Lengkap</span> & Terintegrasi
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div 
              variants={fadeInLeft}
              initial="hidden"
              animate="visible"
              className="relative"
            >
              <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-blue-500 to-cyan-500 rounded-full" />
              <h3 className="text-sm font-bold text-primary uppercase tracking-wide mb-4 ml-4">Pelayanan Klinis</h3>
              <motion.div className="space-y-2" variants={staggerContainer} initial="hidden" animate="visible">
                {["Pendaftaran & Antrian Cerdas", "Rawat Jalan (Poliklinik)", "Rawat Inap", "IGD", "Kamar Operasi (IBS)", "ICU/NICU/PICU", "Hemodialisa", "Rehabilitasi Medik", "MCU", "Forensik"].map((item, idx) => (
                  <motion.div 
                    key={idx} 
                    variants={fadeInUp}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all group"
                    whileHover={{ x: 8 }}
                  >
                    <span className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-blue-500 group-hover:scale-150 transition-transform" />
                    <span className="text-sm text-slate-700">{item}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
            
            <motion.div 
              variants={fadeInLeft}
              initial="hidden"
              animate="visible"
              custom={1}
              className="relative"
            >
              <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 via-teal-500 to-cyan-500 rounded-full" />
              <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wide mb-4 ml-4">Penunjang & Manajemen</h3>
              <motion.div className="space-y-2" variants={staggerContainer} initial="hidden" animate="visible">
                {["Farmasi & Apotek", "Laboratorium", "Radiologi & Imaging", "Bank Darah (UTDRS)", "Gizi & Nutrisi", "Rekam Medis Elektronik", "Billing & Kasir", "Inventori & Logistik", "SDM & Payroll", "Akuntansi"].map((item, idx) => (
                  <motion.div 
                    key={idx} 
                    variants={fadeInUp}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-500/20 transition-all group"
                    whileHover={{ x: 8 }}
                  >
                    <span className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 group-hover:scale-150 transition-transform" />
                    <span className="text-sm text-slate-700">{item}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 5,
    title: "SATU SEHAT",
    content: (
      <div className="relative h-full px-8 md:px-16 py-12 overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <motion.div
          className="absolute top-20 right-20 w-32 h-32 rounded-full border-4 border-emerald-200/50"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-24 h-24 rounded-full border-4 border-teal-200/50"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.6, 0.3, 0.6] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        
        <div className="relative z-10 max-w-5xl mx-auto">
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="text-center mb-10">
            <p className="text-xs text-emerald-600 tracking-[0.3em] uppercase mb-2 font-semibold">04 — Interoperabilitas</p>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900">
              Integrasi <span className="text-emerald-600">SATU SEHAT</span>
            </h2>
            <p className="text-slate-500 mt-4 max-w-2xl mx-auto">
              Terintegrasi penuh dengan platform Kemenkes RI menggunakan standar HL7 FHIR R4
            </p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {[
              { resource: "Patient", desc: "Data Pasien", icon: "👤" },
              { resource: "Encounter", desc: "Kunjungan", icon: "🏥" },
              { resource: "Condition", desc: "Diagnosis", icon: "📋" },
              { resource: "Observation", desc: "Vital Signs", icon: "💓" },
              { resource: "Medication", desc: "Obat", icon: "💊" },
              { resource: "Procedure", desc: "Tindakan", icon: "🔬" },
              { resource: "Practitioner", desc: "Nakes", icon: "👨‍⚕️" },
              { resource: "Organization", desc: "Faskes", icon: "🏢" },
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                variants={scaleIn}
                custom={idx}
                className="relative overflow-hidden rounded-2xl p-5 bg-white border border-emerald-100 shadow-lg text-center group"
                whileHover={{ y: -6, scale: 1.02 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                />
                <motion.span 
                  className="text-3xl block mb-2"
                  whileHover={{ scale: 1.3 }}
                >
                  {item.icon}
                </motion.span>
                <p className="font-bold text-slate-900">{item.resource}</p>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    ),
  },
  {
    id: 6,
    title: "BPJS",
    content: (
      <div className="relative h-full px-8 md:px-16 py-12 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="relative z-10 max-w-5xl mx-auto">
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="text-center mb-10">
            <p className="text-xs text-blue-600 tracking-[0.3em] uppercase mb-2 font-semibold">05 — Integrasi</p>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900">
              Integrasi <span className="text-blue-600">BPJS</span> Kesehatan
            </h2>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-2 gap-6"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {[
              { 
                code: "V", 
                title: "VClaim Service", 
                items: ["Cek kepesertaan & eligibilitas", "Generate SEP otomatis", "Data rujukan FKTP", "Monitoring status klaim"],
                gradient: "from-blue-500 to-indigo-500"
              },
              { 
                code: "E", 
                title: "E-Claim / INA-CBG", 
                items: ["Grouper INA-CBG terintegrasi", "Pengajuan klaim digital", "Tracking verifikasi", "Analisis potensi dispute"],
                gradient: "from-indigo-500 to-purple-500"
              },
              { 
                code: "A", 
                title: "Antrean Online", 
                items: ["Integrasi Mobile JKN", "Push jadwal & notifikasi", "Reschedule otomatis"],
                gradient: "from-purple-500 to-pink-500"
              },
              { 
                code: "P", 
                title: "Aplicares", 
                items: ["Monitoring tempat tidur", "Update ketersediaan realtime", "Sinkronisasi otomatis"],
                gradient: "from-pink-500 to-rose-500"
              },
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                variants={scaleIn}
                custom={idx}
                className="relative overflow-hidden rounded-2xl p-6 bg-white border border-slate-100 shadow-xl group"
                whileHover={{ scale: 1.02 }}
              >
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${item.gradient}`} />
                <div className="flex items-center gap-4 mb-4">
                  <motion.div 
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white font-bold text-xl shadow-lg`}
                    whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {item.code}
                  </motion.div>
                  <h3 className="font-bold text-slate-900 text-lg">{item.title}</h3>
                </div>
                <ul className="space-y-2">
                  {item.items.map((i, iIdx) => (
                    <motion.li 
                      key={iIdx} 
                      className="flex items-center gap-2 text-sm text-slate-600"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + iIdx * 0.1 }}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${item.gradient}`} />
                      {i}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    ),
  },
  {
    id: 7,
    title: "Arsitektur",
    content: (
      <div className="relative h-full px-8 md:px-16 py-12 overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-primary/20 to-blue-500/20 blur-3xl"
          animate={{ scale: [1, 1.1, 1], rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        
        <div className="relative z-10 max-w-5xl mx-auto text-white">
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="text-center mb-10">
            <p className="text-xs text-primary tracking-[0.3em] uppercase mb-2 font-semibold">06 — Infrastruktur</p>
            <h2 className="text-3xl md:text-5xl font-bold">
              Arsitektur & <span className="text-primary">Keamanan</span>
            </h2>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-3 gap-6 mb-10"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {[
              { icon: "☁️", title: "Cloud Native", desc: "Auto-scaling, load balancing" },
              { icon: "🔐", title: "Security First", desc: "AES-256, TLS 1.3" },
              { icon: "🔄", title: "High Availability", desc: "99.9% uptime, DR ready" },
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                variants={scaleIn}
                custom={idx}
                className="text-center p-8 rounded-2xl bg-white/5 backdrop-blur border border-white/10 hover:bg-white/10 transition-all"
                whileHover={{ y: -8 }}
              >
                <motion.span 
                  className="text-5xl block mb-4"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: idx * 0.3 }}
                >
                  {item.icon}
                </motion.span>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
          
          <motion.div 
            className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-8"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            custom={3}
          >
            <h4 className="font-bold mb-6 text-primary">Spesifikasi Teknis</h4>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { label: "Database", value: "PostgreSQL 15" },
                { label: "API", value: "RESTful + GraphQL" },
                { label: "Auth", value: "OAuth 2.0 + JWT" },
                { label: "Backup", value: "Daily + Point-in-time" },
              ].map((item, idx) => (
                <motion.div 
                  key={idx} 
                  className="flex justify-between border-b border-white/10 pb-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                >
                  <span className="text-slate-400">{item.label}</span>
                  <span className="font-medium">{item.value}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    ),
  },
  {
    id: 8,
    title: "Implementasi",
    content: (
      <div className="relative h-full px-6 md:px-12 py-8 overflow-hidden">
        {/* Animated background */}
        <motion.div
          className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-primary/10 via-blue-500/5 to-transparent blur-3xl"
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />
        
        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="text-center mb-6">
            <p className="text-xs text-primary tracking-[0.3em] uppercase mb-2 font-semibold">07 — Metodologi</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Timeline Implementasi <span className="text-primary">5 Bulan</span>
            </h2>
            <p className="text-slate-500 mt-2 text-sm">Pendekatan bertahap untuk menjamin kesuksesan implementasi</p>
          </motion.div>
          
          {/* Timeline Visual Bar */}
          <motion.div 
            className="relative mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex justify-between items-center mb-3">
              {["Bulan 1", "Bulan 2", "Bulan 3", "Bulan 4", "Bulan 5"].map((month, idx) => (
                <motion.div 
                  key={idx}
                  className="text-center flex-1"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                >
                  <div className="relative">
                    <motion.div 
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white font-bold text-sm mx-auto shadow-lg"
                      whileHover={{ scale: 1.15 }}
                    >
                      {idx + 1}
                    </motion.div>
                    <p className="text-xs text-slate-500 mt-2 font-medium">{month}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <motion.div 
              className="h-2 rounded-full bg-slate-100 overflow-hidden"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <motion.div 
                className="h-full bg-gradient-to-r from-amber-400 via-primary via-blue-500 via-indigo-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.8, duration: 1.5, ease: "easeOut" }}
              />
            </motion.div>
          </motion.div>
          
          {/* Phase Cards */}
          <motion.div 
            className="grid md:grid-cols-5 gap-3"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {[
              { 
                phase: "01", 
                title: "Assessment & Planning", 
                duration: "Minggu 1-4", 
                month: "Bulan 1",
                items: ["Audit sistem legacy", "Gap analysis", "Pemetaan kebutuhan", "Project charter", "Risk assessment"],
                color: "from-amber-400 to-orange-500",
                deliverables: "Dokumen BRD & TRD"
              },
              { 
                phase: "02", 
                title: "Setup & Konfigurasi", 
                duration: "Minggu 5-8", 
                month: "Bulan 2",
                items: ["Cloud infrastructure", "Master data setup", "Konfigurasi modul", "API bridging", "Security setup"],
                color: "from-primary to-blue-500",
                deliverables: "Environment Ready"
              },
              { 
                phase: "03", 
                title: "Migrasi Data", 
                duration: "Minggu 9-12", 
                month: "Bulan 3",
                items: ["Data cleansing", "ETL proses", "Mapping ICD-10", "Validasi NIK", "Import master"],
                color: "from-blue-500 to-indigo-500",
                deliverables: "Data Validated"
              },
              { 
                phase: "04", 
                title: "UAT & Training", 
                duration: "Minggu 13-16", 
                month: "Bulan 4",
                items: ["User testing", "Bug fixing", "Training admin", "Training user", "SOP finalisasi"],
                color: "from-indigo-500 to-purple-500",
                deliverables: "User Certified"
              },
              { 
                phase: "05", 
                title: "Go-Live & Hypercare", 
                duration: "Minggu 17-20", 
                month: "Bulan 5",
                items: ["Parallel run", "Cutover", "24/7 support", "Monitoring", "Handover"],
                color: "from-purple-500 to-pink-500",
                deliverables: "System Live"
              },
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                variants={scaleIn}
                custom={idx}
                className="group relative"
              >
                <motion.div 
                  className="h-full rounded-2xl p-4 bg-white border border-slate-100 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden"
                  whileHover={{ y: -6, scale: 1.02 }}
                >
                  {/* Gradient overlay on hover */}
                  <motion.div 
                    className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                  />
                  
                  {/* Phase number */}
                  <motion.div 
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white font-bold text-sm shadow-lg mb-3`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    {item.phase}
                  </motion.div>
                  
                  <h3 className="font-bold text-slate-900 text-sm mb-1 leading-tight">{item.title}</h3>
                  <p className="text-xs text-slate-400 mb-3">{item.duration}</p>
                  
                  {/* Items list */}
                  <div className="space-y-1.5 mb-3">
                    {item.items.map((i, iIdx) => (
                      <motion.div 
                        key={iIdx} 
                        className="flex items-center gap-2"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + idx * 0.1 + iIdx * 0.05 }}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${item.color}`} />
                        <span className="text-xs text-slate-600">{i}</span>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Deliverable badge */}
                  <motion.div 
                    className={`inline-block px-3 py-1.5 rounded-full bg-gradient-to-r ${item.color} text-white text-xs font-medium shadow-md`}
                    whileHover={{ scale: 1.05 }}
                  >
                    ✓ {item.deliverables}
                  </motion.div>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
          
          {/* Total Duration Badge */}
          <motion.div 
            className="flex justify-center mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <motion.div 
              className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-xl"
              whileHover={{ scale: 1.02 }}
            >
              <span className="text-2xl">🚀</span>
              <div>
                <p className="text-xs text-slate-300">Total Durasi</p>
                <p className="font-bold">5 Bulan (20 Minggu)</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div>
                <p className="text-xs text-slate-300">Start</p>
                <p className="font-bold">Maret 2026</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div>
                <p className="text-xs text-slate-300">Go-Live</p>
                <p className="font-bold text-emerald-400">Juli 2026</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    ),
  },
  {
    id: 9,
    title: "Penutup",
    content: (
      <div className="relative flex flex-col items-center justify-center h-full px-8 overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-20 right-20 w-40 h-40 rounded-full border-2 border-primary/20"
          animate={{ scale: [1, 1.2, 1], rotate: 180 }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-32 h-32 rounded-full border-2 border-blue-500/20"
          animate={{ scale: [1.2, 1, 1.2], rotate: -180 }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        
        <div className="relative z-10 text-center max-w-2xl">
          <motion.img 
            src={zenCompanyLogo} 
            alt="PT Zen Multimedia Indonesia" 
            className="h-14 mx-auto mb-10"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          />
          
          <motion.p 
            className="text-xs text-slate-400 tracking-[0.4em] uppercase mb-4"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            Proposal
          </motion.p>
          
          <motion.h1 
            className="text-4xl md:text-5xl font-bold text-slate-900 mb-6"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            Siap <span className="text-primary">Bertransformasi</span> Digital?
          </motion.h1>
          
          <motion.p 
            className="text-slate-500 leading-relaxed mb-12"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            Kami siap mendampingi RSUD Dr. Moewardi dalam perjalanan transformasi digital menuju pelayanan kesehatan yang lebih efisien dan terintegrasi.
          </motion.p>
          
          <motion.div 
            className="border-t border-slate-200 pt-8"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            custom={3}
          >
            <p className="font-semibold text-slate-900 mb-4">PT Zen Multimedia Indonesia</p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
              <motion.span whileHover={{ scale: 1.05, color: "#0066FF" }} className="cursor-pointer">📧 info@zenplus.id</motion.span>
              <motion.span whileHover={{ scale: 1.05, color: "#0066FF" }} className="cursor-pointer">📞 (021) 1234-5678</motion.span>
              <motion.span whileHover={{ scale: 1.05, color: "#0066FF" }} className="cursor-pointer">🌐 www.zenplus.id</motion.span>
            </div>
          </motion.div>
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

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (currentSlide < slides.length - 1) {
        nextSlide();
      } else {
        setIsPlaying(false);
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [isPlaying, currentSlide, nextSlide]);

  const slide = slides[currentSlide];
  const progress = ((currentSlide + 1) / slides.length) * 100;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-white">
      {/* Slide Content with Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="h-full w-full"
        >
          {slide.content}
        </motion.div>
      </AnimatePresence>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0">
        <div className="h-1 bg-slate-100">
          <motion.div 
            className="h-full bg-gradient-to-r from-primary to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-white/80 backdrop-blur border-slate-200 hover:bg-white hover:border-primary"
            onClick={prevSlide}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </motion.div>
        
        <span className="px-4 py-2 text-sm font-medium text-slate-600 bg-white/80 backdrop-blur rounded-full border border-slate-200">
          {currentSlide + 1} / {slides.length}
        </span>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-white/80 backdrop-blur border-slate-200 hover:bg-white hover:border-primary"
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>

      {/* Top Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-white/80 backdrop-blur border-slate-200 hover:bg-white"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-white/80 backdrop-blur border-slate-200 hover:bg-white"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-white/80 backdrop-blur border-slate-200 hover:bg-white"
            onClick={() => setShowNav(!showNav)}
          >
            {showNav ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-white/80 backdrop-blur border-slate-200 hover:bg-white"
            onClick={() => window.location.href = "/"}
          >
            <Home className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>

      {/* Slide Navigator */}
      <AnimatePresence>
        {showNav && (
          <motion.div 
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3 }}
            className="absolute right-4 top-16 w-64 bg-white/95 backdrop-blur-xl rounded-2xl p-4 max-h-[calc(100vh-8rem)] overflow-y-auto shadow-2xl border border-slate-100"
          >
            <h3 className="font-bold text-slate-900 mb-4">Navigasi Slide</h3>
            <div className="space-y-1">
              {slides.map((s, idx) => (
                <motion.button
                  key={s.id}
                  className={`w-full text-left p-3 rounded-xl text-sm transition-all ${
                    idx === currentSlide
                      ? "bg-primary text-white font-medium"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                  onClick={() => {
                    goToSlide(idx);
                    setShowNav(false);
                  }}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="opacity-50 mr-2">{String(idx + 1).padStart(2, '0')}</span>
                  {s.title}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

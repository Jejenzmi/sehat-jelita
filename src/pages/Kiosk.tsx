import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Users,
  Calendar,
  Stethoscope,
  TestTube,
  Pill,
  CreditCard,
  ArrowLeft,
  Printer,
  CheckCircle,
  Search,
  Keyboard,
  Timer,
  Activity,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const FETCH_OPTS: RequestInit = { credentials: 'include', headers: { 'Content-Type': 'application/json' } };
async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, FETCH_OPTS);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return (json.data ?? json) as T;
}
async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { ...FETCH_OPTS, method: 'POST', body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return (json.data ?? json) as T;
}
import { format } from "date-fns";
import { id } from "date-fns/locale";
import simrsZenLogo from "@/assets/simrs-zen-logo.png";

type KioskStep = "home" | "service-select" | "patient-search" | "department-select" | "confirmation" | "ticket";

interface ServiceType {
  id: string;
  name: string;
  icon: React.ReactNode;
  code: string;
  description: string;
  gradient: string;
}

interface Department {
  id: string;
  department_name: string;
  department_code: string;
}

interface Patient {
  id: string;
  full_name: string;
  medical_record_number: string;
  nik: string | null;
  phone: string | null;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  doctors: { full_name: string } | null;
  departments: { department_name: string } | null;
}

const IDLE_TIMEOUT = 60000;

function KioskClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="text-center">
      <p className="text-6xl font-black tabular-nums tracking-tight text-white drop-shadow-lg">
        {time.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
      </p>
      <p className="text-lg text-white/80 font-medium mt-1">
        {time.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      </p>
    </div>
  );
}

function VirtualKeyboard({ searchQuery, setSearchQuery }: { searchQuery: string; setSearchQuery: (v: string | ((p: string) => string)) => void }) {
  const keys = [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Z", "X", "C", "V", "B", "N", "M", "⌫"],
  ];
  const handleKey = (key: string) => {
    if (key === "⌫") setSearchQuery((prev: string) => prev.slice(0, -1));
    else setSearchQuery((prev: string) => prev + key);
  };
  return (
    <div className="mt-4 p-5 bg-muted/80 backdrop-blur rounded-2xl shadow-inner">
      {keys.map((row, i) => (
        <div key={i} className="flex justify-center gap-1.5 mb-1.5">
          {row.map(key => (
            <Button key={key} variant="outline" className="w-14 h-14 text-xl font-bold rounded-xl shadow-sm hover:scale-105 transition-transform" onClick={() => handleKey(key)}>
              {key}
            </Button>
          ))}
        </div>
      ))}
      <div className="flex justify-center gap-2 mt-2">
        <Button variant="outline" className="w-64 h-14 rounded-xl text-lg" onClick={() => setSearchQuery((prev: string) => prev + " ")}>Spasi</Button>
        <Button variant="destructive" className="w-32 h-14 rounded-xl text-lg" onClick={() => setSearchQuery("")}>Hapus</Button>
      </div>
    </div>
  );
}

export default function Kiosk() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<KioskStep>("home");
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [generatedTicket, setGeneratedTicket] = useState<string | null>(null);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const services: ServiceType[] = [
    { id: "rawat_jalan", name: "Rawat Jalan", icon: <Stethoscope className="w-14 h-14" />, code: "RJ", description: "Poli Umum & Spesialis", gradient: "from-teal-500 to-cyan-500" },
    { id: "laboratorium", name: "Laboratorium", icon: <TestTube className="w-14 h-14" />, code: "LAB", description: "Pemeriksaan Lab", gradient: "from-blue-500 to-indigo-500" },
    { id: "farmasi", name: "Farmasi", icon: <Pill className="w-14 h-14" />, code: "FAR", description: "Pengambilan Obat", gradient: "from-emerald-500 to-green-500" },
    { id: "kasir", name: "Kasir / Billing", icon: <CreditCard className="w-14 h-14" />, code: "KSR", description: "Pembayaran", gradient: "from-amber-500 to-orange-500" },
    { id: "radiologi", name: "Radiologi", icon: <Activity className="w-14 h-14" />, code: "RAD", description: "X-Ray, USG, CT-Scan", gradient: "from-purple-500 to-pink-500" },
  ];

  // Fetch departments
  const { data: departments = [] } = useQuery({
    queryKey: ["kiosk-departments"],
    queryFn: () => apiFetch<Department[]>('/admin/departments?is_active=true'),
  });

  // Search patients
  const { data: patients = [], isLoading: searchingPatients } = useQuery({
    queryKey: ["kiosk-patient-search", searchQuery],
    queryFn: () => apiFetch<Patient[]>(`/patients?search=${encodeURIComponent(searchQuery)}&limit=10`),
    enabled: searchQuery.length >= 3,
  });

  // Get today's appointments
  const { data: appointments = [] } = useQuery({
    queryKey: ["kiosk-appointments", selectedPatient?.id],
    queryFn: () => apiFetch<Appointment[]>(`/queue/appointments?patient_id=${selectedPatient!.id}`),
    enabled: !!selectedPatient,
  });

  // Generate queue ticket
  const generateTicket = useMutation({
    mutationFn: () => {
      if (!selectedPatient || !selectedService) throw new Error("Data tidak lengkap");
      return apiPost<{ ticket_number: string }>('/queue', {
        patient_id: selectedPatient.id,
        department_id: selectedDepartment?.id || null,
        service_type: selectedService.id,
      });
    },
    onSuccess: (data) => {
      setGeneratedTicket(data.ticket_number);
      setStep("ticket");
      queryClient.invalidateQueries({ queryKey: ["queue-tickets"] });
    },
  });

  // Check-in appointment
  const checkInAppointment = useMutation({
    mutationFn: (appointmentId: string) =>
      apiPost<{ ticket_number: string }>(`/queue/checkin/${appointmentId}`, {}),
    onSuccess: (data) => {
      setGeneratedTicket(data.ticket_number);
      setStep("ticket");
      queryClient.invalidateQueries({ queryKey: ["queue-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["kiosk-appointments"] });
    },
  });

  // Idle timer
  const resetIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (step !== "home") {
      idleTimerRef.current = setTimeout(() => resetKiosk(), IDLE_TIMEOUT);
    }
  };

  const resetKiosk = () => {
    setStep("home");
    setSelectedService(null);
    setSelectedDepartment(null);
    setSelectedPatient(null);
    setSearchQuery("");
    setGeneratedTicket(null);
    setShowKeyboard(false);
  };

  useEffect(() => {
    const handleInteraction = () => resetIdleTimer();
    window.addEventListener("click", handleInteraction);
    window.addEventListener("touchstart", handleInteraction);
    window.addEventListener("keydown", handleInteraction);
    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [step]);

  const handleServiceSelect = (service: ServiceType) => { setSelectedService(service); setStep("patient-search"); };
  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setStep(selectedService?.id === "rawat_jalan" ? "department-select" : "confirmation");
  };
  const handleDepartmentSelect = (dept: Department) => { setSelectedDepartment(dept); setStep("confirmation"); };
  const handleConfirm = () => { generateTicket.mutate(); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 via-teal-800 to-cyan-900 flex flex-col">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/10 p-5 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="bg-white rounded-xl p-2 shadow-lg">
            <img src={simrsZenLogo} alt="SIMRS ZEN" className="h-14 w-auto" />
          </div>
          <div className="text-white">
            <h1 className="text-3xl font-black tracking-tight">Self-Service Kiosk</h1>
            <p className="text-white/70 text-sm">SIMRS ZEN — Cepat, Tepat, Nyaman & Mudah</p>
          </div>
        </div>
        <KioskClock />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {step !== "home" && step !== "ticket" && (
          <Button variant="ghost" size="lg" className="mb-6 text-white hover:bg-white/10 text-lg" onClick={() => {
            if (step === "patient-search") setStep("home");
            else if (step === "department-select") setStep("patient-search");
            else if (step === "confirmation") setStep(selectedService?.id === "rawat_jalan" ? "department-select" : "patient-search");
          }}>
            <ArrowLeft className="w-6 h-6 mr-2" /> Kembali
          </Button>
        )}

        {/* HOME */}
        {step === "home" && (
          <div className="max-w-5xl mx-auto text-center animate-fade-in">
            <div className="mb-14">
              <h2 className="text-5xl font-black text-white mb-3 drop-shadow-lg">Selamat Datang</h2>
              <p className="text-2xl text-white/70">Silakan pilih layanan yang Anda butuhkan</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {services.map(service => (
                <button
                  key={service.id}
                  className={`group relative bg-gradient-to-br ${service.gradient} rounded-3xl p-8 text-white text-center shadow-xl hover:shadow-2xl hover:scale-[1.04] active:scale-[0.98] transition-all duration-200 cursor-pointer border border-white/10`}
                  onClick={() => handleServiceSelect(service)}
                >
                  <div className="mb-4 flex justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                    {service.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-1">{service.name}</h3>
                  <p className="text-sm opacity-80">{service.description}</p>
                </button>
              ))}
              <button
                className="group relative bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl p-8 text-white text-center shadow-xl hover:shadow-2xl hover:scale-[1.04] active:scale-[0.98] transition-all duration-200 cursor-pointer border border-white/10"
                onClick={() => {
                  setSelectedService({ id: "checkin", name: "Check-in Booking", icon: <Calendar />, code: "CHK", description: "Sudah punya jadwal", gradient: "from-rose-500 to-pink-600" });
                  setStep("patient-search");
                }}
              >
                <div className="mb-4 flex justify-center opacity-90 group-hover:opacity-100">
                  <Calendar className="w-14 h-14" />
                </div>
                <h3 className="text-2xl font-bold mb-1">Check-in Booking</h3>
                <p className="text-sm opacity-80">Sudah punya jadwal? Check-in di sini</p>
              </button>
            </div>
          </div>
        )}

        {/* PATIENT SEARCH */}
        {step === "patient-search" && (
          <div className="max-w-3xl mx-auto animate-fade-in">
            <Card className="rounded-3xl shadow-2xl border-0 overflow-hidden">
              <CardHeader className="text-center bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 pb-4">
                <CardTitle className="text-3xl">Cari Data Pasien</CardTitle>
                <CardDescription className="text-lg">Masukkan No. RM, NIK, atau No. HP</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 p-6">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
                    <Input type="text" placeholder="Ketik No. RM / NIK / No. HP..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-14 h-16 text-xl rounded-2xl" autoFocus />
                  </div>
                  <Button variant="outline" className="h-16 w-16 rounded-2xl" onClick={() => setShowKeyboard(!showKeyboard)}>
                    <Keyboard className="w-8 h-8" />
                  </Button>
                </div>
                {showKeyboard && <VirtualKeyboard searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}
                {searchingPatients && (
                  <div className="text-center py-8">
                    <div className="animate-spin w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full mx-auto" />
                    <p className="mt-3 text-muted-foreground">Mencari pasien...</p>
                  </div>
                )}
                {!searchingPatients && searchQuery.length >= 3 && patients.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-xl">Pasien tidak ditemukan</p>
                    <p>Silakan hubungi petugas pendaftaran</p>
                  </div>
                )}
                {patients.length > 0 && (
                  <div className="space-y-2.5">
                    {patients.map(patient => (
                      <Card key={patient.id} className="cursor-pointer hover:shadow-lg hover:border-teal-400 transition-all rounded-2xl" onClick={() => handlePatientSelect(patient)}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <p className="text-xl font-bold">{patient.full_name}</p>
                            <div className="flex gap-4 text-muted-foreground text-sm">
                              <span>RM: {patient.medical_record_number}</span>
                              {patient.nik && <span>NIK: {patient.nik.slice(0, 6)}****</span>}
                            </div>
                          </div>
                          <Badge className="bg-teal-500 hover:bg-teal-600 text-white text-lg px-5 py-2 rounded-xl">Pilih</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* DEPARTMENT SELECT */}
        {step === "department-select" && (
          <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white">Pilih Poli / Unit</h2>
              <p className="text-xl text-white/70 mt-2">Pasien: <span className="font-semibold text-white">{selectedPatient?.full_name}</span></p>
            </div>
            {selectedService?.id === "checkin" && appointments.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-center text-white mb-4">Jadwal Booking Hari Ini</h3>
                {appointments.map(apt => (
                  <Card key={apt.id} className="cursor-pointer hover:shadow-lg hover:border-teal-400 transition-all rounded-2xl" onClick={() => checkInAppointment.mutate(apt.id)}>
                    <CardContent className="p-6 flex items-center justify-between">
                      <div>
                        <p className="text-xl font-bold">{apt.departments?.department_name || "Poli"}</p>
                        <p className="text-muted-foreground">Dokter: {apt.doctors?.full_name || "-"} | Jam: {apt.appointment_time}</p>
                      </div>
                      <Button size="lg" className="rounded-xl bg-teal-500 hover:bg-teal-600">
                        <CheckCircle className="w-5 h-5 mr-2" /> Check-in
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : selectedService?.id === "checkin" ? (
              <Card className="rounded-2xl"><CardContent className="p-8 text-center">
                <p className="text-xl text-muted-foreground">Tidak ada jadwal booking untuk hari ini</p>
                <Button className="mt-4 rounded-xl" onClick={() => setStep("home")}>Kembali ke Beranda</Button>
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {departments.map(dept => (
                  <button key={dept.id} className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 text-center text-white hover:bg-white/20 hover:scale-[1.03] transition-all cursor-pointer" onClick={() => handleDepartmentSelect(dept)}>
                    <h3 className="text-lg font-bold">{dept.department_name}</h3>
                    <Badge className="mt-2 bg-white/20 text-white border-white/30">{dept.department_code}</Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CONFIRMATION */}
        {step === "confirmation" && (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <Card className="rounded-3xl shadow-2xl border-0 overflow-hidden">
              <CardHeader className="text-center bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30">
                <CardTitle className="text-3xl">Konfirmasi Antrian</CardTitle>
                <CardDescription className="text-lg">Pastikan data sudah benar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="bg-muted/50 p-6 rounded-2xl space-y-4">
                  {[
                    ["Nama Pasien", selectedPatient?.full_name],
                    ["No. RM", selectedPatient?.medical_record_number],
                    ["Layanan", selectedService?.name],
                    ...(selectedDepartment ? [["Poli/Unit", selectedDepartment.department_name]] : []),
                    ["Tanggal", format(new Date(), "dd MMMM yyyy", { locale: id })],
                  ].map(([label, val]) => (
                    <div key={label as string} className="flex justify-between text-lg">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-bold">{val}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4">
                  <Button variant="outline" size="lg" className="flex-1 h-16 text-lg rounded-2xl" onClick={() => setStep("home")}>Batal</Button>
                  <Button size="lg" className="flex-1 h-16 text-lg rounded-2xl bg-teal-600 hover:bg-teal-700" onClick={handleConfirm} disabled={generateTicket.isPending}>
                    {generateTicket.isPending ? "Memproses..." : "Ambil Nomor Antrian"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TICKET */}
        {step === "ticket" && generatedTicket && (
          <div className="max-w-2xl mx-auto text-center animate-fade-in print:p-0">
            <Card className="rounded-3xl shadow-2xl border-0 overflow-hidden print:shadow-none print:border-2 print:border-black print:rounded-none">
              <CardContent className="p-10">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5 print:hidden">
                  <CheckCircle className="w-12 h-12 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Nomor Antrian Anda</h2>
                <div className="my-8 py-10 px-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-3xl shadow-xl print:bg-white print:border-4 print:border-teal-600 print:rounded-none">
                  <p className="text-8xl font-black text-white tracking-wider print:text-teal-600">{generatedTicket}</p>
                </div>
                <div className="text-left bg-muted/50 p-5 rounded-2xl mb-6 space-y-1.5 print:bg-white print:border print:rounded-none">
                  <p><strong>Nama:</strong> {selectedPatient?.full_name}</p>
                  <p><strong>No. RM:</strong> {selectedPatient?.medical_record_number}</p>
                  <p><strong>Layanan:</strong> {selectedService?.name}</p>
                  {selectedDepartment && <p><strong>Poli:</strong> {selectedDepartment.department_name}</p>}
                  <p><strong>Tanggal:</strong> {format(new Date(), "dd MMMM yyyy HH:mm", { locale: id })}</p>
                </div>
                <p className="text-muted-foreground mb-6 print:hidden">Silakan menunggu nomor antrian Anda dipanggil</p>
                <div className="flex gap-4 print:hidden">
                  <Button variant="outline" size="lg" className="flex-1 h-16 text-lg rounded-2xl" onClick={() => window.print()}>
                    <Printer className="w-6 h-6 mr-2" /> Cetak Tiket
                  </Button>
                  <Button size="lg" className="flex-1 h-16 text-lg rounded-2xl bg-teal-600 hover:bg-teal-700" onClick={resetKiosk}>Selesai</Button>
                </div>
              </CardContent>
            </Card>
            <p className="text-white/60 mt-5 print:hidden">
              <Timer className="w-4 h-4 inline mr-1" /> Layar akan kembali ke beranda dalam 60 detik
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white/5 backdrop-blur border-t border-white/10 p-4 print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-white/60 text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> (0271) 637415</div>
            <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> info@simrszen.id</div>
          </div>
          <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Jl. Kolonel Sutarto No.132, Jebres, Surakarta</div>
        </div>
      </div>
    </div>
  );
}

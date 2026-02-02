import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  QrCode,
  Keyboard,
  Timer,
  Activity
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import zenLogo from "@/assets/zen-logo.png";

type KioskStep = "home" | "service-select" | "patient-search" | "department-select" | "confirmation" | "ticket";

interface ServiceType {
  id: string;
  name: string;
  icon: React.ReactNode;
  code: string;
  description: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
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
  doctors: {
    full_name: string;
  } | null;
  departments: {
    name: string;
  } | null;
}

const IDLE_TIMEOUT = 60000; // 60 seconds idle timeout

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
    { id: "rawat_jalan", name: "Rawat Jalan", icon: <Stethoscope className="w-12 h-12" />, code: "RJ", description: "Poli Umum & Spesialis" },
    { id: "laboratorium", name: "Laboratorium", icon: <TestTube className="w-12 h-12" />, code: "LAB", description: "Pemeriksaan Lab" },
    { id: "farmasi", name: "Farmasi", icon: <Pill className="w-12 h-12" />, code: "FAR", description: "Pengambilan Obat" },
    { id: "kasir", name: "Kasir / Billing", icon: <CreditCard className="w-12 h-12" />, code: "KSR", description: "Pembayaran" },
    { id: "radiologi", name: "Radiologi", icon: <Activity className="w-12 h-12" />, code: "RAD", description: "X-Ray, USG, CT-Scan" },
  ];

  // Fetch departments
  const { data: departments = [] } = useQuery({
    queryKey: ["kiosk-departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("id, name, code")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Department[];
    },
  });

  // Search patients
  const { data: patients = [], isLoading: searchingPatients } = useQuery({
    queryKey: ["kiosk-patient-search", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 3) return [];
      const { data, error } = await supabase
        .from("patients")
        .select("id, full_name, medical_record_number, nik, phone")
        .or(`medical_record_number.ilike.%${searchQuery}%,nik.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
        .limit(10);
      if (error) throw error;
      return data as Patient[];
    },
    enabled: searchQuery.length >= 3,
  });

  // Get today's appointments for selected patient
  const { data: appointments = [] } = useQuery({
    queryKey: ["kiosk-appointments", selectedPatient?.id],
    queryFn: async () => {
      if (!selectedPatient) return [];
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          doctors (full_name),
          departments (name)
        `)
        .eq("patient_id", selectedPatient.id)
        .eq("appointment_date", today)
        .in("status", ["confirmed", "scheduled"]);
      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!selectedPatient,
  });

  // Generate queue ticket
  const generateTicket = useMutation({
    mutationFn: async () => {
      if (!selectedPatient || !selectedService) throw new Error("Data tidak lengkap");

      const today = new Date().toISOString().split("T")[0];
      
      // Get current max ticket number for this service today
      const { data: existingTickets } = await supabase
        .from("queue_tickets")
        .select("ticket_number")
        .eq("queue_date", today)
        .eq("service_type", selectedService.id)
        .order("created_at", { ascending: false })
        .limit(1);

      let nextNumber = 1;
      if (existingTickets && existingTickets.length > 0) {
        const lastTicket = existingTickets[0].ticket_number;
        const lastNum = parseInt(lastTicket.replace(/\D/g, "")) || 0;
        nextNumber = lastNum + 1;
      }

      const ticketNumber = `${selectedService.code}${String(nextNumber).padStart(3, "0")}`;

      const { error } = await supabase.from("queue_tickets").insert({
        ticket_number: ticketNumber,
        patient_id: selectedPatient.id,
        department_id: selectedDepartment?.id || null,
        service_type: selectedService.id,
        queue_date: today,
        status: "waiting",
        priority: 0,
      });

      if (error) throw error;
      return ticketNumber;
    },
    onSuccess: (ticketNumber) => {
      setGeneratedTicket(ticketNumber);
      setStep("ticket");
      queryClient.invalidateQueries({ queryKey: ["queue-tickets"] });
    },
  });

  // Check-in appointment
  const checkInAppointment = useMutation({
    mutationFn: async (appointmentId: string) => {
      const appointment = appointments.find(a => a.id === appointmentId);
      if (!appointment || !selectedPatient) throw new Error("Data tidak ditemukan");

      const today = new Date().toISOString().split("T")[0];
      
      // Get current max ticket number
      const { data: existingTickets } = await supabase
        .from("queue_tickets")
        .select("ticket_number")
        .eq("queue_date", today)
        .eq("service_type", "rawat_jalan")
        .order("created_at", { ascending: false })
        .limit(1);

      let nextNumber = 1;
      if (existingTickets && existingTickets.length > 0) {
        const lastTicket = existingTickets[0].ticket_number;
        const lastNum = parseInt(lastTicket.replace(/\D/g, "")) || 0;
        nextNumber = lastNum + 1;
      }

      const ticketNumber = `RJ${String(nextNumber).padStart(3, "0")}`;

      // Create queue ticket
      const { error: queueError } = await supabase.from("queue_tickets").insert({
        ticket_number: ticketNumber,
        patient_id: selectedPatient.id,
        service_type: "rawat_jalan",
        queue_date: today,
        status: "waiting",
        priority: 1, // Appointment has priority
        notes: `Check-in dari booking - ${appointment.doctors?.full_name || ""}`,
      });

      if (queueError) throw queueError;

      // Update appointment status
      await supabase
        .from("appointments")
        .update({ status: "checked_in" })
        .eq("id", appointmentId);

      return ticketNumber;
    },
    onSuccess: (ticketNumber) => {
      setGeneratedTicket(ticketNumber);
      setStep("ticket");
      queryClient.invalidateQueries({ queryKey: ["queue-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["kiosk-appointments"] });
    },
  });

  // Idle timer reset
  const resetIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (step !== "home") {
      idleTimerRef.current = setTimeout(() => {
        resetKiosk();
      }, IDLE_TIMEOUT);
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

  const handleServiceSelect = (service: ServiceType) => {
    setSelectedService(service);
    setStep("patient-search");
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    if (selectedService?.id === "rawat_jalan") {
      setStep("department-select");
    } else {
      setStep("confirmation");
    }
  };

  const handleDepartmentSelect = (dept: Department) => {
    setSelectedDepartment(dept);
    setStep("confirmation");
  };

  const handleConfirm = () => {
    generateTicket.mutate();
  };

  const printTicket = () => {
    window.print();
  };

  // Virtual keyboard
  const VirtualKeyboard = () => {
    const keys = [
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
      ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
      ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
      ["Z", "X", "C", "V", "B", "N", "M", "⌫"],
    ];

    const handleKey = (key: string) => {
      if (key === "⌫") {
        setSearchQuery(prev => prev.slice(0, -1));
      } else {
        setSearchQuery(prev => prev + key);
      }
    };

    return (
      <div className="mt-4 p-4 bg-muted rounded-lg">
        {keys.map((row, i) => (
          <div key={i} className="flex justify-center gap-2 mb-2">
            {row.map(key => (
              <Button
                key={key}
                variant="outline"
                size="lg"
                className="w-14 h-14 text-xl font-bold"
                onClick={() => handleKey(key)}
              >
                {key}
              </Button>
            ))}
          </div>
        ))}
        <div className="flex justify-center gap-2 mt-2">
          <Button
            variant="outline"
            size="lg"
            className="w-64 h-14"
            onClick={() => setSearchQuery(prev => prev + " ")}
          >
            Space
          </Button>
          <Button
            variant="destructive"
            size="lg"
            className="w-32 h-14"
            onClick={() => setSearchQuery("")}
          >
            Clear
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex flex-col">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <img src={zenLogo} alt="Logo" className="h-12 w-auto" />
          <div>
            <h1 className="text-2xl font-bold">Self-Service Kiosk</h1>
            <p className="text-primary-foreground/80">Layanan Mandiri Pasien</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold">{format(new Date(), "EEEE, dd MMMM yyyy", { locale: id })}</p>
          <p className="text-2xl font-bold">{format(new Date(), "HH:mm")}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {step !== "home" && step !== "ticket" && (
          <Button
            variant="ghost"
            size="lg"
            className="mb-4"
            onClick={() => {
              if (step === "patient-search") setStep("home");
              else if (step === "department-select") setStep("patient-search");
              else if (step === "confirmation") {
                if (selectedService?.id === "rawat_jalan") setStep("department-select");
                else setStep("patient-search");
              }
            }}
          >
            <ArrowLeft className="w-6 h-6 mr-2" />
            Kembali
          </Button>
        )}

        {/* Step: Home */}
        {step === "home" && (
          <div className="max-w-5xl mx-auto text-center">
            <div className="mb-12">
              <h2 className="text-5xl font-bold mb-4">Selamat Datang</h2>
              <p className="text-2xl text-muted-foreground">Silakan pilih layanan yang Anda butuhkan</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {services.map(service => (
                <Card
                  key={service.id}
                  className="cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-200 border-2 hover:border-primary"
                  onClick={() => handleServiceSelect(service)}
                >
                  <CardContent className="p-8 text-center">
                    <div className="text-primary mb-4 flex justify-center">
                      {service.icon}
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{service.name}</h3>
                    <p className="text-muted-foreground">{service.description}</p>
                  </CardContent>
                </Card>
              ))}
              
              {/* Check-in Booking */}
              <Card
                className="cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-200 border-2 hover:border-accent bg-accent/10"
                onClick={() => {
                  setSelectedService({ id: "checkin", name: "Check-in Booking", icon: <Calendar />, code: "CHK", description: "" });
                  setStep("patient-search");
                }}
              >
                <CardContent className="p-8 text-center">
                  <div className="text-accent-foreground mb-4 flex justify-center">
                    <Calendar className="w-12 h-12" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Check-in Booking</h3>
                  <p className="text-muted-foreground">Sudah punya jadwal? Check-in di sini</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Step: Patient Search */}
        {step === "patient-search" && (
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-3xl">Cari Data Pasien</CardTitle>
                <CardDescription className="text-lg">
                  Masukkan No. RM, NIK, atau No. HP
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Ketik No. RM / NIK / No. HP..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-14 h-16 text-xl"
                      autoFocus
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-16 w-16"
                    onClick={() => setShowKeyboard(!showKeyboard)}
                  >
                    <Keyboard className="w-8 h-8" />
                  </Button>
                </div>

                {showKeyboard && <VirtualKeyboard />}

                {searchingPatients && (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                    <p className="mt-2 text-muted-foreground">Mencari pasien...</p>
                  </div>
                )}

                {!searchingPatients && searchQuery.length >= 3 && patients.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-xl">Pasien tidak ditemukan</p>
                    <p>Silakan hubungi petugas pendaftaran</p>
                  </div>
                )}

                {patients.length > 0 && (
                  <div className="space-y-3">
                    {patients.map(patient => (
                      <Card
                        key={patient.id}
                        className="cursor-pointer hover:shadow-lg hover:border-primary transition-all"
                        onClick={() => handlePatientSelect(patient)}
                      >
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <p className="text-xl font-bold">{patient.full_name}</p>
                            <div className="flex gap-4 text-muted-foreground">
                              <span>RM: {patient.medical_record_number}</span>
                              {patient.nik && <span>NIK: {patient.nik.slice(0, 6)}****</span>}
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-lg px-4 py-2">Pilih</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step: Department Select (for Rawat Jalan) */}
        {step === "department-select" && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold">Pilih Poli / Unit</h2>
              <p className="text-xl text-muted-foreground mt-2">
                Pasien: <span className="font-semibold">{selectedPatient?.full_name}</span>
              </p>
            </div>

            {/* Check if patient has appointments today */}
            {selectedService?.id === "checkin" && appointments.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-center mb-4">Jadwal Booking Hari Ini</h3>
                {appointments.map(apt => (
                  <Card
                    key={apt.id}
                    className="cursor-pointer hover:shadow-lg hover:border-primary transition-all"
                    onClick={() => checkInAppointment.mutate(apt.id)}
                  >
                    <CardContent className="p-6 flex items-center justify-between">
                      <div>
                        <p className="text-xl font-bold">{apt.departments?.name || "Poli"}</p>
                        <p className="text-muted-foreground">
                          Dokter: {apt.doctors?.full_name || "-"} | Jam: {apt.appointment_time}
                        </p>
                      </div>
                      <Button size="lg">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Check-in
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : selectedService?.id === "checkin" ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-xl text-muted-foreground">Tidak ada jadwal booking untuk hari ini</p>
                  <Button className="mt-4" onClick={() => setStep("home")}>
                    Kembali ke Beranda
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {departments.map(dept => (
                  <Card
                    key={dept.id}
                    className="cursor-pointer hover:shadow-lg hover:border-primary transition-all"
                    onClick={() => handleDepartmentSelect(dept)}
                  >
                    <CardContent className="p-6 text-center">
                      <h3 className="text-lg font-bold">{dept.name}</h3>
                      <Badge variant="secondary" className="mt-2">{dept.code}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step: Confirmation */}
        {step === "confirmation" && (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-3xl">Konfirmasi Antrian</CardTitle>
                <CardDescription className="text-lg">Pastikan data sudah benar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted p-6 rounded-lg space-y-4">
                  <div className="flex justify-between text-lg">
                    <span className="text-muted-foreground">Nama Pasien:</span>
                    <span className="font-bold">{selectedPatient?.full_name}</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="text-muted-foreground">No. RM:</span>
                    <span className="font-bold">{selectedPatient?.medical_record_number}</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="text-muted-foreground">Layanan:</span>
                    <span className="font-bold">{selectedService?.name}</span>
                  </div>
                  {selectedDepartment && (
                    <div className="flex justify-between text-lg">
                      <span className="text-muted-foreground">Poli/Unit:</span>
                      <span className="font-bold">{selectedDepartment.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg">
                    <span className="text-muted-foreground">Tanggal:</span>
                    <span className="font-bold">{format(new Date(), "dd MMMM yyyy", { locale: id })}</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 h-16 text-lg"
                    onClick={() => setStep("home")}
                  >
                    Batal
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1 h-16 text-lg"
                    onClick={handleConfirm}
                    disabled={generateTicket.isPending}
                  >
                    {generateTicket.isPending ? "Memproses..." : "Ambil Nomor Antrian"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step: Ticket Display */}
        {step === "ticket" && generatedTicket && (
          <div className="max-w-2xl mx-auto text-center print:p-0">
            <Card className="print:shadow-none print:border-2 print:border-black">
              <CardContent className="p-8">
                <CheckCircle className="w-20 h-20 text-primary mx-auto mb-4 print:hidden" />
                <h2 className="text-2xl font-bold mb-2">Nomor Antrian Anda</h2>
                
                <div className="my-8 p-8 bg-primary/10 rounded-xl print:bg-white print:border-4 print:border-primary">
                  <p className="text-8xl font-black text-primary">{generatedTicket}</p>
                </div>

                <div className="text-left bg-muted p-4 rounded-lg mb-6 print:bg-white print:border">
                  <p><strong>Nama:</strong> {selectedPatient?.full_name}</p>
                  <p><strong>No. RM:</strong> {selectedPatient?.medical_record_number}</p>
                  <p><strong>Layanan:</strong> {selectedService?.name}</p>
                  {selectedDepartment && <p><strong>Poli:</strong> {selectedDepartment.name}</p>}
                  <p><strong>Tanggal:</strong> {format(new Date(), "dd MMMM yyyy HH:mm", { locale: id })}</p>
                </div>

                <p className="text-muted-foreground mb-6 print:hidden">
                  Silakan menunggu nomor antrian Anda dipanggil
                </p>

                <div className="flex gap-4 print:hidden">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 h-16 text-lg"
                    onClick={printTicket}
                  >
                    <Printer className="w-6 h-6 mr-2" />
                    Cetak Tiket
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1 h-16 text-lg"
                    onClick={resetKiosk}
                  >
                    Selesai
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Auto reset after 30 seconds */}
            <p className="text-muted-foreground mt-4 print:hidden">
              <Timer className="w-4 h-4 inline mr-1" />
              Layar akan kembali ke beranda dalam 60 detik
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-muted p-4 text-center text-muted-foreground print:hidden">
        <p>Butuh bantuan? Hubungi petugas terdekat atau tekan tombol bantuan</p>
      </div>
    </div>
  );
}

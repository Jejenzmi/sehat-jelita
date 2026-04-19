import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, Clock, User, Plus, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, addDays, isBefore, startOfToday } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  chief_complaint: string | null;
  notes: string | null;
  doctor: {
    full_name: string;
    specialization: string | null;
  } | null;
  department: {
    name: string;
  } | null;
}

interface Doctor {
  id: string;
  full_name: string;
  specialization: string | null;
  department: {
    id: string;
    name: string;
  } | null;
}

export default function PatientAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);

  // Booking form state
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [complaint, setComplaint] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00"
  ];

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Get patient ID
      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (patient) {
        setPatientId(patient.id);

        // Fetch appointments
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from("appointments")
          .select(`
            id,
            appointment_date,
            appointment_time,
            status,
            chief_complaint,
            notes,
            doctor:doctor_id (
              full_name,
              specialization
            ),
            department:department_id (
              name
            )
          `)
          .eq("patient_id", patient.id)
          .order("appointment_date", { ascending: false });

        if (appointmentsError) throw appointmentsError;
        setAppointments(appointmentsData || []);
      }

      // Fetch doctors
      const { data: doctorsData } = await supabase
        .from("doctors")
        .select(`
          id,
          full_name,
          specialization,
          department:department_id (
            id,
            name
          )
        `)
        .eq("is_active", true);

      setDoctors(doctorsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime || !complaint) {
      toast.error("Mohon lengkapi semua field");
      return;
    }

    if (!patientId) {
      toast.error("Data pasien tidak ditemukan");
      return;
    }

    setIsSubmitting(true);

    try {
      const doctor = doctors.find(d => d.id === selectedDoctor);
      
      const { error } = await supabase
        .from("appointments")
        .insert({
          patient_id: patientId,
          doctor_id: selectedDoctor,
          department_id: doctor?.department?.id,
          appointment_date: format(selectedDate, "yyyy-MM-dd"),
          appointment_time: selectedTime,
          chief_complaint: complaint,
          status: "scheduled",
          booking_source: "patient_portal",
        });

      if (error) throw error;

      toast.success("Jadwal berhasil dibuat!");
      setShowBookingDialog(false);
      resetBookingForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Gagal membuat jadwal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetBookingForm = () => {
    setSelectedDoctor("");
    setSelectedDate(undefined);
    setSelectedTime("");
    setComplaint("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-500/10 text-blue-600"><Clock className="h-3 w-3 mr-1" />Terjadwal</Badge>;
      case "confirmed":
        return <Badge className="bg-green-500/10 text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Dikonfirmasi</Badge>;
      case "completed":
        return <Badge className="bg-green-500/10 text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Selesai</Badge>;
      case "cancelled":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Dibatalkan</Badge>;
      case "no_show":
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Tidak Hadir</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Jadwal Kunjungan</h2>
            <p className="text-sm text-muted-foreground">Kelola jadwal kunjungan Anda</p>
          </div>
          <Button onClick={() => setShowBookingDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Buat Jadwal
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {appointments.length === 0 ? (
              <div className="py-12 text-center">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Belum ada jadwal kunjungan</p>
                <Button className="mt-4" onClick={() => setShowBookingDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Jadwal Pertama
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="divide-y">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">
                              {appointment.doctor?.full_name}
                            </p>
                            {getStatusBadge(appointment.status)}
                          </div>
                          {appointment.doctor?.specialization && (
                            <p className="text-sm text-muted-foreground">
                              {appointment.doctor.specialization}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" />
                              {format(new Date(appointment.appointment_date), "d MMMM yyyy", { locale: id })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {appointment.appointment_time}
                            </span>
                          </div>
                          {appointment.chief_complaint && (
                            <p className="text-sm text-muted-foreground mt-2">
                              Keluhan: {appointment.chief_complaint}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Buat Jadwal Kunjungan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pilih Dokter</Label>
              <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih dokter..." />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      <div>
                        <p>{doctor.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {doctor.specialization} - {doctor.department?.name}
                        </p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tanggal Kunjungan</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "d MMMM yyyy", { locale: id }) : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => isBefore(date, startOfToday()) || date > addDays(new Date(), 30)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Waktu Kunjungan</Label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih waktu..." />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Keluhan</Label>
              <Textarea
                placeholder="Jelaskan keluhan Anda..."
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookingDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleBookAppointment} disabled={isSubmitting}>
              {isSubmitting ? "Memproses..." : "Buat Jadwal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

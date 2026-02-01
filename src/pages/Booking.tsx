import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CalendarDays, Clock, Plus, Search, User, Video, Phone, 
  CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight 
} from "lucide-react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { id } from "date-fns/locale";
import { useBookingData } from "@/hooks/useBookingData";

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", 
  "11:00", "11:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30"
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "scheduled":
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Terjadwal</Badge>;
    case "confirmed":
      return <Badge className="bg-blue-500"><CheckCircle className="w-3 h-3 mr-1" />Dikonfirmasi</Badge>;
    case "in_progress":
      return <Badge className="bg-yellow-500"><AlertCircle className="w-3 h-3 mr-1" />Berlangsung</Badge>;
    case "completed":
      return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Selesai</Badge>;
    case "cancelled":
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Dibatalkan</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getTypeBadge = (type: string) => {
  switch (type) {
    case "regular":
      return <Badge variant="outline"><User className="w-3 h-3 mr-1" />Reguler</Badge>;
    case "telemedicine":
      return <Badge variant="outline" className="bg-purple-50 text-purple-700"><Video className="w-3 h-3 mr-1" />Telemedicine</Badge>;
    case "follow_up":
      return <Badge variant="outline" className="bg-blue-50 text-blue-700"><Phone className="w-3 h-3 mr-1" />Kontrol</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
};

export default function Booking() {
  const {
    appointments,
    patients,
    doctors,
    schedules,
    stats,
    loading,
    fetchAppointments,
    searchPatients,
    createAppointment,
    confirmAppointment,
    cancelAppointment,
    getAvailableSlots,
  } = useBookingData();

  const [searchTerm, setSearchTerm] = useState("");
  const [patientSearchTerm, setPatientSearchTerm] = useState("");
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  const [newBooking, setNewBooking] = useState({
    patient_id: "",
    doctor_id: "",
    appointment_type: "regular",
    appointment_date: format(new Date(), "yyyy-MM-dd"),
    appointment_time: "",
    chief_complaint: "",
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const filteredAppointments = appointments.filter(apt =>
    (apt.patient?.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (apt.doctor?.full_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Search patients when typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (patientSearchTerm.length >= 2) {
        searchPatients(patientSearchTerm);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearchTerm]);

  // Get available slots when doctor or date changes
  useEffect(() => {
    const loadSlots = async () => {
      if (newBooking.doctor_id && newBooking.appointment_date) {
        const slots = await getAvailableSlots(
          newBooking.doctor_id, 
          new Date(newBooking.appointment_date)
        );
        setAvailableSlots(slots);
      }
    };
    loadSlots();
  }, [newBooking.doctor_id, newBooking.appointment_date]);

  const handleCreateBooking = async () => {
    try {
      await createAppointment({
        patient_id: newBooking.patient_id,
        doctor_id: newBooking.doctor_id,
        appointment_type: newBooking.appointment_type,
        appointment_date: newBooking.appointment_date,
        appointment_time: newBooking.appointment_time + ":00",
        chief_complaint: newBooking.chief_complaint || null,
        status: "scheduled",
        booking_source: "staff",
      });
      setIsDialogOpen(false);
      setNewBooking({
        patient_id: "",
        doctor_id: "",
        appointment_type: "regular",
        appointment_date: format(new Date(), "yyyy-MM-dd"),
        appointment_time: "",
        chief_complaint: "",
      });
      setPatientSearchTerm("");
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Booking & Appointment</h1>
          <p className="text-muted-foreground">Kelola jadwal dan booking pasien</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Booking Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Buat Booking Baru</DialogTitle>
                <DialogDescription>Daftarkan appointment pasien</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cari Pasien</Label>
                    <Input
                      placeholder="Cari nama/No.RM/NIK..."
                      value={patientSearchTerm}
                      onChange={(e) => setPatientSearchTerm(e.target.value)}
                    />
                    {patients.length > 0 && (
                      <ScrollArea className="h-32 border rounded-md">
                        {patients.map((patient) => (
                          <div
                            key={patient.id}
                            className={`p-2 cursor-pointer hover:bg-muted ${
                              newBooking.patient_id === patient.id ? "bg-primary/10" : ""
                            }`}
                            onClick={() => {
                              setNewBooking({ ...newBooking, patient_id: patient.id });
                              setPatientSearchTerm(patient.full_name);
                            }}
                          >
                            <p className="font-medium text-sm">{patient.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {patient.medical_record_number} • {patient.phone || "-"}
                            </p>
                          </div>
                        ))}
                      </ScrollArea>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Tipe Kunjungan</Label>
                    <Select
                      value={newBooking.appointment_type}
                      onValueChange={(value) => setNewBooking({ ...newBooking, appointment_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regular">Reguler (Tatap Muka)</SelectItem>
                        <SelectItem value="telemedicine">Telemedicine (Video Call)</SelectItem>
                        <SelectItem value="follow_up">Kontrol / Follow Up</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Dokter</Label>
                    <Select
                      value={newBooking.doctor_id}
                      onValueChange={(value) => setNewBooking({ ...newBooking, doctor_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih dokter" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map(doc => (
                          <SelectItem key={doc.id} value={doc.id}>
                            {doc.full_name} - {doc.specialization || "Umum"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tanggal</Label>
                    <Input 
                      type="date" 
                      value={newBooking.appointment_date}
                      onChange={(e) => setNewBooking({ ...newBooking, appointment_date: e.target.value })}
                      min={format(new Date(), "yyyy-MM-dd")}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Pilih Jam {availableSlots.length > 0 && `(${availableSlots.length} slot tersedia)`}</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {(availableSlots.length > 0 ? availableSlots : timeSlots).map(slot => (
                      <Button 
                        key={slot} 
                        variant={newBooking.appointment_time === slot ? "default" : "outline"} 
                        size="sm" 
                        className="text-xs"
                        onClick={() => setNewBooking({ ...newBooking, appointment_time: slot })}
                      >
                        {slot}
                      </Button>
                    ))}
                  </div>
                  {availableSlots.length === 0 && newBooking.doctor_id && (
                    <p className="text-xs text-muted-foreground">
                      Dokter tidak memiliki jadwal pada hari ini. Pilih tanggal lain.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Keluhan Utama</Label>
                  <Textarea 
                    placeholder="Deskripsikan keluhan pasien..."
                    value={newBooking.chief_complaint}
                    onChange={(e) => setNewBooking({ ...newBooking, chief_complaint: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                <Button 
                  onClick={handleCreateBooking}
                  disabled={!newBooking.patient_id || !newBooking.doctor_id || !newBooking.appointment_time}
                >
                  Simpan Booking
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hari Ini</p>
                <p className="text-2xl font-bold">{stats.today}</p>
              </div>
              <CalendarDays className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Menunggu Konfirmasi</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Telemedicine</p>
                <p className="text-2xl font-bold text-purple-600">{stats.telemedicine}</p>
              </div>
              <Video className="h-8 w-8 text-purple-600/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Selesai Hari Ini</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Daftar Booking</TabsTrigger>
          <TabsTrigger value="calendar">Kalender Dokter</TabsTrigger>
          <TabsTrigger value="schedule">Jadwal Praktek</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Daftar Appointment</CardTitle>
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input 
                    placeholder="Cari booking..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pasien</TableHead>
                      <TableHead>Dokter</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Jam</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAppointments.map((apt) => (
                      <TableRow key={apt.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{apt.patient?.full_name}</p>
                            <p className="text-xs text-muted-foreground">{apt.patient?.medical_record_number}</p>
                          </div>
                        </TableCell>
                        <TableCell>{apt.doctor?.full_name}</TableCell>
                        <TableCell>{format(new Date(apt.appointment_date), "dd MMM yyyy", { locale: id })}</TableCell>
                        <TableCell>{apt.appointment_time.substring(0, 5)}</TableCell>
                        <TableCell>{getTypeBadge(apt.appointment_type)}</TableCell>
                        <TableCell>{getStatusBadge(apt.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {apt.status === "scheduled" && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => confirmAppointment(apt.id)}>
                                  Konfirmasi
                                </Button>
                                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => cancelAppointment(apt.id)}>
                                  Batal
                                </Button>
                              </>
                            )}
                            {apt.appointment_type === "telemedicine" && apt.status === "confirmed" && (
                              <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                                <Video className="w-4 h-4 mr-1" />
                                Mulai
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredAppointments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Tidak ada appointment
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Kalender Mingguan</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, -7))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium px-4">
                    {format(weekStart, "d MMM", { locale: id })} - {format(addDays(weekStart, 6), "d MMM yyyy", { locale: id })}
                  </span>
                  <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, 7))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 bg-muted w-32">Dokter</th>
                      {weekDays.map((day, idx) => (
                        <th key={idx} className={`border p-2 text-center ${isSameDay(day, new Date()) ? "bg-primary/10" : "bg-muted"}`}>
                          <div className="text-xs text-muted-foreground">{format(day, "EEE", { locale: id })}</div>
                          <div className="font-bold">{format(day, "d")}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map(doctor => (
                      <tr key={doctor.id}>
                        <td className="border p-2">
                          <div className="font-medium text-sm">{doctor.full_name}</div>
                          <div className="text-xs text-muted-foreground">{doctor.specialization || "Umum"}</div>
                        </td>
                        {weekDays.map((day, idx) => (
                          <td key={idx} className="border p-1 align-top">
                            <div className="space-y-1">
                              {appointments
                                .filter(apt => apt.doctor_id === doctor.id && apt.appointment_date === format(day, "yyyy-MM-dd"))
                                .map(apt => (
                                  <div 
                                    key={apt.id} 
                                    className={`text-xs p-1 rounded cursor-pointer ${
                                      apt.appointment_type === "telemedicine" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                                    }`}
                                  >
                                    <div className="font-medium">{apt.appointment_time.substring(0, 5)}</div>
                                    <div className="truncate">{apt.patient?.full_name}</div>
                                  </div>
                                ))}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {doctors.map(doctor => {
              const doctorSchedules = schedules.filter(s => s.doctor_id === doctor.id);
              return (
                <Card key={doctor.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{doctor.full_name}</CardTitle>
                    <CardDescription>{doctor.specialization || "Umum"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"].map((day, idx) => {
                        const schedule = doctorSchedules.find(s => s.day_of_week === (idx + 1) % 7);
                        return (
                          <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                            <span className="text-sm font-medium w-20">{day}</span>
                            <div className="flex gap-2">
                              {schedule ? (
                                <Badge variant="outline">
                                  {schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {doctors.length === 0 && (
              <div className="col-span-2 text-center py-8 text-muted-foreground">
                Tidak ada data dokter
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

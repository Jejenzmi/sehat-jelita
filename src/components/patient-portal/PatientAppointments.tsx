import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, Clock, Plus, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  getAppointments, getDoctors, createAppointment, cancelAppointment,
  type Appointment, type Doctor,
} from "@/lib/patient-portal-api";
import { format, addDays, isBefore, startOfToday } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TIME_SLOTS = [
  "08:00","08:30","09:00","09:30","10:00","10:30",
  "11:00","11:30","13:00","13:30","14:00","14:30",
  "15:00","15:30","16:00",
];

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Booking form
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [complaint, setComplaint] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async (cursor?: string) => {
    try {
      const [aptsJson, doctorsData] = await Promise.all([
        getAppointments(undefined, cursor),
        doctors.length === 0 ? getDoctors() : Promise.resolve(doctors),
      ]);

      if (aptsJson.success) {
        if (cursor) {
          setAppointments(prev => [...prev, ...aptsJson.data]);
        } else {
          setAppointments(aptsJson.data);
        }
        setNextCursor(aptsJson.next_cursor || null);
      }
      if (!cursor) setDoctors(doctorsData);
    } catch {
      toast.error("Gagal memuat jadwal");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    fetchData(nextCursor);
  };

  const handleBook = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime || !complaint) {
      toast.error("Mohon lengkapi semua field");
      return;
    }
    setIsSubmitting(true);
    try {
      const doctor = doctors.find(d => d.id === selectedDoctor);
      await createAppointment({
        doctor_id: selectedDoctor,
        department_id: doctor?.department_id || undefined,
        appointment_date: format(selectedDate, "yyyy-MM-dd"),
        appointment_time: selectedTime,
        chief_complaint: complaint,
      });
      toast.success("Jadwal berhasil dibuat!");
      setShowBookingDialog(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat jadwal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (apId: string) => {
    try {
      await cancelAppointment(apId);
      toast.success("Jadwal berhasil dibatalkan");
      setAppointments(prev => prev.map(a => a.id === apId ? { ...a, status: "cancelled" } : a));
    } catch (err: any) {
      toast.error(err.message || "Gagal membatalkan jadwal");
    }
  };

  const resetForm = () => {
    setSelectedDoctor(""); setSelectedDate(undefined);
    setSelectedTime(""); setComplaint("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": case "scheduled":
        return <Badge className="bg-blue-500/10 text-blue-600"><Clock className="h-3 w-3 mr-1" />Terjadwal</Badge>;
      case "confirmed":
        return <Badge className="bg-green-500/10 text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Dikonfirmasi</Badge>;
      case "completed":
        return <Badge className="bg-green-500/10 text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Selesai</Badge>;
      case "cancelled":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Dibatalkan</Badge>;
      default:
        return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
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
                  {appointments.map(apt => (
                    <div key={apt.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{apt.doctors?.full_name}</p>
                            {getStatusBadge(apt.status)}
                          </div>
                          {apt.doctors?.specialization && (
                            <p className="text-sm text-muted-foreground">{apt.doctors.specialization}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" />
                              {format(new Date(apt.appointment_date), "d MMMM yyyy", { locale: id })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {apt.appointment_time}
                            </span>
                          </div>
                          {apt.chief_complaint && (
                            <p className="text-sm text-muted-foreground">Keluhan: {apt.chief_complaint}</p>
                          )}
                        </div>
                        {["pending", "confirmed", "scheduled"].includes(apt.status) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleCancel(apt.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Batalkan
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {nextCursor && (
                  <div className="p-4 text-center">
                    <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
                      {loadingMore ? "Memuat..." : "Muat lebih banyak"}
                    </Button>
                  </div>
                )}
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
                  {doctors.map(doc => (
                    <SelectItem key={doc.id} value={doc.id}>
                      <div>
                        <p>{doc.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.specialization}{doc.departments ? ` - ${doc.departments.name}` : ""}
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
                    className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
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
                    disabled={date => isBefore(date, startOfToday()) || date > addDays(new Date(), 30)}
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
                  {TIME_SLOTS.map(time => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Keluhan</Label>
              <Textarea
                placeholder="Jelaskan keluhan Anda..."
                value={complaint}
                onChange={e => setComplaint(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowBookingDialog(false); resetForm(); }}>
              Batal
            </Button>
            <Button onClick={handleBook} disabled={isSubmitting}>
              {isSubmitting ? "Memproses..." : "Buat Jadwal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

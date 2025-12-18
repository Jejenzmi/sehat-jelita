import { useState } from "react";
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
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CalendarDays, Clock, Plus, Search, User, Video, Phone, 
  CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight 
} from "lucide-react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { id } from "date-fns/locale";

// Sample data
const doctors = [
  { id: "1", name: "Dr. Budi Santoso", specialization: "Umum", schedule: ["08:00-12:00", "14:00-17:00"] },
  { id: "2", name: "Dr. Ani Wijaya", specialization: "Anak", schedule: ["09:00-13:00"] },
  { id: "3", name: "Dr. Cahyo Pratama", specialization: "Jantung", schedule: ["10:00-14:00"] },
  { id: "4", name: "Dr. Dewi Sartika", specialization: "Kandungan", schedule: ["08:00-11:00", "15:00-18:00"] },
];

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", 
  "11:00", "11:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30"
];

const appointments = [
  { id: "1", patient: "Ahmad Sulaiman", doctor: "Dr. Budi Santoso", date: "2024-01-15", time: "09:00", type: "regular", status: "confirmed" },
  { id: "2", patient: "Siti Rahmah", doctor: "Dr. Ani Wijaya", date: "2024-01-15", time: "10:00", type: "telemedicine", status: "scheduled" },
  { id: "3", patient: "Bambang Hermanto", doctor: "Dr. Cahyo Pratama", date: "2024-01-15", time: "11:00", type: "follow_up", status: "in_progress" },
  { id: "4", patient: "Dewi Lestari", doctor: "Dr. Dewi Sartika", date: "2024-01-16", time: "08:30", type: "regular", status: "scheduled" },
  { id: "5", patient: "Eko Prasetyo", doctor: "Dr. Budi Santoso", date: "2024-01-16", time: "14:00", type: "telemedicine", status: "confirmed" },
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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const filteredAppointments = appointments.filter(apt => 
    apt.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.doctor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Generate slot status for calendar view
  const getSlotStatus = (doctor: string, date: Date, time: string) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const apt = appointments.find(a => a.doctor === doctor && a.date === dateStr && a.time === time);
    if (apt) return apt.status;
    return "available";
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
          <Dialog>
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
                    <Label>Pasien</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih pasien" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="p1">Ahmad Sulaiman - RM-2024-000001</SelectItem>
                        <SelectItem value="p2">Siti Rahmah - RM-2024-000002</SelectItem>
                        <SelectItem value="p3">Bambang Hermanto - RM-2024-000003</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipe Kunjungan</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tipe" />
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
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih dokter" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map(doc => (
                          <SelectItem key={doc.id} value={doc.id}>{doc.name} - {doc.specialization}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tanggal</Label>
                    <Input type="date" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Pilih Jam</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {timeSlots.map(slot => (
                      <Button key={slot} variant="outline" size="sm" className="text-xs">
                        {slot}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Keluhan Utama</Label>
                  <Textarea placeholder="Deskripsikan keluhan pasien..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline">Batal</Button>
                <Button>Simpan Booking</Button>
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
                <p className="text-2xl font-bold">24</p>
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
                <p className="text-2xl font-bold text-yellow-600">8</p>
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
                <p className="text-2xl font-bold text-purple-600">6</p>
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
                <p className="text-2xl font-bold text-green-600">18</p>
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
                      <TableCell className="font-medium">{apt.patient}</TableCell>
                      <TableCell>{apt.doctor}</TableCell>
                      <TableCell>{apt.date}</TableCell>
                      <TableCell>{apt.time}</TableCell>
                      <TableCell>{getTypeBadge(apt.type)}</TableCell>
                      <TableCell>{getStatusBadge(apt.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {apt.status === "scheduled" && (
                            <Button size="sm" variant="outline">Konfirmasi</Button>
                          )}
                          {apt.type === "telemedicine" && apt.status === "confirmed" && (
                            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                              <Video className="w-4 h-4 mr-1" />
                              Mulai
                            </Button>
                          )}
                          <Button size="sm" variant="ghost">Detail</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                          <div className="font-medium text-sm">{doctor.name}</div>
                          <div className="text-xs text-muted-foreground">{doctor.specialization}</div>
                        </td>
                        {weekDays.map((day, idx) => (
                          <td key={idx} className="border p-1 align-top">
                            <div className="space-y-1">
                              {appointments
                                .filter(apt => apt.doctor === doctor.name && apt.date === format(day, "yyyy-MM-dd"))
                                .map(apt => (
                                  <div 
                                    key={apt.id} 
                                    className={`text-xs p-1 rounded cursor-pointer ${
                                      apt.type === "telemedicine" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                                    }`}
                                  >
                                    <div className="font-medium">{apt.time}</div>
                                    <div className="truncate">{apt.patient}</div>
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
            {doctors.map(doctor => (
              <Card key={doctor.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{doctor.name}</CardTitle>
                  <CardDescription>{doctor.specialization}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((day, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className="text-sm font-medium w-20">{day}</span>
                        <div className="flex gap-2">
                          {doctor.schedule.map((time, tidx) => (
                            <Badge key={tidx} variant="outline">{time}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4">Edit Jadwal</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

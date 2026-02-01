import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useAttendance, useEmployees, useAddAttendance } from "@/hooks/useHRData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Clock, Download } from "lucide-react";

export function AttendanceTab() {
  const [attendanceDate, setAttendanceDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const { data: attendance, isLoading } = useAttendance(attendanceDate);
  const { data: employees } = useEmployees();
  const addAttendance = useAddAttendance();

  const handleAddAttendance = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    addAttendance.mutate({
      employee_id: formData.get("employee_id") as string,
      attendance_date: formData.get("attendance_date") as string,
      check_in: formData.get("check_in") as string || undefined,
      check_out: formData.get("check_out") as string || undefined,
      status: formData.get("status") as string,
      notes: formData.get("notes") as string || undefined,
    }, {
      onSuccess: () => setIsAddOpen(false),
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge variant="default">Hadir</Badge>;
      case "late":
        return <Badge variant="secondary">Terlambat</Badge>;
      case "absent":
        return <Badge variant="destructive">Absen</Badge>;
      case "sick":
        return <Badge variant="outline">Sakit</Badge>;
      case "leave":
        return <Badge variant="outline">Cuti</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const exportToExcel = () => {
    // Simple CSV export
    if (!attendance || attendance.length === 0) return;
    
    const headers = ["NIP", "Nama", "Check In", "Check Out", "Status", "Keterangan"];
    const rows = attendance.map(att => [
      (att as any).employees?.employee_number || "",
      (att as any).employees?.full_name || "",
      att.check_in ? format(new Date(att.check_in), "HH:mm") : "-",
      att.check_out ? format(new Date(att.check_out), "HH:mm") : "-",
      att.status,
      att.notes || ""
    ]);
    
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `absensi-${attendanceDate}.csv`;
    a.click();
  };

  const activeEmployees = employees?.filter(e => e.status === "active");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Rekap Absensi
          </CardTitle>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="w-auto"
            />
            <Button variant="outline" size="icon" onClick={exportToExcel}>
              <Download className="h-4 w-4" />
            </Button>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Catat Absensi
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Catat Absensi Manual</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddAttendance} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="employee_id">Karyawan *</Label>
                    <Select name="employee_id" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Karyawan" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeEmployees?.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.employee_number} - {emp.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="attendance_date">Tanggal *</Label>
                    <Input 
                      id="attendance_date" 
                      name="attendance_date" 
                      type="date" 
                      defaultValue={attendanceDate}
                      required 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="check_in">Jam Masuk</Label>
                      <Input id="check_in" name="check_in" type="time" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="check_out">Jam Keluar</Label>
                      <Input id="check_out" name="check_out" type="time" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select name="status" defaultValue="present">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">Hadir</SelectItem>
                        <SelectItem value="late">Terlambat</SelectItem>
                        <SelectItem value="absent">Absen</SelectItem>
                        <SelectItem value="sick">Sakit</SelectItem>
                        <SelectItem value="leave">Cuti</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Keterangan</Label>
                    <Textarea id="notes" name="notes" rows={2} />
                  </div>
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={addAttendance.isPending}>
                      {addAttendance.isPending ? "Menyimpan..." : "Simpan"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NIP</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Keterangan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance?.map((att) => (
                <TableRow key={att.id}>
                  <TableCell className="font-mono text-sm">
                    {(att as any).employees?.employee_number}
                  </TableCell>
                  <TableCell className="font-medium">
                    {(att as any).employees?.full_name}
                  </TableCell>
                  <TableCell>
                    {att.check_in ? format(new Date(att.check_in), "HH:mm") : "-"}
                  </TableCell>
                  <TableCell>
                    {att.check_out ? format(new Date(att.check_out), "HH:mm") : "-"}
                  </TableCell>
                  <TableCell>{getStatusBadge(att.status)}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {att.notes || "-"}
                  </TableCell>
                </TableRow>
              ))}
              {attendance?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Tidak ada data absensi untuk tanggal {format(new Date(attendanceDate), "dd MMMM yyyy", { locale: id })}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

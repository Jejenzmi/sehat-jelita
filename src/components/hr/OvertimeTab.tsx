import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { 
  useOvertimeRecords, 
  useEmployees, 
  useAddOvertime,
  useUpdateOvertime,
  calculateOvertimeRate,
  OvertimeRecord
} from "@/hooks/useHRData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Clock, CheckCircle, XCircle } from "lucide-react";

export function OvertimeTab() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [overtimeType, setOvertimeType] = useState<'weekday' | 'weekend' | 'holiday'>('weekday');
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  
  const { data: overtimeRecords, isLoading } = useOvertimeRecords();
  const { data: employees } = useEmployees();
  const addOvertime = useAddOvertime();
  const updateOvertime = useUpdateOvertime();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateHours = () => {
    if (!startTime || !endTime) return 0;
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;
    const diff = endMinutes - startMinutes;
    return Math.max(0, diff / 60);
  };

  const calculateAmount = () => {
    const hours = calculateHours();
    const employee = employees?.find(e => e.id === selectedEmployee);
    if (!employee?.salary) return 0;
    
    const rate = calculateOvertimeRate(employee.salary, overtimeType);
    return Math.round(hours * rate);
  };

  const handleAddOvertime = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const employee = employees?.find(e => e.id === selectedEmployee);
    
    if (!employee?.salary) return;
    
    const hours = calculateHours();
    const rate = calculateOvertimeRate(employee.salary, overtimeType);
    
    addOvertime.mutate({
      employee_id: selectedEmployee,
      overtime_date: formData.get("overtime_date") as string,
      start_time: startTime,
      end_time: endTime,
      total_hours: hours,
      overtime_type: overtimeType,
      hourly_rate: rate,
      total_amount: calculateAmount(),
      notes: formData.get("notes") as string || undefined,
      status: "pending",
    }, {
      onSuccess: () => {
        setIsAddOpen(false);
        setSelectedEmployee("");
        setStartTime("");
        setEndTime("");
      },
    });
  };

  const handleApprove = (record: OvertimeRecord) => {
    updateOvertime.mutate({
      id: record.id,
      status: "approved",
      approved_at: new Date().toISOString(),
    });
  };

  const handleReject = (record: OvertimeRecord) => {
    updateOvertime.mutate({
      id: record.id,
      status: "rejected",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-blue-500">Disetujui</Badge>;
      case "rejected":
        return <Badge variant="destructive">Ditolak</Badge>;
      case "paid":
        return <Badge variant="default">Dibayar</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getOvertimeTypeLabel = (type: string) => {
    switch (type) {
      case "weekday":
        return "Hari Kerja";
      case "weekend":
        return "Akhir Pekan";
      case "holiday":
        return "Hari Libur";
      default:
        return type;
    }
  };

  const activeEmployees = employees?.filter(e => e.status === "active");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Lembur
            </CardTitle>
            <CardDescription>Kelola dan setujui pengajuan lembur karyawan</CardDescription>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Catat Lembur
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Catat Lembur</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddOvertime} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="employee_id">Karyawan *</Label>
                  <Select 
                    value={selectedEmployee} 
                    onValueChange={setSelectedEmployee}
                  >
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
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="overtime_date">Tanggal *</Label>
                    <Input 
                      id="overtime_date" 
                      name="overtime_date" 
                      type="date"
                      defaultValue={format(new Date(), "yyyy-MM-dd")}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="overtime_type">Jenis Lembur *</Label>
                    <Select 
                      value={overtimeType} 
                      onValueChange={(v) => setOvertimeType(v as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekday">Hari Kerja (1.5x)</SelectItem>
                        <SelectItem value="weekend">Akhir Pekan (2x)</SelectItem>
                        <SelectItem value="holiday">Hari Libur (3x)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Jam Mulai *</Label>
                    <Input 
                      id="start_time" 
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">Jam Selesai *</Label>
                    <Input 
                      id="end_time" 
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                {calculateHours() > 0 && selectedEmployee && (
                  <div className="bg-muted/50 p-3 rounded-lg text-sm">
                    <div className="flex justify-between">
                      <span>Durasi:</span>
                      <span className="font-medium">{calculateHours().toFixed(1)} jam</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimasi Upah Lembur:</span>
                      <span className="font-medium text-primary">{formatCurrency(calculateAmount())}</span>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Keterangan</Label>
                  <Textarea id="notes" name="notes" rows={2} />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={addOvertime.isPending || !selectedEmployee}>
                    {addOvertime.isPending ? "Menyimpan..." : "Simpan"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
                <TableHead>Karyawan</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead className="text-right">Durasi</TableHead>
                <TableHead className="text-right">Upah</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overtimeRecords?.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{(record.employees as any)?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(record.employees as any)?.employee_number}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(record.overtime_date), "dd MMM yyyy", { locale: id })}
                  </TableCell>
                  <TableCell>
                    {record.start_time.slice(0, 5)} - {record.end_time.slice(0, 5)}
                  </TableCell>
                  <TableCell>{getOvertimeTypeLabel(record.overtime_type)}</TableCell>
                  <TableCell className="text-right">{record.total_hours} jam</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(record.total_amount)}
                  </TableCell>
                  <TableCell>{getStatusBadge(record.status)}</TableCell>
                  <TableCell className="text-right">
                    {record.status === "pending" && (
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-green-600"
                          onClick={() => handleApprove(record)}
                          disabled={updateOvertime.isPending}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-600"
                          onClick={() => handleReject(record)}
                          disabled={updateOvertime.isPending}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {overtimeRecords?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Tidak ada data lembur
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

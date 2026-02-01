import { useState } from "react";
import { format, differenceInDays } from "date-fns";
import { id } from "date-fns/locale";
import { 
  useLeaveRequests, 
  useEmployees, 
  useAddLeaveRequest, 
  useUpdateLeaveRequest 
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
import { Plus, CheckCircle, XCircle, CalendarDays } from "lucide-react";

export function LeaveRequestsTab() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const { data: leaveRequests, isLoading } = useLeaveRequests();
  const { data: employees } = useEmployees();
  const addLeaveRequest = useAddLeaveRequest();
  const updateLeaveRequest = useUpdateLeaveRequest();

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const days = differenceInDays(new Date(endDate), new Date(startDate)) + 1;
    return Math.max(0, days);
  };

  const handleAddLeave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    addLeaveRequest.mutate({
      employee_id: formData.get("employee_id") as string,
      leave_type: formData.get("leave_type") as string,
      start_date: formData.get("start_date") as string,
      end_date: formData.get("end_date") as string,
      total_days: calculateDays(),
      reason: formData.get("reason") as string || undefined,
    }, {
      onSuccess: () => {
        setIsAddOpen(false);
        setStartDate("");
        setEndDate("");
      },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="default">Disetujui</Badge>;
      case "rejected":
        return <Badge variant="destructive">Ditolak</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      annual: "Cuti Tahunan",
      sick: "Cuti Sakit",
      maternity: "Cuti Melahirkan",
      paternity: "Cuti Ayah",
      marriage: "Cuti Menikah",
      bereavement: "Cuti Duka",
      unpaid: "Cuti Tanpa Gaji",
      other: "Lainnya",
    };
    return types[type] || type;
  };

  const activeEmployees = employees?.filter(e => e.status === "active");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Pengajuan Cuti
            </CardTitle>
            <CardDescription>Kelola persetujuan cuti karyawan</CardDescription>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajukan Cuti
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Pengajuan Cuti Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddLeave} className="space-y-4">
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
                  <Label htmlFor="leave_type">Jenis Cuti *</Label>
                  <Select name="leave_type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Jenis Cuti" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual">Cuti Tahunan</SelectItem>
                      <SelectItem value="sick">Cuti Sakit</SelectItem>
                      <SelectItem value="maternity">Cuti Melahirkan</SelectItem>
                      <SelectItem value="paternity">Cuti Ayah</SelectItem>
                      <SelectItem value="marriage">Cuti Menikah</SelectItem>
                      <SelectItem value="bereavement">Cuti Duka</SelectItem>
                      <SelectItem value="unpaid">Cuti Tanpa Gaji</SelectItem>
                      <SelectItem value="other">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Tanggal Mulai *</Label>
                    <Input 
                      id="start_date" 
                      name="start_date" 
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">Tanggal Selesai *</Label>
                    <Input 
                      id="end_date" 
                      name="end_date" 
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      required 
                    />
                  </div>
                </div>
                
                {calculateDays() > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Total: <strong>{calculateDays()} hari</strong>
                  </p>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="reason">Alasan</Label>
                  <Textarea id="reason" name="reason" rows={3} />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={addLeaveRequest.isPending}>
                    {addLeaveRequest.isPending ? "Menyimpan..." : "Ajukan"}
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
                <TableHead>Jenis Cuti</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Durasi</TableHead>
                <TableHead>Alasan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveRequests?.map((leave) => (
                <TableRow key={leave.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{(leave as any).employees?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(leave as any).employees?.position}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{getLeaveTypeLabel(leave.leave_type)}</TableCell>
                  <TableCell>
                    {format(new Date(leave.start_date), "dd MMM", { locale: id })} - {format(new Date(leave.end_date), "dd MMM yyyy", { locale: id })}
                  </TableCell>
                  <TableCell>{leave.total_days} hari</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {leave.reason || "-"}
                  </TableCell>
                  <TableCell>{getStatusBadge(leave.status)}</TableCell>
                  <TableCell>
                    {leave.status === "pending" && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => updateLeaveRequest.mutate({ 
                            id: leave.id, 
                            status: "approved" 
                          })}
                          disabled={updateLeaveRequest.isPending}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => updateLeaveRequest.mutate({ 
                            id: leave.id, 
                            status: "rejected" 
                          })}
                          disabled={updateLeaveRequest.isPending}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {leave.status !== "pending" && (
                      <span className="text-sm text-muted-foreground">
                        {leave.approved_at && format(new Date(leave.approved_at), "dd/MM/yyyy")}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {leaveRequests?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Tidak ada pengajuan cuti
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

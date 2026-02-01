import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { 
  Users, Clock, CalendarDays, Plus, Search, Building2, 
  CheckCircle, XCircle, AlertCircle, FileText
} from "lucide-react";

// Fetch employees
function useEmployees() {
  return useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select(`
          *,
          departments (name)
        `)
        .order("full_name");
      
      if (error) throw error;
      return data;
    },
  });
}

// Fetch attendance
function useAttendance(date: string) {
  return useQuery({
    queryKey: ["attendance", date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select(`
          *,
          employees (full_name, employee_number, position)
        `)
        .eq("attendance_date", date)
        .order("check_in", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

// Fetch leave requests
function useLeaveRequests() {
  return useQuery({
    queryKey: ["leave-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leave_requests")
        .select(`
          *,
          employees (full_name, employee_number, position)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

// Employee stats
function useEmployeeStats() {
  return useQuery({
    queryKey: ["employee-stats"],
    queryFn: async () => {
      const { count: total } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      const today = format(new Date(), "yyyy-MM-dd");
      const { count: presentToday } = await supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .eq("attendance_date", today)
        .eq("status", "present");

      const { count: pendingLeave } = await supabase
        .from("leave_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      return {
        total: total || 0,
        presentToday: presentToday || 0,
        pendingLeave: pendingLeave || 0,
      };
    },
  });
}

export default function SDM() {
  const [searchTerm, setSearchTerm] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: employees, isLoading: loadingEmployees } = useEmployees();
  const { data: attendance, isLoading: loadingAttendance } = useAttendance(attendanceDate);
  const { data: leaveRequests, isLoading: loadingLeave } = useLeaveRequests();
  const { data: stats } = useEmployeeStats();

  // Add employee mutation
  const addEmployeeMutation = useMutation({
    mutationFn: async (employee: any) => {
      const { data, error } = await supabase
        .from("employees")
        .insert(employee)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee-stats"] });
      setIsAddEmployeeOpen(false);
      toast({ title: "Karyawan berhasil ditambahkan" });
    },
    onError: (error: any) => {
      toast({ title: "Gagal menambah karyawan", description: error.message, variant: "destructive" });
    },
  });

  // Update leave request mutation
  const updateLeaveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("leave_requests")
        .update({ status, approved_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      toast({ title: "Status cuti berhasil diperbarui" });
    },
  });

  const filteredEmployees = employees?.filter(emp =>
    emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddEmployee = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addEmployeeMutation.mutate({
      full_name: formData.get("full_name"),
      employee_number: `EMP-${Date.now().toString().slice(-6)}`,
      position: formData.get("position"),
      department_id: formData.get("department_id") || null,
      employment_type: formData.get("employment_type"),
      join_date: formData.get("join_date"),
      phone: formData.get("phone") || null,
      email: formData.get("email") || null,
      status: "active",
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SDM / HRD</h1>
          <p className="text-muted-foreground">Manajemen Sumber Daya Manusia</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
                <p className="text-sm text-muted-foreground">Total Karyawan Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success/10 rounded-xl">
                <Clock className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.presentToday || 0}</p>
                <p className="text-sm text-muted-foreground">Hadir Hari Ini</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-warning/10 rounded-xl">
                <CalendarDays className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.pendingLeave || 0}</p>
                <p className="text-sm text-muted-foreground">Pengajuan Cuti Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList>
          <TabsTrigger value="employees">Karyawan</TabsTrigger>
          <TabsTrigger value="attendance">Absensi</TabsTrigger>
          <TabsTrigger value="leave">Pengajuan Cuti</TabsTrigger>
        </TabsList>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Daftar Karyawan</CardTitle>
                <Dialog open={isAddEmployeeOpen} onOpenChange={setIsAddEmployeeOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Karyawan
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Tambah Karyawan Baru</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddEmployee} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Nama Lengkap *</Label>
                        <Input id="full_name" name="full_name" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="position">Jabatan *</Label>
                        <Input id="position" name="position" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="employment_type">Tipe Kepegawaian</Label>
                        <Select name="employment_type" defaultValue="tetap">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tetap">Tetap</SelectItem>
                            <SelectItem value="kontrak">Kontrak</SelectItem>
                            <SelectItem value="magang">Magang</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="join_date">Tanggal Bergabung *</Label>
                        <Input id="join_date" name="join_date" type="date" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">No. Telepon</Label>
                        <Input id="phone" name="phone" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={() => setIsAddEmployeeOpen(false)}>
                          Batal
                        </Button>
                        <Button type="submit" disabled={addEmployeeMutation.isPending}>
                          {addEmployeeMutation.isPending ? "Menyimpan..." : "Simpan"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari karyawan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {loadingEmployees ? (
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
                      <TableHead>Jabatan</TableHead>
                      <TableHead>Departemen</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees?.map((emp) => (
                      <TableRow key={emp.id}>
                        <TableCell className="font-mono">{emp.employee_number}</TableCell>
                        <TableCell className="font-medium">{emp.full_name}</TableCell>
                        <TableCell>{emp.position}</TableCell>
                        <TableCell>{(emp as any).departments?.name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{emp.employment_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={emp.status === "active" ? "default" : "secondary"}>
                            {emp.status === "active" ? "Aktif" : "Non-aktif"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredEmployees?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Tidak ada data karyawan
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Rekap Absensi</CardTitle>
                <Input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="w-auto"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loadingAttendance ? (
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
                        <TableCell className="font-mono">{(att as any).employees?.employee_number}</TableCell>
                        <TableCell className="font-medium">{(att as any).employees?.full_name}</TableCell>
                        <TableCell>{att.check_in ? format(new Date(att.check_in), "HH:mm") : "-"}</TableCell>
                        <TableCell>{att.check_out ? format(new Date(att.check_out), "HH:mm") : "-"}</TableCell>
                        <TableCell>
                          <Badge variant={
                            att.status === "present" ? "default" :
                            att.status === "late" ? "secondary" :
                            att.status === "absent" ? "destructive" : "outline"
                          }>
                            {att.status === "present" ? "Hadir" :
                             att.status === "late" ? "Terlambat" :
                             att.status === "absent" ? "Absen" : att.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{att.notes || "-"}</TableCell>
                      </TableRow>
                    ))}
                    {attendance?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Tidak ada data absensi untuk tanggal ini
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave Requests Tab */}
        <TabsContent value="leave" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pengajuan Cuti</CardTitle>
              <CardDescription>Kelola persetujuan cuti karyawan</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingLeave ? (
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
                            <p className="text-sm text-muted-foreground">{(leave as any).employees?.position}</p>
                          </div>
                        </TableCell>
                        <TableCell>{leave.leave_type}</TableCell>
                        <TableCell>
                          {format(new Date(leave.start_date), "dd MMM", { locale: id })} - {format(new Date(leave.end_date), "dd MMM yyyy", { locale: id })}
                        </TableCell>
                        <TableCell>{leave.total_days} hari</TableCell>
                        <TableCell className="max-w-[200px] truncate">{leave.reason || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={
                            leave.status === "approved" ? "default" :
                            leave.status === "rejected" ? "destructive" : "secondary"
                          }>
                            {leave.status === "approved" ? "Disetujui" :
                             leave.status === "rejected" ? "Ditolak" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {leave.status === "pending" && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600"
                                onClick={() => updateLeaveMutation.mutate({ id: leave.id, status: "approved" })}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600"
                                onClick={() => updateLeaveMutation.mutate({ id: leave.id, status: "rejected" })}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}

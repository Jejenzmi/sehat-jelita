import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { 
  useEmployees, 
  useAddEmployee, 
  useUpdateEmployee, 
  useDeleteEmployee,
  useDepartments,
  useEmployeeGrades,
  Employee 
} from "@/hooks/useHRData";
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
  DialogFooter,
  DialogDescription
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
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Pencil, Trash2, Eye, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function EmployeeList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const { data: employees, isLoading } = useEmployees();
  const { data: departments } = useDepartments();
  const { data: grades } = useEmployeeGrades();
  const addEmployee = useAddEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();

  const filteredEmployees = employees?.filter(emp =>
    emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddEmployee = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    addEmployee.mutate({
      full_name: formData.get("full_name") as string,
      employee_number: `EMP-${Date.now().toString().slice(-6)}`,
      nik: formData.get("nik") as string || undefined,
      position: formData.get("position") as string,
      department_id: formData.get("department_id") as string || undefined,
      grade_id: formData.get("grade_id") as string || undefined,
      employment_type: formData.get("employment_type") as string,
      join_date: formData.get("join_date") as string,
      phone: formData.get("phone") as string || undefined,
      email: formData.get("email") as string || undefined,
      birth_date: formData.get("birth_date") as string || undefined,
      birth_place: formData.get("birth_place") as string || undefined,
      gender: formData.get("gender") as string || undefined,
      address: formData.get("address") as string || undefined,
      salary: parseFloat(formData.get("salary") as string) || undefined,
      bank_name: formData.get("bank_name") as string || undefined,
      bank_account: formData.get("bank_account") as string || undefined,
      npwp: formData.get("npwp") as string || undefined,
      bpjs_kesehatan: formData.get("bpjs_kesehatan") as string || undefined,
      bpjs_ketenagakerjaan: formData.get("bpjs_ketenagakerjaan") as string || undefined,
      tax_status: formData.get("tax_status") as string || "TK/0",
      marital_status: formData.get("marital_status") as string || "single",
      religion: formData.get("religion") as string || undefined,
      status: "active",
    }, {
      onSuccess: () => setIsAddOpen(false),
    });
  };

  const handleUpdateEmployee = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    
    const formData = new FormData(e.currentTarget);
    
    updateEmployee.mutate({
      id: selectedEmployee.id,
      full_name: formData.get("full_name") as string,
      nik: formData.get("nik") as string || undefined,
      position: formData.get("position") as string,
      department_id: formData.get("department_id") as string || undefined,
      grade_id: formData.get("grade_id") as string || undefined,
      employment_type: formData.get("employment_type") as string,
      phone: formData.get("phone") as string || undefined,
      email: formData.get("email") as string || undefined,
      salary: parseFloat(formData.get("salary") as string) || undefined,
      bank_name: formData.get("bank_name") as string || undefined,
      bank_account: formData.get("bank_account") as string || undefined,
      npwp: formData.get("npwp") as string || undefined,
      tax_status: formData.get("tax_status") as string || undefined,
      marital_status: formData.get("marital_status") as string || undefined,
      status: formData.get("status") as string,
    }, {
      onSuccess: () => {
        setIsEditOpen(false);
        setSelectedEmployee(null);
      },
    });
  };

  const handleDelete = () => {
    if (!selectedEmployee) return;
    deleteEmployee.mutate(selectedEmployee.id, {
      onSuccess: () => {
        setIsDeleteOpen(false);
        setSelectedEmployee(null);
      },
    });
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Daftar Karyawan</CardTitle>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Karyawan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Tambah Karyawan Baru</DialogTitle>
                <DialogDescription>
                  Lengkapi data karyawan di bawah ini
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh] pr-4">
                <form onSubmit={handleAddEmployee} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nama Lengkap *</Label>
                      <Input id="full_name" name="full_name" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nik">NIK</Label>
                      <Input id="nik" name="nik" maxLength={16} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="birth_place">Tempat Lahir</Label>
                      <Input id="birth_place" name="birth_place" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birth_date">Tanggal Lahir</Label>
                      <Input id="birth_date" name="birth_date" type="date" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gender">Jenis Kelamin</Label>
                      <Select name="gender">
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Laki-laki</SelectItem>
                          <SelectItem value="female">Perempuan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="religion">Agama</Label>
                      <Select name="religion">
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="islam">Islam</SelectItem>
                          <SelectItem value="kristen">Kristen</SelectItem>
                          <SelectItem value="katolik">Katolik</SelectItem>
                          <SelectItem value="hindu">Hindu</SelectItem>
                          <SelectItem value="buddha">Buddha</SelectItem>
                          <SelectItem value="konghucu">Konghucu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Alamat</Label>
                    <Textarea id="address" name="address" rows={2} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">No. Telepon</Label>
                      <Input id="phone" name="phone" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" />
                    </div>
                  </div>
                  
                  <hr className="my-4" />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="position">Jabatan *</Label>
                      <Input id="position" name="position" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department_id">Departemen</Label>
                      <Select name="department_id">
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Departemen" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments?.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="grade_id">Grade/Golongan</Label>
                      <Select name="grade_id">
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Grade" />
                        </SelectTrigger>
                        <SelectContent>
                          {grades?.map((grade) => (
                            <SelectItem key={grade.id} value={grade.id}>
                              {grade.grade_code} - {grade.grade_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employment_type">Tipe Kepegawaian *</Label>
                      <Select name="employment_type" defaultValue="tetap">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tetap">Tetap</SelectItem>
                          <SelectItem value="kontrak">Kontrak</SelectItem>
                          <SelectItem value="magang">Magang</SelectItem>
                          <SelectItem value="paruh_waktu">Paruh Waktu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="join_date">Tanggal Bergabung *</Label>
                      <Input id="join_date" name="join_date" type="date" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salary">Gaji Pokok</Label>
                      <Input id="salary" name="salary" type="number" />
                    </div>
                  </div>
                  
                  <hr className="my-4" />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="marital_status">Status Pernikahan</Label>
                      <Select name="marital_status" defaultValue="single">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Belum Menikah</SelectItem>
                          <SelectItem value="married">Menikah</SelectItem>
                          <SelectItem value="divorced">Cerai</SelectItem>
                          <SelectItem value="widowed">Duda/Janda</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tax_status">Status Pajak (PTKP)</Label>
                      <Select name="tax_status" defaultValue="TK/0">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TK/0">TK/0 - Tidak Kawin</SelectItem>
                          <SelectItem value="TK/1">TK/1 - TK + 1 Tanggungan</SelectItem>
                          <SelectItem value="TK/2">TK/2 - TK + 2 Tanggungan</SelectItem>
                          <SelectItem value="TK/3">TK/3 - TK + 3 Tanggungan</SelectItem>
                          <SelectItem value="K/0">K/0 - Kawin</SelectItem>
                          <SelectItem value="K/1">K/1 - Kawin + 1 Tanggungan</SelectItem>
                          <SelectItem value="K/2">K/2 - Kawin + 2 Tanggungan</SelectItem>
                          <SelectItem value="K/3">K/3 - Kawin + 3 Tanggungan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bank_name">Nama Bank</Label>
                      <Input id="bank_name" name="bank_name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bank_account">No. Rekening</Label>
                      <Input id="bank_account" name="bank_account" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="npwp">NPWP</Label>
                      <Input id="npwp" name="npwp" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bpjs_kesehatan">No. BPJS Kesehatan</Label>
                      <Input id="bpjs_kesehatan" name="bpjs_kesehatan" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bpjs_ketenagakerjaan">No. BPJS TK</Label>
                      <Input id="bpjs_ketenagakerjaan" name="bpjs_ketenagakerjaan" />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={addEmployee.isPending}>
                      {addEmployee.isPending ? "Menyimpan..." : "Simpan"}
                    </Button>
                  </DialogFooter>
                </form>
              </ScrollArea>
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
                <TableHead>Jabatan</TableHead>
                <TableHead>Departemen</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees?.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-mono text-sm">{emp.employee_number}</TableCell>
                  <TableCell className="font-medium">{emp.full_name}</TableCell>
                  <TableCell>{emp.position}</TableCell>
                  <TableCell>{emp.departments?.name || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{emp.employment_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={emp.status === "active" ? "default" : "secondary"}>
                      {emp.status === "active" ? "Aktif" : "Non-aktif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setSelectedEmployee(emp);
                          setIsViewOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setSelectedEmployee(emp);
                          setIsEditOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => {
                          setSelectedEmployee(emp);
                          setIsDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredEmployees?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Tidak ada data karyawan
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Detail Karyawan
            </DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">NIP</p>
                <p className="font-medium">{selectedEmployee.employee_number}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Nama Lengkap</p>
                <p className="font-medium">{selectedEmployee.full_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">NIK</p>
                <p className="font-medium">{selectedEmployee.nik || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Jabatan</p>
                <p className="font-medium">{selectedEmployee.position}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Departemen</p>
                <p className="font-medium">{selectedEmployee.departments?.name || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tipe Kepegawaian</p>
                <p className="font-medium">{selectedEmployee.employment_type}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tanggal Bergabung</p>
                <p className="font-medium">
                  {format(new Date(selectedEmployee.join_date), "dd MMMM yyyy", { locale: id })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Gaji Pokok</p>
                <p className="font-medium">{formatCurrency(selectedEmployee.salary)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">No. Telepon</p>
                <p className="font-medium">{selectedEmployee.phone || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{selectedEmployee.email || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status Pajak</p>
                <p className="font-medium">{selectedEmployee.tax_status || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Bank / No. Rekening</p>
                <p className="font-medium">
                  {selectedEmployee.bank_name ? `${selectedEmployee.bank_name} - ${selectedEmployee.bank_account}` : "-"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">NPWP</p>
                <p className="font-medium">{selectedEmployee.npwp || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">BPJS Kesehatan</p>
                <p className="font-medium">{selectedEmployee.bpjs_kesehatan || "-"}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Data Karyawan</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            {selectedEmployee && (
              <form onSubmit={handleUpdateEmployee} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_full_name">Nama Lengkap *</Label>
                    <Input 
                      id="edit_full_name" 
                      name="full_name" 
                      defaultValue={selectedEmployee.full_name}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_nik">NIK</Label>
                    <Input 
                      id="edit_nik" 
                      name="nik" 
                      defaultValue={selectedEmployee.nik || ""}
                      maxLength={16} 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_position">Jabatan *</Label>
                    <Input 
                      id="edit_position" 
                      name="position" 
                      defaultValue={selectedEmployee.position}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_department_id">Departemen</Label>
                    <Select name="department_id" defaultValue={selectedEmployee.department_id || ""}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Departemen" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments?.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_grade_id">Grade/Golongan</Label>
                    <Select name="grade_id" defaultValue={selectedEmployee.grade_id || ""}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {grades?.map((grade) => (
                          <SelectItem key={grade.id} value={grade.id}>
                            {grade.grade_code} - {grade.grade_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_employment_type">Tipe Kepegawaian *</Label>
                    <Select name="employment_type" defaultValue={selectedEmployee.employment_type}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tetap">Tetap</SelectItem>
                        <SelectItem value="kontrak">Kontrak</SelectItem>
                        <SelectItem value="magang">Magang</SelectItem>
                        <SelectItem value="paruh_waktu">Paruh Waktu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_phone">No. Telepon</Label>
                    <Input 
                      id="edit_phone" 
                      name="phone" 
                      defaultValue={selectedEmployee.phone || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_email">Email</Label>
                    <Input 
                      id="edit_email" 
                      name="email" 
                      type="email"
                      defaultValue={selectedEmployee.email || ""}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_salary">Gaji Pokok</Label>
                    <Input 
                      id="edit_salary" 
                      name="salary" 
                      type="number"
                      defaultValue={selectedEmployee.salary || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_status">Status</Label>
                    <Select name="status" defaultValue={selectedEmployee.status}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Aktif</SelectItem>
                        <SelectItem value="inactive">Non-aktif</SelectItem>
                        <SelectItem value="terminated">Berhenti</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_tax_status">Status Pajak (PTKP)</Label>
                    <Select name="tax_status" defaultValue={selectedEmployee.tax_status || "TK/0"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TK/0">TK/0</SelectItem>
                        <SelectItem value="TK/1">TK/1</SelectItem>
                        <SelectItem value="TK/2">TK/2</SelectItem>
                        <SelectItem value="TK/3">TK/3</SelectItem>
                        <SelectItem value="K/0">K/0</SelectItem>
                        <SelectItem value="K/1">K/1</SelectItem>
                        <SelectItem value="K/2">K/2</SelectItem>
                        <SelectItem value="K/3">K/3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_marital_status">Status Pernikahan</Label>
                    <Select name="marital_status" defaultValue={selectedEmployee.marital_status || "single"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Belum Menikah</SelectItem>
                        <SelectItem value="married">Menikah</SelectItem>
                        <SelectItem value="divorced">Cerai</SelectItem>
                        <SelectItem value="widowed">Duda/Janda</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_bank_name">Nama Bank</Label>
                    <Input 
                      id="edit_bank_name" 
                      name="bank_name" 
                      defaultValue={selectedEmployee.bank_name || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_bank_account">No. Rekening</Label>
                    <Input 
                      id="edit_bank_account" 
                      name="bank_account" 
                      defaultValue={selectedEmployee.bank_account || ""}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_npwp">NPWP</Label>
                  <Input 
                    id="edit_npwp" 
                    name="npwp" 
                    defaultValue={selectedEmployee.npwp || ""}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={updateEmployee.isPending}>
                    {updateEmployee.isPending ? "Menyimpan..." : "Simpan"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Karyawan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data karyawan "{selectedEmployee?.full_name}"? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteEmployee.isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

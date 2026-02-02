import { useState, useEffect } from "react";
import { Search, Filter, Download, Eye, Edit, MoreHorizontal, Users, Plus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInYears } from "date-fns";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";

interface Patient {
  id: string;
  medical_record_number: string;
  nik: string;
  full_name: string;
  gender: "L" | "P";
  birth_date: string;
  phone: string | null;
  address: string | null;
  bpjs_number: string | null;
  status: string;
  created_at: string;
}

interface PatientStats {
  total: number;
  bpjs: number;
  umum: number;
  newThisMonth: number;
}

export default function Pasien() {
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState<PatientStats>({ total: 0, bpjs: 0, umum: 0, newThisMonth: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  
  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Save confirmation
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    nik: "",
    full_name: "",
    birth_date: "",
    gender: "" as "L" | "P" | "",
    phone: "",
    address: "",
    bpjs_number: "",
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    fetchPatients();
    fetchStats();
  }, [page, searchTerm, filter]);

  const fetchStats = async () => {
    try {
      const { count: total } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true });

      const { count: bpjs } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true })
        .not("bpjs_number", "is", null);

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: newThisMonth } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfMonth.toISOString());

      setStats({
        total: total || 0,
        bpjs: bpjs || 0,
        umum: (total || 0) - (bpjs || 0),
        newThisMonth: newThisMonth || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchPatients = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("patients")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,nik.ilike.%${searchTerm}%,medical_record_number.ilike.%${searchTerm}%`);
      }

      if (filter === "bpjs") {
        query = query.not("bpjs_number", "is", null);
      } else if (filter === "umum") {
        query = query.is("bpjs_number", null);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setPatients(data || []);
      setTotalCount(count || 0);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal memuat data pasien: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitConfirm = () => {
    if (!formData.nik || !formData.full_name || !formData.birth_date || !formData.gender) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Mohon lengkapi data wajib (NIK, Nama, Tanggal Lahir, Jenis Kelamin)",
      });
      return;
    }
    setSaveConfirmOpen(true);
  };

  const handleSubmit = async () => {
    setSaveConfirmOpen(false);
    setIsSubmitting(true);
    try {
      if (editingPatient) {
        // Update existing patient
        const { error } = await supabase
          .from("patients")
          .update({
            nik: formData.nik,
            full_name: formData.full_name,
            birth_date: formData.birth_date,
            gender: formData.gender as "L" | "P",
            phone: formData.phone || null,
            address: formData.address || null,
            bpjs_number: formData.bpjs_number || null,
          })
          .eq("id", editingPatient.id);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Data pasien berhasil diperbarui",
        });
      } else {
        // Create new patient
        const { data: mrn } = await supabase.rpc("generate_medical_record_number");
        
        const { error } = await supabase.from("patients").insert({
          medical_record_number: mrn,
          nik: formData.nik,
          full_name: formData.full_name,
          birth_date: formData.birth_date,
          gender: formData.gender as "L" | "P",
          phone: formData.phone || null,
          address: formData.address || null,
          bpjs_number: formData.bpjs_number || null,
        });

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Pasien baru berhasil didaftarkan",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchPatients();
      fetchStats();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = (patient: Patient) => {
    setPatientToDelete(patient);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!patientToDelete) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("patients")
        .delete()
        .eq("id", patientToDelete.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data pasien berhasil dihapus",
      });

      fetchPatients();
      fetchStats();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setPatientToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({
      nik: "",
      full_name: "",
      birth_date: "",
      gender: "",
      phone: "",
      address: "",
      bpjs_number: "",
    });
    setEditingPatient(null);
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({
      nik: patient.nik,
      full_name: patient.full_name,
      birth_date: patient.birth_date,
      gender: patient.gender,
      phone: patient.phone || "",
      address: patient.address || "",
      bpjs_number: patient.bpjs_number || "",
    });
    setIsDialogOpen(true);
  };

  const calculateAge = (birthDate: string) => {
    return differenceInYears(new Date(), new Date(birthDate));
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Data Pasien</h1>
          <p className="text-muted-foreground">Kelola data pasien rumah sakit</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary shadow-glow">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Pasien
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingPatient ? "Edit Data Pasien" : "Tambah Pasien Baru"}</DialogTitle>
                <DialogDescription>
                  {editingPatient ? "Ubah data pasien yang sudah terdaftar" : "Daftarkan pasien baru ke sistem"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>NIK *</Label>
                    <Input
                      placeholder="16 digit NIK"
                      value={formData.nik}
                      onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                      maxLength={16}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>No. BPJS</Label>
                    <Input
                      placeholder="Opsional"
                      value={formData.bpjs_number}
                      onChange={(e) => setFormData({ ...formData, bpjs_number: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Nama Lengkap *</Label>
                  <Input
                    placeholder="Nama sesuai KTP"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tanggal Lahir *</Label>
                    <Input
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Jenis Kelamin *</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value: "L" | "P") => setFormData({ ...formData, gender: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="L">Laki-laki</SelectItem>
                        <SelectItem value="P">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>No. Telepon</Label>
                  <Input
                    placeholder="08xxxxxxxxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Alamat</Label>
                  <Input
                    placeholder="Alamat lengkap"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleSubmitConfirm} disabled={isSubmitting} className="gradient-primary">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : editingPatient ? (
                    "Simpan Perubahan"
                  ) : (
                    "Daftarkan"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total Pasien</p>
          </div>
        </div>
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-success/10">
            <Users className="h-6 w-6 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.bpjs.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Pasien BPJS</p>
          </div>
        </div>
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-info/10">
            <Users className="h-6 w-6 text-info" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.umum.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Pasien Umum</p>
          </div>
        </div>
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-warning/10">
            <Users className="h-6 w-6 text-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.newThisMonth}</p>
            <p className="text-sm text-muted-foreground">Pasien Baru (Bulan Ini)</p>
          </div>
        </div>
      </div>

      {/* Patient List */}
      <div className="module-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-semibold">Daftar Pasien</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari No. RM, NIK, atau Nama..."
                className="pl-10 w-64"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select value={filter} onValueChange={(value) => {
              setFilter(value);
              setPage(1);
            }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="bpjs">BPJS</SelectItem>
                <SelectItem value="umum">Umum</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {searchTerm ? "Tidak ada pasien yang sesuai pencarian" : "Belum ada data pasien"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>No. RM</th>
                  <th>Pasien</th>
                  <th>NIK</th>
                  <th>No. BPJS</th>
                  <th>No. Telepon</th>
                  <th>Terdaftar</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.id}>
                    <td className="font-mono text-xs font-medium">{patient.medical_record_number}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {patient.full_name.split(" ").map((n) => n[0]).join("").substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{patient.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {patient.gender === "L" ? "Laki-laki" : "Perempuan"}, {calculateAge(patient.birth_date)} tahun
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-xs">{patient.nik}</td>
                    <td>
                      {patient.bpjs_number ? (
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          {patient.bpjs_number}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-muted text-muted-foreground">
                          Umum
                        </Badge>
                      )}
                    </td>
                    <td className="text-sm">{patient.phone || "-"}</td>
                    <td className="text-sm text-muted-foreground">
                      {format(new Date(patient.created_at), "dd/MM/yyyy")}
                    </td>
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Lihat Detail
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(patient)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Data
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            Riwayat Kunjungan
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            Rekam Medis
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteConfirm(patient)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hapus Pasien
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-muted-foreground">
              Menampilkan {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, totalCount)} dari {totalCount} pasien
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Sebelumnya
              </Button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant="outline"
                    size="sm"
                    className={page === pageNum ? "bg-primary text-primary-foreground" : ""}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Save Confirmation Dialog */}
      <ConfirmationDialog
        open={saveConfirmOpen}
        onOpenChange={setSaveConfirmOpen}
        title={editingPatient ? "Simpan Perubahan" : "Daftarkan Pasien Baru"}
        description={
          editingPatient
            ? `Apakah Anda yakin ingin menyimpan perubahan data pasien "${formData.full_name}"?`
            : `Apakah Anda yakin ingin mendaftarkan pasien baru "${formData.full_name}"?`
        }
        type="save"
        confirmLabel={editingPatient ? "Simpan" : "Daftarkan"}
        onConfirm={handleSubmit}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Hapus Data Pasien"
        description={
          <>
            Apakah Anda yakin ingin menghapus data pasien <strong>{patientToDelete?.full_name}</strong> (No. RM: {patientToDelete?.medical_record_number})?
            <br /><br />
            <span className="text-destructive">Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait pasien ini.</span>
          </>
        }
        type="delete"
        confirmLabel="Hapus"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Stethoscope, Building2, Pill, BedDouble, Plus, Search } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const FETCH_OPTS: RequestInit = { credentials: 'include', headers: { 'Content-Type': 'application/json' } };

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, FETCH_OPTS);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return (json.data ?? json) as T;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...FETCH_OPTS, method: 'POST', body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return (json.data ?? json) as T;
}

async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...FETCH_OPTS, method: 'PUT', body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return (json.data ?? json) as T;
}

interface Doctor {
  id: string;
  full_name: string;
  doctor_code: string;
  sip_number: string | null;
  specialization: string | null;
  department_id: string | null;
  consultation_fee: number | null;
  is_active: boolean | null;
  departments?: { id: string; department_name: string } | null;
}

interface Department {
  id: string;
  department_name: string;
  department_code: string;
  department_type: string | null;
  is_active: boolean | null;
}

interface Medicine {
  id: string;
  medicine_code: string;
  medicine_name: string;
  generic_name: string | null;
  category: string | null;
  unit: string | null;
  unit_price: number | null;
  current_stock: number | null;
  min_stock: number | null;
  is_active: boolean | null;
}

interface Room {
  id: string;
  room_number: string;
  room_name: string;
  room_class: string | null;
  capacity: number | null;
  daily_rate: number | null;
  is_active: boolean | null;
  beds?: { id: string }[];
}

function useDoctors() {
  return useQuery({
    queryKey: ["master-doctors"],
    queryFn: () => apiFetch<Doctor[]>('/admin/doctors'),
  });
}

function useDepartments() {
  return useQuery({
    queryKey: ["master-departments"],
    queryFn: () => apiFetch<Department[]>('/admin/departments'),
  });
}

function useMedicines() {
  return useQuery({
    queryKey: ["master-medicines"],
    queryFn: () => apiFetch<Medicine[]>('/admin/medicines'),
  });
}

function useRooms() {
  return useQuery({
    queryKey: ["master-rooms"],
    queryFn: () => apiFetch<Room[]>('/admin/rooms'),
  });
}

export default function MasterData() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("doctors");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: doctors, isLoading: loadingDoctors } = useDoctors();
  const { data: departments, isLoading: loadingDepartments } = useDepartments();
  const { data: medicines, isLoading: loadingMedicines } = useMedicines();
  const { data: rooms, isLoading: loadingRooms } = useRooms();

  const addDoctorMutation = useMutation({
    mutationFn: (doctor: Record<string, unknown>) => apiPost('/admin/doctors', doctor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-doctors"] });
      setIsAddDialogOpen(false);
      toast({ title: "Dokter berhasil ditambahkan" });
    },
    onError: (error: Error) => toast({ title: "Gagal menambah dokter", description: error.message, variant: "destructive" }),
  });

  const addDepartmentMutation = useMutation({
    mutationFn: (dept: Record<string, unknown>) => apiPost('/admin/departments', dept),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-departments"] });
      setIsAddDialogOpen(false);
      toast({ title: "Departemen berhasil ditambahkan" });
    },
    onError: (error: Error) => toast({ title: "Gagal menambah departemen", description: error.message, variant: "destructive" }),
  });

  const addMedicineMutation = useMutation({
    mutationFn: (medicine: Record<string, unknown>) => apiPost('/admin/medicines', medicine),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-medicines"] });
      setIsAddDialogOpen(false);
      toast({ title: "Obat berhasil ditambahkan" });
    },
    onError: (error: Error) => toast({ title: "Gagal menambah obat", description: error.message, variant: "destructive" }),
  });

  const addRoomMutation = useMutation({
    mutationFn: (room: Record<string, unknown>) => apiPost('/admin/rooms', room),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-rooms"] });
      setIsAddDialogOpen(false);
      toast({ title: "Ruangan berhasil ditambahkan" });
    },
    onError: (error: Error) => toast({ title: "Gagal menambah ruangan", description: error.message, variant: "destructive" }),
  });

  const toggleDoctorMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      apiPut(`/admin/doctors/${id}`, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["master-doctors"] }),
  });

  const toggleDepartmentMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      apiPut(`/admin/departments/${id}`, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["master-departments"] }),
  });

  const toggleMedicineMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      apiPut(`/admin/medicines/${id}`, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["master-medicines"] }),
  });

  const toggleRoomMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      apiPut(`/admin/rooms/${id}`, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["master-rooms"] }),
  });

  const handleAddDoctor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    addDoctorMutation.mutate({
      doctor_code: `DR${Date.now()}`,
      full_name: fd.get("full_name") as string,
      sip_number: fd.get("sip_number") as string || null,
      specialization: fd.get("specialization") as string || null,
      department_id: fd.get("department_id") as string || null,
      consultation_fee: parseInt(fd.get("consultation_fee") as string) || 0,
      is_active: true,
    });
  };

  const handleAddDepartment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    addDepartmentMutation.mutate({
      department_name: fd.get("name") as string,
      department_code: fd.get("code") as string,
      is_active: true,
    });
  };

  const handleAddMedicine = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    addMedicineMutation.mutate({
      medicine_name: fd.get("name") as string,
      medicine_code: fd.get("code") as string,
      generic_name: fd.get("generic_name") as string || null,
      category: fd.get("category") as string || null,
      unit: fd.get("unit") as string,
      unit_price: parseInt(fd.get("price") as string) || 0,
      current_stock: parseInt(fd.get("stock") as string) || 0,
      min_stock: parseInt(fd.get("min_stock") as string) || 10,
      is_active: true,
    });
  };

  const handleAddRoom = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    addRoomMutation.mutate({
      room_number: fd.get("code") as string,
      room_name: fd.get("name") as string,
      room_class: fd.get("room_class") as string,
      capacity: parseInt(fd.get("total_beds") as string) || 1,
      daily_rate: parseInt(fd.get("daily_rate") as string) || 0,
      is_active: true,
    });
  };

  const getDialogTitle = () => {
    switch (activeTab) {
      case "doctors": return "Tambah Dokter";
      case "departments": return "Tambah Departemen";
      case "medicines": return "Tambah Obat";
      case "rooms": return "Tambah Ruangan";
      default: return "Tambah Data";
    }
  };

  const getAddDialogContent = () => {
    switch (activeTab) {
      case "doctors":
        return (
          <form onSubmit={handleAddDoctor} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nama Lengkap *</Label>
              <Input id="full_name" name="full_name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sip_number">Nomor SIP</Label>
              <Input id="sip_number" name="sip_number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialization">Spesialisasi</Label>
              <Input id="specialization" name="specialization" placeholder="Contoh: Dokter Umum" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department_id">Departemen</Label>
              <Select name="department_id">
                <SelectTrigger>
                  <SelectValue placeholder="Pilih departemen" />
                </SelectTrigger>
                <SelectContent>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.department_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="consultation_fee">Tarif Konsultasi (Rp)</Label>
              <Input id="consultation_fee" name="consultation_fee" type="number" defaultValue="150000" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={addDoctorMutation.isPending}>
                {addDoctorMutation.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        );
      case "departments":
        return (
          <form onSubmit={handleAddDepartment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Departemen *</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Kode *</Label>
              <Input id="code" name="code" required placeholder="Contoh: POL-001" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={addDepartmentMutation.isPending}>
                {addDepartmentMutation.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        );
      case "medicines":
        return (
          <form onSubmit={handleAddMedicine} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Obat *</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Kode *</Label>
                <Input id="code" name="code" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="generic_name">Nama Generik</Label>
              <Input id="generic_name" name="generic_name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Select name="category">
                  <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="obat_keras">Obat Keras</SelectItem>
                    <SelectItem value="obat_bebas">Obat Bebas</SelectItem>
                    <SelectItem value="obat_bebas_terbatas">Obat Bebas Terbatas</SelectItem>
                    <SelectItem value="narkotika">Narkotika</SelectItem>
                    <SelectItem value="psikotropika">Psikotropika</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Satuan *</Label>
                <Input id="unit" name="unit" required placeholder="Tablet, Kapsul..." />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Harga (Rp)</Label>
                <Input id="price" name="price" type="number" defaultValue="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stok Awal</Label>
                <Input id="stock" name="stock" type="number" defaultValue="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_stock">Stok Minimum</Label>
                <Input id="min_stock" name="min_stock" type="number" defaultValue="10" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={addMedicineMutation.isPending}>
                {addMedicineMutation.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        );
      case "rooms":
        return (
          <form onSubmit={handleAddRoom} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Kode Ruangan *</Label>
                <Input id="code" name="code" required placeholder="R-001" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nama Ruangan *</Label>
                <Input id="name" name="name" required placeholder="Ruang Melati 1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="room_class">Kelas Ruangan *</Label>
              <Select name="room_class" defaultValue="Kelas 3">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIP">VIP</SelectItem>
                  <SelectItem value="Kelas 1">Kelas 1</SelectItem>
                  <SelectItem value="Kelas 2">Kelas 2</SelectItem>
                  <SelectItem value="Kelas 3">Kelas 3</SelectItem>
                  <SelectItem value="ICU">ICU</SelectItem>
                  <SelectItem value="NICU">NICU</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total_beds">Kapasitas Bed</Label>
                <Input id="total_beds" name="total_beds" type="number" defaultValue="1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="daily_rate">Tarif per Hari (Rp)</Label>
                <Input id="daily_rate" name="daily_rate" type="number" defaultValue="500000" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={addRoomMutation.isPending}>
                {addRoomMutation.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Master Data</h1>
          <p className="text-muted-foreground">Kelola data master rumah sakit</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl"><Stethoscope className="h-6 w-6 text-primary" /></div>
              <div><p className="text-2xl font-bold">{doctors?.length || 0}</p><p className="text-sm text-muted-foreground">Dokter</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl"><Building2 className="h-6 w-6 text-blue-500" /></div>
              <div><p className="text-2xl font-bold">{departments?.length || 0}</p><p className="text-sm text-muted-foreground">Departemen</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-xl"><Pill className="h-6 w-6 text-green-500" /></div>
              <div><p className="text-2xl font-bold">{medicines?.length || 0}</p><p className="text-sm text-muted-foreground">Obat</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-xl"><BedDouble className="h-6 w-6 text-orange-500" /></div>
              <div><p className="text-2xl font-bold">{rooms?.length || 0}</p><p className="text-sm text-muted-foreground">Ruangan</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="doctors">Dokter</TabsTrigger>
          <TabsTrigger value="departments">Departemen</TabsTrigger>
          <TabsTrigger value="medicines">Obat</TabsTrigger>
          <TabsTrigger value="rooms">Ruangan</TabsTrigger>
        </TabsList>

        {/* Doctors Tab */}
        <TabsContent value="doctors">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Daftar Dokter</CardTitle>
                <Dialog open={isAddDialogOpen && activeTab === "doctors"} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button><Plus className="h-4 w-4 mr-2" />Tambah Dokter</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>{getDialogTitle()}</DialogTitle></DialogHeader>
                    {getAddDialogContent()}
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Cari dokter..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              {loadingDoctors ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>SIP</TableHead>
                      <TableHead>Spesialisasi</TableHead>
                      <TableHead>Departemen</TableHead>
                      <TableHead>Tarif</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doctors?.filter(d => d.full_name.toLowerCase().includes(searchTerm.toLowerCase())).map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.full_name}</TableCell>
                        <TableCell className="font-mono text-sm">{doc.sip_number || "-"}</TableCell>
                        <TableCell>{doc.specialization || "-"}</TableCell>
                        <TableCell>{doc.departments?.department_name || "-"}</TableCell>
                        <TableCell>Rp {(doc.consultation_fee || 0).toLocaleString("id-ID")}</TableCell>
                        <TableCell>
                          <Switch
                            checked={!!doc.is_active}
                            onCheckedChange={(checked) => toggleDoctorMutation.mutate({ id: doc.id, is_active: checked })}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Daftar Departemen</CardTitle>
                <Dialog open={isAddDialogOpen && activeTab === "departments"} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button><Plus className="h-4 w-4 mr-2" />Tambah Departemen</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>{getDialogTitle()}</DialogTitle></DialogHeader>
                    {getAddDialogContent()}
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loadingDepartments ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Kode</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments?.map((dept) => (
                      <TableRow key={dept.id}>
                        <TableCell className="font-medium">{dept.department_name}</TableCell>
                        <TableCell className="font-mono">{dept.department_code}</TableCell>
                        <TableCell>{dept.department_type || "-"}</TableCell>
                        <TableCell>
                          <Switch
                            checked={!!dept.is_active}
                            onCheckedChange={(checked) => toggleDepartmentMutation.mutate({ id: dept.id, is_active: checked })}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medicines Tab */}
        <TabsContent value="medicines">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Daftar Obat</CardTitle>
                <Dialog open={isAddDialogOpen && activeTab === "medicines"} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button><Plus className="h-4 w-4 mr-2" />Tambah Obat</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>{getDialogTitle()}</DialogTitle></DialogHeader>
                    {getAddDialogContent()}
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Cari obat..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              {loadingMedicines ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Satuan</TableHead>
                      <TableHead>Stok</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {medicines?.filter(m => m.medicine_name.toLowerCase().includes(searchTerm.toLowerCase())).map((med) => (
                      <TableRow key={med.id}>
                        <TableCell className="font-mono">{med.medicine_code}</TableCell>
                        <TableCell className="font-medium">{med.medicine_name}</TableCell>
                        <TableCell>{med.category || "-"}</TableCell>
                        <TableCell>{med.unit || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={(med.current_stock || 0) < (med.min_stock || 10) ? "destructive" : "default"}>
                            {med.current_stock ?? 0}
                          </Badge>
                        </TableCell>
                        <TableCell>Rp {(med.unit_price || 0).toLocaleString("id-ID")}</TableCell>
                        <TableCell>
                          <Switch
                            checked={!!med.is_active}
                            onCheckedChange={(checked) => toggleMedicineMutation.mutate({ id: med.id, is_active: checked })}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rooms Tab */}
        <TabsContent value="rooms">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Daftar Ruangan</CardTitle>
                <Dialog open={isAddDialogOpen && activeTab === "rooms"} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button><Plus className="h-4 w-4 mr-2" />Tambah Ruangan</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>{getDialogTitle()}</DialogTitle></DialogHeader>
                    {getAddDialogContent()}
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loadingRooms ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nomor</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Kapasitas</TableHead>
                      <TableHead>Bed</TableHead>
                      <TableHead>Tarif/Hari</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rooms?.map((room) => (
                      <TableRow key={room.id}>
                        <TableCell className="font-mono">{room.room_number}</TableCell>
                        <TableCell className="font-medium">{room.room_name}</TableCell>
                        <TableCell><Badge variant="outline">{room.room_class || "-"}</Badge></TableCell>
                        <TableCell>{room.capacity || "-"}</TableCell>
                        <TableCell>{room.beds?.length || 0}</TableCell>
                        <TableCell>Rp {(room.daily_rate || 0).toLocaleString("id-ID")}</TableCell>
                        <TableCell>
                          <Switch
                            checked={!!room.is_active}
                            onCheckedChange={(checked) => toggleRoomMutation.mutate({ id: room.id, is_active: checked })}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
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

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { 
  Stethoscope, Building2, Pill, BedDouble, Plus, Search, 
  Pencil, Trash2, Users
} from "lucide-react";

// Fetch doctors
function useDoctors() {
  return useQuery({
    queryKey: ["master-doctors"],
    queryFn: async () => {
      const { data, error } = await db
        .from("doctors")
        .select(`*, departments (name)`)
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });
}

// Fetch departments
function useDepartments() {
  return useQuery({
    queryKey: ["master-departments"],
    queryFn: async () => {
      const { data, error } = await db
        .from("departments")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

// Fetch medicines
function useMedicines() {
  return useQuery({
    queryKey: ["master-medicines"],
    queryFn: async () => {
      const { data, error } = await db
        .from("medicines")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

// Fetch rooms
function useRooms() {
  return useQuery({
    queryKey: ["master-rooms"],
    queryFn: async () => {
      const { data, error } = await db
        .from("rooms")
        .select(`*, beds (id)`)
        .order("room_number");
      if (error) throw error;
      return data;
    },
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

  // Add doctor mutation
  const addDoctorMutation = useMutation({
    mutationFn: async (doctor: any) => {
      const { data, error } = await db.from("doctors").insert(doctor).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-doctors"] });
      setIsAddDialogOpen(false);
      toast({ title: "Dokter berhasil ditambahkan" });
    },
    onError: (error: any) => {
      toast({ title: "Gagal menambah dokter", description: error.message, variant: "destructive" });
    },
  });

  // Add department mutation
  const addDepartmentMutation = useMutation({
    mutationFn: async (dept: any) => {
      const { data, error } = await db.from("departments").insert(dept).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-departments"] });
      setIsAddDialogOpen(false);
      toast({ title: "Departemen berhasil ditambahkan" });
    },
    onError: (error: any) => {
      toast({ title: "Gagal menambah departemen", description: error.message, variant: "destructive" });
    },
  });

  // Add medicine mutation
  const addMedicineMutation = useMutation({
    mutationFn: async (medicine: any) => {
      const { data, error } = await db.from("medicines").insert(medicine).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-medicines"] });
      setIsAddDialogOpen(false);
      toast({ title: "Obat berhasil ditambahkan" });
    },
    onError: (error: any) => {
      toast({ title: "Gagal menambah obat", description: error.message, variant: "destructive" });
    },
  });

  // Add room mutation
  const addRoomMutation = useMutation({
    mutationFn: async (room: any) => {
      const { data, error } = await db.from("rooms").insert(room).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-rooms"] });
      setIsAddDialogOpen(false);
      toast({ title: "Ruangan berhasil ditambahkan" });
    },
    onError: (error: any) => {
      toast({ title: "Gagal menambah ruangan", description: error.message, variant: "destructive" });
    },
  });

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ table, id, is_active }: { table: string; id: string; is_active: boolean }) => {
      const { error } = await db.from(table as any).update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`master-${activeTab}`] });
      toast({ title: "Status berhasil diperbarui" });
    },
  });

  const handleAddDoctor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addDoctorMutation.mutate({
      full_name: formData.get("full_name"),
      sip_number: formData.get("sip_number"),
      specialization: formData.get("specialization") || null,
      department_id: formData.get("department_id") || null,
      consultation_fee: parseInt(formData.get("consultation_fee") as string) || 0,
      is_active: true,
    });
  };

  const handleAddDepartment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addDepartmentMutation.mutate({
      name: formData.get("name"),
      code: formData.get("code"),
      description: formData.get("description") || null,
      is_active: true,
    });
  };

  const handleAddMedicine = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addMedicineMutation.mutate({
      name: formData.get("name"),
      code: formData.get("code"),
      generic_name: formData.get("generic_name") || null,
      category: formData.get("category") || null,
      unit: formData.get("unit"),
      price: parseInt(formData.get("price") as string) || 0,
      stock: parseInt(formData.get("stock") as string) || 0,
      min_stock: parseInt(formData.get("min_stock") as string) || 10,
      is_active: true,
    });
  };

  const handleAddRoom = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addRoomMutation.mutate({
      code: formData.get("code"),
      name: formData.get("name"),
      room_class: formData.get("room_class"),
      total_beds: parseInt(formData.get("total_beds") as string) || 1,
      daily_rate: parseInt(formData.get("daily_rate") as string) || 0,
      is_active: true,
    });
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
              <Label htmlFor="sip_number">Nomor SIP *</Label>
              <Input id="sip_number" name="sip_number" required />
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
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
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
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Input id="description" name="description" />
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
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
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
                <Input id="unit" name="unit" required placeholder="Contoh: Tablet, Kapsul" />
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
                <Label htmlFor="total_beds">Jumlah Bed</Label>
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

  const getDialogTitle = () => {
    switch (activeTab) {
      case "doctors": return "Tambah Dokter";
      case "departments": return "Tambah Departemen";
      case "medicines": return "Tambah Obat";
      case "rooms": return "Tambah Ruangan";
      default: return "Tambah Data";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
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
              <div className="p-3 bg-primary/10 rounded-xl">
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{doctors?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Dokter</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Building2 className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{departments?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Departemen</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-xl">
                <Pill className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{medicines?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Obat</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-xl">
                <BedDouble className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rooms?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Ruangan</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
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
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Cari dokter..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
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
                        <TableCell className="font-mono text-sm">{doc.sip_number}</TableCell>
                        <TableCell>{doc.specialization || "-"}</TableCell>
                        <TableCell>{(doc as any).departments?.name || "-"}</TableCell>
                        <TableCell>Rp {(doc.consultation_fee || 0).toLocaleString("id-ID")}</TableCell>
                        <TableCell>
                          <Switch
                            checked={doc.is_active}
                            onCheckedChange={(checked) => toggleActiveMutation.mutate({ table: "doctors", id: doc.id, is_active: checked })}
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
                      <TableHead>Deskripsi</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments?.map((dept) => (
                      <TableRow key={dept.id}>
                        <TableCell className="font-medium">{dept.name}</TableCell>
                        <TableCell className="font-mono">{dept.code}</TableCell>
                        <TableCell>{dept.description || "-"}</TableCell>
                        <TableCell>
                          <Switch
                            checked={dept.is_active}
                            onCheckedChange={(checked) => toggleActiveMutation.mutate({ table: "departments", id: dept.id, is_active: checked })}
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
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Cari obat..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
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
                    {medicines?.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase())).map((med) => (
                      <TableRow key={med.id}>
                        <TableCell className="font-mono">{med.code}</TableCell>
                        <TableCell className="font-medium">{med.name}</TableCell>
                        <TableCell>{med.category || "-"}</TableCell>
                        <TableCell>{med.unit}</TableCell>
                        <TableCell>
                          <Badge variant={med.stock < (med.min_stock || 10) ? "destructive" : "default"}>
                            {med.stock}
                          </Badge>
                        </TableCell>
                        <TableCell>Rp {med.price.toLocaleString("id-ID")}</TableCell>
                        <TableCell>
                          <Switch
                            checked={med.is_active}
                            onCheckedChange={(checked) => toggleActiveMutation.mutate({ table: "medicines", id: med.id, is_active: checked })}
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
                      <TableHead>Kode</TableHead>
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
                        <TableCell className="font-mono">{room.code}</TableCell>
                        <TableCell className="font-medium">{room.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{room.room_class}</Badge>
                        </TableCell>
                        <TableCell>{room.total_beds}</TableCell>
                        <TableCell>{(room as any).beds?.length || 0}</TableCell>
                        <TableCell>Rp {(room.daily_rate || 0).toLocaleString("id-ID")}</TableCell>
                        <TableCell>
                          <Switch
                            checked={room.is_active}
                            onCheckedChange={(checked) => toggleActiveMutation.mutate({ table: "rooms", id: room.id, is_active: checked })}
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

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Edit, Users, UserCheck, UserX, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const FETCH_OPTS: RequestInit = { credentials: 'include', headers: { 'Content-Type': 'application/json' } };

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, FETCH_OPTS);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return (json.data ?? json) as T;
}
async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { ...FETCH_OPTS, method: 'POST', body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return (json.data ?? json) as T;
}
async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { ...FETCH_OPTS, method: 'PUT', body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return (json.data ?? json) as T;
}

interface Trainee {
  id: string;
  trainee_code: string;
  full_name: string;
  nik: string | null;
  program_id: string | null;
  university: string | null;
  enrollment_date: string;
  expected_graduation: string | null;
  supervisor_id: string | null;
  status: string;
  phone: string | null;
  email: string | null;
  education_programs?: { program_name: string; program_type: string } | null;
}

interface Program {
  id: string;
  program_name: string;
  program_type: string;
}

export default function MedicalTrainees() {
  const { toast } = useToast();
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTrainee, setEditingTrainee] = useState<Trainee | null>(null);
  
  const [formData, setFormData] = useState({
    trainee_code: "",
    full_name: "",
    nik: "",
    program_id: "",
    university: "",
    enrollment_date: "",
    expected_graduation: "",
    status: "active",
    phone: "",
    email: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [traineesData, programsData] = await Promise.all([
        apiFetch<Trainee[]>('/education/trainees'),
        apiFetch<Program[]>('/education/programs'),
      ]);
      setTrainees(Array.isArray(traineesData) ? traineesData : []);
      setPrograms(Array.isArray(programsData) ? programsData : []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        program_id: formData.program_id || null,
        expected_graduation: formData.expected_graduation || null,
      };

      if (editingTrainee) {
        await apiPut(`/education/trainees/${editingTrainee.id}`, payload);
        toast({ title: "Berhasil", description: "Data residen berhasil diperbarui" });
      } else {
        await apiPost('/education/trainees', payload);
        toast({ title: "Berhasil", description: "Residen berhasil ditambahkan" });
      }

      setShowDialog(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({
      trainee_code: "",
      full_name: "",
      nik: "",
      program_id: "",
      university: "",
      enrollment_date: "",
      expected_graduation: "",
      status: "active",
      phone: "",
      email: "",
    });
    setEditingTrainee(null);
  };

  const openEditDialog = (trainee: Trainee) => {
    setEditingTrainee(trainee);
    setFormData({
      trainee_code: trainee.trainee_code,
      full_name: trainee.full_name,
      nik: trainee.nik || "",
      program_id: trainee.program_id || "",
      university: trainee.university || "",
      enrollment_date: trainee.enrollment_date,
      expected_graduation: trainee.expected_graduation || "",
      status: trainee.status,
      phone: trainee.phone || "",
      email: trainee.email || "",
    });
    setShowDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-success">Aktif</Badge>;
      case "on_leave": return <Badge variant="secondary">Cuti</Badge>;
      case "graduated": return <Badge className="bg-info">Lulus</Badge>;
      case "terminated": return <Badge variant="destructive">Berhenti</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{trainees.length}</p>
                <p className="text-sm text-muted-foreground">Total Residen</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold">{trainees.filter(t => t.status === "active").length}</p>
                <p className="text-sm text-muted-foreground">Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-warning" />
              <div>
                <p className="text-2xl font-bold">{trainees.filter(t => t.status === "on_leave").length}</p>
                <p className="text-sm text-muted-foreground">Cuti</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <UserX className="h-8 w-8 text-info" />
              <div>
                <p className="text-2xl font-bold">{trainees.filter(t => t.status === "graduated").length}</p>
                <p className="text-sm text-muted-foreground">Lulus</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trainees Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Daftar Residen/Peserta Didik</CardTitle>
          <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Tambah Residen</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingTrainee ? "Edit Residen" : "Tambah Residen Baru"}</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh]">
                <div className="space-y-4 p-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Kode Residen *</Label>
                      <Input 
                        value={formData.trainee_code}
                        onChange={(e) => setFormData({...formData, trainee_code: e.target.value})}
                        placeholder="RES-001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Aktif</SelectItem>
                          <SelectItem value="on_leave">Cuti</SelectItem>
                          <SelectItem value="graduated">Lulus</SelectItem>
                          <SelectItem value="terminated">Berhenti</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Nama Lengkap *</Label>
                    <Input 
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>NIK</Label>
                    <Input 
                      value={formData.nik}
                      onChange={(e) => setFormData({...formData, nik: e.target.value})}
                      maxLength={16}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Program Pendidikan</Label>
                    <Select value={formData.program_id} onValueChange={(v) => setFormData({...formData, program_id: v})}>
                      <SelectTrigger><SelectValue placeholder="Pilih program" /></SelectTrigger>
                      <SelectContent>
                        {programs.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.program_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Universitas Asal</Label>
                    <Input 
                      value={formData.university}
                      onChange={(e) => setFormData({...formData, university: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tanggal Masuk *</Label>
                      <Input 
                        type="date"
                        value={formData.enrollment_date}
                        onChange={(e) => setFormData({...formData, enrollment_date: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Perkiraan Lulus</Label>
                      <Input 
                        type="date"
                        value={formData.expected_graduation}
                        onChange={(e) => setFormData({...formData, expected_graduation: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Telepon</Label>
                      <Input 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input 
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>
                  <Button className="w-full" onClick={handleSubmit}>
                    {editingTrainee ? "Simpan Perubahan" : "Tambah Residen"}
                  </Button>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Residen</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Universitas</TableHead>
                  <TableHead>Masuk</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trainees.map((trainee) => (
                  <TableRow key={trainee.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{getInitials(trainee.full_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{trainee.full_name}</p>
                          <p className="text-xs text-muted-foreground">{trainee.trainee_code}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {trainee.education_programs ? (
                        <div>
                          <p className="text-sm">{trainee.education_programs.program_name}</p>
                          <Badge variant="outline" className="text-xs">{trainee.education_programs.program_type}</Badge>
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell>{trainee.university || "-"}</TableCell>
                    <TableCell>{format(new Date(trainee.enrollment_date), "dd/MM/yyyy")}</TableCell>
                    <TableCell>{getStatusBadge(trainee.status)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(trainee)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

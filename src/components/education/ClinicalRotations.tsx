import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, RotateCw, CheckCircle, Clock, Calendar } from "lucide-react";
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

interface Rotation {
  id: string;
  trainee_id: string;
  department_id: string;
  start_date: string;
  end_date: string;
  rotation_type: string;
  status: string;
  evaluation_score: number | null;
  evaluation_notes: string | null;
  medical_trainees?: { full_name: string; trainee_code: string } | null;
  departments?: { name: string } | null;
}

export default function ClinicalRotations() {
  const { toast } = useToast();
  const [rotations, setRotations] = useState<Rotation[]>([]);
  const [trainees, setTrainees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRotation, setEditingRotation] = useState<Rotation | null>(null);
  
  const [formData, setFormData] = useState({
    trainee_id: "",
    department_id: "",
    start_date: "",
    end_date: "",
    rotation_type: "Mandatory",
    status: "scheduled",
    evaluation_score: "",
    evaluation_notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rotationsData, traineesData] = await Promise.all([
        apiFetch<Rotation[]>('/education/rotations'),
        apiFetch<any[]>('/education/trainees'),
      ]);
      setRotations(Array.isArray(rotationsData) ? rotationsData : []);
      setTrainees(Array.isArray(traineesData) ? traineesData : []);
      // Departments fetched from trainees or defaulted to empty
      setDepartments([]);
    } catch (error: any) {
      console.error("Error fetching rotations data:", error);
    }
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        evaluation_score: formData.evaluation_score ? parseFloat(formData.evaluation_score) : null,
        evaluation_notes: formData.evaluation_notes || null,
      };

      if (editingRotation) {
        await apiPut(`/education/rotations/${editingRotation.id}`, payload);
        toast({ title: "Berhasil", description: "Rotasi berhasil diperbarui" });
      } else {
        await apiPost('/education/rotations', payload);
        toast({ title: "Berhasil", description: "Rotasi berhasil ditambahkan" });
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
      trainee_id: "",
      department_id: "",
      start_date: "",
      end_date: "",
      rotation_type: "Mandatory",
      status: "scheduled",
      evaluation_score: "",
      evaluation_notes: "",
    });
    setEditingRotation(null);
  };

  const openEditDialog = (rotation: Rotation) => {
    setEditingRotation(rotation);
    setFormData({
      trainee_id: rotation.trainee_id,
      department_id: rotation.department_id,
      start_date: rotation.start_date,
      end_date: rotation.end_date,
      rotation_type: rotation.rotation_type || "Mandatory",
      status: rotation.status,
      evaluation_score: rotation.evaluation_score?.toString() || "",
      evaluation_notes: rotation.evaluation_notes || "",
    });
    setShowDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled": return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Dijadwalkan</Badge>;
      case "ongoing": return <Badge className="bg-info"><RotateCw className="h-3 w-3 mr-1" />Berlangsung</Badge>;
      case "completed": return <Badge className="bg-success"><CheckCircle className="h-3 w-3 mr-1" />Selesai</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{rotations.length}</p>
                <p className="text-sm text-muted-foreground">Total Rotasi</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <RotateCw className="h-8 w-8 text-info" />
              <div>
                <p className="text-2xl font-bold">{rotations.filter(r => r.status === "ongoing").length}</p>
                <p className="text-sm text-muted-foreground">Berlangsung</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-warning" />
              <div>
                <p className="text-2xl font-bold">{rotations.filter(r => r.status === "scheduled").length}</p>
                <p className="text-sm text-muted-foreground">Dijadwalkan</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold">{rotations.filter(r => r.status === "completed").length}</p>
                <p className="text-sm text-muted-foreground">Selesai</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rotations Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Jadwal Rotasi Klinik</CardTitle>
          <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Tambah Rotasi</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingRotation ? "Edit Rotasi" : "Tambah Rotasi Baru"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Residen *</Label>
                  <Select value={formData.trainee_id} onValueChange={(v) => setFormData({...formData, trainee_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Pilih residen" /></SelectTrigger>
                    <SelectContent>
                      {trainees.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.full_name} ({t.trainee_code})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Departemen *</Label>
                  <Select value={formData.department_id} onValueChange={(v) => setFormData({...formData, department_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Pilih departemen" /></SelectTrigger>
                    <SelectContent>
                      {departments.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tanggal Mulai *</Label>
                    <Input 
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tanggal Selesai *</Label>
                    <Input 
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipe Rotasi</Label>
                    <Select value={formData.rotation_type} onValueChange={(v) => setFormData({...formData, rotation_type: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mandatory">Wajib</SelectItem>
                        <SelectItem value="Elective">Pilihan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Dijadwalkan</SelectItem>
                        <SelectItem value="ongoing">Berlangsung</SelectItem>
                        <SelectItem value="completed">Selesai</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {formData.status === "completed" && (
                  <>
                    <div className="space-y-2">
                      <Label>Nilai Evaluasi (0-100)</Label>
                      <Input 
                        type="number"
                        min="0"
                        max="100"
                        value={formData.evaluation_score}
                        onChange={(e) => setFormData({...formData, evaluation_score: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Catatan Evaluasi</Label>
                      <Textarea 
                        value={formData.evaluation_notes}
                        onChange={(e) => setFormData({...formData, evaluation_notes: e.target.value})}
                        rows={3}
                      />
                    </div>
                  </>
                )}
                <Button className="w-full" onClick={handleSubmit}>
                  {editingRotation ? "Simpan Perubahan" : "Tambah Rotasi"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Residen</TableHead>
                  <TableHead>Departemen</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Nilai</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rotations.map((rotation) => (
                  <TableRow key={rotation.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{rotation.medical_trainees?.full_name}</p>
                        <p className="text-xs text-muted-foreground">{rotation.medical_trainees?.trainee_code}</p>
                      </div>
                    </TableCell>
                    <TableCell>{rotation.departments?.name || "-"}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{format(new Date(rotation.start_date), "dd/MM/yy")}</p>
                        <p className="text-muted-foreground">s/d {format(new Date(rotation.end_date), "dd/MM/yy")}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{rotation.rotation_type === "Mandatory" ? "Wajib" : "Pilihan"}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(rotation.status)}</TableCell>
                    <TableCell>
                      {rotation.evaluation_score !== null ? (
                        <span className={rotation.evaluation_score >= 70 ? "text-success font-medium" : "text-warning font-medium"}>
                          {rotation.evaluation_score}
                        </span>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(rotation)}>
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

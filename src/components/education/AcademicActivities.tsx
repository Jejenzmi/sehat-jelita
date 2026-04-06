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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Calendar, Users, Award, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { id } from "date-fns/locale";

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

interface AcademicActivity {
  id: string;
  activity_code: string;
  title: string;
  activity_type: string;
  department_id: string | null;
  activity_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  skp_points: number | null;
  max_participants: number | null;
  registered_count: number;
  description: string | null;
  status: string;
  departments?: { name: string } | null;
}

export default function AcademicActivities() {
  const { toast } = useToast();
  const [activities, setActivities] = useState<AcademicActivity[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingActivity, setEditingActivity] = useState<AcademicActivity | null>(null);
  
  const [formData, setFormData] = useState({
    activity_code: "",
    title: "",
    activity_type: "CME",
    department_id: "",
    activity_date: "",
    start_time: "",
    end_time: "",
    location: "",
    skp_points: "",
    max_participants: "",
    description: "",
    status: "scheduled",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const activitiesData = await apiFetch<AcademicActivity[]>('/education/activities');
      setActivities(Array.isArray(activitiesData) ? activitiesData : []);
      // Departments not available from this endpoint; default to empty
      setDepartments([]);
    } catch (error: any) {
      console.error("Error fetching academic activities:", error);
    }
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        department_id: formData.department_id || null,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        skp_points: formData.skp_points ? parseFloat(formData.skp_points) : null,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
      };

      if (editingActivity) {
        await apiPut(`/education/activities/${editingActivity.id}`, payload);
        toast({ title: "Berhasil", description: "Kegiatan berhasil diperbarui" });
      } else {
        await apiPost('/education/activities', payload);
        toast({ title: "Berhasil", description: "Kegiatan berhasil ditambahkan" });
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
      activity_code: "",
      title: "",
      activity_type: "CME",
      department_id: "",
      activity_date: "",
      start_time: "",
      end_time: "",
      location: "",
      skp_points: "",
      max_participants: "",
      description: "",
      status: "scheduled",
    });
    setEditingActivity(null);
  };

  const openEditDialog = (activity: AcademicActivity) => {
    setEditingActivity(activity);
    setFormData({
      activity_code: activity.activity_code,
      title: activity.title,
      activity_type: activity.activity_type,
      department_id: activity.department_id || "",
      activity_date: activity.activity_date,
      start_time: activity.start_time || "",
      end_time: activity.end_time || "",
      location: activity.location || "",
      skp_points: activity.skp_points?.toString() || "",
      max_participants: activity.max_participants?.toString() || "",
      description: activity.description || "",
      status: activity.status,
    });
    setShowDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled": return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Dijadwalkan</Badge>;
      case "ongoing": return <Badge className="bg-info">Berlangsung</Badge>;
      case "completed": return <Badge className="bg-success">Selesai</Badge>;
      case "cancelled": return <Badge variant="destructive">Dibatalkan</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      "CME": "bg-primary",
      "Seminar": "bg-info",
      "Workshop": "bg-warning",
      "Conference": "bg-success",
      "Morning Report": "bg-secondary",
      "Case Presentation": "bg-muted",
    };
    return <Badge className={colors[type] || ""}>{type}</Badge>;
  };

  const activityTypes = ["CME", "Seminar", "Workshop", "Conference", "Morning Report", "Case Presentation", "Journal Club", "Grand Round"];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{activities.length}</p>
                <p className="text-sm text-muted-foreground">Total Kegiatan</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-info" />
              <div>
                <p className="text-2xl font-bold">{activities.filter(a => a.status === "scheduled").length}</p>
                <p className="text-sm text-muted-foreground">Akan Datang</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-warning" />
              <div>
                <p className="text-2xl font-bold">
                  {activities.reduce((sum, a) => sum + (a.skp_points || 0), 0).toFixed(1)}
                </p>
                <p className="text-sm text-muted-foreground">Total SKP</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold">
                  {activities.reduce((sum, a) => sum + (a.registered_count || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Peserta</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activities Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Daftar Kegiatan Akademik</CardTitle>
          <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Tambah Kegiatan</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingActivity ? "Edit Kegiatan" : "Tambah Kegiatan Baru"}</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh]">
                <div className="space-y-4 p-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Kode Kegiatan *</Label>
                      <Input 
                        value={formData.activity_code}
                        onChange={(e) => setFormData({...formData, activity_code: e.target.value})}
                        placeholder="CME-2024-001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipe Kegiatan</Label>
                      <Select value={formData.activity_type} onValueChange={(v) => setFormData({...formData, activity_type: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {activityTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Judul Kegiatan *</Label>
                    <Input 
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Departemen</Label>
                    <Select value={formData.department_id} onValueChange={(v) => setFormData({...formData, department_id: v})}>
                      <SelectTrigger><SelectValue placeholder="Pilih departemen" /></SelectTrigger>
                      <SelectContent>
                        {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Tanggal *</Label>
                      <Input 
                        type="date"
                        value={formData.activity_date}
                        onChange={(e) => setFormData({...formData, activity_date: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Jam Mulai</Label>
                      <Input 
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Jam Selesai</Label>
                      <Input 
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Lokasi</Label>
                    <Input 
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="Aula Lt. 5 / Online via Zoom"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>SKP Points</Label>
                      <Input 
                        type="number"
                        step="0.5"
                        value={formData.skp_points}
                        onChange={(e) => setFormData({...formData, skp_points: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Maks. Peserta</Label>
                      <Input 
                        type="number"
                        value={formData.max_participants}
                        onChange={(e) => setFormData({...formData, max_participants: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scheduled">Dijadwalkan</SelectItem>
                          <SelectItem value="ongoing">Berlangsung</SelectItem>
                          <SelectItem value="completed">Selesai</SelectItem>
                          <SelectItem value="cancelled">Dibatalkan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Deskripsi</Label>
                    <Textarea 
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <Button className="w-full" onClick={handleSubmit}>
                    {editingActivity ? "Simpan Perubahan" : "Tambah Kegiatan"}
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
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Kegiatan</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead>SKP</TableHead>
                  <TableHead>Peserta</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{format(new Date(activity.activity_date), "dd MMM yyyy", { locale: id })}</p>
                        {activity.start_time && (
                          <p className="text-xs text-muted-foreground">{activity.start_time.slice(0, 5)}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium truncate max-w-[200px]">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.activity_code}</p>
                    </TableCell>
                    <TableCell>{getTypeBadge(activity.activity_type)}</TableCell>
                    <TableCell className="text-sm">{activity.location || "-"}</TableCell>
                    <TableCell>
                      {activity.skp_points ? (
                        <Badge variant="secondary">{activity.skp_points} SKP</Badge>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      {activity.max_participants ? (
                        <span>{activity.registered_count}/{activity.max_participants}</span>
                      ) : activity.registered_count || "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(activity.status)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(activity)}>
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

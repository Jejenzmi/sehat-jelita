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
import { Plus, Edit, FlaskConical, FileCheck, Clock, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ResearchProject {
  id: string;
  project_code: string;
  title: string;
  principal_investigator_id: string | null;
  department_id: string | null;
  research_type: string | null;
  ethics_approval_number: string | null;
  ethics_approval_date: string | null;
  start_date: string | null;
  end_date: string | null;
  funding_source: string | null;
  budget: number | null;
  status: string;
  abstract: string | null;
  doctors?: { name: string } | null;
  departments?: { name: string } | null;
}

export default function ResearchProjects() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<ResearchProject | null>(null);
  
  const [formData, setFormData] = useState({
    project_code: "",
    title: "",
    principal_investigator_id: "",
    department_id: "",
    research_type: "Clinical Trial",
    ethics_approval_number: "",
    ethics_approval_date: "",
    start_date: "",
    end_date: "",
    funding_source: "",
    budget: "",
    status: "proposed",
    abstract: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [projectsRes, doctorsRes, deptsRes] = await Promise.all([
      supabase.from("research_projects")
        .select("*, doctors:principal_investigator_id(full_name), departments(name)")
        .order("created_at", { ascending: false }),
      supabase.from("doctors").select("id, full_name").eq("is_active", true),
      supabase.from("departments").select("id, name").eq("is_active", true)
    ]);
    
    if (projectsRes.data) setProjects(projectsRes.data as any);
    if (doctorsRes.data) setDoctors(doctorsRes.data as any);
    if (deptsRes.data) setDepartments(deptsRes.data);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        principal_investigator_id: formData.principal_investigator_id || null,
        department_id: formData.department_id || null,
        ethics_approval_date: formData.ethics_approval_date || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
      };

      if (editingProject) {
        const { error } = await supabase.from("research_projects").update(payload).eq("id", editingProject.id);
        if (error) throw error;
        toast({ title: "Berhasil", description: "Proyek penelitian berhasil diperbarui" });
      } else {
        const { error } = await supabase.from("research_projects").insert(payload);
        if (error) throw error;
        toast({ title: "Berhasil", description: "Proyek penelitian berhasil ditambahkan" });
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
      project_code: "",
      title: "",
      principal_investigator_id: "",
      department_id: "",
      research_type: "Clinical Trial",
      ethics_approval_number: "",
      ethics_approval_date: "",
      start_date: "",
      end_date: "",
      funding_source: "",
      budget: "",
      status: "proposed",
      abstract: "",
    });
    setEditingProject(null);
  };

  const openEditDialog = (project: ResearchProject) => {
    setEditingProject(project);
    setFormData({
      project_code: project.project_code,
      title: project.title,
      principal_investigator_id: project.principal_investigator_id || "",
      department_id: project.department_id || "",
      research_type: project.research_type || "Clinical Trial",
      ethics_approval_number: project.ethics_approval_number || "",
      ethics_approval_date: project.ethics_approval_date || "",
      start_date: project.start_date || "",
      end_date: project.end_date || "",
      funding_source: project.funding_source || "",
      budget: project.budget?.toString() || "",
      status: project.status,
      abstract: project.abstract || "",
    });
    setShowDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "proposed": return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Diajukan</Badge>;
      case "approved": return <Badge className="bg-info"><FileCheck className="h-3 w-3 mr-1" />Disetujui</Badge>;
      case "ongoing": return <Badge className="bg-warning"><FlaskConical className="h-3 w-3 mr-1" />Berlangsung</Badge>;
      case "completed": return <Badge className="bg-success"><CheckCircle className="h-3 w-3 mr-1" />Selesai</Badge>;
      case "terminated": return <Badge variant="destructive">Dihentikan</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const researchTypes = ["Clinical Trial", "Observational", "Basic Science", "Epidemiology", "Case Report", "Review"];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FlaskConical className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{projects.length}</p>
                <p className="text-sm text-muted-foreground">Total Penelitian</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-warning" />
              <div>
                <p className="text-2xl font-bold">{projects.filter(p => p.status === "ongoing").length}</p>
                <p className="text-sm text-muted-foreground">Berlangsung</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold">{projects.filter(p => p.status === "completed").length}</p>
                <p className="text-sm text-muted-foreground">Selesai</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileCheck className="h-8 w-8 text-info" />
              <div>
                <p className="text-2xl font-bold">{projects.filter(p => p.ethics_approval_number).length}</p>
                <p className="text-sm text-muted-foreground">Ethical Approval</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Daftar Proyek Penelitian</CardTitle>
          <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Tambah Penelitian</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingProject ? "Edit Penelitian" : "Tambah Penelitian Baru"}</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh]">
                <div className="space-y-4 p-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Kode Proyek *</Label>
                      <Input 
                        value={formData.project_code}
                        onChange={(e) => setFormData({...formData, project_code: e.target.value})}
                        placeholder="RES-2024-001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipe Penelitian</Label>
                      <Select value={formData.research_type} onValueChange={(v) => setFormData({...formData, research_type: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {researchTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Judul Penelitian *</Label>
                    <Textarea 
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Peneliti Utama</Label>
                      <Select value={formData.principal_investigator_id} onValueChange={(v) => setFormData({...formData, principal_investigator_id: v})}>
                        <SelectTrigger><SelectValue placeholder="Pilih dokter" /></SelectTrigger>
                        <SelectContent>
                          {doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}
                        </SelectContent>
                      </Select>
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
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>No. Ethical Approval</Label>
                      <Input 
                        value={formData.ethics_approval_number}
                        onChange={(e) => setFormData({...formData, ethics_approval_number: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tanggal Ethical Approval</Label>
                      <Input 
                        type="date"
                        value={formData.ethics_approval_date}
                        onChange={(e) => setFormData({...formData, ethics_approval_date: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Tanggal Mulai</Label>
                      <Input 
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tanggal Selesai</Label>
                      <Input 
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="proposed">Diajukan</SelectItem>
                          <SelectItem value="approved">Disetujui</SelectItem>
                          <SelectItem value="ongoing">Berlangsung</SelectItem>
                          <SelectItem value="completed">Selesai</SelectItem>
                          <SelectItem value="terminated">Dihentikan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Sumber Dana</Label>
                      <Input 
                        value={formData.funding_source}
                        onChange={(e) => setFormData({...formData, funding_source: e.target.value})}
                        placeholder="Internal / Hibah / Industri"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Anggaran (Rp)</Label>
                      <Input 
                        type="number"
                        value={formData.budget}
                        onChange={(e) => setFormData({...formData, budget: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Abstrak</Label>
                    <Textarea 
                      value={formData.abstract}
                      onChange={(e) => setFormData({...formData, abstract: e.target.value})}
                      rows={4}
                    />
                  </div>
                  <Button className="w-full" onClick={handleSubmit}>
                    {editingProject ? "Simpan Perubahan" : "Tambah Penelitian"}
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
                  <TableHead>Kode</TableHead>
                  <TableHead>Judul</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Peneliti Utama</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-mono">{project.project_code}</TableCell>
                    <TableCell>
                      <p className="font-medium truncate max-w-[250px]">{project.title}</p>
                      {project.ethics_approval_number && (
                        <p className="text-xs text-muted-foreground">EC: {project.ethics_approval_number}</p>
                      )}
                    </TableCell>
                    <TableCell><Badge variant="outline">{project.research_type}</Badge></TableCell>
                    <TableCell>{(project.doctors as any)?.full_name || "-"}</TableCell>
                    <TableCell>{getStatusBadge(project.status)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(project)}>
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

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
import { Plus, Edit, GraduationCap, Users, Clock } from "lucide-react";
import { db } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";

interface EducationProgram {
  id: string;
  program_code: string;
  program_name: string;
  program_type: string;
  affiliated_university: string | null;
  accreditation_status: string | null;
  max_students: number | null;
  duration_months: number | null;
  is_active: boolean;
}

export default function EducationPrograms() {
  const { toast } = useToast();
  const [programs, setPrograms] = useState<EducationProgram[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingProgram, setEditingProgram] = useState<EducationProgram | null>(null);
  
  const [formData, setFormData] = useState({
    program_code: "",
    program_name: "",
    program_type: "Spesialis",
    affiliated_university: "",
    accreditation_status: "A",
    max_students: "",
    duration_months: "",
  });

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    setIsLoading(true);
    const { data, error } = await db
      .from("education_programs")
      .select("*")
      .order("program_name");
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setPrograms(data || []);
    }
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        max_students: formData.max_students ? parseInt(formData.max_students) : null,
        duration_months: formData.duration_months ? parseInt(formData.duration_months) : null,
      };

      if (editingProgram) {
        const { error } = await db
          .from("education_programs")
          .update(payload)
          .eq("id", editingProgram.id);
        if (error) throw error;
        toast({ title: "Berhasil", description: "Program berhasil diperbarui" });
      } else {
        const { error } = await db.from("education_programs").insert(payload);
        if (error) throw error;
        toast({ title: "Berhasil", description: "Program berhasil ditambahkan" });
      }

      setShowDialog(false);
      resetForm();
      fetchPrograms();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({
      program_code: "",
      program_name: "",
      program_type: "Spesialis",
      affiliated_university: "",
      accreditation_status: "A",
      max_students: "",
      duration_months: "",
    });
    setEditingProgram(null);
  };

  const openEditDialog = (program: EducationProgram) => {
    setEditingProgram(program);
    setFormData({
      program_code: program.program_code,
      program_name: program.program_name,
      program_type: program.program_type,
      affiliated_university: program.affiliated_university || "",
      accreditation_status: program.accreditation_status || "A",
      max_students: program.max_students?.toString() || "",
      duration_months: program.duration_months?.toString() || "",
    });
    setShowDialog(true);
  };

  const programTypes = ["Dokter Umum", "Spesialis", "Subspesialis", "Keperawatan", "Fellowship"];
  const accreditationStatuses = ["A", "B", "C", "Dalam Proses", "Belum Terakreditasi"];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{programs.length}</p>
                <p className="text-sm text-muted-foreground">Total Program</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-info" />
              <div>
                <p className="text-2xl font-bold">{programs.filter(p => p.program_type === "Spesialis").length}</p>
                <p className="text-sm text-muted-foreground">Program PPDS</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Badge className="h-8 w-8 flex items-center justify-center">A</Badge>
              <div>
                <p className="text-2xl font-bold">{programs.filter(p => p.accreditation_status === "A").length}</p>
                <p className="text-sm text-muted-foreground">Akreditasi A</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-warning" />
              <div>
                <p className="text-2xl font-bold">{programs.filter(p => p.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Program Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Programs Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Daftar Program Pendidikan</CardTitle>
          <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Tambah Program</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingProgram ? "Edit Program" : "Tambah Program Baru"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Kode Program *</Label>
                    <Input 
                      value={formData.program_code}
                      onChange={(e) => setFormData({...formData, program_code: e.target.value})}
                      placeholder="PROG-XXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipe Program</Label>
                    <Select value={formData.program_type} onValueChange={(v) => setFormData({...formData, program_type: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {programTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Nama Program *</Label>
                  <Input 
                    value={formData.program_name}
                    onChange={(e) => setFormData({...formData, program_name: e.target.value})}
                    placeholder="PPDS Ilmu Bedah"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Universitas Afiliasi</Label>
                  <Input 
                    value={formData.affiliated_university}
                    onChange={(e) => setFormData({...formData, affiliated_university: e.target.value})}
                    placeholder="Universitas Indonesia"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Akreditasi</Label>
                    <Select value={formData.accreditation_status} onValueChange={(v) => setFormData({...formData, accreditation_status: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {accreditationStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Maks. Peserta</Label>
                    <Input 
                      type="number"
                      value={formData.max_students}
                      onChange={(e) => setFormData({...formData, max_students: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Durasi (bulan)</Label>
                    <Input 
                      type="number"
                      value={formData.duration_months}
                      onChange={(e) => setFormData({...formData, duration_months: e.target.value})}
                    />
                  </div>
                </div>
                <Button className="w-full" onClick={handleSubmit}>
                  {editingProgram ? "Simpan Perubahan" : "Tambah Program"}
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
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama Program</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Universitas</TableHead>
                  <TableHead>Akreditasi</TableHead>
                  <TableHead>Durasi</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programs.map((program) => (
                  <TableRow key={program.id}>
                    <TableCell className="font-mono">{program.program_code}</TableCell>
                    <TableCell className="font-medium">{program.program_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{program.program_type}</Badge>
                    </TableCell>
                    <TableCell>{program.affiliated_university || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={program.accreditation_status === "A" ? "default" : "secondary"}>
                        {program.accreditation_status || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>{program.duration_months ? `${program.duration_months} bulan` : "-"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(program)}>
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

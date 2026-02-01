import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { 
  useTrainingRecords, 
  useEmployees, 
  useAddTraining,
  TrainingRecord
} from "@/hooks/useHRData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogFooter
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
import { Plus, GraduationCap, Eye, Award } from "lucide-react";

export function TrainingTab() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<TrainingRecord | null>(null);
  
  const { data: trainings, isLoading } = useTrainingRecords();
  const { data: employees } = useEmployees();
  const addTraining = useAddTraining();

  const formatCurrency = (amount?: number) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleAddTraining = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    addTraining.mutate({
      employee_id: formData.get("employee_id") as string,
      training_name: formData.get("training_name") as string,
      training_type: formData.get("training_type") as any,
      provider: formData.get("provider") as string || undefined,
      start_date: formData.get("start_date") as string,
      end_date: formData.get("end_date") as string || undefined,
      duration_hours: parseInt(formData.get("duration_hours") as string) || undefined,
      location: formData.get("location") as string || undefined,
      cost: parseFloat(formData.get("cost") as string) || undefined,
      notes: formData.get("notes") as string || undefined,
      status: "registered",
    }, {
      onSuccess: () => setIsAddOpen(false),
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default">Selesai</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500">Berlangsung</Badge>;
      case "registered":
        return <Badge variant="secondary">Terdaftar</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Dibatalkan</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTrainingTypeLabel = (type: string) => {
    switch (type) {
      case "internal":
        return "Internal";
      case "external":
        return "Eksternal";
      case "online":
        return "Online";
      case "certification":
        return "Sertifikasi";
      default:
        return type;
    }
  };

  const activeEmployees = employees?.filter(e => e.status === "active");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Pelatihan & Pengembangan
            </CardTitle>
            <CardDescription>Kelola pelatihan dan sertifikasi karyawan</CardDescription>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Pelatihan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Tambah Pelatihan</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddTraining} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="employee_id">Karyawan *</Label>
                  <Select name="employee_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Karyawan" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeEmployees?.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="training_name">Nama Pelatihan *</Label>
                  <Input id="training_name" name="training_name" required />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="training_type">Jenis *</Label>
                    <Select name="training_type" defaultValue="internal">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="internal">Internal</SelectItem>
                        <SelectItem value="external">Eksternal</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="certification">Sertifikasi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="provider">Penyelenggara</Label>
                    <Input id="provider" name="provider" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Tanggal Mulai *</Label>
                    <Input id="start_date" name="start_date" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">Tanggal Selesai</Label>
                    <Input id="end_date" name="end_date" type="date" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration_hours">Durasi (Jam)</Label>
                    <Input id="duration_hours" name="duration_hours" type="number" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost">Biaya</Label>
                    <Input id="cost" name="cost" type="number" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Lokasi</Label>
                  <Input id="location" name="location" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan</Label>
                  <Textarea id="notes" name="notes" rows={2} />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={addTraining.isPending}>
                    {addTraining.isPending ? "Menyimpan..." : "Simpan"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
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
                <TableHead>Karyawan</TableHead>
                <TableHead>Nama Pelatihan</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Durasi</TableHead>
                <TableHead className="text-right">Biaya</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trainings?.map((training) => (
                <TableRow key={training.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{(training.employees as any)?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(training.employees as any)?.position}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{training.training_name}</p>
                      {training.provider && (
                        <p className="text-sm text-muted-foreground">{training.provider}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getTrainingTypeLabel(training.training_type)}</Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(training.start_date), "dd MMM yyyy", { locale: id })}
                    {training.end_date && training.end_date !== training.start_date && (
                      <> - {format(new Date(training.end_date), "dd MMM yyyy", { locale: id })}</>
                    )}
                  </TableCell>
                  <TableCell>
                    {training.duration_hours ? `${training.duration_hours} jam` : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(training.cost)}
                  </TableCell>
                  <TableCell>{getStatusBadge(training.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setSelectedTraining(training);
                        setIsViewOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {trainings?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Tidak ada data pelatihan
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detail Pelatihan</DialogTitle>
          </DialogHeader>
          {selectedTraining && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Karyawan</p>
                  <p className="font-medium">{(selectedTraining.employees as any)?.full_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  {getStatusBadge(selectedTraining.status)}
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Nama Pelatihan</p>
                  <p className="font-medium">{selectedTraining.training_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Jenis</p>
                  <p className="font-medium">{getTrainingTypeLabel(selectedTraining.training_type)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Penyelenggara</p>
                  <p className="font-medium">{selectedTraining.provider || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tanggal</p>
                  <p className="font-medium">
                    {format(new Date(selectedTraining.start_date), "dd MMM yyyy", { locale: id })}
                    {selectedTraining.end_date && selectedTraining.end_date !== selectedTraining.start_date && (
                      <> - {format(new Date(selectedTraining.end_date), "dd MMM yyyy", { locale: id })}</>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Durasi</p>
                  <p className="font-medium">
                    {selectedTraining.duration_hours ? `${selectedTraining.duration_hours} jam` : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Lokasi</p>
                  <p className="font-medium">{selectedTraining.location || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Biaya</p>
                  <p className="font-medium">{formatCurrency(selectedTraining.cost)}</p>
                </div>
                {selectedTraining.certificate_number && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">No. Sertifikat</p>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      <p className="font-medium">{selectedTraining.certificate_number}</p>
                    </div>
                  </div>
                )}
                {selectedTraining.score !== undefined && selectedTraining.score !== null && (
                  <div>
                    <p className="text-muted-foreground">Nilai</p>
                    <p className="font-medium">{selectedTraining.score}</p>
                  </div>
                )}
              </div>
              {selectedTraining.notes && (
                <div>
                  <p className="text-muted-foreground text-sm">Catatan</p>
                  <p className="text-sm">{selectedTraining.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

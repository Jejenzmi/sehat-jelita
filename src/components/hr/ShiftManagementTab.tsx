import { useState } from "react";
import { useWorkShifts } from "@/hooks/useHRData";
import { db } from "@/lib/db";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Moon, Sun, Clock, Trash2 } from "lucide-react";

interface ShiftFormData {
  shift_code: string;
  shift_name: string;
  start_time: string;
  end_time: string;
  break_duration: number;
  is_night_shift: boolean;
  allowance_amount: number;
  is_active: boolean;
}

export function ShiftManagementTab() {
  const { data: shifts, isLoading } = useWorkShifts();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addShift = useMutation({
    mutationFn: async (data: ShiftFormData) => {
      const { error } = await db.from("work_shifts").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-shifts"] });
      toast({ title: "Berhasil", description: "Shift kerja berhasil ditambahkan" });
      setIsAddOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateShift = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ShiftFormData> }) => {
      const { error } = await db.from("work_shifts").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-shifts"] });
      toast({ title: "Berhasil", description: "Shift kerja berhasil diperbarui" });
      setEditingShift(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteShift = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("work_shifts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-shifts"] });
      toast({ title: "Berhasil", description: "Shift kerja berhasil dihapus" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: ShiftFormData = {
      shift_code: formData.get("shift_code") as string,
      shift_name: formData.get("shift_name") as string,
      start_time: formData.get("start_time") as string,
      end_time: formData.get("end_time") as string,
      break_duration: parseInt(formData.get("break_duration") as string) || 60,
      is_night_shift: formData.get("is_night_shift") === "on",
      allowance_amount: parseFloat(formData.get("allowance_amount") as string) || 0,
      is_active: true,
    };

    if (editingShift) {
      updateShift.mutate({ id: editingShift.id, data });
    } else {
      addShift.mutate(data);
    }
  };

  const formatTime = (time: string) => {
    return time?.substring(0, 5) || "-";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const ShiftForm = ({ shift }: { shift?: any }) => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="shift_code">Kode Shift *</Label>
          <Input
            id="shift_code"
            name="shift_code"
            defaultValue={shift?.shift_code}
            placeholder="Contoh: PAGI"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shift_name">Nama Shift *</Label>
          <Input
            id="shift_name"
            name="shift_name"
            defaultValue={shift?.shift_name}
            placeholder="Contoh: Shift Pagi"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_time">Jam Mulai *</Label>
          <Input
            id="start_time"
            name="start_time"
            type="time"
            defaultValue={shift?.start_time?.substring(0, 5)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_time">Jam Selesai *</Label>
          <Input
            id="end_time"
            name="end_time"
            type="time"
            defaultValue={shift?.end_time?.substring(0, 5)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="break_duration">Durasi Istirahat (menit)</Label>
          <Input
            id="break_duration"
            name="break_duration"
            type="number"
            defaultValue={shift?.break_duration || 60}
            min={0}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="allowance_amount">Tunjangan Shift (Rp)</Label>
          <Input
            id="allowance_amount"
            name="allowance_amount"
            type="number"
            defaultValue={shift?.allowance_amount || 0}
            min={0}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_night_shift"
          name="is_night_shift"
          defaultChecked={shift?.is_night_shift}
        />
        <Label htmlFor="is_night_shift" className="flex items-center gap-2">
          <Moon className="h-4 w-4" />
          Shift Malam
        </Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={addShift.isPending || updateShift.isPending}>
          {shift ? "Simpan Perubahan" : "Tambah Shift"}
        </Button>
      </div>
    </form>
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Memuat data shift...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pengaturan Shift Kerja
          </CardTitle>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Shift
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Shift Baru</DialogTitle>
              </DialogHeader>
              <ShiftForm />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Nama Shift</TableHead>
              <TableHead>Jam Kerja</TableHead>
              <TableHead>Istirahat</TableHead>
              <TableHead>Tunjangan</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shifts?.map((shift) => (
              <TableRow key={shift.id}>
                <TableCell className="font-medium">{shift.shift_code}</TableCell>
                <TableCell>{shift.shift_name}</TableCell>
                <TableCell>
                  {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                </TableCell>
                <TableCell>{shift.break_duration} menit</TableCell>
                <TableCell>{formatCurrency(shift.allowance_amount || 0)}</TableCell>
                <TableCell>
                  {shift.is_night_shift ? (
                    <Badge variant="secondary" className="gap-1">
                      <Moon className="h-3 w-3" />
                      Malam
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      <Sun className="h-3 w-3" />
                      Siang
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={shift.is_active ? "default" : "destructive"}>
                    {shift.is_active ? "Aktif" : "Nonaktif"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Dialog
                      open={editingShift?.id === shift.id}
                      onOpenChange={(open) => !open && setEditingShift(null)}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingShift(shift)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Shift</DialogTitle>
                        </DialogHeader>
                        <ShiftForm shift={editingShift} />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteShift.mutate(shift.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!shifts || shifts.length === 0) && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                  Belum ada data shift kerja
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

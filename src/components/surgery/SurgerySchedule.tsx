import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search, Calendar, Eye, Edit, Trash2 } from "lucide-react";
import { useSurgeryData } from "@/hooks/useSurgeryData";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { SurgeryForm } from "./SurgeryForm";
import { SurgeryDetailDialog } from "./SurgeryDetailDialog";

export function SurgerySchedule() {
  const { surgeries, isLoading } = useSurgeryData();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSurgery, setSelectedSurgery] = useState<string | null>(null);
  const [detailSurgeryId, setDetailSurgeryId] = useState<string | null>(null);

  const filteredSurgeries = surgeries.filter((surgery) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      surgery.patient?.full_name?.toLowerCase().includes(searchLower) ||
      surgery.patient?.medical_record_number?.toLowerCase().includes(searchLower) ||
      surgery.procedure_name?.toLowerCase().includes(searchLower) ||
      surgery.surgery_number?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      scheduled: { label: "Terjadwal", variant: "secondary" },
      preparation: { label: "Persiapan", variant: "outline" },
      in_progress: { label: "Berlangsung", variant: "default" },
      completed: { label: "Selesai", variant: "secondary" },
      cancelled: { label: "Dibatalkan", variant: "destructive" },
      postponed: { label: "Ditunda", variant: "outline" },
    };
    const config = statusConfig[status] || { label: status, variant: "secondary" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getProcedureTypeBadge = (type: string) => {
    const typeConfig: Record<string, { label: string; className: string }> = {
      elective: { label: "Elektif", className: "bg-blue-100 text-blue-800" },
      emergency: { label: "Cito", className: "bg-red-100 text-red-800" },
      urgent: { label: "Urgent", className: "bg-orange-100 text-orange-800" },
    };
    const config = typeConfig[type] || { label: type, className: "" };
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  if (isLoading) {
    return <div className="text-center py-8">Memuat data...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Jadwal Operasi
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari pasien, prosedur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Jadwal Baru
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Buat Jadwal Operasi Baru</DialogTitle>
                  </DialogHeader>
                  <SurgeryForm onSuccess={() => setIsFormOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Operasi</TableHead>
                  <TableHead>Tanggal & Waktu</TableHead>
                  <TableHead>Pasien</TableHead>
                  <TableHead>Prosedur</TableHead>
                  <TableHead>Ruang OK</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSurgeries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Tidak ada data jadwal operasi
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSurgeries.map((surgery) => (
                    <TableRow key={surgery.id}>
                      <TableCell className="font-medium">{surgery.surgery_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {format(new Date(surgery.scheduled_date), "dd MMM yyyy", { locale: id })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {surgery.scheduled_start_time.slice(0, 5)}
                            {surgery.scheduled_end_time && ` - ${surgery.scheduled_end_time.slice(0, 5)}`}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{surgery.patient?.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {surgery.patient?.medical_record_number}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <p className="font-medium truncate">{surgery.procedure_name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {surgery.preoperative_diagnosis}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{surgery.operating_room?.room_number || "-"}</TableCell>
                      <TableCell>{getProcedureTypeBadge(surgery.procedure_type)}</TableCell>
                      <TableCell>{getStatusBadge(surgery.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDetailSurgeryId(surgery.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {detailSurgeryId && (
        <SurgeryDetailDialog
          surgeryId={detailSurgeryId}
          open={!!detailSurgeryId}
          onClose={() => setDetailSurgeryId(null)}
        />
      )}
    </div>
  );
}

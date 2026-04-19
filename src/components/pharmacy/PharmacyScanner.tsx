import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { QrCode, Search, CheckCircle, Package, Clock, User, Pill, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface PrescriptionData {
  id: string;
  prescription_number: string;
  prescription_date: string;
  status: string;
  notes: string | null;
  pickup_code: string | null;
  patient: {
    full_name: string;
    medical_record_number: string;
  } | null;
  doctor: {
    full_name: string;
  } | null;
  items: {
    id: string;
    dosage: string;
    frequency: string;
    quantity: number;
    medicine: {
      name: string;
      unit: string;
      stock: number;
    } | null;
  }[];
}

export default function PharmacyScanner() {
  const [searchCode, setSearchCode] = useState("");
  const [prescription, setPrescription] = useState<PrescriptionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const searchPrescription = async () => {
    if (!searchCode.trim()) {
      toast.error("Masukkan kode pickup atau scan QR code");
      return;
    }

    setLoading(true);
    setPrescription(null);

    try {
      // Search by pickup_code or qr_token
      const { data, error } = await supabase
        .from("prescriptions")
        .select(`
          id,
          prescription_number,
          prescription_date,
          status,
          notes,
          pickup_code,
          patient:patient_id (
            full_name,
            medical_record_number
          ),
          doctor:doctor_id (
            full_name
          )
        `)
        .or(`pickup_code.eq.${searchCode.toUpperCase()},qr_token.eq.${searchCode}`)
        .single();

      if (error || !data) {
        toast.error("Resep tidak ditemukan");
        return;
      }

      // Fetch items
      const { data: items } = await supabase
        .from("prescription_items")
        .select(`
          id,
          dosage,
          frequency,
          quantity,
          medicine:medicine_id (
            name,
            unit,
            stock
          )
        `)
        .eq("prescription_id", data.id);

      setPrescription({
        ...data,
        items: items || [],
      });
    } catch (error) {
      console.error("Error searching prescription:", error);
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPrescription = async () => {
    if (!prescription) return;

    setProcessing(true);

    try {
      // Update prescription status
      const { error: updateError } = await supabase
        .from("prescriptions")
        .update({
          status: "diproses",
          processed_at: new Date().toISOString(),
        })
        .eq("id", prescription.id);

      if (updateError) throw updateError;

      // Update stock for each medicine
      for (const item of prescription.items) {
        if (item.medicine) {
          const newStock = item.medicine.stock - item.quantity;
          await supabase
            .from("medicines")
            .update({ stock: Math.max(0, newStock) })
            .eq("name", item.medicine.name);
        }
      }

      toast.success("Resep sedang diproses");
      setPrescription({
        ...prescription,
        status: "diproses",
      });
      setShowConfirmDialog(false);
    } catch (error: any) {
      toast.error(error.message || "Gagal memproses resep");
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkReady = async () => {
    if (!prescription) return;

    setProcessing(true);

    try {
      const { error } = await supabase
        .from("prescriptions")
        .update({ status: "siap" })
        .eq("id", prescription.id);

      if (error) throw error;

      toast.success("Resep siap diambil");
      setPrescription({
        ...prescription,
        status: "siap",
      });
    } catch (error: any) {
      toast.error(error.message || "Gagal mengubah status");
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkDelivered = async () => {
    if (!prescription) return;

    setProcessing(true);

    try {
      const { error } = await supabase
        .from("prescriptions")
        .update({ status: "diserahkan" })
        .eq("id", prescription.id);

      if (error) throw error;

      toast.success("Obat sudah diserahkan ke pasien");
      setPrescription({
        ...prescription,
        status: "diserahkan",
      });
    } catch (error: any) {
      toast.error(error.message || "Gagal mengubah status");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "diserahkan":
        return <Badge className="bg-green-500/10 text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Sudah Diserahkan</Badge>;
      case "siap":
        return <Badge className="bg-blue-500/10 text-blue-600"><Package className="h-3 w-3 mr-1" />Siap Diambil</Badge>;
      case "diproses":
        return <Badge className="bg-amber-500/10 text-amber-600"><Clock className="h-3 w-3 mr-1" />Sedang Diproses</Badge>;
      case "menunggu":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Menunggu</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Scanner Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Scanner E-Prescription
          </CardTitle>
          <CardDescription>
            Scan QR code atau masukkan kode pickup untuk mencari resep
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Masukkan kode pickup (contoh: ABC123)"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && searchPrescription()}
              className="font-mono text-lg tracking-wider"
            />
            <Button onClick={searchPrescription} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              {loading ? "Mencari..." : "Cari"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Prescription Result */}
      {prescription && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{prescription.prescription_number}</CardTitle>
                <CardDescription>
                  {format(new Date(prescription.prescription_date), "d MMMM yyyy, HH:mm", { locale: id })}
                </CardDescription>
              </div>
              {getStatusBadge(prescription.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Patient & Doctor Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pasien</p>
                  <p className="font-semibold">{prescription.patient?.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {prescription.patient?.medical_record_number}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dokter</p>
                  <p className="font-semibold">{prescription.doctor?.full_name}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Medicine List */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Pill className="h-4 w-4" />
                Daftar Obat
              </h4>
              <div className="space-y-3">
                {prescription.items.map((item, index) => (
                  <div key={item.id} className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {index + 1}. {item.medicine?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.dosage} - {item.frequency}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">
                          {item.quantity} {item.medicine?.unit}
                        </Badge>
                        {item.medicine && item.medicine.stock < item.quantity && (
                          <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Stok: {item.medicine.stock}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {prescription.notes && (
              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">Catatan Dokter</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">{prescription.notes}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              {prescription.status === "menunggu" && (
                <Button onClick={() => setShowConfirmDialog(true)} className="flex-1">
                  <Clock className="h-4 w-4 mr-2" />
                  Proses Resep
                </Button>
              )}
              {prescription.status === "diproses" && (
                <Button onClick={handleMarkReady} disabled={processing} className="flex-1">
                  <Package className="h-4 w-4 mr-2" />
                  Tandai Siap
                </Button>
              )}
              {prescription.status === "siap" && (
                <Button onClick={handleMarkDelivered} disabled={processing} className="flex-1 bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Serahkan ke Pasien
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Proses Resep</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Apakah Anda yakin ingin memproses resep ini? Stok obat akan dikurangi secara otomatis.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleProcessPrescription} disabled={processing}>
              {processing ? "Memproses..." : "Ya, Proses"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

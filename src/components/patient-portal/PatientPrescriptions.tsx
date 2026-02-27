import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Pill, Calendar, QrCode, CheckCircle, Clock, Package, Copy } from "lucide-react";
import { db } from "@/lib/db";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";
import QRCode from "@/components/patient-portal/QRCodeGenerator";

interface Prescription {
  id: string;
  prescription_number: string;
  prescription_date: string;
  status: string;
  notes: string | null;
  qr_token: string | null;
  pickup_code: string | null;
  doctor: {
    full_name: string;
    specialization: string | null;
  } | null;
  items: {
    id: string;
    dosage: string;
    frequency: string;
    duration: string | null;
    quantity: number;
    instructions: string | null;
    medicine: {
      name: string;
      unit: string;
    } | null;
  }[];
}

export default function PatientPrescriptions() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPrescriptions();
    }
  }, [user]);

  const fetchPrescriptions = async () => {
    try {
      const { data: patient } = await db
        .from("patients")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!patient) return;

      const { data, error } = await db
        .from("prescriptions")
        .select(`
          id,
          prescription_number,
          prescription_date,
          status,
          notes,
          qr_token,
          pickup_code,
          doctor:doctor_id (
            full_name,
            specialization
          )
        `)
        .eq("patient_id", patient.id)
        .order("prescription_date", { ascending: false });

      if (error) throw error;

      // Fetch items for each prescription
      const prescriptionsWithItems = await Promise.all(
        (data || []).map(async (prescription) => {
          const { data: items } = await db
            .from("prescription_items")
            .select(`
              id,
              dosage,
              frequency,
              duration,
              quantity,
              instructions,
              medicine:medicine_id (
                name,
                unit
              )
            `)
            .eq("prescription_id", prescription.id);

          return {
            ...prescription,
            items: items || [],
          };
        })
      );

      setPrescriptions(prescriptionsWithItems);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "diserahkan":
        return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20"><CheckCircle className="h-3 w-3 mr-1" />Sudah Diambil</Badge>;
      case "siap":
        return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"><Package className="h-3 w-3 mr-1" />Siap Diambil</Badge>;
      case "diproses":
        return <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"><Clock className="h-3 w-3 mr-1" />Sedang Disiapkan</Badge>;
      case "menunggu":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Menunggu</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const copyPickupCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Kode pickup disalin!");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (prescriptions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Belum ada resep obat</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              E-Prescription
            </CardTitle>
            <CardDescription>
              Resep obat digital dengan QR Code untuk pengambilan di farmasi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {prescriptions.map((prescription) => (
                  <Card key={prescription.id} className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{prescription.prescription_number}</p>
                            {getStatusBadge(prescription.status)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(prescription.prescription_date), "d MMM yyyy", { locale: id })}
                            </span>
                            <span>{prescription.items.length} item obat</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {(prescription.status === "siap" || prescription.status === "menunggu" || prescription.status === "diproses") && prescription.qr_token && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                setSelectedPrescription(prescription);
                                setShowQR(true);
                              }}
                            >
                              <QrCode className="h-4 w-4 mr-1" />
                              QR Code
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPrescription(prescription);
                              setShowQR(false);
                            }}
                          >
                            Detail
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Detail/QR Dialog */}
      <Dialog open={!!selectedPrescription} onOpenChange={() => setSelectedPrescription(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {showQR ? "QR Code Pengambilan Obat" : "Detail Resep"}
            </DialogTitle>
          </DialogHeader>
          {selectedPrescription && (
            <div className="space-y-4">
              {showQR ? (
                <div className="text-center space-y-4">
                  <div className="bg-white p-6 rounded-xl inline-block">
                    <QRCode value={selectedPrescription.qr_token || ""} size={200} />
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Kode Pickup</p>
                    <div className="flex items-center justify-center gap-2">
                      <code className="text-2xl font-bold tracking-widest bg-muted px-4 py-2 rounded-lg">
                        {selectedPrescription.pickup_code}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyPickupCode(selectedPrescription.pickup_code || "")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Tunjukkan QR code atau sebutkan kode pickup ini di apotek rumah sakit
                  </p>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowQR(false)}
                  >
                    Lihat Detail Obat
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">No. Resep</p>
                      <p className="font-medium">{selectedPrescription.prescription_number}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tanggal</p>
                      <p className="font-medium">
                        {format(new Date(selectedPrescription.prescription_date), "d MMMM yyyy", { locale: id })}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Dokter</p>
                      <p className="font-medium">{selectedPrescription.doctor?.full_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      {getStatusBadge(selectedPrescription.status)}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-3">Daftar Obat</h4>
                    <div className="space-y-3">
                      {selectedPrescription.items.map((item, index) => (
                        <div key={item.id} className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">
                                {index + 1}. {item.medicine?.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {item.dosage} - {item.frequency}
                                {item.duration && ` - ${item.duration}`}
                              </p>
                              {item.instructions && (
                                <p className="text-xs text-muted-foreground mt-1 italic">
                                  {item.instructions}
                                </p>
                              )}
                            </div>
                            <Badge variant="outline">
                              {item.quantity} {item.medicine?.unit}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedPrescription.notes && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">Catatan</p>
                      <p className="text-sm text-amber-700 dark:text-amber-300">{selectedPrescription.notes}</p>
                    </div>
                  )}

                  {selectedPrescription.qr_token && selectedPrescription.status !== "diserahkan" && (
                    <Button
                      className="w-full"
                      onClick={() => setShowQR(true)}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Tampilkan QR Code
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

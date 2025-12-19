import { useState, useEffect } from "react";
import { Search, Filter, Pill, Package, AlertTriangle, TrendingUp, Plus, CheckCircle, QrCode, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import PharmacyScanner from "@/components/pharmacy/PharmacyScanner";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Prescription {
  id: string;
  prescription_number: string;
  patient_name: string;
  doctor_name: string;
  item_count: number;
  status: string;
  prescription_date: string;
  payment_type: string;
  items: PrescriptionItem[];
}

interface PrescriptionItem {
  id: string;
  medicine_name: string;
  quantity: number;
  dosage: string;
  frequency: string;
  instructions: string | null;
}

interface LowStockMedicine {
  id: string;
  name: string;
  stock: number;
  min_stock: number;
  unit: string;
}

const statusColors: Record<string, string> = {
  "menunggu": "bg-warning/10 text-warning border-warning/20",
  "diproses": "bg-info/10 text-info border-info/20",
  "siap": "bg-success/10 text-success border-success/20",
  "diserahkan": "bg-muted text-muted-foreground border-muted",
};

const statusLabels: Record<string, string> = {
  "menunggu": "Menunggu",
  "diproses": "Diproses",
  "siap": "Siap Diambil",
  "diserahkan": "Selesai",
};

export default function Farmasi() {
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [lowStockMeds, setLowStockMeds] = useState<LowStockMedicine[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    todayTotal: 0,
    waiting: 0,
    completed: 0,
    lowStock: 0,
  });
  
  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPrescriptions(),
        fetchLowStockMedicines(),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const fetchPrescriptions = async () => {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("prescriptions")
      .select(`
        id,
        prescription_number,
        status,
        prescription_date,
        notes,
        patients(full_name, bpjs_number),
        doctors(full_name),
        prescription_items(
          id,
          quantity,
          dosage,
          frequency,
          instructions,
          medicines(name)
        )
      `)
      .gte("prescription_date", `${today}T00:00:00`)
      .lte("prescription_date", `${today}T23:59:59`)
      .order("prescription_date", { ascending: false });

    if (error) {
      console.error("Error fetching prescriptions:", error);
      return;
    }

    const prescriptionList: Prescription[] = (data || []).map((p: any) => ({
      id: p.id,
      prescription_number: p.prescription_number,
      patient_name: p.patients?.full_name || "Unknown",
      doctor_name: p.doctors?.full_name || "Unknown",
      item_count: p.prescription_items?.length || 0,
      status: p.status,
      prescription_date: p.prescription_date,
      payment_type: p.patients?.bpjs_number ? "BPJS" : "Umum",
      items: (p.prescription_items || []).map((item: any) => ({
        id: item.id,
        medicine_name: item.medicines?.name || "Unknown",
        quantity: item.quantity,
        dosage: item.dosage,
        frequency: item.frequency,
        instructions: item.instructions,
      })),
    }));

    setPrescriptions(prescriptionList);

    // Calculate stats
    const waiting = prescriptionList.filter(p => p.status === "menunggu").length;
    const completed = prescriptionList.filter(p => p.status === "diserahkan").length;

    setStats(prev => ({
      ...prev,
      todayTotal: prescriptionList.length,
      waiting,
      completed,
    }));
  };

  const fetchLowStockMedicines = async () => {
    const { data, error } = await supabase
      .from("medicines")
      .select("id, name, stock, min_stock, unit")
      .eq("is_active", true)
      .not("min_stock", "is", null);

    if (error) {
      console.error("Error fetching medicines:", error);
      return;
    }

    // Filter low stock
    const lowStock = (data || []).filter((m: any) => m.stock <= (m.min_stock || 10));
    setLowStockMeds(lowStock.slice(0, 5));
    setStats(prev => ({ ...prev, lowStock: lowStock.length }));
  };

  const handleProcess = async (prescription: Prescription) => {
    setProcessing(true);
    try {
      const newStatus = prescription.status === "menunggu" ? "diproses" : 
                        prescription.status === "diproses" ? "siap" : "diserahkan";

      const { error } = await supabase
        .from("prescriptions")
        .update({ 
          status: newStatus as "menunggu" | "diproses" | "siap" | "diserahkan" | "batal",
          ...(newStatus === "diserahkan" ? { processed_at: new Date().toISOString() } : {})
        })
        .eq("id", prescription.id);

      if (error) throw error;

      toast.success(`Status resep diubah ke ${statusLabels[newStatus]}`);
      fetchPrescriptions();
      setDetailOpen(false);
    } catch (error) {
      console.error("Error updating prescription:", error);
      toast.error("Gagal mengubah status resep");
    } finally {
      setProcessing(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter(p =>
    p.prescription_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.patient_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  const getActionButton = (prescription: Prescription) => {
    switch (prescription.status) {
      case "menunggu":
        return <Button size="sm" onClick={() => handleProcess(prescription)}>Proses</Button>;
      case "diproses":
        return <Button size="sm" onClick={() => handleProcess(prescription)}>Siap</Button>;
      case "siap":
        return <Button size="sm" onClick={() => handleProcess(prescription)}>Serahkan</Button>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Farmasi</h1>
          <p className="text-muted-foreground">Manajemen resep dan stok obat</p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Pill className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.todayTotal}</p>
            <p className="text-sm text-muted-foreground">Resep Hari Ini</p>
          </div>
        </div>
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-warning/10">
            <Package className="h-6 w-6 text-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.waiting}</p>
            <p className="text-sm text-muted-foreground">Menunggu Diproses</p>
          </div>
        </div>
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-success/10">
            <CheckCircle className="h-6 w-6 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.completed}</p>
            <p className="text-sm text-muted-foreground">Selesai</p>
          </div>
        </div>
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.lowStock}</p>
            <p className="text-sm text-muted-foreground">Stok Menipis</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prescriptions */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="queue" className="space-y-4">
            <TabsList>
              <TabsTrigger value="queue">Antrian Resep</TabsTrigger>
              <TabsTrigger value="scanner" className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                E-Prescription
              </TabsTrigger>
              <TabsTrigger value="history">Riwayat</TabsTrigger>
            </TabsList>

            <TabsContent value="scanner">
              <PharmacyScanner />
            </TabsContent>

            <TabsContent value="queue">
              <div className="module-card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Antrian Resep</h3>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cari resep..."
                        className="pl-10 w-48"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
                ) : filteredPrescriptions.filter(p => p.status !== "diserahkan").length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Tidak ada resep dalam antrian
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredPrescriptions
                      .filter(p => p.status !== "diserahkan")
                      .map((rx) => (
                        <div
                          key={rx.id}
                          className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedPrescription(rx);
                            setDetailOpen(true);
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Pill className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{rx.prescription_number}</p>
                                <Badge variant="secondary" className={rx.payment_type === "BPJS" ? "bg-primary/10 text-primary" : ""}>
                                  {rx.payment_type}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {rx.patient_name} • {rx.doctor_name} • {rx.item_count} item
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <Badge variant="outline" className={statusColors[rx.status]}>
                                {statusLabels[rx.status]}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">{formatTime(rx.prescription_date)}</p>
                            </div>
                            {getActionButton(rx)}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history">
              <div className="module-card">
                {filteredPrescriptions.filter(p => p.status === "diserahkan").length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Belum ada resep selesai hari ini
                  </p>
                ) : (
                  <div className="space-y-3">
                    {filteredPrescriptions
                      .filter(p => p.status === "diserahkan")
                      .map((rx) => (
                        <div
                          key={rx.id}
                          className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                              <CheckCircle className="h-5 w-5 text-success" />
                            </div>
                            <div>
                              <p className="font-medium">{rx.prescription_number}</p>
                              <p className="text-sm text-muted-foreground">
                                {rx.patient_name} • {rx.item_count} item
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                              Selesai
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">{formatTime(rx.prescription_date)}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Low Stock Alert */}
          <div className="module-card border-destructive/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold">Stok Menipis</h3>
                <p className="text-sm text-muted-foreground">Perlu restock segera</p>
              </div>
            </div>

            {lowStockMeds.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Semua stok obat mencukupi
              </p>
            ) : (
              <div className="space-y-3">
                {lowStockMeds.map((med) => (
                  <div key={med.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{med.name}</span>
                      <span className="text-destructive font-medium">
                        {med.stock} {med.unit}
                      </span>
                    </div>
                    <Progress
                      value={(med.stock / (med.min_stock || 10)) * 100}
                      className="h-1.5"
                    />
                    <p className="text-xs text-muted-foreground">
                      Min. stok: {med.min_stock} {med.unit}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <Button variant="outline" className="w-full mt-4" size="sm">
              Lihat Semua
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="module-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <h3 className="font-semibold">Statistik Hari Ini</h3>
                <p className="text-sm text-muted-foreground">Performa farmasi</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Resep</span>
                <span className="font-medium">{stats.todayTotal}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Menunggu</span>
                <span className="font-medium text-warning">{stats.waiting}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Selesai</span>
                <span className="font-medium text-success">{stats.completed}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Stok Menipis</span>
                <span className="font-medium text-destructive">{stats.lowStock}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prescription Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Resep</DialogTitle>
          </DialogHeader>

          {selectedPrescription && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">No. Resep</p>
                  <p className="font-medium">{selectedPrescription.prescription_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant="outline" className={statusColors[selectedPrescription.status]}>
                    {statusLabels[selectedPrescription.status]}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pasien</p>
                  <p className="font-medium">{selectedPrescription.patient_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dokter</p>
                  <p className="font-medium">{selectedPrescription.doctor_name}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Daftar Obat</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Obat</TableHead>
                      <TableHead>Dosis</TableHead>
                      <TableHead>Frekuensi</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedPrescription.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.medicine_name}</TableCell>
                        <TableCell>{item.dosage}</TableCell>
                        <TableCell>{item.frequency}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              Tutup
            </Button>
            {selectedPrescription && selectedPrescription.status !== "diserahkan" && (
              <Button onClick={() => handleProcess(selectedPrescription)} disabled={processing}>
                {processing ? "Memproses..." : 
                  selectedPrescription.status === "menunggu" ? "Proses Resep" :
                  selectedPrescription.status === "diproses" ? "Tandai Siap" :
                  "Serahkan ke Pasien"
                }
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Plus, Calendar as CalendarIcon, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface MedicineBatch {
  id: string;
  batch_number: string;
  quantity: number;
  initial_quantity: number;
  unit_price: number;
  expiry_date: string;
  manufacture_date: string | null;
  supplier_name: string | null;
  status: string;
  medicine: {
    name: string;
    code: string;
    unit: string;
  } | null;
}

interface Medicine {
  id: string;
  name: string;
  code: string;
  unit: string;
}

export default function InventoryBatches() {
  const [batches, setBatches] = useState<MedicineBatch[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [selectedMedicine, setSelectedMedicine] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [expiryDate, setExpiryDate] = useState<Date | undefined>();
  const [manufactureDate, setManufactureDate] = useState<Date | undefined>();
  const [supplierName, setSupplierName] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [batchesRes, medicinesRes] = await Promise.all([
        supabase
          .from("medicine_batches")
          .select(`
            *,
            medicine:medicine_id (name, code, unit)
          `)
          .order("expiry_date"),
        supabase
          .from("medicines")
          .select("id, name, code, unit")
          .eq("is_active", true)
          .order("name")
      ]);

      if (batchesRes.error) throw batchesRes.error;
      if (medicinesRes.error) throw medicinesRes.error;

      setBatches(batchesRes.data || []);
      setMedicines(medicinesRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBatch = async () => {
    if (!selectedMedicine || !batchNumber || !quantity || !expiryDate) {
      toast.error("Lengkapi field yang wajib diisi");
      return;
    }

    setIsSubmitting(true);

    try {
      const qty = parseInt(quantity);
      const price = parseFloat(unitPrice) || 0;

      // Add batch
      const { error: batchError } = await supabase
        .from("medicine_batches")
        .insert({
          medicine_id: selectedMedicine,
          batch_number: batchNumber,
          quantity: qty,
          initial_quantity: qty,
          unit_price: price,
          expiry_date: format(expiryDate, "yyyy-MM-dd"),
          manufacture_date: manufactureDate ? format(manufactureDate, "yyyy-MM-dd") : null,
          supplier_name: supplierName || null,
          status: "active",
        });

      if (batchError) throw batchError;

      // Update medicine stock
      const medicine = medicines.find(m => m.id === selectedMedicine);
      if (medicine) {
        const { data: currentMed } = await supabase
          .from("medicines")
          .select("stock")
          .eq("id", selectedMedicine)
          .single();

        const newStock = (currentMed?.stock || 0) + qty;

        await supabase
          .from("medicines")
          .update({ stock: newStock })
          .eq("id", selectedMedicine);

        // Record transaction
        await supabase
          .from("inventory_transactions")
          .insert({
            medicine_id: selectedMedicine,
            transaction_type: "in",
            quantity: qty,
            previous_stock: currentMed?.stock || 0,
            new_stock: newStock,
            reference_type: "batch_receipt",
            unit_price: price,
            total_price: price * qty,
            notes: `Penerimaan batch ${batchNumber}`,
          });
      }

      toast.success("Batch berhasil ditambahkan");
      setShowAddDialog(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Gagal menambahkan batch");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedMedicine("");
    setBatchNumber("");
    setQuantity("");
    setUnitPrice("");
    setExpiryDate(undefined);
    setManufactureDate(undefined);
    setSupplierName("");
  };

  const getExpiryStatus = (expiryDate: string) => {
    const days = differenceInDays(new Date(expiryDate), new Date());
    if (days < 0) return { label: "Kadaluarsa", color: "destructive" };
    if (days <= 30) return { label: `${days} hari`, color: "destructive" };
    if (days <= 90) return { label: `${days} hari`, color: "warning" };
    return { label: `${days} hari`, color: "success" };
  };

  const filteredBatches = batches.filter(batch =>
    batch.medicine?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.batch_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Batch Obat</CardTitle>
              <CardDescription>Kelola batch dan tanggal kadaluarsa</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari batch..."
                  className="pl-10 w-48"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Batch
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {filteredBatches.map((batch) => {
                const expiryStatus = getExpiryStatus(batch.expiry_date);
                return (
                  <div
                    key={batch.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Package className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{batch.medicine?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Batch: {batch.batch_number} • {batch.supplier_name || "No supplier"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Sisa Stok</p>
                        <p className="font-bold">{batch.quantity} / {batch.initial_quantity}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Kadaluarsa</p>
                        <p className="font-medium">{format(new Date(batch.expiry_date), "d MMM yyyy", { locale: id })}</p>
                        <Badge 
                          variant={expiryStatus.color === "success" ? "default" : expiryStatus.color === "warning" ? "secondary" : "destructive"}
                          className={expiryStatus.color === "success" ? "bg-green-500/10 text-green-600" : expiryStatus.color === "warning" ? "bg-amber-500/10 text-amber-600" : ""}
                        >
                          {expiryStatus.label}
                        </Badge>
                      </div>
                      <Badge variant={batch.status === "active" ? "default" : "secondary"}>
                        {batch.status === "active" ? "Aktif" : batch.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Add Batch Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Batch Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Obat *</Label>
              <Select value={selectedMedicine} onValueChange={setSelectedMedicine}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih obat" />
                </SelectTrigger>
                <SelectContent>
                  {medicines.map(med => (
                    <SelectItem key={med.id} value={med.id}>
                      {med.name} ({med.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>No. Batch *</Label>
                <Input
                  placeholder="BTH-001"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Jumlah *</Label>
                <Input
                  type="number"
                  placeholder="100"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Harga Satuan</Label>
              <Input
                type="number"
                placeholder="10000"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Tanggal Kadaluarsa *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left", !expiryDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiryDate ? format(expiryDate, "d MMMM yyyy", { locale: id }) : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={expiryDate} onSelect={setExpiryDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Supplier</Label>
              <Input
                placeholder="Nama supplier"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleAddBatch} disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

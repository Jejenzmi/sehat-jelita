import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Edit, Package, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Medicine {
  id: string;
  code: string;
  name: string;
  generic_name: string | null;
  category: string | null;
  stock: number;
  min_stock: number | null;
  unit: string;
  price: number;
  is_active: boolean;
}

interface InventoryStockProps {
  onStockUpdate: () => void;
}

export default function InventoryStock({ onStockUpdate }: InventoryStockProps) {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<"add" | "subtract">("add");
  const [adjustmentQty, setAdjustmentQty] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ["Analgesik", "Antibiotik", "Antidiabetes", "Antihipertensi", "Vitamin", "Lainnya"];

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const { data, error } = await supabase
        .from("medicines")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setMedicines(data || []);
    } catch (error) {
      console.error("Error fetching medicines:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedMedicine || !adjustmentQty || !adjustmentReason) {
      toast.error("Lengkapi semua field");
      return;
    }

    const qty = parseInt(adjustmentQty);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Jumlah tidak valid");
      return;
    }

    const newStock = adjustmentType === "add" 
      ? selectedMedicine.stock + qty 
      : Math.max(0, selectedMedicine.stock - qty);

    setIsSubmitting(true);

    try {
      // Update medicine stock
      const { error: updateError } = await supabase
        .from("medicines")
        .update({ stock: newStock })
        .eq("id", selectedMedicine.id);

      if (updateError) throw updateError;

      // Record transaction
      const { error: transactionError } = await supabase
        .from("inventory_transactions")
        .insert({
          medicine_id: selectedMedicine.id,
          transaction_type: adjustmentType === "add" ? "in" : "out",
          quantity: adjustmentType === "add" ? qty : -qty,
          previous_stock: selectedMedicine.stock,
          new_stock: newStock,
          reference_type: "adjustment",
          notes: adjustmentReason,
        });

      if (transactionError) throw transactionError;

      toast.success("Stok berhasil disesuaikan");
      setShowAdjustDialog(false);
      resetAdjustmentForm();
      fetchMedicines();
      onStockUpdate();
    } catch (error: any) {
      toast.error(error.message || "Gagal menyesuaikan stok");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAdjustmentForm = () => {
    setSelectedMedicine(null);
    setAdjustmentType("add");
    setAdjustmentQty("");
    setAdjustmentReason("");
  };

  const filteredMedicines = medicines.filter(med => {
    const matchesSearch = med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         med.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || med.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getStockStatus = (medicine: Medicine) => {
    const minStock = medicine.min_stock || 10;
    if (medicine.stock === 0) {
      return { label: "Habis", variant: "destructive" as const };
    }
    if (medicine.stock <= minStock) {
      return { label: "Menipis", variant: "warning" as const };
    }
    return { label: "Cukup", variant: "success" as const };
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Stok Obat</CardTitle>
              <CardDescription>Kelola stok obat di apotek</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari obat..."
                  className="pl-10 w-48"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {filteredMedicines.map((medicine) => {
                const status = getStockStatus(medicine);
                return (
                  <div
                    key={medicine.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Package className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{medicine.name}</p>
                          {medicine.stock <= (medicine.min_stock || 10) && (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {medicine.code} • {medicine.category || "Lainnya"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          {medicine.stock} <span className="text-sm font-normal text-muted-foreground">{medicine.unit}</span>
                        </p>
                        <Badge 
                          variant={status.variant === "success" ? "default" : status.variant === "warning" ? "secondary" : "destructive"}
                          className={status.variant === "success" ? "bg-green-500/10 text-green-600" : status.variant === "warning" ? "bg-amber-500/10 text-amber-600" : ""}
                        >
                          {status.label}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMedicine(medicine);
                          setShowAdjustDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Adjust
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Adjustment Dialog */}
      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Penyesuaian Stok</DialogTitle>
          </DialogHeader>
          {selectedMedicine && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="font-semibold">{selectedMedicine.name}</p>
                <p className="text-sm text-muted-foreground">
                  Stok saat ini: {selectedMedicine.stock} {selectedMedicine.unit}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Tipe Penyesuaian</Label>
                <Select value={adjustmentType} onValueChange={(v) => setAdjustmentType(v as "add" | "subtract")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">Tambah Stok (+)</SelectItem>
                    <SelectItem value="subtract">Kurangi Stok (-)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Jumlah</Label>
                <Input
                  type="number"
                  placeholder="Masukkan jumlah"
                  value={adjustmentQty}
                  onChange={(e) => setAdjustmentQty(e.target.value)}
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label>Alasan Penyesuaian</Label>
                <Select value={adjustmentReason} onValueChange={setAdjustmentReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih alasan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Penerimaan dari supplier">Penerimaan dari supplier</SelectItem>
                    <SelectItem value="Koreksi stok fisik">Koreksi stok fisik</SelectItem>
                    <SelectItem value="Obat rusak/kadaluarsa">Obat rusak/kadaluarsa</SelectItem>
                    <SelectItem value="Retur ke supplier">Retur ke supplier</SelectItem>
                    <SelectItem value="Penggunaan internal">Penggunaan internal</SelectItem>
                    <SelectItem value="Transfer antar gudang">Transfer antar gudang</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {adjustmentQty && (
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm">
                    Stok setelah penyesuaian:{" "}
                    <span className="font-bold">
                      {adjustmentType === "add"
                        ? selectedMedicine.stock + parseInt(adjustmentQty || "0")
                        : Math.max(0, selectedMedicine.stock - parseInt(adjustmentQty || "0"))}{" "}
                      {selectedMedicine.unit}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdjustDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleAdjustStock} disabled={isSubmitting}>
              {isSubmitting ? "Memproses..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

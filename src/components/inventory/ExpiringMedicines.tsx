import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Calendar, Package, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { id } from "date-fns/locale";

interface ExpiringBatch {
  id: string;
  batch_number: string;
  quantity: number;
  expiry_date: string;
  status: string;
  medicine: {
    id: string;
    name: string;
    code: string;
    unit: string;
    stock: number;
  } | null;
}

export default function ExpiringMedicines() {
  const [batches, setBatches] = useState<ExpiringBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpiringBatches();
  }, []);

  const fetchExpiringBatches = async () => {
    try {
      // Get batches expiring within 180 days or already expired
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 180);

      const { data, error } = await db
        .from("medicine_batches")
        .select(`
          id,
          batch_number,
          quantity,
          expiry_date,
          status,
          medicine:medicine_id (
            id,
            name,
            code,
            unit,
            stock
          )
        `)
        .lte("expiry_date", futureDate.toISOString().split("T")[0])
        .gt("quantity", 0)
        .order("expiry_date");

      if (error) throw error;
      setBatches(data || []);
    } catch (error) {
      console.error("Error fetching expiring batches:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkExpired = async (batch: ExpiringBatch) => {
    try {
      // Update batch status
      const { error: batchError } = await db
        .from("medicine_batches")
        .update({ status: "expired", quantity: 0 })
        .eq("id", batch.id);

      if (batchError) throw batchError;

      // Update medicine stock
      if (batch.medicine) {
        const newStock = Math.max(0, batch.medicine.stock - batch.quantity);
        
        await db
          .from("medicines")
          .update({ stock: newStock })
          .eq("id", batch.medicine.id);

        // Record transaction
        await db
          .from("inventory_transactions")
          .insert({
            medicine_id: batch.medicine.id,
            batch_id: batch.id,
            transaction_type: "out",
            quantity: -batch.quantity,
            previous_stock: batch.medicine.stock,
            new_stock: newStock,
            reference_type: "expired",
            notes: `Batch ${batch.batch_number} kadaluarsa`,
          });
      }

      toast.success("Batch ditandai sebagai kadaluarsa");
      fetchExpiringBatches();
    } catch (error: any) {
      toast.error(error.message || "Gagal memperbarui status");
    }
  };

  const getExpiryCategory = (expiryDate: string) => {
    const days = differenceInDays(new Date(expiryDate), new Date());
    if (days < 0) return { label: "Sudah Kadaluarsa", color: "bg-red-500", textColor: "text-red-600" };
    if (days <= 30) return { label: "< 30 Hari", color: "bg-red-500", textColor: "text-red-600" };
    if (days <= 60) return { label: "30-60 Hari", color: "bg-amber-500", textColor: "text-amber-600" };
    if (days <= 90) return { label: "60-90 Hari", color: "bg-yellow-500", textColor: "text-yellow-600" };
    return { label: "90-180 Hari", color: "bg-blue-500", textColor: "text-blue-600" };
  };

  const expiredBatches = batches.filter(b => differenceInDays(new Date(b.expiry_date), new Date()) < 0);
  const soonExpiring = batches.filter(b => {
    const days = differenceInDays(new Date(b.expiry_date), new Date());
    return days >= 0 && days <= 30;
  });
  const laterExpiring = batches.filter(b => {
    const days = differenceInDays(new Date(b.expiry_date), new Date());
    return days > 30;
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-red-500/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-red-500/10">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{expiredBatches.length}</p>
                <p className="text-sm text-muted-foreground">Sudah Kadaluarsa</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10">
                <Calendar className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{soonExpiring.length}</p>
                <p className="text-sm text-muted-foreground">{"< 30 Hari Lagi"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Package className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{laterExpiring.length}</p>
                <p className="text-sm text-muted-foreground">30-180 Hari Lagi</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expiring List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Obat Kadaluarsa</CardTitle>
          <CardDescription>
            Obat yang akan kadaluarsa dalam 180 hari ke depan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {batches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada obat yang akan kadaluarsa dalam 180 hari
              </div>
            ) : (
              <div className="space-y-2">
                {batches.map((batch) => {
                  const category = getExpiryCategory(batch.expiry_date);
                  const days = differenceInDays(new Date(batch.expiry_date), new Date());
                  
                  return (
                    <div
                      key={batch.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${days < 0 ? 'border-red-500/50 bg-red-50 dark:bg-red-950/20' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-12 rounded-full ${category.color}`} />
                        <div>
                          <p className="font-semibold">{batch.medicine?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Batch: {batch.batch_number} • {batch.quantity} {batch.medicine?.unit}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`font-medium ${category.textColor}`}>
                            {format(new Date(batch.expiry_date), "d MMM yyyy", { locale: id })}
                          </p>
                          <Badge variant={days < 0 ? "destructive" : "secondary"}>
                            {days < 0 ? `${Math.abs(days)} hari lalu` : `${days} hari lagi`}
                          </Badge>
                        </div>
                        {days <= 0 && batch.status !== "expired" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleMarkExpired(batch)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Hapus Stok
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

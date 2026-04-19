import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Plus, ShoppingCart, Calendar as CalendarIcon, 
  CheckCircle, Clock, XCircle, Send, Package
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface PurchaseOrder {
  id: string;
  order_number: string;
  supplier_name: string;
  order_date: string;
  expected_delivery_date: string | null;
  status: string;
  total: number;
  auto_generated: boolean;
  items: {
    id: string;
    quantity: number;
    received_quantity: number;
    unit_price: number;
    medicine: {
      name: string;
      unit: string;
    } | null;
  }[];
}

interface Medicine {
  id: string;
  name: string;
  code: string;
  unit: string;
  price: number;
}

interface Vendor {
  id: string;
  vendor_code: string;
  vendor_name: string;
}

interface PurchaseOrdersProps {
  onOrderUpdate: () => void;
}

export default function PurchaseOrders({ onOrderUpdate }: PurchaseOrdersProps) {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create form state
  const [supplierId, setSupplierId] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [expectedDelivery, setExpectedDelivery] = useState<Date | undefined>();
  const [orderItems, setOrderItems] = useState<{ medicineId: string; quantity: string; unitPrice: string }[]>([
    { medicineId: "", quantity: "", unitPrice: "" }
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, medicinesRes, vendorsRes] = await Promise.all([
        supabase
          .from("purchase_orders")
          .select("id, order_number, supplier_name, order_date, expected_delivery_date, status, total, auto_generated")
          .order("created_at", { ascending: false }),
        supabase
          .from("medicines")
          .select("id, name, code, unit, price")
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("vendors")
          .select("id, vendor_code, vendor_name")
          .eq("is_active", true)
          .eq("blacklisted", false)
          .order("vendor_name")
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (medicinesRes.error) throw medicinesRes.error;
      if (vendorsRes.error) throw vendorsRes.error;

      // Fetch items for each order
      const ordersWithItems = await Promise.all(
        (ordersRes.data || []).map(async (order) => {
          const { data: items } = await supabase
            .from("purchase_order_items")
            .select(`
              id, quantity, received_quantity, unit_price,
              medicine:medicine_id (name, unit)
            `)
            .eq("purchase_order_id", order.id);
          return { ...order, items: items || [] };
        })
      );

      setOrders(ordersWithItems);
      setMedicines(medicinesRes.data || []);
      setVendors(vendorsRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!supplierId || orderItems.every(i => !i.medicineId)) {
      toast.error("Pilih supplier dan minimal 1 item obat");
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate PO number
      const { data: poNumber } = await supabase.rpc("generate_po_number");

      // Calculate total
      const validItems = orderItems.filter(i => i.medicineId && i.quantity);
      const total = validItems.reduce((sum, item) => {
        return sum + (parseFloat(item.unitPrice) || 0) * parseInt(item.quantity);
      }, 0);

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("purchase_orders")
        .insert({
          order_number: poNumber,
          supplier_name: supplierName,
          expected_delivery_date: expectedDelivery ? format(expectedDelivery, "yyyy-MM-dd") : null,
          status: "draft",
          subtotal: total,
          total: total,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const itemsToInsert = validItems.map(item => ({
        purchase_order_id: order.id,
        medicine_id: item.medicineId,
        quantity: parseInt(item.quantity),
        unit_price: parseFloat(item.unitPrice) || 0,
        total_price: (parseFloat(item.unitPrice) || 0) * parseInt(item.quantity),
      }));

      const { error: itemsError } = await supabase
        .from("purchase_order_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success("Pesanan berhasil dibuat");
      setShowCreateDialog(false);
      resetCreateForm();
      fetchData();
      onOrderUpdate();
    } catch (error: any) {
      toast.error(error.message || "Gagal membuat pesanan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("purchase_orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Status pesanan diperbarui");
      fetchData();
      onOrderUpdate();
    } catch (error: any) {
      toast.error(error.message || "Gagal memperbarui status");
    }
  };

  const handleReceiveOrder = async (order: PurchaseOrder) => {
    try {
      // Update each item's stock
      for (const item of order.items) {
        if (item.medicine) {
          const { data: med } = await supabase
            .from("medicines")
            .select("id, stock")
            .eq("name", item.medicine.name)
            .single();

          if (med) {
            const newStock = (med.stock || 0) + item.quantity;
            
            await supabase
              .from("medicines")
              .update({ stock: newStock })
              .eq("id", med.id);

            await supabase
              .from("inventory_transactions")
              .insert({
                medicine_id: med.id,
                transaction_type: "in",
                quantity: item.quantity,
                previous_stock: med.stock,
                new_stock: newStock,
                reference_type: "purchase_order",
                reference_id: order.id,
                unit_price: item.unit_price,
                notes: `Penerimaan PO ${order.order_number}`,
              });
          }
        }

        // Update received quantity
        await supabase
          .from("purchase_order_items")
          .update({ received_quantity: item.quantity })
          .eq("id", item.id);
      }

      // Update order status
      await supabase
        .from("purchase_orders")
        .update({ 
          status: "received",
          actual_delivery_date: new Date().toISOString()
        })
        .eq("id", order.id);

      toast.success("Pesanan diterima dan stok diperbarui");
      fetchData();
      onOrderUpdate();
    } catch (error: any) {
      toast.error(error.message || "Gagal menerima pesanan");
    }
  };

  const resetCreateForm = () => {
    setSupplierId("");
    setSupplierName("");
    setExpectedDelivery(undefined);
    setOrderItems([{ medicineId: "", quantity: "", unitPrice: "" }]);
  };

  const addOrderItem = () => {
    setOrderItems([...orderItems, { medicineId: "", quantity: "", unitPrice: "" }]);
  };

  const updateOrderItem = (index: number, field: string, value: string) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === "medicineId") {
      const med = medicines.find(m => m.id === value);
      if (med) {
        updated[index].unitPrice = med.price.toString();
      }
    }
    
    setOrderItems(updated);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft": return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Draft</Badge>;
      case "pending": return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "approved": return <Badge variant="outline" className="border-primary text-primary"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case "ordered": return <Badge variant="outline" className="border-secondary text-secondary-foreground"><Send className="h-3 w-3 mr-1" />Ordered</Badge>;
      case "shipped": return <Badge variant="default"><Package className="h-3 w-3 mr-1" />Shipped</Badge>;
      case "received": return <Badge variant="default" className="bg-primary"><CheckCircle className="h-3 w-3 mr-1" />Received</Badge>;
      case "cancelled": return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Purchase Orders</CardTitle>
              <CardDescription>Kelola pesanan pembelian obat</CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Buat PO
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{order.order_number}</p>
                        {getStatusBadge(order.status)}
                        {order.auto_generated && (
                          <Badge variant="outline" className="text-xs">Auto</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {order.supplier_name} • {order.items.length} item
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(order.order_date), "d MMM yyyy", { locale: id })}
                        {order.expected_delivery_date && (
                          <> • ETA: {format(new Date(order.expected_delivery_date), "d MMM yyyy", { locale: id })}</>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">Rp {order.total.toLocaleString("id-ID")}</p>
                      <div className="flex gap-2 mt-2">
                        {order.status === "draft" && (
                          <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(order.id, "pending")}>
                            Submit
                          </Button>
                        )}
                        {order.status === "pending" && (
                          <Button size="sm" onClick={() => handleUpdateStatus(order.id, "approved")}>
                            Approve
                          </Button>
                        )}
                        {order.status === "shipped" && (
                          <Button size="sm" variant="default" onClick={() => handleReceiveOrder(order)}>
                            Terima
                          </Button>
                        )}
                        {order.status === "approved" && (
                          <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(order.id, "ordered")}>
                            Mark Ordered
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Buat Purchase Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Supplier *</Label>
                <Select 
                  value={supplierId} 
                  onValueChange={(v) => {
                    setSupplierId(v);
                    const vendor = vendors.find(vd => vd.id === v);
                    if (vendor) setSupplierName(vendor.vendor_name);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map(vendor => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.vendor_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estimasi Pengiriman</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start", !expectedDelivery && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expectedDelivery ? format(expectedDelivery, "d MMM yyyy", { locale: id }) : "Pilih tanggal"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={expectedDelivery} onSelect={setExpectedDelivery} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Item Pesanan</Label>
              <div className="space-y-2">
                {orderItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2">
                    <Select value={item.medicineId} onValueChange={(v) => updateOrderItem(index, "medicineId", v)}>
                      <SelectTrigger className="col-span-6">
                        <SelectValue placeholder="Pilih obat" />
                      </SelectTrigger>
                      <SelectContent>
                        {medicines.map(med => (
                          <SelectItem key={med.id} value={med.id}>{med.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      className="col-span-2"
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateOrderItem(index, "quantity", e.target.value)}
                    />
                    <Input
                      className="col-span-4"
                      type="number"
                      placeholder="Harga"
                      value={item.unitPrice}
                      onChange={(e) => updateOrderItem(index, "unitPrice", e.target.value)}
                    />
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addOrderItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah Item
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Batal</Button>
            <Button onClick={handleCreateOrder} disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

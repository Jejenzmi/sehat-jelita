import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Package, AlertTriangle, TrendingDown, ShoppingCart, 
  Calendar, BarChart3, Clock, CheckCircle, Building2 
} from "lucide-react";
import { db } from "@/lib/db";
import InventoryStock from "@/components/inventory/InventoryStock";
import InventoryBatches from "@/components/inventory/InventoryBatches";
import InventoryTransactions from "@/components/inventory/InventoryTransactions";
import PurchaseOrders from "@/components/inventory/PurchaseOrders";
import ExpiringMedicines from "@/components/inventory/ExpiringMedicines";
import AutoReorderSettings from "@/components/inventory/AutoReorderSettings";
import SupplierManagement from "@/components/inventory/SupplierManagement";
import { PurchaseRequestApproval } from "@/components/inventory/PurchaseRequestApproval";

interface InventoryStats {
  totalMedicines: number;
  lowStockCount: number;
  expiringCount: number;
  pendingOrders: number;
}

export default function Inventory() {
  const [stats, setStats] = useState<InventoryStats>({
    totalMedicines: 0,
    lowStockCount: 0,
    expiringCount: 0,
    pendingOrders: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get total medicines
      const { count: totalMedicines } = await db
        .from("medicines")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Get low stock count
      const { data: lowStockData } = await db
        .from("medicines")
        .select("id, stock, min_stock")
        .eq("is_active", true);

      const lowStockCount = lowStockData?.filter(m => m.stock <= (m.min_stock || 10)).length || 0;

      // Get expiring soon (within 90 days)
      const ninetyDaysFromNow = new Date();
      ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
      
      const { count: expiringCount } = await db
        .from("medicine_batches")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")
        .lte("expiry_date", ninetyDaysFromNow.toISOString().split("T")[0])
        .gt("quantity", 0);

      // Get pending orders
      const { count: pendingOrders } = await db
        .from("purchase_orders")
        .select("*", { count: "exact", head: true })
        .in("status", ["draft", "pending", "approved", "ordered", "shipped"]);

      setStats({
        totalMedicines: totalMedicines || 0,
        lowStockCount,
        expiringCount: expiringCount || 0,
        pendingOrders: pendingOrders || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Manajemen Inventori Obat</h1>
        <p className="text-muted-foreground">Kelola stok, batch, dan pemesanan obat</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalMedicines}</p>
                <p className="text-sm text-muted-foreground">Total Obat Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={stats.lowStockCount > 0 ? "border-destructive/50" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-destructive/10">
                <TrendingDown className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.lowStockCount}</p>
                <p className="text-sm text-muted-foreground">Stok Menipis</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={stats.expiringCount > 0 ? "border-amber-500/50" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.expiringCount}</p>
                <p className="text-sm text-muted-foreground">Segera Kadaluarsa</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <ShoppingCart className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingOrders}</p>
                <p className="text-sm text-muted-foreground">Pesanan Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="stock" className="space-y-4">
        <TabsList className="grid grid-cols-8 w-full max-w-6xl">
          <TabsTrigger value="stock" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Stok</span>
          </TabsTrigger>
          <TabsTrigger value="batches" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Batch</span>
          </TabsTrigger>
          <TabsTrigger value="expiring" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Kadaluarsa</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Pesanan</span>
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Supplier</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Riwayat</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Auto-Reorder</span>
          </TabsTrigger>
          <TabsTrigger value="purchase-request" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">PR Approval</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock">
          <InventoryStock onStockUpdate={fetchStats} />
        </TabsContent>

        <TabsContent value="batches">
          <InventoryBatches />
        </TabsContent>

        <TabsContent value="expiring">
          <ExpiringMedicines />
        </TabsContent>

        <TabsContent value="orders">
          <PurchaseOrders onOrderUpdate={fetchStats} />
        </TabsContent>

        <TabsContent value="suppliers">
          <SupplierManagement />
        </TabsContent>

        <TabsContent value="transactions">
          <InventoryTransactions />
        </TabsContent>

        <TabsContent value="settings">
          <AutoReorderSettings />
        </TabsContent>

        <TabsContent value="purchase-request">
          <PurchaseRequestApproval />
        </TabsContent>
      </Tabs>
    </div>
  );
}

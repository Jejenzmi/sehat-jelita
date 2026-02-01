import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBloodInventoryStats } from "@/hooks/useBloodBankData";
import { Droplet, AlertTriangle, Clock, TrendingUp, Package } from "lucide-react";

export function BloodBankDashboard() {
  const { data: stats, isLoading } = useBloodInventoryStats();

  if (isLoading) {
    return <div className="text-center py-8">Memuat data...</div>;
  }

  const bloodTypeColors: Record<string, string> = {
    'A+': "bg-red-100 text-red-800 border-red-200",
    'A-': "bg-red-100 text-red-800 border-red-200",
    'B+': "bg-blue-100 text-blue-800 border-blue-200",
    'B-': "bg-blue-100 text-blue-800 border-blue-200",
    'AB+': "bg-purple-100 text-purple-800 border-purple-200",
    'AB-': "bg-purple-100 text-purple-800 border-purple-200",
    'O+': "bg-green-100 text-green-800 border-green-200",
    'O-': "bg-green-100 text-green-800 border-green-200",
  };

  const productTypeLabels: Record<string, string> = {
    'whole_blood': 'Whole Blood',
    'prc': 'PRC',
    'ffp': 'FFP',
    'tc': 'TC',
    'cryoprecipitate': 'Cryo',
    'platelets': 'Platelets',
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stok</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAvailable || 0}</div>
            <p className="text-xs text-muted-foreground">kantong tersedia</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Segera Expired</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.expiringCount || 0}</div>
            <p className="text-xs text-muted-foreground">dalam 3 hari</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permintaan Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingRequests || 0}</div>
            <p className="text-xs text-muted-foreground">menunggu proses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transfusi Hari Ini</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayTransfusions || 0}</div>
            <p className="text-xs text-muted-foreground">kantong ditransfusi</p>
          </CardContent>
        </Card>
      </div>

      {/* Blood Type Inventory */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplet className="h-5 w-5" />
            Stok per Golongan Darah
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
            {stats?.byBloodType && Object.entries(stats.byBloodType).map(([type, count]) => (
              <div
                key={type}
                className={`p-4 rounded-lg border-2 text-center ${bloodTypeColors[type] || "bg-muted"}`}
              >
                <div className="text-2xl font-bold">{type}</div>
                <div className="text-lg font-semibold">{count}</div>
                <div className="text-xs">kantong</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Product Type Inventory */}
      <Card>
        <CardHeader>
          <CardTitle>Stok per Jenis Produk</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {stats?.byProductType && Object.entries(stats.byProductType).map(([type, count]) => (
              <div key={type} className="p-4 rounded-lg border bg-card text-center">
                <div className="text-lg font-bold">{productTypeLabels[type] || type}</div>
                <div className="text-2xl font-bold text-primary">{count}</div>
                <div className="text-xs text-muted-foreground">kantong</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

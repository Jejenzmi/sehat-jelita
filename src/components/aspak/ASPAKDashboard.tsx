import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Package, 
  Plus, 
  Search, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Wrench,
  Activity,
  Upload,
  Download,
  Calendar,
  Building2
} from "lucide-react";
import { 
  useMedicalEquipment, 
  useEquipmentStats, 
  useEquipmentNeedingCalibration,
  useEquipmentNeedingMaintenance,
  useASPAKSyncLogs,
  useEquipmentCategories
} from "@/hooks/useASPAK";

export default function ASPAKDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const { data: equipment, isLoading } = useMedicalEquipment({ 
    status: statusFilter || undefined,
    category: categoryFilter || undefined 
  });
  const { data: stats } = useEquipmentStats();
  const { data: needsCalibration } = useEquipmentNeedingCalibration();
  const { data: needsMaintenance } = useEquipmentNeedingMaintenance();
  const { data: syncLogs } = useASPAKSyncLogs();
  const { data: categories } = useEquipmentCategories();

  const filteredEquipment = equipment?.filter(e => 
    e.equipment_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.equipment_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "operational":
        return <Badge className="bg-green-100 text-green-800">Operasional</Badge>;
      case "maintenance":
        return <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>;
      case "broken":
        return <Badge variant="destructive">Rusak</Badge>;
      case "disposed":
        return <Badge variant="secondary">Disposed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRiskClassBadge = (riskClass: string) => {
    switch (riskClass) {
      case "Kelas A":
        return <Badge variant="outline" className="border-green-500 text-green-700">A</Badge>;
      case "Kelas B":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">B</Badge>;
      case "Kelas C":
        return <Badge variant="outline" className="border-red-500 text-red-700">C</Badge>;
      default:
        return <Badge variant="outline">{riskClass}</Badge>;
    }
  };

  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Selesai</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800">Proses</Badge>;
      case "failed":
        return <Badge variant="destructive">Gagal</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">ASPAK - Aplikasi Sarana Prasarana Kesehatan</h2>
          <p className="text-sm text-muted-foreground">
            Manajemen alat kesehatan, kalibrasi, dan pemeliharaan
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Sync ke ASPAK
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Alat
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Tambah Alat Kesehatan</DialogTitle>
              </DialogHeader>
              <p className="text-muted-foreground text-center py-8">
                Form tambah alat kesehatan akan ditampilkan di sini.
              </p>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Dashboard</TabsTrigger>
          <TabsTrigger value="equipment">Daftar Alat</TabsTrigger>
          <TabsTrigger value="calibration">Kalibrasi</TabsTrigger>
          <TabsTrigger value="maintenance">Pemeliharaan</TabsTrigger>
          <TabsTrigger value="sync">Sinkronisasi</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Package className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{stats?.total || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Alat</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats?.operational || 0}</p>
                    <p className="text-sm text-muted-foreground">Operasional</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Wrench className="h-8 w-8 text-yellow-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats?.maintenance || 0}</p>
                    <p className="text-sm text-muted-foreground">Maintenance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats?.broken || 0}</p>
                    <p className="text-sm text-muted-foreground">Rusak</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Calibration Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-5 w-5 text-warning" />
                  Perlu Kalibrasi (30 Hari Ke Depan)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {needsCalibration && needsCalibration.length > 0 ? (
                  <div className="space-y-2">
                    {needsCalibration.slice(0, 5).map((eq) => (
                      <div key={eq.id} className="flex justify-between items-center p-2 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{eq.equipment_name}</p>
                          <p className="text-xs text-muted-foreground">{eq.equipment_code}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {eq.next_calibration_date ? new Date(eq.next_calibration_date).toLocaleDateString("id-ID") : "-"}
                        </Badge>
                      </div>
                    ))}
                    {needsCalibration.length > 5 && (
                      <p className="text-sm text-muted-foreground text-center">
                        +{needsCalibration.length - 5} lainnya
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    Tidak ada alat yang perlu dikalibrasi dalam 30 hari ke depan
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Maintenance Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wrench className="h-5 w-5 text-info" />
                  Jadwal Pemeliharaan (30 Hari Ke Depan)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {needsMaintenance && needsMaintenance.length > 0 ? (
                  <div className="space-y-2">
                    {needsMaintenance.slice(0, 5).map((eq) => (
                      <div key={eq.id} className="flex justify-between items-center p-2 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{eq.equipment_name}</p>
                          <p className="text-xs text-muted-foreground">{eq.equipment_code}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {eq.next_maintenance_date ? new Date(eq.next_maintenance_date).toLocaleDateString("id-ID") : "-"}
                        </Badge>
                      </div>
                    ))}
                    {needsMaintenance.length > 5 && (
                      <p className="text-sm text-muted-foreground text-center">
                        +{needsMaintenance.length - 5} lainnya
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    Tidak ada jadwal pemeliharaan dalam 30 hari ke depan
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Equipment by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Distribusi per Kategori</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {stats?.byCategory && Object.entries(stats.byCategory).map(([cat, count]) => (
                  <div key={cat} className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm text-muted-foreground">{cat}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipment List Tab */}
        <TabsContent value="equipment" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau kode alat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Status</SelectItem>
                <SelectItem value="operational">Operasional</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="broken">Rusak</SelectItem>
                <SelectItem value="disposed">Disposed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Kategori</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.category_name}>
                    {cat.category_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Equipment Table */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <p className="text-center py-8 text-muted-foreground">Memuat data...</p>
              ) : filteredEquipment && filteredEquipment.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode</TableHead>
                      <TableHead>Nama Alat</TableHead>
                      <TableHead>Merk/Model</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Risiko</TableHead>
                      <TableHead>Lokasi</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>ASPAK</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEquipment.map((eq) => (
                      <TableRow key={eq.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-mono text-sm">{eq.equipment_code}</TableCell>
                        <TableCell className="font-medium">{eq.equipment_name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {eq.brand} {eq.model}
                        </TableCell>
                        <TableCell>{eq.category}</TableCell>
                        <TableCell>{eq.risk_class && getRiskClassBadge(eq.risk_class)}</TableCell>
                        <TableCell className="text-sm">{eq.location || (eq.department as any)?.name || "-"}</TableCell>
                        <TableCell>{getStatusBadge(eq.status || "operational")}</TableCell>
                        <TableCell>
                          {eq.aspak_sync_status === "synced" ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  {searchQuery || statusFilter || categoryFilter 
                    ? "Tidak ada alat yang sesuai filter" 
                    : "Belum ada data alat kesehatan"}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calibration Tab */}
        <TabsContent value="calibration">
          <Card>
            <CardHeader>
              <CardTitle>Jadwal & Riwayat Kalibrasi</CardTitle>
              <CardDescription>
                Kelola jadwal kalibrasi dan dokumentasi sertifikat kalibrasi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-muted-foreground">
                Daftar kalibrasi akan ditampilkan di sini.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Jadwal & Riwayat Pemeliharaan</CardTitle>
              <CardDescription>
                Kelola jadwal pemeliharaan preventif dan korektif
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-muted-foreground">
                Daftar pemeliharaan akan ditampilkan di sini.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync Tab */}
        <TabsContent value="sync" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Sinkronisasi ASPAK Nasional</CardTitle>
                  <CardDescription>
                    Riwayat sinkronisasi data ke aplikasi ASPAK Kemenkes
                  </CardDescription>
                </div>
                <Button>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Sekarang
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {syncLogs && syncLogs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Arah</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Sukses</TableHead>
                      <TableHead>Error</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {syncLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {new Date(log.created_at).toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="capitalize">{log.sync_type}</TableCell>
                        <TableCell>
                          {log.sync_direction === "upload" ? (
                            <Badge variant="outline"><Upload className="h-3 w-3 mr-1" />Upload</Badge>
                          ) : (
                            <Badge variant="outline"><Download className="h-3 w-3 mr-1" />Download</Badge>
                          )}
                        </TableCell>
                        <TableCell>{log.total_records}</TableCell>
                        <TableCell className="text-green-600">{log.success_count}</TableCell>
                        <TableCell className="text-red-600">{log.error_count}</TableCell>
                        <TableCell>{getSyncStatusBadge(log.sync_status || "pending")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  Belum ada riwayat sinkronisasi
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, Bell, Shield, Globe, Database, History,
  Save, RefreshCw, CheckCircle, AlertTriangle, Search, Filter, Puzzle, RotateCcw, ArrowRightLeft, Network
} from "lucide-react";
import SystemResetTab from "@/components/settings/SystemResetTab";
import HospitalMigrationTab from "@/components/settings/HospitalMigrationTab";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useAuditLogs, useAuditStats } from "@/hooks/useAuditLogs";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ModuleConfigurationTab } from "@/components/settings/ModuleConfigurationTab";
import { ExternalIntegrationsTab } from "@/components/settings/ExternalIntegrationsTab";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";

export default function Pengaturan() {
  const { 
    isLoading, 
    hospitalInfo, 
    notificationSettings, 
    systemConfig, 
    satuSehatConfig,
    bpjsConfig,
    updateSetting 
  } = useSystemSettings();

  // Local state for form editing
  const [localHospital, setLocalHospital] = useState(hospitalInfo);
  const [localNotifications, setLocalNotifications] = useState(notificationSettings);
  const [localSystem, setLocalSystem] = useState(systemConfig);
  const [localBpjs, setLocalBpjs] = useState(bpjsConfig);

  // Audit logs
  const [auditTableFilter, setAuditTableFilter] = useState<string>("all");
  const [auditActionFilter, setAuditActionFilter] = useState<string>("all");
  const { data: auditLogs = [], isLoading: loadingLogs } = useAuditLogs({
    tableName: auditTableFilter !== "all" ? auditTableFilter : undefined,
    action: auditActionFilter !== "all" ? auditActionFilter : undefined,
    limit: 50,
  });
  const { data: auditStats } = useAuditStats();

  // Update local state when data loads
  useEffect(() => {
    if (!isLoading) {
      setLocalHospital(hospitalInfo);
      setLocalNotifications(notificationSettings);
      setLocalSystem(systemConfig);
      setLocalBpjs(bpjsConfig);
    }
  }, [isLoading, hospitalInfo, notificationSettings, systemConfig, bpjsConfig]);

  const handleSaveHospital = () => {
    updateSetting.mutate({ key: "hospital_info", value: localHospital });
  };

  const handleSaveNotifications = () => {
    updateSetting.mutate({ key: "notification_settings", value: localNotifications });
  };

  const handleSaveSystem = () => {
    updateSetting.mutate({ key: "system_config", value: localSystem });
  };

  const handleSaveBpjs = () => {
    updateSetting.mutate({ key: "integration_bpjs", value: localBpjs });
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case "INSERT": return "bg-success/10 text-success";
      case "UPDATE": return "bg-info/10 text-info";
      case "DELETE": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getTableLabel = (tableName: string) => {
    const labels: Record<string, string> = {
      patients: "Pasien",
      visits: "Kunjungan",
      medical_records: "Rekam Medis",
      billings: "Billing",
      prescriptions: "Resep",
      bpjs_claims: "Klaim BPJS",
      insurance_claims: "Klaim Asuransi",
      medicines: "Obat",
      inpatient_admissions: "Rawat Inap",
      emergency_visits: "IGD",
    };
    return labels[tableName] || tableName;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pengaturan</h1>
          <p className="text-muted-foreground">Konfigurasi sistem rumah sakit</p>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="font-medium">Status Sistem</p>
                <p className="text-sm text-green-500">
                  {localSystem.maintenanceMode ? "Maintenance" : "Operasional"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Database className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="font-medium">Database</p>
                <p className="text-sm text-muted-foreground">SIMRS ZEN⁺ Cloud</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-xl">
                <Globe className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="font-medium">Integrasi</p>
                <p className="text-sm text-muted-foreground">
                  {satuSehatConfig.enabled ? "SATU SEHAT" : ""} 
                  {satuSehatConfig.enabled && bpjsConfig.enabled ? ", " : ""}
                  {bpjsConfig.enabled ? "BPJS" : ""}
                  {!satuSehatConfig.enabled && !bpjsConfig.enabled ? "Tidak aktif" : ""}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="hospital" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="hospital">Rumah Sakit</TabsTrigger>
          <TabsTrigger value="modules" className="gap-1">
            <Puzzle className="h-4 w-4" />
            Modul
          </TabsTrigger>
          <TabsTrigger value="migration" className="gap-1">
            <ArrowRightLeft className="h-4 w-4" />
            Migrasi Tipe
          </TabsTrigger>
          <TabsTrigger value="notifications">Notifikasi</TabsTrigger>
          <TabsTrigger value="system">Sistem</TabsTrigger>
          <TabsTrigger value="integrations" className="gap-1">
            <Network className="h-4 w-4" />
            Integrasi Eksternal
          </TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="reset" className="gap-1 text-destructive">
            <RotateCcw className="h-4 w-4" />
            Reset
          </TabsTrigger>
        </TabsList>

        {/* Hospital Settings */}
        <TabsContent value="hospital">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informasi Rumah Sakit
              </CardTitle>
              <CardDescription>Pengaturan identitas dan informasi dasar rumah sakit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hospital-name">Nama Rumah Sakit</Label>
                  <Input
                    id="hospital-name"
                    value={localHospital.name}
                    onChange={(e) => setLocalHospital({ ...localHospital, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hospital-code">Kode RS</Label>
                  <Input
                    id="hospital-code"
                    value={localHospital.code}
                    onChange={(e) => setLocalHospital({ ...localHospital, code: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hospital-address">Alamat</Label>
                <Input
                  id="hospital-address"
                  value={localHospital.address}
                  onChange={(e) => setLocalHospital({ ...localHospital, address: e.target.value })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hospital-phone">Telepon</Label>
                  <Input
                    id="hospital-phone"
                    value={localHospital.phone}
                    onChange={(e) => setLocalHospital({ ...localHospital, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hospital-email">Email</Label>
                  <Input
                    id="hospital-email"
                    type="email"
                    value={localHospital.email}
                    onChange={(e) => setLocalHospital({ ...localHospital, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hospital-website">Website</Label>
                  <Input
                    id="hospital-website"
                    value={localHospital.website}
                    onChange={(e) => setLocalHospital({ ...localHospital, website: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hospital-npwp">NPWP</Label>
                  <Input
                    id="hospital-npwp"
                    value={localHospital.npwp}
                    onChange={(e) => setLocalHospital({ ...localHospital, npwp: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hospital-director">Direktur</Label>
                <Input
                  id="hospital-director"
                  value={localHospital.director}
                  onChange={(e) => setLocalHospital({ ...localHospital, director: e.target.value })}
                />
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleSaveHospital} disabled={updateSetting.isPending}>
                  {updateSetting.isPending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Simpan Perubahan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Module Configuration */}
        <TabsContent value="modules">
          <ModuleConfigurationTab />
        </TabsContent>

        {/* Hospital Type Migration */}
        <TabsContent value="migration">
          <HospitalMigrationTab />
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Pengaturan Notifikasi
              </CardTitle>
              <CardDescription>Kelola notifikasi dan peringatan sistem</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifikasi Email</Label>
                    <p className="text-sm text-muted-foreground">Terima notifikasi melalui email</p>
                  </div>
                  <Switch
                    checked={localNotifications.emailNotifications}
                    onCheckedChange={(checked) => setLocalNotifications({ ...localNotifications, emailNotifications: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifikasi SMS</Label>
                    <p className="text-sm text-muted-foreground">Terima notifikasi melalui SMS</p>
                  </div>
                  <Switch
                    checked={localNotifications.smsNotifications}
                    onCheckedChange={(checked) => setLocalNotifications({ ...localNotifications, smsNotifications: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Peringatan Stok Rendah</Label>
                    <p className="text-sm text-muted-foreground">Notifikasi saat stok obat mencapai batas minimum</p>
                  </div>
                  <Switch
                    checked={localNotifications.lowStockAlert}
                    onCheckedChange={(checked) => setLocalNotifications({ ...localNotifications, lowStockAlert: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Pengingat Janji Temu</Label>
                    <p className="text-sm text-muted-foreground">Kirim pengingat kepada pasien sebelum jadwal</p>
                  </div>
                  <Switch
                    checked={localNotifications.appointmentReminder}
                    onCheckedChange={(checked) => setLocalNotifications({ ...localNotifications, appointmentReminder: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Peringatan Pasien Kritis</Label>
                    <p className="text-sm text-muted-foreground">Notifikasi untuk kondisi pasien kritis</p>
                  </div>
                  <Switch
                    checked={localNotifications.criticalPatientAlert}
                    onCheckedChange={(checked) => setLocalNotifications({ ...localNotifications, criticalPatientAlert: checked })}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications} disabled={updateSetting.isPending}>
                  {updateSetting.isPending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Simpan Perubahan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Pengaturan Sistem
              </CardTitle>
              <CardDescription>Konfigurasi keamanan dan performa sistem</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="auto-logout">Auto Logout (menit)</Label>
                  <Input
                    id="auto-logout"
                    type="number"
                    value={localSystem.autoLogout}
                    onChange={(e) => setLocalSystem({ ...localSystem, autoLogout: parseInt(e.target.value) || 30 })}
                  />
                  <p className="text-sm text-muted-foreground">Waktu idle sebelum logout otomatis</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (menit)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    value={localSystem.sessionTimeout}
                    onChange={(e) => setLocalSystem({ ...localSystem, sessionTimeout: parseInt(e.target.value) || 60 })}
                  />
                  <p className="text-sm text-muted-foreground">Durasi maksimal sesi pengguna</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Label>Mode Maintenance</Label>
                      <Badge variant="outline" className="text-orange-500">Hati-hati</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Nonaktifkan akses pengguna untuk pemeliharaan</p>
                  </div>
                  <Switch
                    checked={localSystem.maintenanceMode}
                    onCheckedChange={(checked) => setLocalSystem({ ...localSystem, maintenanceMode: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mode Debug</Label>
                    <p className="text-sm text-muted-foreground">Aktifkan logging detail untuk debugging</p>
                  </div>
                  <Switch
                    checked={localSystem.debugMode}
                    onCheckedChange={(checked) => setLocalSystem({ ...localSystem, debugMode: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Backup Otomatis</Label>
                    <p className="text-sm text-muted-foreground">Backup database secara otomatis</p>
                  </div>
                  <Switch
                    checked={localSystem.backupEnabled}
                    onCheckedChange={(checked) => setLocalSystem({ ...localSystem, backupEnabled: checked })}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleSaveSystem} disabled={updateSetting.isPending}>
                  {updateSetting.isPending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Simpan Perubahan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* External Integrations */}
        <TabsContent value="integrations">
          <ExternalIntegrationsTab />
        </TabsContent>

        {/* Audit Trail */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Audit Trail
                  </CardTitle>
                  <CardDescription>Log semua aktivitas pengguna di sistem</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">Hari ini: {auditStats?.todayCount || 0}</Badge>
                  <Badge variant="outline">Minggu ini: {auditStats?.weekCount || 0}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-success/10 text-center">
                  <p className="text-2xl font-bold text-success">{auditStats?.actionCounts.INSERT || 0}</p>
                  <p className="text-sm text-muted-foreground">Insert</p>
                </div>
                <div className="p-4 rounded-lg bg-info/10 text-center">
                  <p className="text-2xl font-bold text-info">{auditStats?.actionCounts.UPDATE || 0}</p>
                  <p className="text-sm text-muted-foreground">Update</p>
                </div>
                <div className="p-4 rounded-lg bg-destructive/10 text-center">
                  <p className="text-2xl font-bold text-destructive">{auditStats?.actionCounts.DELETE || 0}</p>
                  <p className="text-sm text-muted-foreground">Delete</p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-4 mb-4">
                <Select value={auditTableFilter} onValueChange={setAuditTableFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter tabel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tabel</SelectItem>
                    <SelectItem value="patients">Pasien</SelectItem>
                    <SelectItem value="visits">Kunjungan</SelectItem>
                    <SelectItem value="medical_records">Rekam Medis</SelectItem>
                    <SelectItem value="billings">Billing</SelectItem>
                    <SelectItem value="prescriptions">Resep</SelectItem>
                    <SelectItem value="medicines">Obat</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={auditActionFilter} onValueChange={setAuditActionFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Filter aksi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Aksi</SelectItem>
                    <SelectItem value="INSERT">Insert</SelectItem>
                    <SelectItem value="UPDATE">Update</SelectItem>
                    <SelectItem value="DELETE">Delete</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Logs Table */}
              {loadingLogs ? (
                <div className="space-y-2">
                  {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada log aktivitas
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Waktu</TableHead>
                        <TableHead>Pengguna</TableHead>
                        <TableHead>Tabel</TableHead>
                        <TableHead>Aksi</TableHead>
                        <TableHead>Record ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {format(new Date(log.created_at), "dd MMM yyyy HH:mm", { locale: id })}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{log.profiles?.full_name || "System"}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{getTableLabel(log.table_name)}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getActionBadgeColor(log.action)}>{log.action}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {log.record_id?.substring(0, 8) || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Reset */}
        <TabsContent value="reset">
          <SystemResetTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

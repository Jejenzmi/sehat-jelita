import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { 
  Building2, Bell, Shield, Palette, Globe, Database,
  Save, RefreshCw, CheckCircle, AlertTriangle, Info
} from "lucide-react";

export default function Pengaturan() {
  const [isSaving, setIsSaving] = useState(false);

  // Hospital settings state
  const [hospitalSettings, setHospitalSettings] = useState({
    name: "RS Sehat Jelita",
    code: "RSJ-001",
    address: "Jl. Kesehatan No. 123, Jakarta",
    phone: "(021) 1234-5678",
    email: "info@rssehatjelita.co.id",
    website: "www.rssehatjelita.co.id",
    npwp: "01.234.567.8-901.000",
    director: "Dr. Andi Wijaya, Sp.PD",
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    lowStockAlert: true,
    appointmentReminder: true,
    billingReminder: true,
    criticalPatientAlert: true,
  });

  // System settings
  const [systemSettings, setSystemSettings] = useState({
    autoLogout: 30,
    sessionTimeout: 60,
    maintenanceMode: false,
    debugMode: false,
    backupEnabled: true,
    backupFrequency: "daily",
  });

  const handleSaveHospital = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({ title: "Pengaturan rumah sakit berhasil disimpan" });
    }, 1000);
  };

  const handleSaveNotifications = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({ title: "Pengaturan notifikasi berhasil disimpan" });
    }, 1000);
  };

  const handleSaveSystem = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({ title: "Pengaturan sistem berhasil disimpan" });
    }, 1000);
  };

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
                <p className="text-sm text-green-500">Operasional</p>
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
                <p className="text-sm text-muted-foreground">Lovable Cloud</p>
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
                <p className="text-sm text-muted-foreground">SATU SEHAT, BPJS</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="hospital" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hospital">Rumah Sakit</TabsTrigger>
          <TabsTrigger value="notifications">Notifikasi</TabsTrigger>
          <TabsTrigger value="system">Sistem</TabsTrigger>
          <TabsTrigger value="integrations">Integrasi</TabsTrigger>
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
                    value={hospitalSettings.name}
                    onChange={(e) => setHospitalSettings({ ...hospitalSettings, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hospital-code">Kode RS</Label>
                  <Input
                    id="hospital-code"
                    value={hospitalSettings.code}
                    onChange={(e) => setHospitalSettings({ ...hospitalSettings, code: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hospital-address">Alamat</Label>
                <Input
                  id="hospital-address"
                  value={hospitalSettings.address}
                  onChange={(e) => setHospitalSettings({ ...hospitalSettings, address: e.target.value })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hospital-phone">Telepon</Label>
                  <Input
                    id="hospital-phone"
                    value={hospitalSettings.phone}
                    onChange={(e) => setHospitalSettings({ ...hospitalSettings, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hospital-email">Email</Label>
                  <Input
                    id="hospital-email"
                    type="email"
                    value={hospitalSettings.email}
                    onChange={(e) => setHospitalSettings({ ...hospitalSettings, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hospital-website">Website</Label>
                  <Input
                    id="hospital-website"
                    value={hospitalSettings.website}
                    onChange={(e) => setHospitalSettings({ ...hospitalSettings, website: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hospital-npwp">NPWP</Label>
                  <Input
                    id="hospital-npwp"
                    value={hospitalSettings.npwp}
                    onChange={(e) => setHospitalSettings({ ...hospitalSettings, npwp: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hospital-director">Direktur</Label>
                <Input
                  id="hospital-director"
                  value={hospitalSettings.director}
                  onChange={(e) => setHospitalSettings({ ...hospitalSettings, director: e.target.value })}
                />
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleSaveHospital} disabled={isSaving}>
                  {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Simpan Perubahan
                </Button>
              </div>
            </CardContent>
          </Card>
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
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, emailNotifications: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifikasi SMS</Label>
                    <p className="text-sm text-muted-foreground">Terima notifikasi melalui SMS</p>
                  </div>
                  <Switch
                    checked={notifications.smsNotifications}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, smsNotifications: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Peringatan Stok Rendah</Label>
                    <p className="text-sm text-muted-foreground">Notifikasi saat stok obat mencapai batas minimum</p>
                  </div>
                  <Switch
                    checked={notifications.lowStockAlert}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, lowStockAlert: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Pengingat Janji Temu</Label>
                    <p className="text-sm text-muted-foreground">Kirim pengingat kepada pasien sebelum jadwal</p>
                  </div>
                  <Switch
                    checked={notifications.appointmentReminder}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, appointmentReminder: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Peringatan Pasien Kritis</Label>
                    <p className="text-sm text-muted-foreground">Notifikasi untuk kondisi pasien kritis</p>
                  </div>
                  <Switch
                    checked={notifications.criticalPatientAlert}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, criticalPatientAlert: checked })}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications} disabled={isSaving}>
                  {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
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
                    value={systemSettings.autoLogout}
                    onChange={(e) => setSystemSettings({ ...systemSettings, autoLogout: parseInt(e.target.value) })}
                  />
                  <p className="text-sm text-muted-foreground">Waktu idle sebelum logout otomatis</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (menit)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    value={systemSettings.sessionTimeout}
                    onChange={(e) => setSystemSettings({ ...systemSettings, sessionTimeout: parseInt(e.target.value) })}
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
                    checked={systemSettings.maintenanceMode}
                    onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, maintenanceMode: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mode Debug</Label>
                    <p className="text-sm text-muted-foreground">Aktifkan logging detail untuk debugging</p>
                  </div>
                  <Switch
                    checked={systemSettings.debugMode}
                    onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, debugMode: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Backup Otomatis</Label>
                    <p className="text-sm text-muted-foreground">Backup database secara otomatis</p>
                  </div>
                  <Switch
                    checked={systemSettings.backupEnabled}
                    onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, backupEnabled: checked })}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleSaveSystem} disabled={isSaving}>
                  {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Simpan Perubahan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>SATU SEHAT</CardTitle>
                <CardDescription>Integrasi dengan platform SATU SEHAT Kemenkes RI</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-500">Terhubung</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Organization ID</span>
                    <span className="font-mono">10000001</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Environment</span>
                    <span>Sandbox</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last Sync</span>
                    <span>2 jam lalu</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full">Konfigurasi</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>BPJS Kesehatan</CardTitle>
                <CardDescription>Integrasi dengan sistem BPJS Kesehatan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-500">Terhubung</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Kode PPK</span>
                    <span className="font-mono">0123U456</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status Bridging</span>
                    <span>Aktif</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Klaim Pending</span>
                    <span>12</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full">Konfigurasi</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>WhatsApp Business</CardTitle>
                <CardDescription>Integrasi notifikasi WhatsApp</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Belum Terhubung</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Hubungkan WhatsApp Business untuk mengirim notifikasi ke pasien secara otomatis.
                </p>
                <Button variant="outline" className="w-full">Hubungkan</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Gateway</CardTitle>
                <CardDescription>Integrasi pembayaran online</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Belum Terhubung</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Terima pembayaran online dari pasien melalui berbagai metode pembayaran.
                </p>
                <Button variant="outline" className="w-full">Hubungkan</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

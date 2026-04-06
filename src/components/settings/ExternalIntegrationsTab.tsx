import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Building2, Save, RefreshCw, CheckCircle, AlertTriangle, XCircle,
  ExternalLink, Key, Globe, Shield, Info, Network, Wifi, WifiOff,
  Hospital, Stethoscope, Ambulance, ClipboardList, Server, BookOpen
} from "lucide-react";
import { useExternalIntegrations, SatuSehatConfig, BPJSConfig, SISRUTEConfig, BPJSAntreanConfig, EklaimIDRGConfig, PACSConfig } from "@/hooks/useExternalIntegrations";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";

export function ExternalIntegrationsTab() {
  const { integrations, isLoading, updateIntegration, testConnection, getIntegrationStatus } = useExternalIntegrations();
  const { toast } = useToast();

  // Local state for each integration
  const [satusehat, setSatusehat] = useState<SatuSehatConfig>(integrations.satusehat);
  const [bpjs, setBpjs] = useState<BPJSConfig>(integrations.bpjs);
  const [sisrute, setSisrute] = useState<SISRUTEConfig>(integrations.sisrute);
  const [bpjsAntrean, setBpjsAntrean] = useState<BPJSAntreanConfig>(integrations.bpjs_antrean);
  const [eklaimIdrg, setEklaimIdrg] = useState<EklaimIDRGConfig>(integrations.eklaim_idrg);
  const [pacs, setPacs] = useState<PACSConfig>(integrations.pacs);
  const [icd11ClientId, setIcd11ClientId] = useState("");
  const [icd11ClientSecret, setIcd11ClientSecret] = useState("");

  // Testing states
  const [testingIntegration, setTestingIntegration] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, "success" | "error" | null>>({});

  // Confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    integration: string;
    action: "save" | "test";
  }>({ open: false, integration: "", action: "save" });

  // Update local state when data loads
  useEffect(() => {
    if (!isLoading) {
      setSatusehat(integrations.satusehat);
      setBpjs(integrations.bpjs);
      setSisrute(integrations.sisrute);
      setBpjsAntrean(integrations.bpjs_antrean);
      setEklaimIdrg(integrations.eklaim_idrg);
      setPacs(integrations.pacs);
    }
  }, [isLoading, integrations]);

  const integrationStatuses = getIntegrationStatus();

  const handleTestConnection = async (integration: string) => {
    setTestingIntegration(integration);
    setTestResults((prev) => ({ ...prev, [integration]: null }));

    let config: any;
    switch (integration) {
      case "satusehat":
        config = satusehat;
        break;
      case "bpjs":
        config = bpjs;
        break;
      case "bpjs_antrean":
        config = bpjsAntrean;
        break;
      case "pacs":
        config = pacs;
        break;
      default:
        toast({
          title: "Integrasi tidak didukung",
          description: "Test koneksi untuk integrasi ini belum tersedia",
          variant: "destructive",
        });
        setTestingIntegration(null);
        return;
    }

    try {
      await testConnection.mutateAsync({ integration, config });
      setTestResults((prev) => ({ ...prev, [integration]: "success" }));
      toast({
        title: "Koneksi Berhasil",
        description: `Berhasil terhubung ke ${integration.toUpperCase()}`,
      });
    } catch (error: any) {
      setTestResults((prev) => ({ ...prev, [integration]: "error" }));
      toast({
        title: "Koneksi Gagal",
        description: error.message || "Tidak dapat terhubung",
        variant: "destructive",
      });
    } finally {
      setTestingIntegration(null);
    }
  };

  const handleSaveIntegration = async (integration: string) => {
    let key = "";
    let value: any;

    switch (integration) {
      case "satusehat":
        key = "integration_satusehat";
        value = satusehat;
        break;
      case "bpjs":
        key = "integration_bpjs";
        value = bpjs;
        break;
      case "sisrute":
        key = "integration_sisrute";
        value = sisrute;
        break;
      case "bpjs_antrean":
        key = "integration_bpjs_antrean";
        value = bpjsAntrean;
        break;
      case "eklaim_idrg":
        key = "integration_eklaim_idrg";
        value = eklaimIdrg;
        break;
      case "pacs":
        key = "integration_pacs";
        value = pacs;
        break;
      default:
        return;
    }

    await updateIntegration.mutateAsync({ key, value });
    setConfirmDialog({ open: false, integration: "", action: "save" });
  };

  const handleTestICD11 = async () => {
    setTestingIntegration("icd11");
    setTestResults((prev) => ({ ...prev, icd11: null }));
    try {
      const API_BASE = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${API_BASE}/icd11/test`, {
        credentials: 'include',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || res.statusText);
      setTestResults((prev) => ({ ...prev, icd11: "success" }));
      toast({ title: "Koneksi WHO ICD-11 Berhasil", description: json.message || "API berfungsi normal" });
    } catch (error: any) {
      setTestResults((prev) => ({ ...prev, icd11: "error" }));
      toast({ title: "Koneksi Gagal", description: error.message || "Tidak dapat terhubung ke WHO ICD-11", variant: "destructive" });
    } finally {
      setTestingIntegration(null);
    }
  };

  const handleSaveICD11 = async () => {
    if (!icd11ClientId || !icd11ClientSecret) {
      toast({ title: "Lengkapi kredensial", description: "Client ID dan Client Secret wajib diisi", variant: "destructive" });
      return;
    }
    try {
      const API_BASE = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${API_BASE}/icd11/save-config`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: icd11ClientId, client_secret: icd11ClientSecret }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || res.statusText);
      toast({ title: "Konfigurasi ICD-11 disimpan" });
      setIcd11ClientId("");
      setIcd11ClientSecret("");
    } catch (error: any) {
      toast({ title: "Gagal menyimpan", description: error.message, variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-success/10 text-success"><CheckCircle className="h-3 w-3 mr-1" />Terhubung</Badge>;
      case "pending":
        return <Badge className="bg-warning/10 text-warning"><AlertTriangle className="h-3 w-3 mr-1" />Belum Lengkap</Badge>;
      case "error":
        return <Badge className="bg-destructive/10 text-destructive"><XCircle className="h-3 w-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="secondary"><WifiOff className="h-3 w-3 mr-1" />Tidak Aktif</Badge>;
    }
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-32 bg-muted rounded-lg" />
      <div className="h-64 bg-muted rounded-lg" />
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {integrationStatuses.map((integration) => (
          <Card key={integration.id} className="relative overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${integration.enabled ? "bg-primary/10" : "bg-muted"}`}>
                    {integration.code === "satusehat" && <Building2 className="h-5 w-5 text-primary" />}
                    {integration.code === "bpjs" && <Hospital className="h-5 w-5 text-primary" />}
                    {integration.code === "bpjs_antrean" && <ClipboardList className="h-5 w-5 text-primary" />}
                    {integration.code === "eklaim_idrg" && <Stethoscope className="h-5 w-5 text-primary" />}
                    {integration.code === "sisrute" && <Ambulance className="h-5 w-5 text-primary" />}
                    {integration.code === "pacs" && <Server className="h-5 w-5 text-primary" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{integration.name}</p>
                  </div>
                </div>
              </div>
              <div className="mt-3">
                {getStatusBadge(integration.status)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Integration Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Konfigurasi Integrasi Eksternal
          </CardTitle>
          <CardDescription>
            Kelola kredensial dan pengaturan untuk semua sistem eksternal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {/* SATU SEHAT */}
            <AccordionItem value="satusehat">
              <AccordionTrigger>
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5" />
                  <span>SATU SEHAT (Kemenkes RI)</span>
                  {getStatusBadge(integrationStatuses.find(i => i.code === "satusehat")?.status || "disconnected")}
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Integrasi dengan platform SATU SEHAT menggunakan standar FHIR R4.
                    Dapatkan kredensial dari <a href="https://satusehat.kemkes.go.id" target="_blank" rel="noopener noreferrer" className="underline">satusehat.kemkes.go.id</a>
                  </AlertDescription>
                </Alert>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <Label className="text-base">Aktifkan Integrasi</Label>
                    <p className="text-sm text-muted-foreground">Sinkronisasi data ke SATU SEHAT</p>
                  </div>
                  <Switch
                    checked={satusehat.enabled}
                    onCheckedChange={(checked) => setSatusehat({ ...satusehat, enabled: checked })}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Environment</Label>
                    <Select
                      value={satusehat.environment}
                      onValueChange={(val) => setSatusehat({ ...satusehat, environment: val as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sandbox">Sandbox (Development)</SelectItem>
                        <SelectItem value="staging">Staging</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Organization ID (IHS Number)</Label>
                    <Input
                      placeholder="Contoh: 10000001"
                      value={satusehat.org_id}
                      onChange={(e) => setSatusehat({ ...satusehat, org_id: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Client ID</Label>
                    <Input
                      placeholder="Client ID dari SATU SEHAT"
                      value={satusehat.client_id}
                      onChange={(e) => setSatusehat({ ...satusehat, client_id: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Client Secret</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={satusehat.client_secret}
                      onChange={(e) => setSatusehat({ ...satusehat, client_secret: e.target.value })}
                    />
                  </div>
                </div>

                {testResults["satusehat"] && (
                  <div className={`p-3 rounded-lg flex items-center gap-2 ${
                    testResults["satusehat"] === "success" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                  }`}>
                    {testResults["satusehat"] === "success" ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {testResults["satusehat"] === "success" ? "Koneksi berhasil!" : "Koneksi gagal"}
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-2">
                  <Button
                    variant="outline"
                    onClick={() => handleTestConnection("satusehat")}
                    disabled={testingIntegration === "satusehat" || !satusehat.org_id}
                  >
                    {testingIntegration === "satusehat" ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Wifi className="h-4 w-4 mr-2" />
                    )}
                    Test Koneksi
                  </Button>
                  <Button
                    onClick={() => setConfirmDialog({ open: true, integration: "satusehat", action: "save" })}
                    disabled={updateIntegration.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Simpan
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* BPJS VClaim */}
            <AccordionItem value="bpjs">
              <AccordionTrigger>
                <div className="flex items-center gap-3">
                  <Hospital className="h-5 w-5" />
                  <span>BPJS Kesehatan (VClaim/PCare)</span>
                  {getStatusBadge(integrationStatuses.find(i => i.code === "bpjs")?.status || "disconnected")}
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Integrasi bridging VClaim dan PCare untuk keperluan SEP, klaim, dan rujukan BPJS.
                  </AlertDescription>
                </Alert>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <Label className="text-base">Aktifkan Integrasi</Label>
                    <p className="text-sm text-muted-foreground">Koneksi ke sistem BPJS Kesehatan</p>
                  </div>
                  <Switch
                    checked={bpjs.enabled}
                    onCheckedChange={(checked) => setBpjs({ ...bpjs, enabled: checked })}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Provider Code (Kode PPK)</Label>
                    <Input
                      placeholder="Contoh: 0301R001"
                      value={bpjs.provider_code}
                      onChange={(e) => setBpjs({ ...bpjs, provider_code: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Environment</Label>
                    <Select
                      value={bpjs.environment}
                      onValueChange={(val) => setBpjs({ ...bpjs, environment: val as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="development">Development (Sandbox)</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Consumer ID</Label>
                    <Input
                      placeholder="Consumer ID dari BPJS"
                      value={bpjs.consumer_id}
                      onChange={(e) => setBpjs({ ...bpjs, consumer_id: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Consumer Secret</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={bpjs.consumer_secret}
                      onChange={(e) => setBpjs({ ...bpjs, consumer_secret: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>User Key</Label>
                    <Input
                      type="password"
                      placeholder="User Key dari BPJS"
                      value={bpjs.user_key}
                      onChange={(e) => setBpjs({ ...bpjs, user_key: e.target.value })}
                    />
                  </div>
                </div>

                {testResults["bpjs"] && (
                  <div className={`p-3 rounded-lg flex items-center gap-2 ${
                    testResults["bpjs"] === "success" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                  }`}>
                    {testResults["bpjs"] === "success" ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {testResults["bpjs"] === "success" ? "Koneksi berhasil!" : "Koneksi gagal"}
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-2">
                  <Button
                    variant="outline"
                    onClick={() => handleTestConnection("bpjs")}
                    disabled={testingIntegration === "bpjs" || !bpjs.provider_code}
                  >
                    {testingIntegration === "bpjs" ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Wifi className="h-4 w-4 mr-2" />
                    )}
                    Test Koneksi
                  </Button>
                  <Button
                    onClick={() => setConfirmDialog({ open: true, integration: "bpjs", action: "save" })}
                    disabled={updateIntegration.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Simpan
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* BPJS Antrean */}
            <AccordionItem value="bpjs_antrean">
              <AccordionTrigger>
                <div className="flex items-center gap-3">
                  <ClipboardList className="h-5 w-5" />
                  <span>BPJS Antrean Online</span>
                  {getStatusBadge(integrationStatuses.find(i => i.code === "bpjs_antrean")?.status || "disconnected")}
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Integrasi sistem antrean online BPJS untuk pendaftaran dan jadwal pelayanan.
                  </AlertDescription>
                </Alert>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <Label className="text-base">Aktifkan Integrasi</Label>
                    <p className="text-sm text-muted-foreground">Sinkronisasi antrean dengan Mobile JKN</p>
                  </div>
                  <Switch
                    checked={bpjsAntrean.enabled}
                    onCheckedChange={(checked) => setBpjsAntrean({ ...bpjsAntrean, enabled: checked })}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Provider Code (Kode PPK)</Label>
                    <Input
                      placeholder="Contoh: 0301R001"
                      value={bpjsAntrean.provider_code}
                      onChange={(e) => setBpjsAntrean({ ...bpjsAntrean, provider_code: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Environment</Label>
                    <Select
                      value={bpjsAntrean.environment}
                      onValueChange={(val) => setBpjsAntrean({ ...bpjsAntrean, environment: val as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="development">Development (Sandbox)</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>User Key</Label>
                    <Input
                      type="password"
                      placeholder="User Key untuk Antrean"
                      value={bpjsAntrean.user_key}
                      onChange={(e) => setBpjsAntrean({ ...bpjsAntrean, user_key: e.target.value })}
                    />
                  </div>
                </div>

                {testResults["bpjs_antrean"] && (
                  <div className={`p-3 rounded-lg flex items-center gap-2 ${
                    testResults["bpjs_antrean"] === "success" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                  }`}>
                    {testResults["bpjs_antrean"] === "success" ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {testResults["bpjs_antrean"] === "success" ? "Koneksi berhasil!" : "Koneksi gagal"}
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-2">
                  <Button
                    variant="outline"
                    onClick={() => handleTestConnection("bpjs_antrean")}
                    disabled={testingIntegration === "bpjs_antrean" || !bpjsAntrean.provider_code}
                  >
                    {testingIntegration === "bpjs_antrean" ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Wifi className="h-4 w-4 mr-2" />
                    )}
                    Test Koneksi
                  </Button>
                  <Button
                    onClick={() => setConfirmDialog({ open: true, integration: "bpjs_antrean", action: "save" })}
                    disabled={updateIntegration.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Simpan
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* E-Klaim IDRG */}
            <AccordionItem value="eklaim_idrg">
              <AccordionTrigger>
                <div className="flex items-center gap-3">
                  <Stethoscope className="h-5 w-5" />
                  <span>E-Klaim IDRG (Bridging Lokal)</span>
                  {getStatusBadge(integrationStatuses.find(i => i.code === "eklaim_idrg")?.status || "disconnected")}
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Integrasi bridging E-Klaim IDRG melalui webservice lokal (ws.php). Mendukung 31 endpoint: New Claim, Set Claim Data, Grouping IDRG/INACBG, Finalisasi, dan lainnya.
                  </AlertDescription>
                </Alert>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <Label className="text-base">Aktifkan Integrasi</Label>
                    <p className="text-sm text-muted-foreground">Koneksi ke server E-Klaim lokal</p>
                  </div>
                  <Switch
                    checked={eklaimIdrg.enabled}
                    onCheckedChange={(checked) => setEklaimIdrg({ ...eklaimIdrg, enabled: checked })}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Base URL Server E-Klaim</Label>
                    <Input
                      placeholder="http://192.168.1.100"
                      value={eklaimIdrg.base_url}
                      onChange={(e) => setEklaimIdrg({ ...eklaimIdrg, base_url: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Kode Tarif RS</Label>
                    <Input
                      placeholder="Kode tarif dari E-Klaim"
                      value={eklaimIdrg.kode_tarif}
                      onChange={(e) => setEklaimIdrg({ ...eklaimIdrg, kode_tarif: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Encryption Key</Label>
                    <Input
                      type="password"
                      placeholder="Key dari generate E-Klaim"
                      value={eklaimIdrg.encryption_key}
                      onChange={(e) => setEklaimIdrg({ ...eklaimIdrg, encryption_key: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <Label className="text-base">Debug Mode</Label>
                    <p className="text-sm text-muted-foreground">Kirim request tanpa enkripsi (untuk pengembangan)</p>
                  </div>
                  <Switch
                    checked={eklaimIdrg.debug_mode}
                    onCheckedChange={(checked) => setEklaimIdrg({ ...eklaimIdrg, debug_mode: checked })}
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <Button
                    onClick={() => setConfirmDialog({ open: true, integration: "eklaim_idrg", action: "save" })}
                    disabled={updateIntegration.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Simpan
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* PACS Server */}
            <AccordionItem value="pacs">
              <AccordionTrigger>
                <div className="flex items-center gap-3">
                  <Server className="h-5 w-5" />
                  <span>PACS Server (Orthanc / DCM4CHEE / DICOMweb)</span>
                  {getStatusBadge(integrationStatuses.find(i => i.code === "pacs")?.status || "disconnected")}
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Koneksi ke server PACS untuk penyimpanan dan distribusi gambar medis (DICOM).
                    Mendukung Orthanc, DCM4CHEE, Horos, Conquest, dan server DICOMweb generik.
                  </AlertDescription>
                </Alert>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <Label className="text-base">Aktifkan Integrasi</Label>
                    <p className="text-sm text-muted-foreground">Koneksi ke server PACS</p>
                  </div>
                  <Switch
                    checked={pacs.enabled}
                    onCheckedChange={(checked) => setPacs({ ...pacs, enabled: checked })}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tipe Server PACS</Label>
                    <Select
                      value={pacs.server_type}
                      onValueChange={(val) => setPacs({ ...pacs, server_type: val as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="orthanc">Orthanc</SelectItem>
                        <SelectItem value="dcm4chee">DCM4CHEE</SelectItem>
                        <SelectItem value="horos">Horos</SelectItem>
                        <SelectItem value="conquest">Conquest DICOM</SelectItem>
                        <SelectItem value="generic_dicomweb">DICOMweb Generik</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>AE Title</Label>
                    <Input
                      placeholder="SIMRS_ZEN"
                      value={pacs.ae_title}
                      onChange={(e) => setPacs({ ...pacs, ae_title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Base URL (REST API)</Label>
                    <Input
                      placeholder="http://192.168.1.100:8042"
                      value={pacs.base_url}
                      onChange={(e) => setPacs({ ...pacs, base_url: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>DICOMweb URL (WADO-RS/QIDO-RS)</Label>
                    <Input
                      placeholder="http://192.168.1.100:8042/dicom-web"
                      value={pacs.dicomweb_url}
                      onChange={(e) => setPacs({ ...pacs, dicomweb_url: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input
                      placeholder="Username PACS (opsional)"
                      value={pacs.username}
                      onChange={(e) => setPacs({ ...pacs, username: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={pacs.password}
                      onChange={(e) => setPacs({ ...pacs, password: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Timeout (detik)</Label>
                    <Input
                      type="number"
                      value={pacs.timeout_seconds}
                      onChange={(e) => setPacs({ ...pacs, timeout_seconds: parseInt(e.target.value) || 30 })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <Label className="text-base">TLS / HTTPS</Label>
                    <p className="text-sm text-muted-foreground">Enkripsi koneksi ke server PACS</p>
                  </div>
                  <Switch
                    checked={pacs.tls_enabled}
                    onCheckedChange={(checked) => setPacs({ ...pacs, tls_enabled: checked })}
                  />
                </div>

                {testResults["pacs"] && (
                  <div className={`p-3 rounded-lg flex items-center gap-2 ${
                    testResults["pacs"] === "success" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                  }`}>
                    {testResults["pacs"] === "success" ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {testResults["pacs"] === "success" ? "Koneksi berhasil!" : "Koneksi gagal"}
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-2">
                  <Button
                    variant="outline"
                    onClick={() => handleTestConnection("pacs")}
                    disabled={testingIntegration === "pacs" || !pacs.base_url}
                  >
                    {testingIntegration === "pacs" ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Wifi className="h-4 w-4 mr-2" />
                    )}
                    Test Koneksi
                  </Button>
                  <Button
                    onClick={() => setConfirmDialog({ open: true, integration: "pacs", action: "save" })}
                    disabled={updateIntegration.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Simpan
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* SISRUTE */}
            <AccordionItem value="sisrute">
              <AccordionTrigger>
                <div className="flex items-center gap-3">
                  <Ambulance className="h-5 w-5" />
                  <span>SISRUTE (Sistem Rujukan Terintegrasi)</span>
                  {getStatusBadge(integrationStatuses.find(i => i.code === "sisrute")?.status || "disconnected")}
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Integrasi dengan SISRUTE untuk sistem rujukan antar faskes.
                  </AlertDescription>
                </Alert>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <Label className="text-base">Aktifkan Integrasi</Label>
                    <p className="text-sm text-muted-foreground">Kelola rujukan terintegrasi</p>
                  </div>
                  <Switch
                    checked={sisrute.enabled}
                    onCheckedChange={(checked) => setSisrute({ ...sisrute, enabled: checked })}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Kode Faskes</Label>
                    <Input
                      placeholder="Kode faskes SISRUTE"
                      value={sisrute.hospital_code}
                      onChange={(e) => setSisrute({ ...sisrute, hospital_code: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Environment</Label>
                    <Select
                      value={sisrute.environment}
                      onValueChange={(val) => setSisrute({ ...sisrute, environment: val as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="development">Development</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>API Key</Label>
                    <Input
                      type="password"
                      placeholder="API Key SISRUTE"
                      value={sisrute.api_key}
                      onChange={(e) => setSisrute({ ...sisrute, api_key: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <Button
                    onClick={() => setConfirmDialog({ open: true, integration: "sisrute", action: "save" })}
                    disabled={updateIntegration.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Simpan
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
            {/* WHO ICD-11 */}
            <AccordionItem value="icd11">
              <AccordionTrigger>
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5" />
                  <span>WHO ICD-11 (Kode Diagnosis)</span>
                  {testResults["icd11"] === "success"
                    ? getStatusBadge("connected")
                    : testResults["icd11"] === "error"
                    ? getStatusBadge("error")
                    : getStatusBadge("disconnected")}
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Integrasi dengan WHO ICD-11 API untuk pencarian kode diagnosis standar internasional.
                    Kredensial saat ini sudah dikonfigurasi di server. Isi form di bawah hanya jika ingin mengganti kredensial.
                  </AlertDescription>
                </Alert>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Client ID (opsional — kosongkan jika tidak ingin mengganti)</Label>
                    <Input
                      placeholder="677b9deb-7ad6-496a-..."
                      value={icd11ClientId}
                      onChange={(e) => setIcd11ClientId(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Client Secret (opsional)</Label>
                    <Input
                      type="password"
                      placeholder="Client Secret dari WHO ICD-11"
                      value={icd11ClientSecret}
                      onChange={(e) => setIcd11ClientSecret(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                </div>

                {testResults["icd11"] && (
                  <div className={`p-3 rounded-lg flex items-center gap-2 ${
                    testResults["icd11"] === "success" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                  }`}>
                    {testResults["icd11"] === "success" ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {testResults["icd11"] === "success" ? "Koneksi ke WHO ICD-11 berhasil!" : "Koneksi gagal — periksa kredensial"}
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-2">
                  <Button
                    variant="outline"
                    onClick={handleTestICD11}
                    disabled={testingIntegration === "icd11"}
                  >
                    {testingIntegration === "icd11" ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Wifi className="h-4 w-4 mr-2" />
                    )}
                    Test Koneksi
                  </Button>
                  <Button
                    onClick={handleSaveICD11}
                    disabled={!icd11ClientId || !icd11ClientSecret}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Simpan Kredensial Baru
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title="Simpan Konfigurasi"
        description={`Apakah Anda yakin ingin menyimpan konfigurasi ${confirmDialog.integration.toUpperCase()}? Pastikan kredensial sudah benar sebelum menyimpan.`}
        type="save"
        confirmLabel="Simpan"
        onConfirm={() => handleSaveIntegration(confirmDialog.integration)}
        isLoading={updateIntegration.isPending}
      />
    </div>
  );
}

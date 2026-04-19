import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Building2, Save, RefreshCw, CheckCircle, AlertTriangle, 
  ExternalLink, Key, Globe, Shield, Info
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSystemSettings, IntegrationConfig } from "@/hooks/useSystemSettings";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SatuSehatConfig extends IntegrationConfig {
  client_id?: string;
  client_secret?: string;
}

export function SatuSehatSettings() {
  const { satuSehatConfig, updateSetting, isLoading } = useSystemSettings();
  const { toast } = useToast();
  
  const [localConfig, setLocalConfig] = useState<SatuSehatConfig>({
    org_id: "",
    environment: "sandbox",
    enabled: false,
    client_id: "",
    client_secret: "",
  });
  
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    if (!isLoading && satuSehatConfig) {
      setLocalConfig({
        org_id: satuSehatConfig.org_id || "",
        environment: satuSehatConfig.environment || "sandbox",
        enabled: satuSehatConfig.enabled || false,
        client_id: (satuSehatConfig as SatuSehatConfig).client_id || "",
        client_secret: (satuSehatConfig as SatuSehatConfig).client_secret || "",
      });
    }
  }, [isLoading, satuSehatConfig]);

  const handleTestConnection = async () => {
    if (!localConfig.org_id || !localConfig.client_id || !localConfig.client_secret) {
      toast({
        title: "Data tidak lengkap",
        description: "Mohon isi semua field yang diperlukan",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setConnectionStatus("idle");

    try {
      const { data, error } = await supabase.functions.invoke("satusehat", {
        body: {
          action: "test-connection",
          config: {
            org_id: localConfig.org_id,
            environment: localConfig.environment,
            client_id: localConfig.client_id,
            client_secret: localConfig.client_secret,
          },
        },
      });

      if (error) {
        throw new Error(error.message || "Gagal menghubungi server");
      }

      if (data?.success) {
        setConnectionStatus("success");
        toast({
          title: "Koneksi Berhasil",
          description: "Berhasil terhubung ke SATU SEHAT API",
        });
      } else {
        setConnectionStatus("error");
        toast({
          title: "Koneksi Gagal",
          description: data?.error || "Gagal terhubung ke SATU SEHAT API",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      setConnectionStatus("error");
      toast({
        title: "Koneksi Gagal",
        description: err.message || "Tidak dapat terhubung ke SATU SEHAT API",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateSetting.mutateAsync({
        key: "integration_satusehat",
        value: localConfig,
      });
      toast({
        title: "Berhasil Disimpan",
        description: "Konfigurasi SATU SEHAT telah diperbarui",
      });
    } catch (err: any) {
      toast({
        title: "Gagal Menyimpan",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              SATU SEHAT
            </CardTitle>
            <CardDescription>
              Integrasi dengan platform SATU SEHAT Kemenkes RI (FHIR R4)
            </CardDescription>
          </div>
          <Badge variant={localConfig.enabled ? "default" : "secondary"} className={localConfig.enabled ? "bg-green-500" : ""}>
            {localConfig.enabled ? "Aktif" : "Tidak Aktif"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div className="space-y-0.5">
            <Label className="text-base">Aktifkan Integrasi SATU SEHAT</Label>
            <p className="text-sm text-muted-foreground">
              Sinkronisasi data pasien, kunjungan, dan rekam medis ke platform SATU SEHAT
            </p>
          </div>
          <Switch
            checked={localConfig.enabled}
            onCheckedChange={(checked) => setLocalConfig({ ...localConfig, enabled: checked })}
          />
        </div>

        <Separator />

        {/* Environment Selection */}
        <div className="space-y-2">
          <Label htmlFor="ss-environment" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Environment
          </Label>
          <Select
            value={localConfig.environment}
            onValueChange={(val) => setLocalConfig({ ...localConfig, environment: val })}
          >
            <SelectTrigger id="ss-environment">
              <SelectValue placeholder="Pilih environment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sandbox">Sandbox (Development)</SelectItem>
              <SelectItem value="staging">Staging</SelectItem>
              <SelectItem value="production">Production</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Gunakan Sandbox untuk pengembangan dan testing
          </p>
        </div>

        {/* Organization ID */}
        <div className="space-y-2">
          <Label htmlFor="ss-org-id" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Organization ID (IHS Number)
          </Label>
          <Input
            id="ss-org-id"
            placeholder="Contoh: 10000001"
            value={localConfig.org_id}
            onChange={(e) => setLocalConfig({ ...localConfig, org_id: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            IHS Number yang didapat dari proses registrasi organisasi di SATU SEHAT
          </p>
        </div>

        <Separator />

        {/* API Credentials */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <Label className="text-base font-medium">Kredensial API</Label>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Dapatkan Client ID dan Client Secret dari portal{" "}
              <a 
                href="https://satusehat.kemkes.go.id" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium underline inline-flex items-center gap-1"
              >
                SATU SEHAT <ExternalLink className="h-3 w-3" />
              </a>
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ss-client-id">Client ID</Label>
              <Input
                id="ss-client-id"
                placeholder="Client ID dari SATU SEHAT"
                value={localConfig.client_id}
                onChange={(e) => setLocalConfig({ ...localConfig, client_id: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ss-client-secret">Client Secret</Label>
              <Input
                id="ss-client-secret"
                type="password"
                placeholder="••••••••••••••••"
                value={localConfig.client_secret}
                onChange={(e) => setLocalConfig({ ...localConfig, client_secret: e.target.value })}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Connection Status */}
        {connectionStatus !== "idle" && (
          <div className={`p-4 rounded-lg flex items-center gap-3 ${
            connectionStatus === "success" 
              ? "bg-green-500/10 text-green-700" 
              : "bg-red-500/10 text-red-700"
          }`}>
            {connectionStatus === "success" ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
            <span className="font-medium">
              {connectionStatus === "success" 
                ? "Koneksi ke SATU SEHAT berhasil!" 
                : "Gagal terhubung ke SATU SEHAT"}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={isTesting || !localConfig.org_id}
          >
            {isTesting ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Test Koneksi
          </Button>
          <Button onClick={handleSave} disabled={updateSetting.isPending}>
            {updateSetting.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Simpan Konfigurasi
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

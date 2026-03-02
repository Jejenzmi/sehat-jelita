import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { useToast } from "./use-toast";

export interface IntegrationStatus {
  id: string;
  name: string;
  code: string;
  enabled: boolean;
  status: "connected" | "disconnected" | "error" | "pending";
  lastSync?: string;
  errorMessage?: string;
}

export interface SatuSehatConfig {
  enabled: boolean;
  org_id: string;
  environment: "sandbox" | "staging" | "production";
  client_id: string;
  client_secret: string;
}

export interface BPJSConfig {
  enabled: boolean;
  provider_code: string;
  consumer_id: string;
  consumer_secret: string;
  user_key: string;
  environment: "development" | "production";
}

export interface SISRUTEConfig {
  enabled: boolean;
  hospital_code: string;
  api_key: string;
  environment: "development" | "production";
}

export interface BPJSAntreanConfig {
  enabled: boolean;
  provider_code: string;
  user_key: string;
  environment: "development" | "production";
}

export interface EklaimIDRGConfig {
  enabled: boolean;
  base_url: string;
  encryption_key: string;
  kode_tarif: string;
  debug_mode: boolean;
}

export interface PACSConfig {
  enabled: boolean;
  server_type: "orthanc" | "dcm4chee" | "horos" | "conquest" | "generic_dicomweb";
  base_url: string;
  dicomweb_url: string;
  username: string;
  password: string;
  ae_title: string;
  tls_enabled: boolean;
  timeout_seconds: number;
}

export interface AllIntegrationsConfig {
  satusehat: SatuSehatConfig;
  bpjs: BPJSConfig;
  sisrute: SISRUTEConfig;
  bpjs_antrean: BPJSAntreanConfig;
  eklaim_idrg: EklaimIDRGConfig;
  pacs: PACSConfig;
}

const defaultConfigs: AllIntegrationsConfig = {
  satusehat: {
    enabled: false,
    org_id: "",
    environment: "sandbox",
    client_id: "",
    client_secret: "",
  },
  bpjs: {
    enabled: false,
    provider_code: "",
    consumer_id: "",
    consumer_secret: "",
    user_key: "",
    environment: "development",
  },
  sisrute: {
    enabled: false,
    hospital_code: "",
    api_key: "",
    environment: "development",
  },
  bpjs_antrean: {
    enabled: false,
    provider_code: "",
    user_key: "",
    environment: "development",
  },
  eklaim_idrg: {
    enabled: false,
    base_url: "",
    encryption_key: "",
    kode_tarif: "",
    debug_mode: true,
  },
  pacs: {
    enabled: false,
    server_type: "orthanc",
    base_url: "",
    dicomweb_url: "",
    username: "",
    password: "",
    ae_title: "RSUD_MOEWARDI",
    tls_enabled: false,
    timeout_seconds: 30,
  },
};

export function useExternalIntegrations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all integration settings
  const { data: integrations, isLoading } = useQuery({
    queryKey: ["external-integrations"],
    queryFn: async () => {
      const { data, error } = await db
        .from("system_settings")
        .select("*")
        .in("setting_key", [
          "integration_satusehat",
          "integration_bpjs",
          "integration_sisrute",
          "integration_bpjs_antrean",
          "integration_eklaim_idrg",
          "integration_pacs",
        ]);

      if (error) throw error;

      const result: AllIntegrationsConfig = { ...defaultConfigs };

      data?.forEach((setting: any) => {
        if (setting.setting_key === "integration_satusehat") {
          result.satusehat = { ...defaultConfigs.satusehat, ...setting.setting_value };
        } else if (setting.setting_key === "integration_bpjs") {
          result.bpjs = { ...defaultConfigs.bpjs, ...setting.setting_value };
        } else if (setting.setting_key === "integration_sisrute") {
          result.sisrute = { ...defaultConfigs.sisrute, ...setting.setting_value };
        } else if (setting.setting_key === "integration_bpjs_antrean") {
          result.bpjs_antrean = { ...defaultConfigs.bpjs_antrean, ...setting.setting_value };
        } else if (setting.setting_key === "integration_eklaim_idrg") {
          result.eklaim_idrg = { ...defaultConfigs.eklaim_idrg, ...setting.setting_value };
        } else if (setting.setting_key === "integration_pacs") {
          result.pacs = { ...defaultConfigs.pacs, ...setting.setting_value };
        }
      });

      return result;
    },
  });

  // Update integration config
  const updateIntegration = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      // Check if setting exists
      const { data: existing } = await db
        .from("system_settings")
        .select("id")
        .eq("setting_key", key)
        .maybeSingle();

      if (existing) {
        const { error } = await db
          .from("system_settings")
          .update({ setting_key: key, setting_value: value, updated_at: new Date().toISOString() })
          .eq("setting_key", key);
        if (error) throw error;
      } else {
        const { error } = await db
          .from("system_settings")
          .insert({ setting_key: key, setting_value: value });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-integrations"] });
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      toast({ title: "Konfigurasi berhasil disimpan" });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal menyimpan konfigurasi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Test connection
  const testConnection = useMutation({
    mutationFn: async ({ integration, config }: { integration: string; config: any }) => {
      let endpoint = "";
      switch (integration) {
        case "satusehat":
          endpoint = "satusehat";
          break;
        case "bpjs":
          endpoint = "bpjs-vclaim";
          break;
        case "bpjs_antrean":
          endpoint = "bpjs-antrean";
          break;
        case "pacs":
          endpoint = "pacs-bridge";
          break;
        default:
          throw new Error("Integrasi tidak dikenal");
      }

      const { data, error } = await db.functions.invoke(endpoint, {
        body: {
          action: "test-connection",
          config,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Koneksi gagal");

      return data;
    },
  });

  // Get integration status summary
  const getIntegrationStatus = (): IntegrationStatus[] => {
    const configs = integrations || defaultConfigs;

    return [
      {
        id: "satusehat",
        name: "SATU SEHAT",
        code: "satusehat",
        enabled: configs.satusehat.enabled,
        status: configs.satusehat.enabled
          ? configs.satusehat.org_id
            ? "connected"
            : "pending"
          : "disconnected",
      },
      {
        id: "bpjs",
        name: "BPJS Kesehatan (VClaim)",
        code: "bpjs",
        enabled: configs.bpjs.enabled,
        status: configs.bpjs.enabled
          ? configs.bpjs.consumer_id
            ? "connected"
            : "pending"
          : "disconnected",
      },
      {
        id: "bpjs_antrean",
        name: "BPJS Antrean Online",
        code: "bpjs_antrean",
        enabled: configs.bpjs_antrean.enabled,
        status: configs.bpjs_antrean.enabled
          ? configs.bpjs_antrean.provider_code
            ? "connected"
            : "pending"
          : "disconnected",
      },
      {
        id: "sisrute",
        name: "SISRUTE",
        code: "sisrute",
        enabled: configs.sisrute.enabled,
        status: configs.sisrute.enabled
          ? configs.sisrute.hospital_code
            ? "connected"
            : "pending"
          : "disconnected",
      },
      {
        id: "eklaim_idrg",
        name: "E-Klaim IDRG",
        code: "eklaim_idrg",
        enabled: configs.eklaim_idrg.enabled,
        status: configs.eklaim_idrg.enabled
          ? configs.eklaim_idrg.base_url
            ? "connected"
            : "pending"
          : "disconnected",
      },
      {
        id: "pacs",
        name: "PACS Server",
        code: "pacs",
        enabled: configs.pacs.enabled,
        status: configs.pacs.enabled
          ? configs.pacs.base_url
            ? "connected"
            : "pending"
          : "disconnected",
      },
    ];
  };

  return {
    integrations: integrations || defaultConfigs,
    isLoading,
    updateIntegration,
    testConnection,
    getIntegrationStatus,
  };
}

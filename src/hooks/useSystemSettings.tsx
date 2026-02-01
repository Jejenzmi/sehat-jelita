import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export interface HospitalInfo {
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  npwp: string;
  director: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  lowStockAlert: boolean;
  appointmentReminder: boolean;
  billingReminder: boolean;
  criticalPatientAlert: boolean;
}

export interface SystemConfig {
  autoLogout: number;
  sessionTimeout: number;
  maintenanceMode: boolean;
  debugMode: boolean;
  backupEnabled: boolean;
  backupFrequency: string;
}

export interface IntegrationConfig {
  org_id?: string;
  environment?: string;
  provider_code?: string;
  enabled: boolean;
}

export interface BPJSConfig {
  enabled: boolean;
  provider_code: string;
  consumer_id: string;
  consumer_secret: string;
  user_key: string;
  environment: "development" | "production";
}

export function useSystemSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .order("setting_key");

      if (error) throw error;

      // Transform to key-value map
      const settingsMap: Record<string, any> = {};
      data?.forEach((s: any) => {
        settingsMap[s.setting_key] = s.setting_value;
      });

      return settingsMap;
    },
  });

  // Get specific setting with default
  const getSetting = <T,>(key: string, defaultValue: T): T => {
    return (settings?.[key] as T) ?? defaultValue;
  };

  // Update setting mutation
  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase
        .from("system_settings")
        .update({ setting_value: value, updated_at: new Date().toISOString() })
        .eq("setting_key", key);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      toast({ title: "Pengaturan berhasil disimpan" });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal menyimpan pengaturan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Convenience methods for specific settings
  const hospitalInfo = getSetting<HospitalInfo>("hospital_info", {
    name: "RS Sehat Jelita",
    code: "RSJ-001",
    address: "",
    phone: "",
    email: "",
    website: "",
    npwp: "",
    director: "",
  });

  const notificationSettings = getSetting<NotificationSettings>("notification_settings", {
    emailNotifications: true,
    smsNotifications: false,
    lowStockAlert: true,
    appointmentReminder: true,
    billingReminder: true,
    criticalPatientAlert: true,
  });

  const systemConfig = getSetting<SystemConfig>("system_config", {
    autoLogout: 30,
    sessionTimeout: 60,
    maintenanceMode: false,
    debugMode: false,
    backupEnabled: true,
    backupFrequency: "daily",
  });

  const satuSehatConfig = getSetting<IntegrationConfig>("integration_satusehat", {
    org_id: "",
    environment: "sandbox",
    enabled: false,
  });

  const bpjsConfig = getSetting<BPJSConfig>("integration_bpjs", {
    enabled: false,
    provider_code: "",
    consumer_id: "",
    consumer_secret: "",
    user_key: "",
    environment: "development",
  });

  return {
    settings,
    isLoading,
    getSetting,
    updateSetting,
    hospitalInfo,
    notificationSettings,
    systemConfig,
    satuSehatConfig,
    bpjsConfig,
  };
}

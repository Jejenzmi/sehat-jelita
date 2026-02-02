import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Save, RefreshCw, Info } from "lucide-react";
import { useModuleConfiguration } from "@/hooks/useModuleConfiguration";
import { Alert, AlertDescription } from "@/components/ui/alert";

const categoryLabels: Record<string, string> = {
  core: "Modul Inti",
  clinical: "Pelayanan Klinis",
  support: "Penunjang Medis",
  admin: "Administrasi",
  integration: "Integrasi",
  reporting: "Pelaporan",
  education: "Pendidikan",
  quality: "Mutu & Akreditasi",
};

export function ModuleConfigurationTab() {
  const { modules, enabledModules, hospitalType, isLoading, updateEnabledModules } = useModuleConfiguration();
  const [localEnabled, setLocalEnabled] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize local state from server data
  useEffect(() => {
    if (enabledModules.length > 0) {
      setLocalEnabled(enabledModules);
    } else if (modules.length > 0) {
      // If no custom enabled list, use all available modules as enabled
      setLocalEnabled(modules.map((m) => m.module_code));
    }
  }, [enabledModules, modules]);

  const handleToggle = (moduleCode: string, enabled: boolean) => {
    setLocalEnabled((prev) => {
      const newList = enabled
        ? [...prev, moduleCode]
        : prev.filter((code) => code !== moduleCode);
      return newList;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    await updateEnabledModules.mutateAsync(localEnabled);
    setHasChanges(false);
  };

  const groupModulesByCategory = () => {
    return modules.reduce((acc, mod) => {
      const cat = mod.module_category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(mod);
      return acc;
    }, {} as Record<string, typeof modules>);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const groupedModules = groupModulesByCategory();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Konfigurasi Modul
        </CardTitle>
        <CardDescription>
          Aktifkan atau nonaktifkan modul berdasarkan kebutuhan rumah sakit
          {hospitalType && (
            <Badge variant="outline" className="ml-2">
              Tipe {hospitalType}
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Modul inti tidak dapat dinonaktifkan. Perubahan akan mempengaruhi menu yang tampil di sidebar.
          </AlertDescription>
        </Alert>

        {Object.entries(groupedModules).map(([category, categoryModules]) => (
          <div key={category} className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
              {categoryLabels[category] || category}
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {categoryModules.map((mod) => {
                const isEnabled = localEnabled.includes(mod.module_code);
                const isCore = mod.is_core_module;

                return (
                  <div
                    key={mod.module_code}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isCore ? "bg-muted/50" : "bg-background"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{mod.module_name}</span>
                          {isCore && (
                            <Badge variant="secondary" className="text-xs">
                              Inti
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{mod.module_path}</span>
                      </div>
                    </div>
                    <Switch
                      checked={isEnabled}
                      disabled={isCore}
                      onCheckedChange={(checked) => handleToggle(mod.module_code, checked)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={!hasChanges || updateEnabledModules.isPending}>
            {updateEnabledModules.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Simpan Perubahan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

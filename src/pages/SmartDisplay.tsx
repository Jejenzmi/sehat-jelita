import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { LobbyDisplay } from "@/components/smart-display/LobbyDisplay";
import { WardDisplay } from "@/components/smart-display/WardDisplay";
import { PharmacyDisplay } from "@/components/smart-display/PharmacyDisplay";
import { ScheduleDisplay } from "@/components/smart-display/ScheduleDisplay";
import { SmartDisplaySettings } from "@/components/smart-display/SmartDisplaySettings";
import { DeviceManager } from "@/components/smart-display/DeviceManager";
import {
  Tv, Monitor, BedDouble, Pill, CalendarDays,
  Maximize2, Minimize2, Settings2, ArrowLeft, MonitorSmartphone,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSmartDisplayDevice } from "@/hooks/useSmartDisplayDevices";
import { cn } from "@/lib/utils";

const MODULE_CONFIG = {
  lobby: { label: "Lobby", icon: Monitor, component: LobbyDisplay },
  ward: { label: "Ward", icon: BedDouble, component: WardDisplay },
  pharmacy: { label: "Farmasi", icon: Pill, component: PharmacyDisplay },
  schedule: { label: "Jadwal", icon: CalendarDays, component: ScheduleDisplay },
} as const;

type ModuleKey = keyof typeof MODULE_CONFIG;

export default function SmartDisplay() {
  const [searchParams] = useSearchParams();
  const deviceCode = searchParams.get("device");

  const { data: device } = useSmartDisplayDevice(deviceCode);

  // Determine enabled modules
  const enabledModules: ModuleKey[] = device?.enabled_modules?.length
    ? (device.enabled_modules.filter((m) => m in MODULE_CONFIG) as ModuleKey[])
    : (["lobby", "ward", "pharmacy", "schedule"] as ModuleKey[]);

  const [activeDisplay, setActiveDisplay] = useState<string>(enabledModules[0] || "lobby");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [devicesOpen, setDevicesOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const canManage = hasRole("admin") || hasRole("manajemen");

  // Sync active display when device changes
  useEffect(() => {
    if (enabledModules.length > 0 && !enabledModules.includes(activeDisplay as ModuleKey)) {
      setActiveDisplay(enabledModules[0]);
    }
  }, [enabledModules, activeDisplay]);

  // Auto-rotate modules
  useEffect(() => {
    if (!device?.auto_rotate || enabledModules.length <= 1) return;
    const interval = (device.rotate_interval || 30) * 1000;
    const timer = setInterval(() => {
      setActiveDisplay((prev) => {
        const idx = enabledModules.indexOf(prev as ModuleKey);
        return enabledModules[(idx + 1) % enabledModules.length];
      });
    }, interval);
    return () => clearInterval(timer);
  }, [device?.auto_rotate, device?.rotate_interval, enabledModules]);

  // Track fullscreen state
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  }, []);

  return (
    <div className={cn(
      "bg-background",
      isFullscreen ? "fixed inset-0 z-[9999] flex flex-col w-screen h-screen overflow-hidden" : "min-h-screen"
    )}>
      {/* Top bar - hidden in fullscreen */}
      {!isFullscreen && (
        <div className="flex items-center justify-between px-4 py-2 bg-card/80 backdrop-blur border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Tv className="h-5 w-5 text-primary" />
              <div>
                <h1 className="font-bold text-foreground text-lg">Smart Hospital Display</h1>
                {device && (
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    {device.device_name} — {device.location}
                    {device.auto_rotate && <Badge variant="outline" className="ml-2 text-[8px] py-0">Auto Rotate</Badge>}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs">Auto Refresh</Label>
              <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            </div>
            <Button variant="outline" size="sm" onClick={toggleFullscreen}>
              <Maximize2 className="h-4 w-4 mr-1" /> Fullscreen
            </Button>
            {canManage && (
              <>
                <Button variant="outline" size="sm" onClick={() => setDevicesOpen(true)}>
                  <MonitorSmartphone className="h-4 w-4 mr-1" /> Devices
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
                  <Settings2 className="h-4 w-4 mr-1" /> Konten
                </Button>
              </>
            )}
          </div>
        </div>
      )}


      {/* Content */}
      <div className={cn(isFullscreen ? "flex-1 overflow-hidden p-4" : "p-4")}>
        {enabledModules.length === 1 ? (
          (() => {
            const mod = MODULE_CONFIG[enabledModules[0]];
            const Comp = mod.component;
            return <Comp />;
          })()
        ) : (
          <Tabs value={activeDisplay} onValueChange={setActiveDisplay} className={cn(isFullscreen && "h-full flex flex-col")}>
          {!isFullscreen && (
            <TabsList className="mb-4 shrink-0">
              {enabledModules.map((key) => {
                const mod = MODULE_CONFIG[key];
                const Icon = mod.icon;
                return (
                  <TabsTrigger key={key} value={key} className="gap-1">
                    <Icon className="h-3.5 w-3.5" /> {mod.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          )}
            <div className={cn(isFullscreen && "flex-1 overflow-auto")}>
              {enabledModules.map((key) => {
                const mod = MODULE_CONFIG[key];
                const Comp = mod.component;
                return (
                  <TabsContent key={key} value={key}><Comp /></TabsContent>
                );
              })}
            </div>
          </Tabs>
        )}
      </div>

      {/* Dialogs */}
      {canManage && <SmartDisplaySettings open={settingsOpen} onOpenChange={setSettingsOpen} />}
      {canManage && <DeviceManager open={devicesOpen} onOpenChange={setDevicesOpen} />}
    </div>
  );
}

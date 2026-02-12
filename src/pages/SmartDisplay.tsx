import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { LobbyDisplay } from "@/components/smart-display/LobbyDisplay";
import { WardDisplay } from "@/components/smart-display/WardDisplay";
import { PharmacyDisplay } from "@/components/smart-display/PharmacyDisplay";
import { ScheduleDisplay } from "@/components/smart-display/ScheduleDisplay";
import { SmartDisplaySettings } from "@/components/smart-display/SmartDisplaySettings";
import {
  Tv,
  Monitor,
  BedDouble,
  Pill,
  CalendarDays,
  Maximize2,
  Minimize2,
  Settings2,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export default function SmartDisplay() {
  const [activeDisplay, setActiveDisplay] = useState("lobby");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const canManage = hasRole("admin") || hasRole("manajemen");

  // Track fullscreen state
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  return (
    <div
      className={cn(
        "bg-gradient-to-br from-slate-50 via-white to-teal-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950",
        isFullscreen
          ? "fixed inset-0 z-[9999] flex flex-col w-screen h-screen overflow-hidden"
          : "min-h-screen"
      )}
    >
      {/* Compact top bar */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b shrink-0",
          isFullscreen && "px-6 py-3"
        )}
      >
        <div className="flex items-center gap-3">
          {!isFullscreen && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Tv className={cn("text-primary", isFullscreen ? "h-7 w-7" : "h-5 w-5")} />
            <h1
              className={cn(
                "font-bold text-foreground",
                isFullscreen ? "text-2xl" : "text-lg"
              )}
            >
              Smart Hospital Display
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs">Auto Refresh</Label>
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          </div>
          <Button variant="outline" size="sm" onClick={toggleFullscreen}>
            {isFullscreen ? (
              <><Minimize2 className="h-4 w-4 mr-1" /> Keluar Fullscreen</>
            ) : (
              <><Maximize2 className="h-4 w-4 mr-1" /> Fullscreen</>
            )}
          </Button>
          {canManage && !isFullscreen && (
            <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
              <Settings2 className="h-4 w-4 mr-1" /> Pengaturan
            </Button>
          )}
        </div>
      </div>

      {/* Content — fills remaining space in fullscreen */}
      <div
        className={cn(
          isFullscreen
            ? "flex-1 overflow-auto p-6"
            : "p-4"
        )}
      >
        <Tabs value={activeDisplay} onValueChange={setActiveDisplay} className={cn(isFullscreen && "h-full flex flex-col")}>
          <TabsList className={cn("mb-4 shrink-0", isFullscreen && "mb-5")}>
            <TabsTrigger value="lobby" className="gap-1"><Monitor className="h-3.5 w-3.5" /> Lobby</TabsTrigger>
            <TabsTrigger value="ward" className="gap-1"><BedDouble className="h-3.5 w-3.5" /> Ward</TabsTrigger>
            <TabsTrigger value="pharmacy" className="gap-1"><Pill className="h-3.5 w-3.5" /> Farmasi</TabsTrigger>
            <TabsTrigger value="schedule" className="gap-1"><CalendarDays className="h-3.5 w-3.5" /> Jadwal</TabsTrigger>
          </TabsList>

          <div className={cn(isFullscreen && "flex-1 overflow-auto")}>
            <TabsContent value="lobby"><LobbyDisplay /></TabsContent>
            <TabsContent value="ward"><WardDisplay /></TabsContent>
            <TabsContent value="pharmacy"><PharmacyDisplay /></TabsContent>
            <TabsContent value="schedule"><ScheduleDisplay /></TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Settings Dialog */}
      {canManage && <SmartDisplaySettings open={settingsOpen} onOpenChange={setSettingsOpen} />}
    </div>
  );
}

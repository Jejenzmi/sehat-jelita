import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { LobbyDisplay } from "@/components/smart-display/LobbyDisplay";
import { WardDisplay } from "@/components/smart-display/WardDisplay";
import { PharmacyDisplay } from "@/components/smart-display/PharmacyDisplay";
import { ScheduleDisplay } from "@/components/smart-display/ScheduleDisplay";
import {
  Tv,
  Monitor,
  BedDouble,
  Pill,
  CalendarDays,
  Maximize2,
  Settings2,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SmartDisplay() {
  const [activeDisplay, setActiveDisplay] = useState("lobby");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const navigate = useNavigate();

  const handleFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
      toast.success("Fullscreen mode aktif");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Compact top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Tv className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">Smart Hospital Display</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs">Auto Refresh</Label>
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          </div>
          <Button variant="outline" size="sm" onClick={handleFullscreen}>
            <Maximize2 className="h-4 w-4 mr-1" /> Fullscreen
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <Tabs value={activeDisplay} onValueChange={setActiveDisplay}>
          <TabsList className="mb-4">
            <TabsTrigger value="lobby" className="gap-1"><Monitor className="h-3.5 w-3.5" /> Lobby</TabsTrigger>
            <TabsTrigger value="ward" className="gap-1"><BedDouble className="h-3.5 w-3.5" /> Ward</TabsTrigger>
            <TabsTrigger value="pharmacy" className="gap-1"><Pill className="h-3.5 w-3.5" /> Farmasi</TabsTrigger>
            <TabsTrigger value="schedule" className="gap-1"><CalendarDays className="h-3.5 w-3.5" /> Jadwal</TabsTrigger>
          </TabsList>

          <TabsContent value="lobby"><LobbyDisplay /></TabsContent>
          <TabsContent value="ward"><WardDisplay /></TabsContent>
          <TabsContent value="pharmacy"><PharmacyDisplay /></TabsContent>
          <TabsContent value="schedule"><ScheduleDisplay /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

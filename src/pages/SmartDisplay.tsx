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
} from "lucide-react";

export default function SmartDisplay() {
  const [activeDisplay, setActiveDisplay] = useState("lobby");
  const [autoRefresh, setAutoRefresh] = useState(true);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Tv className="h-6 w-6 text-primary" />
            Smart Hospital Display
          </h1>
          <p className="text-muted-foreground text-sm">Manajemen layar informasi untuk lobby, ward, dan farmasi</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs">Auto Refresh</Label>
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          </div>
          <Button variant="outline" size="sm" onClick={() => toast.success("Fullscreen mode aktif")}>
            <Maximize2 className="h-4 w-4 mr-1" /> Fullscreen
          </Button>
          <Button variant="outline" size="sm">
            <Settings2 className="h-4 w-4 mr-1" /> Pengaturan
          </Button>
        </div>
      </div>

      <Tabs value={activeDisplay} onValueChange={setActiveDisplay}>
        <TabsList>
          <TabsTrigger value="lobby" className="gap-1"><Monitor className="h-3.5 w-3.5" /> Lobby Display</TabsTrigger>
          <TabsTrigger value="ward" className="gap-1"><BedDouble className="h-3.5 w-3.5" /> Ward Display</TabsTrigger>
          <TabsTrigger value="pharmacy" className="gap-1"><Pill className="h-3.5 w-3.5" /> Farmasi Display</TabsTrigger>
          <TabsTrigger value="schedule" className="gap-1"><CalendarDays className="h-3.5 w-3.5" /> Jadwal Display</TabsTrigger>
        </TabsList>

        <TabsContent value="lobby"><LobbyDisplay /></TabsContent>
        <TabsContent value="ward"><WardDisplay /></TabsContent>
        <TabsContent value="pharmacy"><PharmacyDisplay /></TabsContent>
        <TabsContent value="schedule"><ScheduleDisplay /></TabsContent>
      </Tabs>
    </div>
  );
}

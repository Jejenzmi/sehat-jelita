import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDoctorScheduleData } from "@/hooks/useSmartDisplayData";
import { DisplayHeader } from "./DisplayHeader";
import { Clock } from "lucide-react";

export function ScheduleDisplay() {
  const { data: scheduleData = [] } = useDoctorScheduleData();

  return (
    <div className="space-y-5">
      <DisplayHeader
        title="Jadwal Dokter Hari Ini"
        subtitle={`${new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} — SIMRS ZEN`}
        variant="purple"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scheduleData.map((doc: any, i: number) => (
          <Card key={i} className="hover:shadow-lg transition-shadow border-l-4 border-l-emerald-500">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-[10px]">Praktek</Badge>
              </div>
              <h3 className="font-bold text-lg">{doc.doctors?.full_name || "-"}</h3>
              <p className="text-sm text-muted-foreground mb-3">{doc.departments?.name || "-"}</p>
              <div className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg px-3 py-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{doc.start_time} - {doc.end_time}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {scheduleData.length === 0 && (
          <p className="text-muted-foreground text-center py-12 col-span-3 text-lg">Belum ada jadwal dokter hari ini</p>
        )}
      </div>
    </div>
  );
}

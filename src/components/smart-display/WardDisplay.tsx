import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBedData } from "@/hooks/useSmartDisplayData";
import { DisplayHeader } from "./DisplayHeader";
import { BedDouble, UserCheck, Wrench, CheckCircle } from "lucide-react";

export function WardDisplay() {
  const { data: bedDataRaw = [] } = useBedData();
  const bedData = bedDataRaw.map((b: any) => ({
    room: b.rooms?.room_number ? `${b.rooms.room_number}-${b.bed_number}` : b.bed_number,
    ward: b.rooms?.ward?.name || "-",
    patient: b.patients?.full_name || "-",
    status: b.status === "available" ? "kosong" : b.status === "occupied" ? "terisi" : b.status,
  }));

  const occupied = bedData.filter(b => b.status === "terisi").length;
  const available = bedData.filter(b => b.status === "kosong").length;
  const maintenance = bedData.filter(b => b.status === "maintenance").length;
  const occupancyRate = bedData.length > 0 ? Math.round((occupied / bedData.length) * 100) : 0;

  const stats = [
    { label: "Total TT", value: bedData.length, icon: BedDouble, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { label: "Terisi", value: occupied, icon: UserCheck, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30" },
    { label: "Kosong", value: available, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "Maintenance", value: maintenance, icon: Wrench, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
  ];

  return (
    <div className="space-y-5">
      <DisplayHeader title="Ward Display" subtitle="Status Tempat Tidur Real-time — RSUD Dr. Moewardi" variant="blue" />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stats.map(s => (
          <Card key={s.label} className={`${s.bg} border-0 shadow-sm`}>
            <CardContent className="pt-4 pb-3 text-center">
              <s.icon className={`h-6 w-6 ${s.color} mx-auto mb-1`} />
              <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
            </CardContent>
          </Card>
        ))}
        <Card className="bg-gradient-to-br from-teal-500 to-cyan-600 text-white border-0 shadow-lg">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-3xl font-black">{occupancyRate}%</p>
            <p className="text-xs opacity-90 font-medium">BOR</p>
          </CardContent>
        </Card>
      </div>

      {/* Bed Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {bedData.map(bed => {
          const isOccupied = bed.status === "terisi";
          const isEmpty = bed.status === "kosong";
          return (
            <Card
              key={bed.room}
              className={`transition-all hover:scale-[1.02] ${
                isOccupied
                  ? "border-red-200 bg-red-50/80 dark:bg-red-950/30 dark:border-red-800"
                  : isEmpty
                  ? "border-emerald-200 bg-emerald-50/80 dark:bg-emerald-950/30 dark:border-emerald-800"
                  : "border-amber-200 bg-amber-50/80 dark:bg-amber-950/30 dark:border-amber-800"
              }`}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm">{bed.room}</span>
                  <Badge
                    variant={isOccupied ? "destructive" : isEmpty ? "default" : "secondary"}
                    className="text-[9px] px-1.5 py-0"
                  >
                    {bed.status}
                  </Badge>
                </div>
                {isOccupied && <p className="text-[11px] font-medium truncate">{bed.patient}</p>}
                <p className="text-[10px] text-muted-foreground truncate">{bed.ward}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

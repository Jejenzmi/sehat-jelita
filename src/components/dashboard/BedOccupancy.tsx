import { BedDouble, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const wardData = [
  { name: "VIP", occupied: 8, total: 10, color: "bg-medical-purple" },
  { name: "Kelas 1", occupied: 15, total: 20, color: "bg-primary" },
  { name: "Kelas 2", occupied: 28, total: 30, color: "bg-medical-blue" },
  { name: "Kelas 3", occupied: 42, total: 50, color: "bg-success" },
  { name: "ICU", occupied: 6, total: 8, color: "bg-destructive" },
  { name: "NICU", occupied: 4, total: 5, color: "bg-warning" },
];

export function BedOccupancy() {
  const totalOccupied = wardData.reduce((acc, ward) => acc + ward.occupied, 0);
  const totalBeds = wardData.reduce((acc, ward) => acc + ward.total, 0);
  const occupancyRate = Math.round((totalOccupied / totalBeds) * 100);

  return (
    <div className="module-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-medical-purple/10">
          <BedDouble className="h-5 w-5 text-medical-purple" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Okupansi Tempat Tidur</h3>
          <p className="text-sm text-muted-foreground">Real-time bed management</p>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="text-center p-3 rounded-lg bg-muted/50">
          <p className="text-2xl font-bold">{totalOccupied}</p>
          <p className="text-xs text-muted-foreground">Terisi</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-muted/50">
          <p className="text-2xl font-bold">{totalBeds - totalOccupied}</p>
          <p className="text-xs text-muted-foreground">Tersedia</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-primary/10">
          <p className="text-2xl font-bold text-primary">{occupancyRate}%</p>
          <p className="text-xs text-muted-foreground">Okupansi</p>
        </div>
      </div>

      {/* Ward Breakdown */}
      <div className="space-y-3">
        {wardData.map((ward) => {
          const percentage = Math.round((ward.occupied / ward.total) * 100);
          return (
            <div key={ward.name} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${ward.color}`} />
                  <span>{ward.name}</span>
                </div>
                <span className="text-muted-foreground">
                  {ward.occupied}/{ward.total}
                </span>
              </div>
              <Progress
                value={percentage}
                className="h-2"
                style={{
                  background: "hsl(var(--muted))",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

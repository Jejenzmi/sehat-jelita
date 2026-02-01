import { BedDouble } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useBedOccupancy } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

export function BedOccupancy() {
  const { data: wardData = [], isLoading } = useBedOccupancy();

  if (isLoading) {
    return (
      <div className="module-card">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8" />
          ))}
        </div>
      </div>
    );
  }

  const totalOccupied = wardData.reduce((acc, ward) => acc + ward.occupied, 0);
  const totalBeds = wardData.reduce((acc, ward) => acc + ward.total, 0);
  const occupancyRate = totalBeds > 0 ? Math.round((totalOccupied / totalBeds) * 100) : 0;

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
        {wardData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Belum ada data kamar
          </p>
        ) : (
          wardData.map((ward) => {
            const percentage = ward.total > 0 ? Math.round((ward.occupied / ward.total) * 100) : 0;
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
          })
        )}
      </div>
    </div>
  );
}

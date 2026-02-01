import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useWeeklyVisits } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

export function ServiceChart() {
  const { data = [], isLoading } = useWeeklyVisits();

  if (isLoading) {
    return (
      <div className="module-card">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  return (
    <div className="module-card">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Kunjungan Mingguan</h3>
        <p className="text-sm text-muted-foreground">
          Statistik kunjungan pasien per layanan
        </p>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorRawatJalan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(187 85% 35%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(187 85% 35%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorRawatInap" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(210 80% 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(210 80% 50%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorIGD" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(12 76% 61%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(12 76% 61%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="name"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
              }}
            />
            <Area
              type="monotone"
              dataKey="rawatJalan"
              name="Rawat Jalan"
              stroke="hsl(187 85% 35%)"
              fillOpacity={1}
              fill="url(#colorRawatJalan)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="rawatInap"
              name="Rawat Inap"
              stroke="hsl(210 80% 50%)"
              fillOpacity={1}
              fill="url(#colorRawatInap)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="igd"
              name="IGD"
              stroke="hsl(12 76% 61%)"
              fillOpacity={1}
              fill="url(#colorIGD)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground">Rawat Jalan</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-medical-blue" />
          <span className="text-sm text-muted-foreground">Rawat Inap</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-medical-coral" />
          <span className="text-sm text-muted-foreground">IGD</span>
        </div>
      </div>
    </div>
  );
}

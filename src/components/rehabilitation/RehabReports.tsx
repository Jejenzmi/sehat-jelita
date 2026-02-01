import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRehabilitationData } from "@/hooks/useRehabilitationData";

export function RehabReports() {
  const { assessments, goals } = useRehabilitationData();

  const achievedGoals = goals?.filter((g: any) => g.status === "achieved").length || 0;
  const inProgressGoals = goals?.filter((g: any) => g.status === "in_progress").length || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Statistik Rehabilitasi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Total Pasien Aktif</span>
              <span className="text-lg font-bold">{assessments?.length || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Goal Tercapai</span>
              <span className="text-lg font-bold text-primary">{achievedGoals}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Goal Dalam Proses</span>
              <span className="text-lg font-bold">{inProgressGoals}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Rata-rata Pain Scale</span>
              <span className="text-lg font-bold">
                {assessments && assessments.length > 0
                  ? (assessments.reduce((sum: number, a: any) => sum + (a.pain_scale || 0), 0) / assessments.length).toFixed(1)
                  : 0}
                /10
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribusi Terapi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Fisioterapi</span>
              <span className="text-lg font-bold">45%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Terapi Okupasi</span>
              <span className="text-lg font-bold">30%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Terapi Wicara</span>
              <span className="text-lg font-bold">15%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Hidroterapi</span>
              <span className="text-lg font-bold">10%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

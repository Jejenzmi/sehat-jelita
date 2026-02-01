import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, CheckCircle, AlertCircle, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function AccreditationDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">SNARS 1.1</p>
                <p className="text-sm text-muted-foreground">Standar Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold">85%</p>
                <p className="text-sm text-muted-foreground">Kepatuhan</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-warning" />
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-muted-foreground">Temuan Terbuka</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-info" />
              <div>
                <p className="text-2xl font-bold">2025-06</p>
                <p className="text-sm text-muted-foreground">Survei Berikutnya</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Progress per Bab</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {['SKP - Sasaran Keselamatan Pasien', 'PPI - Pencegahan Pengendalian Infeksi', 'PMKP - Peningkatan Mutu'].map((item, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{item}</span>
                <span>{80 + i * 5}%</span>
              </div>
              <Progress value={80 + i * 5} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

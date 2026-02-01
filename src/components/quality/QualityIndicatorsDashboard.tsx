import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp, Target, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function QualityIndicatorsDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">10</p>
                <p className="text-sm text-muted-foreground">Indikator Nasional</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold">8</p>
                <p className="text-sm text-muted-foreground">Mencapai Target</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-warning" />
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-sm text-muted-foreground">Perlu Perbaikan</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-info" />
              <div>
                <p className="text-2xl font-bold">Jan 2026</p>
                <p className="text-sm text-muted-foreground">Periode Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Indikator Mutu Nasional (SISMADAK)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { code: 'INM-01', name: 'Kepatuhan Identifikasi Pasien', value: 98, target: 100 },
              { code: 'INM-07', name: 'Kepatuhan Kebersihan Tangan', value: 87, target: 85 },
              { code: 'INM-03', name: 'Waktu Tunggu Rawat Jalan', value: 75, target: 80 },
            ].map((ind) => (
              <div key={ind.code} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <Badge variant="outline" className="mr-2">{ind.code}</Badge>
                  <span className="text-sm">{ind.name}</span>
                </div>
                <Badge variant={ind.value >= ind.target ? "default" : "destructive"}>
                  {ind.value}% / {ind.target}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

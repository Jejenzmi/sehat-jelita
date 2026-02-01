import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Database, TrendingUp, FileText } from "lucide-react";

export default function INADRGDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">1,250</p>
                <p className="text-sm text-muted-foreground">Kode DRG</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-info" />
              <div>
                <p className="text-2xl font-bold">856</p>
                <p className="text-sm text-muted-foreground">Mapping ICD-10</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold">94%</p>
                <p className="text-sm text-muted-foreground">Akurasi Grouping</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-warning" />
              <div>
                <p className="text-2xl font-bold">2024</p>
                <p className="text-sm text-muted-foreground">Tarif Berlaku</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>INA-DRG Mapping</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Modul INA-DRG Mapping siap digunakan untuk kalkulasi tarif BPJS.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

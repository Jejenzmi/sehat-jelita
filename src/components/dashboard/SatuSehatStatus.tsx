import { Building2, CheckCircle, RefreshCw, AlertCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export function SatuSehatStatus() {
  return (
    <div className="module-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-medical-blue/10">
          <Building2 className="h-5 w-5 text-medical-blue" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">SATU SEHAT</h3>
          <p className="text-sm text-muted-foreground">Integrasi Kemenkes RI</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/20">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-sm font-medium">FHIR API Connected</span>
          </div>
          <span className="text-xs font-medium text-success">Active</span>
        </div>

        {/* Sync Status */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              <Upload className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Data Dikirim</span>
            </div>
            <p className="text-xl font-bold">1,234</p>
            <p className="text-xs text-muted-foreground">Hari ini</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              <RefreshCw className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">Sync Rate</span>
            </div>
            <p className="text-xl font-bold">98.5%</p>
            <p className="text-xs text-muted-foreground">Sukses</p>
          </div>
        </div>

        {/* Resources */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Resource Status</p>
          {[
            { name: "Patient", synced: 2450, total: 2500, percentage: 98 },
            { name: "Encounter", synced: 1180, total: 1200, percentage: 98 },
            { name: "Observation", synced: 3800, total: 4000, percentage: 95 },
            { name: "Medication", synced: 890, total: 900, percentage: 99 },
          ].map((resource) => (
            <div key={resource.name} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{resource.name}</span>
                <span className="text-xs">
                  {resource.synced.toLocaleString()} / {resource.total.toLocaleString()}
                </span>
              </div>
              <Progress value={resource.percentage} className="h-1.5" />
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Now
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            View Logs
          </Button>
        </div>
      </div>
    </div>
  );
}

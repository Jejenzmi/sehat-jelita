import { Building2, CheckCircle, RefreshCw, Upload, Download, Activity, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const resourceStats = [
  { name: "Patient", synced: 12450, total: 12500, percentage: 99.6 },
  { name: "Practitioner", synced: 85, total: 85, percentage: 100 },
  { name: "Organization", synced: 1, total: 1, percentage: 100 },
  { name: "Location", synced: 45, total: 45, percentage: 100 },
  { name: "Encounter", synced: 45680, total: 46000, percentage: 99.3 },
  { name: "Condition", synced: 38500, total: 39000, percentage: 98.7 },
  { name: "Observation", synced: 125000, total: 128000, percentage: 97.7 },
  { name: "Procedure", synced: 18900, total: 19200, percentage: 98.4 },
  { name: "MedicationRequest", synced: 52000, total: 53000, percentage: 98.1 },
  { name: "ServiceRequest", synced: 28000, total: 28500, percentage: 98.2 },
];

const recentLogs = [
  { time: "09:45:23", type: "success", message: "Patient resource synced successfully", count: 15 },
  { time: "09:44:12", type: "success", message: "Encounter bundle uploaded", count: 8 },
  { time: "09:43:05", type: "warning", message: "Observation validation warning", count: 2 },
  { time: "09:42:30", type: "success", message: "MedicationRequest synced", count: 12 },
  { time: "09:41:15", type: "error", message: "Condition resource validation failed", count: 1 },
];

export default function SatuSehat() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">SATU SEHAT</h1>
          <p className="text-muted-foreground">Integrasi Data Kesehatan Nasional - Kemenkes RI</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Pull Data
          </Button>
          <Button className="gradient-primary shadow-glow">
            <Upload className="h-4 w-4 mr-2" />
            Push All Data
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="module-card border-success/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl gradient-hero">
              <Building2 className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">FHIR R4 API Connection</h3>
              <p className="text-sm text-muted-foreground">
                Endpoint: api-satusehat.kemkes.go.id • OAuth2 Active
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Last Sync</p>
              <p className="font-medium">2 menit yang lalu</p>
            </div>
            <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-base px-4 py-2">
              <CheckCircle className="h-4 w-4 mr-2" />
              Connected
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="module-card">
          <div className="flex items-center gap-3 mb-2">
            <Upload className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Data Terkirim Hari Ini</span>
          </div>
          <p className="text-3xl font-bold">1,234</p>
          <p className="text-sm text-muted-foreground mt-1">Resources</p>
        </div>
        <div className="module-card">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="h-5 w-5 text-success" />
            <span className="text-sm text-muted-foreground">Success Rate</span>
          </div>
          <p className="text-3xl font-bold text-success">98.5%</p>
          <p className="text-sm text-muted-foreground mt-1">Sync accuracy</p>
        </div>
        <div className="module-card">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-5 w-5 text-info" />
            <span className="text-sm text-muted-foreground">Total Resources</span>
          </div>
          <p className="text-3xl font-bold">324,330</p>
          <p className="text-sm text-muted-foreground mt-1">All time synced</p>
        </div>
        <div className="module-card">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            <span className="text-sm text-muted-foreground">Pending Validation</span>
          </div>
          <p className="text-3xl font-bold text-warning">45</p>
          <p className="text-sm text-muted-foreground mt-1">Need attention</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resource Status */}
        <div className="lg:col-span-2">
          <div className="module-card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">FHIR Resource Status</h3>
                <p className="text-sm text-muted-foreground">Status sinkronisasi per resource type</p>
              </div>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resourceStats.map((resource) => (
                <div key={resource.name} className="p-4 rounded-xl bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{resource.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {resource.synced.toLocaleString()} / {resource.total.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={resource.percentage} className="h-2" />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-success">{resource.percentage}% synced</span>
                    {resource.percentage < 100 && (
                      <span className="text-xs text-warning">
                        {(resource.total - resource.synced).toLocaleString()} pending
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sync Logs */}
        <div className="module-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Sync Logs</h3>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>

          <div className="space-y-3">
            {recentLogs.map((log, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
              >
                <div
                  className={`w-2 h-2 rounded-full mt-2 ${
                    log.type === "success"
                      ? "bg-success"
                      : log.type === "warning"
                      ? "bg-warning"
                      : "bg-destructive"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm">{log.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{log.time}</span>
                    {log.count > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {log.count} items
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compliance Info */}
      <div className="module-card">
        <Tabs defaultValue="compliance">
          <TabsList>
            <TabsTrigger value="compliance">Compliance Status</TabsTrigger>
            <TabsTrigger value="mapping">Data Mapping</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="compliance" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-success/5 border border-success/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="font-medium">FHIR R4 Compliant</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  All resources follow FHIR R4 specification
                </p>
              </div>
              <div className="p-4 rounded-xl bg-success/5 border border-success/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="font-medium">ICD-10 Coding</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Diagnosis codes properly mapped
                </p>
              </div>
              <div className="p-4 rounded-xl bg-success/5 border border-success/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="font-medium">ICD-9-CM Procedures</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Procedure codes validated
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mapping" className="mt-4">
            <p className="text-center text-muted-foreground py-8">
              Data mapping configuration
            </p>
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <p className="text-center text-muted-foreground py-8">
              SATU SEHAT integration settings
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

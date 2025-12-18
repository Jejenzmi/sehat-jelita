import { useState, useEffect } from "react";
import { Building2, CheckCircle, RefreshCw, AlertCircle, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

interface SyncStat {
  name: string;
  synced: number;
  total: number;
  percentage: number;
}

export function SatuSehatStatus() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<SyncStat[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [successRate, setSuccessRate] = useState(100);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('satusehat', {
        body: { action: 'get-sync-stats' },
      });

      if (!error && data) {
        setStats(data.stats?.slice(0, 4) || []);
        setTodayCount(data.todayStats?.synced || 0);
        setSuccessRate(data.successRate || 100);
      }
    } catch (error) {
      console.error('Error loading SATU SEHAT stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await supabase.functions.invoke('satusehat', {
        body: { action: 'bulk-sync-patients' },
      });
      await loadStats();
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="module-card flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

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
            <p className="text-xl font-bold">{todayCount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Hari ini</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              <RefreshCw className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">Sync Rate</span>
            </div>
            <p className="text-xl font-bold">{successRate}%</p>
            <p className="text-xs text-muted-foreground">Sukses</p>
          </div>
        </div>

        {/* Resources */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Resource Status</p>
          {stats.map((resource) => (
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
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sync Now
          </Button>
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <a href="/satu-sehat">View Logs</a>
          </Button>
        </div>
      </div>
    </div>
  );
}

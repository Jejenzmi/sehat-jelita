import { Shield, CheckCircle, Clock, XCircle, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function BPJSStatus() {
  return (
    <div className="module-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Status BPJS Kesehatan</h3>
          <p className="text-sm text-muted-foreground">Integrasi & Klaim Bulan Ini</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/20">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-sm font-medium">Koneksi API BPJS</span>
          </div>
          <span className="text-xs font-medium text-success">Terhubung</span>
        </div>

        {/* Claims Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-success">156</p>
            <p className="text-xs text-muted-foreground">Disetujui</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-warning">23</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-destructive">8</p>
            <p className="text-xs text-muted-foreground">Ditolak</p>
          </div>
        </div>

        {/* Monthly Target */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Target Klaim Bulanan</span>
            <span className="font-medium">Rp 2.4M / Rp 3M</span>
          </div>
          <Progress value={80} className="h-2" />
          <div className="flex items-center gap-1 text-xs text-success">
            <TrendingUp className="h-3 w-3" />
            <span>80% tercapai</span>
          </div>
        </div>

        {/* Recent Claims */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Klaim Terbaru</p>
          <div className="space-y-2">
            {[
              { id: "CLM-001", patient: "Ahmad H.", amount: "Rp 1.2jt", status: "approved" },
              { id: "CLM-002", patient: "Siti A.", amount: "Rp 850rb", status: "pending" },
              { id: "CLM-003", patient: "Budi S.", amount: "Rp 2.1jt", status: "approved" },
            ].map((claim) => (
              <div
                key={claim.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-2">
                  {claim.status === "approved" ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <Clock className="h-4 w-4 text-warning" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{claim.patient}</p>
                    <p className="text-xs text-muted-foreground">{claim.id}</p>
                  </div>
                </div>
                <span className="text-sm font-medium">{claim.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { Shield, CheckCircle, Clock, XCircle, RefreshCw, FileText, TrendingUp, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const claimsData = [
  { id: "CLM-2024-001234", patient: "Ahmad Hidayat", rm: "RM-001234", amount: 1250000, status: "approved", date: "2024-01-15" },
  { id: "CLM-2024-001235", patient: "Siti Aminah", rm: "RM-001235", amount: 850000, status: "pending", date: "2024-01-15" },
  { id: "CLM-2024-001236", patient: "Budi Santoso", rm: "RM-001236", amount: 2100000, status: "approved", date: "2024-01-14" },
  { id: "CLM-2024-001237", patient: "Dewi Lestari", rm: "RM-001237", amount: 450000, status: "rejected", date: "2024-01-14" },
  { id: "CLM-2024-001238", patient: "Rahmat Wijaya", rm: "RM-001238", amount: 1850000, status: "pending", date: "2024-01-13" },
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  approved: { label: "Disetujui", color: "bg-success/10 text-success border-success/20", icon: CheckCircle },
  pending: { label: "Pending", color: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  rejected: { label: "Ditolak", color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
};

export default function BPJS() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">BPJS Kesehatan</h1>
          <p className="text-muted-foreground">Integrasi dan manajemen klaim BPJS</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Data
          </Button>
          <Button className="gradient-primary shadow-glow">
            <FileText className="h-4 w-4 mr-2" />
            Buat Klaim
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="module-card border-success/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-success/10">
              <Shield className="h-8 w-8 text-success" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Status Koneksi BPJS</h3>
              <p className="text-sm text-muted-foreground">Terakhir sync: 5 menit yang lalu</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-base px-4 py-2">
            <CheckCircle className="h-4 w-4 mr-2" />
            Terhubung
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="module-card">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Total Klaim Bulan Ini</span>
          </div>
          <p className="text-3xl font-bold">187</p>
          <p className="text-sm text-success flex items-center gap-1 mt-1">
            <TrendingUp className="h-4 w-4" />
            +12% dari bulan lalu
          </p>
        </div>
        <div className="module-card">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-5 w-5 text-success" />
            <span className="text-sm text-muted-foreground">Disetujui</span>
          </div>
          <p className="text-3xl font-bold text-success">156</p>
          <p className="text-sm text-muted-foreground mt-1">83.4% approval rate</p>
        </div>
        <div className="module-card">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-5 w-5 text-warning" />
            <span className="text-sm text-muted-foreground">Pending</span>
          </div>
          <p className="text-3xl font-bold text-warning">23</p>
          <p className="text-sm text-muted-foreground mt-1">Menunggu verifikasi</p>
        </div>
        <div className="module-card">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="h-5 w-5 text-destructive" />
            <span className="text-sm text-muted-foreground">Ditolak</span>
          </div>
          <p className="text-3xl font-bold text-destructive">8</p>
          <p className="text-sm text-muted-foreground mt-1">Perlu revisi</p>
        </div>
      </div>

      {/* Revenue Progress */}
      <div className="module-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Target Pendapatan BPJS</h3>
            <p className="text-sm text-muted-foreground">Progress pencapaian bulanan</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">Rp 2.4M</p>
            <p className="text-sm text-muted-foreground">dari target Rp 3M</p>
          </div>
        </div>
        <Progress value={80} className="h-3" />
        <div className="flex justify-between mt-2 text-sm">
          <span className="text-success">80% tercapai</span>
          <span className="text-muted-foreground">Sisa Rp 600jt</span>
        </div>
      </div>

      {/* Claims Table */}
      <div className="module-card">
        <Tabs defaultValue="all">
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="all">Semua</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Disetujui</TabsTrigger>
              <TabsTrigger value="rejected">Ditolak</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Cari klaim..." className="pl-10 w-64" />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <TabsContent value="all">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>No. Klaim</th>
                    <th>Pasien</th>
                    <th>No. RM</th>
                    <th>Jumlah Klaim</th>
                    <th>Tanggal</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {claimsData.map((claim) => {
                    const status = statusConfig[claim.status];
                    const StatusIcon = status.icon;
                    return (
                      <tr key={claim.id}>
                        <td className="font-mono text-sm font-medium">{claim.id}</td>
                        <td>{claim.patient}</td>
                        <td className="font-mono text-xs">{claim.rm}</td>
                        <td className="font-medium">
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            minimumFractionDigits: 0,
                          }).format(claim.amount)}
                        </td>
                        <td className="text-muted-foreground">{claim.date}</td>
                        <td>
                          <Badge variant="outline" className={status.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </td>
                        <td>
                          <Button size="sm" variant="ghost">
                            Detail
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="pending">
            <p className="text-center text-muted-foreground py-8">
              Menampilkan klaim dengan status pending
            </p>
          </TabsContent>

          <TabsContent value="approved">
            <p className="text-center text-muted-foreground py-8">
              Menampilkan klaim yang disetujui
            </p>
          </TabsContent>

          <TabsContent value="rejected">
            <p className="text-center text-muted-foreground py-8">
              Menampilkan klaim yang ditolak
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

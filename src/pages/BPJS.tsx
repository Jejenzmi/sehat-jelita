import { useState } from "react";
import { Shield, CheckCircle, Clock, XCircle, RefreshCw, FileText, TrendingUp, Search, Filter, Plus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type ClaimStatus = "draft" | "submitted" | "approved" | "rejected" | "paid";

interface BPJSClaim {
  id: string;
  claim_number: string;
  sep_number: string;
  patient_id: string;
  visit_id: string;
  claim_date: string;
  claim_amount: number;
  approved_amount: number | null;
  status: ClaimStatus;
  inacbg_code: string | null;
  inacbg_description: string | null;
  rejection_reason: string | null;
  submission_date: string | null;
  verification_date: string | null;
  notes: string | null;
  patients?: {
    full_name: string;
    medical_record_number: string;
    bpjs_number: string | null;
  };
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: "Draft", color: "bg-muted/50 text-muted-foreground border-muted", icon: FileText },
  submitted: { label: "Diajukan", color: "bg-info/10 text-info border-info/20", icon: Clock },
  approved: { label: "Disetujui", color: "bg-success/10 text-success border-success/20", icon: CheckCircle },
  rejected: { label: "Ditolak", color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
  paid: { label: "Dibayar", color: "bg-success/10 text-success border-success/20", icon: CheckCircle },
};

export default function BPJS() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedClaim, setSelectedClaim] = useState<BPJSClaim | null>(null);
  const [isNewClaimOpen, setIsNewClaimOpen] = useState(false);

  // Fetch BPJS claims
  const { data: claims = [], isLoading } = useQuery({
    queryKey: ["bpjs-claims", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("bpjs_claims")
        .select(`
          *,
          patients (full_name, medical_record_number, bpjs_number)
        `)
        .order("claim_date", { ascending: false });

      if (statusFilter !== "all" && ["draft", "submitted", "verified", "approved", "rejected", "paid"].includes(statusFilter)) {
        query = query.eq("status", statusFilter as ClaimStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BPJSClaim[];
    },
  });

  // Calculate stats
  const totalClaims = claims.length;
  const approvedClaims = claims.filter(c => c.status === "approved" || c.status === "paid");
  const pendingClaims = claims.filter(c => c.status === "submitted" || c.status === "draft");
  const rejectedClaims = claims.filter(c => c.status === "rejected");

  const totalClaimAmount = claims.reduce((sum, c) => sum + c.claim_amount, 0);
  const approvedAmount = approvedClaims.reduce((sum, c) => sum + (c.approved_amount || c.claim_amount), 0);
  const approvalRate = totalClaims > 0 ? (approvedClaims.length / totalClaims * 100) : 0;

  const updateStatus = useMutation({
    mutationFn: async ({ claimId, status }: { claimId: string; status: ClaimStatus }) => {
      const updates: any = { status };
      if (status === "submitted") {
        updates.submission_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from("bpjs_claims")
        .update(updates)
        .eq("id", claimId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bpjs-claims"] });
      toast({
        title: "Status Diperbarui",
        description: "Status klaim berhasil diperbarui",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredClaims = claims.filter(c =>
    c.claim_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.sep_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.patients?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.patients?.medical_record_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

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
          <Button className="gradient-primary shadow-glow" onClick={() => setIsNewClaimOpen(true)}>
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
            <span className="text-sm text-muted-foreground">Total Klaim</span>
          </div>
          <p className="text-3xl font-bold">{totalClaims}</p>
          <p className="text-sm text-muted-foreground mt-1">{formatCurrency(totalClaimAmount)}</p>
        </div>
        <div className="module-card">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-5 w-5 text-success" />
            <span className="text-sm text-muted-foreground">Disetujui</span>
          </div>
          <p className="text-3xl font-bold text-success">{approvedClaims.length}</p>
          <p className="text-sm text-muted-foreground mt-1">{approvalRate.toFixed(1)}% approval rate</p>
        </div>
        <div className="module-card">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-5 w-5 text-warning" />
            <span className="text-sm text-muted-foreground">Pending</span>
          </div>
          <p className="text-3xl font-bold text-warning">{pendingClaims.length}</p>
          <p className="text-sm text-muted-foreground mt-1">Menunggu verifikasi</p>
        </div>
        <div className="module-card">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="h-5 w-5 text-destructive" />
            <span className="text-sm text-muted-foreground">Ditolak</span>
          </div>
          <p className="text-3xl font-bold text-destructive">{rejectedClaims.length}</p>
          <p className="text-sm text-muted-foreground mt-1">Perlu revisi</p>
        </div>
      </div>

      {/* Revenue Progress */}
      <div className="module-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Pendapatan BPJS</h3>
            <p className="text-sm text-muted-foreground">Total klaim disetujui</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{formatCurrency(approvedAmount)}</p>
            <p className="text-sm text-muted-foreground">dari {formatCurrency(totalClaimAmount)} diajukan</p>
          </div>
        </div>
        <Progress value={totalClaimAmount > 0 ? (approvedAmount / totalClaimAmount) * 100 : 0} className="h-3" />
        <div className="flex justify-between mt-2 text-sm">
          <span className="text-success">
            {totalClaimAmount > 0 ? ((approvedAmount / totalClaimAmount) * 100).toFixed(1) : 0}% disetujui
          </span>
          <span className="text-muted-foreground">
            Sisa {formatCurrency(totalClaimAmount - approvedAmount)}
          </span>
        </div>
      </div>

      {/* Claims Table */}
      <div className="module-card">
        <Tabs defaultValue="all" onValueChange={(v) => setStatusFilter(v)}>
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="all">Semua</TabsTrigger>
              <TabsTrigger value="submitted">Diajukan</TabsTrigger>
              <TabsTrigger value="approved">Disetujui</TabsTrigger>
              <TabsTrigger value="rejected">Ditolak</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Cari klaim..." 
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <TabsContent value="all" className="mt-0">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
            ) : filteredClaims.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Tidak ada data klaim BPJS</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>No. Klaim</th>
                      <th>Pasien</th>
                      <th>No. SEP</th>
                      <th>Jumlah Klaim</th>
                      <th>Tanggal</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClaims.map((claim) => {
                      const status = statusConfig[claim.status];
                      const StatusIcon = status.icon;
                      return (
                        <tr key={claim.id}>
                          <td className="font-mono text-sm font-medium">{claim.claim_number}</td>
                          <td>
                            <div>
                              <p className="font-medium">{claim.patients?.full_name}</p>
                              <p className="text-xs text-muted-foreground">{claim.patients?.medical_record_number}</p>
                            </div>
                          </td>
                          <td className="font-mono text-xs">{claim.sep_number}</td>
                          <td className="font-medium">{formatCurrency(claim.claim_amount)}</td>
                          <td className="text-muted-foreground">
                            {new Date(claim.claim_date).toLocaleDateString("id-ID")}
                          </td>
                          <td>
                            <Badge variant="outline" className={status.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                          </td>
                          <td>
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => setSelectedClaim(claim)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {claim.status === "draft" && (
                                <Button 
                                  size="sm"
                                  onClick={() => updateStatus.mutate({ claimId: claim.id, status: "submitted" })}
                                >
                                  Ajukan
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="submitted" className="mt-0">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>No. Klaim</th>
                    <th>Pasien</th>
                    <th>No. SEP</th>
                    <th>Jumlah Klaim</th>
                    <th>Tgl Ajukan</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClaims.filter(c => c.status === "submitted").map((claim) => (
                    <tr key={claim.id}>
                      <td className="font-mono text-sm font-medium">{claim.claim_number}</td>
                      <td>{claim.patients?.full_name}</td>
                      <td className="font-mono text-xs">{claim.sep_number}</td>
                      <td className="font-medium">{formatCurrency(claim.claim_amount)}</td>
                      <td>{claim.submission_date ? new Date(claim.submission_date).toLocaleDateString("id-ID") : "-"}</td>
                      <td>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedClaim(claim)}
                        >
                          Detail
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="approved" className="mt-0">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>No. Klaim</th>
                    <th>Pasien</th>
                    <th>Kode INA-CBG</th>
                    <th>Jumlah Disetujui</th>
                    <th>Tgl Verifikasi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClaims.filter(c => c.status === "approved" || c.status === "paid").map((claim) => (
                    <tr key={claim.id}>
                      <td className="font-mono text-sm font-medium">{claim.claim_number}</td>
                      <td>{claim.patients?.full_name}</td>
                      <td className="font-mono text-sm">{claim.inacbg_code || "-"}</td>
                      <td className="font-medium text-success">{formatCurrency(claim.approved_amount || claim.claim_amount)}</td>
                      <td>{claim.verification_date ? new Date(claim.verification_date).toLocaleDateString("id-ID") : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="rejected" className="mt-0">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>No. Klaim</th>
                    <th>Pasien</th>
                    <th>Jumlah Klaim</th>
                    <th>Alasan Penolakan</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClaims.filter(c => c.status === "rejected").map((claim) => (
                    <tr key={claim.id}>
                      <td className="font-mono text-sm font-medium">{claim.claim_number}</td>
                      <td>{claim.patients?.full_name}</td>
                      <td className="font-medium">{formatCurrency(claim.claim_amount)}</td>
                      <td className="text-destructive text-sm max-w-xs truncate">{claim.rejection_reason || "Tidak ada keterangan"}</td>
                      <td>
                        <Button size="sm" variant="outline">Revisi</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedClaim} onOpenChange={() => setSelectedClaim(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Klaim BPJS</DialogTitle>
            <DialogDescription>{selectedClaim?.claim_number}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Pasien</Label>
                <p className="font-medium">{selectedClaim?.patients?.full_name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">No. BPJS</Label>
                <p className="font-medium">{selectedClaim?.patients?.bpjs_number || "-"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">No. SEP</Label>
                <p className="font-mono">{selectedClaim?.sep_number}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <Badge className={statusConfig[selectedClaim?.status || "draft"].color}>
                  {statusConfig[selectedClaim?.status || "draft"].label}
                </Badge>
              </div>
              <div>
                <Label className="text-muted-foreground">Jumlah Klaim</Label>
                <p className="text-xl font-bold">{formatCurrency(selectedClaim?.claim_amount || 0)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Jumlah Disetujui</Label>
                <p className="text-xl font-bold text-success">
                  {formatCurrency(selectedClaim?.approved_amount || 0)}
                </p>
              </div>
            </div>

            {selectedClaim?.inacbg_code && (
              <div>
                <Label className="text-muted-foreground">Kode INA-CBG</Label>
                <p className="font-mono">{selectedClaim.inacbg_code}</p>
                <p className="text-sm text-muted-foreground">{selectedClaim.inacbg_description}</p>
              </div>
            )}

            {selectedClaim?.rejection_reason && (
              <div className="p-3 bg-destructive/10 rounded-lg">
                <Label className="text-destructive">Alasan Penolakan</Label>
                <p className="text-sm">{selectedClaim.rejection_reason}</p>
              </div>
            )}

            {selectedClaim?.notes && (
              <div>
                <Label className="text-muted-foreground">Catatan</Label>
                <p className="text-sm">{selectedClaim.notes}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

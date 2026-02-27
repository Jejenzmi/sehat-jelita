import { useState } from "react";
import { Shield, Building2, CheckCircle, Clock, XCircle, Search, Plus, Eye, FileText, TrendingUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/lib/db";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type ClaimStatus = "draft" | "submitted" | "verified" | "approved" | "partial" | "rejected" | "paid";
type InsuranceType = "bpjs" | "jasa_raharja" | "private" | "corporate";

interface InsuranceProvider {
  id: string;
  code: string;
  name: string;
  type: InsuranceType;
  is_active?: boolean;
}

interface InsuranceClaim {
  id: string;
  claim_number: string;
  patient_id: string;
  visit_id: string;
  patient_insurance_id: string;
  claim_date: string;
  claim_amount: number;
  approved_amount: number | null;
  paid_amount: number | null;
  patient_responsibility: number;
  status: ClaimStatus;
  priority_order: number;
  sep_number: string | null;
  inacbg_code: string | null;
  lp_number: string | null;
  accident_date: string | null;
  rejection_reason: string | null;
  notes: string | null;
  patients?: {
    full_name: string;
    medical_record_number: string;
  };
  patient_insurances?: {
    policy_number: string;
    insurance_providers?: InsuranceProvider;
  };
}

const statusConfig: Record<ClaimStatus, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: "Draft", color: "bg-muted/50 text-muted-foreground border-muted", icon: FileText },
  submitted: { label: "Diajukan", color: "bg-info/10 text-info border-info/20", icon: Clock },
  verified: { label: "Diverifikasi", color: "bg-primary/10 text-primary border-primary/20", icon: CheckCircle },
  approved: { label: "Disetujui", color: "bg-success/10 text-success border-success/20", icon: CheckCircle },
  partial: { label: "Sebagian", color: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  rejected: { label: "Ditolak", color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
  paid: { label: "Dibayar", color: "bg-success/10 text-success border-success/20", icon: CheckCircle },
};

const typeLabels: Record<InsuranceType, string> = {
  bpjs: "BPJS",
  jasa_raharja: "Jasa Raharja",
  private: "Swasta",
  corporate: "Perusahaan",
};

const typeColors: Record<InsuranceType, string> = {
  bpjs: "bg-primary/10 text-primary",
  jasa_raharja: "bg-warning/10 text-warning",
  private: "bg-medical-purple/10 text-medical-purple",
  corporate: "bg-info/10 text-info",
};

export default function Asuransi() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedClaim, setSelectedClaim] = useState<InsuranceClaim | null>(null);

  // Fetch insurance providers
  const { data: providers = [] } = useQuery({
    queryKey: ["insurance-providers"],
    queryFn: async () => {
      const { data, error } = await db
        .from("insurance_providers")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as InsuranceProvider[];
    },
  });

  // Fetch insurance claims
  const { data: claims = [], isLoading } = useQuery({
    queryKey: ["insurance-claims", statusFilter, typeFilter],
    queryFn: async () => {
      let query = db
        .from("insurance_claims")
        .select(`
          *,
          patients (full_name, medical_record_number),
          patient_insurances (
            policy_number,
            insurance_providers (id, code, name, type)
          )
        `)
        .order("claim_date", { ascending: false });

      if (statusFilter !== "all" && ["draft", "submitted", "verified", "approved", "partial", "rejected", "paid"].includes(statusFilter)) {
        query = query.eq("status", statusFilter as ClaimStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Filter by insurance type if needed
      let result = (data || []) as unknown as InsuranceClaim[];
      if (typeFilter !== "all") {
        result = result.filter(c => c.patient_insurances?.insurance_providers?.type === typeFilter);
      }
      
      return result;
    },
  });

  // Calculate stats by insurance type
  const getStatsByType = (type: InsuranceType) => {
    const typeClaims = claims.filter(c => c.patient_insurances?.insurance_providers?.type === type);
    return {
      total: typeClaims.length,
      approved: typeClaims.filter(c => c.status === "approved" || c.status === "paid").length,
      pending: typeClaims.filter(c => ["draft", "submitted", "verified"].includes(c.status)).length,
      rejected: typeClaims.filter(c => c.status === "rejected").length,
      totalAmount: typeClaims.reduce((sum, c) => sum + c.claim_amount, 0),
      approvedAmount: typeClaims
        .filter(c => c.status === "approved" || c.status === "paid")
        .reduce((sum, c) => sum + (c.approved_amount || c.claim_amount), 0),
    };
  };

  const bpjsStats = getStatsByType("bpjs");
  const jasaRaharjaStats = getStatsByType("jasa_raharja");
  const privateStats = getStatsByType("private");
  const corporateStats = getStatsByType("corporate");

  const totalClaims = claims.length;
  const totalClaimAmount = claims.reduce((sum, c) => sum + c.claim_amount, 0);
  const totalApprovedAmount = claims
    .filter(c => c.status === "approved" || c.status === "paid")
    .reduce((sum, c) => sum + (c.approved_amount || c.claim_amount), 0);

  const updateStatus = useMutation({
    mutationFn: async ({ claimId, status }: { claimId: string; status: ClaimStatus }) => {
      const updates: any = { status };
      if (status === "submitted") {
        updates.submission_date = new Date().toISOString().split("T")[0];
      } else if (status === "verified") {
        updates.verification_date = new Date().toISOString().split("T")[0];
      } else if (status === "approved") {
        updates.approval_date = new Date().toISOString().split("T")[0];
      }

      const { error } = await db
        .from("insurance_claims")
        .update(updates)
        .eq("id", claimId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insurance-claims"] });
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
    c.patients?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.patients?.medical_record_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.patient_insurances?.policy_number.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-2xl font-bold">Manajemen Asuransi</h1>
          <p className="text-muted-foreground">Kelola klaim untuk semua jenis asuransi</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Data
          </Button>
          <Button variant="outline">
            <Building2 className="h-4 w-4 mr-2" />
            Provider
          </Button>
        </div>
      </div>

      {/* Stats by Insurance Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* BPJS */}
        <div className="module-card border-l-4 border-l-primary">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold">BPJS Kesehatan</h4>
              <p className="text-xs text-muted-foreground">{bpjsStats.total} klaim</p>
            </div>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(bpjsStats.approvedAmount)}</p>
          <div className="flex gap-2 mt-2 text-xs">
            <span className="text-success">{bpjsStats.approved} disetujui</span>
            <span className="text-warning">{bpjsStats.pending} pending</span>
          </div>
        </div>

        {/* Jasa Raharja */}
        <div className="module-card border-l-4 border-l-warning">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Shield className="h-5 w-5 text-warning" />
            </div>
            <div>
              <h4 className="font-semibold">Jasa Raharja</h4>
              <p className="text-xs text-muted-foreground">{jasaRaharjaStats.total} klaim</p>
            </div>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(jasaRaharjaStats.approvedAmount)}</p>
          <div className="flex gap-2 mt-2 text-xs">
            <span className="text-success">{jasaRaharjaStats.approved} disetujui</span>
            <span className="text-warning">{jasaRaharjaStats.pending} pending</span>
          </div>
        </div>

        {/* Private Insurance */}
        <div className="module-card border-l-4 border-l-medical-purple">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-medical-purple/10">
              <Building2 className="h-5 w-5 text-medical-purple" />
            </div>
            <div>
              <h4 className="font-semibold">Asuransi Swasta</h4>
              <p className="text-xs text-muted-foreground">{privateStats.total} klaim</p>
            </div>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(privateStats.approvedAmount)}</p>
          <div className="flex gap-2 mt-2 text-xs">
            <span className="text-success">{privateStats.approved} disetujui</span>
            <span className="text-warning">{privateStats.pending} pending</span>
          </div>
        </div>

        {/* Corporate Insurance */}
        <div className="module-card border-l-4 border-l-info">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-info/10">
              <Building2 className="h-5 w-5 text-info" />
            </div>
            <div>
              <h4 className="font-semibold">Asuransi Perusahaan</h4>
              <p className="text-xs text-muted-foreground">{corporateStats.total} klaim</p>
            </div>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(corporateStats.approvedAmount)}</p>
          <div className="flex gap-2 mt-2 text-xs">
            <span className="text-success">{corporateStats.approved} disetujui</span>
            <span className="text-warning">{corporateStats.pending} pending</span>
          </div>
        </div>
      </div>

      {/* Total Revenue Progress */}
      <div className="module-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Total Pendapatan Asuransi</h3>
            <p className="text-sm text-muted-foreground">Semua jenis asuransi</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{formatCurrency(totalApprovedAmount)}</p>
            <p className="text-sm text-muted-foreground">dari {formatCurrency(totalClaimAmount)} diajukan</p>
          </div>
        </div>
        <Progress value={totalClaimAmount > 0 ? (totalApprovedAmount / totalClaimAmount) * 100 : 0} className="h-3" />
        <div className="flex justify-between mt-2 text-sm">
          <span className="text-success">
            {totalClaimAmount > 0 ? ((totalApprovedAmount / totalClaimAmount) * 100).toFixed(1) : 0}% disetujui
          </span>
          <span className="text-muted-foreground">
            Sisa {formatCurrency(totalClaimAmount - totalApprovedAmount)}
          </span>
        </div>
      </div>

      {/* Claims Table */}
      <div className="module-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Jenis Asuransi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                <SelectItem value="bpjs">BPJS</SelectItem>
                <SelectItem value="jasa_raharja">Jasa Raharja</SelectItem>
                <SelectItem value="private">Swasta</SelectItem>
                <SelectItem value="corporate">Perusahaan</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Diajukan</SelectItem>
                <SelectItem value="verified">Diverifikasi</SelectItem>
                <SelectItem value="approved">Disetujui</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
                <SelectItem value="paid">Dibayar</SelectItem>
              </SelectContent>
            </Select>
          </div>
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

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
        ) : filteredClaims.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Tidak ada data klaim asuransi</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>No. Klaim</th>
                  <th>Pasien</th>
                  <th>Asuransi</th>
                  <th>Jumlah Klaim</th>
                  <th>Disetujui</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.map((claim) => {
                  const status = statusConfig[claim.status];
                  const StatusIcon = status.icon;
                  const insuranceType = claim.patient_insurances?.insurance_providers?.type || "private";
                  
                  return (
                    <tr key={claim.id}>
                      <td className="font-mono text-sm font-medium">{claim.claim_number}</td>
                      <td>
                        <div>
                          <p className="font-medium">{claim.patients?.full_name}</p>
                          <p className="text-xs text-muted-foreground">{claim.patients?.medical_record_number}</p>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col gap-1">
                          <Badge variant="secondary" className={typeColors[insuranceType]}>
                            {typeLabels[insuranceType]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {claim.patient_insurances?.insurance_providers?.name}
                          </span>
                        </div>
                      </td>
                      <td className="font-medium">{formatCurrency(claim.claim_amount)}</td>
                      <td className="font-medium text-success">
                        {claim.approved_amount ? formatCurrency(claim.approved_amount) : "-"}
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
                          {claim.status === "submitted" && (
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus.mutate({ claimId: claim.id, status: "verified" })}
                            >
                              Verifikasi
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
      </div>

      {/* Claim Detail Dialog */}
      <Dialog open={!!selectedClaim} onOpenChange={() => setSelectedClaim(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Klaim Asuransi</DialogTitle>
            <DialogDescription>
              {selectedClaim?.claim_number}
            </DialogDescription>
          </DialogHeader>

          {selectedClaim && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Pasien</Label>
                  <p className="font-medium">{selectedClaim.patients?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedClaim.patients?.medical_record_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Asuransi</Label>
                  <p className="font-medium">{selectedClaim.patient_insurances?.insurance_providers?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    No. Polis: {selectedClaim.patient_insurances?.policy_number}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground">Jumlah Klaim</Label>
                  <p className="text-xl font-bold">{formatCurrency(selectedClaim.claim_amount)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Disetujui</Label>
                  <p className="text-xl font-bold text-success">
                    {selectedClaim.approved_amount ? formatCurrency(selectedClaim.approved_amount) : "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tanggung Pasien</Label>
                  <p className="text-xl font-bold text-warning">
                    {formatCurrency(selectedClaim.patient_responsibility)}
                  </p>
                </div>
              </div>

              {/* Special fields for BPJS */}
              {selectedClaim.sep_number && (
                <div>
                  <Label className="text-muted-foreground">No. SEP</Label>
                  <p className="font-mono">{selectedClaim.sep_number}</p>
                </div>
              )}

              {selectedClaim.inacbg_code && (
                <div>
                  <Label className="text-muted-foreground">Kode INA-CBG</Label>
                  <p className="font-mono">{selectedClaim.inacbg_code}</p>
                </div>
              )}

              {/* Special fields for Jasa Raharja */}
              {selectedClaim.lp_number && (
                <div>
                  <Label className="text-muted-foreground">No. LP Kepolisian</Label>
                  <p className="font-mono">{selectedClaim.lp_number}</p>
                </div>
              )}

              {selectedClaim.accident_date && (
                <div>
                  <Label className="text-muted-foreground">Tanggal Kecelakaan</Label>
                  <p>{new Date(selectedClaim.accident_date).toLocaleDateString("id-ID")}</p>
                </div>
              )}

              {selectedClaim.rejection_reason && (
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <Label className="text-destructive">Alasan Penolakan</Label>
                  <p className="text-sm">{selectedClaim.rejection_reason}</p>
                </div>
              )}

              {selectedClaim.notes && (
                <div>
                  <Label className="text-muted-foreground">Catatan</Label>
                  <p className="text-sm">{selectedClaim.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedClaim(null)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

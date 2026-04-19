import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Plus, Star, Calendar, Percent, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface InsuranceProvider {
  id: string;
  code: string;
  name: string;
  type: "bpjs" | "jasa_raharja" | "private" | "corporate";
}

interface PatientInsurance {
  id: string;
  patient_id: string;
  provider_id: string;
  policy_number: string;
  member_id: string | null;
  class: string | null;
  is_primary: boolean;
  valid_from: string | null;
  valid_until: string | null;
  coverage_percentage: number;
  max_coverage: number | null;
  is_active: boolean;
  insurance_providers?: InsuranceProvider;
}

const typeLabels: Record<string, string> = {
  bpjs: "BPJS",
  jasa_raharja: "Jasa Raharja",
  private: "Asuransi Swasta",
  corporate: "Asuransi Perusahaan",
};

const typeColors: Record<string, string> = {
  bpjs: "bg-primary/10 text-primary border-primary/20",
  jasa_raharja: "bg-warning/10 text-warning border-warning/20",
  private: "bg-medical-purple/10 text-medical-purple border-medical-purple/20",
  corporate: "bg-info/10 text-info border-info/20",
};

export default function PatientInsurances() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [insurances, setInsurances] = useState<PatientInsurance[]>([]);
  const [providers, setProviders] = useState<InsuranceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);

  // Form state
  const [selectedProvider, setSelectedProvider] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [memberId, setMemberId] = useState("");
  const [insuranceClass, setInsuranceClass] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [coveragePercentage, setCoveragePercentage] = useState("100");

  useEffect(() => {
    if (user) {
      fetchPatientId();
      fetchProviders();
    }
  }, [user]);

  useEffect(() => {
    if (patientId) {
      fetchInsurances();
    }
  }, [patientId]);

  const fetchPatientId = async () => {
    const { data } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", user?.id)
      .single();
    
    if (data) {
      setPatientId(data.id);
    }
  };

  const fetchProviders = async () => {
    const { data } = await supabase
      .from("insurance_providers")
      .select("*")
      .eq("is_active", true)
      .order("name");
    
    if (data) {
      setProviders(data as InsuranceProvider[]);
    }
  };

  const fetchInsurances = async () => {
    try {
      const { data, error } = await supabase
        .from("patient_insurances")
        .select(`
          *,
          insurance_providers (id, code, name, type)
        `)
        .eq("patient_id", patientId)
        .eq("is_active", true)
        .order("is_primary", { ascending: false });

      if (error) throw error;
      setInsurances(data as PatientInsurance[]);
    } catch (error) {
      console.error("Error fetching insurances:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInsurance = async () => {
    if (!patientId || !selectedProvider || !policyNumber) {
      toast({
        title: "Error",
        description: "Silakan lengkapi data asuransi",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("patient_insurances")
        .insert({
          patient_id: patientId,
          provider_id: selectedProvider,
          policy_number: policyNumber,
          member_id: memberId || null,
          class: insuranceClass || null,
          is_primary: insurances.length === 0,
          valid_from: validFrom || null,
          valid_until: validUntil || null,
          coverage_percentage: parseFloat(coveragePercentage) || 100,
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Asuransi berhasil ditambahkan",
      });

      setIsAddOpen(false);
      resetForm();
      fetchInsurances();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSetPrimary = async (insuranceId: string) => {
    try {
      // Remove primary from all
      await supabase
        .from("patient_insurances")
        .update({ is_primary: false })
        .eq("patient_id", patientId);

      // Set new primary
      await supabase
        .from("patient_insurances")
        .update({ is_primary: true })
        .eq("id", insuranceId);

      toast({
        title: "Berhasil",
        description: "Asuransi primer berhasil diubah",
      });

      fetchInsurances();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setSelectedProvider("");
    setPolicyNumber("");
    setMemberId("");
    setInsuranceClass("");
    setValidFrom("");
    setValidUntil("");
    setCoveragePercentage("100");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Asuransi Kesehatan</h3>
          <p className="text-sm text-muted-foreground">Kelola data asuransi Anda</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Asuransi
        </Button>
      </div>

      {insurances.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Belum ada data asuransi</p>
            <Button className="mt-4" onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Asuransi Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {insurances.map((insurance) => (
            <Card key={insurance.id} className={insurance.is_primary ? "border-primary" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${typeColors[insurance.insurance_providers?.type || "private"]}`}>
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {insurance.insurance_providers?.name}
                        {insurance.is_primary && (
                          <Badge variant="default" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Primer
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {typeLabels[insurance.insurance_providers?.type || "private"]}
                      </CardDescription>
                    </div>
                  </div>
                  {!insurance.is_primary && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleSetPrimary(insurance.id)}
                    >
                      Jadikan Primer
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">No. Polis</p>
                    <p className="font-medium font-mono">{insurance.policy_number}</p>
                  </div>
                  {insurance.member_id && (
                    <div>
                      <p className="text-muted-foreground">No. Anggota</p>
                      <p className="font-medium font-mono">{insurance.member_id}</p>
                    </div>
                  )}
                  {insurance.class && (
                    <div>
                      <p className="text-muted-foreground">Kelas</p>
                      <p className="font-medium">{insurance.class}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Coverage</p>
                    <p className="font-medium flex items-center gap-1">
                      <Percent className="h-3 w-3" />
                      {insurance.coverage_percentage}%
                    </p>
                  </div>
                  {insurance.valid_until && (
                    <div>
                      <p className="text-muted-foreground">Berlaku Sampai</p>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(insurance.valid_until), "d MMM yyyy", { locale: id })}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Insurance Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Asuransi</DialogTitle>
            <DialogDescription>
              Tambahkan data asuransi kesehatan Anda
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Penyedia Asuransi *</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih penyedia asuransi" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs ${typeColors[provider.type]}`}>
                          {typeLabels[provider.type]}
                        </Badge>
                        {provider.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nomor Polis / Kartu *</Label>
              <Input
                placeholder="Masukkan nomor polis"
                value={policyNumber}
                onChange={(e) => setPolicyNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Nomor Anggota (opsional)</Label>
              <Input
                placeholder="Masukkan nomor anggota"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kelas</Label>
                <Select value={insuranceClass} onValueChange={setInsuranceClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Kelas 1</SelectItem>
                    <SelectItem value="2">Kelas 2</SelectItem>
                    <SelectItem value="3">Kelas 3</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                    <SelectItem value="VVIP">VVIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Coverage (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={coveragePercentage}
                  onChange={(e) => setCoveragePercentage(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Berlaku Dari</Label>
                <Input
                  type="date"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Berlaku Sampai</Label>
                <Input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleAddInsurance}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

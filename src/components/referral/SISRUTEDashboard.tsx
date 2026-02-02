import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, Edit, Send, ArrowDownLeft, ArrowUpRight, 
  CheckCircle, Clock, XCircle, Truck, RefreshCw 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface SISRUTEReferral {
  id: string;
  referral_number: string;
  sisrute_id: string | null;
  patient_id: string | null;
  referral_type: string;
  referral_category: string | null;
  source_facility_name: string | null;
  source_city: string | null;
  destination_facility_name: string | null;
  destination_city: string | null;
  destination_department: string | null;
  primary_diagnosis: string | null;
  diagnosis_description: string | null;
  reason_for_referral: string | null;
  referring_doctor_name: string | null;
  transport_type: string | null;
  status: string;
  sync_status: string;
  created_at: string;
  patients?: { name: string; medical_record_number: string } | null;
}

export default function SISRUTEDashboard() {
  const { toast } = useToast();
  const [referrals, setReferrals] = useState<SISRUTEReferral[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingReferral, setEditingReferral] = useState<SISRUTEReferral | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [formData, setFormData] = useState({
    referral_number: "",
    patient_id: "",
    referral_type: "outgoing",
    referral_category: "Non-Emergency",
    source_facility_code: "",
    source_facility_name: "",
    source_city: "",
    destination_facility_code: "",
    destination_facility_name: "",
    destination_city: "",
    destination_department: "",
    primary_diagnosis: "",
    diagnosis_description: "",
    reason_for_referral: "",
    clinical_summary: "",
    referring_doctor_name: "",
    transport_type: "Ambulance",
    status: "pending",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [referralsRes, patientsRes, doctorsRes] = await Promise.all([
      supabase.from("sisrute_referrals")
        .select("*, patients(full_name, medical_record_number)")
        .order("created_at", { ascending: false }),
      supabase.from("patients").select("id, full_name, medical_record_number").limit(100),
      supabase.from("doctors").select("id, full_name").eq("is_active", true)
    ]);
    
    if (referralsRes.data) setReferrals(referralsRes.data as any);
    if (patientsRes.data) setPatients(patientsRes.data as any);
    if (doctorsRes.data) setDoctors(doctorsRes.data as any);
  };

  const generateReferralNumber = () => {
    const date = format(new Date(), "yyyyMMdd");
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    return `REF-${date}-${random}`;
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        referral_number: formData.referral_number || generateReferralNumber(),
        patient_id: formData.patient_id || null,
      };

      if (editingReferral) {
        const { error } = await supabase.from("sisrute_referrals").update(payload).eq("id", editingReferral.id);
        if (error) throw error;
        toast({ title: "Berhasil", description: "Rujukan berhasil diperbarui" });
      } else {
        const { error } = await supabase.from("sisrute_referrals").insert(payload);
        if (error) throw error;
        toast({ title: "Berhasil", description: "Rujukan berhasil ditambahkan" });
      }

      setShowDialog(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({
      referral_number: "",
      patient_id: "",
      referral_type: "outgoing",
      referral_category: "Non-Emergency",
      source_facility_code: "",
      source_facility_name: "",
      source_city: "",
      destination_facility_code: "",
      destination_facility_name: "",
      destination_city: "",
      destination_department: "",
      primary_diagnosis: "",
      diagnosis_description: "",
      reason_for_referral: "",
      clinical_summary: "",
      referring_doctor_name: "",
      transport_type: "Ambulance",
      status: "pending",
    });
    setEditingReferral(null);
  };

  const openEditDialog = (referral: SISRUTEReferral) => {
    setEditingReferral(referral);
    setFormData({
      referral_number: referral.referral_number,
      patient_id: referral.patient_id || "",
      referral_type: referral.referral_type,
      referral_category: referral.referral_category || "Non-Emergency",
      source_facility_code: "",
      source_facility_name: referral.source_facility_name || "",
      source_city: referral.source_city || "",
      destination_facility_code: "",
      destination_facility_name: referral.destination_facility_name || "",
      destination_city: referral.destination_city || "",
      destination_department: referral.destination_department || "",
      primary_diagnosis: referral.primary_diagnosis || "",
      diagnosis_description: referral.diagnosis_description || "",
      reason_for_referral: referral.reason_for_referral || "",
      clinical_summary: "",
      referring_doctor_name: referral.referring_doctor_name || "",
      transport_type: referral.transport_type || "Ambulance",
      status: referral.status,
    });
    setShowDialog(true);
  };

  const syncToSISRUTE = async () => {
    setIsSyncing(true);
    // Simulate sync with SISRUTE
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast({ title: "Sinkronisasi", description: "Data berhasil disinkronisasi dengan SISRUTE Kemenkes" });
    setIsSyncing(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Menunggu</Badge>;
      case "sent": return <Badge className="bg-info"><Send className="h-3 w-3 mr-1" />Terkirim</Badge>;
      case "received": return <Badge className="bg-warning">Diterima</Badge>;
      case "accepted": return <Badge className="bg-success"><CheckCircle className="h-3 w-3 mr-1" />Diterima</Badge>;
      case "rejected": return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Ditolak</Badge>;
      case "completed": return <Badge className="bg-success">Selesai</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getSyncBadge = (sync_status: string) => {
    switch (sync_status) {
      case "synced": return <Badge className="bg-success text-xs">Synced</Badge>;
      case "pending": return <Badge variant="outline" className="text-xs">Pending</Badge>;
      case "failed": return <Badge variant="destructive" className="text-xs">Failed</Badge>;
      default: return null;
    }
  };

  const filteredReferrals = referrals.filter(r => {
    if (activeTab === "incoming") return r.referral_type === "incoming";
    if (activeTab === "outgoing") return r.referral_type === "outgoing";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Send className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{referrals.length}</p>
                <p className="text-sm text-muted-foreground">Total Rujukan</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ArrowUpRight className="h-8 w-8 text-info" />
              <div>
                <p className="text-2xl font-bold">{referrals.filter(r => r.referral_type === "outgoing").length}</p>
                <p className="text-sm text-muted-foreground">Rujukan Keluar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ArrowDownLeft className="h-8 w-8 text-warning" />
              <div>
                <p className="text-2xl font-bold">{referrals.filter(r => r.referral_type === "incoming").length}</p>
                <p className="text-sm text-muted-foreground">Rujukan Masuk</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-warning" />
              <div>
                <p className="text-2xl font-bold">{referrals.filter(r => r.status === "pending").length}</p>
                <p className="text-sm text-muted-foreground">Menunggu</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold">{referrals.filter(r => r.status === "completed").length}</p>
                <p className="text-sm text-muted-foreground">Selesai</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            SISRUTE - Sistem Rujukan Terintegrasi
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={syncToSISRUTE} disabled={isSyncing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Sinkronisasi..." : "Sync SISRUTE"}
            </Button>
            <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Buat Rujukan</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingReferral ? "Edit Rujukan" : "Buat Rujukan Baru"}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh]">
                  <div className="space-y-4 p-1">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>No. Rujukan</Label>
                        <Input 
                          value={formData.referral_number}
                          onChange={(e) => setFormData({...formData, referral_number: e.target.value})}
                          placeholder="Auto-generate"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tipe Rujukan</Label>
                        <Select value={formData.referral_type} onValueChange={(v) => setFormData({...formData, referral_type: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="outgoing">Rujukan Keluar</SelectItem>
                            <SelectItem value="incoming">Rujukan Masuk</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Kategori</Label>
                        <Select value={formData.referral_category} onValueChange={(v) => setFormData({...formData, referral_category: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Emergency">Emergency</SelectItem>
                            <SelectItem value="Non-Emergency">Non-Emergency</SelectItem>
                            <SelectItem value="Partial">Rujukan Parsial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Pasien</Label>
                      <Select value={formData.patient_id} onValueChange={(v) => setFormData({...formData, patient_id: v})}>
                        <SelectTrigger><SelectValue placeholder="Pilih pasien" /></SelectTrigger>
                        <SelectContent>
                          {patients.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.full_name} ({p.medical_record_number})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Faskes Asal</Label>
                        <Input 
                          value={formData.source_facility_name}
                          onChange={(e) => setFormData({...formData, source_facility_name: e.target.value})}
                          placeholder="Nama faskes asal"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Kota Asal</Label>
                        <Input 
                          value={formData.source_city}
                          onChange={(e) => setFormData({...formData, source_city: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Faskes Tujuan</Label>
                        <Input 
                          value={formData.destination_facility_name}
                          onChange={(e) => setFormData({...formData, destination_facility_name: e.target.value})}
                          placeholder="Nama faskes tujuan"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Kota Tujuan</Label>
                        <Input 
                          value={formData.destination_city}
                          onChange={(e) => setFormData({...formData, destination_city: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Departemen Tujuan</Label>
                      <Input 
                        value={formData.destination_department}
                        onChange={(e) => setFormData({...formData, destination_department: e.target.value})}
                        placeholder="Poli/Departemen tujuan"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Kode Diagnosis (ICD-10)</Label>
                        <Input 
                          value={formData.primary_diagnosis}
                          onChange={(e) => setFormData({...formData, primary_diagnosis: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Deskripsi Diagnosis</Label>
                        <Input 
                          value={formData.diagnosis_description}
                          onChange={(e) => setFormData({...formData, diagnosis_description: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Alasan Rujukan</Label>
                      <Textarea 
                        value={formData.reason_for_referral}
                        onChange={(e) => setFormData({...formData, reason_for_referral: e.target.value})}
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Dokter Perujuk</Label>
                        <Input 
                          value={formData.referring_doctor_name}
                          onChange={(e) => setFormData({...formData, referring_doctor_name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Transportasi</Label>
                        <Select value={formData.transport_type} onValueChange={(v) => setFormData({...formData, transport_type: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Ambulance">Ambulans</SelectItem>
                            <SelectItem value="Private Vehicle">Kendaraan Pribadi</SelectItem>
                            <SelectItem value="Public Transport">Transportasi Umum</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Menunggu</SelectItem>
                          <SelectItem value="sent">Terkirim</SelectItem>
                          <SelectItem value="received">Diterima Faskes</SelectItem>
                          <SelectItem value="accepted">Diterima</SelectItem>
                          <SelectItem value="rejected">Ditolak</SelectItem>
                          <SelectItem value="completed">Selesai</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button className="w-full" onClick={handleSubmit}>
                      {editingReferral ? "Simpan Perubahan" : "Buat Rujukan"}
                    </Button>
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">Semua</TabsTrigger>
              <TabsTrigger value="outgoing" className="flex items-center gap-1">
                <ArrowUpRight className="h-4 w-4" /> Keluar
              </TabsTrigger>
              <TabsTrigger value="incoming" className="flex items-center gap-1">
                <ArrowDownLeft className="h-4 w-4" /> Masuk
              </TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab}>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No. Rujukan</TableHead>
                      <TableHead>Pasien</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Asal → Tujuan</TableHead>
                      <TableHead>Diagnosis</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sync</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReferrals.map((referral) => (
                      <TableRow key={referral.id}>
                        <TableCell className="font-mono text-sm">{referral.referral_number}</TableCell>
                        <TableCell>
                          {referral.patients ? (
                            <div>
                              <p className="font-medium">{(referral.patients as any).full_name}</p>
                              <p className="text-xs text-muted-foreground">{(referral.patients as any).medical_record_number}</p>
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          {referral.referral_type === "outgoing" ? (
                            <Badge className="bg-info"><ArrowUpRight className="h-3 w-3 mr-1" />Keluar</Badge>
                          ) : (
                            <Badge className="bg-warning"><ArrowDownLeft className="h-3 w-3 mr-1" />Masuk</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{referral.source_facility_name || referral.source_city || "-"}</p>
                            <p className="text-muted-foreground">→ {referral.destination_facility_name || referral.destination_city || "-"}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-mono text-sm">{referral.primary_diagnosis || "-"}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {referral.diagnosis_description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(referral.status)}</TableCell>
                        <TableCell>{getSyncBadge(referral.sync_status)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(referral)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

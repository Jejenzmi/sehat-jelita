import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Scan, Search, Plus, Clock, CheckCircle, XCircle, Image, Activity, Printer, Monitor, Loader2 } from "lucide-react";
import { db } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

type RadiologyTemplate = {
  id: string;
  code: string;
  name: string;
  modality: string;
  body_part: string | null;
  price: number | null;
  is_active: boolean;
};

type RadiologyResult = {
  id: string;
  radiology_number: string;
  patient_id: string;
  template_id: string;
  visit_id: string;
  status: string;
  findings: string | null;
  impression: string | null;
  recommendation: string | null;
  notes: string | null;
  request_date: string;
  exam_date: string | null;
  result_date: string | null;
  requested_by: string | null;
  performed_by: string | null;
  patients: { full_name: string; medical_record_number: string } | null;
  radiology_templates: { name: string; code: string; modality: string; body_part: string | null } | null;
  requested_doctor: { full_name: string } | null;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Menunggu</Badge>;
    case "scheduled":
      return <Badge className="bg-primary/80"><Activity className="w-3 h-3 mr-1" />Dijadwalkan</Badge>;
    case "in_progress":
      return <Badge className="bg-warning"><Scan className="w-3 h-3 mr-1" />Pemeriksaan</Badge>;
    case "completed":
      return <Badge className="bg-success"><CheckCircle className="w-3 h-3 mr-1" />Selesai</Badge>;
    case "cancelled":
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Dibatalkan</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getModalityBadge = (modality: string) => {
  const colors: Record<string, string> = {
    "X-Ray": "bg-primary/10 text-primary",
    "CT-Scan": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    "MRI": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    "USG": "bg-success/10 text-success",
    "Mammography": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    "Fluoroscopy": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  };
  return <Badge variant="outline" className={colors[modality] || ""}>{modality}</Badge>;
};

export default function Radiologi() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isInputResultOpen, setIsInputResultOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RadiologyResult | null>(null);
  const [resultInputs, setResultInputs] = useState({ findings: "", impression: "", recommendation: "" });
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({ 
    patient_id: "", 
    doctor_id: "", 
    template_id: "",
    clinical_indication: "", 
    notes: "" 
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch radiology templates
  const { data: radiologyTemplates = [], isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['radiology-templates'],
    queryFn: async () => {
      const { data, error } = await db
        .from('radiology_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return (data || []) as RadiologyTemplate[];
    }
  });

  // Fetch radiology results
  const { data: radiologyResults = [], isLoading: isLoadingResults } = useQuery({
    queryKey: ['radiology-results'],
    queryFn: async () => {
      const { data, error } = await db
        .from('radiology_results')
        .select(`
          *,
          patients (full_name, medical_record_number),
          radiology_templates (name, code, modality, body_part)
        `)
        .order('request_date', { ascending: false });
      
      if (error) throw error;
      
      // Fetch doctor names separately for requested_by
      const doctorIds = [...new Set((data || []).map(d => d.requested_by).filter(Boolean))];
      let doctorMap: Record<string, string> = {};
      if (doctorIds.length > 0) {
        const { data: doctors } = await db
          .from('doctors')
          .select('id, full_name')
          .in('id', doctorIds);
        doctorMap = (doctors || []).reduce((acc, d) => ({ ...acc, [d.id]: d.full_name }), {});
      }
      
      return (data || []).map(item => ({
        ...item,
        requested_doctor: item.requested_by && doctorMap[item.requested_by] 
          ? { full_name: doctorMap[item.requested_by] } 
          : null
      })) as RadiologyResult[];
    }
  });

  // Fetch patients for dropdown
  const { data: patients = [] } = useQuery({
    queryKey: ['patients-dropdown'],
    queryFn: async () => {
      const { data, error } = await db
        .from('patients')
        .select('id, full_name, medical_record_number')
        .eq('status', 'aktif')
        .order('full_name')
        .limit(100);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch doctors for dropdown
  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors-dropdown'],
    queryFn: async () => {
      const { data, error } = await db
        .from('doctors')
        .select('id, full_name, specialization')
        .eq('is_active', true)
        .order('full_name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch visits for patient
  const { data: visits = [] } = useQuery({
    queryKey: ['visits-for-patient', newRequest.patient_id],
    queryFn: async () => {
      if (!newRequest.patient_id) return [];
      const { data, error } = await db
        .from('visits')
        .select('id, visit_number, visit_date')
        .eq('patient_id', newRequest.patient_id)
        .eq('status', 'dilayani')
        .order('visit_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!newRequest.patient_id
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updateData: Record<string, unknown> = { status };
      
      if (status === 'in_progress') {
        updateData.exam_date = new Date().toISOString();
      }
      
      const { error } = await db
        .from('radiology_results')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radiology-results'] });
      toast({ title: "Status berhasil diperbarui" });
    },
    onError: (error) => {
      toast({ title: "Gagal memperbarui status", description: error.message, variant: "destructive" });
    }
  });

  // Save results mutation
  const saveResultsMutation = useMutation({
    mutationFn: async ({ id, findings, impression, recommendation }: { id: string; findings: string; impression: string; recommendation: string }) => {
      const { error } = await db
        .from('radiology_results')
        .update({
          findings,
          impression,
          recommendation,
          status: 'completed',
          result_date: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radiology-results'] });
      setIsInputResultOpen(false);
      setSelectedRequest(null);
      setResultInputs({ findings: "", impression: "", recommendation: "" });
      toast({ title: "Hasil pemeriksaan berhasil disimpan" });
    },
    onError: (error) => {
      toast({ title: "Gagal menyimpan hasil", description: error.message, variant: "destructive" });
    }
  });

  // Create new request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (data: { patient_id: string; doctor_id: string; template_id: string; notes: string; visit_id: string }) => {
      const radNumber = `RAD-${format(new Date(), 'yyyyMMdd')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      const { error } = await db
        .from('radiology_results')
        .insert({
          radiology_number: radNumber,
          patient_id: data.patient_id,
          visit_id: data.visit_id,
          template_id: data.template_id,
          notes: data.notes,
          requested_by: data.doctor_id,
          status: 'pending'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radiology-results'] });
      setIsNewRequestOpen(false);
      setNewRequest({ patient_id: "", doctor_id: "", template_id: "", clinical_indication: "", notes: "" });
      toast({ title: "Permintaan radiologi berhasil dibuat" });
    },
    onError: (error) => {
      toast({ title: "Gagal membuat permintaan", description: error.message, variant: "destructive" });
    }
  });

  const filteredRequests = radiologyResults.filter(req => 
    req.patients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.radiology_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.radiology_templates?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCount = radiologyResults.filter(r => r.status === "pending").length;
  const processingCount = radiologyResults.filter(r => r.status === "in_progress" || r.status === "scheduled").length;
  const completedTodayCount = radiologyResults.filter(r => 
    r.status === "completed" && 
    r.result_date && 
    format(new Date(r.result_date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  ).length;

  const handleOpenInputResult = (request: RadiologyResult) => {
    setSelectedRequest(request);
    setResultInputs({
      findings: request.findings || "",
      impression: request.impression || "",
      recommendation: request.recommendation || ""
    });
    setIsInputResultOpen(true);
  };

  const handleSaveResults = () => {
    if (!selectedRequest) return;
    saveResultsMutation.mutate({
      id: selectedRequest.id,
      ...resultInputs
    });
  };

  const selectedModality = newRequest.template_id 
    ? radiologyTemplates.find(t => t.id === newRequest.template_id)?.modality 
    : null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Radiologi</h1>
          <p className="text-muted-foreground">Manajemen pemeriksaan radiologi dan PACS</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Monitor className="w-4 h-4 mr-2" />
            PACS Viewer
          </Button>
          <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Permintaan Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Permintaan Pemeriksaan Radiologi</DialogTitle>
                <DialogDescription>Buat permintaan pemeriksaan radiologi untuk pasien</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pasien</Label>
                    <Select value={newRequest.patient_id} onValueChange={(v) => setNewRequest(prev => ({ ...prev, patient_id: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih pasien" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.full_name} - {p.medical_record_number}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Dokter Pengirim</Label>
                    <Select value={newRequest.doctor_id} onValueChange={(v) => setNewRequest(prev => ({ ...prev, doctor_id: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih dokter" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map(d => (
                          <SelectItem key={d.id} value={d.id}>{d.full_name} - {d.specialization}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Jenis Pemeriksaan</Label>
                  <Select value={newRequest.template_id} onValueChange={(v) => setNewRequest(prev => ({ ...prev, template_id: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih pemeriksaan" />
                    </SelectTrigger>
                    <SelectContent>
                      {radiologyTemplates.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} ({t.modality})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedModality && (
                    <div className="mt-2">
                      {getModalityBadge(selectedModality)}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Catatan</Label>
                  <Textarea 
                    placeholder="Catatan tambahan (indikasi klinis, alergi kontras, dll)"
                    value={newRequest.notes}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewRequestOpen(false)}>Batal</Button>
                <Button 
                  onClick={() => {
                    if (!newRequest.patient_id || !newRequest.doctor_id || !newRequest.template_id) {
                      toast({ title: "Lengkapi data", description: "Pilih pasien, dokter, dan jenis pemeriksaan", variant: "destructive" });
                      return;
                    }
                    if (visits.length === 0) {
                      toast({ title: "Tidak ada kunjungan aktif", description: "Pasien harus memiliki kunjungan aktif", variant: "destructive" });
                      return;
                    }
                    createRequestMutation.mutate({ ...newRequest, visit_id: visits[0].id });
                  }}
                  disabled={createRequestMutation.isPending}
                >
                  {createRequestMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Simpan Permintaan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Menunggu</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pemeriksaan</CardTitle>
            <Scan className="w-4 h-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Selesai Hari Ini</CardTitle>
            <CheckCircle className="w-4 h-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTodayCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pemeriksaan</CardTitle>
            <Image className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{radiologyResults.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Permintaan Radiologi</TabsTrigger>
          <TabsTrigger value="results">Hasil Pemeriksaan</TabsTrigger>
          <TabsTrigger value="templates">Template PACS</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Daftar Permintaan</CardTitle>
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input 
                    placeholder="Cari permintaan..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingResults ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No. Radiologi</TableHead>
                      <TableHead>Pasien</TableHead>
                      <TableHead>Pemeriksaan</TableHead>
                      <TableHead>Modalitas</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.radiology_number}</TableCell>
                        <TableCell>{request.patients?.full_name || '-'}</TableCell>
                        <TableCell>{request.radiology_templates?.name || '-'}</TableCell>
                        <TableCell>{request.radiology_templates?.modality ? getModalityBadge(request.radiology_templates.modality) : '-'}</TableCell>
                        <TableCell>{format(new Date(request.request_date), 'dd/MM/yyyy HH:mm')}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {request.status === "pending" && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updateStatusMutation.mutate({ id: request.id, status: 'scheduled' })}
                                disabled={updateStatusMutation.isPending}
                              >
                                Jadwalkan
                              </Button>
                            )}
                            {request.status === "scheduled" && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updateStatusMutation.mutate({ id: request.id, status: 'in_progress' })}
                                disabled={updateStatusMutation.isPending}
                              >
                                Mulai
                              </Button>
                            )}
                            {request.status === "in_progress" && (
                              <Button 
                                size="sm"
                                onClick={() => handleOpenInputResult(request)}
                              >
                                Input Hasil
                              </Button>
                            )}
                            {request.status === "completed" && (
                              <>
                                <Button size="sm" variant="outline">
                                  <Monitor className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Printer className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredRequests.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Tidak ada data permintaan radiologi
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hasil Pemeriksaan</CardTitle>
              <CardDescription>Daftar hasil pemeriksaan radiologi yang sudah selesai</CardDescription>
            </CardHeader>
            <CardContent>
              {radiologyResults.filter(r => r.status === 'completed').map((result) => (
                <Card key={result.id} className="mb-4">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{result.patients?.full_name}</CardTitle>
                        <CardDescription>
                          {result.radiology_number} • {result.radiology_templates?.name} • {result.result_date ? format(new Date(result.result_date), 'dd/MM/yyyy HH:mm') : '-'}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Monitor className="w-4 h-4 mr-2" />
                          Lihat Gambar
                        </Button>
                        <Button variant="outline" size="sm">
                          <Printer className="w-4 h-4 mr-2" />
                          Cetak
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2 space-y-4">
                        <div>
                          <Label className="text-sm font-semibold">Findings</Label>
                          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{result.findings || '-'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-semibold">Impression</Label>
                          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{result.impression || '-'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-semibold">Recommendation</Label>
                          <p className="text-sm text-muted-foreground mt-1">{result.recommendation || '-'}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Preview</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="aspect-square bg-muted rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted/80">
                              <Image className="w-8 h-8 text-muted-foreground" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {radiologyResults.filter(r => r.status === 'completed').length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada hasil pemeriksaan
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Template PACS</CardTitle>
                  <CardDescription>Kelola template pemeriksaan radiologi</CardDescription>
                </div>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingTemplates ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode</TableHead>
                      <TableHead>Nama Pemeriksaan</TableHead>
                      <TableHead>Modalitas</TableHead>
                      <TableHead>Bagian Tubuh</TableHead>
                      <TableHead>Tarif</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {radiologyTemplates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.code}</TableCell>
                        <TableCell>{template.name}</TableCell>
                        <TableCell>{getModalityBadge(template.modality)}</TableCell>
                        <TableCell>{template.body_part || '-'}</TableCell>
                        <TableCell>Rp {(template.price || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {radiologyTemplates.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Tidak ada template pemeriksaan
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Input Result Dialog */}
      <Dialog open={isInputResultOpen} onOpenChange={setIsInputResultOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Input Hasil Pemeriksaan Radiologi</DialogTitle>
            <DialogDescription>
              {selectedRequest?.patients?.full_name} - {selectedRequest?.radiology_templates?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Findings</Label>
              <Textarea 
                placeholder="Deskripsi temuan radiologi..."
                className="min-h-[100px]"
                value={resultInputs.findings}
                onChange={(e) => setResultInputs(prev => ({ ...prev, findings: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Impression</Label>
              <Textarea 
                placeholder="Kesan/kesimpulan..."
                className="min-h-[80px]"
                value={resultInputs.impression}
                onChange={(e) => setResultInputs(prev => ({ ...prev, impression: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Recommendation</Label>
              <Textarea 
                placeholder="Saran tindak lanjut..."
                value={resultInputs.recommendation}
                onChange={(e) => setResultInputs(prev => ({ ...prev, recommendation: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInputResultOpen(false)}>Batal</Button>
            <Button onClick={handleSaveResults} disabled={saveResultsMutation.isPending}>
              {saveResultsMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Simpan Hasil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

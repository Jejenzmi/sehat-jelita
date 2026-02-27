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
import { FlaskConical, Search, Plus, Clock, CheckCircle, XCircle, Beaker, Activity, Printer, Loader2 } from "lucide-react";
import { db } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

type LabResult = {
  id: string;
  lab_number: string;
  patient_id: string;
  template_id: string;
  visit_id: string;
  status: string;
  results: Record<string, string>;
  notes: string | null;
  request_date: string;
  sample_date: string | null;
  result_date: string | null;
  requested_by: string | null;
  processed_by: string | null;
  patients: { full_name: string; medical_record_number: string } | null;
  lab_templates: { name: string; code: string; parameters: string[]; normal_values: Record<string, string> | null; price: number | null } | null;
  requested_doctor: { full_name: string } | null;
};

type LabTemplate = {
  id: string;
  code: string;
  name: string;
  category: string | null;
  parameters: string[];
  normal_values: Record<string, string> | null;
  price: number | null;
  is_active: boolean;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Menunggu</Badge>;
    case "sample_taken":
      return <Badge className="bg-primary/80"><Beaker className="w-3 h-3 mr-1" />Sampel Diambil</Badge>;
    case "processing":
      return <Badge className="bg-warning"><Activity className="w-3 h-3 mr-1" />Diproses</Badge>;
    case "completed":
      return <Badge className="bg-success"><CheckCircle className="w-3 h-3 mr-1" />Selesai</Badge>;
    case "cancelled":
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Dibatalkan</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function Laboratorium() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isInputResultOpen, setIsInputResultOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LabResult | null>(null);
  const [resultInputs, setResultInputs] = useState<Record<string, string>>({});
  const [resultNotes, setResultNotes] = useState("");
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({ patient_id: "", doctor_id: "", template_ids: [] as string[], notes: "" });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch lab results
  const { data: labResults = [], isLoading: isLoadingResults } = useQuery({
    queryKey: ['lab-results'],
    queryFn: async () => {
      const { data, error } = await db
        .from('lab_results')
        .select(`
          *,
          patients (full_name, medical_record_number),
          lab_templates (name, code, parameters, normal_values, price)
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
        results: (item.results as Record<string, string>) || {},
        lab_templates: item.lab_templates ? {
          ...item.lab_templates,
          parameters: Array.isArray(item.lab_templates.parameters) ? item.lab_templates.parameters : [],
          normal_values: (item.lab_templates.normal_values as Record<string, string>) || null
        } : null,
        requested_doctor: item.requested_by && doctorMap[item.requested_by] 
          ? { full_name: doctorMap[item.requested_by] } 
          : null
      })) as LabResult[];
    }
  });

  // Fetch lab templates
  const { data: labTemplates = [], isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['lab-templates'],
    queryFn: async () => {
      const { data, error } = await db
        .from('lab_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        parameters: Array.isArray(item.parameters) ? item.parameters : [],
        normal_values: (item.normal_values as Record<string, string>) || null
      })) as LabTemplate[];
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
    mutationFn: async ({ id, status, additionalData }: { id: string; status: string; additionalData?: Record<string, unknown> }) => {
      const updateData: Record<string, unknown> = { status, ...additionalData };
      
      if (status === 'sample_taken') {
        updateData.sample_date = new Date().toISOString();
      }
      
      const { error } = await db
        .from('lab_results')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-results'] });
      toast({ title: "Status berhasil diperbarui" });
    },
    onError: (error) => {
      toast({ title: "Gagal memperbarui status", description: error.message, variant: "destructive" });
    }
  });

  // Save results mutation
  const saveResultsMutation = useMutation({
    mutationFn: async ({ id, results, notes }: { id: string; results: Record<string, string>; notes: string }) => {
      const { error } = await db
        .from('lab_results')
        .update({
          results,
          notes,
          status: 'completed',
          result_date: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-results'] });
      setIsInputResultOpen(false);
      setSelectedRequest(null);
      setResultInputs({});
      setResultNotes("");
      toast({ title: "Hasil pemeriksaan berhasil disimpan" });
    },
    onError: (error) => {
      toast({ title: "Gagal menyimpan hasil", description: error.message, variant: "destructive" });
    }
  });

  // Create new request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (data: { patient_id: string; doctor_id: string; template_ids: string[]; notes: string; visit_id: string }) => {
      const requests = data.template_ids.map(async (template_id) => {
        // Generate lab number
        const labNumber = `LAB-${format(new Date(), 'yyyyMMdd')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        
        const { error } = await db
          .from('lab_results')
          .insert({
            lab_number: labNumber,
            patient_id: data.patient_id,
            template_id: template_id,
            visit_id: data.visit_id,
            requested_by: data.doctor_id,
            notes: data.notes,
            status: 'pending',
            results: {}
          });
        
        if (error) throw error;
      });
      
      await Promise.all(requests);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-results'] });
      setIsNewRequestOpen(false);
      setNewRequest({ patient_id: "", doctor_id: "", template_ids: [], notes: "" });
      toast({ title: "Permintaan lab berhasil dibuat" });
    },
    onError: (error) => {
      toast({ title: "Gagal membuat permintaan", description: error.message, variant: "destructive" });
    }
  });

  const filteredRequests = labResults.filter(req => 
    req.patients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.lab_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.lab_templates?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCount = labResults.filter(r => r.status === "pending").length;
  const processingCount = labResults.filter(r => r.status === "processing" || r.status === "sample_taken").length;
  const completedTodayCount = labResults.filter(r => 
    r.status === "completed" && 
    r.result_date && 
    format(new Date(r.result_date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  ).length;

  const handleOpenInputResult = (request: LabResult) => {
    setSelectedRequest(request);
    setResultInputs(request.results || {});
    setResultNotes(request.notes || "");
    setIsInputResultOpen(true);
  };

  const handleSaveResults = () => {
    if (!selectedRequest) return;
    saveResultsMutation.mutate({
      id: selectedRequest.id,
      results: resultInputs,
      notes: resultNotes
    });
  };

  const handleToggleTemplate = (templateId: string) => {
    setNewRequest(prev => ({
      ...prev,
      template_ids: prev.template_ids.includes(templateId)
        ? prev.template_ids.filter(id => id !== templateId)
        : [...prev.template_ids, templateId]
    }));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Laboratorium</h1>
          <p className="text-muted-foreground">Manajemen pemeriksaan dan hasil laboratorium</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Permintaan Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Permintaan Pemeriksaan Lab Baru</DialogTitle>
                <DialogDescription>Buat permintaan pemeriksaan laboratorium untuk pasien</DialogDescription>
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
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                    {labTemplates.map(template => (
                      <label key={template.id} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-muted rounded">
                        <input 
                          type="checkbox" 
                          className="rounded border-input"
                          checked={newRequest.template_ids.includes(template.id)}
                          onChange={() => handleToggleTemplate(template.id)}
                        />
                        <span className="text-sm">{template.name}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          Rp {(template.price || 0).toLocaleString()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Catatan</Label>
                  <Textarea 
                    placeholder="Catatan tambahan untuk pemeriksaan..."
                    value={newRequest.notes}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewRequestOpen(false)}>Batal</Button>
                <Button 
                  onClick={() => {
                    if (!newRequest.patient_id || !newRequest.doctor_id || newRequest.template_ids.length === 0) {
                      toast({ title: "Lengkapi data", description: "Pilih pasien, dokter, dan minimal satu pemeriksaan", variant: "destructive" });
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
            <CardTitle className="text-sm font-medium">Dalam Proses</CardTitle>
            <Activity className="w-4 h-4 text-warning" />
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
            <FlaskConical className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{labResults.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Permintaan Lab</TabsTrigger>
          <TabsTrigger value="results">Hasil Lab</TabsTrigger>
          <TabsTrigger value="templates">Template Pemeriksaan</TabsTrigger>
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
                      <TableHead>No. Lab</TableHead>
                      <TableHead>Pasien</TableHead>
                      <TableHead>Jenis Pemeriksaan</TableHead>
                      <TableHead>Tanggal Request</TableHead>
                      <TableHead>Dokter</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.lab_number}</TableCell>
                        <TableCell>{request.patients?.full_name || '-'}</TableCell>
                        <TableCell>{request.lab_templates?.name || '-'}</TableCell>
                        <TableCell>{format(new Date(request.request_date), 'dd/MM/yyyy HH:mm')}</TableCell>
                        <TableCell>{request.requested_doctor?.full_name || '-'}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {request.status === "pending" && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updateStatusMutation.mutate({ id: request.id, status: 'sample_taken' })}
                                disabled={updateStatusMutation.isPending}
                              >
                                Ambil Sampel
                              </Button>
                            )}
                            {request.status === "sample_taken" && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updateStatusMutation.mutate({ id: request.id, status: 'processing' })}
                                disabled={updateStatusMutation.isPending}
                              >
                                Proses
                              </Button>
                            )}
                            {request.status === "processing" && (
                              <Button 
                                size="sm"
                                onClick={() => handleOpenInputResult(request)}
                              >
                                Input Hasil
                              </Button>
                            )}
                            {request.status === "completed" && (
                              <Button size="sm" variant="outline">
                                <Printer className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredRequests.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Tidak ada data permintaan lab
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
              <CardDescription>Daftar hasil pemeriksaan laboratorium yang sudah selesai</CardDescription>
            </CardHeader>
            <CardContent>
              {labResults.filter(r => r.status === 'completed').map((result) => (
                <Card key={result.id} className="mb-4">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{result.patients?.full_name}</CardTitle>
                        <CardDescription>
                          {result.lab_number} • {result.lab_templates?.name} • {result.result_date ? format(new Date(result.result_date), 'dd/MM/yyyy HH:mm') : '-'}
                        </CardDescription>
                      </div>
                      <Button variant="outline" size="sm">
                        <Printer className="w-4 h-4 mr-2" />
                        Cetak
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Parameter</TableHead>
                          <TableHead>Hasil</TableHead>
                          <TableHead>Nilai Normal</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.lab_templates?.parameters.map((param) => {
                          const value = result.results?.[param] || '-';
                          const normalValue = result.lab_templates?.normal_values?.[param] || '-';
                          return (
                            <TableRow key={param}>
                              <TableCell className="font-medium">{param}</TableCell>
                              <TableCell>{value}</TableCell>
                              <TableCell className="text-muted-foreground">{normalValue}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-success/10 text-success">Normal</Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    {result.notes && (
                      <div className="mt-4 p-3 bg-muted rounded-md">
                        <Label className="text-sm font-medium">Catatan:</Label>
                        <p className="text-sm text-muted-foreground">{result.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {labResults.filter(r => r.status === 'completed').length === 0 && (
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
                  <CardTitle>Template Pemeriksaan</CardTitle>
                  <CardDescription>Kelola template dan parameter pemeriksaan laboratorium</CardDescription>
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
                      <TableHead>Kategori</TableHead>
                      <TableHead>Parameter</TableHead>
                      <TableHead>Tarif</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {labTemplates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.code}</TableCell>
                        <TableCell>{template.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{template.category || '-'}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {template.parameters.slice(0, 3).map((param, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">{param}</Badge>
                            ))}
                            {template.parameters.length > 3 && (
                              <Badge variant="secondary" className="text-xs">+{template.parameters.length - 3}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>Rp {(template.price || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {labTemplates.length === 0 && (
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Input Hasil Pemeriksaan</DialogTitle>
            <DialogDescription>
              {selectedRequest?.patients?.full_name} - {selectedRequest?.lab_templates?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedRequest?.lab_templates?.parameters.map((param, idx) => (
              <div key={idx} className="grid grid-cols-3 gap-4 items-center">
                <Label>{param}</Label>
                <Input 
                  placeholder="Hasil" 
                  value={resultInputs[param] || ''}
                  onChange={(e) => setResultInputs(prev => ({ ...prev, [param]: e.target.value }))}
                />
                <span className="text-sm text-muted-foreground">
                  Nilai normal: {selectedRequest?.lab_templates?.normal_values?.[param] || '-'}
                </span>
              </div>
            ))}
            <div className="space-y-2">
              <Label>Catatan</Label>
              <Textarea 
                placeholder="Catatan hasil pemeriksaan..."
                value={resultNotes}
                onChange={(e) => setResultNotes(e.target.value)}
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

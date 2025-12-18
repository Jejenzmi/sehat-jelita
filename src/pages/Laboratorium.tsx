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
import { FlaskConical, Search, Plus, FileText, Clock, CheckCircle, XCircle, Beaker, Activity, Printer } from "lucide-react";

// Sample data
const labRequests = [
  { id: "LAB-2024-001", patient: "Ahmad Sulaiman", test: "Darah Lengkap", requestDate: "2024-01-15 08:30", status: "pending", doctor: "Dr. Budi Santoso" },
  { id: "LAB-2024-002", patient: "Siti Rahmah", test: "Gula Darah Puasa", requestDate: "2024-01-15 09:00", status: "sample_taken", doctor: "Dr. Ani Wijaya" },
  { id: "LAB-2024-003", patient: "Bambang Hermanto", test: "Profil Lipid", requestDate: "2024-01-15 09:30", status: "processing", doctor: "Dr. Budi Santoso" },
  { id: "LAB-2024-004", patient: "Dewi Lestari", test: "Fungsi Hati", requestDate: "2024-01-15 10:00", status: "completed", doctor: "Dr. Ani Wijaya" },
];

const labTemplates = [
  { id: 1, code: "DL", name: "Darah Lengkap", category: "Hematologi", parameters: ["Hemoglobin", "Leukosit", "Trombosit", "Hematokrit", "Eritrosit"], price: 85000 },
  { id: 2, code: "GDP", name: "Gula Darah Puasa", category: "Kimia Klinik", parameters: ["Glukosa"], price: 35000 },
  { id: 3, code: "PL", name: "Profil Lipid", category: "Kimia Klinik", parameters: ["Kolesterol Total", "HDL", "LDL", "Trigliserida"], price: 150000 },
  { id: 4, code: "FH", name: "Fungsi Hati", category: "Kimia Klinik", parameters: ["SGOT", "SGPT", "Bilirubin Total", "Albumin"], price: 180000 },
  { id: 5, code: "FG", name: "Fungsi Ginjal", category: "Kimia Klinik", parameters: ["Ureum", "Kreatinin", "Asam Urat"], price: 120000 },
  { id: 6, code: "UA", name: "Urinalisis", category: "Urinalisis", parameters: ["pH", "Protein", "Glukosa", "Leukosit", "Eritrosit"], price: 45000 },
];

const completedResults = [
  { 
    id: "LAB-2024-004", 
    patient: "Dewi Lestari", 
    test: "Fungsi Hati", 
    resultDate: "2024-01-15 14:00",
    results: { SGOT: "28 U/L", SGPT: "32 U/L", "Bilirubin Total": "0.8 mg/dL", Albumin: "4.2 g/dL" },
    normalValues: { SGOT: "10-40 U/L", SGPT: "10-40 U/L", "Bilirubin Total": "0.1-1.2 mg/dL", Albumin: "3.5-5.0 g/dL" }
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Menunggu</Badge>;
    case "sample_taken":
      return <Badge className="bg-blue-500"><Beaker className="w-3 h-3 mr-1" />Sampel Diambil</Badge>;
    case "processing":
      return <Badge className="bg-yellow-500"><Activity className="w-3 h-3 mr-1" />Diproses</Badge>;
    case "completed":
      return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Selesai</Badge>;
    case "cancelled":
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Dibatalkan</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function Laboratorium() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTest, setSelectedTest] = useState<typeof labTemplates[0] | null>(null);
  const [isInputResultOpen, setIsInputResultOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<typeof labRequests[0] | null>(null);

  const filteredRequests = labRequests.filter(req => 
    req.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.test.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Laboratorium</h1>
          <p className="text-muted-foreground">Manajemen pemeriksaan dan hasil laboratorium</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
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
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih pasien" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="p1">Ahmad Sulaiman - RM-2024-000001</SelectItem>
                        <SelectItem value="p2">Siti Rahmah - RM-2024-000002</SelectItem>
                        <SelectItem value="p3">Bambang Hermanto - RM-2024-000003</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Dokter Pengirim</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih dokter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="d1">Dr. Budi Santoso</SelectItem>
                        <SelectItem value="d2">Dr. Ani Wijaya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Jenis Pemeriksaan</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                    {labTemplates.map(template => (
                      <label key={template.id} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-muted rounded">
                        <input type="checkbox" className="rounded border-input" />
                        <span className="text-sm">{template.name}</span>
                        <span className="text-xs text-muted-foreground ml-auto">Rp {template.price.toLocaleString()}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Catatan</Label>
                  <Textarea placeholder="Catatan tambahan untuk pemeriksaan..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline">Batal</Button>
                <Button>Simpan Permintaan</Button>
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
            <div className="text-2xl font-bold">{labRequests.filter(r => r.status === "pending").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Dalam Proses</CardTitle>
            <Activity className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{labRequests.filter(r => r.status === "processing" || r.status === "sample_taken").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Selesai Hari Ini</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{labRequests.filter(r => r.status === "completed").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pemeriksaan</CardTitle>
            <FlaskConical className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{labRequests.length}</div>
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
                      <TableCell className="font-medium">{request.id}</TableCell>
                      <TableCell>{request.patient}</TableCell>
                      <TableCell>{request.test}</TableCell>
                      <TableCell>{request.requestDate}</TableCell>
                      <TableCell>{request.doctor}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {request.status === "pending" && (
                            <Button size="sm" variant="outline">Ambil Sampel</Button>
                          )}
                          {request.status === "sample_taken" && (
                            <Button size="sm" variant="outline">Proses</Button>
                          )}
                          {request.status === "processing" && (
                            <Button 
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setIsInputResultOpen(true);
                              }}
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
                </TableBody>
              </Table>
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
              {completedResults.map((result) => (
                <Card key={result.id} className="mb-4">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{result.patient}</CardTitle>
                        <CardDescription>{result.id} • {result.test} • {result.resultDate}</CardDescription>
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
                        {Object.entries(result.results).map(([param, value]) => {
                          const normalValue = result.normalValues[param as keyof typeof result.normalValues];
                          return (
                            <TableRow key={param}>
                              <TableCell className="font-medium">{param}</TableCell>
                              <TableCell>{value}</TableCell>
                              <TableCell className="text-muted-foreground">{normalValue}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-green-50 text-green-700">Normal</Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
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
                        <Badge variant="outline">{template.category}</Badge>
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
                      <TableCell>Rp {template.price.toLocaleString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
              {selectedRequest?.patient} - {selectedRequest?.test}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedRequest && labTemplates.find(t => t.name === selectedRequest.test)?.parameters.map((param, idx) => (
              <div key={idx} className="grid grid-cols-3 gap-4 items-center">
                <Label>{param}</Label>
                <Input placeholder="Hasil" />
                <span className="text-sm text-muted-foreground">Nilai normal: -</span>
              </div>
            ))}
            <div className="space-y-2">
              <Label>Catatan</Label>
              <Textarea placeholder="Catatan hasil pemeriksaan..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInputResultOpen(false)}>Batal</Button>
            <Button onClick={() => setIsInputResultOpen(false)}>Simpan Hasil</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

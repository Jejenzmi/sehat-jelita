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
import { Scan, Search, Plus, FileText, Clock, CheckCircle, XCircle, Image, Activity, Printer, Monitor, Upload } from "lucide-react";

// Sample data
const radiologyRequests = [
  { id: "RAD-2024-001", patient: "Ahmad Sulaiman", exam: "X-Ray Thorax PA", modality: "X-Ray", requestDate: "2024-01-15 08:30", status: "pending", doctor: "Dr. Budi Santoso" },
  { id: "RAD-2024-002", patient: "Siti Rahmah", exam: "CT-Scan Kepala", modality: "CT-Scan", requestDate: "2024-01-15 09:00", status: "scheduled", doctor: "Dr. Ani Wijaya" },
  { id: "RAD-2024-003", patient: "Bambang Hermanto", exam: "USG Abdomen", modality: "USG", requestDate: "2024-01-15 09:30", status: "in_progress", doctor: "Dr. Budi Santoso" },
  { id: "RAD-2024-004", patient: "Dewi Lestari", exam: "MRI Lumbal", modality: "MRI", requestDate: "2024-01-15 10:00", status: "completed", doctor: "Dr. Ani Wijaya" },
];

const radiologyTemplates = [
  { id: 1, code: "XR-TH", name: "X-Ray Thorax PA/Lateral", modality: "X-Ray", bodyPart: "Thorax", price: 150000 },
  { id: 2, code: "CT-HEAD", name: "CT-Scan Kepala Tanpa Kontras", modality: "CT-Scan", bodyPart: "Kepala", price: 1500000 },
  { id: 3, code: "CT-HEAD-C", name: "CT-Scan Kepala Dengan Kontras", modality: "CT-Scan", bodyPart: "Kepala", price: 2000000 },
  { id: 4, code: "USG-ABD", name: "USG Abdomen Lengkap", modality: "USG", bodyPart: "Abdomen", price: 350000 },
  { id: 5, code: "MRI-LUM", name: "MRI Lumbal", modality: "MRI", bodyPart: "Lumbal", price: 3500000 },
  { id: 6, code: "MRI-BRAIN", name: "MRI Brain", modality: "MRI", bodyPart: "Kepala", price: 4000000 },
  { id: 7, code: "MMG", name: "Mammography Bilateral", modality: "Mammography", bodyPart: "Mammae", price: 500000 },
];

const completedResults = [
  { 
    id: "RAD-2024-004", 
    patient: "Dewi Lestari", 
    exam: "MRI Lumbal", 
    resultDate: "2024-01-15 14:00",
    findings: "Tampak bulging disc pada level L4-L5 dengan penekanan ringan pada thecal sac. Tidak tampak herniasi diskus. Vertebrae lumbal dalam batas normal. Tidak tampak fraktur atau destruksi tulang.",
    impression: "1. Bulging disc L4-L5\n2. Tidak tampak HNP",
    recommendation: "Disarankan fisioterapi dan evaluasi klinis lebih lanjut."
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Menunggu</Badge>;
    case "scheduled":
      return <Badge className="bg-blue-500"><Activity className="w-3 h-3 mr-1" />Dijadwalkan</Badge>;
    case "in_progress":
      return <Badge className="bg-yellow-500"><Scan className="w-3 h-3 mr-1" />Pemeriksaan</Badge>;
    case "completed":
      return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Selesai</Badge>;
    case "cancelled":
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Dibatalkan</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getModalityBadge = (modality: string) => {
  const colors: Record<string, string> = {
    "X-Ray": "bg-blue-100 text-blue-800",
    "CT-Scan": "bg-purple-100 text-purple-800",
    "MRI": "bg-pink-100 text-pink-800",
    "USG": "bg-green-100 text-green-800",
    "Mammography": "bg-orange-100 text-orange-800",
    "Fluoroscopy": "bg-cyan-100 text-cyan-800",
  };
  return <Badge variant="outline" className={colors[modality] || ""}>{modality}</Badge>;
};

export default function Radiologi() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isInputResultOpen, setIsInputResultOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<typeof radiologyRequests[0] | null>(null);

  const filteredRequests = radiologyRequests.filter(req => 
    req.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.exam.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <Dialog>
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
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih pasien" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="p1">Ahmad Sulaiman - RM-2024-000001</SelectItem>
                        <SelectItem value="p2">Siti Rahmah - RM-2024-000002</SelectItem>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Modalitas</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih modalitas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="xray">X-Ray</SelectItem>
                        <SelectItem value="ct">CT-Scan</SelectItem>
                        <SelectItem value="mri">MRI</SelectItem>
                        <SelectItem value="usg">USG</SelectItem>
                        <SelectItem value="mmg">Mammography</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Jenis Pemeriksaan</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih pemeriksaan" />
                      </SelectTrigger>
                      <SelectContent>
                        {radiologyTemplates.map(t => (
                          <SelectItem key={t.id} value={t.code}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Indikasi Klinis</Label>
                  <Textarea placeholder="Masukkan indikasi klinis pemeriksaan..." />
                </div>
                <div className="space-y-2">
                  <Label>Catatan</Label>
                  <Input placeholder="Catatan tambahan (alergi kontras, dll)" />
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
            <div className="text-2xl font-bold">{radiologyRequests.filter(r => r.status === "pending").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pemeriksaan</CardTitle>
            <Scan className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{radiologyRequests.filter(r => r.status === "in_progress" || r.status === "scheduled").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Selesai Hari Ini</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{radiologyRequests.filter(r => r.status === "completed").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pemeriksaan</CardTitle>
            <Image className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{radiologyRequests.length}</div>
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
                      <TableCell className="font-medium">{request.id}</TableCell>
                      <TableCell>{request.patient}</TableCell>
                      <TableCell>{request.exam}</TableCell>
                      <TableCell>{getModalityBadge(request.modality)}</TableCell>
                      <TableCell>{request.requestDate}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {request.status === "pending" && (
                            <Button size="sm" variant="outline">Jadwalkan</Button>
                          )}
                          {request.status === "scheduled" && (
                            <Button size="sm" variant="outline">Mulai</Button>
                          )}
                          {request.status === "in_progress" && (
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
                </TableBody>
              </Table>
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
              {completedResults.map((result) => (
                <Card key={result.id} className="mb-4">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{result.patient}</CardTitle>
                        <CardDescription>{result.id} • {result.exam} • {result.resultDate}</CardDescription>
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
                          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{result.findings}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-semibold">Impression</Label>
                          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{result.impression}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-semibold">Recommendation</Label>
                          <p className="text-sm text-muted-foreground mt-1">{result.recommendation}</p>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama Pemeriksaan</TableHead>
                    <TableHead>Modalitas</TableHead>
                    <TableHead>Body Part</TableHead>
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
                      <TableCell>{template.bodyPart}</TableCell>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Input Hasil Radiologi</DialogTitle>
            <DialogDescription>
              {selectedRequest?.patient} - {selectedRequest?.exam}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Radiografer</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih radiografer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="r1">Radiografer A</SelectItem>
                    <SelectItem value="r2">Radiografer B</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dokter Radiologi</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih dokter radiologi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dr1">dr. Radiologi A, Sp.Rad</SelectItem>
                    <SelectItem value="dr2">dr. Radiologi B, Sp.Rad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Upload Gambar</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Drag and drop atau klik untuk upload</p>
                <Button variant="outline" className="mt-2">Pilih File</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Findings (Deskripsi)</Label>
              <Textarea placeholder="Tuliskan temuan radiologi..." rows={4} />
            </div>
            <div className="space-y-2">
              <Label>Impression (Kesan)</Label>
              <Textarea placeholder="Tuliskan kesan/diagnosis radiologi..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Recommendation (Saran)</Label>
              <Textarea placeholder="Saran tindak lanjut..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kontras</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Apakah menggunakan kontras?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">Tidak</SelectItem>
                    <SelectItem value="yes">Ya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dosis Radiasi</Label>
                <Input placeholder="cth: 2.5 mGy" />
              </div>
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

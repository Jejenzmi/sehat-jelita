import { useState } from "react";
import { 
  FileText, Search, Filter, Plus, User, Calendar, Stethoscope,
  Heart, Activity, Thermometer, Eye, Edit, ChevronRight, History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Sample ICD-10 codes
const icd10Codes = [
  { code: "J06.9", description: "Infeksi saluran pernapasan atas akut" },
  { code: "K29.7", description: "Gastritis, tidak spesifik" },
  { code: "I10", description: "Hipertensi esensial (primer)" },
  { code: "E11.9", description: "Diabetes mellitus tipe 2 tanpa komplikasi" },
  { code: "M54.5", description: "Nyeri punggung bawah" },
  { code: "J18.9", description: "Pneumonia, tidak spesifik" },
  { code: "A09", description: "Diare dan gastroenteritis" },
  { code: "N39.0", description: "Infeksi saluran kemih" },
];

const patientRecords = [
  {
    id: "RM-2024-001234",
    patient: { name: "Ahmad Hidayat", gender: "L", age: 45, birthDate: "1979-05-15" },
    visitDate: "2024-01-15",
    doctor: "dr. Sari Dewi, Sp.PD",
    department: "Poli Penyakit Dalam",
    diagnosis: [
      { code: "I10", description: "Hipertensi esensial", type: "primer" },
      { code: "E11.9", description: "DM Tipe 2", type: "sekunder" },
    ],
    vitals: { bp: "150/90", hr: 82, rr: 18, temp: 36.5, weight: 75, height: 170 },
    soap: {
      subjective: "Pasien mengeluh pusing dan nyeri kepala bagian belakang sejak 3 hari yang lalu. Riwayat hipertensi (+), DM (+). Minum obat rutin.",
      objective: "KU: Tampak sakit ringan. Kesadaran: CM. TD: 150/90 mmHg. Nadi: 82x/mnt. RR: 18x/mnt. Suhu: 36.5°C. Kepala: Normocephal. Thorax: Cor S1S2 reg, Pulmo vesikuler +/+.",
      assessment: "Hipertensi grade I dengan DM tipe 2 terkontrol",
      plan: "1. Amlodipine 10mg 1x1\n2. Metformin 500mg 2x1\n3. Edukasi diet rendah garam\n4. Kontrol 2 minggu",
    },
  },
  {
    id: "RM-2024-001235",
    patient: { name: "Siti Aminah", gender: "P", age: 32, birthDate: "1992-08-20" },
    visitDate: "2024-01-14",
    doctor: "dr. Maya, Sp.OG",
    department: "Poli Kandungan",
    diagnosis: [
      { code: "O80", description: "Kehamilan normal G2P1A0", type: "primer" },
    ],
    vitals: { bp: "110/70", hr: 78, rr: 16, temp: 36.8, weight: 62, height: 158 },
    soap: {
      subjective: "Kontrol kehamilan rutin. Usia kehamilan 28 minggu. Tidak ada keluhan.",
      objective: "KU: Baik. TD: 110/70. DJJ: 142x/mnt. TFU: 28 cm.",
      assessment: "G2P1A0 hamil 28 minggu dalam batas normal",
      plan: "1. Vitamin prenatal\n2. USG bulan depan\n3. Kontrol 4 minggu",
    },
  },
];

export default function RekamMedis() {
  const [selectedRecord, setSelectedRecord] = useState<typeof patientRecords[0] | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewRecord, setShowNewRecord] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Rekam Medis Elektronik</h1>
          <p className="text-muted-foreground">Catatan medis pasien dengan format SOAP</p>
        </div>
        <Dialog open={showNewRecord} onOpenChange={setShowNewRecord}>
          <DialogTrigger asChild>
            <Button className="gradient-primary shadow-glow">
              <Plus className="h-4 w-4 mr-2" />
              Buat Rekam Medis
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Buat Rekam Medis Baru</DialogTitle>
              <DialogDescription>
                Isi catatan medis dengan format SOAP
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              {/* Patient Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cari Pasien</Label>
                  <Input placeholder="No. RM atau Nama Pasien" />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Pemeriksaan</Label>
                  <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
              </div>

              {/* Vital Signs */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Tanda Vital
                </Label>
                <div className="grid grid-cols-6 gap-3">
                  <div>
                    <Label className="text-xs">TD (mmHg)</Label>
                    <Input placeholder="120/80" />
                  </div>
                  <div>
                    <Label className="text-xs">Nadi (x/mnt)</Label>
                    <Input type="number" placeholder="80" />
                  </div>
                  <div>
                    <Label className="text-xs">RR (x/mnt)</Label>
                    <Input type="number" placeholder="18" />
                  </div>
                  <div>
                    <Label className="text-xs">Suhu (°C)</Label>
                    <Input type="number" step="0.1" placeholder="36.5" />
                  </div>
                  <div>
                    <Label className="text-xs">BB (kg)</Label>
                    <Input type="number" placeholder="70" />
                  </div>
                  <div>
                    <Label className="text-xs">TB (cm)</Label>
                    <Input type="number" placeholder="170" />
                  </div>
                </div>
              </div>

              {/* SOAP Notes */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">S</span>
                    Subjective (Keluhan Pasien)
                  </Label>
                  <Textarea 
                    placeholder="Keluhan utama, riwayat penyakit sekarang, riwayat penyakit dahulu..."
                    className="min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-success/10 text-success flex items-center justify-center text-sm font-bold">O</span>
                    Objective (Pemeriksaan Fisik)
                  </Label>
                  <Textarea 
                    placeholder="Keadaan umum, kesadaran, hasil pemeriksaan fisik..."
                    className="min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-warning/10 text-warning flex items-center justify-center text-sm font-bold">A</span>
                    Assessment (Diagnosis)
                  </Label>
                  <div className="space-y-2">
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kode ICD-10" />
                      </SelectTrigger>
                      <SelectContent>
                        {icd10Codes.map((icd) => (
                          <SelectItem key={icd.code} value={icd.code}>
                            {icd.code} - {icd.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea 
                      placeholder="Kesimpulan diagnosis..."
                      className="min-h-[60px]"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-info/10 text-info flex items-center justify-center text-sm font-bold">P</span>
                    Plan (Rencana Tindakan)
                  </Label>
                  <Textarea 
                    placeholder="Terapi, tindakan, edukasi, rujukan, rencana kontrol..."
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewRecord(false)}>Batal</Button>
              <Button className="gradient-primary">Simpan Rekam Medis</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">12,458</p>
            <p className="text-sm text-muted-foreground">Total Rekam Medis</p>
          </div>
        </div>
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-success/10">
            <Calendar className="h-6 w-6 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold">156</p>
            <p className="text-sm text-muted-foreground">Hari Ini</p>
          </div>
        </div>
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-info/10">
            <Stethoscope className="h-6 w-6 text-info" />
          </div>
          <div>
            <p className="text-2xl font-bold">24</p>
            <p className="text-sm text-muted-foreground">Dokter Aktif</p>
          </div>
        </div>
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-warning/10">
            <Activity className="h-6 w-6 text-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold">98%</p>
            <p className="text-sm text-muted-foreground">ICD-10 Compliance</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient List */}
        <div className="lg:col-span-1">
          <div className="module-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Riwayat Rekam Medis</h3>
              <Button variant="ghost" size="sm">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cari No. RM atau nama..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              {patientRecords.map((record) => (
                <div
                  key={record.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedRecord?.id === record.id 
                      ? "bg-primary/5 border-primary" 
                      : "bg-muted/30 border-transparent hover:border-border"
                  }`}
                  onClick={() => setSelectedRecord(record)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {record.patient.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{record.patient.name}</p>
                        <p className="text-xs text-muted-foreground">{record.id}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{record.department}</span>
                    <span>{record.visitDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Record Detail */}
        <div className="lg:col-span-2">
          {selectedRecord ? (
            <div className="module-card">
              {/* Patient Header */}
              <div className="flex items-start justify-between mb-6 pb-4 border-b">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {selectedRecord.patient.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-bold">{selectedRecord.patient.name}</h2>
                    <p className="text-muted-foreground">
                      {selectedRecord.patient.gender === "L" ? "Laki-laki" : "Perempuan"}, {selectedRecord.patient.age} tahun
                    </p>
                    <p className="text-sm text-muted-foreground font-mono">{selectedRecord.id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{selectedRecord.visitDate}</p>
                  <p className="font-medium">{selectedRecord.doctor}</p>
                  <p className="text-sm text-muted-foreground">{selectedRecord.department}</p>
                </div>
              </div>

              {/* Vital Signs */}
              <div className="mb-6">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Tanda Vital
                </h4>
                <div className="grid grid-cols-6 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <Heart className="h-4 w-4 mx-auto mb-1 text-destructive" />
                    <p className="text-lg font-bold">{selectedRecord.vitals.bp}</p>
                    <p className="text-xs text-muted-foreground">TD</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-lg font-bold">{selectedRecord.vitals.hr}</p>
                    <p className="text-xs text-muted-foreground">Nadi</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-lg font-bold">{selectedRecord.vitals.rr}</p>
                    <p className="text-xs text-muted-foreground">RR</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <Thermometer className="h-4 w-4 mx-auto mb-1 text-warning" />
                    <p className="text-lg font-bold">{selectedRecord.vitals.temp}°</p>
                    <p className="text-xs text-muted-foreground">Suhu</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-lg font-bold">{selectedRecord.vitals.weight}</p>
                    <p className="text-xs text-muted-foreground">BB (kg)</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-lg font-bold">{selectedRecord.vitals.height}</p>
                    <p className="text-xs text-muted-foreground">TB (cm)</p>
                  </div>
                </div>
              </div>

              {/* Diagnosis */}
              <div className="mb-6">
                <h4 className="font-semibold mb-3">Diagnosis (ICD-10)</h4>
                <div className="space-y-2">
                  {selectedRecord.diagnosis.map((dx, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <Badge variant={dx.type === "primer" ? "default" : "secondary"}>
                        {dx.type === "primer" ? "Primer" : "Sekunder"}
                      </Badge>
                      <span className="font-mono text-sm font-medium">{dx.code}</span>
                      <span className="text-sm">{dx.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SOAP Notes */}
              <Accordion type="single" collapsible defaultValue="soap" className="space-y-2">
                <AccordionItem value="soap" className="border rounded-lg">
                  <AccordionTrigger className="px-4">
                    <span className="font-semibold">Catatan SOAP</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-primary/5 border-l-4 border-primary">
                        <h5 className="font-semibold text-primary mb-2">S - Subjective</h5>
                        <p className="text-sm whitespace-pre-line">{selectedRecord.soap.subjective}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-success/5 border-l-4 border-success">
                        <h5 className="font-semibold text-success mb-2">O - Objective</h5>
                        <p className="text-sm whitespace-pre-line">{selectedRecord.soap.objective}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-warning/5 border-l-4 border-warning">
                        <h5 className="font-semibold text-warning mb-2">A - Assessment</h5>
                        <p className="text-sm whitespace-pre-line">{selectedRecord.soap.assessment}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-info/5 border-l-4 border-info">
                        <h5 className="font-semibold text-info mb-2">P - Plan</h5>
                        <p className="text-sm whitespace-pre-line">{selectedRecord.soap.plan}</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Actions */}
              <div className="flex gap-2 mt-6 pt-4 border-t">
                <Button variant="outline" className="flex-1">
                  <History className="h-4 w-4 mr-2" />
                  Riwayat Lengkap
                </Button>
                <Button variant="outline" className="flex-1">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button className="flex-1 gradient-primary">
                  <FileText className="h-4 w-4 mr-2" />
                  Cetak
                </Button>
              </div>
            </div>
          ) : (
            <div className="module-card flex items-center justify-center h-96">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Pilih rekam medis untuk melihat detail</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

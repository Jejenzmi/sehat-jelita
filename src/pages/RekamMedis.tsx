import { useState } from "react";
import { 
  FileText, Search, Filter, Plus, Calendar, Stethoscope,
  Heart, Activity, Thermometer, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { useMedicalRecords, useMedicalRecordStats, useICD10Codes, MedicalRecord } from "@/hooks/useMedicalRecords";
import { format, differenceInYears } from "date-fns";

export default function RekamMedis() {
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewRecord, setShowNewRecord] = useState(false);
  const [icdSearch, setIcdSearch] = useState("");

  const { data: records = [], isLoading: recordsLoading } = useMedicalRecords();
  const { data: stats, isLoading: statsLoading } = useMedicalRecordStats();
  const { data: icdCodes = [] } = useICD10Codes(icdSearch);

  const filteredRecords = records.filter(record =>
    record.patients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.patients?.medical_record_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isLoading = recordsLoading || statsLoading;

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
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Buat Rekam Medis Baru</DialogTitle>
              <DialogDescription>
                Isi catatan medis dengan format SOAP
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-4">
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
                    <Input 
                      placeholder="Cari kode ICD-10..."
                      value={icdSearch}
                      onChange={(e) => setIcdSearch(e.target.value)}
                    />
                    {icdCodes.length > 0 && (
                      <div className="border rounded-md max-h-32 overflow-y-auto">
                        {icdCodes.map((icd) => (
                          <div 
                            key={icd.id}
                            className="p-2 hover:bg-muted cursor-pointer text-sm"
                          >
                            <span className="font-mono font-medium">{icd.code}</span> - {icd.description_id || icd.description_en}
                          </div>
                        ))}
                      </div>
                    )}
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
            </ScrollArea>
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
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold">{stats?.totalRecords?.toLocaleString() || 0}</p>
            )}
            <p className="text-sm text-muted-foreground">Total Rekam Medis</p>
          </div>
        </div>
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-success/10">
            <Calendar className="h-6 w-6 text-success" />
          </div>
          <div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold">{stats?.todayRecords || 0}</p>
            )}
            <p className="text-sm text-muted-foreground">Hari Ini</p>
          </div>
        </div>
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-info/10">
            <Stethoscope className="h-6 w-6 text-info" />
          </div>
          <div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold">{stats?.activeDoctors || 0}</p>
            )}
            <p className="text-sm text-muted-foreground">Dokter Aktif</p>
          </div>
        </div>
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-warning/10">
            <Activity className="h-6 w-6 text-warning" />
          </div>
          <div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold">{stats?.icdCompliance || 0}%</p>
            )}
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
            {recordsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada rekam medis ditemukan
              </div>
            ) : (
              <div className="space-y-2">
                {filteredRecords.map((record) => (
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
                            {record.patients?.full_name?.split(" ").map((n: string) => n[0]).join("") || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{record.patients?.full_name}</p>
                          <p className="text-xs text-muted-foreground">{record.patients?.medical_record_number}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{record.doctors?.specialization || "Umum"}</span>
                      <span>{format(new Date(record.record_date), "dd/MM/yyyy")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                      {selectedRecord.patients?.full_name?.split(" ").map((n: string) => n[0]).join("") || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-bold">{selectedRecord.patients?.full_name}</h2>
                    <p className="text-muted-foreground">
                      {selectedRecord.patients?.gender === "L" ? "Laki-laki" : "Perempuan"}, {selectedRecord.patients?.birth_date ? differenceInYears(new Date(), new Date(selectedRecord.patients.birth_date)) : "-"} tahun
                    </p>
                    <p className="text-sm text-muted-foreground font-mono">{selectedRecord.patients?.medical_record_number}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{format(new Date(selectedRecord.record_date), "dd/MM/yyyy")}</p>
                  <p className="font-medium">{selectedRecord.doctors?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedRecord.doctors?.specialization}</p>
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
                    <p className="text-lg font-bold">
                      {selectedRecord.blood_pressure_systolic && selectedRecord.blood_pressure_diastolic 
                        ? `${selectedRecord.blood_pressure_systolic}/${selectedRecord.blood_pressure_diastolic}`
                        : "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">TD</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-lg font-bold">{selectedRecord.heart_rate || "-"}</p>
                    <p className="text-xs text-muted-foreground">Nadi</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-lg font-bold">{selectedRecord.respiratory_rate || "-"}</p>
                    <p className="text-xs text-muted-foreground">RR</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <Thermometer className="h-4 w-4 mx-auto mb-1 text-warning" />
                    <p className="text-lg font-bold">{selectedRecord.temperature ? `${selectedRecord.temperature}°` : "-"}</p>
                    <p className="text-xs text-muted-foreground">Suhu</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-lg font-bold">{selectedRecord.weight || "-"}</p>
                    <p className="text-xs text-muted-foreground">BB (kg)</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-lg font-bold">{selectedRecord.height || "-"}</p>
                    <p className="text-xs text-muted-foreground">TB (cm)</p>
                  </div>
                </div>
              </div>

              {/* Diagnosis */}
              {selectedRecord.diagnoses && selectedRecord.diagnoses.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-3">Diagnosis (ICD-10)</h4>
                  <div className="space-y-2">
                    {selectedRecord.diagnoses.map((dx, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <Badge variant={dx.diagnosis_type === "primer" ? "default" : "secondary"}>
                          {dx.diagnosis_type === "primer" ? "Primer" : "Sekunder"}
                        </Badge>
                        <span className="font-mono text-sm font-medium">{dx.icd10_code}</span>
                        <span className="text-sm">{dx.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SOAP Notes */}
              <Accordion type="single" collapsible defaultValue="subjective">
                <AccordionItem value="subjective">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">S</span>
                      Subjective
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="whitespace-pre-wrap">{selectedRecord.subjective || "Tidak ada data"}</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="objective">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-success/10 text-success flex items-center justify-center text-sm font-bold">O</span>
                      Objective
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="whitespace-pre-wrap">{selectedRecord.objective || "Tidak ada data"}</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="assessment">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-warning/10 text-warning flex items-center justify-center text-sm font-bold">A</span>
                      Assessment
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="whitespace-pre-wrap">{selectedRecord.assessment || "Tidak ada data"}</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="plan">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-info/10 text-info flex items-center justify-center text-sm font-bold">P</span>
                      Plan
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="whitespace-pre-wrap">{selectedRecord.plan || "Tidak ada data"}</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          ) : (
            <div className="module-card flex items-center justify-center h-96">
              <div className="text-center text-muted-foreground">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>Pilih rekam medis untuk melihat detail</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

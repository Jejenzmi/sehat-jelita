import { useState } from "react";
import {
  FileText, Search, Filter, Plus, Calendar, Stethoscope,
  Heart, Activity, Thermometer, ChevronRight, X, Globe,
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
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  useMedicalRecords, useMedicalRecordStats, useCreateMedicalRecord,
  MedicalRecord, DiagnosisInput,
} from "@/hooks/useMedicalRecords";
import { ICD11SearchInput, ICD11Entity } from "@/components/icd11/ICD11SearchInput";
import { format, differenceInYears } from "date-fns";

// ---- Vital signs helpers --------------------------------------------------
function getVital(record: MedicalRecord, key: string): string | number {
  const vs = record.vital_signs as Record<string, unknown> | null;
  return vs?.[key] != null ? String(vs[key]) : "-";
}

// ---- Diagnosis type labels ------------------------------------------------
const DX_TYPE_LABELS: Record<string, string> = {
  primer: "Primer",
  sekunder: "Sekunder",
  komplikasi: "Komplikasi",
  komorbid: "Komorbid",
};

const DX_TYPE_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  primer: "default",
  sekunder: "secondary",
  komplikasi: "destructive",
  komorbid: "outline",
};

// ---- Form state defaults --------------------------------------------------
const EMPTY_FORM = {
  patient_id: "",
  visit_id: "",
  doctor_id: "",
  record_date: new Date().toISOString().split("T")[0],
  subjective: "",
  objective: "",
  assessment: "",
  plan: "",
  vitals: {
    blood_pressure: "",
    heart_rate: "",
    respiratory_rate: "",
    temperature: "",
    weight: "",
    height: "",
    oxygen_saturation: "",
  },
  diagnoses: [] as DiagnosisInput[],
};

export default function RekamMedis() {
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewRecord, setShowNewRecord] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: records = [], isLoading: recordsLoading } = useMedicalRecords();
  const { data: stats, isLoading: statsLoading } = useMedicalRecordStats();
  const createRecord = useCreateMedicalRecord();

  const isLoading = recordsLoading || statsLoading;

  const filteredRecords = records.filter(r =>
    r.patients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.patients?.medical_record_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ---- ICD-11 diagnosis management in form ----------------------------------
  function handleICD11Select(entity: ICD11Entity) {
    const newDx: DiagnosisInput = {
      icd11_code:      entity.icd11_code  ?? undefined,
      icd11_entity_id: entity.entity_id   ?? undefined,
      icd11_title_en:  entity.title,
      icd11_title_id:  entity.title,       // title is already in 'id' lang from the API
      icd10_code:      entity.icd10_code  ?? undefined,
      diagnosis_type:  form.diagnoses.length === 0 ? "primer" : "sekunder",
    };
    setForm(f => ({ ...f, diagnoses: [...f.diagnoses, newDx] }));
  }

  function removeDiagnosis(idx: number) {
    setForm(f => ({ ...f, diagnoses: f.diagnoses.filter((_, i) => i !== idx) }));
  }

  function changeDxType(idx: number, type: string) {
    setForm(f => {
      const diagnoses = [...f.diagnoses];
      diagnoses[idx] = { ...diagnoses[idx], diagnosis_type: type as DiagnosisInput["diagnosis_type"] };
      return { ...f, diagnoses };
    });
  }

  // ---- Form submit ----------------------------------------------------------
  async function handleSubmit() {
    if (!form.patient_id) return;
    const [sys, dia] = (form.vitals.blood_pressure || "").split("/");
    await createRecord.mutateAsync({
      patient_id: form.patient_id,
      visit_id:   form.visit_id   || undefined,
      doctor_id:  form.doctor_id  || undefined,
      subjective: form.subjective || undefined,
      objective:  form.objective  || undefined,
      assessment: form.assessment || undefined,
      plan:       form.plan       || undefined,
      vital_signs: {
        blood_pressure_systolic:  sys ? Number(sys) : undefined,
        blood_pressure_diastolic: dia ? Number(dia) : undefined,
        heart_rate:        form.vitals.heart_rate        ? Number(form.vitals.heart_rate)        : undefined,
        respiratory_rate:  form.vitals.respiratory_rate  ? Number(form.vitals.respiratory_rate)  : undefined,
        temperature:       form.vitals.temperature       ? Number(form.vitals.temperature)       : undefined,
        weight:            form.vitals.weight            ? Number(form.vitals.weight)            : undefined,
        height:            form.vitals.height            ? Number(form.vitals.height)            : undefined,
        oxygen_saturation: form.vitals.oxygen_saturation ? Number(form.vitals.oxygen_saturation) : undefined,
      },
      diagnoses: form.diagnoses,
    });
    setShowNewRecord(false);
    setForm(EMPTY_FORM);
  }

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Rekam Medis Elektronik</h1>
          <p className="text-muted-foreground">Catatan medis pasien dengan format SOAP + ICD-11</p>
        </div>
        <Dialog open={showNewRecord} onOpenChange={open => { setShowNewRecord(open); if (!open) setForm(EMPTY_FORM); }}>
          <DialogTrigger asChild>
            <Button className="gradient-primary shadow-glow">
              <Plus className="h-4 w-4 mr-2" />
              Buat Rekam Medis
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Buat Rekam Medis Baru</DialogTitle>
              <DialogDescription>Isi catatan medis dengan format SOAP — diagnosis menggunakan standar WHO ICD-11</DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="grid gap-6 py-4">

                {/* Patient & Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>No. RM / Nama Pasien <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="No. RM atau Nama Pasien"
                      value={form.patient_id}
                      onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tanggal Pemeriksaan</Label>
                    <Input
                      type="date"
                      value={form.record_date}
                      onChange={e => setForm(f => ({ ...f, record_date: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Vital Signs */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Tanda Vital
                  </Label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                    {[
                      { key: "blood_pressure",    label: "TD (mmHg)",  placeholder: "120/80" },
                      { key: "heart_rate",         label: "Nadi (x/mn)", placeholder: "80",    type: "number" },
                      { key: "respiratory_rate",   label: "RR (x/mn)",   placeholder: "18",    type: "number" },
                      { key: "temperature",        label: "Suhu (°C)",   placeholder: "36.5",  type: "number", step: "0.1" },
                      { key: "oxygen_saturation",  label: "SpO₂ (%)",    placeholder: "98",    type: "number" },
                      { key: "weight",             label: "BB (kg)",     placeholder: "70",    type: "number" },
                      { key: "height",             label: "TB (cm)",     placeholder: "170",   type: "number" },
                    ].map(({ key, label, placeholder, type, step }) => (
                      <div key={key}>
                        <Label className="text-xs">{label}</Label>
                        <Input
                          type={type || "text"}
                          step={step}
                          placeholder={placeholder}
                          value={form.vitals[key as keyof typeof form.vitals]}
                          onChange={e => setForm(f => ({
                            ...f, vitals: { ...f.vitals, [key]: e.target.value }
                          }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* SOAP */}
                <div className="space-y-4">
                  {/* S */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">S</span>
                      Subjective (Keluhan Pasien)
                    </Label>
                    <Textarea
                      placeholder="Keluhan utama, riwayat penyakit sekarang, riwayat penyakit dahulu…"
                      className="min-h-[90px]"
                      value={form.subjective}
                      onChange={e => setForm(f => ({ ...f, subjective: e.target.value }))}
                    />
                  </div>
                  {/* O */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-success/10 text-success flex items-center justify-center text-sm font-bold">O</span>
                      Objective (Pemeriksaan Fisik)
                    </Label>
                    <Textarea
                      placeholder="Keadaan umum, kesadaran, hasil pemeriksaan fisik…"
                      className="min-h-[90px]"
                      value={form.objective}
                      onChange={e => setForm(f => ({ ...f, objective: e.target.value }))}
                    />
                  </div>
                  {/* A — ICD-11 Diagnosis */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-warning/10 text-warning flex items-center justify-center text-sm font-bold">A</span>
                      Assessment / Diagnosis
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <Globe className="h-2.5 w-2.5" />WHO ICD-11
                      </Badge>
                    </Label>

                    {/* ICD-11 autocomplete */}
                    <ICD11SearchInput onSelect={handleICD11Select} placeholder="Ketik nama penyakit atau kode ICD-11…" />

                    {/* Added diagnoses list */}
                    {form.diagnoses.length > 0 && (
                      <div className="space-y-2 mt-2">
                        {form.diagnoses.map((dx, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg border bg-muted/30">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                {dx.icd11_code && (
                                  <Badge variant="default" className="font-mono text-xs">{dx.icd11_code}</Badge>
                                )}
                                {dx.icd10_code && (
                                  <Badge variant="outline" className="font-mono text-xs">ICD-10: {dx.icd10_code}</Badge>
                                )}
                                <span className="text-sm truncate">{dx.icd11_title_id || dx.icd11_title_en}</span>
                              </div>
                            </div>
                            <Select
                              value={dx.diagnosis_type}
                              onValueChange={val => changeDxType(idx, val)}
                            >
                              <SelectTrigger className="h-7 w-[110px] text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="primer">Primer</SelectItem>
                                <SelectItem value="sekunder">Sekunder</SelectItem>
                                <SelectItem value="komplikasi">Komplikasi</SelectItem>
                                <SelectItem value="komorbid">Komorbid</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeDiagnosis(idx)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <Textarea
                      placeholder="Catatan tambahan diagnosis / assessment…"
                      className="min-h-[60px]"
                      value={form.assessment}
                      onChange={e => setForm(f => ({ ...f, assessment: e.target.value }))}
                    />
                  </div>
                  {/* P */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-info/10 text-info flex items-center justify-center text-sm font-bold">P</span>
                      Plan (Rencana Tindakan)
                    </Label>
                    <Textarea
                      placeholder="Terapi, tindakan, edukasi, rujukan, rencana kontrol…"
                      className="min-h-[90px]"
                      value={form.plan}
                      onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewRecord(false)}>Batal</Button>
              <Button
                className="gradient-primary"
                onClick={handleSubmit}
                disabled={!form.patient_id || createRecord.isPending}
              >
                {createRecord.isPending ? "Menyimpan…" : "Simpan Rekam Medis"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Stats                                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { icon: <FileText className="h-6 w-6 text-primary" />, bg: "bg-primary/10", value: stats?.totalRecords?.toLocaleString() || 0, label: "Total Rekam Medis" },
          { icon: <Calendar className="h-6 w-6 text-success" />, bg: "bg-success/10", value: stats?.todayRecords || 0, label: "Hari Ini" },
          { icon: <Stethoscope className="h-6 w-6 text-info" />, bg: "bg-info/10",    value: stats?.activeDoctors || 0, label: "Dokter Aktif" },
          { icon: <Activity className="h-6 w-6 text-warning" />, bg: "bg-warning/10", value: `${stats?.icdCompliance || 0}%`, label: "ICD-11 Compliance" },
        ].map(({ icon, bg, value, label }) => (
          <div key={label} className="module-card flex items-center gap-4">
            <div className={`p-3 rounded-xl ${bg}`}>{icon}</div>
            <div>
              {isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{value}</p>}
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Main content: list + detail                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Record list */}
        <div className="lg:col-span-1">
          <div className="module-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Riwayat Rekam Medis</h3>
              <Button variant="ghost" size="sm"><Filter className="h-4 w-4" /></Button>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari No. RM atau nama…"
                className="pl-10"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {recordsLoading ? (
              <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-20" />)}</div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Tidak ada rekam medis ditemukan</div>
            ) : (
              <div className="space-y-2">
                {filteredRecords.map(record => (
                  <div
                    key={record.id}
                    onClick={() => setSelectedRecord(record)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedRecord?.id === record.id
                        ? "bg-primary/5 border-primary"
                        : "bg-muted/30 border-transparent hover:border-border"
                    }`}
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
                    {record.diagnoses && record.diagnoses.length > 0 && (
                      <div className="mt-1.5 flex gap-1 flex-wrap">
                        {record.diagnoses.slice(0, 2).map((dx, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px] font-mono px-1.5 py-0 h-4">
                            {dx.icd11_code || dx.icd10_code}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Record detail */}
        <div className="lg:col-span-2">
          {selectedRecord ? (
            <div className="module-card space-y-6">

              {/* Patient header */}
              <div className="flex items-start justify-between pb-4 border-b">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {selectedRecord.patients?.full_name?.split(" ").map((n: string) => n[0]).join("") || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-bold">{selectedRecord.patients?.full_name}</h2>
                    <p className="text-muted-foreground">
                      {selectedRecord.patients?.gender === "L" ? "Laki-laki" : "Perempuan"}
                      {selectedRecord.patients?.birth_date &&
                        `, ${differenceInYears(new Date(), new Date(selectedRecord.patients.birth_date))} tahun`}
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

              {/* Vital signs */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4" />Tanda Vital
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {[
                    { icon: <Heart className="h-4 w-4 mx-auto mb-1 text-destructive" />, value: (() => { const s = getVital(selectedRecord,"blood_pressure_systolic"); const d = getVital(selectedRecord,"blood_pressure_diastolic"); return (s !== "-" && d !== "-") ? `${s}/${d}` : "-"; })(), label: "TD" },
                    { value: getVital(selectedRecord,"heart_rate"),        label: "Nadi" },
                    { value: getVital(selectedRecord,"respiratory_rate"),  label: "RR" },
                    { icon: <Thermometer className="h-4 w-4 mx-auto mb-1 text-warning" />, value: getVital(selectedRecord,"temperature") !== "-" ? `${getVital(selectedRecord,"temperature")}°` : "-", label: "Suhu" },
                    { value: getVital(selectedRecord,"weight"),   label: "BB (kg)" },
                    { value: getVital(selectedRecord,"height"),   label: "TB (cm)" },
                  ].map((v, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50 text-center">
                      {v.icon ?? null}
                      <p className="text-lg font-bold">{v.value}</p>
                      <p className="text-xs text-muted-foreground">{v.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ICD-11 Diagnoses */}
              {selectedRecord.diagnoses && selectedRecord.diagnoses.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Diagnosis ICD-11
                  </h4>
                  <div className="space-y-2">
                    {selectedRecord.diagnoses.map((dx, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border">
                        <Badge variant={DX_TYPE_VARIANTS[dx.diagnosis_type] || "secondary"}>
                          {DX_TYPE_LABELS[dx.diagnosis_type] || dx.diagnosis_type}
                        </Badge>
                        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                          {dx.icd11_code && (
                            <Badge variant="default" className="font-mono text-xs">{dx.icd11_code}</Badge>
                          )}
                          {dx.icd10_code && (
                            <Badge variant="outline" className="font-mono text-xs">ICD-10: {dx.icd10_code}</Badge>
                          )}
                          <span className="text-sm truncate">{dx.icd11_title_id || dx.icd11_title_en || dx.icd10_title}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SOAP Notes */}
              <Accordion type="single" collapsible defaultValue="subjective">
                {[
                  { key: "subjective",  letter: "S", color: "bg-primary/10 text-primary",  label: "Subjective",  value: selectedRecord.subjective },
                  { key: "objective",   letter: "O", color: "bg-success/10 text-success",  label: "Objective",   value: selectedRecord.objective },
                  { key: "assessment",  letter: "A", color: "bg-warning/10 text-warning",  label: "Assessment",  value: selectedRecord.assessment },
                  { key: "plan",        letter: "P", color: "bg-info/10 text-info",         label: "Plan",        value: selectedRecord.plan },
                ].map(({ key, letter, color, label, value }) => (
                  <AccordionItem key={key} value={key}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded ${color} flex items-center justify-center text-sm font-bold`}>{letter}</span>
                        {label}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="whitespace-pre-wrap text-sm">{value || "Tidak ada data"}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
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

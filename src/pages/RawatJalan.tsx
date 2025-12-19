import { useState, useEffect } from "react";
import { Search, Filter, Stethoscope, Clock, CheckCircle, Users, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface PoliStats {
  department_id: string;
  department_name: string;
  doctor_name: string;
  total: number;
  served: number;
  waiting: number;
  in_progress: number;
}

interface CurrentPatient {
  id: string;
  visit_id: string;
  patient_name: string;
  medical_record_number: string;
  department_name: string;
  doctor_name: string;
  status: string;
  check_in_time: string;
  chief_complaint: string | null;
}

interface QueuePatient {
  id: string;
  queue_number: number;
  patient_name: string;
  medical_record_number: string;
  doctor_name: string;
  status: string;
  check_in_time: string;
}

export default function RawatJalan() {
  const [loading, setLoading] = useState(true);
  const [poliStats, setPoliStats] = useState<PoliStats[]>([]);
  const [currentPatients, setCurrentPatients] = useState<CurrentPatient[]>([]);
  const [queuePatients, setQueuePatients] = useState<QueuePatient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [stats, setStats] = useState({ activePoli: 0, totalQueue: 0, served: 0, waiting: 0 });
  
  // Medical Record Dialog
  const [medicalRecordOpen, setMedicalRecordOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<CurrentPatient | null>(null);
  const [medicalForm, setMedicalForm] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
    blood_pressure_systolic: "",
    blood_pressure_diastolic: "",
    heart_rate: "",
    temperature: "",
    respiratory_rate: "",
    weight: "",
    height: "",
  });
  const [savingRecord, setSavingRecord] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDepartments(),
        fetchPoliStats(),
        fetchCurrentPatients(),
        fetchQueuePatients(),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    const { data, error } = await supabase
      .from("departments")
      .select("id, name")
      .eq("is_active", true)
      .order("name");

    if (!error && data) {
      setDepartments(data);
    }
  };

  const fetchPoliStats = async () => {
    const today = new Date().toISOString().split("T")[0];

    // Get visits grouped by department
    const { data: visits, error } = await supabase
      .from("visits")
      .select(`
        id,
        status,
        department_id,
        doctor_id,
        departments(id, name),
        doctors(full_name)
      `)
      .eq("visit_date", today)
      .eq("visit_type", "rawat_jalan");

    if (error) {
      console.error("Error fetching poli stats:", error);
      return;
    }

    // Group by department
    const statsMap = new Map<string, PoliStats>();
    
    visits?.forEach((visit: any) => {
      const deptId = visit.department_id;
      if (!deptId) return;

      if (!statsMap.has(deptId)) {
        statsMap.set(deptId, {
          department_id: deptId,
          department_name: visit.departments?.name || "Unknown",
          doctor_name: visit.doctors?.full_name || "Unknown",
          total: 0,
          served: 0,
          waiting: 0,
          in_progress: 0,
        });
      }

      const stat = statsMap.get(deptId)!;
      stat.total++;

      if (visit.status === "selesai") {
        stat.served++;
      } else if (visit.status === "menunggu") {
        stat.waiting++;
      } else if (visit.status === "dipanggil" || visit.status === "diperiksa") {
        stat.in_progress++;
      }
    });

    const poliStatsArray = Array.from(statsMap.values());
    setPoliStats(poliStatsArray);

    // Calculate global stats
    const totalServed = poliStatsArray.reduce((acc, p) => acc + p.served, 0);
    const totalWaiting = poliStatsArray.reduce((acc, p) => acc + p.waiting, 0);
    const totalQueue = poliStatsArray.reduce((acc, p) => acc + p.total, 0);

    setStats({
      activePoli: poliStatsArray.length,
      totalQueue,
      served: totalServed,
      waiting: totalWaiting,
    });
  };

  const fetchCurrentPatients = async () => {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("visits")
      .select(`
        id,
        queue_number,
        status,
        check_in_time,
        chief_complaint,
        patients(id, full_name, medical_record_number),
        departments(name),
        doctors(full_name)
      `)
      .eq("visit_date", today)
      .eq("visit_type", "rawat_jalan")
      .in("status", ["dipanggil", "dilayani"])
      .order("check_in_time", { ascending: true });

    if (error) {
      console.error("Error fetching current patients:", error);
      return;
    }

    const patients: CurrentPatient[] = (data || []).map((v: any) => ({
      id: v.patients?.id,
      visit_id: v.id,
      patient_name: v.patients?.full_name || "Unknown",
      medical_record_number: v.patients?.medical_record_number || "",
      department_name: v.departments?.name || "",
      doctor_name: v.doctors?.full_name || "",
      status: v.status,
      check_in_time: v.check_in_time || "",
      chief_complaint: v.chief_complaint,
    }));

    setCurrentPatients(patients);
  };

  const fetchQueuePatients = async () => {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("visits")
      .select(`
        id,
        queue_number,
        status,
        check_in_time,
        patients(full_name, medical_record_number),
        doctors(full_name)
      `)
      .eq("visit_date", today)
      .eq("visit_type", "rawat_jalan")
      .eq("status", "menunggu")
      .order("queue_number", { ascending: true });

    if (error) {
      console.error("Error fetching queue:", error);
      return;
    }

    const queue: QueuePatient[] = (data || []).map((v: any) => ({
      id: v.id,
      queue_number: v.queue_number,
      patient_name: v.patients?.full_name || "Unknown",
      medical_record_number: v.patients?.medical_record_number || "",
      doctor_name: v.doctors?.full_name || "",
      status: v.status,
      check_in_time: v.check_in_time || "",
    }));

    setQueuePatients(queue);
  };

  const handleStartExamination = async (patient: CurrentPatient) => {
    // Update status to "diperiksa"
    const { error } = await supabase
      .from("visits")
      .update({ status: "dilayani" })
      .eq("id", patient.visit_id);

    if (error) {
      toast.error("Gagal memulai pemeriksaan");
      return;
    }

    setSelectedVisit(patient);
    setMedicalRecordOpen(true);
    fetchCurrentPatients();
  };

  const handleSaveMedicalRecord = async () => {
    if (!selectedVisit) return;

    setSavingRecord(true);
    try {
      // Get doctor info (use first doctor for now)
      const { data: doctorData } = await supabase
        .from("doctors")
        .select("id")
        .limit(1)
        .single();

      if (!doctorData) {
        toast.error("Data dokter tidak ditemukan");
        return;
      }

      // Create medical record
      const { error: mrError } = await supabase
        .from("medical_records")
        .insert({
          visit_id: selectedVisit.visit_id,
          patient_id: selectedVisit.id,
          doctor_id: doctorData.id,
          subjective: medicalForm.subjective,
          objective: medicalForm.objective,
          assessment: medicalForm.assessment,
          plan: medicalForm.plan,
          blood_pressure_systolic: medicalForm.blood_pressure_systolic ? parseInt(medicalForm.blood_pressure_systolic) : null,
          blood_pressure_diastolic: medicalForm.blood_pressure_diastolic ? parseInt(medicalForm.blood_pressure_diastolic) : null,
          heart_rate: medicalForm.heart_rate ? parseInt(medicalForm.heart_rate) : null,
          temperature: medicalForm.temperature ? parseFloat(medicalForm.temperature) : null,
          respiratory_rate: medicalForm.respiratory_rate ? parseInt(medicalForm.respiratory_rate) : null,
          weight: medicalForm.weight ? parseFloat(medicalForm.weight) : null,
          height: medicalForm.height ? parseFloat(medicalForm.height) : null,
        });

      if (mrError) throw mrError;

      // Update visit status to selesai
      const { error: visitError } = await supabase
        .from("visits")
        .update({ status: "selesai" as const })
        .eq("id", selectedVisit.visit_id);

      if (visitError) throw visitError;

      toast.success("Rekam medis berhasil disimpan");
      setMedicalRecordOpen(false);
      setSelectedVisit(null);
      setMedicalForm({
        subjective: "",
        objective: "",
        assessment: "",
        plan: "",
        blood_pressure_systolic: "",
        blood_pressure_diastolic: "",
        heart_rate: "",
        temperature: "",
        respiratory_rate: "",
        weight: "",
        height: "",
      });
      fetchData();
    } catch (error) {
      console.error("Error saving medical record:", error);
      toast.error("Gagal menyimpan rekam medis");
    } finally {
      setSavingRecord(false);
    }
  };

  const filteredCurrentPatients = currentPatients.filter(p =>
    p.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.medical_record_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredQueue = selectedDepartment === "all"
    ? queuePatients
    : queuePatients.filter(q => q.doctor_name.includes(selectedDepartment));

  const formatTime = (timeString: string) => {
    if (!timeString) return "-";
    return timeString.substring(0, 5);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "dipanggil": return "Dipanggil";
      case "diperiksa": return "Pemeriksaan";
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rawat Jalan</h1>
          <p className="text-muted-foreground">Manajemen pelayanan rawat jalan</p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Stethoscope className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.activePoli}</p>
            <p className="text-sm text-muted-foreground">Poliklinik Aktif</p>
          </div>
        </div>
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-warning/10">
            <Clock className="h-6 w-6 text-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.totalQueue}</p>
            <p className="text-sm text-muted-foreground">Total Antrian</p>
          </div>
        </div>
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-success/10">
            <CheckCircle className="h-6 w-6 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.served}</p>
            <p className="text-sm text-muted-foreground">Sudah Dilayani</p>
          </div>
        </div>
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-info/10">
            <Users className="h-6 w-6 text-info" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.waiting}</p>
            <p className="text-sm text-muted-foreground">Menunggu</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview Poli</TabsTrigger>
          <TabsTrigger value="current">Pasien Sedang Dilayani</TabsTrigger>
          <TabsTrigger value="queue">Antrian</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
          ) : poliStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada kunjungan rawat jalan hari ini
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {poliStats.map((poli) => (
                <div key={poli.department_id} className="module-card">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">{poli.department_name}</h4>
                    <Badge
                      variant="outline"
                      className={
                        poli.waiting > 0 || poli.in_progress > 0
                          ? "bg-success/10 text-success border-success/20"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {poli.waiting > 0 || poli.in_progress > 0 ? "Aktif" : "Selesai"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{poli.doctor_name}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{poli.served}/{poli.total}</span>
                    </div>
                    <Progress value={poli.total > 0 ? (poli.served / poli.total) * 100 : 0} className="h-2" />
                  </div>
                  <div className="flex justify-between mt-4 text-sm">
                    <div className="text-center">
                      <p className="font-bold text-success">{poli.served}</p>
                      <p className="text-xs text-muted-foreground">Selesai</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-info">{poli.in_progress}</p>
                      <p className="text-xs text-muted-foreground">Diperiksa</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-warning">{poli.waiting}</p>
                      <p className="text-xs text-muted-foreground">Menunggu</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="current">
          <div className="module-card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Pasien Sedang Dilayani</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari pasien..."
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
            ) : filteredCurrentPatients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada pasien yang sedang dilayani
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCurrentPatients.map((patient) => (
                  <div
                    key={patient.visit_id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {patient.patient_name.split(" ").map((n) => n[0]).join("").substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{patient.patient_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {patient.department_name} - {patient.doctor_name}
                        </p>
                        <p className="text-xs text-muted-foreground">{patient.medical_record_number}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <Badge
                        variant="outline"
                        className={
                          patient.status === "diperiksa"
                            ? "bg-primary/10 text-primary border-primary/20"
                            : "bg-info/10 text-info border-info/20"
                        }
                      >
                        {getStatusLabel(patient.status)}
                      </Badge>
                      <p className="text-xs text-muted-foreground">Sejak {formatTime(patient.check_in_time)}</p>
                      {patient.status === "dipanggil" && (
                        <Button size="sm" onClick={() => handleStartExamination(patient)}>
                          <FileText className="h-4 w-4 mr-1" />
                          Mulai Periksa
                        </Button>
                      )}
                      {patient.status === "diperiksa" && (
                        <Button size="sm" variant="outline" onClick={() => {
                          setSelectedVisit(patient);
                          setMedicalRecordOpen(true);
                        }}>
                          <FileText className="h-4 w-4 mr-1" />
                          Input Rekam Medis
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="queue">
          <div className="module-card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Antrian per Poliklinik</h3>
              <div className="flex items-center gap-2">
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter Poli" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Poli</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
            ) : queuePatients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada antrian menunggu
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>No. Antrian</th>
                      <th>No. RM</th>
                      <th>Nama Pasien</th>
                      <th>Dokter</th>
                      <th>Waktu Daftar</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQueue.map((patient) => (
                      <tr key={patient.id}>
                        <td>
                          <Badge variant="outline" className="font-mono">
                            {patient.queue_number.toString().padStart(3, "0")}
                          </Badge>
                        </td>
                        <td className="font-mono text-sm">{patient.medical_record_number}</td>
                        <td className="font-medium">{patient.patient_name}</td>
                        <td>{patient.doctor_name}</td>
                        <td>{formatTime(patient.check_in_time)}</td>
                        <td>
                          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                            Menunggu
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Medical Record Dialog */}
      <Dialog open={medicalRecordOpen} onOpenChange={setMedicalRecordOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Input Rekam Medis</DialogTitle>
          </DialogHeader>
          
          {selectedVisit && (
            <div className="space-y-6">
              {/* Patient Info */}
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Nama Pasien:</span>
                    <p className="font-medium">{selectedVisit.patient_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">No. Rekam Medis:</span>
                    <p className="font-medium">{selectedVisit.medical_record_number}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Poli:</span>
                    <p className="font-medium">{selectedVisit.department_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Dokter:</span>
                    <p className="font-medium">{selectedVisit.doctor_name}</p>
                  </div>
                  {selectedVisit.chief_complaint && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Keluhan:</span>
                      <p className="font-medium">{selectedVisit.chief_complaint}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Vital Signs */}
              <div>
                <h4 className="font-semibold mb-3">Tanda Vital</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>TD Sistolik (mmHg)</Label>
                    <Input
                      type="number"
                      placeholder="120"
                      value={medicalForm.blood_pressure_systolic}
                      onChange={(e) => setMedicalForm({ ...medicalForm, blood_pressure_systolic: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>TD Diastolik (mmHg)</Label>
                    <Input
                      type="number"
                      placeholder="80"
                      value={medicalForm.blood_pressure_diastolic}
                      onChange={(e) => setMedicalForm({ ...medicalForm, blood_pressure_diastolic: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nadi (x/menit)</Label>
                    <Input
                      type="number"
                      placeholder="80"
                      value={medicalForm.heart_rate}
                      onChange={(e) => setMedicalForm({ ...medicalForm, heart_rate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Suhu (°C)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="36.5"
                      value={medicalForm.temperature}
                      onChange={(e) => setMedicalForm({ ...medicalForm, temperature: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pernapasan (x/menit)</Label>
                    <Input
                      type="number"
                      placeholder="20"
                      value={medicalForm.respiratory_rate}
                      onChange={(e) => setMedicalForm({ ...medicalForm, respiratory_rate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Berat Badan (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="60"
                      value={medicalForm.weight}
                      onChange={(e) => setMedicalForm({ ...medicalForm, weight: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tinggi Badan (cm)</Label>
                    <Input
                      type="number"
                      placeholder="170"
                      value={medicalForm.height}
                      onChange={(e) => setMedicalForm({ ...medicalForm, height: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* SOAP Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subjective (Keluhan Pasien)</Label>
                  <Textarea
                    rows={4}
                    placeholder="Keluhan utama dan riwayat penyakit..."
                    value={medicalForm.subjective}
                    onChange={(e) => setMedicalForm({ ...medicalForm, subjective: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Objective (Pemeriksaan Fisik)</Label>
                  <Textarea
                    rows={4}
                    placeholder="Hasil pemeriksaan fisik..."
                    value={medicalForm.objective}
                    onChange={(e) => setMedicalForm({ ...medicalForm, objective: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Assessment (Diagnosis)</Label>
                  <Textarea
                    rows={4}
                    placeholder="Diagnosis kerja..."
                    value={medicalForm.assessment}
                    onChange={(e) => setMedicalForm({ ...medicalForm, assessment: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Plan (Rencana Tindakan)</Label>
                  <Textarea
                    rows={4}
                    placeholder="Rencana terapi dan tindak lanjut..."
                    value={medicalForm.plan}
                    onChange={(e) => setMedicalForm({ ...medicalForm, plan: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setMedicalRecordOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveMedicalRecord} disabled={savingRecord}>
              {savingRecord ? "Menyimpan..." : "Simpan & Selesaikan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

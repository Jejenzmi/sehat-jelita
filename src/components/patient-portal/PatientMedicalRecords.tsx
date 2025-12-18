import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { FileText, Calendar, User, Eye, Activity, Thermometer, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface MedicalRecord {
  id: string;
  record_date: string;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  heart_rate: number | null;
  respiratory_rate: number | null;
  temperature: number | null;
  oxygen_saturation: number | null;
  weight: number | null;
  height: number | null;
  physical_examination: string | null;
  additional_notes: string | null;
  doctor: {
    full_name: string;
    specialization: string | null;
  } | null;
  visit: {
    visit_number: string;
    visit_type: string;
    chief_complaint: string | null;
  } | null;
}

export default function PatientMedicalRecords() {
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

  useEffect(() => {
    if (user) {
      fetchMedicalRecords();
    }
  }, [user]);

  const fetchMedicalRecords = async () => {
    try {
      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!patient) return;

      const { data, error } = await supabase
        .from("medical_records")
        .select(`
          id,
          record_date,
          subjective,
          objective,
          assessment,
          plan,
          blood_pressure_systolic,
          blood_pressure_diastolic,
          heart_rate,
          respiratory_rate,
          temperature,
          oxygen_saturation,
          weight,
          height,
          physical_examination,
          additional_notes,
          doctor:doctor_id (
            full_name,
            specialization
          ),
          visit:visit_id (
            visit_number,
            visit_type,
            chief_complaint
          )
        `)
        .eq("patient_id", patient.id)
        .order("record_date", { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error("Error fetching medical records:", error);
    } finally {
      setLoading(false);
    }
  };

  const getVisitTypeBadge = (type: string) => {
    switch (type) {
      case "rawat_jalan":
        return <Badge className="bg-blue-500/10 text-blue-600">Rawat Jalan</Badge>;
      case "rawat_inap":
        return <Badge className="bg-purple-500/10 text-purple-600">Rawat Inap</Badge>;
      case "igd":
        return <Badge className="bg-red-500/10 text-red-600">IGD</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Belum ada rekam medis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Rekam Medis
            </CardTitle>
            <CardDescription>
              Riwayat pemeriksaan dan diagnosa Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {records.map((record) => (
                  <Card key={record.id} className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">
                              {record.visit?.chief_complaint || "Pemeriksaan"}
                            </p>
                            {record.visit && getVisitTypeBadge(record.visit.visit_type)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(record.record_date), "d MMM yyyy", { locale: id })}
                            </span>
                            {record.doctor && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {record.doctor.full_name}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRecord(record)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Detail
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Record Detail Dialog */}
      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Rekam Medis</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Tanggal</p>
                  <p className="font-medium">
                    {format(new Date(selectedRecord.record_date), "d MMMM yyyy, HH:mm", { locale: id })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Dokter</p>
                  <p className="font-medium">
                    {selectedRecord.doctor?.full_name}
                    {selectedRecord.doctor?.specialization && (
                      <span className="text-muted-foreground"> - {selectedRecord.doctor.specialization}</span>
                    )}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Vital Signs */}
              {(selectedRecord.blood_pressure_systolic || selectedRecord.heart_rate || selectedRecord.temperature) && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Tanda Vital
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedRecord.blood_pressure_systolic && (
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">Tekanan Darah</p>
                        <p className="font-bold text-lg">
                          {selectedRecord.blood_pressure_systolic}/{selectedRecord.blood_pressure_diastolic}
                        </p>
                        <p className="text-xs text-muted-foreground">mmHg</p>
                      </div>
                    )}
                    {selectedRecord.heart_rate && (
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">Detak Jantung</p>
                        <p className="font-bold text-lg">{selectedRecord.heart_rate}</p>
                        <p className="text-xs text-muted-foreground">bpm</p>
                      </div>
                    )}
                    {selectedRecord.temperature && (
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">Suhu</p>
                        <p className="font-bold text-lg">{selectedRecord.temperature}</p>
                        <p className="text-xs text-muted-foreground">°C</p>
                      </div>
                    )}
                    {selectedRecord.oxygen_saturation && (
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">SpO2</p>
                        <p className="font-bold text-lg">{selectedRecord.oxygen_saturation}</p>
                        <p className="text-xs text-muted-foreground">%</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SOAP Notes */}
              <div className="space-y-4">
                {selectedRecord.subjective && (
                  <div>
                    <h4 className="font-semibold text-sm text-primary mb-1">Keluhan (Subjective)</h4>
                    <p className="text-sm bg-muted/50 rounded-lg p-3">{selectedRecord.subjective}</p>
                  </div>
                )}
                {selectedRecord.objective && (
                  <div>
                    <h4 className="font-semibold text-sm text-primary mb-1">Pemeriksaan (Objective)</h4>
                    <p className="text-sm bg-muted/50 rounded-lg p-3">{selectedRecord.objective}</p>
                  </div>
                )}
                {selectedRecord.assessment && (
                  <div>
                    <h4 className="font-semibold text-sm text-primary mb-1">Diagnosa (Assessment)</h4>
                    <p className="text-sm bg-muted/50 rounded-lg p-3">{selectedRecord.assessment}</p>
                  </div>
                )}
                {selectedRecord.plan && (
                  <div>
                    <h4 className="font-semibold text-sm text-primary mb-1">Rencana Terapi (Plan)</h4>
                    <p className="text-sm bg-muted/50 rounded-lg p-3">{selectedRecord.plan}</p>
                  </div>
                )}
              </div>

              {selectedRecord.additional_notes && (
                <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">Catatan Tambahan</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">{selectedRecord.additional_notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

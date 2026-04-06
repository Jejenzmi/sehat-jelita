import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { FileText, Calendar, User, Eye, Activity, Thermometer, Heart } from "lucide-react";
import { getMedicalRecords, type MedicalRecord } from "@/lib/patient-portal-api";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";

export default function PatientMedicalRecords() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => { fetchRecords(); }, []);

  const fetchRecords = async (cursor?: string) => {
    try {
      const json = await getMedicalRecords(cursor);
      if (json.success) {
        if (cursor) {
          setRecords(prev => [...prev, ...json.data]);
        } else {
          setRecords(json.data);
        }
        setNextCursor(json.next_cursor || null);
      }
    } catch {
      toast.error("Gagal memuat rekam medis");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    fetchRecords(nextCursor);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Rekam Medis
          </CardTitle>
          <CardDescription>Riwayat pemeriksaan dan perawatan Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {records.map(record => (
                <Card key={record.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">
                            {record.visits?.visit_number || "Kunjungan"}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {record.visits?.visit_type || "rawat jalan"}
                          </Badge>
                        </div>
                        {record.visits?.chief_complaint && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {record.visits.chief_complaint}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(record.record_date), "d MMM yyyy", { locale: id })}
                          </span>
                          {record.visits?.doctors?.full_name && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {record.visits.doctors.full_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setSelectedRecord(record)}>
                        <Eye className="h-4 w-4 mr-1" />
                        Detail
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {nextCursor && (
              <div className="pt-4 text-center">
                <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? "Memuat..." : "Muat lebih banyak"}
                </Button>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Rekam Medis</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              {/* Header info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Tanggal</p>
                  <p className="font-medium">
                    {format(new Date(selectedRecord.record_date), "d MMMM yyyy", { locale: id })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Dokter</p>
                  <p className="font-medium">{selectedRecord.visits?.doctors?.full_name || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Spesialisasi</p>
                  <p className="font-medium">{selectedRecord.visits?.doctors?.specialization || "Umum"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Jenis Kunjungan</p>
                  <p className="font-medium capitalize">{selectedRecord.visits?.visit_type || "-"}</p>
                </div>
              </div>

              {/* Vital Signs */}
              {(selectedRecord.blood_pressure_systolic || selectedRecord.heart_rate || selectedRecord.temperature) && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Tanda Vital
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      {selectedRecord.blood_pressure_systolic && (
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <Heart className="h-4 w-4 mx-auto mb-1 text-red-500" />
                          <p className="text-xs text-muted-foreground">Tekanan Darah</p>
                          <p className="font-semibold text-sm">
                            {selectedRecord.blood_pressure_systolic}/{selectedRecord.blood_pressure_diastolic} mmHg
                          </p>
                        </div>
                      )}
                      {selectedRecord.heart_rate && (
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <Activity className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                          <p className="text-xs text-muted-foreground">Nadi</p>
                          <p className="font-semibold text-sm">{selectedRecord.heart_rate} bpm</p>
                        </div>
                      )}
                      {selectedRecord.temperature && (
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <Thermometer className="h-4 w-4 mx-auto mb-1 text-orange-500" />
                          <p className="text-xs text-muted-foreground">Suhu</p>
                          <p className="font-semibold text-sm">{selectedRecord.temperature}°C</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* SOAP */}
              {[
                { label: "Keluhan (S)", value: selectedRecord.subjective },
                { label: "Pemeriksaan (O)", value: selectedRecord.objective },
                { label: "Diagnosis (A)", value: selectedRecord.assessment },
                { label: "Rencana (P)", value: selectedRecord.plan },
              ].filter(s => s.value).map(s => (
                <div key={s.label} className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm font-medium mb-1">{s.label}</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{s.value}</p>
                </div>
              ))}

              {selectedRecord.additional_notes && (
                <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3">
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

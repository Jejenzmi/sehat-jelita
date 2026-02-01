import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { 
  User, 
  Calendar, 
  Stethoscope, 
  Users, 
  ClipboardCheck,
  FileText 
} from "lucide-react";
import { useSurgeryData, Surgery, SurgeryTeamMember } from "@/hooks/useSurgeryData";
import { toast } from "sonner";

interface SurgeryDetailDialogProps {
  surgeryId: string;
  open: boolean;
  onClose: () => void;
}

export function SurgeryDetailDialog({ surgeryId, open, onClose }: SurgeryDetailDialogProps) {
  const { surgeries, updateSafetyChecklist } = useSurgeryData();
  const [team, setTeam] = useState<SurgeryTeamMember[]>([]);
  const [checklist, setChecklist] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const surgery = surgeries.find(s => s.id === surgeryId);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      
      // Fetch team
      const { data: teamData } = await supabase
        .from("surgery_teams")
        .select("*")
        .eq("surgery_id", surgeryId);
      
      if (teamData) setTeam(teamData);

      // Fetch checklist
      const { data: checklistData } = await supabase
        .from("surgical_safety_checklists")
        .select("*")
        .eq("surgery_id", surgeryId)
        .single();
      
      if (checklistData) setChecklist(checklistData);

      setLoading(false);
    };

    if (surgeryId && open) {
      fetchDetails();
    }
  }, [surgeryId, open]);

  const handleChecklistUpdate = async (field: string, value: boolean) => {
    const updateData: any = { [field]: value };
    
    // Add timestamp for completion fields
    if (field.endsWith('_completed') && value) {
      updateData[field.replace('_completed', '_time')] = new Date().toISOString();
      updateData[field.replace('_completed', '_by')] = 'Staff'; // In real app, get from auth
    }

    await updateSafetyChecklist.mutateAsync({
      surgeryId,
      ...updateData,
    });

    setChecklist((prev: any) => ({ ...prev, ...updateData }));
  };

  if (!surgery) return null;

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      scheduled: { label: "Terjadwal", variant: "secondary" },
      preparation: { label: "Persiapan", variant: "outline" },
      in_progress: { label: "Berlangsung", variant: "default" },
      completed: { label: "Selesai", variant: "secondary" },
      cancelled: { label: "Dibatalkan", variant: "destructive" },
      postponed: { label: "Ditunda", variant: "outline" },
    };
    const config = statusConfig[status] || { label: status, variant: "secondary" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Detail Operasi - {surgery.surgery_number}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Informasi</TabsTrigger>
            <TabsTrigger value="team">Tim Operasi</TabsTrigger>
            <TabsTrigger value="checklist">Safety Checklist</TabsTrigger>
            <TabsTrigger value="notes">Catatan</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Patient Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Data Pasien
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Nama</p>
                    <p className="font-medium">{surgery.patient?.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">No. RM</p>
                    <p className="font-medium">{surgery.patient?.medical_record_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Jenis Kelamin</p>
                    <p className="font-medium">
                      {surgery.patient?.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Schedule Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Jadwal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Tanggal</p>
                    <p className="font-medium">
                      {format(new Date(surgery.scheduled_date), "EEEE, dd MMMM yyyy", { locale: id })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Waktu</p>
                    <p className="font-medium">
                      {surgery.scheduled_start_time.slice(0, 5)}
                      {surgery.scheduled_end_time && ` - ${surgery.scheduled_end_time.slice(0, 5)}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ruang OK</p>
                    <p className="font-medium">{surgery.operating_room?.name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    {getStatusBadge(surgery.status)}
                  </div>
                </CardContent>
              </Card>

              {/* Procedure Info */}
              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Prosedur & Diagnosis
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Prosedur</p>
                    <p className="font-medium">{surgery.procedure_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Kode ICD-9</p>
                    <p className="font-medium">{surgery.procedure_code || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Diagnosis Pre-Op</p>
                    <p className="font-medium">{surgery.preoperative_diagnosis}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Diagnosis Post-Op</p>
                    <p className="font-medium">{surgery.postoperative_diagnosis || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tipe Anestesi</p>
                    <p className="font-medium">{surgery.anesthesia_type || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Klasifikasi ASA</p>
                    <p className="font-medium">{surgery.asa_classification || "-"}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Tim Operasi
                </CardTitle>
              </CardHeader>
              <CardContent>
                {team.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">
                    Belum ada anggota tim yang ditambahkan
                  </p>
                ) : (
                  <div className="space-y-2">
                    {team.map((member) => (
                      <div key={member.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{member.staff_name}</p>
                          <p className="text-sm text-muted-foreground capitalize">{member.role.replace('_', ' ')}</p>
                        </div>
                        {member.is_primary && <Badge>Primary</Badge>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checklist" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4" />
                  WHO Surgical Safety Checklist
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Sign In */}
                <div>
                  <h4 className="font-semibold mb-3 text-primary">Sign In (Sebelum Induksi)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="patient_identity"
                        checked={checklist?.patient_identity_confirmed || false}
                        onCheckedChange={(checked) => 
                          handleChecklistUpdate('patient_identity_confirmed', !!checked)
                        }
                      />
                      <Label htmlFor="patient_identity">Identitas pasien dikonfirmasi</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="site_marked"
                        checked={checklist?.site_marked || false}
                        onCheckedChange={(checked) => 
                          handleChecklistUpdate('site_marked', !!checked)
                        }
                      />
                      <Label htmlFor="site_marked">Lokasi operasi ditandai</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="consent_confirmed"
                        checked={checklist?.consent_confirmed || false}
                        onCheckedChange={(checked) => 
                          handleChecklistUpdate('consent_confirmed', !!checked)
                        }
                      />
                      <Label htmlFor="consent_confirmed">Informed consent ditandatangani</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="anesthesia_check"
                        checked={checklist?.anesthesia_check_completed || false}
                        onCheckedChange={(checked) => 
                          handleChecklistUpdate('anesthesia_check_completed', !!checked)
                        }
                      />
                      <Label htmlFor="anesthesia_check">Pemeriksaan anestesi selesai</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="pulse_ox"
                        checked={checklist?.pulse_oximeter_functioning || false}
                        onCheckedChange={(checked) => 
                          handleChecklistUpdate('pulse_oximeter_functioning', !!checked)
                        }
                      />
                      <Label htmlFor="pulse_ox">Pulse oximeter berfungsi</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="allergies"
                        checked={checklist?.allergies_known || false}
                        onCheckedChange={(checked) => 
                          handleChecklistUpdate('allergies_known', !!checked)
                        }
                      />
                      <Label htmlFor="allergies">Alergi pasien diketahui</Label>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Button 
                      variant={checklist?.sign_in_completed ? "secondary" : "default"}
                      size="sm"
                      onClick={() => handleChecklistUpdate('sign_in_completed', true)}
                      disabled={checklist?.sign_in_completed}
                    >
                      {checklist?.sign_in_completed ? "Sign In Selesai ✓" : "Selesaikan Sign In"}
                    </Button>
                  </div>
                </div>

                {/* Time Out */}
                <div>
                  <h4 className="font-semibold mb-3 text-primary">Time Out (Sebelum Insisi)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="team_intro"
                        checked={checklist?.team_members_introduced || false}
                        onCheckedChange={(checked) => 
                          handleChecklistUpdate('team_members_introduced', !!checked)
                        }
                      />
                      <Label htmlFor="team_intro">Tim diperkenalkan</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="patient_confirm"
                        checked={checklist?.patient_name_procedure_site_confirmed || false}
                        onCheckedChange={(checked) => 
                          handleChecklistUpdate('patient_name_procedure_site_confirmed', !!checked)
                        }
                      />
                      <Label htmlFor="patient_confirm">Nama, prosedur, lokasi dikonfirmasi</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="antibiotic"
                        checked={checklist?.antibiotic_prophylaxis_given || false}
                        onCheckedChange={(checked) => 
                          handleChecklistUpdate('antibiotic_prophylaxis_given', !!checked)
                        }
                      />
                      <Label htmlFor="antibiotic">Antibiotik profilaksis diberikan</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="imaging"
                        checked={checklist?.essential_imaging_displayed || false}
                        onCheckedChange={(checked) => 
                          handleChecklistUpdate('essential_imaging_displayed', !!checked)
                        }
                      />
                      <Label htmlFor="imaging">Imaging ditampilkan</Label>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Button 
                      variant={checklist?.time_out_completed ? "secondary" : "default"}
                      size="sm"
                      onClick={() => handleChecklistUpdate('time_out_completed', true)}
                      disabled={checklist?.time_out_completed}
                    >
                      {checklist?.time_out_completed ? "Time Out Selesai ✓" : "Selesaikan Time Out"}
                    </Button>
                  </div>
                </div>

                {/* Sign Out */}
                <div>
                  <h4 className="font-semibold mb-3 text-primary">Sign Out (Sebelum Pasien Keluar)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="procedure_recorded"
                        checked={checklist?.procedure_recorded || false}
                        onCheckedChange={(checked) => 
                          handleChecklistUpdate('procedure_recorded', !!checked)
                        }
                      />
                      <Label htmlFor="procedure_recorded">Prosedur dicatat</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="instrument_count"
                        checked={checklist?.instrument_count_correct || false}
                        onCheckedChange={(checked) => 
                          handleChecklistUpdate('instrument_count_correct', !!checked)
                        }
                      />
                      <Label htmlFor="instrument_count">Hitungan instrumen benar</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sponge_count"
                        checked={checklist?.sponge_count_correct || false}
                        onCheckedChange={(checked) => 
                          handleChecklistUpdate('sponge_count_correct', !!checked)
                        }
                      />
                      <Label htmlFor="sponge_count">Hitungan kasa benar</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="specimens"
                        checked={checklist?.specimens_labeled || false}
                        onCheckedChange={(checked) => 
                          handleChecklistUpdate('specimens_labeled', !!checked)
                        }
                      />
                      <Label htmlFor="specimens">Spesimen diberi label</Label>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Button 
                      variant={checklist?.sign_out_completed ? "secondary" : "default"}
                      size="sm"
                      onClick={() => handleChecklistUpdate('sign_out_completed', true)}
                      disabled={checklist?.sign_out_completed}
                    >
                      {checklist?.sign_out_completed ? "Sign Out Selesai ✓" : "Selesaikan Sign Out"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Catatan Pre-Operasi</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{surgery.preoperative_notes || "Tidak ada catatan"}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Catatan Operasi</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{surgery.operative_notes || "Tidak ada catatan"}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Catatan Post-Operasi</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{surgery.postoperative_notes || "Tidak ada catatan"}</p>
                </CardContent>
              </Card>

              {surgery.complications && (
                <Card className="border-destructive">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-destructive">Komplikasi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{surgery.complications}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

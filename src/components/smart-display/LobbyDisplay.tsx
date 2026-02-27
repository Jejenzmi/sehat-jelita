import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQueueData, useCallQueueTicket, useCompleteQueueTicket, useDoctorScheduleData } from "@/hooks/useSmartDisplayData";
import { DisplayHeader } from "./DisplayHeader";
import { RunningText } from "./RunningText";
import { ImageSlideshow } from "./ImageSlideshow";
import { VideoPlayer } from "./VideoPlayer";
import { Volume2, Users, Stethoscope, Phone, Mail, MapPin, PhoneCall, CheckCircle2 } from "lucide-react";

interface LobbyDisplayProps {
  departmentId?: string | null;
  departmentName?: string;
}

function speakAnnouncement(ticketNumber: string, patientName: string, departmentName?: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const poliText = departmentName ? `, silakan menuju ${departmentName}` : "";
  const text = `Nomor antrian ${ticketNumber}, atas nama ${patientName}${poliText}, silakan menuju loket`;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "id-ID";
  utterance.rate = 0.9;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

export function LobbyDisplay({ departmentId, departmentName }: LobbyDisplayProps) {
  const { data: queueData = [] } = useQueueData(departmentId);
  const { data: scheduleData = [] } = useDoctorScheduleData(departmentId);
  const callTicket = useCallQueueTicket();
  const completeTicket = useCompleteQueueTicket();

  const called = queueData.filter((q: any) => q.status === "dipanggil");
  const waiting = queueData.filter((q: any) => q.status === "menunggu");

  const headerSubtitle = departmentName
    ? `Antrian ${departmentName} — Cepat, Tepat, Nyaman & Mudah`
    : "Informasi Antrian Lobby — Cepat, Tepat, Nyaman & Mudah";

  const handleCallNext = useCallback(() => {
    if (waiting.length === 0) return;
    const next: any = waiting[0];
    callTicket.mutate(
      { ticketId: next.id, counterNumber: "1" },
      {
        onSuccess: () => {
          speakAnnouncement(
            next.ticket_number,
            next.patients?.full_name || "Pasien",
            departmentName
          );
        },
      }
    );
  }, [waiting, callTicket, departmentName]);

  const handleRecall = useCallback((ticket: any) => {
    speakAnnouncement(
      ticket.ticket_number,
      ticket.patients?.full_name || "Pasien",
      departmentName
    );
  }, [departmentName]);

  const handleComplete = useCallback((ticketId: string) => {
    completeTicket.mutate(ticketId);
  }, [completeTicket]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0">
        <DisplayHeader title="SIMRS ZEN" subtitle={headerSubtitle} variant="primary" />
        <RunningText />
      </div>

      <div className="grid grid-cols-3 gap-3 mt-3 flex-1 min-h-0">
        <div className="col-span-2 grid grid-rows-[auto_1fr_minmax(120px,25%)] gap-3 min-h-0">
          {/* Currently Called */}
          <Card className="border-2 border-teal-200 dark:border-teal-800 shadow-lg overflow-hidden">
            <CardHeader className="py-2 px-4 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/40">
              <CardTitle className="text-sm flex items-center gap-2 text-teal-700 dark:text-teal-300">
                <Volume2 className="h-4 w-4 animate-pulse" /> Sedang Dipanggil
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="grid grid-cols-2 gap-2">
                {called.map((q: any) => (
                  <div key={q.id} className="flex items-center gap-3 p-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl text-white shadow-md animate-fade-in">
                    <div className="text-2xl font-black tracking-wider">{q.ticket_number}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{q.patients?.full_name || "-"}</p>
                      <p className="text-xs opacity-90">{q.departments?.name || q.service_type || "-"}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-white/20"
                        onClick={() => handleRecall(q)} title="Panggil Ulang">
                        <Volume2 className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-white/20"
                        onClick={() => handleComplete(q.id)} title="Selesai">
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {called.length === 0 && (
                  <p className="text-muted-foreground col-span-2 text-center py-3 text-sm">Belum ada antrian dipanggil</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Waiting Queue */}
          <Card className="shadow-md overflow-hidden flex flex-col min-h-0">
            <CardHeader className="py-2 px-4 flex-shrink-0">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" /> Antrian Menunggu
                <Badge variant="secondary" className="ml-auto text-xs">{waiting.length} pasien</Badge>
                {waiting.length > 0 && (
                  <Button size="sm" className="ml-2 h-7 text-xs gap-1" onClick={handleCallNext}
                    disabled={callTicket.isPending}>
                    <PhoneCall className="h-3.5 w-3.5" /> Panggil Berikutnya
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 overflow-hidden flex-1 min-h-0">
              <div className="grid grid-cols-2 gap-1.5">
                {waiting.slice(0, 6).map((q: any, i: number) => (
                  <div key={q.id} className={`flex items-center gap-2 p-2 rounded-lg ${i < 3 ? "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800" : "bg-muted/50"}`}>
                    <div className={`text-base font-bold w-14 ${i < 3 ? "text-amber-600" : "text-muted-foreground"}`}>{q.ticket_number}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{q.patients?.full_name || "-"}</p>
                      <p className="text-[10px] text-muted-foreground">{q.departments?.name || q.service_type || "-"}</p>
                    </div>
                    <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0"
                      onClick={() => callTicket.mutate({ ticketId: q.id }, {
                        onSuccess: () => speakAnnouncement(q.ticket_number, q.patients?.full_name || "Pasien", departmentName)
                      })} title="Panggil">
                      <PhoneCall className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {waiting.length === 0 && (
                  <p className="text-muted-foreground text-center py-2 col-span-2 text-sm">Belum ada antrian menunggu</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Image Slideshow */}
          <div className="rounded-xl overflow-hidden min-h-0">
            <ImageSlideshow />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="flex flex-col gap-3 min-h-0 overflow-hidden">
          <Card className="shadow-md flex-shrink-0">
            <CardHeader className="py-2 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-teal-600" /> Jadwal Dokter Hari Ini
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="space-y-1.5">
                {scheduleData.slice(0, 5).map((doc: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs truncate">{doc.doctors?.full_name || "-"}</p>
                      <p className="text-[10px] text-muted-foreground">{doc.departments?.name || "-"} • {doc.start_time}-{doc.end_time}</p>
                    </div>
                  </div>
                ))}
                {scheduleData.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">Belum ada jadwal</p>}
              </div>
            </CardContent>
          </Card>

          <div className="flex-1 min-h-0 overflow-hidden">
            <VideoPlayer />
          </div>

          <Card className="bg-muted/50 border-dashed flex-shrink-0">
            <CardContent className="p-2.5 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Hubungi Kami</p>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Phone className="h-3 w-3 shrink-0" />(0271) 637415
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Mail className="h-3 w-3 shrink-0" />info@simrszen.id
              </div>
              <div className="flex items-start gap-2 text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0 mt-0.5" />Jl. Kolonel Sutarto No.132, Surakarta
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

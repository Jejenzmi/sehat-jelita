import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQueueData, useDoctorScheduleData } from "@/hooks/useSmartDisplayData";
import { DisplayHeader } from "./DisplayHeader";
import { RunningText } from "./RunningText";
import { ImageSlideshow } from "./ImageSlideshow";
import { VideoPlayer } from "./VideoPlayer";
import { Volume2, Users, Stethoscope, Phone, Mail, MapPin } from "lucide-react";

export function LobbyDisplay() {
  const { data: queueData = [] } = useQueueData();
  const { data: scheduleData = [] } = useDoctorScheduleData();

  const called = queueData.filter((q: any) => q.status === "dipanggil");
  const waiting = queueData.filter((q: any) => q.status === "menunggu");

  return (
    <div className="flex flex-col h-full">
      <DisplayHeader title="RSUD Dr. Moewardi" subtitle="Informasi Antrian Lobby — Cepat, Tepat, Nyaman & Mudah" variant="primary" />
      <RunningText />

      {/* Top section: Queue + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-3 flex-1 min-h-0">
        {/* Queue columns */}
        <div className="lg:col-span-2 flex flex-col gap-3 min-h-0">
          {/* Currently Called */}
          <Card className="border-2 border-teal-200 dark:border-teal-800 shadow-lg overflow-hidden flex-shrink-0">
            <CardHeader className="py-2 px-4 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/40">
              <CardTitle className="text-sm flex items-center gap-2 text-teal-700 dark:text-teal-300">
                <Volume2 className="h-4 w-4 animate-pulse" /> Sedang Dipanggil
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {called.map((q: any) => (
                  <div key={q.id} className="flex items-center gap-3 p-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl text-white shadow-md animate-fade-in">
                    <div className="text-2xl font-black tracking-wider">{q.ticket_number}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{q.patients?.full_name || q.patient_name || "-"}</p>
                      <p className="text-xs opacity-90">{q.departments?.name || q.service_type || "-"}</p>
                    </div>
                    <Badge className="bg-white/20 text-white border-white/30 text-xs px-2">
                      Loket {q.counter_number || "-"}
                    </Badge>
                  </div>
                ))}
                {called.length === 0 && (
                  <p className="text-muted-foreground col-span-2 text-center py-4 text-sm">Belum ada antrian dipanggil</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Waiting Queue */}
          <Card className="shadow-md flex-1 min-h-0 flex flex-col overflow-hidden">
            <CardHeader className="py-2 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" /> Antrian Menunggu
                <Badge variant="secondary" className="ml-auto text-xs">{waiting.length} pasien</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 overflow-hidden p-3 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {waiting.slice(0, 6).map((q: any, i: number) => (
                  <div key={q.id} className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${i < 3 ? "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800" : "bg-muted/50"}`}>
                    <div className={`text-base font-bold w-14 ${i < 3 ? "text-amber-600" : "text-muted-foreground"}`}>{q.ticket_number}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{q.patients?.full_name || q.patient_name || "-"}</p>
                      <p className="text-[10px] text-muted-foreground">{q.departments?.name || q.service_type || "-"}</p>
                    </div>
                  </div>
                ))}
                {waiting.length === 0 && (
                  <p className="text-muted-foreground text-center py-3 col-span-2 text-sm">Belum ada antrian menunggu</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-3 min-h-0">
          {/* Doctor Schedule */}
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

          {/* Video Player */}
          <div className="flex-1 min-h-0">
            <VideoPlayer />
          </div>

          {/* Hospital Contact */}
          <Card className="bg-muted/50 border-dashed flex-shrink-0">
            <CardContent className="p-2.5 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Hubungi Kami</p>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Phone className="h-3 w-3 shrink-0" />(0271) 637415
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Mail className="h-3 w-3 shrink-0" />rsmoewardi@jatengprov.go.id
              </div>
              <div className="flex items-start gap-2 text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0 mt-0.5" />Jl. Kolonel Sutarto No.132, Surakarta
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom: Image Slideshow - prominent */}
      <div className="flex-shrink-0 h-[28vh] mt-3 rounded-xl overflow-hidden">
        <ImageSlideshow />
      </div>
    </div>
  );
}

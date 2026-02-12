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
    <div className="space-y-4">
      <DisplayHeader title="RSUD Dr. Moewardi" subtitle="Informasi Antrian Lobby — Cepat, Tepat, Nyaman & Mudah" variant="primary" />

      {/* Running Text */}
      <RunningText />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Queue */}
        <div className="lg:col-span-2 space-y-5">
          {/* Currently Called */}
          <Card className="border-2 border-teal-200 dark:border-teal-800 shadow-lg overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/40">
              <CardTitle className="text-base flex items-center gap-2 text-teal-700 dark:text-teal-300">
                <Volume2 className="h-5 w-5 animate-pulse" /> Sedang Dipanggil
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {called.map((q: any) => (
                  <div key={q.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl text-white shadow-md animate-fade-in">
                    <div className="text-4xl font-black tracking-wider">{q.ticket_number}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-lg truncate">{q.patients?.full_name || q.patient_name || "-"}</p>
                      <p className="text-sm opacity-90">{q.departments?.name || q.service_type || "-"}</p>
                    </div>
                    <Badge className="bg-white/20 text-white border-white/30 text-sm px-3">
                      Loket {q.counter_number || "-"}
                    </Badge>
                  </div>
                ))}
                {called.length === 0 && (
                  <p className="text-muted-foreground col-span-2 text-center py-8 text-lg">Belum ada antrian dipanggil</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Waiting Queue */}
          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" /> Antrian Menunggu
                <Badge variant="secondary" className="ml-auto">{waiting.length} pasien</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {waiting.slice(0, 10).map((q: any, i: number) => (
                  <div key={q.id} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${i < 3 ? "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800" : "bg-muted/50"}`}>
                    <div className={`text-xl font-bold w-20 ${i < 3 ? "text-amber-600" : "text-muted-foreground"}`}>{q.ticket_number}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{q.patients?.full_name || q.patient_name || "-"}</p>
                      <p className="text-xs text-muted-foreground">{q.departments?.name || q.service_type || "-"}</p>
                    </div>
                    {i < 3 && <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-600">Segera</Badge>}
                  </div>
                ))}
                {waiting.length === 0 && (
                  <p className="text-muted-foreground text-center py-6 col-span-2">Belum ada antrian menunggu</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Image Slideshow */}
          <ImageSlideshow />
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Doctor Schedule */}
          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-teal-600" /> Jadwal Dokter Hari Ini
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {scheduleData.slice(0, 6).map((doc: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{doc.doctors?.full_name || "-"}</p>
                      <p className="text-[11px] text-muted-foreground">{doc.departments?.name || "-"} • {doc.start_time}-{doc.end_time}</p>
                    </div>
                  </div>
                ))}
                {scheduleData.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Belum ada jadwal</p>}
              </div>
            </CardContent>
          </Card>

          {/* Video Player */}
          <VideoPlayer />

          {/* Hospital Contact */}
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="p-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Hubungi Kami</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Phone className="h-3 w-3 shrink-0" />(0271) 637415
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3 w-3 shrink-0" />rsmoewardi@jatengprov.go.id
              </div>
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0 mt-0.5" />Jl. Kolonel Sutarto No.132, Jebres, Surakarta
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePharmacyQueueData } from "@/hooks/useSmartDisplayData";
import { DisplayHeader } from "./DisplayHeader";
import { Bell, RefreshCw, Clock } from "lucide-react";

export function PharmacyDisplay() {
  const { data: pharmacyData = [] } = usePharmacyQueueData();
  const ready = pharmacyData.filter((q: any) => q.status === "siap");
  const processing = pharmacyData.filter((q: any) => q.status === "diproses" || q.status === "menunggu");

  return (
    <div className="space-y-5">
      <DisplayHeader title="Antrian Farmasi" subtitle="Display Antrian Resep — RSUD Dr. Moewardi" variant="emerald" />

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-0 shadow-sm">
          <CardContent className="pt-3 pb-2 text-center">
            <p className="text-3xl font-black text-emerald-600">{ready.length}</p>
            <p className="text-xs text-muted-foreground">Siap Diambil</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-0 shadow-sm">
          <CardContent className="pt-3 pb-2 text-center">
            <p className="text-3xl font-black text-blue-600">{processing.filter((q: any) => q.status === "diproses").length}</p>
            <p className="text-xs text-muted-foreground">Sedang Diracik</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 dark:bg-amber-950/30 border-0 shadow-sm">
          <CardContent className="pt-3 pb-2 text-center">
            <p className="text-3xl font-black text-amber-600">{processing.filter((q: any) => q.status === "menunggu").length}</p>
            <p className="text-xs text-muted-foreground">Menunggu</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Ready */}
        <Card className="border-2 border-emerald-200 dark:border-emerald-800 shadow-lg">
          <CardHeader className="pb-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40">
            <CardTitle className="text-base text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <Bell className="h-5 w-5 animate-bounce" /> Resep Siap Diambil
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2.5">
            {ready.map((q: any) => (
              <div key={q.id} className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white shadow-md animate-fade-in">
                <div className="text-2xl font-black">{q.prescription_number || q.id?.slice(0, 8)}</div>
                <div className="flex-1">
                  <p className="font-bold">{q.patients?.full_name || "-"}</p>
                </div>
                <Badge className="bg-white/20 text-white border-white/30">SIAP</Badge>
              </div>
            ))}
            {ready.length === 0 && (
              <p className="text-muted-foreground text-center py-8">Belum ada resep siap</p>
            )}
          </CardContent>
        </Card>

        {/* Processing */}
        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin text-blue-500" /> Sedang Diproses
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            {processing.map((q: any) => (
              <div key={q.id} className="flex items-center gap-3 p-3 rounded-xl border bg-muted/30">
                <div className="text-lg font-bold text-muted-foreground">{q.prescription_number || q.id?.slice(0, 8)}</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{q.patients?.full_name || "-"}</p>
                </div>
                <Badge variant={q.status === "diproses" ? "secondary" : "outline"} className="text-[10px]">
                  <Clock className="h-3 w-3 mr-1" />{q.status}
                </Badge>
              </div>
            ))}
            {processing.length === 0 && (
              <p className="text-muted-foreground text-center py-8">Belum ada resep diproses</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

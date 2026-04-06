import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bed, User, Building, Layers, RefreshCw, ChevronUp, ChevronDown,
  Activity, TrendingUp, Clock,
} from "lucide-react";
import { db } from "@/lib/db";

interface BedData {
  id: string;
  bed_number: string;
  status: "available" | "occupied" | "reserved" | "maintenance" | "closed";
  room_id: string;
  room?: {
    room_number: string;
    room_name: string;
    room_class: string;
    floor: string;
    building: string;
    department_id: string;
  };
  current_patient?: {
    full_name: string;
    medical_record_number: string;
    admission_date: string;
  };
}

const statusConfig = {
  available:   { color: "bg-emerald-500", label: "Tersedia", textColor: "text-emerald-700", lightBg: "bg-emerald-50" },
  occupied:    { color: "bg-red-500",     label: "Terisi",   textColor: "text-red-700",     lightBg: "bg-red-50" },
  reserved:    { color: "bg-amber-500",   label: "Dipesan",  textColor: "text-amber-700",   lightBg: "bg-amber-50" },
  maintenance: { color: "bg-gray-500",    label: "Maintenance", textColor: "text-gray-700", lightBg: "bg-gray-50" },
  closed:      { color: "bg-slate-800",   label: "Tutup",    textColor: "text-slate-700",   lightBg: "bg-slate-50" },
};

function BedCard({ bed, onClick }: { bed: BedData; onClick: () => void }) {
  const status = statusConfig[bed.status] || statusConfig.available;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={`relative w-20 h-16 rounded-lg border-2 flex flex-col items-center justify-center gap-0.5 transition-all hover:scale-105 hover:shadow-md ${
            bed.status === "occupied" ? "border-red-300 bg-red-50 dark:bg-red-950/30" :
            bed.status === "available" ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30" :
            bed.status === "reserved" ? "border-amber-300 bg-amber-50 dark:bg-amber-950/30" :
            "border-gray-300 bg-gray-50 dark:bg-gray-900"
          }`}
        >
          <div className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full ${status.color} ${
            bed.status === "occupied" ? "animate-pulse" : ""
          }`} />
          <Bed className={`h-5 w-5 ${status.textColor}`} />
          <span className="text-[10px] font-bold">{bed.bed_number}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <div className="text-xs">
          <p className="font-bold">Bed {bed.bed_number}</p>
          <p>Status: {status.label}</p>
          {bed.current_patient && (
            <>
              <p>Pasien: {bed.current_patient.full_name}</p>
              <p>RM: {bed.current_patient.medical_record_number}</p>
            </>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export default function BedManagement() {
  const [beds, setBeds] = useState<BedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedBed, setSelectedBed] = useState<BedData | null>(null);

  const fetchBeds = async () => {
    setLoading(true);
    try {
      const { data } = await db.from("beds").select("*").order("bed_number", { ascending: true });
      setBeds(data || []);
    } catch (err) {
      console.error("Failed to fetch beds:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBeds(); }, []);

  const stats = useMemo(() => {
    const total = beds.length;
    const occupied = beds.filter(b => b.status === "occupied").length;
    const available = beds.filter(b => b.status === "available").length;
    const reserved = beds.filter(b => b.status === "reserved").length;
    const maintenance = beds.filter(b => b.status === "maintenance").length;
    const bor = total > 0 ? ((occupied / total) * 100).toFixed(1) : "0";
    return { total, occupied, available, reserved, maintenance, bor };
  }, [beds]);

  const floors = useMemo(() => [...new Set(beds.map(b => b.room?.floor).filter(Boolean))].sort(), [beds]);
  const classes = useMemo(() => [...new Set(beds.map(b => b.room?.room_class).filter(Boolean))].sort(), [beds]);

  const filteredBeds = useMemo(() => {
    return beds.filter(b => {
      if (selectedFloor !== "all" && b.room?.floor !== selectedFloor) return false;
      if (selectedClass !== "all" && b.room?.room_class !== selectedClass) return false;
      return true;
    });
  }, [beds, selectedFloor, selectedClass]);

  // Group by room
  const roomGroups = useMemo(() => {
    const groups: Record<string, BedData[]> = {};
    for (const bed of filteredBeds) {
      const roomKey = bed.room?.room_name || bed.room_id || "Lainnya";
      if (!groups[roomKey]) groups[roomKey] = [];
      groups[roomKey].push(bed);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredBeds]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building className="h-8 w-8 text-primary" />
            Bed Management
          </h1>
          <p className="text-muted-foreground">Peta okupansi tempat tidur real-time</p>
        </div>
        <Button variant="outline" onClick={fetchBeds}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total TT</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Bed className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600">Tersedia</p>
                <p className="text-2xl font-bold text-emerald-700">{stats.available}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <Bed className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600">Terisi</p>
                <p className="text-2xl font-bold text-red-700">{stats.occupied}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <User className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600">Dipesan</p>
                <p className="text-2xl font-bold text-amber-700">{stats.reserved}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary">BOR</p>
                <p className="text-2xl font-bold text-primary">{stats.bor}%</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Select value={selectedFloor} onValueChange={setSelectedFloor}>
          <SelectTrigger className="w-48">
            <Layers className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Semua Lantai" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Lantai</SelectItem>
            {floors.map(f => <SelectItem key={f} value={f!}>Lantai {f}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Semua Kelas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kelas</SelectItem>
            {classes.map(c => <SelectItem key={c} value={c!}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex gap-2 ml-auto">
          {Object.entries(statusConfig).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5 text-xs">
              <span className={`w-3 h-3 rounded-full ${cfg.color}`} />
              {cfg.label}
            </div>
          ))}
        </div>
      </div>

      {/* Floor Plan Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roomGroups.map(([roomName, roomBeds]) => (
            <Card key={roomName} className="overflow-hidden">
              <CardHeader className="py-3 px-4 bg-muted/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    {roomName}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="text-xs">
                      {roomBeds.filter(b => b.status === "available").length}/{roomBeds.length}
                    </Badge>
                    {roomBeds[0]?.room?.room_class && (
                      <Badge variant="secondary" className="text-xs">
                        {roomBeds[0].room.room_class}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  {roomBeds.map(bed => (
                    <BedCard key={bed.id} bed={bed} onClick={() => setSelectedBed(bed)} />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          {roomGroups.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Tidak ada data tempat tidur
            </div>
          )}
        </div>
      )}

      {/* Bed Detail Dialog */}
      <Dialog open={!!selectedBed} onOpenChange={() => setSelectedBed(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detail Tempat Tidur {selectedBed?.bed_number}</DialogTitle>
          </DialogHeader>
          {selectedBed && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Ruangan</p>
                  <p className="font-medium">{selectedBed.room?.room_name || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Kelas</p>
                  <p className="font-medium">{selectedBed.room?.room_class || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Lantai</p>
                  <p className="font-medium">{selectedBed.room?.floor || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge className={statusConfig[selectedBed.status]?.color}>
                    {statusConfig[selectedBed.status]?.label}
                  </Badge>
                </div>
              </div>
              {selectedBed.current_patient && (
                <Card className="bg-red-50 dark:bg-red-950/30 border-red-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-semibold">{selectedBed.current_patient.full_name}</p>
                        <p className="text-sm text-muted-foreground">RM: {selectedBed.current_patient.medical_record_number}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

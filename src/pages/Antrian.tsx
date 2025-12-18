import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, ChevronRight, Volume2, Pause, Play, SkipForward, RefreshCw, Monitor } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Sample data for demo
const departments = [
  { id: "poli-umum", name: "Poli Umum", code: "A" },
  { id: "poli-gigi", name: "Poli Gigi", code: "B" },
  { id: "poli-anak", name: "Poli Anak", code: "C" },
  { id: "farmasi", name: "Farmasi", code: "F" },
  { id: "kasir", name: "Kasir", code: "K" },
];

const initialQueue = [
  { number: 1, patient: "Ahmad Sulaiman", status: "selesai", calledAt: "08:15" },
  { number: 2, patient: "Siti Rahmah", status: "selesai", calledAt: "08:32" },
  { number: 3, patient: "Bambang Hermanto", status: "dilayani", calledAt: "08:45" },
  { number: 4, patient: "Dewi Lestari", status: "menunggu", calledAt: null },
  { number: 5, patient: "Eko Prasetyo", status: "menunggu", calledAt: null },
  { number: 6, patient: "Fitri Handayani", status: "menunggu", calledAt: null },
];

export default function Antrian() {
  const [selectedDept, setSelectedDept] = useState(departments[0]);
  const [currentNumber, setCurrentNumber] = useState(3);
  const [queue, setQueue] = useState(initialQueue);
  const [isPaused, setIsPaused] = useState(false);
  const [isDisplayMode, setIsDisplayMode] = useState(false);
  const { toast } = useToast();

  // Real-time subscription for queue updates
  useEffect(() => {
    const channel = supabase
      .channel("queue-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_display",
        },
        (payload) => {
          console.log("Queue update:", payload);
          // Handle real-time updates
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const callNext = () => {
    const nextInQueue = queue.find(q => q.status === "menunggu");
    if (nextInQueue) {
      // Update current serving to completed
      setQueue(prev => prev.map(q => 
        q.number === currentNumber ? { ...q, status: "selesai" } : q
      ));
      
      // Call next number
      setCurrentNumber(nextInQueue.number);
      setQueue(prev => prev.map(q => 
        q.number === nextInQueue.number 
          ? { ...q, status: "dilayani", calledAt: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) } 
          : q
      ));

      // Announce
      speakNumber(nextInQueue.number);
      
      toast({
        title: "Nomor Antrian Dipanggil",
        description: `Nomor ${selectedDept.code}${nextInQueue.number.toString().padStart(3, "0")} - ${nextInQueue.patient}`,
      });
    }
  };

  const recallCurrent = () => {
    speakNumber(currentNumber);
    toast({
      title: "Memanggil Ulang",
      description: `Nomor ${selectedDept.code}${currentNumber.toString().padStart(3, "0")}`,
    });
  };

  const skipCurrent = () => {
    setQueue(prev => prev.map(q => 
      q.number === currentNumber ? { ...q, status: "skip" } : q
    ));
    callNext();
  };

  const speakNumber = (number: number) => {
    const text = `Nomor antrian ${selectedDept.code} ${number}, silakan menuju ${selectedDept.name}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "id-ID";
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  };

  const waitingCount = queue.filter(q => q.status === "menunggu").length;
  const servedCount = queue.filter(q => q.status === "selesai").length;

  if (isDisplayMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 to-primary/5 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Sistem Antrian</h1>
            <p className="text-xl text-muted-foreground">{selectedDept.name}</p>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {/* Current Number - Large Display */}
            <div className="col-span-2">
              <Card className="h-full">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl">NOMOR ANTRIAN</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="text-[12rem] font-bold leading-none text-primary animate-pulse">
                    {selectedDept.code}{currentNumber.toString().padStart(3, "0")}
                  </div>
                  <p className="text-3xl mt-4 text-muted-foreground">
                    Silakan Menuju {selectedDept.name}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Next Numbers */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Antrian Berikutnya</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {queue
                      .filter(q => q.status === "menunggu")
                      .slice(0, 5)
                      .map((q, idx) => (
                        <div 
                          key={q.number} 
                          className={`p-3 rounded-lg text-center ${idx === 0 ? "bg-primary/10 text-primary font-bold" : "bg-muted"}`}
                        >
                          {selectedDept.code}{q.number.toString().padStart(3, "0")}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-4xl font-bold text-primary">{waitingCount}</p>
                      <p className="text-sm text-muted-foreground">Menunggu</p>
                    </div>
                    <div>
                      <p className="text-4xl font-bold text-green-600">{servedCount}</p>
                      <p className="text-sm text-muted-foreground">Selesai</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setIsDisplayMode(false)}
              >
                Kembali ke Panel
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sistem Antrian</h1>
          <p className="text-muted-foreground">Kelola antrian pasien secara real-time</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedDept.id} onValueChange={(v) => setSelectedDept(departments.find(d => d.id === v) || departments[0])}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {departments.map(dept => (
                <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setIsDisplayMode(true)}>
            <Monitor className="w-4 h-4 mr-2" />
            Mode Display
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sedang Dilayani</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              {selectedDept.code}{currentNumber.toString().padStart(3, "0")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Menunggu</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{waitingCount}</div>
            <p className="text-xs text-muted-foreground">pasien</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sudah Dilayani</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{servedCount}</div>
            <p className="text-xs text-muted-foreground">pasien</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={isPaused ? "bg-yellow-500" : "bg-green-500"}>
              {isPaused ? "Dijeda" : "Aktif"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Panel Kontrol</CardTitle>
          <CardDescription>Kelola pemanggilan antrian</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button size="lg" onClick={callNext} disabled={isPaused || waitingCount === 0}>
              <ChevronRight className="w-5 h-5 mr-2" />
              Panggil Berikutnya
            </Button>
            <Button size="lg" variant="outline" onClick={recallCurrent}>
              <Volume2 className="w-5 h-5 mr-2" />
              Panggil Ulang
            </Button>
            <Button size="lg" variant="outline" onClick={skipCurrent}>
              <SkipForward className="w-5 h-5 mr-2" />
              Lewati
            </Button>
            <Button 
              size="lg" 
              variant={isPaused ? "default" : "secondary"}
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? <Play className="w-5 h-5 mr-2" /> : <Pause className="w-5 h-5 mr-2" />}
              {isPaused ? "Lanjutkan" : "Jeda"}
            </Button>
            <Button size="lg" variant="ghost">
              <RefreshCw className="w-5 h-5 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Queue List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Antrian - {selectedDept.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Antrian</TableHead>
                <TableHead>Nama Pasien</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Waktu Panggil</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.map((item) => (
                <TableRow key={item.number} className={item.number === currentNumber ? "bg-primary/5" : ""}>
                  <TableCell className="font-bold text-lg">
                    {selectedDept.code}{item.number.toString().padStart(3, "0")}
                  </TableCell>
                  <TableCell>{item.patient}</TableCell>
                  <TableCell>
                    {item.status === "menunggu" && <Badge variant="secondary">Menunggu</Badge>}
                    {item.status === "dilayani" && <Badge className="bg-blue-500">Dilayani</Badge>}
                    {item.status === "selesai" && <Badge className="bg-green-500">Selesai</Badge>}
                    {item.status === "skip" && <Badge variant="destructive">Dilewati</Badge>}
                  </TableCell>
                  <TableCell>{item.calledAt || "-"}</TableCell>
                  <TableCell>
                    {item.status === "menunggu" && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          setCurrentNumber(item.number);
                          setQueue(prev => prev.map(q => 
                            q.number === item.number 
                              ? { ...q, status: "dilayani", calledAt: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) } 
                              : q
                          ));
                          speakNumber(item.number);
                        }}
                      >
                        <Volume2 className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

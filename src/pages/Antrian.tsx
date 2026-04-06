import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, ChevronRight, Volume2, Pause, Play, SkipForward, RefreshCw, Monitor } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const FETCH_OPTS: RequestInit = { credentials: 'include', headers: { 'Content-Type': 'application/json' } };
async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, FETCH_OPTS);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return (json.data ?? json) as T;
}
async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { ...FETCH_OPTS, method: 'PATCH', body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return (json.data ?? json) as T;
}

interface Department {
  id: string;
  department_name: string;
  department_code: string;
}

interface QueueTicket {
  id: string;
  ticket_number: string;
  patient_id: string | null;
  visit_id: string | null;
  department_id: string | null;
  doctor_id: string | null;
  service_type: string;
  queue_date: string;
  called_at: string | null;
  served_at: string | null;
  completed_at: string | null;
  counter_number: string | null;
  status: string;
  priority: number;
  notes: string | null;
  patients?: {
    full_name: string;
    medical_record_number: string;
  } | null;
}

export default function Antrian() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedServiceType, setSelectedServiceType] = useState<string>("rawat_jalan");
  const [isPaused, setIsPaused] = useState(false);
  const [isDisplayMode, setIsDisplayMode] = useState(false);

  // Fetch departments
  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: () => apiFetch<Department[]>('/admin/departments?is_active=true'),
  });

  // Fetch queue tickets for today (poll every 10s instead of realtime)
  const { data: queueTickets = [], isLoading } = useQuery({
    queryKey: ["queue-tickets", selectedServiceType, selectedDeptId],
    queryFn: () => {
      const p = new URLSearchParams({ visit_type: selectedServiceType });
      if (selectedDeptId) p.set('department_id', selectedDeptId);
      return apiFetch<QueueTicket[]>(`/queue/today?${p}`);
    },
    refetchInterval: 10_000,
  });

  // Update queue status mutation
  const updateQueueStatus = useMutation({
    mutationFn: ({ ticketId, status, calledAt, servedAt, completedAt }: {
      ticketId: string;
      status: string;
      calledAt?: string;
      servedAt?: string;
      completedAt?: string;
    }) => apiPatch(`/queue/${ticketId}/status`, {
      status,
      called_at: calledAt,
      served_at: servedAt,
      completed_at: completedAt,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue-tickets"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const currentServing = queueTickets.find(t => t.status === "serving");
  const waitingQueue = queueTickets.filter(t => t.status === "waiting");
  const completedQueue = queueTickets.filter(t => t.status === "completed");
  const calledQueue = queueTickets.filter(t => t.status === "called");

  const callNext = () => {
    const nextTicket = waitingQueue[0];
    if (!nextTicket) return;

    // If there's a current serving, mark as completed
    if (currentServing) {
      updateQueueStatus.mutate({
        ticketId: currentServing.id,
        status: "completed",
        completedAt: new Date().toISOString(),
      });
    }

    // Call the next ticket
    updateQueueStatus.mutate({
      ticketId: nextTicket.id,
      status: "serving",
      calledAt: new Date().toISOString(),
      servedAt: new Date().toISOString(),
    });

    speakNumber(nextTicket.ticket_number);
    
    toast({
      title: "Nomor Antrian Dipanggil",
      description: `Nomor ${nextTicket.ticket_number} - ${nextTicket.patients?.full_name || "Pasien"}`,
    });
  };

  const recallCurrent = () => {
    if (currentServing) {
      speakNumber(currentServing.ticket_number);
      toast({
        title: "Memanggil Ulang",
        description: `Nomor ${currentServing.ticket_number}`,
      });
    }
  };

  const skipCurrent = () => {
    if (currentServing) {
      updateQueueStatus.mutate({
        ticketId: currentServing.id,
        status: "skipped",
      });
      callNext();
    }
  };

  const callSpecific = (ticket: QueueTicket) => {
    // If there's a current serving, mark as completed
    if (currentServing) {
      updateQueueStatus.mutate({
        ticketId: currentServing.id,
        status: "completed",
        completedAt: new Date().toISOString(),
      });
    }

    updateQueueStatus.mutate({
      ticketId: ticket.id,
      status: "serving",
      calledAt: new Date().toISOString(),
      servedAt: new Date().toISOString(),
    });

    speakNumber(ticket.ticket_number);
  };

  const speakNumber = (ticketNumber: string) => {
    const serviceNames: Record<string, string> = {
      rawat_jalan: "Poli Rawat Jalan",
      farmasi: "Farmasi",
      laboratorium: "Laboratorium",
      radiologi: "Radiologi",
      kasir: "Kasir",
    };
    const serviceName = serviceNames[selectedServiceType] || selectedServiceType;
    const text = `Nomor antrian ${ticketNumber}, silakan menuju ${serviceName}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "id-ID";
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "waiting":
        return <Badge variant="secondary">Menunggu</Badge>;
      case "called":
        return <Badge className="bg-yellow-500">Dipanggil</Badge>;
      case "serving":
        return <Badge className="bg-blue-500">Dilayani</Badge>;
      case "completed":
        return <Badge className="bg-green-500">Selesai</Badge>;
      case "skipped":
        return <Badge variant="destructive">Dilewati</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Display mode view
  if (isDisplayMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 to-primary/5 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Sistem Antrian</h1>
            <p className="text-xl text-muted-foreground">
              {selectedServiceType === "rawat_jalan" ? "Rawat Jalan" :
               selectedServiceType === "farmasi" ? "Farmasi" :
               selectedServiceType === "laboratorium" ? "Laboratorium" :
               selectedServiceType === "radiologi" ? "Radiologi" : "Kasir"}
            </p>
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
                    {currentServing?.ticket_number || "---"}
                  </div>
                  <p className="text-3xl mt-4 text-muted-foreground">
                    {currentServing?.patients?.full_name || "Silakan Menunggu"}
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
                    {waitingQueue.slice(0, 5).map((ticket, idx) => (
                      <div 
                        key={ticket.id} 
                        className={`p-3 rounded-lg text-center ${idx === 0 ? "bg-primary/10 text-primary font-bold" : "bg-muted"}`}
                      >
                        {ticket.ticket_number}
                      </div>
                    ))}
                    {waitingQueue.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">Tidak ada antrian</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-4xl font-bold text-primary">{waitingQueue.length}</p>
                      <p className="text-sm text-muted-foreground">Menunggu</p>
                    </div>
                    <div>
                      <p className="text-4xl font-bold text-green-600">{completedQueue.length}</p>
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
          <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rawat_jalan">Rawat Jalan</SelectItem>
              <SelectItem value="farmasi">Farmasi</SelectItem>
              <SelectItem value="laboratorium">Laboratorium</SelectItem>
              <SelectItem value="radiologi">Radiologi</SelectItem>
              <SelectItem value="kasir">Kasir</SelectItem>
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
              {currentServing?.ticket_number || "---"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {currentServing?.patients?.full_name || "Tidak ada"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Menunggu</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{waitingQueue.length}</div>
            <p className="text-xs text-muted-foreground">pasien</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sudah Dilayani</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedQueue.length}</div>
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
            <Button size="lg" onClick={callNext} disabled={isPaused || waitingQueue.length === 0}>
              <ChevronRight className="w-5 h-5 mr-2" />
              Panggil Berikutnya
            </Button>
            <Button size="lg" variant="outline" onClick={recallCurrent} disabled={!currentServing}>
              <Volume2 className="w-5 h-5 mr-2" />
              Panggil Ulang
            </Button>
            <Button size="lg" variant="outline" onClick={skipCurrent} disabled={!currentServing}>
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
            <Button 
              size="lg" 
              variant="ghost"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["queue-tickets"] })}
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Queue List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Antrian Hari Ini</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
          ) : queueTickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Tidak ada antrian hari ini</div>
          ) : (
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
                {queueTickets.map((ticket) => (
                  <TableRow 
                    key={ticket.id} 
                    className={ticket.status === "serving" ? "bg-primary/5" : ""}
                  >
                    <TableCell className="font-bold text-lg">{ticket.ticket_number}</TableCell>
                    <TableCell>{ticket.patients?.full_name || "Pasien"}</TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell>
                      {ticket.called_at 
                        ? new Date(ticket.called_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                        : "-"
                      }
                    </TableCell>
                    <TableCell>
                      {ticket.status === "waiting" && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => callSpecific(ticket)}
                        >
                          <Volume2 className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
